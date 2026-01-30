# Ingest Context Reference

Detailed workflow instructions, code examples, and reference information for the `/ingest-context` skill.

## Detailed Workflow

### Step 1: Prompt User to Add Files

Tell the user to drop their files into the import folder:

```
To add files to the knowledge base, drop them into:

📂 context/import/

You can add any of these file types:
- Documentation & guides (.md) - explanations, reports, how-tos
- Schema documentation (.md) - table/column definitions
- SQL patterns and queries (.sql)
- Code files (.py, .ts, .js, etc.)
- Metric definitions (.md)

Let me know when the files are ready.
```

### Step 2: Wait for User Confirmation

User confirms files are in place (e.g., "ready", "done", "files added").

### Step 3: Scan the Import Folder

List files in `context/import/` (excluding .gitkeep):
```bash
ls context/import/
```

If no files found, tell the user and wait.

### Step 4: Ask Global or Personal

Use the AskQuestion tool:

```
Title: "Context Destination"
Question: "Where should these files be saved?"
Options:
  - id: "global", label: "Global (shared with all users)"
  - id: "personal", label: "Personal (private, only for your sessions)"
```

### Step 5: Analyze and Categorize Each File

For each file in `context/import/`:

1. **Briefly scan the file** (first ~50 lines) to understand its content - don't read the whole file
2. **Determine the type** based on content:
   - Explanations, guides, reports, investigations, how-tos → `docs/`
   - Contains table/column definitions, data dictionaries → `schemas/`
   - SQL SELECT/INSERT/UPDATE statements, query templates → `sql-patterns/`
   - Code (Python, TypeScript, etc.) → `code/`
   - Short business definitions, metrics, glossary terms → `definitions/`
3. **Determine the filename** - use the original name or suggest a more descriptive one

**Tip:** If a markdown file explains a process, documents an investigation, or is a guide/report, it goes in `docs/`. If it's a concise list of definitions or a data dictionary, it goes elsewhere.

### Step 6: Move Files to Destination

**Use shell `mv` command for speed** - move all files first, then add headers.

Move each file to the appropriate location:
- Global: `context/global/[type]/[filename]`
- Personal: `context/personal/[type]/[filename]`

For personal context, create subdirectories if they don't exist first:
```bash
mkdir -p context/personal/docs context/personal/schemas context/personal/sql-patterns context/personal/code context/personal/definitions
```

Then move files using `mv`:
```bash
mv "context/import/filename.md" "context/global/docs/filename.md"
mv "context/import/query.sql" "context/global/sql-patterns/query.sql"
```

### Step 6b: Add Header Metadata

After all files are moved, add header comments to each file in its new location.

#### Header Formats by File Type

| File Type | Header Format |
|-----------|---------------|
| Markdown (.md) | `<!-- Source: [original filename] -->\n<!-- Added: [date] -->\n<!-- Type: [category] -->\n\n` |
| SQL (.sql) | `-- Source: [original filename]\n-- Added: [date]\n-- Type: SQL Pattern\n\n` |
| Python (.py) | `"""\nSource: [original filename]\nAdded: [date]\nType: Code Reference\n"""\n\n` |
| JS/TS (.js/.ts) | `/**\n * Source: [original filename]\n * Added: [date]\n * Type: Code Reference\n */\n\n` |

Use the StrReplace tool to prepend headers, or use sed:
```bash
sed -i '' '1s/^/-- Source: query.sql\n-- Added: 2026-01-29\n-- Type: SQL Pattern\n\n/' "context/global/sql-patterns/query.sql"
```

### Step 7: Confirm

For **global** context:
```
✅ Context imported to global knowledge base!

Files added:
- context/global/schemas/TABLE_NAME.md
- context/global/sql-patterns/query_name.sql

These files are now available to all users.
Run /save to commit and share with others.
```

For **personal** context:
```
✅ Context imported to your personal knowledge base!

Files added:
- context/personal/schemas/TABLE_NAME.md
- context/personal/sql-patterns/query_name.sql

These files are private to you and available in future sessions.
```

## Example Flow

```
User: /ingest-context

AI: To add files to the knowledge base, drop them into:
    📂 context/import/
    Let me know when the files are ready.

User: done

AI: [Scans context/import/, finds: MO_SUPPRESSION_RULES_DOCUMENTATION.md, 
     SUPPRESSION_INVESTIGATION_REPORT.md, helper_query.sql]
    [Uses AskQuestion: "Where should these files be saved?"]

User: Selects "Global (shared with all users)"

AI: [Scans first ~50 lines of each file to categorize]
    [MO_SUPPRESSION_RULES_DOCUMENTATION.md → explanation/guide → docs/]
    [SUPPRESSION_INVESTIGATION_REPORT.md → investigation report → docs/]
    [helper_query.sql → SQL query → sql-patterns/]
    [Uses mv to move all files first - fast!]
    [Then adds header metadata to each file in place]
    
    ✅ Context imported to global knowledge base!
    
    Files added:
    - context/global/docs/MO_SUPPRESSION_RULES_DOCUMENTATION.md
    - context/global/docs/SUPPRESSION_INVESTIGATION_REPORT.md
    - context/global/sql-patterns/helper_query.sql
    
    Run /save to commit and share with others.
```

## Directory Structure

```
context/
├── import/                # Staging folder (gitignored, cursor can read)
│   └── .gitkeep
│
├── global/                # Shared with all users (committed to repo)
│   ├── docs/              # Guides, reports, explanations
│   ├── schemas/           # Table/column definitions
│   ├── sql-patterns/      # Reusable queries
│   ├── code/              # Reference implementations
│   └── definitions/       # Metric definitions, glossaries
│
└── personal/              # Private to you (gitignored)
    ├── docs/              
    ├── schemas/           
    ├── sql-patterns/      
    ├── code/              
    └── definitions/       
```

## Important Notes

- `context/import/` is gitignored but NOT cursor-ignored (Cursor can read files there)
- Files in import folder are temporary - they get moved, not copied
- Personal context subdirectories are created automatically if needed
- Always run `/save` after adding global context to commit changes
