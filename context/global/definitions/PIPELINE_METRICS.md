# Pipeline Metrics & Definitions Reference

**Purpose:** Canonical definitions for pipeline stages, metrics, and calculations used across all analyses and projections.

**Last Updated:** 2024-12-11  
**Owner:** Growth Team

---

## Table of Contents
- [Opportunity Stage Definitions](#opportunity-stage-definitions)
- [Sequence Tags Reference](#sequence-tags-reference)
- [Attribution Windows](#attribution-windows)
- [Key Metrics & Calculations](#key-metrics--calculations)
- [Data Quality Notes](#data-quality-notes)

---

## Opportunity Stage Definitions

### S1 - Stage 1 (Any Opportunity)

**Definition:** **ANY opportunity created in Salesforce**, regardless of stage name.

**Rationale:**
- Stage names change frequently over time
- Different teams/record types use different naming conventions
- Counting all opportunities provides consistent, reliable metrics
- More inclusive = better for capacity planning

**SQL Implementation:**
```sql
-- S1: Count ALL opportunities
SELECT COUNT(DISTINCT opportunity_id) AS s1_count
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
```

**Common Stage Names (for reference only, NOT used for filtering):**
- `1 - Qualify Need`
- `Stage 1`
- `Qualification`
- `Discovery`

### S2 - Stage 2 (SQO Qualified)

**Definition:** Any opportunity where `sqo_qualified_date_c` is populated.

**Rationale:**
- `sqo_qualified_date_c` is a reliable, stable field
- Indicates opportunity has passed SQO (Sales Qualified Opportunity) criteria
- Not dependent on changing stage names
- Clear, objective criterion

**SQL Implementation:**
```sql
-- S2: Opportunities with SQO qualified date
SELECT COUNT(DISTINCT opportunity_id) AS s2_count
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
  AND sqo_qualified_date_c IS NOT NULL
```

**Key Field:**
- `sfdc.opportunity.sqo_qualified_date_c` - SQO qualification date

### ⚠️ Important Notes

1. **DO NOT filter S1 by stage name** - Use ALL opportunities
2. **DO NOT use stage name for S2** - Use `sqo_qualified_date_c` field
3. Stage names are for reporting/context only, not for metric definitions
4. Always use `is_deleted = FALSE` and `_fivetran_deleted = FALSE`

---

## Sequence Tags Reference

### Overview
Sequences in Outreach are organized using tags. As of **2024-12-11**, there are **329 distinct tags** in `prod_rippling_dwh.outreach.sequence_tag`.

### Primary Tags for Analysis

#### EmailProgram-MechOutreach
- **Count:** 1,717 sequences
- **Purpose:** Email-based mechanism outreach sequences
- **Use Case:** Primary tag for analyzing email outreach performance
- **SQL:** `WHERE tag_name = 'EmailProgram-MechOutreach'`

#### Other Email Program Tags
- `EmailProgram-DirectMail` - 3,982 sequences
- `EmailProgram-SalesManual` - 1,132 sequences
- `EmailProgram-EngagementFUP` - 965 sequences (Follow-up)
- `EmailProgram-AutomatedIntent` - 338 sequences
- `EmailProgram-IAFU` - 303 sequences (Intent Auto Follow Up)

### Top Sequence Tags (by sequence count)

| Tag Name | Sequence Count | Notes |
|----------|----------------|-------|
| Cold Outbound | 11,018 | Largest category |
| Product-HR | 10,104 | Product-specific |
| include_attribution | 8,295 | Attribution tracking |
| API outbound | 6,344 | API-driven sequences |
| EmailProgram-DirectMail | 3,982 | Direct mail campaigns |
| Direct Mail | 3,887 | Legacy direct mail |
| Cross sell | 3,019 | Cross-sell sequences |
| Marketing | 2,735 | Marketing-driven |
| CONVERSION | 1,941 | Conversion-focused |
| STAGING | 1,781 | Staging/testing |
| **EmailProgram-MechOutreach** | **1,717** | **Primary email outreach** |

### Getting Updated Tag List

```sql
-- Query to get all sequence tags with counts
SELECT 
    tag_name,
    COUNT(DISTINCT sequence_id) AS num_sequences,
    COUNT(*) AS total_records
FROM prod_rippling_dwh.outreach.sequence_tag
GROUP BY tag_name
ORDER BY num_sequences DESC;
```

**Query Location:** `temp/check_sequence_tags.sql`

### ⚠️ Important Notes

1. **Tag names are case-sensitive** - Use exact case: `'EmailProgram-MechOutreach'`
2. **Do NOT use LOWER()** on tag_name unless you verify all variants
3. Tags can be added/removed - periodically refresh your understanding
4. Some sequences have multiple tags - use appropriate filtering logic

---

## Attribution Windows

### Standard Attribution Window: 45 Days

**Definition:** Link prospects to opportunities if the opportunity was created within 45 days of `sequence_state.created_at`.

**Rationale:**
- Proven pattern from `analyze_opp.sql` function
- Balances attribution accuracy vs. inflation
- Standard for B2B SaaS motion
- Uses `sequence_state.created_at` (when prospect entered sequence), not enrollment date

**SQL Implementation:**
```sql
WHERE ABS(DATEDIFF('day', sequence_state.created_at, opp_created_date)) <= 45
```

**Key Points:**
- Use `sequence_state.created_at` not prospect enrollment date
- Compare against `opportunity.created_date`
- Always check `sequence_state.relationship_sequence_id IS NOT NULL`
- Only include `sequence_state.deliver_count > 0`

### Alternative Windows

- **30 days** - Fast-moving products, high-velocity sales
- **45 days** - **Standard B2B SaaS (RECOMMENDED - matches analyze_opp)**
- **60 days** - Slightly longer sales cycles
- **90 days** - Complex deals, enterprise sales (use for extended analysis)
- **180 days** - Very long sales cycles (use with caution - attribution inflation risk)

---

## Key Metrics & Calculations

### Prospects Per S1

**Definition:** Average number of unique prospects contacted per S1 opportunity created.

**Formula:**
```
Prospects Per S1 = Total Unique Prospects / Total S1 Opportunities
```

**Use Case:** Capacity planning for total opportunity generation

**SQL Example:**
```sql
SELECT 
    COUNT(DISTINCT prospect_id) / NULLIF(COUNT(DISTINCT opportunity_id), 0) AS prospects_per_s1
FROM prospect_to_opportunities
```

**Typical Range:** 800 - 2,500 (varies by sequence quality, ICP fit)

### Prospects Per S2

**Definition:** Average number of unique prospects contacted per S2 (SQO qualified) opportunity.

**Formula:**
```
Prospects Per S2 = Total Unique Prospects / Total S2 Opportunities
```

**Use Case:** Capacity planning for qualified opportunity generation

**SQL Example:**
```sql
SELECT 
    COUNT(DISTINCT prospect_id) / NULLIF(COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL THEN opportunity_id END), 0) AS prospects_per_s2
FROM prospect_to_opportunities
```

**Typical Range:** 1,500 - 4,000 (higher than S1, as not all S1s become S2s)

### S1 → S2 Conversion Rate

**Definition:** Percentage of S1 opportunities that become S2 (SQO qualified).

**Formula:**
```
S1 → S2 Rate = (Total S2 Opportunities / Total S1 Opportunities) × 100
```

**Typical Range:** 30% - 60%

---

## Data Quality Notes

### Prospect-to-SFDC Linking

**Critical Join Pattern:**
```sql
-- Link Outreach prospects to Salesforce contacts/leads
FROM prod_rippling_dwh.outreach.data_connection dc
WHERE dc.parent_id = prospect_id
  AND dc.type IN ('Contact', 'Lead')
```

**⚠️ Important:**
- Do NOT add `dc.parent_type = 'prospect'` - this field doesn't exist
- Always use `dc.type IN ('Contact', 'Lead')` for the SFDC side
- Join pattern is based on `analyze_opp.sql` function (proven pattern)

### Sequence State Filtering

```sql
-- Only count prospects who received emails
WHERE ss.deliver_count > 0
  AND ss._fivetran_deleted = FALSE
```

### Opportunity Filtering

```sql
-- Always exclude deleted opportunities
WHERE o.is_deleted = FALSE
  AND o._fivetran_deleted = FALSE
```

---

## Related Files & Queries

### Core Functions
- `core/sql_functions/analyze_opp.sql` - Opportunity analysis with attribution
- `temp/avg_prospects_per_s1.sql` - Prospects per S1/S2 calculation

### Reference Documents
- `core/references/OUTREACH_TABLES.md` - Outreach schema documentation
- `core/references/SFDC_TABLES.md` - Salesforce schema documentation

### Utilities
- `temp/check_sequence_tags.sql` - Query to get all sequence tags
- `temp/run_avg_prospects_per_s1.py` - Runner for prospects per S1/S2 analysis

---

## Change Log

### 2024-12-11 (Updated)
- **Corrected attribution window to 45 days** to match `analyze_opp.sql` function
- Attribution uses `sequence_state.created_at` not enrollment date
- Added sequence state filtering requirements: `relationship_sequence_id IS NOT NULL` and `deliver_count > 0`

### 2024-12-11
- **Initial creation** of pipeline metrics definitions
- Established S1 = ALL opportunities (no stage filter)
- Established S2 = opportunities with `sqo_qualified_date_c`
- Documented EmailProgram-MechOutreach as primary email outreach tag
- Catalogued 329 sequence tags with top tags by count
- Documented critical data quality patterns (prospect linking, etc.)

---

## Contributing

When you discover new insights about pipeline metrics:

1. **Document immediately** - Don't rely on memory
2. **Update this file** - Keep it current and accurate
3. **Include SQL examples** - Show, don't just tell
4. **Note the date** - Track when insights were discovered
5. **Reference source queries** - Link to the analysis that revealed the insight

**Remember:** This document should be the **single source of truth** for pipeline metrics definitions.

---

*This is a living document. Update it whenever you discover new patterns, gotchas, or best practices.*

