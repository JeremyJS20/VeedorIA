import uvicorn


def main() -> None:
    uvicorn.run(
        "src.presentation.main:app",
        port=3001,
        app_dir="src",
        reload=True,
        reload_excludes=["*.pyc"],
        log_level="info",
    )
