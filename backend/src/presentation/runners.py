import asyncio
import logging
import sys
from asyncio.subprocess import Process

logger = logging.getLogger("veedoria.presentation.runners")

_ACTIVE_TASKS: dict[str, int] = {}


async def _consume(proc: Process, name: str) -> None:
    async def _read(stream: asyncio.StreamReader, log_func):
        while True:
            line = await stream.readline()
            if not line:
                break
            log_func("%s | %s", name, line.decode().rstrip())

    await asyncio.gather(
        _read(proc.stdout, logger.info),
        _read(proc.stderr, logger.warning),
    )
    await proc.wait()
    exit_code = proc.returncode or 0
    _ACTIVE_TASKS.pop(name, None)
    logger.info("Runner '%s' exited with code %d", name, exit_code)


async def _launch(script_module: str, name: str, *args: str) -> int:
    proc = await asyncio.create_subprocess_exec(
        sys.executable, "-m", script_module, *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _ACTIVE_TASKS[name] = proc.pid
    asyncio.create_task(_consume(proc, name))
    return proc.pid


def is_running(name: str) -> bool:
    return name in _ACTIVE_TASKS


async def run_detection() -> int:
    if is_running("detect_anomalies"):
        raise RuntimeError("La detección de anomalías ya está en ejecución")
    return await _launch("src.cli.detect_anomalies", "detect_anomalies")


async def run_sync(full: bool = False, **kwargs) -> int:
    tag = "sync_dgcp"
    if is_running(tag):
        raise RuntimeError("La sincronización ya está en ejecución")
    args = []
    if full:
        args.append("--full")
    for key, val in kwargs.items():
        if val:
            flag = "--" + key.replace("_", "-")
            if isinstance(val, bool):
                args.append(flag)
            else:
                args.append(flag)
                args.append(str(val))
    return await _launch("src.cli.sync_dgcp", tag, *args)
