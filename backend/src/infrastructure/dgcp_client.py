import asyncio
import logging
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any

import httpx

from src.config import settings

logger = logging.getLogger("veedoria.infrastructure.dgcp_client")


@dataclass
class DGCPResponse:
    data: list[dict[str, Any]]
    page: int
    limit: int
    pages: int
    total_results: int


class DGCPClientError(Exception):
    pass


class DGCPClient:
    def __init__(self) -> None:
        self.base_url = settings.dgcp_api_base_url
        self._client: httpx.AsyncClient | None = None
        self._request_count = 0
        self._last_request_time = 0.0

    async def __aenter__(self) -> "DGCPClient":
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=settings.dgcp_request_timeout,
            headers={"User-Agent": "VeedorIA/1.0"},
        )
        return self

    async def __aexit__(self, *args: Any) -> None:
        if self._client:
            await self._client.aclose()

    async def _rate_limit(self) -> None:
        now = asyncio.get_running_loop().time()
        elapsed = now - self._last_request_time
        min_interval = 1.0 / settings.sync_rate_limit
        if elapsed < min_interval:
            await asyncio.sleep(min_interval - elapsed)
        self._last_request_time = asyncio.get_running_loop().time()
        self._request_count += 1

    async def _request(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self._client:
            raise DGCPClientError("Client not initialized. Use async with.")
        await self._rate_limit()
        url = f"{self.base_url}{path}"
        for attempt in range(settings.dgcp_max_retries):
            try:
                response = await self._client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                if data.get("hasError"):
                    raise DGCPClientError(f"DGCP API error: {data.get('payload', {}).get('message', 'Unknown')}")
                return data
            except httpx.HTTPStatusError as e:
                if e.response.status_code >= 500 and attempt < settings.dgcp_max_retries - 1:
                    wait = settings.dgcp_retry_base_delay * (2 ** attempt)
                    logger.warning("DGCP retry %d/%d after %.1fs: %s", attempt + 1, settings.dgcp_max_retries, wait, e)
                    await asyncio.sleep(wait)
                else:
                    raise DGCPClientError(f"DGCP HTTP {e.response.status_code}: {e}") from e
            except (httpx.TimeoutException, httpx.NetworkError) as e:
                if attempt < settings.dgcp_max_retries - 1:
                    wait = settings.dgcp_retry_base_delay * (2 ** attempt)
                    logger.warning("DGCP retry %d/%d after %.1fs (network): %s", attempt + 1, settings.dgcp_max_retries, wait, e)
                    await asyncio.sleep(wait)
                else:
                    raise DGCPClientError(f"DGCP network error: {e}") from e

    def _extract_payload(self, raw: dict[str, Any]) -> DGCPResponse | None:
        payload = raw.get("payload", {})
        content = payload.get("content")
        if content is None:
            return None
        return DGCPResponse(
            data=content,
            page=raw.get("page", 1),
            limit=raw.get("limit", 100),
            pages=raw.get("pages", 0),
            total_results=raw.get("totalResults", 0),
        )

    async def fetch_all_paginated(self, path: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        params = dict(params or {})
        params.setdefault("limit", 1000)
        page = 1
        all_data: list[dict[str, Any]] = []
        while True:
            params["page"] = page
            raw = await self._request(path, params)
            result = self._extract_payload(raw)
            if result is None:
                logger.warning("Empty response at page %d for %s", page, path)
                break
            all_data.extend(result.data)
            logger.info("Fetched page %d/%d: %d records", result.page, result.pages, len(result.data))
            if page >= result.pages:
                break
            page += 1
        return all_data

    async def fetch_institutions(self) -> list[dict[str, Any]]:
        return await self.fetch_all_paginated("/unidades_compra")

    async def fetch_processes(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        institution_id: str | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {}
        if start_date:
            params["startdate"] = start_date.isoformat()
        if end_date:
            params["enddate"] = end_date.isoformat()
        if institution_id:
            params["unidad_compra"] = institution_id
        return await self.fetch_all_paginated("/procesos", params)

    async def fetch_contracts(self, process_code: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, Any] = {}
        if process_code:
            params["proceso"] = process_code
        return await self.fetch_all_paginated("/contratos", params)

    async def fetch_contract_items(self, process_code: str, contract_id: str) -> list[dict[str, Any]]:
        params = {"proceso": process_code, "contrato": contract_id}
        return await self.fetch_all_paginated("/contratos/articulos", params)

    async def fetch_suppliers(self, rnc: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, Any] = {}
        if rnc:
            params["numero_documento"] = rnc
        return await self.fetch_all_paginated("/proveedores", params)

    async def fetch_ocds_releases(self, start_date: date, end_date: date) -> list[dict[str, Any]]:
        params = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "limit": 1000,
        }
        return await self.fetch_all_paginated("/ocds/releases/all", params)
