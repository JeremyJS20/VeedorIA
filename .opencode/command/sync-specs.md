---
description: Sincroniza skills SDD, regenera MCP config, y refresca estructura del proyecto.
agent: build
---

Ejecuta el script de sincronización SDD con los flags proporcionados.

## Usage

- `sync` → `bash sdd-sync.sh`
- `sync --refresh` → regenera MCP config (permiso automático)
- `sync --role developer --force` → cambia de rol
- `sync --force` → actualización completa de estándares
- `sync --check` → validación CI

## Rules

1. NO ejecutar `sdd-sync.sh` sin flags a menos que el usuario lo solicite explícitamente.
2. `--force` solo si el usuario dice explícitamente "dale", "sí", "procede".
3. `--refresh` y `--check` pueden ejecutarse sin pregunta.
4. Esperar a que el comando termine completamente. NO interrumpir.
