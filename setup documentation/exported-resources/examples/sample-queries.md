# Sample Queries and Patterns

Common query patterns from the rippling-os repository.

---

## S1 (Stage 1) - All Opportunities

```sql
-- S1: Count ALL opportunities (do NOT filter by stage name)
SELECT COUNT(DISTINCT id) AS s1_count
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE;
```

## S2 (Stage 2) - SQO Qualified

```sql
-- S2: Opportunities with SQO qualified date
SELECT COUNT(DISTINCT id) AS s2_count
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
  AND sqo_qualified_date_c IS NOT NULL;
```

## Link Prospects to Salesforce

```sql
-- Link Outreach prospects to SFDC contacts/leads
SELECT 
    p.id AS prospect_id,
    p.email AS prospect_email,
    dc.id AS sfdc_id,
    dc.type AS sfdc_type
FROM prod_rippling_dwh.outreach.prospect p
JOIN prod_rippling_dwh.outreach.data_connection dc
    ON dc.parent_id = p.id
    AND dc.type IN ('Contact', 'Lead')
LIMIT 100;
```

## Sequence State with Delivery

```sql
-- Prospects who received emails from sequences
SELECT 
    ss.relationship_prospect_id,
    ss.relationship_sequence_id,
    ss.deliver_count,
    ss.reply_count,
    ss.created_at
FROM prod_rippling_dwh.outreach.sequence_state ss
WHERE ss.deliver_count > 0
  AND ss._fivetran_deleted = FALSE
  AND ss.relationship_sequence_id IS NOT NULL
LIMIT 100;
```

## Sequence Tags

```sql
-- Get all sequence tags with counts
SELECT 
    tag_name,
    COUNT(DISTINCT sequence_id) AS num_sequences
FROM prod_rippling_dwh.outreach.sequence_tag
GROUP BY tag_name
ORDER BY num_sequences DESC;
```

## Email Program MechOutreach Sequences

```sql
-- Sequences tagged with EmailProgram-MechOutreach
SELECT 
    s.id,
    s.name,
    s.num_contacted_prospects,
    s.num_replied_prospects
FROM prod_rippling_dwh.outreach.sequence s
JOIN prod_rippling_dwh.outreach.sequence_tag st
    ON st.sequence_id = s.id
WHERE st.tag_name = 'EmailProgram-MechOutreach'  -- Case-sensitive!
ORDER BY s.num_contacted_prospects DESC
LIMIT 50;
```

## Attribution Window (45 Days)

```sql
-- Link prospects to opportunities within 45-day window
SELECT 
    o.id AS opportunity_id,
    o.name AS opportunity_name,
    o.created_date AS opp_created_date,
    ss.relationship_prospect_id,
    ss.created_at AS sequence_created_at
FROM prod_rippling_dwh.sfdc.opportunity o
JOIN prod_rippling_dwh.sfdc.opportunity_contact_role ocr
    ON ocr.opportunity_id = o.id
JOIN prod_rippling_dwh.outreach.data_connection dc
    ON dc.id = ocr.contact_id
    AND dc.type IN ('Contact', 'Lead')
JOIN prod_rippling_dwh.outreach.sequence_state ss
    ON ss.relationship_prospect_id = dc.parent_id
WHERE o.is_deleted = FALSE
  AND ABS(DATEDIFF('day', ss.created_at, o.created_date)) <= 45
  AND ss.deliver_count > 0
LIMIT 100;
```

## Lead Status Distribution

```sql
-- Distribution of lead statuses
SELECT 
    status,
    COUNT(*) AS count
FROM prod_rippling_dwh.sfdc.lead
WHERE is_deleted = FALSE
GROUP BY status
ORDER BY count DESC;
```

## Mailing States

```sql
-- Distribution of mailing states
SELECT 
    state,
    COUNT(*) AS count
FROM prod_rippling_dwh.outreach.mailing
WHERE _fivetran_deleted = FALSE
GROUP BY state
ORDER BY count DESC;
```

---

## Key Tables Quick Reference

| Schema | Table | Purpose |
|--------|-------|---------|
| `outreach` | `prospect` | Contact/lead records (~25M) |
| `outreach` | `sequence` | Email sequences (~22K) |
| `outreach` | `sequence_state` | Prospect enrollment in sequences (~35M) |
| `outreach` | `sequence_tag` | Sequence categorization tags |
| `outreach` | `mailing` | Individual emails (~105M) |
| `outreach` | `data_connection` | Links Outreach to SFDC (~153M) |
| `sfdc` | `opportunity` | Sales opportunities (~622K) |
| `sfdc` | `lead` | Lead records (~18.7M) |
| `sfdc` | `contact` | Contact records (~1.2M) |
| `sfdc` | `account` | Account records (~681K) |

---

## Common Pitfalls

### Wrong: Filtering S1 by stage name
```sql
-- DON'T DO THIS
WHERE stage_name ILIKE '%1 - %'
```

### Wrong: Using parent_type on data_connection
```sql
-- DON'T DO THIS - parent_type doesn't exist
AND dc.parent_type = 'prospect'
```

### Wrong: Case-insensitive tag matching
```sql
-- DON'T DO THIS
WHERE LOWER(tag_name) = 'emailprogram-mechoutreach'
```

### Right: Proper patterns
```sql
-- S1: All opportunities
WHERE is_deleted = FALSE

-- S2: SQO qualified
WHERE sqo_qualified_date_c IS NOT NULL

-- Tag matching (case-sensitive)
WHERE tag_name = 'EmailProgram-MechOutreach'

-- Data connection join
AND dc.type IN ('Contact', 'Lead')
```
