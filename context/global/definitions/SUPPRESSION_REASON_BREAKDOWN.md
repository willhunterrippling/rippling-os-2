<!-- Source: SUPPRESSION_REASON_BREAKDOWN.md -->
<!-- Added: 2026-01-29 -->
<!-- Type: Definitions - Analysis Report -->

# MO Suppression Reason Breakdown

**Date:** 2026-01-23  
**Source Table:** `PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS`  
**Reference:** [MO_SUPPRESSION_RULES_DOCUMENTATION.md](../source_files/MO_SUPPRESSION_RULES_DOCUMENTATION.md)

---

## Executive Summary

This report analyzes all suppression reasons in the Mechanized Outreach (MO) leads population to understand what is causing leads to be suppressed from outreach.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total Leads in Population** | ~21,371,000 |
| **Total Suppressed (IS_RECORD_SUPPRESSED)** | 19,221,137 (89.94%) |
| **Lead-Level Suppression (IS_LEAD_SUPPRESSION)** | 14,561,526 (68.13%) |
| **Account-Level Suppression (IS_ACCOUNT_SUPPRESSED)** | 14,558,944 (68.12%) |

**Note:** Leads can have multiple suppression reasons. The percentages do not add up to 100% because flags are not mutually exclusive. `IS_RECORD_SUPPRESSED = IS_LEAD_SUPPRESSION OR IS_ACCOUNT_SUPPRESSED`.

---

## All Suppression Reasons (Ranked by Volume)

| Rank | Suppression Reason | Type | Lead Count | % of Total |
|------|-------------------|------|------------|------------|
| 1 | Is Named Account | Account | 9,197,165 | 43.03% |
| 2 | Ineligible Persona | Lead | 5,641,626 | 26.40% |
| 3 | Invalid Email | Lead | 5,529,374 | 25.87% |
| 4 | Ineligible Lead Status | Lead | 5,424,830 | 25.38% |
| 5 | Ineligible Company Size | Account | 5,380,742 | 25.18% |
| 6 | Is Lead No Longer At Account | Lead | 2,264,053 | 10.59% |
| 7 | Ineligible Industry | Account | 1,904,997 | 8.91% |
| 8 | With Negative Reply | Lead | 1,159,613 | 5.43% |
| 9 | Is Customer | Account | 1,119,222 | 5.24% |
| 10 | Ineligible Lead Source | Lead | 927,039 | 4.34% |
| 11 | Added In Sequence More Than 6 | Lead | 701,121 | 3.28% |
| 12 | Is Partner Account | Account | 679,533 | 3.18% |
| 13 | Lead Opted Out | Lead | 661,881 | 3.10% |
| 14 | EE Size Out Of Range | Lead | 607,140 | 2.84% |
| 15 | Open Opportunity | Account | 442,369 | 2.07% |
| 16 | Is Gov Company | Account | 437,573 | 2.05% |
| 17 | Is Opt Out Account | Account | 254,838 | 1.19% |
| 18 | Lead In Active Sequence | Lead | 245,362 | 1.15% |
| 19 | Is Churned | Account | 217,498 | 1.02% |
| 20 | Is When I Work Account | Account | 156,291 | 0.73% |
| 21 | Is Competitor | Account | 95,188 | 0.45% |
| 22 | Sales Owned Lead | Lead | 71,224 | 0.33% |
| 23 | Is In Implementation | Account | 51,402 | 0.24% |
| 24 | Lead Enrolled In Sequence | Lead | 6,148 | 0.03% |
| 25 | Legal Exclusion | Account | 1,466 | 0.01% |
| 26 | DSAR Compliance Lead Suppression | Lead | 1 | 0.00% |
| 27 | Generic Outreach Suppression | Lead | 0 | 0.00% |

---

## Lead-Level Suppression Details

These suppressions are based on attributes of the individual lead/contact record.

| Rank | Suppression Reason | Lead Count | % | Description |
|------|-------------------|------------|---|-------------|
| 1 | **Ineligible Persona** | 5,641,626 | 26.40% | Persona not in target list. Only allows: CEO/Founder, CTO/ENG, CFO/Finance, COO/Operations, HR/People, IT. For Enterprise: ML excludes CUSTOMER_SUPPORT, DATA, DESIGN, ENGINEERING, LEGAL, MARKETING, PRODUCT, SALES (unless Executive). Exception: allows if has form fill. |
| 2 | **Invalid Email** | 5,529,374 | 25.87% | Email failed Emailable validation OR is NULL OR is personal domain (gmail, yahoo, hotmail, outlook, proton, icloud, aol) OR matches `google_sheets.personal_email_providers` list. |
| 3 | **Ineligible Lead Status** | 5,424,830 | 25.38% | Status not NEW or RECYCLED. All other statuses (Working, Qualified, etc.) are suppressed. |
| 4 | **Is Lead No Longer At Account** | 2,264,053 | 10.59% | `NO_LONGER_AT_ACCOUNT_C = TRUE` in SFDC. Person left the company. |
| 5 | **With Negative Reply** | 1,159,613 | 5.43% | ML model classified a previous email reply as "Negative". Source: `GROWTH.MO_REPLY_CLASSIFICATION_RESULTS_BIZ_LAYER`. |
| 6 | **Ineligible Lead Source** | 927,039 | 4.34% | Lead Source is "Outbound" or "Prospected" (already touched by sales). Exception: allows if has form fill. |
| 7 | **Added In Sequence More Than 6** | 701,121 | 3.28% | Been added to 8+ sequences in Outreach (threshold raised from 6 on 03/12/2025). Prevents over-emailing. |
| 8 | **Lead Opted Out** | 661,881 | 3.10% | `IS_LEAD_OPTED_OUT = TRUE` in `GROWTH.global_systemic_suppression_leads`. |
| 9 | **EE Size Out Of Range** | 607,140 | 2.84% | Company has >5000 employees based on domain lookup from `GROWTH.MASTER_DOMAIN_SOURCES`. |
| 10 | **Lead In Active Sequence** | 245,362 | 1.15% | `ACTIVELY_BEING_SEQUENCED_C = TRUE`. Currently receiving sequence emails in Outreach. |
| 11 | **Sales Owned Lead** | 71,224 | 0.33% | Owned by active sales rep (not automation queues: `0056A000000w3muQAA`, `0056A000002se2FQAQ`, `0058X00000FAUjGQAX`). Contacts always FALSE. |
| 12 | **Lead Enrolled In Sequence** | 6,148 | 0.03% | `SEQUENCE_NAME_FOR_AUTOMATION_C` is not null. Was enrolled in a sequence. |
| 13 | **DSAR Compliance** | 1 | 0.00% | `DSAR_COMPLIANCE_FLAG_C = TRUE`. GDPR/CCPA data subject request. |
| 14 | **Generic Outreach Suppression** | 0 | 0.00% | Currently unused (always NULL in source SQL). |

---

## Account-Level Suppression Details

These suppressions are based on attributes of the associated account/company.

| Rank | Suppression Reason | Lead Count | % | Description |
|------|-------------------|------------|---|-------------|
| 1 | **Is Named Account** | 9,197,165 | 43.03% | `NAMED_ACCOUNT_C = TRUE`. Strategic accounts assigned to specific sales reps. MO should not email. |
| 2 | **Ineligible Company Size** | 5,380,742 | 25.18% | Outside segment ranges (STRAT/ENT/MM/SMB/SSB) defined in `GROWTH.mech_outreach_segment_ranges`, OR domain in large_companies list (>5000 EE or >100 leads). |
| 3 | **Ineligible Industry** | 1,904,997 | 8.91% | Industry in exclusion list: Education, Healthcare, Government, Mining, Cannabis, etc. Excludes SMB/SSB with no industry segment. Overrides for AU/UK/CA markets. |
| 4 | **Is Customer** | 1,119,222 | 5.24% | Current Rippling customer. Source: `GROWTH.global_systemic_suppression_companies.IS_COMPANY_CURRENT_CUSTOMER`. |
| 5 | **Is Partner Account** | 679,533 | 3.18% | Partner record type (`0126A000000DVWIQA4`, `0123s000000JSjWAAW`) OR owned by channel roles (Broker, Accountant). |
| 6 | **Open Opportunity** | 442,369 | 2.07% | `ACCOUNT_STATUS_C = 'Open Opportunity'` OR `OPEN_OPPORTUNITIES_HQ_C > 0`. Sales actively working account. |
| 7 | **Is Gov Company** | 437,573 | 2.05% | Domain matches government suffix (.gov, .mil, etc.) from `GROWTH.lsw_domain_type_suppression`. |
| 8 | **Is Opt Out Account** | 254,838 | 1.19% | Account opted out. Source: `GROWTH.global_systemic_suppression_companies.IS_COMPANY_OPTED_OUT`. |
| 9 | **Is Churned** | 217,498 | 1.02% | Former/churned customer. Source: `GROWTH.global_systemic_suppression_companies.IS_COMPANY_CHURNED_CUSTOMER`. |
| 10 | **Is When I Work Account** | 156,291 | 0.73% | From When I Work acquisition. `WIW_ID_C IS NOT NULL` or owner has WIW role. Handled separately. |
| 11 | **Is Competitor** | 95,188 | 0.45% | Company is a competitor. Source: `GROWTH.global_systemic_suppression_companies.IS_COMPANY_COMPETITOR`. |
| 12 | **Is In Implementation** | 51,402 | 0.24% | Currently implementing Rippling. Source: `GROWTH.global_systemic_suppression_companies.IS_COMPANY_IN_IMPLEMENTATION`. |
| 13 | **Legal Exclusion** | 1,466 | 0.01% | Legally excluded from outreach. Source: `GROWTH.global_systemic_suppression_companies.IS_COMPANY_LEGALLY_EXCLUDED`. |

---

## Suppression Hierarchy

```
IS_RECORD_SUPPRESSED (Final flag - if TRUE, do not email)
├── IS_LEAD_SUPPRESSION (Person-level)
│   ├── INELIGIBLE_PERSONA
│   ├── INELIGIBLE_LIFECYCLE_STAGE (rollup)
│   │   ├── SALES_OWNED_LEAD
│   │   ├── LEAD_IN_ACTIVE_SEQUENCE
│   │   └── LEAD_ENROLLED_IN_SEQUENCE
│   ├── OTHER_INELIGIBLE_LEADS (rollup)
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
    ├── IS_CUSTOMER
    ├── IS_CHURNED
    ├── IS_IN_IMPLEMENTATION
    ├── IS_COMPETITOR
    ├── IS_OPT_OUT_ACCOUNT
    ├── LEGAL_EXCLUSION
    ├── INELIGIBLE_INDUSTRY
    ├── INELIGIBLE_COMPANY_SIZE
    ├── IS_GOV_COMPANY
    ├── IS_PARTNER_ACCOUNT
    ├── OPEN_OPPORTUNITY
    ├── IS_NAMED_ACCOUNT
    └── IS_WHEN_I_WORK_ACCOUNT
```

---

## Key Observations

### Top 5 Suppression Drivers

| Rank | Suppression Reason | Type | Impact | Potential Action |
|------|-------------------|------|--------|------------------|
| 1 | **Is Named Account** | Account | 43.03% | Review named account criteria. Are all these accounts truly being worked by sales? |
| 2 | **Ineligible Persona** | Lead | 26.40% | Review persona eligibility list. Consider expanding for certain segments. |
| 3 | **Invalid Email** | Lead | 25.87% | Data quality issue. Consider enrichment or re-validation. |
| 4 | **Ineligible Lead Status** | Lead | 25.38% | Only NEW/RECYCLED eligible. Review status definitions. |
| 5 | **Ineligible Company Size** | Account | 25.18% | Review segment boundaries. Are we excluding good-fit companies? |

### Minimal Impact Suppressions

These flags suppress very few leads and may be candidates for review or removal:

| Suppression Reason | Lead Count | Notes |
|-------------------|------------|-------|
| Generic Outreach Suppression | 0 | **Unused** - always NULL in source SQL |
| DSAR Compliance | 1 | Working correctly (legal requirement) |
| Legal Exclusion | 1,466 | Working correctly (legal requirement) |
| Lead Enrolled In Sequence | 6,148 | Very low - may overlap with other sequence flags |

### Lead vs Account Distribution

| Category | Count of Reasons | Total Suppressions | Avg per Reason |
|----------|-----------------|-------------------|----------------|
| Lead-level | 14 flags | ~17.9M (sum of flags) | ~1.3M |
| Account-level | 13 flags | ~19.5M (sum of flags) | ~1.5M |

**Note:** Sums exceed total suppressed because leads can have multiple reasons.

---

## External Dependencies

Key external tables/systems that drive suppression:

| Table/System | Used By | Description |
|--------------|---------|-------------|
| `GROWTH.global_systemic_suppression_companies` | IS_CUSTOMER, IS_CHURNED, IS_COMPETITOR, IS_IN_IMPLEMENTATION, IS_OPT_OUT_ACCOUNT, LEGAL_EXCLUSION | Centralized company flags - managed by Sales Ops/Rev Ops |
| `GROWTH.global_systemic_suppression_leads` | LEAD_OPTED_OUT | Centralized lead opt-out flags |
| `GROWTH.MASTER_EMAIL_VALIDATION_DATA` | INVALID_EMAIL | Emailable validation results |
| `GROWTH.MO_REPLY_CLASSIFICATION_RESULTS_BIZ_LAYER` | WITH_NEGATIVE_REPLY | ML reply sentiment classification |
| `GROWTH.personas_lead_reference` | INELIGIBLE_PERSONA | ML job function/seniority predictions |
| `GROWTH.mech_outreach_segment_ranges` | INELIGIBLE_COMPANY_SIZE | Segment size boundaries |
| `GROWTH.mo_tool_configuration` | INELIGIBLE_INDUSTRY | Dynamic industry exclusions per segment |
| `google_sheets.personal_email_providers` | INVALID_EMAIL | Free email domain list |

---

## Data Files

| File | Description |
|------|-------------|
| `temp/_outputs/suppression_reason_breakdown.csv` | Full query results |
| `projects/suppression_issues/suppression_reason_breakdown.sql` | Query source |
| `projects/suppression_issues/source_files/MO_SUPPRESSION_RULES_DOCUMENTATION.md` | Full suppression rules documentation |

---

## Methodology

The query counts leads where each boolean suppression flag equals TRUE. Since a single lead can have multiple suppression reasons, the percentages across all flags sum to more than 100%.

Aggregate rollup flags (IS_RECORD_SUPPRESSED, IS_LEAD_SUPPRESSION, IS_ACCOUNT_SUPPRESSED) are reported in Key Metrics only - they are not included in the main breakdown table to avoid double-counting.

---

*Generated: 2026-01-23*
