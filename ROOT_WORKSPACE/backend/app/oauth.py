"""OAuth / OAuth2 abstraction layers (GitHub). Secrets only from env."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

from .config import settings


def github_authorize_url(redirect_uri: str, state: str, scope: str = "read:user repo") -> dict[str, Any]:
    if not settings.oauth_github_client_id:
        return {
            "ok": False,
            "error": "OAUTH_GITHUB_CLIENT_ID not configured",
            "hint": "Set oauth_github_client_id in environment for browser OAuth.",
        }
    params = {
        "client_id": settings.oauth_github_client_id,
        "redirect_uri": redirect_uri,
        "scope": scope,
        "state": state,
    }
    return {
        "ok": True,
        "url": f"https://github.com/login/oauth/authorize?{urlencode(params)}",
    }


def oauth_status() -> dict[str, Any]:
    return {
        "github": {
            "clientIdConfigured": bool(settings.oauth_github_client_id),
            "clientSecretConfigured": bool(settings.oauth_github_client_secret),
            "mode": "authorization_code",
        },
        "vercel": {"tokenConfigured": bool(settings.vercel_token)},
        "huggingface": {"tokenConfigured": bool(settings.hf_token)},
        "allowlist": settings.allowlist_hosts.split(","),
    }
