<!-- Source: SUPPRESSION_INVESTIGATION_REPORT.md -->
<!-- Added: 2026-01-29 -->
<!-- Type: Definitions - Investigation Report -->

# MO Suppression Investigation Report

**Date:** 2026-01-22  
**Investigated by:** Data Analysis Team

---

## Executive Summary

An investigation into suspected "stale suppressions" in the Mechanized Outreach (MO) population revealed that **the suppression system is working correctly**. The original queries were checking the wrong data source (OMC dates) instead of the actual suppression triggers (Outreach activity dates).

### Key Findings

| Finding | Status |
|---------|--------|
| Stale suppressions (records incorrectly suppressed) | **0 records** |
| Suppression system working correctly | **Yes** |
| Original query checking correct field | **No** (was checking OMC, should check Outreach activity) |

---

## Investigation Background

### Original Hypothesis

The `stale_suppressions.sql` query identified 28,627 records that appeared "stale" because:
- `sixty_day_lookback_suppression = TRUE` (suppressed)
- Last OMC (Outbound Marketing Communication) was > 60 days ago

This suggested these records should have been unsuppressed but weren't.

### The Problem with the Original Query

The original query checked `sfdc.outbound_marketing_communication_c.created_date`, but **this field is NOT used for lookback suppression**.

---

## Actual Suppression Logic

From `mo_population_table.sql` (lines 238-242):

```sql
CASE
    WHEN OUTREACH_LEADS_LAST_60_DAYS.EMAIL IS NOT NULL
    OR (master_leads.LAST_ACTIVITY_DATE IS NOT NULL AND master_leads.LAST_ACTIVITY_DATE > CURRENT_DATE() - 60)
    OR (master_leads.ADDED_TO_SEQUENCE IS NOT NULL and master_leads.ADDED_TO_SEQUENCE > CURRENT_DATE() - 60)
THEN TRUE ELSE FALSE END SIXTY_DAY_LOOKBACK_SUPPRESSION
```

### Suppression Triggers (What Actually Matters)

| Source | Field | Description |
|--------|-------|-------------|
| Outreach | `TOUCHED_AT` | When an SDR touches the prospect in Outreach |
| Outreach | `ENGAGED_AT` | When the prospect engages (opens, clicks, replies) |
| SFDC | `LAST_ACTIVITY_DATE` | Any activity on the lead/contact in Salesforce |
| Master Leads | `ADDED_TO_SEQUENCE` | When the record was added to a sequence |

### What Does NOT Trigger Suppression

| Source | Field | Why Not Used |
|--------|-------|--------------|
| SFDC | `outbound_marketing_communication_c.created_date` | Legacy field, not in suppression logic |

---

## Analysis Results

### 28,627 "Stale" Records - Actual Suppression Reasons

Every single "stale" record has a legitimate recent activity:

| Actual Suppression Reason | Count | % |
|---------------------------|-------|---|
| Outreach TOUCHED_AT (recent) | 23,536 | 82.2% |
| Outreach ENGAGED_AT (recent) | 4,420 | 15.4% |
| SFDC LAST_ACTIVITY_DATE (recent) | 671 | 2.3% |
| **Truly Stale (all sources > 60 days)** | **0** | **0%** |

### Full Suppression Population Breakdown (324,017 records)

All records with `sixty_day_lookback_suppression = TRUE`:

| Primary Suppression Reason | Count | % |
|---------------------------|-------|---|
| Outreach TOUCHED_AT | 309,689 | 95.58% |
| SFDC LAST_ACTIVITY_DATE | 7,872 | 2.43% |
| Outreach ENGAGED_AT | 6,456 | 1.99% |
| **Total** | **324,017** | **100%** |

### Outreach TOUCHED_AT Recency (for the 28,627 "stale by OMC" records)

For the subset of records where OMC > 60 days (the original "stale" records), here's the Outreach touched_at distribution:

| TOUCHED_AT Recency | Count | % |
|--------------------|-------|---|
| 0-7 days (very recent) | 541 | 1.89% |
| 8-14 days | 508 | 1.77% |
| 15-30 days | 605 | 2.11% |
| 31-45 days | 1,313 | 4.59% |
| 46-60 days (near cutoff) | 20,569 | 71.85% |
| 60+ days | 5,078 | 17.74% |
| No Outreach data | 13 | 0.05% |
| **Total** | **28,627** | **100%** |

**Note:** The 5,078 records with touched_at > 60 days are still suppressed by other sources (ENGAGED_AT or SFDC LAST_ACTIVITY_DATE).

---

## Christian Query Analysis

The `christian_query.sql` shows records with OMC in the last 60 days and calculates `days_until_unsuppressed`. 

### Important Caveat

The `days_until_unsuppressed` column is **misleading** because:
1. It calculates days until OMC falls outside 60-day window
2. But OMC is NOT what triggers suppression
3. Records will likely remain suppressed due to Outreach TOUCHED_AT

### Breakdown of 288,785 Records

| Primary Suppression Reason | Count | % |
|---------------------------|-------|---|
| Outreach TOUCHED_AT | 280,436 | 97.11% |
| SFDC LAST_ACTIVITY_DATE | 6,612 | 2.29% |
| Outreach ENGAGED_AT | 1,737 | 0.60% |

---

## Conclusions

### No Bugs Found

1. **The suppression system is working correctly.** Every suppressed record has legitimate recent activity.

2. **The original "stale suppression" query was checking the wrong field.** OMC dates are not used for lookback suppression.

### Recommendations

1. **Update `stale_suppressions.sql`** to check actual suppression triggers (Outreach touched_at, engaged_at, SFDC last_activity_date) instead of OMC dates.

2. **Update `christian_query.sql`** to show actual suppression source dates instead of OMC dates for the `days_until_unsuppressed` calculation.

3. **Document the suppression logic** clearly so future analyses check the correct fields.

---

## Appendix: Reports Generated

| File | Description |
|------|-------------|
| `reports/christian_query_suppression_breakdown.csv` | Breakdown of suppression reasons for christian_query records |
| `reports/executive_summary.csv` | High-level summary statistics |
| `reports/stale_by_days_since_omc.csv` | Distribution by days since OMC (note: OMC not used for suppression) |

---

## Appendix: Corrected Stale Detection Query

To find truly stale records (if any exist), use this query instead:

```sql
WITH suppressed_records AS (
    SELECT pop.lead_salesforce_id, pop.email
    FROM prod_rippling_dwh.growth.mechanized_outreach_population pop
    WHERE pop.sixty_day_lookback_suppression = TRUE
),
outreach_activity AS (
    SELECT pe.email,
        MAX(p.touched_at) as last_touched_at,
        MAX(p.engaged_at) as last_engaged_at
    FROM prod_rippling_dwh.outreach.prospect p
    JOIN prod_rippling_dwh.outreach.prospect_email pe ON p.id = pe.prospect_id
    WHERE pe.email IN (SELECT email FROM suppressed_records)
    GROUP BY pe.email
),
master_data AS (
    SELECT salesforce_id, last_activity_date, added_to_sequence
    FROM prod_rippling_dwh.growth.master_mech_outreach_leads
    WHERE salesforce_id IN (SELECT lead_salesforce_id FROM suppressed_records)
)
SELECT sr.*
FROM suppressed_records sr
LEFT JOIN outreach_activity oa ON sr.email = oa.email
LEFT JOIN master_data md ON sr.lead_salesforce_id = md.salesforce_id
WHERE (oa.last_touched_at IS NULL OR oa.last_touched_at < CURRENT_DATE() - 60)
  AND (oa.last_engaged_at IS NULL OR oa.last_engaged_at < CURRENT_DATE() - 60)
  AND (md.last_activity_date IS NULL OR md.last_activity_date < CURRENT_DATE() - 60)
  AND (md.added_to_sequence IS NULL OR md.added_to_sequence < CURRENT_DATE() - 60);
-- This query returns 0 records, confirming no truly stale suppressions exist
```
