---
name: ingest-context
description: Import files into the context knowledge base via a staging folder. Use when the user says "/ingest-context", wants to add files to context, or import documentation to the knowledge base.
---

# /ingest-context - Add Context to Knowledge Base

Import files into the context knowledge base via a staging folder. For detailed workflow steps and code examples, see [reference.md](reference.md).

## STOP - Clarify Before Proceeding

**You MUST know these before importing:**

| Requirement | How to Clarify |
|-------------|----------------|
| Source files | "Which file(s) should I import?" |
| Context type | "Is this code, documentation, or schema?" |
| Destination | "Should this go in global context (shared) or personal (private)?" |

**If no files are in `context/import/`, prompt the user to add them first.**

## Trigger

User says "ingest context", "/ingest-context", "add context", "add this to context", or wants to add files to the knowledge base.

## Context Types

- **Global Context** (`context/global/`): Shared with ALL users. Committed to repo, requires approval to merge.
- **Personal Context** (`context/personal/`): Private to you. Gitignored, not shared with others.

## File Types & Destinations

| Type | Subfolder | Examples |
|------|-----------|----------|
| Documentation | `docs/` | Guides, explanations, investigation reports, how-tos |
| Schema docs | `schemas/` | Table definitions, column descriptions, data dictionaries |
| SQL patterns | `sql-patterns/` | Reusable queries, functions, common joins |
| Code files | `code/` | Reference implementations, utilities, examples |
| Definitions | `definitions/` | Metric definitions, business rules, glossaries |

## Workflow Overview

1. **Prompt user** to add files to `context/import/`
2. **Wait** for user confirmation
3. **Scan** the import folder for files
4. **Ask** global or personal destination (use AskQuestion tool)
5. **Categorize** each file by scanning first ~50 lines
6. **Move files** using `mv` command, then add header metadata
7. **Confirm** with list of imported files

For detailed step-by-step instructions with code examples, see [reference.md](reference.md).

## Quick Reference

### Categorization Rules

| Content Type | Destination |
|--------------|-------------|
| Explanations, guides, reports, how-tos | `docs/` |
| Table/column definitions, data dictionaries | `schemas/` |
| SQL queries, templates | `sql-patterns/` |
| Python, TypeScript, JavaScript code | `code/` |
| Metric definitions, glossary terms | `definitions/` |

### Key Commands

```bash
# Create personal subdirectories
mkdir -p context/personal/docs context/personal/schemas context/personal/sql-patterns context/personal/code context/personal/definitions

# Move files
mv "context/import/file.md" "context/global/docs/file.md"
```

## Important Notes

- `context/import/` is gitignored but NOT cursor-ignored (Cursor can read files there)
- Files in import folder are temporary - they get moved, not copied
- Personal context subdirectories are created automatically if needed
- Always run `/save` after adding global context to commit changes
