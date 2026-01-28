# Suppression Impact Query Templates

## Current Population

```sql
-- Get current eligible population
SELECT COUNT(*) as current_population
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS
WHERE IS_RECORD_SUPPRESSED IS NULL;
```

## Leads Removed (New Suppression)

Template for calculating leads that would be newly suppressed:

```sql
-- Leads REMOVED: Currently eligible, would be suppressed by new rule
SELECT 
    'Leads removed by [CHANGE_NAME]' as metric,
    COUNT(*) as lead_count,
    COUNT(DISTINCT DOMAIN) as domain_count
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
-- Add JOINs as needed for the new rule
WHERE ml.IS_RECORD_SUPPRESSED IS NULL  -- Currently eligible
  AND [NEW_SUPPRESSION_CONDITION];      -- Would be suppressed by new rule
```

**Example - MAX_EE_SIZE > 5000:**
```sql
SELECT COUNT(*) as leads_removed
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
JOIN PROD_RIPPLING_DWH.GROWTH.MASTER_DOMAIN_SOURCES mds ON ml.DOMAIN = mds.DOMAIN
WHERE ml.IS_RECORD_SUPPRESSED IS NULL
  AND mds.MAX_EE_SIZE > 5000;
```

## Leads Added (Removed Suppression)

Template for calculating leads that would become eligible:

```sql
-- Leads ADDED (gross): Currently suppressed by rule being changed
SELECT 
    'Gross leads added by [CHANGE_NAME]' as metric,
    COUNT(*) as lead_count,
    COUNT(DISTINCT DOMAIN) as domain_count
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
WHERE ml.IS_RECORD_SUPPRESSED = TRUE
  AND ml.[SUPPRESSION_FLAG_BEING_CHANGED] = TRUE
  AND [CONDITION_FOR_LEADS_NO_LONGER_SUPPRESSED];
```

**Example - Lead count threshold change (>100 to >500):**
```sql
SELECT COUNT(*) as gross_leads_added
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
WHERE ml.IS_RECORD_SUPPRESSED = TRUE
  AND ml.INELIGIBLE_COMPANY_SIZE = TRUE
  AND ml.DOMAIN IN (
    SELECT DOMAIN 
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS
    GROUP BY 1
    HAVING COUNT(*) BETWEEN 101 AND 500  -- Old threshold to new threshold
  );
```

## Net Impact (Accounting for Other Rules)

**Critical:** Many leads freed by one rule change will still be suppressed by other rules.

```sql
-- NET leads added: Would become eligible after accounting for ALL other rules
SELECT 
    'Net leads added' as metric,
    COUNT(*) as lead_count
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
WHERE ml.IS_RECORD_SUPPRESSED = TRUE
  AND ml.[SUPPRESSION_FLAG_BEING_CHANGED] = TRUE
  AND [CONDITION_FOR_LEADS_NO_LONGER_SUPPRESSED]
  -- Not suppressed by any OTHER rules:
  AND COALESCE(ml.IS_LEAD_SUPPRESSION, FALSE) = FALSE
  AND COALESCE(ml.IS_CUSTOMER, FALSE) = FALSE
  AND COALESCE(ml.IS_CHURNED, FALSE) = FALSE
  AND COALESCE(ml.IS_NAMED_ACCOUNT, FALSE) = FALSE
  AND COALESCE(ml.INELIGIBLE_INDUSTRY, FALSE) = FALSE
  AND COALESCE(ml.OPEN_OPPORTUNITY, FALSE) = FALSE
  AND COALESCE(ml.IS_COMPETITOR, FALSE) = FALSE
  AND COALESCE(ml.IS_PARTNER_ACCOUNT, FALSE) = FALSE
  AND COALESCE(ml.EE_SIZE_OUT_OF_RANGE, FALSE) = FALSE;
```

## Overlap Between Changes

When multiple changes interact, calculate the overlap:

```sql
-- Overlap: Leads that would be added by Change 2 but removed by Change 1
SELECT 
    'Overlap between changes' as metric,
    COUNT(*) as lead_count
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
-- JOINs for Change 1
WHERE [WOULD_BE_ADDED_BY_CHANGE_2]
  AND [WOULD_BE_REMOVED_BY_CHANGE_1]
  AND [PASSES_ALL_OTHER_SUPPRESSION_CHECKS];
```

## Breakdown by Suppression Reason

Show which other rules are suppressing the gross leads:

```sql
-- Breakdown: Why gross leads would still be suppressed
SELECT 
    CASE 
        WHEN IS_LEAD_SUPPRESSION = TRUE THEN 'IS_LEAD_SUPPRESSION'
        WHEN IS_CUSTOMER = TRUE THEN 'IS_CUSTOMER'
        WHEN IS_NAMED_ACCOUNT = TRUE THEN 'IS_NAMED_ACCOUNT'
        WHEN INELIGIBLE_INDUSTRY = TRUE THEN 'INELIGIBLE_INDUSTRY'
        WHEN OPEN_OPPORTUNITY = TRUE THEN 'OPEN_OPPORTUNITY'
        WHEN EE_SIZE_OUT_OF_RANGE = TRUE THEN 'EE_SIZE_OUT_OF_RANGE'
        ELSE 'Other'
    END as suppression_reason,
    COUNT(*) as lead_count
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
WHERE [WOULD_BE_AFFECTED_BY_CHANGE]
  AND (IS_LEAD_SUPPRESSION = TRUE 
       OR IS_CUSTOMER = TRUE 
       OR IS_NAMED_ACCOUNT = TRUE
       OR INELIGIBLE_INDUSTRY = TRUE
       OR OPEN_OPPORTUNITY = TRUE
       OR EE_SIZE_OUT_OF_RANGE = TRUE)
GROUP BY 1
ORDER BY lead_count DESC;
```

## Sample Affected Data

Always include sample rows to make the impact concrete:

```sql
-- Sample domains affected by change
SELECT 
    ml.DOMAIN,
    [RELEVANT_FIELDS],
    COUNT(*) as lead_count
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
WHERE [CHANGE_CONDITION]
GROUP BY 1, 2
ORDER BY lead_count DESC
LIMIT 20;
```

## Validation Query Pattern

For data quality claims, include the validation query:

```sql
-- Validation: [WHAT YOU'RE CONFIRMING]
SELECT 
    '[CHECK_NAME]' as validation,
    COUNT(*) as total,
    SUM(CASE WHEN [CONDITION] THEN 1 ELSE 0 END) as passes,
    SUM(CASE WHEN NOT [CONDITION] THEN 1 ELSE 0 END) as fails
FROM [TABLE]
WHERE [FILTERS];

-- Expected: fails = 0
```
