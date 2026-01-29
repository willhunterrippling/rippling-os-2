# SFDC History Tables Reference

Documentation for Salesforce field history tracking tables in `prod_rippling_dwh.sfdc` schema.

**IMPORTANT:** These tables track changes to specific fields on records. They are critical for understanding:
- When and how records change over time
- Who/what made changes (manual vs automation)
- Status transitions and lifecycle patterns

---

## Table of Contents
- [lead_history](#lead_history)
- [contact_history](#contact_history)
- [opportunity_history](#opportunity_history)
- [account_history](#account_history)

---

## lead_history

Tracks field changes on Lead records.

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `ID` | VARCHAR | Unique history record ID |
| `LEAD_ID` | VARCHAR | ID of the Lead record that changed |
| `CREATED_BY_ID` | VARCHAR | User ID who made the change |
| `CREATED_DATE` | TIMESTAMP | When the change occurred |
| `FIELD` | VARCHAR | Name of the field that changed |
| `OLD_VALUE` | VARCHAR | Previous value (before change) |
| `NEW_VALUE` | VARCHAR | New value (after change) |
| `IS_DELETED` | BOOLEAN | Soft delete flag |
| `_FIVETRAN_SYNCED` | TIMESTAMP | Fivetran sync timestamp |
| `_FIVETRAN_DELETED` | BOOLEAN | Fivetran delete flag |

### Critical Column Notes

**DO NOT USE:**
- `OLD_VALUE__C` - This does NOT exist!
- `NEW_VALUE__C` - This does NOT exist!

**CORRECT COLUMN NAMES:**
- `OLD_VALUE` - Previous field value
- `NEW_VALUE` - New field value

### Common FIELD Values for Status Tracking

| FIELD Value | Tracks |
|-------------|--------|
| `Status` | Lead status changes (New, Qualified, Recycled, etc.) |
| `Owner` | Lead owner changes |
| `Rating` | Lead rating changes |
| `Lead_Source` | Lead source changes |

### Example Queries

**Status transitions TO "Recycled" (last 90 days):**
```sql
SELECT 
    OLD_VALUE as from_status,
    COUNT(*) as transitions
FROM SFDC.LEAD_HISTORY
WHERE FIELD = 'Status'
  AND NEW_VALUE = 'Recycled'
  AND CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY OLD_VALUE
ORDER BY transitions DESC;
```

**Who is setting leads to "Recycled":**
```sql
SELECT 
    u.NAME as changed_by,
    COUNT(*) as changes
FROM SFDC.LEAD_HISTORY lh
LEFT JOIN SFDC."USER" u ON lh.CREATED_BY_ID = u.ID
WHERE lh.FIELD = 'Status'
  AND lh.NEW_VALUE = 'Recycled'
  AND lh.CREATED_DATE >= DATEADD('day', -30, CURRENT_DATE())
GROUP BY u.NAME
ORDER BY changes DESC
LIMIT 20;
```

**Transitions FROM a specific status:**
```sql
SELECT 
    NEW_VALUE as new_status,
    COUNT(*) as transitions
FROM SFDC.LEAD_HISTORY
WHERE FIELD = 'Status'
  AND OLD_VALUE = 'Qualified'
  AND CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY NEW_VALUE
ORDER BY transitions DESC;
```

---

## contact_history

Tracks field changes on Contact records.

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `ID` | VARCHAR | Unique history record ID |
| `CONTACT_ID` | VARCHAR | ID of the Contact record that changed |
| `CREATED_BY_ID` | VARCHAR | User ID who made the change |
| `CREATED_DATE` | TIMESTAMP | When the change occurred |
| `FIELD` | VARCHAR | Name of the field that changed |
| `OLD_VALUE` | VARCHAR | Previous value (before change) |
| `NEW_VALUE` | VARCHAR | New value (after change) |
| `IS_DELETED` | BOOLEAN | Soft delete flag |
| `_FIVETRAN_SYNCED` | TIMESTAMP | Fivetran sync timestamp |
| `_FIVETRAN_DELETED` | BOOLEAN | Fivetran delete flag |

### Critical Column Notes

**DO NOT USE:**
- `OLD_VALUE__C` - This does NOT exist!
- `NEW_VALUE__C` - This does NOT exist!

**CORRECT COLUMN NAMES:**
- `OLD_VALUE` - Previous field value
- `NEW_VALUE` - New field value

### Common FIELD Values for Status Tracking

| FIELD Value | Tracks |
|-------------|--------|
| `Person_Status_SFDC__c` | Contact person status changes |
| `Owner` | Contact owner changes |
| `Account` | Contact account changes |

### Example Query

**Contact status transitions TO "Recycled" or "No Response":**
```sql
SELECT 
    OLD_VALUE as from_status,
    NEW_VALUE as to_status,
    COUNT(*) as transitions
FROM SFDC.CONTACT_HISTORY
WHERE FIELD = 'Person_Status_SFDC__c'
  AND NEW_VALUE IN ('Recycled', 'No Response/Unable to Contact')
  AND CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY OLD_VALUE, NEW_VALUE
ORDER BY transitions DESC;
```

---

## opportunity_history

Tracks field changes on Opportunity records.

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `ID` | VARCHAR | Unique history record ID |
| `OPPORTUNITY_ID` | VARCHAR | ID of the Opportunity that changed |
| `CREATED_BY_ID` | VARCHAR | User ID who made the change |
| `CREATED_DATE` | TIMESTAMP | When the change occurred |
| `FIELD` | VARCHAR | Name of the field that changed |
| `OLD_VALUE` | VARCHAR | Previous value |
| `NEW_VALUE` | VARCHAR | New value |

### Common FIELD Values

| FIELD Value | Tracks |
|-------------|--------|
| `StageName` | Opportunity stage changes |
| `Amount` | Deal amount changes |
| `CloseDate` | Expected close date changes |
| `Owner` | Opportunity owner changes |

---

## account_history

Tracks field changes on Account records.

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `ID` | VARCHAR | Unique history record ID |
| `ACCOUNT_ID` | VARCHAR | ID of the Account that changed |
| `CREATED_BY_ID` | VARCHAR | User ID who made the change |
| `CREATED_DATE` | TIMESTAMP | When the change occurred |
| `FIELD` | VARCHAR | Name of the field that changed |
| `OLD_VALUE` | VARCHAR | Previous value |
| `NEW_VALUE` | VARCHAR | New value |

---

## Common Patterns

### Identifying Manual vs Automated Changes

Join with the USER table to identify change sources:

```sql
SELECT 
    CASE 
        WHEN u.NAME ILIKE '%integration%' 
          OR u.NAME ILIKE '%automation%' 
          OR u.NAME ILIKE '%api%' 
          OR u.NAME ILIKE '%sync%'
          OR u.NAME ILIKE '%outreach%'
        THEN 'Automated'
        ELSE 'Manual'
    END as change_type,
    COUNT(*) as changes
FROM SFDC.LEAD_HISTORY lh
LEFT JOIN SFDC."USER" u ON lh.CREATED_BY_ID = u.ID
WHERE lh.FIELD = 'Status'
  AND lh.NEW_VALUE = 'Recycled'
GROUP BY change_type;
```

### Time-based Analysis

```sql
SELECT 
    DATE_TRUNC('week', CREATED_DATE) as week,
    COUNT(*) as transitions
FROM SFDC.LEAD_HISTORY
WHERE FIELD = 'Status'
  AND NEW_VALUE = 'Recycled'
  AND CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY week
ORDER BY week;
```

---

## Known Issues / Gotchas

1. **Column naming:** History tables use `OLD_VALUE` and `NEW_VALUE`, NOT the `__C` suffix convention used for custom fields on main tables.

2. **NULL values:** `OLD_VALUE` may be NULL if the field was previously empty.

3. **Large tables:** History tables can be very large. Always filter by `CREATED_DATE` for performance.

4. **Not all fields tracked:** Only fields explicitly enabled for history tracking in Salesforce will appear.

5. **USER table quoting:** The USER table name must be quoted as `"USER"` since USER is a reserved keyword.

---

*Last Updated: 2026-01-29*
*Created to fix QA bug: v2 queries incorrectly used `OLD_VALUE__C`/`NEW_VALUE__C` instead of `OLD_VALUE`/`NEW_VALUE`*
