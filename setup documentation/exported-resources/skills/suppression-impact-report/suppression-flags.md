# MO Suppression Flags Reference

## Key Tables

| Table | Purpose |
|-------|---------|
| `PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS` | Main suppression table with all flags |
| `PROD_RIPPLING_DWH.GROWTH.MASTER_DOMAIN_SOURCES` | Domain-level data (EE_SIZE, MAX_EE_SIZE) |
| `PROD_RIPPLING_DWH.SFDC.ACCOUNT` | Account NUMBER_OF_EMPLOYEES |

## Suppression Flag Hierarchy

```
IS_RECORD_SUPPRESSED (NULL = eligible, TRUE = suppressed)
├── IS_LEAD_SUPPRESSION (person-level)
│   ├── INELIGIBLE_PERSONA
│   ├── SALES_OWNED_LEAD
│   ├── LEAD_IN_ACTIVE_SEQUENCE
│   ├── LEAD_ENROLLED_IN_SEQUENCE
│   ├── INELIGIBLE_LEAD_SOURCE
│   ├── INELIGIBLE_LEAD_STATUS
│   ├── INVALID_EMAIL
│   ├── LEAD_OPTED_OUT
│   ├── IS_LEAD_NO_LONGER_AT_ACCOUNT
│   ├── EE_SIZE_OUT_OF_RANGE
│   ├── ADDED_IN_SEQUENCE_MORE_THAN_6
│   └── WITH_NEGATIVE_REPLY
│
└── IS_ACCOUNT_SUPPRESSED (company-level)
    ├── IS_CUSTOMER
    ├── IS_CHURNED
    ├── IS_IN_IMPLEMENTATION
    ├── IS_COMPETITOR
    ├── IS_OPT_OUT_ACCOUNT
    ├── LEGAL_EXCLUSION
    ├── INELIGIBLE_INDUSTRY
    ├── INELIGIBLE_COMPANY_SIZE (includes >100 leads rule)
    ├── IS_GOV_COMPANY
    ├── IS_PARTNER_ACCOUNT
    ├── OPEN_OPPORTUNITY
    ├── IS_NAMED_ACCOUNT
    └── IS_WHEN_I_WORK_ACCOUNT
```

## Common Flags for Net Impact Calculation

When calculating net impact, exclude leads suppressed by these other flags:

### Account-Level Flags
| Flag | Description |
|------|-------------|
| `IS_CUSTOMER` | Current customer |
| `IS_CHURNED` | Former customer |
| `IS_NAMED_ACCOUNT` | Strategic account owned by specific reps |
| `INELIGIBLE_INDUSTRY` | Excluded industry (govt, healthcare, etc.) |
| `OPEN_OPPORTUNITY` | Active opportunity on account |
| `IS_COMPETITOR` | Competitor company |
| `IS_PARTNER_ACCOUNT` | Partner/channel account |
| `EE_SIZE_OUT_OF_RANGE` | Domain EE_SIZE > 5000 |

### Lead-Level Flag
| Flag | Description |
|------|-------------|
| `IS_LEAD_SUPPRESSION` | Rollup of all lead-level suppressions |

## Employee Size Fields

| Field | Source | Description |
|-------|--------|-------------|
| `EE_SIZE` | MASTER_DOMAIN_SOURCES | Primary enrichment. Often captures subsidiary/location. |
| `MAX_EE_SIZE` | MASTER_DOMAIN_SOURCES | Ultimate parent company size. More accurate for enterprises. |
| `NUMBER_OF_EMPLOYEES` | SFDC.ACCOUNT | Account-level employee count |

**Key property:** `MAX_EE_SIZE >= EE_SIZE` always (confirmed via query).

## INELIGIBLE_COMPANY_SIZE Components

This flag is TRUE if ANY of:
1. Account doesn't match a valid segment (1-5000 employees)
2. Domain has >100 leads in SFDC (`large_companies` rule)
3. Domain EE_SIZE > 5000

## NULL Handling

- `IS_RECORD_SUPPRESSED = NULL` means **eligible** (not suppressed)
- `IS_RECORD_SUPPRESSED = TRUE` means **suppressed**
- Use `COALESCE(flag, FALSE) = FALSE` to safely check for non-suppression
