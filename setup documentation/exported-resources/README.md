# Exported Resources from Rippling OS 1.0

This folder contains critical context, schema documentation, SQL patterns, and skills exported from the original `rippling-os` repository. Use these resources when building Rippling OS 2.0.

---

## Contents

### 📊 schemas/

Database schema documentation for the key data sources:

| File | Description |
|------|-------------|
| `OUTREACH_TABLES.md` | Outreach.io schema - sequences, mailings, prospects, events |
| `SFDC_TABLES.md` | Salesforce schema - opportunities, contacts, leads, accounts |
| `SNOWFLAKE_TABLES.md` | Index of common Snowflake tables across schemas |
| `PIPELINE_METRICS_DEFINITIONS.md` | Canonical definitions for S1, S2, attribution windows |

### 🔧 sql-functions/

Proven SQL patterns and functions:

| File | Description |
|------|-------------|
| `analyze_opp.sql` | Opportunity attribution analysis with sequence linkage |
| `get_sequence_type.sql` | Classify sequences (Cannon, Autobound, Classic MO, etc.) |
| `get_sequence_volume.sql` | Calculate sequence volume metrics |

### 🐍 python-clients/

Python code for Snowflake integration:

| File | Description |
|------|-------------|
| `snowflake_executor.py` | Snowflake query execution with SSO auth |
| `snowflake_client.py` | SQLAlchemy-based Snowflake client |
| `query_runner.py` | CLI tool for running SQL queries |

### 📜 cursor-rules/

Cursor configuration reference:

| File | Description |
|------|-------------|
| `cursorrules-reference.md` | Original .cursorrules from rippling-os |

### 🎯 skills/

Domain-specific Cursor skills:

| Folder | Description |
|--------|-------------|
| `suppression-investigation/` | Investigate suppression logic bugs |
| `suppression-impact-report/` | Generate impact reports for suppression changes |
| `create-fix-doc/` | Create fix documentation for cross-repo handoffs |

### 📝 examples/

Sample queries and patterns:

| File | Description |
|------|-------------|
| `sample-queries.md` | Common query patterns and examples |

---

## How to Use

### For Building 2.0

1. **Schema docs** → Copy to `context/global/schemas/`
2. **SQL functions** → Copy to `context/global/sql-patterns/`
3. **Pipeline metrics** → Copy to `context/global/definitions/`
4. **Skills** → Adapt and place in `skills/` folder
5. **Python clients** → Reference patterns for TypeScript/Node implementation

### Key Concepts to Understand

Before building, read:
1. `PIPELINE_METRICS_DEFINITIONS.md` - Critical S1/S2 definitions
2. `analyze_opp.sql` - Attribution logic patterns
3. `cursorrules-reference.md` - Original guardrails and patterns

---

## Important Notes

### S1 and S2 Definitions (CRITICAL)

- **S1 (Stage 1)**: ANY opportunity created in Salesforce (`is_deleted = FALSE`)
  - Do NOT filter by stage name
- **S2 (Stage 2)**: Any opportunity with `sqo_qualified_date_c` populated
  - Do NOT use stage name for filtering

### Prospect-to-SFDC Linking

```sql
-- CORRECT pattern
JOIN data_connection dc
  ON dc.parent_id = prospect_id
  AND dc.type IN ('Contact', 'Lead')

-- WRONG - parent_type field doesn't exist
-- AND dc.parent_type = 'prospect'
```

### Sequence Tags

- Case-sensitive: Use exact case like `'EmailProgram-MechOutreach'`
- Primary email outreach tag: `EmailProgram-MechOutreach`

---

*Exported: January 2026*
*Source: rippling-os repository*
