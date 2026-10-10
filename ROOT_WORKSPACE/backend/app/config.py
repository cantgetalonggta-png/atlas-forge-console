from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Atlas Forge API"
    environment: str = "production"
    cors_origins: str = "https://atlas-forge-console.vercel.app,http://localhost:8080,http://localhost:3000"
    github_token: str | None = None
    allowlist_hosts: str = "api.github.com,huggingface.co,hub.docker.com,anet.sh"
    oauth_github_client_id: str | None = None
    oauth_github_client_secret: str | None = None
    vercel_token: str | None = None
    hf_token: str | None = None

    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
