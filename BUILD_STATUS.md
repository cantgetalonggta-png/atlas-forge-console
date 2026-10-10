# Atlas Forge — Cycle 3 (Drive API pack)

## Source
https://drive.google.com/drive/folders/1xtF7i4XWfsPH36xgp7pS46yvi2AGpmlb

## Production
https://atlas-forge-console.vercel.app

## Distilled (defensive only)
- Skills: api-deployment-checklist, secret-hygiene, api-key-vault-ui, research-api-registry
- Expanded secret scanners FE+BE (sk-, ghp_, AIza, AKIA, slack, PEM)
- Vault project + advisories (rotate exposed Drive paste keys)
- Catalog: ROOT_WORKSPACE/source-mirror/drive-api-pack/

## Not implemented
- Offensive credential harvesters
- Embedding live secrets from Drive into git

## Operator action
Rotate any OpenAI/Firebase credentials that appeared in Drive paste files.
