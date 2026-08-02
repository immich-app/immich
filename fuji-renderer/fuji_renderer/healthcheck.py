"""Dependency-free container health check."""

from urllib.request import urlopen


def main() -> None:
    with urlopen("http://127.0.0.1:8000/ping", timeout=5) as response:
        if response.status != 200:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
