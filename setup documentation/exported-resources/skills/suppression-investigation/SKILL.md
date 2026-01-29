---
name: suppression-investigation
description: Investigate and debug suppression logic in SQL code. Use when analyzing why leads/records are being suppressed, breaking down CASE statement logic, identifying bugs in order of evaluation, or when the user mentions suppression rates seem too high.
---

# Suppression Logic Investigation

Investigate suppression logic to understand what is excluding records and identify potential bugs.

## Quick Start

1. **Locate the suppression logic** in the source SQL (look for CASE statements that return TRUE/FALSE for suppression flags)
2. **Extract all conditions** from the CASE statement
3. **Create diagnostic query** that breaks down each condition's impact
4. **Run query** and analyze results
5. **Document findings** in a report with recommendations

## Investigation Workflow

### Step 1: Locate Source Logic

Find the CASE statement defining the suppression flag. Document:
- File path and line numbers
- The suppression flag name (e.g., `INELIGIBLE_PERSONA`)
- All WHEN clauses and their conditions

### Step 2: Create Diagnostic Query

Build a CTE-based query with these sections:

```sql
WITH
-- 1. Base data with any needed joins
base_data AS (...),

-- 2. Define allowed/excluded value lists as CTEs
allowed_values AS (
    SELECT * FROM VALUES ('value1'), ('value2') AS t(val)
),

-- 3. Classify each record by condition
classified_records AS (
    SELECT 
        base.*,
        -- Each condition as a boolean flag
        CASE WHEN <condition_1> THEN TRUE ELSE FALSE END AS condition_1_flag,
        CASE WHEN <condition_2> THEN TRUE ELSE FALSE END AS condition_2_flag,
        -- Bug detection flags
        CASE WHEN <bug_scenario> THEN TRUE ELSE FALSE END AS bug_1_flag
    FROM base_data base
),

-- 4. Summary sections (see Query Structure below)
```

### Step 3: Query Structure

Include these analysis sections:

| Section | Purpose |
|---------|---------|
| Overall Summary | Total records, suppressed count, suppression rate |
| Condition Breakdown | Count per condition (which WHEN clause triggered) |
| Value Discovery | All distinct values for key fields (find unexpected values) |
| Values Not Allowed | Values being suppressed that aren't in allowed list |
| Segment Analysis | Suppression rates by segment/category |
| Bug Detection | Records affected by identified bugs |
| Distribution | Suppression rate by each value of the key field |

### Step 4: Bug Detection Patterns

Check for these common bugs:

**Order of Evaluation Bug**: Exclusions checked before exceptions
```sql
-- Detects: Record has exception (allowed_value) but still gets suppressed
CASE 
    WHEN has_allowed_value = TRUE 
        AND matches_exclusion_condition = TRUE
    THEN TRUE  -- This is a bug
    ELSE FALSE 
END AS bug_order_of_evaluation
```

**Case Sensitivity Bug**: Mixed LIKE vs ILIKE
```sql
-- Detects: ILIKE matches but LIKE doesn't
CASE 
    WHEN value ILIKE 'pattern%' AND value NOT LIKE 'PATTERN%'
    THEN TRUE  -- Case sensitivity issue
    ELSE FALSE 
END AS bug_case_sensitivity
```

### Step 5: Run and Analyze

Run the diagnostic query:
```bash
cd /Users/will/Documents/rippling-os && python3 core/query_runner.py --sql <query_file.sql> --output temp/_outputs --preview 60
```

### Step 6: Document Findings

Create a report with:
- Executive Summary (key findings, bug impacts)
- Data tables from query results
- Bug descriptions with example scenarios
- Recommendations prioritized by impact

## Report Template

See [report-template.md](report-template.md) for the full report structure.

## Bug Sample Queries

When bugs are identified, create separate queries to pull sample records:

```sql
-- Sample query for bug verification
SELECT 
    key_identifiers,
    relevant_fields,
    suppression_flag,
    bug_detection_fields
FROM classified_records
WHERE bug_flag = TRUE
ORDER BY RANDOM()
LIMIT 100;
```

## Common Fix Patterns

### Order of Evaluation Fix

**Before** (bug - exclusion checked first):
```sql
CASE
    WHEN exclusion_condition THEN TRUE  -- Checked first, overrides exception
    WHEN exception_condition THEN FALSE
    ELSE TRUE
END
```

**After** (fix - exception checked first):
```sql
CASE
    WHEN exception_condition THEN FALSE  -- Checked first, as intended
    WHEN exclusion_condition THEN TRUE
    ELSE TRUE
END
```

## Files to Create

For each investigation, create:

```
projects/<issue_name>/
├── diagnostic_queries/
│   ├── ##_<suppression_field>_breakdown.sql    # Main diagnostic
│   ├── ##b_bug_samples_<bug_name>.sql          # Bug 1 samples
│   └── ##c_bug_samples_<bug_name>.sql          # Bug 2 samples
├── reports/
│   └── <SUPPRESSION_FIELD>_BREAKDOWN.md        # Final report
└── source_files/
    └── <original_source>.sql                   # Copy of source logic
```
