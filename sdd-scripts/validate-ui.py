#!/usr/bin/env python3
"""validate-ui.py — UI theme conformity validator for SDD Standard.

Checks CSS/SCSS/HTML files against the active theme's MUST and SHOULD directives.
MUST violations block in --strict mode. SHOULD violations always warn.
SHOULD checks are skipped if the corresponding themeOverride is declared.

Usage:
    python validate-ui.py [--strict] [--theme THEME] [--config CONFIG]
"""

import argparse
import fnmatch
import json
import os
import re
import sys
from pathlib import Path

WARN = "\033[33m⚠\033[0m"
FAIL = "\033[31m✗\033[0m"
OK = "\033[32m✓\033[0m"

MUST_CHECKS = []
SHOULD_CHECKS = []


def must_check(name, description):
    def decorator(func):
        MUST_CHECKS.append((name, description, func))
        return func
    return decorator


def should_check(name, description, override_key=None):
    def decorator(func):
        SHOULD_CHECKS.append((name, description, override_key, func))
        return func
    return decorator


def find_files(root, extensions=('.css', '.scss', '.html', '.tsx', '.jsx', '.vue')):
    files = []
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            if any(f.endswith(ext) for ext in extensions):
                files.append(os.path.join(dirpath, f))
    return files


def read_file(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return ''


def load_config(config_path):
    if not config_path or not os.path.isfile(config_path):
        return {}
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception:
        return {}


def get_theme_name(config):
    return config.get('theme', '').upper()


def get_overrides(config):
    return config.get('themeOverrides', {})


# --- UI inventory: shared components must be reused, not re-implemented -------------------------
# The inventory (default docs/ui-inventory.md, config key `ui_inventory`) lists each shared component:
#   ## DataTable
#   - Path: src/components/DataTable.tsx          (file or folder that owns the pattern)
#   - Replaces: `<table`, `re:<table\b`           (literal text; `re:` prefix = regular expression)
#   - Allowed: src/components/charts/*            (optional extra globs where the pattern is fine)
# Any file outside Path/Allowed that contains a Replaces pattern is a violation. Stack-agnostic: plain text search.

DEFAULT_INVENTORY = 'docs/ui-inventory.md'
REUSE_EXTENSIONS = ('.tsx', '.jsx', '.ts', '.vue', '.svelte', '.astro', '.html', '.dart', '.razor', '.cshtml')
REUSE_SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt', 'out', 'bin', 'obj',
                   '.dart_tool', '.sdd-cache', '.opencode', '.agents', '.claude', '.kiro', '.cursor', '.windsurf',
                   'test', 'tests', '__tests__', 'e2e', 'test-results', 'specs', 'mockups', 'docs'}
REUSE_TEST_FILE = re.compile(r'(\.|_)(test|spec|stories)\.[a-z]+$|_test\.dart$|Tests?\.cs$', re.IGNORECASE)
_FIELD = re.compile(r'^\s*[-*]\s*(Path|Replaces|Allowed)\s*:\s*(.*?)\s*$', re.IGNORECASE)
_SPLIT = re.compile(r'`([^`]+)`|([^,]+)')


def _values(raw):
    items = []
    for quoted, bare in _SPLIT.findall(raw):
        value = (quoted or bare).strip()
        if value:
            items.append(value)
    return items


def parse_inventory(text):
    """Entries [{name, paths, replaces, allowed}] from the inventory markdown (our fixed layout)."""
    entries, current = [], None
    for line in text.splitlines():
        if line.startswith('## '):
            current = {'name': line[3:].strip(), 'paths': [], 'replaces': [], 'allowed': []}
            entries.append(current)
            continue
        field = _FIELD.match(line)
        if field and current is not None:
            key = {'path': 'paths', 'replaces': 'replaces', 'allowed': 'allowed'}[field.group(1).lower()]
            current[key].extend(_values(field.group(2)))
    return entries


def _matcher(pattern):
    if pattern.lower() in ('todo', '-', 'n/a', 'none'):
        return None
    if pattern.startswith('re:'):
        regex = re.compile(pattern[3:])
        return regex.search
    return lambda line: pattern in line


def _inside(rel, owner):
    owner = owner.strip().rstrip('/').lstrip('./')
    rel = rel.replace(os.sep, '/')
    return rel == owner or rel.startswith(owner + '/') or fnmatch.fnmatch(rel, owner)


def reuse_files(root):
    found = []
    for dirpath, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d not in REUSE_SKIP_DIRS]
        for name in names:
            if name.endswith(REUSE_EXTENSIONS) and not REUSE_TEST_FILE.search(name):
                found.append(os.path.join(dirpath, name))
    return found


def check_reuse(root, config):
    """-> (violations [(relpath, line_no, detail)], notes [str]). Empty when there is no inventory."""
    inventory = os.path.join(root, config.get('ui_inventory') or DEFAULT_INVENTORY)
    if not os.path.isfile(inventory):
        return [], []
    entries = parse_inventory(read_file(inventory))
    notes, rules = [], []
    for entry in entries:
        for owner in entry['paths']:
            if not os.path.exists(os.path.join(root, owner.strip().rstrip('/'))) and '*' not in owner:
                notes.append(f"inventory entry '{entry['name']}' points to a missing path: {owner}")
        matchers = [(p, _matcher(p)) for p in entry['replaces']]
        matchers = [(p, m) for p, m in matchers if m]
        if matchers:
            rules.append((entry, matchers))
    violations = []
    for path in reuse_files(root):
        rel = os.path.relpath(path, root).replace(os.sep, '/')
        applicable = [(e, ms) for e, ms in rules
                      if not any(_inside(rel, o) for o in e['paths'] + e['allowed'])]
        if not applicable:
            continue
        for number, line in enumerate(read_file(path).splitlines(), 1):
            for entry, matchers in applicable:
                for pattern, match in matchers:
                    if match(line):
                        owner = entry['paths'][0] if entry['paths'] else entry['name']
                        violations.append((rel, number, f"{entry['name']}: use {owner} instead of '{pattern}'"))
    return violations, notes


@must_check('body-min-16px', 'Body/root font-size must be >= 16px (WCAG)')
def check_body_min_size(files, theme, overrides):
    violations = []
    for path in files:
        content = read_file(path)
        matches = re.findall(r'(?:font-size|fontSize)\s*[:=]\s*([0-9.]+)\s*(?:px|rem)?', content)
        for m in matches:
            val = float(m)
            if 'rem' in content and val < 1.0:
                violations.append((path, f'font-size {m}rem (< 16px)'))
            elif 'px' in content or val > 1.5:
                if val < 16 and val > 0:
                    violations.append((path, f'font-size {m}px (< 16px)'))
    return violations


@must_check('touch-target-48px', 'Interactive elements must have min-height/min-width >= 48px (WCAG 2.5.5)')
def check_touch_targets(files, theme, overrides):
    violations = []
    for path in files:
        content = read_file(path)
        if re.search(r'min-height\s*:\s*([0-9]+)px', content):
            matches = re.findall(r'min-height\s*:\s*([0-9]+)px', content)
            for m in matches:
                if int(m) < 48:
                    violations.append((path, f'min-height {m}px (< 48px)'))
    return violations


@must_check('reduced-motion', 'prefers-reduced-motion media query must be present (WCAG 2.3.3)')
def check_reduced_motion(files, theme, overrides):
    all_css = '\n'.join(read_file(f) for f in files if f.endswith(('.css', '.scss')))
    if 'prefers-reduced-motion' not in all_css:
        return [('project', 'No prefers-reduced-motion media query found in CSS')]
    return []


@must_check('status-color-icon-text', 'Status indicators must use color + icon + text (WCAG 1.4.1)')
def check_status_not_color_only(files, theme, overrides):
    violations = []
    for path in files:
        content = read_file(path)
        if re.search(r'status[_-]?badge|status[_-]?indicator|\.badge', content, re.IGNORECASE):
            if not re.search(r'icon|pi-|svg|aria-label', content, re.IGNORECASE):
                violations.append((path, 'Status badge without icon/text detected'))
    return violations


@should_check('accent-color', 'Primary accent color matches theme default', override_key='accent')
def check_accent_color(files, theme, overrides):
    violations = []
    for path in files:
        content = read_file(path)
        if re.search(r'#06B6D4|#0EA5E9|#22D3EE', content):
            violations.append((path, 'Default AI cyan accent detected — use theme primary instead'))
        if theme in ('INSTITUTIONAL', 'GOVTECH', 'INSURTECH') and re.search(r'#212121|color:\s*#000000\b', content):
            violations.append((path, 'Pure black/dark-gray text — use off-black (blue-tinted)'))
        if theme == 'HEALTHCARE' and re.search(r'#4CAF50|#66BB6A', content):
            violations.append((path, 'Hospital green detected — use teal #0D9488 (modern healthcare standard)'))
    return violations


@should_check('focus-indicator', 'Focus indicator should be 3px solid distinct color (not default outline)', override_key='focusIndicator')
def check_focus_indicator(files, theme, overrides):
    all_css = '\n'.join(read_file(f) for f in files if f.endswith(('.css', '.scss')))
    if 'outline: none' in all_css and ':focus-visible' not in all_css:
        return [('project', 'outline: none without :focus-visible replacement detected')]
    return []


@should_check('card-elevation', 'Cards should have shadow/elevation (not flat border only)', override_key='cardHover')
def check_card_elevation(files, theme, overrides):
    violations = []
    for path in files:
        content = read_file(path)
        if re.search(r'\.card\b', content) and 'box-shadow' not in content and 'shadow' not in content:
            if 'border' in content and 'background' in content:
                violations.append((path, 'Card with border but no shadow — consider elevation'))
    return violations


@should_check('no-dark-mode-forced', 'Dark mode should not be forced without toggle', override_key='darkMode')
def check_no_forced_dark_mode(files, theme, overrides):
    violations = []
    for path in files:
        content = read_file(path)
        if re.search(r'color-scheme\s*:\s*dark\s*!important', content):
            violations.append((path, 'Forced dark mode without toggle detected'))
    return violations


@should_check('sidebar-dark', 'Sidebar should use dark background in admin portals', override_key='sidebarLight')
def check_sidebar_dark(files, theme, overrides):
    all_css = '\n'.join(read_file(f) for f in files if f.endswith(('.css', '.scss')))
    if 'sidebar' in all_css.lower() and '#000' not in all_css and '#1a1a' not in all_css and '#0a0a' not in all_css:
        return [('project', 'Sidebar found but no dark background detected')]
    return []


SHARED_OVERRIDE_KEYS = {
    'cardHover': {'type': 'string', 'values': ['shadow-md', 'scale', 'none']},
    'entryAnimations': {'type': 'boolean', 'values': [True, False]},
    'inputWrapper': {'type': 'boolean', 'values': [True, False]},
    'progressiveDisclosure': {'type': 'boolean', 'values': [True, False]},
    'pageHeaderIcon': {'type': 'boolean', 'values': [True, False]},
    'ambienteBadge': {'type': 'boolean', 'values': [True, False]},
}

THEME_OVERRIDE_KEYS = {
    'INSTITUTIONAL': {
        'accent': {'type': 'string', 'values': ['gold', 'primary']},
        'sidebarLight': {'type': 'boolean', 'values': [True, False]},
        'pillShortcuts': {'type': 'boolean', 'values': [True, False]},
        'taskNav': {'type': 'boolean', 'values': [True, False]},
        'languageSelector': {'type': 'boolean', 'values': [True, False]},
    },
    'CORPORATE': {
        'density': {'type': 'string', 'values': ['compact', 'comfortable']},
        'accent': {'type': 'string', 'values': ['teal', 'primary']},
        'commandPalette': {'type': 'boolean', 'values': [True, False]},
        'sidePanel': {'type': 'boolean', 'values': [True, False]},
        'inlineEditing': {'type': 'boolean', 'values': [True, False]},
        'activityFeed': {'type': 'boolean', 'values': [True, False]},
        'compactMode': {'type': 'boolean', 'values': [True, False]},
    },
    'HEALTHCARE': {
        'accent': {'type': 'string', 'values': ['gold', 'primary']},
        'clinicalPulse': {'type': 'boolean', 'values': [True, False]},
        'patientHeader': {'type': 'boolean', 'values': [True, False]},
        'commandPalette': {'type': 'boolean', 'values': [True, False]},
    },
    'FINTECH': {
        'density': {'type': 'string', 'values': ['compact', 'comfortable']},
        'cardStyle': {'type': 'string', 'values': ['elevated', 'glassmorphism', 'outlined']},
        'accent': {'type': 'string', 'values': ['green', 'cyan']},
        'liveIndicators': {'type': 'boolean', 'values': [True, False]},
        'sidePanel': {'type': 'boolean', 'values': [True, False]},
        'animatedAmounts': {'type': 'boolean', 'values': [True, False]},
        'commandPalette': {'type': 'boolean', 'values': [True, False]},
        'lightMode': {'type': 'boolean', 'values': [True, False]},
    },
    'GOVTECH': {
        'accent': {'type': 'string', 'values': ['teal', 'gold']},
        'a11yPanel': {'type': 'boolean', 'values': [True, False]},
        'pillShortcuts': {'type': 'boolean', 'values': [True, False]},
        'languageSelector': {'type': 'boolean', 'values': [True, False]},
    },
    'INSURTECH': {
        'density': {'type': 'string', 'values': ['compact', 'comfortable']},
        'cardStyle': {'type': 'string', 'values': ['elevated', 'outlined']},
        'formLayout': {'type': 'string', 'values': ['single-column', 'wizard', 'multi-column']},
        'animationLevel': {'type': 'string', 'values': ['minimal', 'moderate']},
        'statusBadges': {'type': 'boolean', 'values': [True, False]},
        'claimTimeline': {'type': 'boolean', 'values': [True, False]},
        'coverageViz': {'type': 'boolean', 'values': [True, False]},
        'carrierLogos': {'type': 'boolean', 'values': [True, False]},
        'commandPalette': {'type': 'boolean', 'values': [True, False]},
    },
    'CUSTOM': {
        'density': {'type': 'string', 'values': ['compact', 'comfortable', 'spacious']},
        'cardStyle': {'type': 'string', 'values': ['elevated', 'flat', 'glassmorphism', 'outlined']},
        'navigation': {'type': 'string', 'values': ['sidebar', 'top', 'bottom', 'hybrid']},
        'formLayout': {'type': 'string', 'values': ['single-column', 'multi-column', 'wizard']},
        'dataViz': {'type': 'string', 'values': ['tables', 'charts', 'kpi', 'timeline', 'map']},
        'animationLevel': {'type': 'string', 'values': ['minimal', 'moderate', 'expressive']},
        'illustrationStyle': {'type': 'string', 'values': ['none', 'minimal-icons', 'line-art', 'photography', 'abstract']},
        'mode': {'type': 'string', 'values': ['light', 'dark']},
        'commandPalette': {'type': 'boolean', 'values': [True, False]},
        'sidePanel': {'type': 'boolean', 'values': [True, False]},
    },
}


def validate_override_keys(theme, overrides):
    warnings = []
    theme_specific = THEME_OVERRIDE_KEYS.get(theme, {})
    valid_keys = set(SHARED_OVERRIDE_KEYS.keys()) | set(theme_specific.keys())
    for key in overrides:
        if key not in valid_keys:
            warnings.append(f"Unknown override key '{key}' for theme {theme}")
            continue
        schema = SHARED_OVERRIDE_KEYS.get(key) or theme_specific.get(key)
        if schema:
            val = overrides[key]
            if schema['type'] == 'boolean' and not isinstance(val, bool):
                warnings.append(f"Override '{key}' expects boolean, got {type(val).__name__}: {val}")
            elif schema['type'] == 'string' and not isinstance(val, str):
                warnings.append(f"Override '{key}' expects string, got {type(val).__name__}: {val}")
            elif schema['type'] == 'string' and isinstance(val, str) and val not in schema['values'] and not val.startswith('#'):
                warnings.append(f"Override '{key}' value '{val}' not in allowed values {schema['values']}")
    return warnings


def run_checks(files, theme, overrides, strict=False):
    errors = 0
    warnings = 0

    for name, desc, func in MUST_CHECKS:
        violations = func(files, theme, overrides)
        if violations:
            for path, detail in violations:
                rel = os.path.relpath(path) if path != 'project' else path
                if strict:
                    print(f"  {FAIL} MUST: {name} — {rel}: {detail}")
                    errors += 1
                else:
                    print(f"  {WARN} MUST: {name} — {rel}: {detail}")
                    warnings += 1
        else:
            print(f"  {OK} MUST: {name}")

    for name, desc, override_key, func in SHOULD_CHECKS:
        if override_key and override_key in overrides:
            print(f"  {OK} SHOULD: {name} (skipped — override '{override_key}' declared)")
            continue
        violations = func(files, theme, overrides)
        if violations:
            for path, detail in violations:
                rel = os.path.relpath(path) if path != 'project' else path
                print(f"  {WARN} SHOULD: {name} — {rel}: {detail}")
                warnings += 1
        else:
            print(f"  {OK} SHOULD: {name}")

    return errors, warnings


def run_reuse(config, strict, root='.'):
    """Print the reuse check; returns the exit code (1 only for violations in strict mode)."""
    print("\n🧩 UI inventory — shared component reuse")
    violations, notes = check_reuse(root, config)
    for note in notes:
        print(f"  {WARN} INVENTORY: {note}")
    for rel, number, detail in violations:
        mark = FAIL if strict else WARN
        print(f"  {mark} MUST: ui-reuse — {rel}:{number}: {detail}")
    if not violations:
        print(f"  {OK} MUST: ui-reuse")
    print()
    return 1 if (violations and strict) else 0


def main():
    parser = argparse.ArgumentParser(description='Validate UI against SDD theme directives')
    parser.add_argument('--strict', action='store_true',
                        help='Block on MUST violations (default: warn only)')
    parser.add_argument('--theme', help='Theme name (auto-detected from .sdd-config.json)')
    parser.add_argument('--config', default='.sdd-config.json',
                        help='Path to .sdd-config.json')
    parser.add_argument('--only', choices=['reuse'],
                        help='Run only one family of checks (reuse = shared components from the UI inventory)')
    parser.add_argument('paths', nargs='*', default=['.'],
                        help='Paths to scan for UI files')
    args = parser.parse_args()

    config = load_config(args.config)
    theme = args.theme or get_theme_name(config) or 'INSTITUTIONAL'
    overrides = get_overrides(config)

    strict = args.strict or os.environ.get('SDD_VALIDATION', '') == 'strict'

    if args.only == 'reuse':
        return run_reuse(config, strict)

    print(f"\n🎨 UI Theme Validation — {theme}")
    print(f"   Mode: {'strict' if strict else 'warn-only'}")
    if overrides:
        print(f"   Overrides: {json.dumps(overrides)}")
    print()

    files = []
    for path in args.paths:
        if os.path.isdir(path):
            skip = {'node_modules', '.git', 'dist', 'build', '.sdd-cache', '.opencode', '.agents', '.cursor', '.windsurf'}
            for root, dirs, filenames in os.walk(path):
                dirs[:] = [d for d in dirs if d not in skip]
                for f in filenames:
                    if any(f.endswith(ext) for ext in ('.css', '.scss', '.html', '.tsx', '.jsx', '.vue')):
                        files.append(os.path.join(root, f))

    if not files:
        print("  ℹ️  No UI files found to validate")
        return run_reuse(config, strict)

    print(f"   Scanning {len(files)} files\n")

    errors, warnings = run_checks(files, theme, overrides, strict)

    if overrides:
        override_warnings = validate_override_keys(theme, overrides)
        for w in override_warnings:
            print(f"  {WARN} OVERRIDE: {w}")
            warnings += 1

    if run_reuse(config, strict):
        errors += 1

    print()
    if errors > 0:
        print(f"  {FAIL} {errors} error(s), {warnings} warning(s)")
        return 1
    elif warnings > 0:
        print(f"  {WARN} {warnings} warning(s)")
        return 0
    else:
        print(f"  {OK} All checks passed")
        return 0


if __name__ == '__main__':
    sys.exit(main())
