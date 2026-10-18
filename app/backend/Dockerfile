FROM python:3.12-slim AS builder

WORKDIR /app
RUN pip install poetry --no-cache-dir

COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-root --no-interaction --no-ansi

FROM python:3.12-slim

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY src/ src/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.presentation.main:app", "--host", "0.0.0.0", "--port", "8000"]
