"""
Validates that spec files follow their template structure.
Checks that all required sections from the template exist in the spec.

Usage: python scripts/validate-specs.py [--specs-dir PATH]
"""

import os
import sys
import re


# Map spec filenames to their template filenames
TEMPLATE_MAP = {
    'product.md': 'product-template.md',
    'requirements.md': 'requirements-template.md',
    'design.md': 'design-template.md',
    'migration-plan.md': 'migration-plan-template.md',
    'test-plan.md': 'test-plan-template.md',
    'test-cases.md': 'test-cases-template.md',
    'tasks.md': 'tasks-template.md',
    'bugfix.md': 'bugfix-template.md',
}

# Architecture docs live in docs/architecture/ or specs/*/architecture/
ARCHITECTURE_TEMPLATE_MAP = {
    'data-model.md': 'architecture/data-model-template.md',
    'api-contract.md': 'architecture/api-contract-template.md',
    'integrations.md': 'architecture/integrations-template.md',
    'security-model.md': 'architecture/security-model-template.md',
    'system-design.md': 'architecture/system-design-template.md',
}


def get_h2_headings(filepath):
    """Extract ## headings from a markdown file."""
    if not os.path.exists(filepath):
        return set()
    headings = set()
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('## '):
                # Normalize: lowercase, strip markdown formatting
                heading = line[3:].strip().lower()
                # Remove template placeholders like [xxx]
                heading = re.sub(r'\[.*?\]', '', heading).strip()
                # Remove time estimates in various formats:
                # (~2h), (~24h), (~1.5h), (~30m), (~h) — in parens
                heading = re.sub(r'\(~[\d.]+(?:h|m)\)', '', heading).strip()
                heading = re.sub(r'\(~h\)', '', heading).strip()
                # ~2h, ~24h, ~1.5h, ~30m, ~h — without parens
                heading = re.sub(r'~[\d.]+(?:h|m)\b', '', heading).strip()
                heading = re.sub(r'~h\b', '', heading).strip()
                # Remove trailing parenthetical content like (anything)
                heading = re.sub(r'\(.*?\)\s*$', '', heading).strip()
                if heading:
                    headings.add(heading)
    return headings


def find_templates_dir(root):
    """Find the specs/_templates/ directory."""
    candidates = [
        os.path.join(root, 'specs', '_templates'),
        os.path.join(root, '.agents', 'templates'),
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    return None


# Spec files that belong ONLY inside a Feature subfolder, never in an Epic folder
FEATURE_LEVEL_SPECS = {
    'requirements.md', 'design.md', 'tasks.md', 'test-plan.md',
    'test-cases.md', 'migration-plan.md',
}

# Spec files that belong in the Epic folder root
EPIC_LEVEL_SPECS = {'intake.md'}


def validate_structure(specs_dir):
    """Check spec folder hierarchy rules.

    Rules:
    1. requirements/design/tasks/test-*/migration-plan MUST be inside a Feature
       subfolder (nested under an Epic folder), NEVER directly in an Epic folder.
    2. A top-level folder WITHOUT intake.md that holds feature-level specs is a
       Feature placed as a sibling of the Epic → must be nested inside an Epic.
    """
    errors = []

    def has_feature_spec(folder):
        """True if folder directly contains any feature-level spec file."""
        return any(os.path.isfile(os.path.join(folder, s))
                   for s in FEATURE_LEVEL_SPECS)

    for d in sorted(os.listdir(specs_dir)):
        top = os.path.join(specs_dir, d)
        if not os.path.isdir(top) or d == '_templates':
            continue

        has_intake = os.path.isfile(os.path.join(top, 'intake.md'))

        # Rule 1: feature-level spec directly in the Epic folder
        if has_intake:
            for spec in FEATURE_LEVEL_SPECS:
                path = os.path.join(top, spec)
                if os.path.isfile(path):
                    rel = os.path.relpath(path, specs_dir)
                    errors.append(
                        f"  {rel}: '{spec}' belongs in a Feature subfolder, "
                        f"NOT directly in the Epic folder. "
                        f"Fix: move to {d}/{{feature_ID}}-{{feature_name}}/{spec}"
                    )
            continue

        # Rule 2: top-level folder without intake.md holding feature-level
        # specs = Feature folder as sibling of the Epic (wrong structure)
        if has_feature_spec(top):
            errors.append(
                f"  {d}/: Feature folder is a SIBLING of the Epic folder, "
                f"not nested inside. It has no intake.md (Epic marker). "
                f"Fix: move it INSIDE the Epic folder, e.g. "
                f"specs/{{epic_ID}}-{{epic_name}}/{d}/"
            )

    return errors


def main():
    root = os.getcwd()
    specs_dir = os.path.join(root, 'specs')

    # Parse optional args
    warn_only = '--warn-only' in sys.argv
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == '--specs-dir' and i < len(sys.argv) - 1:
            specs_dir = sys.argv[i + 1]

    templates_dir = find_templates_dir(root)
    if not templates_dir:
        print("⏭️ No specs/_templates/ found — skipping validation")
        sys.exit(0)

    if not os.path.isdir(specs_dir):
        print("⏭️ No specs/ directory found — skipping validation")
        sys.exit(0)

    errors = []
    checked = 0

    for dirpath, dirnames, filenames in os.walk(specs_dir):
        # Skip _templates directory itself
        if '_templates' in dirpath:
            continue

        for filename in filenames:
            if filename not in TEMPLATE_MAP:
                continue

            template_name = TEMPLATE_MAP[filename]
            template_path = os.path.join(templates_dir, template_name)

            if not os.path.exists(template_path):
                continue

            spec_path = os.path.join(dirpath, filename)
            spec_headings = get_h2_headings(spec_path)
            template_headings = get_h2_headings(template_path)

            if not template_headings:
                continue

            # Find headings in template that are MISSING from spec
            # Optional sections that templates may have but specs can skip
            # Includes: always-optional + CONDITIONAL sections from templates
            optional = {
                'status', 'changelog', 'notas', 'notes', 'key decisions',
                'version upgrade steps', 'deployment migration',
                'architecture variants', 'pending decisions',
                'data migration', 'prerequisites',
                'wave 0: project setup', 'wave 1: foundation & setup',
                'wave 2: core implementation', 'wave 3: ui & integration',
                'wave 4: testing & polish',
                'total estimate',
            }
            required = template_headings - optional
            missing = required - spec_headings

            if missing:
                rel_path = os.path.relpath(spec_path, root)
                errors.append(f"  {rel_path}: missing required sections: {sorted(missing)}")

            checked += 1

    # Also validate architecture docs
    arch_dirs = [
        os.path.join(root, 'docs', 'architecture'),
        os.path.join(root, 'specs'),  # some projects put arch docs in specs/
    ]
    for arch_dir in arch_dirs:
        if not os.path.isdir(arch_dir):
            continue
        for dirpath, dirnames, filenames in os.walk(arch_dir):
            if '_templates' in dirpath:
                continue
            for filename in filenames:
                if filename not in ARCHITECTURE_TEMPLATE_MAP:
                    continue
                template_name = ARCHITECTURE_TEMPLATE_MAP[filename]
                template_path = os.path.join(templates_dir, template_name)
                if not os.path.exists(template_path):
                    continue
                spec_path = os.path.join(dirpath, filename)
                spec_headings = get_h2_headings(spec_path)
                template_headings = get_h2_headings(template_path)
                if not template_headings:
                    continue
                # Optional sections that templates may have but docs can skip
                optional = {
                    'status', 'changelog', 'notas', 'notes', 'key decisions',
                    'version upgrade steps', 'deployment migration',
                    'architecture variants', 'pending decisions',
                    'data migration', 'prerequisites',
                }
                required = template_headings - optional
                missing = required - spec_headings
                if missing:
                    rel_path = os.path.relpath(spec_path, root)
                    errors.append(f"  {rel_path}: missing required sections: {sorted(missing)}")
                checked += 1

    # Validate spec folder hierarchy (nested Features, Epic-level placement)
    structure_errors = validate_structure(specs_dir)
    if structure_errors:
        errors.append("Spec structure violations (nested Features rule):")
        errors.extend(structure_errors)

    if errors:
        print(f"❌ Specs with missing required sections ({len(errors)} files):")
        for e in errors:
            print(e)
        if warn_only:
            print("⚠️ Running in --warn-only mode — errors logged but commit allowed")
            sys.exit(0)
        sys.exit(1)

    if checked == 0:
        print("⏭️ No spec files found to validate")
    else:
        print(f"✅ {checked} spec file(s) validated — all follow templates")
    sys.exit(0)


if __name__ == '__main__':
    main()
