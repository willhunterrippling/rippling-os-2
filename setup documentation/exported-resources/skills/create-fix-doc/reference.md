# Fix Doc Reference Example

This is a complete example of a fix doc, based on a real bug investigation.

---

# Cursor Prompt: Fix INELIGIBLE_COMPANY_SIZE Suppression Logic

## Context

Copy this entire file into Cursor as a prompt when working in the `airflow_dags` repository.

**IMPORTANT:** This folder contains pre-computed query results from Snowflake. Review the CSV files before making changes - they provide the data needed to understand the issue without needing Snowflake access.

---

## Pre-Computed Query Results

The following CSV files contain investigation data (generated 2026-01-23):

| File | Description |
|------|-------------|
| `step1_sample_unknown_records.csv` | 100 sample records from the "Unknown" category |
| `step2_contact_vs_lead.csv` | Breakdown by SFDC object type |
| `step3_red_linkage.csv` | Related Email Domain (RED) analysis for leads |
| `step4_other_account_suppressions.csv` | Other suppression flags active on "Unknown" records |
| `step5_tam_impact_if_fixed.csv` | **KEY DATA** - Actual TAM impact if bug is fixed |
| `step6_full_breakdown_summary.csv` | Complete breakdown of INELIGIBLE_COMPANY_SIZE reasons |

---

## Bug Report: INELIGIBLE_COMPANY_SIZE Suppressing Valid Leads

### Summary

**831,360 leads (15.45% of INELIGIBLE_COMPANY_SIZE suppressions)** are being marked as ineligible with no clear reason from the company size logic. However, investigation revealed that **most of these leads have OTHER suppression flags active**.

### Corrected TAM Impact

| Category | Lead Count |
|----------|------------|
| Total "Unknown" records | 831,359 |
| Would still be suppressed (other account flags) | 645,134 |
| Would still be suppressed (lead-level flags) | 564,976 |
| **Would become ELIGIBLE (no other suppressions)** | **69,813** |

### Root Cause (Suspected)

The INELIGIBLE_COMPANY_SIZE flag is being incorrectly set to TRUE. The suppression logic checks multiple paths that can return NULL:
```
INELIGIBLE_COMPANY_SIZE = 
    accounts_suppression_data.INELIGIBLE_SIZE = TRUE
    OR leads_red_account_suppression.INELIGIBLE_SIZE = TRUE  ← Can be NULL
    OR combined_data.domain IN (SELECT website FROM large_companies)
```

### Full Breakdown (from `step6_full_breakdown_summary.csv`)

| # | Suppression Reason | Lead Count | % |
|---|-------------------|------------|---|
| 1 | Domain EE >5000 (working as designed) | 544,550 | 10.12% |
| 2 | Lead EE_SIZE is NULL (data quality) | 9,760 | 0.18% |
| 3 | Lead EE_SIZE is 0 (data quality) | 63,830 | 1.19% |
| 4 | Lead EE_SIZE >5000 (working as designed) | 227,033 | 4.22% |
| 5 | Domain >100 leads (working as designed) | 3,704,676 | 68.84% |
| 6 | **Other/Unknown (needs investigation)** | **831,360** | **15.45%** |

---

## File to Fix

**Path:** `airflow_dags/resources/growth/sqls/mo_leads_suppression_analytics/mo_leads_with_suppression.sql`

---

## Key Findings from Investigation Data

### From `step1_sample_unknown_records.csv`

Sample records show:
- All have `ACCOUNT_SEGMENT` populated (ENT, MM, etc.) - meaning account DOES match a segment
- All have `IS_ACCOUNT_SUPPRESSED = TRUE` - meaning another account flag is also active
- Most are from the same domain (clustered data)

### From `step2_contact_vs_lead.csv`

| Object Type | Count | % |
|-------------|-------|---|
| CONTACT | 383,987 | 46.19% |
| LEAD | 447,372 | 53.81% |

The issue affects both Contacts and Leads roughly equally - it's NOT specifically a Contact issue.

### From `step4_other_account_suppressions.csv`

| Other Suppression Flag | Count | % of "Unknown" |
|------------------------|-------|----------------|
| Is Named Account | 464,841 | 55.91% |
| Is Customer | 99,774 | 12.00% |
| Ineligible Industry | 74,245 | 8.93% |
| Is Partner Account | 41,044 | 4.94% |
| Open Opportunity | 25,938 | 3.12% |

**Key Finding:** 55.91% of "Unknown" records are also Named Accounts.

---

## Specific Changes Required

### Fix 1: Add COALESCE to INELIGIBLE_SIZE check (Lines 1176-1178)

**Current code:**
```sql
accounts_suppression_data.INELIGIBLE_SIZE = true OR leads_red_account_suppression.INELIGIBLE_SIZE = true
or combined_data.domain in (select website from large_companies)
INELIGIBLE_COMPANY_SIZE
```

**Fixed code:**
```sql
COALESCE(accounts_suppression_data.INELIGIBLE_SIZE, FALSE) = TRUE 
    OR COALESCE(leads_red_account_suppression.INELIGIBLE_SIZE, FALSE) = TRUE
    OR combined_data.domain IN (SELECT website FROM large_companies)
AS INELIGIBLE_COMPANY_SIZE
```

### Fix 2: Add COALESCE to account CTE INELIGIBLE_SIZE (Lines 841-843)

**Current code:**
```sql
CASE
    WHEN mesr.segment is not null OR ACCOUNTS.ID IS NULL THEN FALSE ELSE TRUE
END INELIGIBLE_SIZE
```

**Fixed code:**
```sql
CASE
    WHEN ACCOUNTS.ID IS NULL THEN FALSE  -- No account = not ineligible (handled elsewhere)
    WHEN ACCOUNTS.NUMBER_OF_EMPLOYEES IS NULL THEN TRUE  -- Explicit: NULL EE = ineligible
    WHEN mesr.segment IS NOT NULL THEN FALSE  -- Matches a segment = not ineligible
    ELSE TRUE  -- Doesn't match any segment = ineligible
END INELIGIBLE_SIZE
```

---

## Test Queries

After deploying the fix, run these queries to verify:

### 1. Check INELIGIBLE_COMPANY_SIZE breakdown

```sql
WITH domain_sizes AS (
    SELECT DOMAIN, EE_SIZE as domain_ee_size
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_DOMAIN_SOURCES
),
lead_counts_by_domain AS (
    SELECT DOMAIN, COUNT(*) as leads_on_domain
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS
    GROUP BY 1
)
SELECT 
    CASE 
        WHEN ds.domain_ee_size > 5000 THEN '1. Domain EE >5000'
        WHEN ml.EE_SIZE IS NULL THEN '2. Lead EE_SIZE is NULL'
        WHEN ml.EE_SIZE = 0 THEN '3. Lead EE_SIZE is 0'
        WHEN ml.EE_SIZE > 5000 THEN '4. Lead EE_SIZE >5000'
        WHEN lcd.leads_on_domain > 100 THEN '5. Domain >100 leads'
        ELSE '6. Other/Unknown'
    END as suppression_reason,
    COUNT(*) as lead_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pct
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS ml
LEFT JOIN domain_sizes ds ON ds.DOMAIN = SPLIT_PART(ml.EMAIL, '@', 2)
LEFT JOIN lead_counts_by_domain lcd ON lcd.DOMAIN = ml.DOMAIN
WHERE ml.INELIGIBLE_COMPANY_SIZE = TRUE
GROUP BY 1
ORDER BY 1;
-- Expected: "6. Other/Unknown" should decrease significantly after fix
```

### 2. Verify no regressions

```sql
SELECT 
    IS_CUSTOMER,
    IS_COMPETITOR,
    IS_CHURNED,
    COUNT(*) as cnt
FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS
WHERE COALESCE(IS_RECORD_SUPPRESSED, FALSE) = FALSE
GROUP BY 1, 2, 3
HAVING IS_CUSTOMER = TRUE OR IS_COMPETITOR = TRUE OR IS_CHURNED = TRUE;
-- Expected: Should return 0 rows
```

---

## Why This Happened

### The NULL OR FALSE Problem

In Snowflake:
```sql
SELECT FALSE OR NULL;  -- Returns NULL (not FALSE!)
SELECT TRUE OR NULL;   -- Returns TRUE (short-circuit)
```

### The leads_red_account_suppression Issue

1. `leads_red_account_suppression` joins on `leads.RELATED_EMAIL_DOMAIN_C`
2. For **contacts**, this field doesn't exist → JOIN returns NULL for all fields
3. For **leads without RED**, this field is NULL → JOIN returns NULL
4. When checking `leads_red_account_suppression.INELIGIBLE_SIZE`:
   - If account is ineligible: `TRUE OR NULL = TRUE` (correct)
   - If account is eligible: `FALSE OR NULL = NULL` (BUG - should be FALSE)

---

## Backfill Requirement

After deploying the fix, the DAG runs every 4 hours (`45 */4 * * *`), so the next scheduled run should fix the data automatically.

**Expected outcome after fix:**
- ~70K new leads become eligible for MO
- "Other/Unknown" category drops to near 0
- No regressions in other suppression flags

---

## Related Files

- **DAG:** `airflow_dags/dags/growth/new_mech_outreach_leads_table_dag_with_suppression.py`
- **Main SQL:** `airflow_dags/resources/growth/sqls/mo_leads_suppression_analytics/mo_leads_with_suppression.sql`
- **large_companies Query:** `airflow_dags/resources/growth/scripts/suppression/queries.py` (lines 1-33)
- **Segment Ranges Table:** `GROWTH.mech_outreach_segment_ranges`

---

## Contact

This analysis was generated on 2026-01-23. Data counts may have changed since then.
