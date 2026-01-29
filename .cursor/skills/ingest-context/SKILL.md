# /ingest-context - Add Context to Knowledge Base

Add new documentation, SQL patterns, or code files to the shared context in `context/global/`.

## Trigger

User says "ingest context", "/ingest-context", "add context", "add this to context", or provides a file/URL to add to the knowledge base.

## What Can Be Ingested

| Type | Destination | Examples |
|------|-------------|----------|
| Schema docs | `context/global/schemas/` | Table definitions, column descriptions, data dictionaries |
| SQL patterns | `context/global/sql-patterns/` | Reusable queries, functions, common joins |
| Code files | `context/global/code/` | Reference implementations, utilities, examples |
| Definitions | `context/global/definitions/` | Metric definitions, business rules, glossaries |

## Workflow

1. **Identify the Content**
   - User provides a file path, URL, or pastes content directly
   - Determine the type of content (schema, SQL, code, definition)

2. **Determine Destination**
   - Schema documentation → `context/global/schemas/`
   - SQL queries/patterns → `context/global/sql-patterns/`
   - Code files → `context/global/code/`
   - Metric definitions → `context/global/definitions/`

3. **Process the Content**
   - If URL: fetch and extract relevant content
   - If file: read the file
   - If pasted: use directly
   - Clean up formatting if needed

4. **Create the Context File**
   - Use a descriptive filename (e.g., `USER_TABLES.md`, `attribution_query.sql`)
   - Add a header comment with source and date
   - Save to appropriate directory

5. **Confirm and Provide Usage**
   ```
   ✅ Context added!
   
   File: context/global/[type]/[filename]
   Type: [Schema | SQL Pattern | Code | Definition]
   
   This context is now available to all users.
   Run /save to commit and share with others.
   ```

## Examples

### Adding a Schema Doc
```
User: /ingest-context
      Here's the schema for the USER table:
      - id: varchar, primary key
      - email: varchar, user email
      - created_at: timestamp
      
AI: Creates context/global/schemas/USER_TABLE.md
```

### Adding a SQL Pattern
```
User: /ingest-context projects/my-analysis/queries/useful_join.sql

AI: Copies to context/global/sql-patterns/useful_join.sql
    with header comment noting source
```

### Adding Code Reference
```
User: Add this Python function to context for reference:
      [pastes code]
      
AI: Creates context/global/code/[descriptive_name].py
```

## File Format Guidelines

### Schema Documentation (Markdown)
```markdown
# TABLE_NAME

Brief description of what this table contains.

## Columns

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR | Primary key |
| ... | ... | ... |

## Common Filters
- `is_deleted = FALSE`
- `_fivetran_deleted = FALSE`

## Relationships
- Links to OTHER_TABLE via foreign_key_column
```

### SQL Patterns
```sql
-- Pattern: [Name]
-- Description: [What this does]
-- Usage: [When to use this]
-- Source: [Where this came from]
-- Added: [Date]

SELECT ...
```

### Code Files
```python
"""
[Description of what this code does]

Source: [Where this came from]
Added: [Date]
"""

# code here...
```

## Directory Structure

```
context/global/
├── schemas/           # Table/database documentation
│   ├── OUTREACH_TABLES.md
│   ├── SFDC_TABLES.md
│   └── ...
├── sql-patterns/      # Reusable SQL queries
│   ├── analyze_opp.sql
│   ├── get_sequence_type.sql
│   └── ...
├── code/              # Reference code implementations
│   └── ...
└── definitions/       # Business definitions
    ├── PIPELINE_METRICS.md
    └── ...
```

## Important Notes

- Context in `context/global/` is shared with ALL users
- Changes require approval before merging to main
- Always add source attribution
- Use descriptive filenames
- Run `/save` to commit after adding context
