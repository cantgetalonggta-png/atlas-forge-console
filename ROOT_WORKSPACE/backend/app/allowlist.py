from urllib.parse import urlparse

from .config import settings


def host_allowed(url: str) -> bool:
    host = urlparse(url).hostname or ""
    allowed = {h.strip().lower() for h in settings.allowlist_hosts.split(",") if h.strip()}
    return host.lower() in allowed
