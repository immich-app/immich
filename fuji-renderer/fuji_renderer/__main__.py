"""Run the internal renderer with exactly one worker."""

import uvicorn


if __name__ == "__main__":
    uvicorn.run(
        "fuji_renderer.app:app",
        host="0.0.0.0",
        port=8000,
        workers=1,
        access_log=False,
    )
