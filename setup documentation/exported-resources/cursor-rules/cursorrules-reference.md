# Rippling OS - Cursor Rules

## Project Context
This is a data analysis and SQL query toolkit for analyzing Rippling's marketing and sales pipeline data from Snowflake, Outreach, and Salesforce.

## Core Principles

### 1. Documentation First
- **ALWAYS document learnings immediately** - Don't rely on memory
- When you discover a data pattern, gotcha, or best practice → update reference docs
- Key reference files:
  - `core/references/PIPELINE_METRICS_DEFINITIONS.md` - Canonical metrics definitions
  - `core/references/OUTREACH_TABLES.md` - Outreach schema
  - `core/references/SFDC_TABLES.md` - Salesforce schema
  - `core/references/SNOWFLAKE_TABLES.md` - Snowflake tables

### 2. SQL Query Patterns
- **Reference existing patterns** before writing new SQL
- Model new queries after proven patterns in `core/sql_functions/`
- Key patterns to follow:
  - Prospect-to-SFDC linking: Use `data_connection` with `dc.type IN ('Contact', 'Lead')`
  - Attribution windows: Default to 45 days (matches analyze_opp function)
  - Use `sequence_state.created_at` for attribution (not enrollment date)
  - Opportunity filtering: Always include `is_deleted = FALSE` and `_fivetran_deleted = FALSE`
  - Sequence state filtering: Check `relationship_sequence_id IS NOT NULL` and `deliver_count > 0`

### 3. Pipeline Metrics Definitions (CRITICAL)

#### S1 (Stage 1)
- **Definition:** ANY opportunity created in Salesforce
- **Never filter by stage name** - stage names change frequently
- SQL: Count ALL opportunities where `is_deleted = FALSE`

#### S2 (Stage 2)  
- **Definition:** Any opportunity with `sqo_qualified_date_c` populated
- **Never use stage name** - use the SQO qualified date field
- SQL: `WHERE sqo_qualified_date_c IS NOT NULL`

### 4. Sequence Tags
- **Primary email outreach tag:** `'EmailProgram-MechOutreach'` (1,717 sequences)
- Tag names are **case-sensitive** - use exact case
- 329 total tags as of 2024-12-11
- Query to refresh: See `temp/check_sequence_tags.sql`

### 5. Code Organization
```
core/
  references/          ← Reference docs (schemas, definitions)
  sql_functions/       ← Reusable SQL functions
  clients/             ← Database clients (Snowflake, OpenAI)
  query_runner.py      ← CLI for running queries

temp/                  ← Temporary analysis queries and outputs
  _outputs/            ← Query results (CSV exports)
  
projects/              ← Long-term project work
```

### 6. When Creating New Queries

**DO:**
- Reference `core/references/PIPELINE_METRICS_DEFINITIONS.md` for correct definitions
- Model after existing queries in `core/sql_functions/`
- Add comprehensive header comments with:
  - Purpose and definitions
  - Attribution windows
  - Key assumptions
  - Tag references (if using sequence tags)
- Include interpretation notes at the end
- Export results to `temp/_outputs/`

**DON'T:**
- Guess at field names - check reference docs first
- Filter S1 by stage name - use ALL opportunities
- Use stage name for S2 - use `sqo_qualified_date_c`
- Assume tag names (they're case-sensitive)

### 7. Discoveries & Learnings
When you discover something important:

1. **Update `PIPELINE_METRICS_DEFINITIONS.md`** with the insight
2. **Add SQL examples** showing the correct pattern
3. **Document gotchas** that tripped you up
4. **Note the date** in the change log
5. **Update this .cursorrules** if it's a pattern to follow

### 8. Query Execution
- Use `python3 core/query_runner.py --sql <file> --output temp/_outputs`
- Always preview results: `--preview 10`
- Export format defaults to CSV
- Queries run against PROD_RIPPLING_DWH database

### 9. Pipeline Projector Tool
- Location: `temp/line-graph-visualizer/`
- React-based canvas visualization
- Hot reload enabled
- Update default parameters based on actual data from queries

## Common Gotchas

### Data Connection Joins
❌ **WRONG:**
```sql
JOIN data_connection dc 
  ON dc.parent_id = prospect_id
  AND dc.parent_type = 'prospect'  -- This field doesn't exist!
```

✅ **CORRECT:**
```sql
JOIN data_connection dc
  ON dc.parent_id = prospect_id
  AND dc.type IN ('Contact', 'Lead')
```

### S1/S2 Definitions
❌ **WRONG:**
```sql
-- S1 by stage name
WHERE o.stage_name ILIKE '%1 - %'

-- S2 by stage name  
WHERE o.stage_name ILIKE '%2 - %'
```

✅ **CORRECT:**
```sql
-- S1: ALL opportunities
WHERE o.is_deleted = FALSE

-- S2: SQO qualified
WHERE o.sqo_qualified_date_c IS NOT NULL
```

### Sequence Tags
❌ **WRONG:**
```sql
WHERE LOWER(tag_name) = 'mech_outreach'
```

✅ **CORRECT:**
```sql
WHERE tag_name = 'EmailProgram-MechOutreach'  -- Case-sensitive!
```

## Key Reference Queries

1. **Get all sequence tags:**
   ```sql
   SELECT tag_name, COUNT(DISTINCT sequence_id) 
   FROM prod_rippling_dwh.outreach.sequence_tag
   GROUP BY tag_name ORDER BY COUNT(*) DESC;
   ```

2. **Link prospects to opportunities:**
   - See `core/sql_functions/analyze_opp.sql` lines 72-83

3. **Calculate prospects per S1:**
   - See `temp/avg_prospects_per_s1.sql`

## Remember
- **Document as you go** - Future you (and your teammates) will thank you
- **Reference before creating** - Don't reinvent patterns
- **Definitions matter** - Use the canonical definitions in PIPELINE_METRICS_DEFINITIONS.md
- **When in doubt, check existing code** - Especially `analyze_opp.sql`

---
*Last Updated: 2024-12-11*
*Update this file when you discover new patterns or gotchas!*

