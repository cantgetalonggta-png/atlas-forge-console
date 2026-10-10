# Skill: Research & data API registry (defensive)

Source: Research & Data-API BUILD (patterns only)

## Categories (integrate via allowlisted public APIs)
- Web fetch / search providers (operator-chosen)
- Academic / open data portals
- Hugging Face model cards (already wired)
- GitHub public metadata (already wired)
- Docker Hub (already wired)

## Universal call pattern
Authorization Bearer from env; never embed keys in client bundles.

## OpenAI tool-calling pattern
Register tools with JSON schema; agent loop executes allowlisted tools only.

## Out of scope
Scrapers designed to harvest third-party leaked API keys.
