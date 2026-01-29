<!-- Source: MO_SUPPRESSION_RULES_DOCUMENTATION.md -->
<!-- Added: 2026-01-29 -->
<!-- Type: Definitions - Business Rules Documentation -->

# Mechanized Outreach Suppression Rules Documentation

This document provides a comprehensive reference for all suppression rules in the Mechanized Outreach (MO) email system. It is designed to help you understand exactly why any lead or account might be suppressed from outreach.

---

## Table of Contents

1. [Overview](#overview)
2. [Suppression Hierarchy](#suppression-hierarchy)
3. [Lead-Level Suppression Rules](#lead-level-suppression-rules)
4. [Account-Level Suppression Rules](#account-level-suppression-rules)
5. [External Dependencies Summary](#external-dependencies-summary)
6. [Investigation Queries](#investigation-queries)
7. [Source Files Reference](#source-files-reference)

---

## Overview

### What This System Does

The suppression engine evaluates every Lead and Contact in Salesforce and determines whether they should be excluded from automated outreach emails. It outputs boolean flags for each suppression reason, rolling up to a final `IS_RECORD_SUPPRESSED` flag.

### DAG Information

| Property | Value |
|----------|-------|
| DAG Name | `new_mech_outreach_leads_table_dag_with_suppression` |
| Schedule | Every 4 hours (`45 */4 * * *`) |
| Output Table | `GROWTH.MASTER_MECH_OUTREACH_LEADS` |
| Snapshot Table | `GROWTH.MASTER_MECH_OUTREACH_LEADS_V2_SNAPSHOT` |

### Primary SQL File

**All line number references in this document refer to:**
`airflow_dags/resources/growth/sqls/mo_leads_suppression_analytics/mo_leads_with_suppression.sql`

---

## Suppression Hierarchy

```
IS_RECORD_SUPPRESSED (Final flag - if TRUE, do not email)
├── IS_LEAD_SUPPRESSION (Person-level)
│   ├── INELIGIBLE_PERSONA
│   ├── INELIGIBLE_LIFECYCLE_STAGE
│   │   ├── SALES_OWNED_LEAD
│   │   ├── LEAD_IN_ACTIVE_SEQUENCE
│   │   └── LEAD_ENROLLED_IN_SEQUENCE
│   ├── OTHER_INELIGIBLE_LEADS
│   │   ├── INELIGIBLE_LEAD_SOURCE
│   │   ├── INELIGIBLE_LEAD_STATUS
│   │   ├── INVALID_EMAIL
│   │   └── DSAR_COMPLIANCE_LEAD_SUPPRESSION
│   ├── LEAD_OPTED_OUT
│   ├── IS_LEAD_NO_LONGER_AT_ACCOUNT
│   ├── EE_SIZE_OUT_OF_RANGE
│   ├── ADDED_IN_SEQUENCE_MORE_THAN_6
│   └── WITH_NEGATIVE_REPLY
│
└── IS_ACCOUNT_SUPPRESSED (Company-level)
    ├── IS_SUPPRESSED (from accounts_suppression_data CTE)
    │   ├── IS_CUSTOMER
    │   ├── IS_CHURNED
    │   ├── IS_IN_IMPLEMENTATION
    │   ├── IS_COMPETITOR
    │   ├── IS_OPT_OUT_ACCOUNT
    │   ├── LEGAL_EXCLUSION
    │   ├── ACCOUNT_INELIGIBLE_INDUSTRY
    │   ├── INELIGIBLE_SIZE
    │   ├── IS_PARTNER_ACCOUNT
    │   ├── OPEN_OPPORTUNITY
    │   ├── IS_NAMED_ACCOUNT
    │   ├── IS_INVALID_HQ_COUNTRY
    │   ├── IS_SANCTIONED_COUNTRY
    │   ├── IS_GOV_DOMAIN
    │   └── IS_WHEN_I_WORK
    ├── INELIGIBLE_INDUSTRY
    ├── INELIGIBLE_COMPANY_SIZE
    ├── IS_GOV_COMPANY
    └── IS_WHEN_I_WORK_ACCOUNT
```

### Rollup Logic

**Lines 1209-1211:**
```sql
IS_LEAD_SUPPRESSION
OR IS_ACCOUNT_SUPPRESSED
IS_RECORD_SUPPRESSED
```

---

## Lead-Level Suppression Rules

These flags evaluate the individual person (Lead or Contact).

---

### INELIGIBLE_PERSONA

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1018-1041 |
| **Description** | Person has wrong job function or persona for outreach |

**Logic:**
```sql
CASE
    WHEN COMPANY_SIZE_SEGMENT = 'ENT' AND (
        (
            (SENIORITY_PREDICTION IS NULL OR SENIORITY_PREDICTION <> 'EXECUTIVE')
            AND ( JOB_FUNCTION_PREDICTION IS NOT NULL AND JOB_FUNCTION_PREDICTION ILIKE ANY ({{params.ml_job_prediction_exclusions_str}}) )
        )
        OR (SENIORITY_PREDICTION = 'LOW' AND JOB_FUNCTION_PREDICTION LIKE 'IT%')
    ) THEN TRUE
    WHEN
    (
        PERSONA IS NOT NULL
        AND PERSONA IN (
            'CEO / Founder', 'CTO / ENG', 'CFO / Finance', 'COO / Operations', 'HR / People', 'IT'
        )
    )
    OR (
        combined_data.LAST_FORM_FILL_DATE_TIME_C IS NOT NULL
        OR combined_data.LAST_INBOUND_CONTENT_FF_DATE_TIME_C IS NOT NULL
    )
    THEN FALSE
    ELSE TRUE
END INELIGIBLE_PERSONA
```

**Business Logic:**
- For Enterprise accounts: Suppress if ML predicts excluded job function (unless Executive)
- For all segments: Only allow specific personas (CEO/Founder, CTO/ENG, CFO/Finance, COO/Operations, HR/People, IT)
- Exception: Always allow if person has a form fill (inbound interest)

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `{{params.ml_job_prediction_exclusions_str}}` | Jinja Parameter | List of excluded ML job predictions | See [constants.py lines 1317-1326](#ml-persona-exclusion-list) |
| `GROWTH.personas_lead_reference` | Snowflake Table | ML model predictions for job function/seniority | Query: `SELECT * FROM GROWTH.personas_lead_reference WHERE ID = '<lead_id>'` |

---

### SALES_OWNED_LEAD

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `INELIGIBLE_LIFECYCLE_STAGE` → `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1043-1046 |
| **Description** | Lead is owned by an active sales rep (not automation queues) |

**Logic:**
```sql
CASE
    WHEN leads.OWNER_ID IN ('0056A000000w3muQAA', '0056A000002se2FQAQ', '0058X00000FAUjGQAX') 
         OR contacts.ID IS NOT NULL 
         OR sfdc_u.is_active = false 
    THEN FALSE
    ELSE TRUE
END SALES_OWNED_LEAD
```

**Business Logic:**
- Returns FALSE (not suppressed) if:
  - Owner is one of 3 specific automation queue IDs
  - Record is a Contact (not Lead)
  - Owner user is inactive in SFDC
- Otherwise TRUE (suppressed) - meaning sales owns this lead

**Note:** The hardcoded Owner IDs are automation queues. All other active owners are considered "sales owned."

**Automation Queue IDs:**
| ID | Owner Email (lookup in SFDC.USER) |
|----|-----------------------------------|
| `0056A000000w3muQAA` | Automation/MO queue |
| `0056A000002se2FQAQ` | Automation/MO queue |
| `0058X00000FAUjGQAX` | Automation/MO queue |

**How leads get assigned to automation queues:**
- **NOT controlled by this codebase** - assignment happens upstream in Salesforce
- Salesforce Lead Assignment Rules, Flows, or Process Builder route new leads to queues
- MO system may update owner via Outreach/SFDC sync when enrolling leads

**To investigate:** Check Salesforce Setup → Lead Assignment Rules, or contact Sales Ops/Rev Ops for routing logic.

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `SFDC.USER` | Snowflake Table | User active status | Query: `SELECT ID, NAME, EMAIL, IS_ACTIVE FROM SFDC.USER WHERE ID IN ('0056A000000w3muQAA', '0056A000002se2FQAQ', '0058X00000FAUjGQAX')` |
| Salesforce Assignment Rules | External System | Routes leads to owners | Salesforce Setup → Lead Assignment Rules |

---

### LEAD_IN_ACTIVE_SEQUENCE

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `INELIGIBLE_LIFECYCLE_STAGE` → `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1049-1051 |
| **Description** | Lead is currently being sequenced in Outreach |

**Logic:**
```sql
CASE
    WHEN COALESCE(leads.ACTIVELY_BEING_SEQUENCED_C, contacts.ACTIVELY_BEING_SEQUENCED_C) = TRUE THEN TRUE
    ELSE FALSE
END LEAD_IN_ACTIVE_SEQUENCE
```

**Business Logic:**
- Checks `ACTIVELY_BEING_SEQUENCED_C` field on Lead or Contact in Salesforce
- If TRUE, person is already receiving sequence emails - don't double-send

#### EXTERNAL DEPENDENCIES

None - uses SFDC fields already loaded in the `leads` and `contacts` CTEs.

---

### LEAD_ENROLLED_IN_SEQUENCE

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `INELIGIBLE_LIFECYCLE_STAGE` → `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1053-1056 |
| **Description** | Lead has a sequence name assigned (enrolled but maybe not active) |

**Logic:**
```sql
CASE
    WHEN COALESCE(leads.SEQUENCE_NAME_FOR_AUTOMATION_C, contacts.SEQUENCE_NAME_FOR_AUTOMATION_C) IS NOT NULL THEN TRUE
    ELSE FALSE
END LEAD_ENROLLED_IN_SEQUENCE
```

**Business Logic:**
- If `SEQUENCE_NAME_FOR_AUTOMATION_C` is populated, lead was enrolled in a sequence
- Suppress to avoid re-enrolling

#### EXTERNAL DEPENDENCIES

None - uses SFDC fields already loaded.

---

### INELIGIBLE_LIFECYCLE_STAGE

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Line 1060 |
| **Description** | Rollup of lifecycle-related suppressions |

**Logic:**
```sql
SALES_OWNED_LEAD OR LEAD_IN_ACTIVE_SEQUENCE OR LEAD_ENROLLED_IN_SEQUENCE AS INELIGIBLE_LIFECYCLE_STAGE
```

---

### INELIGIBLE_LEAD_SOURCE

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `OTHER_INELIGIBLE_LEADS` → `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1062-1072 |
| **Description** | Lead source indicates already touched by outbound |

**Logic:**
```sql
CASE
    WHEN
        COALESCE(leads.LEAD_SOURCE, contacts.LEAD_SOURCE) IS NULL
        OR COALESCE(leads.LEAD_SOURCE, contacts.LEAD_SOURCE) NOT IN ('Outbound', 'Prospected')
        OR (
            combined_data.LAST_FORM_FILL_DATE_TIME_C IS NOT NULL
            OR combined_data.LAST_INBOUND_CONTENT_FF_DATE_TIME_C IS NOT NULL
        )
    THEN FALSE
    ELSE TRUE
END INELIGIBLE_LEAD_SOURCE
```

**Business Logic:**
- Suppress if Lead Source is "Outbound" or "Prospected" (already contacted)
- Exception: Allow if person has a form fill (shows inbound interest)

**How Lead Source gets set:**
- **NOT controlled by this codebase** - set upstream in Salesforce
- Set when lead is created (web form, import, manual creation)
- Values like "Outbound", "Prospected" indicate sales/SDR already touched the lead
- Marketing ops or lead import processes set this based on lead origin
- Outreach/MO may update to "Mechanized Outreach" or "Email" when enrolling

**To investigate:** Check Salesforce Lead Source picklist values, or contact Marketing Ops for attribution rules.

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `SFDC.LEAD.LEAD_SOURCE` | Salesforce Field | Lead origin/channel | Query: `SELECT LEAD_SOURCE, COUNT(*) FROM SFDC.LEAD GROUP BY 1` |

---

### INELIGIBLE_LEAD_STATUS

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `OTHER_INELIGIBLE_LEADS` → `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1074-1077 |
| **Description** | Lead status is not eligible for new outreach |

**Logic:**
```sql
CASE
    WHEN combined_data.NEW_RECYCLED_STATUS in ('NEW', 'RECYCLED') THEN FALSE
    ELSE TRUE
END INELIGIBLE_LEAD_STATUS
```

**Business Logic:**
- Only NEW or RECYCLED leads are eligible
- All other statuses (Working, Qualified, etc.) are suppressed

**Note:** `NEW_RECYCLED_STATUS` is computed earlier in the query (lines 633-636, 701-704) based on Lead/Contact status field.

---

### DSAR_COMPLIANCE_LEAD_SUPPRESSION

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `OTHER_INELIGIBLE_LEADS` → `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Line 1079 |
| **Description** | GDPR/CCPA data subject access request compliance |

**Logic:**
```sql
CASE WHEN dsar.email IS NOT NULL THEN TRUE ELSE FALSE END DSAR_COMPLIANCE_LEAD_SUPPRESSION
```

**Business Logic:**
- If email exists in DSAR compliance list, suppress for legal compliance

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `dsar_compliance_leads` CTE | Internal CTE | Pulls from SFDC.LEAD where DSAR_COMPLIANCE_FLAG_C = TRUE | See lines 462-467 |

---

### INVALID_EMAIL

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `OTHER_INELIGIBLE_LEADS` → `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1080-1084 |
| **Description** | Email is invalid or personal domain |

**Logic:**
```sql
CASE WHEN invalid_emails.EMAIL IS NOT NULL THEN TRUE
WHEN combined_data.EMAIL IS NULL OR combined_data.EMAIL ILIKE ANY (
    '%gmail%', '%@aol%', '%@yahoo%', '%@hotmail%', '%@outlook%', '%@proton%', '%@icloud%'
) OR pep.free_email_domains IS NOT NULL THEN TRUE
ELSE FALSE END INVALID_EMAIL
```

**Business Logic:**
- Suppress if NeverBounce/Emailable marked email as invalid
- Suppress if email is NULL
- Suppress if email contains common personal domain patterns
- Suppress if domain is in free email providers list

**How email validation works:**
1. Emails queued in `GROWTH.EMAIL_VALIDATION_INPUT` (populated by `populate_email_validation_input.sql`)
2. **Emailable** is the current active service (NeverBounce was legacy - column names are historical)
3. DAG `email_validation_scheduler` runs hourly, calls `emailable-scheduler` batch job
4. Results stored in `GROWTH.MASTER_EMAIL_VALIDATION_DATA`
5. Results: `deliverable`, `undeliverable`, `risky`, `unknown`, `catchall`
6. `EMAIL_VALID_NEVERBOUNCE = FALSE` → email will bounce → suppressed
7. Re-validates if last check was >30 days ago

**NeverBounce vs Emailable:**
- **Emailable** = current active service (as of DAG config)
- **NeverBounce** = legacy service (column names `NEVERBOUNCE_RESULT`, `EMAIL_VALID_NEVERBOUNCE` are historical)
- Both results stored in `MASTER_EMAIL_VALIDATION_DATA`, unified under same columns

**To investigate:** `SELECT EMAIL, NEVERBOUNCE_RESULT, EMAIL_VALID_NEVERBOUNCE, RUN_DT FROM GROWTH.MASTER_EMAIL_VALIDATION_DATA WHERE EMAIL = '<email>'`

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `GROWTH.MASTER_EMAIL_VALIDATION_DATA` | Snowflake Table | Validation results | `SELECT * FROM GROWTH.MASTER_EMAIL_VALIDATION_DATA WHERE EMAIL = '<email>'` |
| `GROWTH.EMAIL_VALIDATION_INPUT` | Snowflake Table | Queue for validation | `SELECT * FROM GROWTH.EMAIL_VALIDATION_INPUT WHERE EMAIL = '<email>'` |
| `populate_email_validation_input.sql` | SQL File | Populates validation queue | `airflow_dags/resources/growth/sqls/email_validation/` |
| NeverBounce / Emailable | External API | Email validation service | Contact Growth team |
| `google_sheets.personal_email_providers` | Google Sheet Sync | Free/personal email domains list | See below |

**`google_sheets.personal_email_providers` (alias: `pep`):**
- Google Sheet synced to Snowflake containing free/personal email domains
- Column: `free_email_domains` (e.g., `gmail.com`, `yahoo.com`, `hotmail.co.uk`)
- Join logic (line 1292): Extracts domain from email, matches against list
- If match found → personal email → suppressed
- Extends the hardcoded list (`gmail`, `aol`, `yahoo`, `hotmail`, `outlook`, `proton`, `icloud`)
- **To investigate:** `SELECT DISTINCT free_email_domains FROM google_sheets.personal_email_providers ORDER BY 1`

---

### OTHER_INELIGIBLE_LEADS

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1086-1087 |
| **Description** | Rollup of miscellaneous lead ineligibility reasons |

**Logic:**
```sql
INELIGIBLE_LEAD_SOURCE OR INELIGIBLE_LEAD_STATUS
OR INVALID_EMAIL OR DSAR_COMPLIANCE_LEAD_SUPPRESSION OTHER_INELIGIBLE_LEADS
```

---

### LEAD_OPTED_OUT

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Line 1089 |
| **Description** | Person has opted out of communications |

**Logic:**
```sql
COALESCE(global_systemic_suppression_leads.IS_LEAD_OPTED_OUT, FALSE) LEAD_OPTED_OUT
```

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `GROWTH.global_systemic_suppression_leads` | Snowflake Table | Centralized lead suppression flags | Query: `SELECT * FROM GROWTH.global_systemic_suppression_leads WHERE EMAIL = '<email>'` |

---

### IS_LEAD_NO_LONGER_AT_ACCOUNT

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1091-1092 |
| **Description** | Person left the company |

**Logic:**
```sql
CASE WHEN COALESCE(leads.NO_LONGER_AT_ACCOUNT_C, contacts.NO_LONGER_AT_ACCOUNT_C) = TRUE
THEN TRUE ELSE FALSE END IS_LEAD_NO_LONGER_AT_ACCOUNT
```

**Business Logic:**
- SFDC field `NO_LONGER_AT_ACCOUNT_C` is set by sales reps or enrichment tools
- If TRUE, person has left the company - don't email old address

#### EXTERNAL DEPENDENCIES

None - uses SFDC fields.

---

### EE_SIZE_OUT_OF_RANGE

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1094-1097 |
| **Description** | Company has too many employees (>5000) based on domain lookup |

**Logic:**
```sql
CASE
    WHEN mds.EE_SIZE > 5000
    THEN TRUE ELSE FALSE
END EE_SIZE_OUT_OF_RANGE
```

**Business Logic:**
- Uses `MASTER_DOMAIN_SOURCES` table to look up company size by email domain
- If >5000 employees, suppress (too large for MO)

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `GROWTH.master_domain_sources` (alias: `mds`) | Snowflake Table | Domain-level company data | Query: `SELECT DOMAIN, EE_SIZE FROM GROWTH.MASTER_DOMAIN_SOURCES WHERE DOMAIN = '<domain>'` |

---

### ADDED_IN_SEQUENCE_MORE_THAN_6

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1099-1102 |
| **Description** | Person has been in too many sequences (sequence fatigue) |

**Logic:**
```sql
CASE
    WHEN sequence_count.SEQUENCE_COUNT >= 8 -- 03/12/2025 todo: change back to 6 after 60 days
    THEN TRUE ELSE FALSE
END ADDED_IN_SEQUENCE_MORE_THAN_6
```

**Business Logic:**
- Counts distinct sequences person has been enrolled in via Outreach
- Threshold: 8 sequences (temporarily raised from 6 as of 03/12/2025)
- Prevents over-emailing the same person

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `sequence_count` CTE | Internal CTE | Joins Outreach prospect_email and sequence_state | See lines 479-486 |
| `OUTREACH.prospect_email` | Snowflake Table | Outreach prospect emails | Part of Outreach data sync |
| `OUTREACH.sequence_state` | Snowflake Table | Sequence enrollment history | Part of Outreach data sync |

---

### WITH_NEGATIVE_REPLY

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_LEAD_SUPPRESSION` |
| **SQL Location** | Lines 1104-1107 |
| **Description** | Person previously replied negatively to outreach |

**Logic:**
```sql
CASE
    WHEN negative_replies.EMAIL is not null
    THEN TRUE ELSE FALSE
END WITH_NEGATIVE_REPLY
```

**Business Logic:**
- ML model classifies email replies as Positive/Negative/Neutral
- If any reply was classified as "Negative", suppress future outreach

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `negative_replies` CTE | Internal CTE | Joins classification input and results | See lines 488-494 |
| `GROWTH.MECH_OUTREACH_EMAIL_CLASSIFICATION_INPUT` | Snowflake Table | Incoming email replies captured from SFDC Tasks | Populated by `populate_replies_to_classify.sql` |
| `GROWTH.MO_REPLY_CLASSIFICATION_RESULTS_BIZ_LAYER` | Snowflake Table | ML classification results | External ML model outputs here |
| **ML Reply Classification Model** | External Service | Classifies reply sentiment | Contact ML/Growth team for model details |

---

### IS_LEAD_SUPPRESSION

| Property | Value |
|----------|-------|
| **Category** | Lead |
| **Parent Flag** | `IS_RECORD_SUPPRESSED` |
| **SQL Location** | Lines 1109-1117 |
| **Description** | Rollup of all lead-level suppression flags |

**Logic:**
```sql
INELIGIBLE_PERSONA
OR INELIGIBLE_LIFECYCLE_STAGE
OR OTHER_INELIGIBLE_LEADS
OR LEAD_OPTED_OUT
OR IS_LEAD_NO_LONGER_AT_ACCOUNT
OR EE_SIZE_OUT_OF_RANGE
OR ADDED_IN_SEQUENCE_MORE_THAN_6
OR WITH_NEGATIVE_REPLY
IS_LEAD_SUPPRESSION
```

---

## Account-Level Suppression Rules

These flags evaluate the company/account associated with the lead.

---

### IS_CUSTOMER

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 784, 1119 |
| **Description** | Company is a current customer |

**Logic:**
```sql
coalesce(suppression1.IS_COMPANY_CURRENT_CUSTOMER, suppression2.IS_COMPANY_CURRENT_CUSTOMER) IS_CUSTOMER
```

**Business Logic:**
- Don't email existing customers via cold outreach

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `GROWTH.global_systemic_suppression_companies` | Snowflake Table | Company-level suppression flags | Query: `SELECT * FROM GROWTH.global_systemic_suppression_companies WHERE WEBSITE = '<domain>' OR ACCOUNT_ID = '<account_id>'` |

---

### IS_CHURNED

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 786, 1120 |
| **Description** | Company is a churned customer |

**Logic:**
```sql
coalesce(suppression1.IS_COMPANY_CHURNED_CUSTOMER, suppression2.IS_COMPANY_CHURNED_CUSTOMER) IS_CHURNED
```

#### EXTERNAL DEPENDENCIES

Same as IS_CUSTOMER - uses `GROWTH.global_systemic_suppression_companies`

---

### IS_IN_IMPLEMENTATION

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 788, 1121 |
| **Description** | Company is currently in implementation |

**Logic:**
```sql
coalesce(suppression1.IS_COMPANY_IN_IMPLEMENTATION, suppression2.IS_COMPANY_IN_IMPLEMENTATION) IS_IN_IMPLEMENTATION
```

#### EXTERNAL DEPENDENCIES

Same as IS_CUSTOMER - uses `GROWTH.global_systemic_suppression_companies`

---

### IS_COMPETITOR

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 790, 1122 |
| **Description** | Company is a competitor |

**Logic:**
```sql
coalesce(suppression1.IS_COMPANY_COMPETITOR, suppression2.IS_COMPANY_COMPETITOR) IS_COMPETITOR
```

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `GROWTH.global_systemic_suppression_companies` | Snowflake Table | Company-level flags | See below |

**How `global_systemic_suppression_companies` is populated:**
- **NOT populated by this codebase** - external system/team manages this table
- Likely sources: Sales Ops, Rev Ops, or another data pipeline
- Contains boolean flags: `IS_COMPANY_COMPETITOR`, `IS_COMPANY_CURRENT_CUSTOMER`, `IS_COMPANY_CHURNED_CUSTOMER`, etc.
- Matched by `ACCOUNT_ID` or `WEBSITE` (domain)

**To investigate:**
```sql
-- Check if a company is flagged as competitor
SELECT ACCOUNT_ID, WEBSITE, IS_COMPANY_COMPETITOR, IS_COMPANY_CURRENT_CUSTOMER
FROM GROWTH.global_systemic_suppression_companies 
WHERE WEBSITE = 'competitor.com' OR ACCOUNT_ID = '001XXXXXXX';

-- See all competitors
SELECT * FROM GROWTH.global_systemic_suppression_companies 
WHERE IS_COMPANY_COMPETITOR = TRUE;
```

**To add/modify competitor status:** Contact Sales Ops or Rev Ops team - they manage this table.

---

### IS_OPT_OUT_ACCOUNT

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 796, 1124 |
| **Description** | Account has opted out of communications |

**Logic:**
```sql
coalesce(suppression1.IS_COMPANY_OPTED_OUT, suppression2.IS_COMPANY_OPTED_OUT) IS_OPT_OUT_ACCOUNT
```

#### EXTERNAL DEPENDENCIES

Same as IS_CUSTOMER - uses `GROWTH.global_systemic_suppression_companies`

---

### LEGAL_EXCLUSION

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 797, 1125 |
| **Description** | Account is legally excluded from outreach |

**Logic:**
```sql
coalesce(suppression1.IS_COMPANY_LEGALLY_EXCLUDED, suppression2.IS_COMPANY_LEGALLY_EXCLUDED) LEGAL_EXCLUSION
```

#### EXTERNAL DEPENDENCIES

Same as IS_CUSTOMER - uses `GROWTH.global_systemic_suppression_companies`

---

### OTHER_GLOBAL_EXCLUSIONS

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 798, 1126 |
| **Description** | Rollup of opt-out and legal exclusion |

**Logic:**
```sql
IS_OPT_OUT_ACCOUNT OR LEGAL_EXCLUSION OTHER_GLOBAL_EXCLUSIONS
```

---

### INELIGIBLE_INDUSTRY (Account-Level)

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 807-840 (account CTE), Lines 1143-1175 (lead-level) |
| **Description** | Industry is excluded from outreach |

**Logic (Account CTE, simplified):**
```sql
CASE WHEN
    (
        accounts.INDUSTRY ILIKE ANY ({{params.industry_exclusion_list_str}})
        OR INDUSTRY_SEGMENT_EXCLUSION_LIST.LIST_INDUSTRY_SEGMENT IS NOT NULL
        OR (segment IN ('SMB', 'SSB') AND accounts.INDUSTRY_SEGMENT_C IS NULL)
    )
    AND NOT (
        -- AU/UK/CA overrides
        (accounts.billing_country_code IN ('GB', 'AU') AND accounts.INDUSTRY_SEGMENT_C IN ({{params.industry_segment_overrides_for_au_uk}}))
        OR (accounts.billing_country_code = 'CA' AND accounts.INDUSTRY_SEGMENT_C IN ({{params.industry_segment_overrides_for_ca}}))
    )
    OR accounts.NAME ILIKE '%cannabis%'
    OR accounts.INDUSTRY ILIKE '%government%'
THEN TRUE ELSE FALSE END ACCOUNT_INELIGIBLE_INDUSTRY
```

**Business Logic:**
- Exclude industries in the exclusion list
- Exclude per-segment industry segments from config table
- Exclude SMB/SSB with no industry segment
- Always exclude cannabis and government
- Override: Allow certain industries in AU/UK/CA markets

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `{{params.industry_exclusion_list_str}}` | Jinja Parameter | List of excluded industry keywords | See [Industry Exclusion List](#industry-exclusion-list) |
| `{{params.industry_segment_overrides_for_au_uk}}` | Jinja Parameter | Industries allowed in AU/UK | See [AU/UK Overrides](#auuk-industry-overrides) |
| `{{params.industry_segment_overrides_for_ca}}` | Jinja Parameter | Industries allowed in CA | See [CA Overrides](#ca-industry-overrides) |
| `INDUSTRY_SEGMENT_EXCLUSION_LIST` CTE | Internal CTE | Dynamic exclusions from config table | See [Industry Segment Exclusion Query](#industry-segment-exclusion-query) |
| `GROWTH.mo_tool_configuration` | Snowflake Table | Per-segment industry exclusion lists | See [Investigation Queries](#investigation-queries) |

---

### INELIGIBLE_COMPANY_SIZE

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 841-843, 1176-1178 |
| **Description** | Company size is outside valid ranges |

**Logic:**
```sql
CASE
    WHEN mesr.segment is not null OR ACCOUNTS.ID IS NULL THEN FALSE ELSE TRUE
END INELIGIBLE_SIZE

-- Combined with large companies check:
accounts_suppression_data.INELIGIBLE_SIZE = true 
OR leads_red_account_suppression.INELIGIBLE_SIZE = true
OR combined_data.domain in (select website from large_companies)
INELIGIBLE_COMPANY_SIZE
```

**Business Logic:**
- Company must fall within a defined segment range (STRAT, ENT, MM, SMB, SSB)
- Suppress if domain is in "large companies" list (>5000 EEs or >100 leads)

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `GROWTH.mech_outreach_segment_ranges` | Snowflake Table | EE size ranges for each segment | Query: `SELECT * FROM GROWTH.mech_outreach_segment_ranges WHERE (end_date IS NULL OR end_date >= CURRENT_DATE()) AND start_date <= CURRENT_DATE()` |
| `{{params.invalid_big_companies_query}}` | Jinja Parameter | Query to find large companies | See [Big Companies Query](#big-companies-query) |
| `LARGE_COMPANIES` CTE | Internal CTE | Companies with >5000 EEs or >100 leads | See lines 396 |

---

### IS_GOV_COMPANY

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 1179-1184 |
| **Description** | Company is a government entity (based on domain) |

**Logic:**
```sql
(
    accounts_suppression_data.IS_GOV_DOMAIN
    OR leads_red_account_suppression.IS_GOV_DOMAIN
    OR leads.IS_GOV_DOMAIN
    OR contacts.IS_GOV_DOMAIN
) AS IS_GOV_COMPANY
```

**Business Logic:**
- Checks if domain matches government suffixes (.gov, .mil, etc.)
- Checked at account, lead, and contact levels

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `gov_domains` CTE | Internal CTE | Government domain suffixes | See lines 404-409 |
| `GROWTH.lsw_domain_type_suppression` | Snowflake Table | Domain suffix suppression config | Query: `SELECT * FROM GROWTH.lsw_domain_type_suppression WHERE suppression_config:mo_pop::BOOLEAN = true` |

---

### IS_PARTNER_ACCOUNT

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `INELIGIBLE_ACCOUNTS` → `IS_SUPPRESSED` → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 845-849, 1185 |
| **Description** | Account is a partner or channel-owned account |

**Logic:**
```sql
CASE
    WHEN accounts.RECORD_TYPE_ID IN ('0126A000000DVWIQA4', '0123s000000JSjWAAW')
         OR CHANNEL_OWNED_ACCOUNTS.ID is not null
    THEN TRUE ELSE FALSE
END IS_PARTNER_ACCOUNT
```

**Business Logic:**
- Suppress if account has partner record type
- Suppress if account is owned by channel roles (Broker, Accountant)

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `CHANNEL_OWNED_ACCOUNTS` CTE | Internal CTE | Accounts owned by channel roles | See lines 767-774 |
| `{{params.channel_owned_accounts}}` | Jinja Parameter | Channel role patterns | See [Channel Owned Accounts](#channel-owned-accounts-list) |

---

### OPEN_OPPORTUNITY

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `INELIGIBLE_ACCOUNTS` → `IS_SUPPRESSED` → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 851-853, 1186 |
| **Description** | Account has an active opportunity |

**Logic:**
```sql
CASE
    WHEN ACCOUNT_STATUS_C = 'Open Opportunity' OR OPEN_OPPORTUNITIES_HQ_C > 0 THEN TRUE ELSE FALSE
END OPEN_OPPORTUNITY
```

**Business Logic:**
- Don't email accounts that sales is actively working

#### EXTERNAL DEPENDENCIES

None - uses SFDC account fields.

---

### INELIGIBLE_ACCOUNTS

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Line 854 |
| **Description** | Rollup of partner and open opp flags |

**Logic:**
```sql
IS_PARTNER_ACCOUNT OR OPEN_OPPORTUNITY INELIGIBLE_ACCOUNTS
```

---

### IS_NAMED_ACCOUNT

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_SUPPRESSED` (accounts CTE) → `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 856, 1189 |
| **Description** | Account is a strategic/named account owned by specific reps |

**Logic:**
```sql
NVL(NAMED_ACCOUNT_C, FALSE) IS_NAMED_ACCOUNT
```

**Business Logic:**
- Named accounts are assigned to specific sales reps
- MO should not email these accounts

#### EXTERNAL DEPENDENCIES

None - uses SFDC account field `NAMED_ACCOUNT_C`.

---

### IS_WHEN_I_WORK_ACCOUNT

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_ACCOUNT_SUPPRESSED` |
| **SQL Location** | Lines 1191-1196 |
| **Description** | Account is from When I Work acquisition |

**Logic:**
```sql
(
    accounts_suppression_data.IS_WHEN_I_WORK
    OR leads_red_account_suppression.IS_WHEN_I_WORK
    OR leads.IS_WHEN_I_WORK
    OR contacts.IS_WHEN_I_WORK
) AS IS_WHEN_I_WORK_ACCOUNT
```

**Business Logic:**
- When I Work was acquired - their accounts are handled separately
- Suppressed from standard MO

#### EXTERNAL DEPENDENCIES

| Source | Type | Description | How to Investigate |
|--------|------|-------------|-------------------|
| `wiw_users` CTE | Internal CTE | Users with WIW role | See lines 410-418 |

---

### IS_ACCOUNT_SUPPRESSED

| Property | Value |
|----------|-------|
| **Category** | Account |
| **Parent Flag** | `IS_RECORD_SUPPRESSED` |
| **SQL Location** | Lines 1198-1207 |
| **Description** | Rollup of all account-level suppression flags |

**Logic:**
```sql
(
    accounts_suppression_data.IS_SUPPRESSED
    OR leads_red_account_suppression.IS_SUPPRESSED
    OR INELIGIBLE_INDUSTRY
    OR EE_SIZE_OUT_OF_RANGE
    OR combined_data.domain IN (SELECT website FROM large_companies)
    OR INELIGIBLE_COMPANY_SIZE
    OR IS_GOV_COMPANY
    OR IS_WHEN_I_WORK_ACCOUNT
) AS IS_ACCOUNT_SUPPRESSED
```

---

## External Dependencies Summary

This section consolidates ALL external dependencies for easy reference.

### Python Files (Jinja Parameters)

These values are passed to the SQL via the DAG file `new_mech_outreach_leads_table_dag_with_suppression.py`.

---

#### Industry Exclusion List

**Source:** `airflow_dags/resources/growth/scripts/common/constants.py` (Lines 1299-1315)

```python
MECH_OUTREACH_INDUSTRY_EXCLUSION_LIST_KEYWORDS = [
    "Education services",
    "Primary & Secondary Ed.",
    "Primary and Secondary Educations",
    "Family Planning Centers",
    "Health Care Prov. & Services",
    "Hospitals",
    "Government",
    "Services for the Elderly & Disabled",
    "Food Products",
    "Coal Mining",
    "Nonmetallic Mineral Mining",
    "Oil Gas and Mining",
    "Metal Ore Mining",
    "Oil, Gas, and Mining",
    "Mining",
]
```

**Used in:** `INELIGIBLE_INDUSTRY` rule via `{{params.industry_exclusion_list_str}}`

---

#### ML Persona Exclusion List

**Source:** `airflow_dags/resources/growth/scripts/common/constants.py` (Lines 1317-1326)

```python
MECH_OUTREACH_ML_PERSONA_EXCLUSION_LIST = [
    "CUSTOMER_SUPPORT",
    "DATA",
    "DESIGN",
    "ENGINEERING",
    "LEGAL",
    "MARKETING",
    "PRODUCT",
    "SALES",
]
```

**Used in:** `INELIGIBLE_PERSONA` rule for Enterprise accounts via `{{params.ml_job_prediction_exclusions_str}}`

---

#### AU/UK Industry Overrides

**Source:** `airflow_dags/resources/growth/scripts/common/constants.py` (Lines 1328-1341)

```python
OVERRIDES_FOR_AU_UK = [
    "Law Firms / Legal",
    "Financials",
    "Legal Services",
    "Media",
    "Retail",
    "Accounting",
    "Wholesale",
    "Finance - Other",
    "Real Estate",
    "Banking",
    "Insurance",
    "Marketing / Advertising",
]
```

**Used in:** `INELIGIBLE_INDUSTRY` rule - these industries are ALLOWED in AU/UK markets even if normally excluded.

---

#### CA Industry Overrides

**Source:** `airflow_dags/resources/growth/scripts/common/constants.py` (Line 1343)

```python
OVERRIDES_FOR_CA = ["Media"]
```

**Used in:** `INELIGIBLE_INDUSTRY` rule - Media is ALLOWED in Canada.

---

#### Channel Owned Accounts List

**Source:** `airflow_dags/resources/growth/scripts/common/constants.py` (Lines 1643-1646)

```python
SUPPRESSION_CHANNEL_OWNED_ACCOUNT = [
    "Channel - Broker",
    "Channel - Accountant",
]
```

**Used in:** `IS_PARTNER_ACCOUNT` rule via `{{params.channel_owned_accounts}}`

---

#### Industry Segment Exclusion Query

**Source:** `airflow_dags/resources/growth/scripts/suppression/queries.py` (Lines 45-84)

This query dynamically pulls industry segment exclusions per company size segment from `GROWTH.mo_tool_configuration`:

```sql
SELECT LIST_INDUSTRY_SEGMENT, SEGMENT FROM (
    -- Pulls from mo_config.config for each segment:
    -- MECH_OUTREACH_STRAT_INDUSTRY_SEGMENT_EXCLUSION_LIST
    -- MECH_OUTREACH_ENT_INDUSTRY_SEGMENT_EXCLUSION_LIST
    -- MECH_OUTREACH_MM_INDUSTRY_SEGMENT_EXCLUSION_LIST
    -- MECH_OUTREACH_SMB_INDUSTRY_SEGMENT_EXCLUSION_LIST
    -- MECH_OUTREACH_SSB_INDUSTRY_SEGMENT_EXCLUSION_LIST
)
```

**Used in:** `INELIGIBLE_INDUSTRY` rule via `INDUSTRY_SEGMENT_EXCLUSION_LIST` CTE

---

#### Big Companies Query

**Source:** `airflow_dags/resources/growth/scripts/suppression/queries.py` (Lines 1-33)

Identifies companies that are too large:
- Companies with >5000 employees
- Companies with >100 leads in the system

**Used in:** `INELIGIBLE_COMPANY_SIZE` rule via `LARGE_COMPANIES` CTE

---

### Snowflake Tables (External Data)

| Table | Description | Key Columns | Used For |
|-------|-------------|-------------|----------|
| `GROWTH.global_systemic_suppression_companies` | Centralized company flags | `ACCOUNT_ID`, `WEBSITE`, `IS_COMPANY_CURRENT_CUSTOMER`, `IS_COMPANY_CHURNED_CUSTOMER`, `IS_COMPANY_IN_IMPLEMENTATION`, `IS_COMPANY_COMPETITOR`, `IS_COMPANY_OPTED_OUT`, `IS_COMPANY_LEGALLY_EXCLUDED` | IS_CUSTOMER, IS_CHURNED, IS_IN_IMPLEMENTATION, IS_COMPETITOR, IS_OPT_OUT_ACCOUNT, LEGAL_EXCLUSION |
| `GROWTH.global_systemic_suppression_leads` | Centralized lead flags | `EMAIL`, `IS_LEAD_OPTED_OUT` | LEAD_OPTED_OUT |
| `GROWTH.mech_outreach_segment_ranges` | Company size segment definitions | `SEGMENT`, `EE_SIZE_LOWERBOUND`, `EE_SIZE_UPPER_BOUND`, `START_DATE`, `END_DATE` | INELIGIBLE_SIZE |
| `GROWTH.mo_tool_configuration` | Dynamic industry exclusion config | `REQUEST_TYPE`, `CONFIG` (JSON) | INELIGIBLE_INDUSTRY |
| `GROWTH.lsw_domain_type_suppression` | Government domain suffixes | `SUFFIX`, `SUPPRESSION_CONFIG` | IS_GOV_COMPANY |
| `GROWTH.MASTER_EMAIL_VALIDATION_DATA` | NeverBounce results | `EMAIL`, `EMAIL_VALID_NEVERBOUNCE`, `RUN_DT` | INVALID_EMAIL |
| `GROWTH.MO_REPLY_CLASSIFICATION_RESULTS_BIZ_LAYER` | ML reply classifications | `REPLY_ID`, `BIZ_LAYER_RESULT` | WITH_NEGATIVE_REPLY |
| `GROWTH.personas_lead_reference` | ML persona predictions | `ID`, `JOB_FUNCTION_PREDICTION`, `SENIORITY_PREDICTION` | INELIGIBLE_PERSONA |
| `GROWTH.PRIMER_JOB_CHANGE_MERGED_LEADS` | Job change detection | `EMAIL`, `PREVIOUS_COMPANY_DOMAIN`, `JOB_START_DATE` | JOB_CHANGE (not suppression, but enrichment) |
| `GROWTH.MASTER_DOMAIN_SOURCES` | Domain-level company data | `DOMAIN`, `EE_SIZE`, `COMPANY_SEGMENT`, `GROWTH_TIER` | EE_SIZE_OUT_OF_RANGE |
| `google_sheets.personal_email_providers` | Free email domains | `free_email_domains` | INVALID_EMAIL |

---

### External ML Models

| Model | Input | Output Table | Classification Values | How to Investigate |
|-------|-------|--------------|----------------------|-------------------|
| **Reply Sentiment Classification** | `GROWTH.MECH_OUTREACH_EMAIL_CLASSIFICATION_INPUT` | `GROWTH.MO_REPLY_CLASSIFICATION_RESULTS_BIZ_LAYER` | "Positive", "Negative", "Neutral", etc. | Input populated by `populate_replies_to_classify.sql`. Model runs externally - contact ML team. |
| **Persona/Job Function Prediction** | SFDC Lead/Contact data | `GROWTH.personas_lead_reference` | JOB_FUNCTION_PREDICTION (e.g., "ENGINEERING", "HR"), SENIORITY_PREDICTION (e.g., "EXECUTIVE", "LOW") | External ML pipeline - contact ML team. |

---

## Investigation Queries

### Why is this lead suppressed?

```sql
SELECT 
    SALESFORCE_ID,
    EMAIL,
    SFDC_OBJECT_TYPE,
    
    -- Final flags
    IS_RECORD_SUPPRESSED,
    IS_LEAD_SUPPRESSION,
    IS_ACCOUNT_SUPPRESSED,
    
    -- Lead-level flags
    INELIGIBLE_PERSONA,
    SALES_OWNED_LEAD,
    LEAD_IN_ACTIVE_SEQUENCE,
    LEAD_ENROLLED_IN_SEQUENCE,
    INELIGIBLE_LIFECYCLE_STAGE,
    INELIGIBLE_LEAD_SOURCE,
    INELIGIBLE_LEAD_STATUS,
    DSAR_COMPLIANCE_LEAD_SUPPRESSION,
    INVALID_EMAIL,
    OTHER_INELIGIBLE_LEADS,
    LEAD_OPTED_OUT,
    IS_LEAD_NO_LONGER_AT_ACCOUNT,
    EE_SIZE_OUT_OF_RANGE,
    ADDED_IN_SEQUENCE_MORE_THAN_6,
    WITH_NEGATIVE_REPLY,
    
    -- Account-level flags
    IS_CUSTOMER,
    IS_CHURNED,
    IS_IN_IMPLEMENTATION,
    IS_COMPETITOR,
    IS_OPT_OUT_ACCOUNT,
    LEGAL_EXCLUSION,
    OTHER_GLOBAL_EXCLUSIONS,
    INELIGIBLE_INDUSTRY,
    INELIGIBLE_COMPANY_SIZE,
    IS_GOV_COMPANY,
    IS_PARTNER_ACCOUNT,
    OPEN_OPPORTUNITY,
    INELIGIBLE_ACCOUNTS,
    IS_NAMED_ACCOUNT,
    IS_WHEN_I_WORK_ACCOUNT
    
FROM GROWTH.MASTER_MECH_OUTREACH_LEADS
WHERE EMAIL = 'someone@example.com'
ORDER BY RUN_DT DESC
LIMIT 1;
```

### What are the current industry segment exclusions?

```sql
SELECT 
    config:MECH_OUTREACH_STRAT_INDUSTRY_SEGMENT_EXCLUSION_LIST AS STRAT_EXCLUSIONS,
    config:MECH_OUTREACH_ENT_INDUSTRY_SEGMENT_EXCLUSION_LIST AS ENT_EXCLUSIONS,
    config:MECH_OUTREACH_MM_INDUSTRY_SEGMENT_EXCLUSION_LIST AS MM_EXCLUSIONS,
    config:MECH_OUTREACH_SMB_INDUSTRY_SEGMENT_EXCLUSION_LIST AS SMB_EXCLUSIONS,
    config:MECH_OUTREACH_SSB_INDUSTRY_SEGMENT_EXCLUSION_LIST AS SSB_EXCLUSIONS
FROM GROWTH.mo_tool_configuration 
WHERE request_type = 'lsw_constants' 
ORDER BY id DESC 
LIMIT 1;
```

### What are the current segment size ranges?

```sql
SELECT 
    SEGMENT,
    EE_SIZE_LOWERBOUND,
    EE_SIZE_UPPER_BOUND,
    START_DATE,
    END_DATE
FROM GROWTH.mech_outreach_segment_ranges 
WHERE (END_DATE IS NULL OR END_DATE >= CURRENT_DATE()) 
  AND START_DATE <= CURRENT_DATE()
ORDER BY EE_SIZE_LOWERBOUND;
```

### What government domain suffixes are suppressed?

```sql
SELECT suffix, suppression_config
FROM GROWTH.lsw_domain_type_suppression 
WHERE suppression_config:mo_pop::BOOLEAN = true;
```

### Check company suppression status

```sql
SELECT *
FROM GROWTH.global_systemic_suppression_companies
WHERE WEBSITE = 'example.com' 
   OR ACCOUNT_ID = '001XXXXXXXXXXXXXXX';
```

### Check lead suppression status

```sql
SELECT *
FROM GROWTH.global_systemic_suppression_leads
WHERE EMAIL = 'someone@example.com';
```

### How many sequences has this lead been in?

```sql
SELECT 
    pe.EMAIL,
    COUNT(DISTINCT ss.RELATIONSHIP_SEQUENCE_ID) AS SEQUENCE_COUNT
FROM OUTREACH.prospect_email pe
LEFT JOIN OUTREACH.sequence_state ss 
    ON ss.RELATIONSHIP_PROSPECT_ID = pe.PROSPECT_ID
WHERE pe.EMAIL = 'someone@example.com'
GROUP BY pe.EMAIL;
```

### Check negative reply classification

```sql
SELECT 
    input.EMAIL,
    input.REPLY,
    output.BIZ_LAYER_RESULT,
    input.REPLY_DATE
FROM GROWTH.MECH_OUTREACH_EMAIL_CLASSIFICATION_INPUT input
LEFT JOIN GROWTH.MO_REPLY_CLASSIFICATION_RESULTS_BIZ_LAYER output 
    ON output.REPLY_ID = input.ID
WHERE input.EMAIL = 'someone@example.com';
```

---

## Source Files Reference

| File | Path | Description |
|------|------|-------------|
| **Main SQL (PRIMARY)** | `airflow_dags/resources/growth/sqls/mo_leads_suppression_analytics/mo_leads_with_suppression.sql` | All suppression logic (1314 lines) |
| Python Constants | `airflow_dags/resources/growth/scripts/common/constants.py` | Industry exclusions, persona exclusions, overrides |
| Python Queries | `airflow_dags/resources/growth/scripts/suppression/queries.py` | Industry segment query, big companies query |
| DAG Definition | `airflow_dags/dags/growth/new_mech_outreach_leads_table_dag_with_suppression.py` | Passes parameters to SQL |
| Reply Classification Input | `airflow_dags/resources/growth/sqls/reply_classification/populate_replies_to_classify.sql` | Populates ML classification input |
| Population Table | `airflow_dags/resources/growth/sqls/mo_leads_suppression_analytics/mo_population_table.sql` | Final eligible leads output |
| Snapshot Cleanup | `airflow_dags/resources/growth/sqls/mo_leads_suppression_analytics/clean_master_leads_snapshot.sql` | Retention policy for snapshots |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12-17 | Generated | Initial documentation |
