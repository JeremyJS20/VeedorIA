# UI Inventory — reuse before you build

The project's shared components are listed in `docs/ui-inventory.md` (path in `.sdd-config.json` → `ui_inventory`). Earlier features already solved tables, filters, shells, modals and charts; a new screen must use them, not re-implement them.

## ⚠️ REQUIRE: before writing or changing any screen

1. Read the inventory. If the file does not exist and the project has components → run `python3 sdd-scripts/ui-inventory-scan.py --write`, fill every `TODO` (Use when, Replaces) and show it to the user.
2. For each piece of UI the task needs (table, filter bar, shell, modal, chart, form layout…), pick the inventory component that covers it. Reuse it as it is; extend it (new prop) rather than copying it.
3. Colors, spacing and fonts come from the active theme tokens (`design-system-base.md`), never literals.
4. In the task plan shown for approval, list `Reuses:` (components from the inventory) and `New components:` (with one line of why no existing one fits). Do not start coding a new component the user has not seen in the plan.

## Keeping it true

- Created a component other screens will use → add its entry in the same task (Path, Use when, `Replaces`).
- Changed a component's path → update `Path`. `validate-ui.py` warns about entries pointing at missing paths.
- `Replaces` is the text that must not be hand-written elsewhere (`<table`, `DataTable(`, `mat-table`, `<dialog`). `Allowed` lists the exceptions (for example a chart's accessible table). Do not widen `Allowed` to silence a violation: reuse the component or ask the user.

## Check

Run `python3 sdd-scripts/validate-ui.py --only reuse --strict` before reporting a UI task as done. Zero violations required; an intentional exception goes in `Allowed` with the user's OK.

## Entry format

```
## DataTable
- Path: src/components/DataTable.tsx
- Use when: any list or table of records, with sorting and an empty state
- Replaces: `<table`
- Allowed: src/components/charts/*
```
