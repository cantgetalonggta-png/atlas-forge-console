# Skill: API key vault UI patterns

Source: ApiKeysPanel.test.jsx (Hugging Face multi-source keys)

## Patterns
- Sources: app / env / cli
- Show masked values only (hf_…abc)
- whoami validation against provider
- Active source selection without exposing full secret
- Vitest + testing-library coverage

## Atlas Forge mapping
- Connectors page documents OAuth / tokens
- Never persist raw keys in localStorage
- Server functions may use process env only
