---
name: create-fix-doc
description: Create fix documentation for bugs investigated in one repo that need to be applied in another repo. Use when the user asks to create a fix doc, fix prompt, or needs to hand off a bug fix to another Cursor agent that won't have access to the original data sources.
---

# Create Fix Doc

## Purpose

Fix docs are self-contained markdown files that allow a Cursor agent in another repository to apply bug fixes without needing access to the original investigation data (databases, query results, etc.).

## When to Create

- After investigating a bug in a data/analytics repo
- When the fix needs to be applied in a different codebase (e.g., airflow_dags, backend)
- When the target repo won't have access to the database or data sources used in investigation

## Required Sections

### 1. Context Header
```markdown
# Cursor Prompt: Fix [Bug Name]

## Context

Copy this entire file into Cursor as a prompt when working in the `[target-repo]` repository.

**IMPORTANT:** This folder contains pre-computed query results from [data source]. Review the CSV files before making changes.
```

### 2. Pre-Computed Data (if applicable)
List all data files included with the fix doc:

```markdown
## Pre-Computed Query Results

| File | Description |
|------|-------------|
| `step1_xxx.csv` | Description of what this data shows |
| `step2_xxx.csv` | Description of what this data shows |
```

### 3. Bug Report Summary
```markdown
## Bug Report: [Descriptive Title]

### Summary
[1-2 sentences describing the bug]

### Impact Data
| Metric | Value |
|--------|-------|
| Affected records | X |
| Impact if fixed | Y |
```

### 4. Key Findings
Summarize what the pre-computed data shows:

```markdown
### Key Findings from Investigation Data

From `step1_xxx.csv`:
- Finding 1
- Finding 2

From `step2_xxx.csv`:
- Finding 3
```

### 5. File to Fix
```markdown
## File to Fix

**Path:** `path/to/file/in/target/repo.sql`
```

### 6. Specific Changes Required
Provide concrete before/after code:

```markdown
## Specific Changes Required

### Fix 1: [Description] (Lines X-Y)

**Current code:**
\`\`\`sql
[exact current code]
\`\`\`

**Fixed code:**
\`\`\`sql
[exact fixed code]
\`\`\`
```

### 7. Test Queries
```markdown
## Test Queries

After deploying the fix, run these queries to verify:

### 1. [Test Name]
\`\`\`sql
[query]
-- Expected: [what should happen]
\`\`\`
```

### 8. Root Cause Explanation
```markdown
## Why This Happened

[Technical explanation of the root cause]
```

### 9. Related Files
```markdown
## Related Files

- **DAG:** `path/to/dag.py`
- **Main SQL:** `path/to/main.sql`
```

### 10. Metadata
```markdown
---

## Contact

This analysis was generated on [DATE]. Data counts may have changed since then.
```

## Folder Structure

**IMPORTANT:** Always create a subfolder for each fix doc. The fix doc markdown file MUST be in the same folder as any related queries or data files.

```
fix_docs/
└── [bug-name]/
    ├── fix_prompt_[bug_name].md    # The fix doc (MUST be in subfolder)
    ├── step1_[description].csv      # Pre-computed data
    ├── step2_[description].csv
    ├── sample_query_1.sql           # Related diagnostic queries
    └── ...
```

**Why this matters:**
- Keeps all related files together for easy handoff
- The fix doc can reference sibling files with relative paths
- Prevents orphaned files scattered across directories
- Makes it clear which queries/data belong to which fix

## Best Practices

1. **Self-contained** - Include ALL data needed to understand the issue
2. **No priority assessments** - Keep priority/recommendations in investigation reports, not fix docs
3. **Concrete code** - Always show exact before/after code, not descriptions
4. **Runnable tests** - Test queries should be copy-paste ready
5. **Clean filenames** - Remove timestamps from CSV files before committing

## Workflow

1. Run investigation queries and save results to CSVs
2. Create fix doc subfolder under `fix_docs/[bug-name]/`
3. Move/copy CSVs to subfolder (remove timestamps)
4. Copy any related diagnostic SQL queries to the subfolder
5. Write `fix_prompt_[name].md` in the subfolder following the template
6. Reference the sibling files in the "Pre-Computed Data" or "Related Files" section
7. Verify all files are in the subfolder together before committing
8. Ensure the fix doc can stand alone without database access

## Example

See [reference.md](reference.md) for a complete example fix doc.
