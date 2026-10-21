#!/usr/bin/env python3
"""ui-inventory-scan.py — draft docs/ui-inventory.md from the components a project already has.

Stack-agnostic: looks for folders named like component folders (components, widgets, shared, ui, partials,
Views/Shared) and lists their files as inventory entries with `Use when` and `Replaces` marked TODO.
The agent (project-scanner / implementer) fills the TODOs; entries with `Replaces: TODO` are not enforced.

Usage:
    python ui-inventory-scan.py [--root .] [--write]    (default: print the draft)
"""

import argparse
import json
import os
import re
import sys

COMPONENT_DIRS = {'components', 'component', 'widgets', 'shared', 'ui', 'partials', 'atoms', 'molecules', 'organisms'}
COMPONENT_EXT = ('.tsx', '.jsx', '.vue', '.svelte', '.astro', '.dart', '.razor', '.cshtml', '.component.ts')
SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'bin', 'obj', '.dart_tool',
             '.sdd-cache', '.opencode', '.agents', '.claude', '.kiro', 'test', 'tests', '__tests__', 'e2e'}
SKIP_FILE = re.compile(r'(\.|_)(test|spec|stories)\.[a-z]+$|^index\.[a-z]+$|^page\.tsx$|^layout\.tsx$', re.IGNORECASE)
DEFAULT_INVENTORY = 'docs/ui-inventory.md'

HEADER = """# UI inventory

Shared components of this project. Read it BEFORE building any screen; reuse what is here and add an entry
when you create a component that other screens will use. `validate-ui.py` fails when a `Replaces` pattern
appears outside `Path` and `Allowed`.

Entry format (one `## Name` per component):
- Path: file or folder that owns the component
- Use when: one line on when to use it
- Replaces: `literal text` (or `re:regex`) that must NOT be written by hand elsewhere
- Allowed: optional extra globs where that text is fine
"""


def component_name(filename):
    base = filename
    for ext in sorted(COMPONENT_EXT, key=len, reverse=True):
        if base.endswith(ext):
            base = base[: -len(ext)]
            break
    return base


def scan(root):
    found = []
    for dirpath, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        if os.path.basename(dirpath).lower() not in COMPONENT_DIRS and not any(
            part.lower() in COMPONENT_DIRS for part in os.path.relpath(dirpath, root).split(os.sep)
        ):
            continue
        for name in sorted(names):
            if name.endswith(COMPONENT_EXT) and not SKIP_FILE.search(name):
                rel = os.path.relpath(os.path.join(dirpath, name), root).replace(os.sep, '/')
                found.append((component_name(name), rel))
    return found


def render(entries):
    out = [HEADER]
    for name, path in entries:
        out.append(f"## {name}\n- Path: {path}\n- Use when: TODO\n- Replaces: TODO\n")
    return '\n'.join(out)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--root', default='.')
    parser.add_argument('--write', action='store_true', help='write the draft (never overwrites an existing inventory)')
    args = parser.parse_args()

    config = {}
    config_path = os.path.join(args.root, '.sdd-config.json')
    if os.path.isfile(config_path):
        try:
            config = json.load(open(config_path, encoding='utf-8'))
        except (OSError, ValueError):
            pass
    target = os.path.join(args.root, config.get('ui_inventory') or DEFAULT_INVENTORY)

    entries = scan(args.root)
    if not entries:
        print('No component folders found; nothing to draft.', file=sys.stderr)
        return 0
    text = render(entries)
    if not args.write:
        print(text)
        return 0
    if os.path.exists(target):
        print(f'{target} already exists; not overwritten. Merge the draft by hand:\n', file=sys.stderr)
        print(text)
        return 1
    os.makedirs(os.path.dirname(target) or '.', exist_ok=True)
    with open(target, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'Draft written to {target} ({len(entries)} components). Fill every TODO.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
