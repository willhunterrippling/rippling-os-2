<!-- Source: mechanized_outreach_data_flow.md (from rippling-dbt/docs/) -->
<!-- Added: 2026-02-06 -->
<!-- Type: Documentation -->

# Unified Lead Database

This document describes the Unified Lead Database—the single source of truth for all prospecting leads at Rippling. It covers what data feeds into the database and what downstream systems consume from it.

## High-Level Architecture

```mermaid
flowchart LR
    subgraph Inputs ["Data Sources"]
        direction TB
        
        subgraph LeadEnrichment ["Lead Enrichment"]
            Apollo["Apollo"]
            ZoomInfo["ZoomInfo"]
            Cognism["Cognism"]
            Clearbit["Clearbit"]
        end
        
        subgraph CompanyIntel ["Company Intelligence"]
            Coresignal["Coresignal"]
            Crunchbase["Crunchbase"]
            LinkedIn["LinkedIn Sales Insights"]
            PitchBook["PitchBook"]
        end
        
        subgraph IntentSignals ["Intent Signals"]
            G2["G2 Buyer Intent"]
            Gartner["Gartner Digital Markets"]
            Demandbase["Demandbase"]
            TrustRadius["TrustRadius"]
            ClearbitReveal["Website Visitors"]
            RB2B["RB2B"]
        end
        
        subgraph InternalSystems ["Internal Systems"]
            SFDC["Salesforce CRM"]
            Outreach["Outreach.io"]
            GSheets["Audience Config"]
        end
    end
    
    ULD[["Unified Lead Database"]]
    
    subgraph Outputs ["Consumers"]
        direction TB
        EmailAudience["Email Campaign Audience"]
        DirectMail["Direct Mail Campaigns"]
        AIEmail["AI Email Personalization"]
        SFDCEnrich["CRM Enrichment"]
        Analytics["BI Dashboards"]
    end
    
    LeadEnrichment --> ULD
    CompanyIntel --> ULD
    IntentSignals --> ULD
    InternalSystems --> ULD
    
    ULD --> EmailAudience
    ULD --> DirectMail
    ULD --> AIEmail
    ULD --> SFDCEnrich
    ULD --> Analytics
```

---

## Inputs: What Feeds the Database

### Lead Enrichment Vendors

Contact-level data is sourced from four vendors. Each provides overlapping but complementary information:

| Vendor | What It Provides |
|--------|------------------|
| Apollo | Contact info, job titles, direct dials, social profiles, company data |
| ZoomInfo | Verified emails, phone numbers, org charts, technographics |
| Cognism | GDPR-compliant European contacts, mobile numbers, intent data |
| Clearbit | Real-time enrichment, company firmographics, role detection |

**How leads are unified:**

```mermaid
flowchart LR
    subgraph Providers ["Provider Data"]
        A1["Apollo Lead"]
        A2["ZoomInfo Lead"]
        A3["Cognism Lead"]
        A4["Clearbit Lead"]
    end
    
    subgraph Merge ["Unification Process"]
        MATCH["Match by Email Address"]
        BEST["Select Best Data per Field"]
        PERSONA["Classify Persona & Seniority"]
    end
    
    A1 & A2 & A3 & A4 --> MATCH --> BEST --> PERSONA
```

Each provider's data flows through normalization (intermediate models) before being merged into a single lead record. When multiple vendors have data for the same email, the system selects the most complete/accurate value per field.

**Key models:**

| Stage | Model | Description |
|-------|-------|-------------|
| Staging | `stg_mech_outreach__apollo_lead_enrichment` | Raw Apollo data extraction |
| Staging | `stg_mech_outreach__zoominfo_lead_enrichment` | Raw ZoomInfo data extraction |
| Staging | `stg_mech_outreach__cognism_lead_enrichment` | Raw Cognism data extraction |
| Staging | `stg_mech_outreach__clearbit_lead_search` | Raw Clearbit data extraction |
| Intermediate | `int_growth__apollo_lead_enrichment_output` | Normalized Apollo data |
| Intermediate | `int_growth__zoominfo_lead_enrichment_output` | Normalized ZoomInfo data |
| Intermediate | `int_growth__cognism_lead_enrichment_output` | Normalized Cognism data |
| Intermediate | `int_growth__clearbit_lead_enrichment_output` | Normalized Clearbit data |

```mermaid
flowchart LR
    subgraph RawSources ["Raw Data (PROD_DATALAKE_DB.MECH_OUTREACH)"]
        APOLLO_RAW["APOLLO_LEAD_ENRICHMENT"]
        ZOOMINFO_RAW["ZOOMINFO_LEAD_ENRICHMENT"]
        COGNISM_RAW["COGNISM_LEAD_ENRICHMENT"]
        CLEARBIT_RAW["CLEARBIT_LEAD_SEARCH"]
    end
    
    subgraph Staging ["Staging Models"]
        APOLLO_STG["stg_mech_outreach__apollo_lead_enrichment"]
        ZOOMINFO_STG["stg_mech_outreach__zoominfo_lead_enrichment"]
        COGNISM_STG["stg_mech_outreach__cognism_lead_enrichment"]
        CLEARBIT_STG["stg_mech_outreach__clearbit_lead_search"]
    end
    
    subgraph Intermediate ["Intermediate (Normalized)"]
        APOLLO_INT["int_growth__apollo_lead_enrichment_output"]
        ZOOMINFO_INT["int_growth__zoominfo_lead_enrichment_output"]
        COGNISM_INT["int_growth__cognism_lead_enrichment_output"]
        CLEARBIT_INT["int_growth__clearbit_lead_enrichment_output"]
    end
    
    subgraph Aggregation ["Multi-Provider Merge"]
        AGGREGATE["mart_growth__lsw_lead_aggregate"]
    end
    
    subgraph ULD ["Unified Lead Database"]
        LSW["mart_growth__lsw_lead_data"]
    end
    
    APOLLO_RAW --> APOLLO_STG --> APOLLO_INT --> AGGREGATE
    ZOOMINFO_RAW --> ZOOMINFO_STG --> ZOOMINFO_INT --> AGGREGATE
    COGNISM_RAW --> COGNISM_STG --> COGNISM_INT --> AGGREGATE
    CLEARBIT_RAW --> CLEARBIT_STG --> CLEARBIT_INT --> AGGREGATE
    
    AGGREGATE --> LSW
```

---

### Company Intelligence

Company-level data enriches leads with firmographic context:

| Source | What It Provides |
|--------|------------------|
| Coresignal | Job postings, employee counts, company details, hiring trends |
| Crunchbase | Funding rounds, investors, company stage, acquisition history |
| LinkedIn Sales Insights | Company profiles, employee growth, industry classification |
| PitchBook | Private company financials, M&A activity, investor data |

**Key models:**

| Stage | Model | Description |
|-------|-------|-------------|
| Staging | `stg_mech_outreach__coresignal_multi_companies` | Company data extraction |
| Intermediate | `int_growth__mo_coresignal_companies_most_recent` | Latest company snapshot |

```mermaid
flowchart LR
    subgraph RawSources ["Raw Data Sources"]
        CORESIGNAL_RAW["CORESIGNAL_MULTI_COMPANIES<br/>CORESIGNAL_DAILY_JOBS"]
        CRUNCHBASE_RAW["CRUNCHBASE_PEO<br/>CRUNCHBASE_TERMSHEET"]
        LINKEDIN_RAW["LINKEDIN_SALES_INSIGHTS_ACCOUNTS"]
        PITCHBOOK_RAW["PitchBook Data"]
    end
    
    subgraph Staging ["Staging Models"]
        CORESIGNAL_STG["stg_mech_outreach__coresignal_multi_companies"]
        CRUNCHBASE_STG["stg_mech_outreach__crunchbase_peo_companies<br/>stg_mech_outreach__crunchbase_termsheet_companies"]
        LINKEDIN_STG["stg_mech_outreach__linkedin_sales_insights_accounts"]
    end
    
    subgraph Intermediate ["Intermediate Processing"]
        CORESIGNAL_INT["int_growth__mo_coresignal_companies_most_recent<br/>int_growth__mo_coresignal_jobs_most_recent"]
        CRUNCHBASE_INT["int_growth__crunchbase_funding_rounds_ext<br/>int_growth__crunchbase_organizations_ext"]
    end
    
    subgraph CompanyMart ["Company Data Marts"]
        CORESIGNAL_MART["mart_growth__mo_coresignal_companies_addresses"]
        CRUNCHBASE_MART["mart_growth__crunchbase_peo_companies<br/>mart_growth__crunchbase_termsheet_companies"]
    end
    
    subgraph MasterDomain ["Master Domain Sources"]
        MASTER["stg_growth__master_domain_sources"]
    end
    
    subgraph ULD ["Unified Lead Database"]
        LSW["mart_growth__lsw_lead_data"]
    end
    
    CORESIGNAL_RAW --> CORESIGNAL_STG --> CORESIGNAL_INT --> CORESIGNAL_MART
    CRUNCHBASE_RAW --> CRUNCHBASE_STG --> CRUNCHBASE_INT --> CRUNCHBASE_MART
    LINKEDIN_RAW --> LINKEDIN_STG
    PITCHBOOK_RAW --> MASTER
    
    CORESIGNAL_MART --> MASTER
    CRUNCHBASE_MART --> MASTER
    LINKEDIN_STG --> MASTER
    
    MASTER --> LSW
```

---

### Intent Signals

Behavioral signals indicate companies actively researching solutions:

| Source | Signal Type |
|--------|-------------|
| G2 | Category page views, product comparisons, review reads |
| Gartner Digital Markets | Vendor research activity on Capterra, GetApp, Software Advice |
| Demandbase | Account-level intent across the web |
| TrustRadius | Product reviews, buyer research activity |
| Clearbit Reveal | Anonymous website visitor identification |
| RB2B | Website visitor tracking with contact resolution |

**Key models:**

| Stage | Model | Description |
|-------|-------|-------------|
| Intermediate | `int_growth__intent_domain_g2_companies` | G2 intent signals by domain |
| Intermediate | `int_growth__intent_domain_gartner_events` | Gartner intent signals by domain |

```mermaid
flowchart LR
    subgraph RawSources ["Raw Intent Data"]
        G2_RAW["G2_EVENTS"]
        GARTNER_RAW["GARTNER_EVENTS"]
        DEMANDBASE_RAW["DEMANDBASE_COMPANIES"]
        TRUSTRADIUS_RAW["TrustRadius Events"]
        CLEARBIT_REVEAL["Clearbit Reveal"]
        RB2B_RAW["RB2B Visitor Data"]
    end
    
    subgraph Staging ["Staging Models"]
        G2_STG["stg_mech_outreach__g2_events<br/>stg_mech_outreach__g2_companies"]
        GARTNER_STG["stg_mech_outreach__gartner_events"]
        DEMANDBASE_STG["stg_growth__demandbase_companies"]
        TRUSTRADIUS_STG["stg_growth__trustradius_events"]
        RB2B_STG["stg_growth__rb2b_events"]
    end
    
    subgraph Intermediate ["Intent Domain Models"]
        G2_INT["int_growth__intent_domain_g2_companies"]
        GARTNER_INT["int_growth__intent_domain_gartner_events"]
        DEMANDBASE_INT["int_growth__intent_domain_demandbase_companies"]
        TRUSTRADIUS_INT["int_growth__intent_domain_trustradius_companies"]
        CLEARBIT_INT["int_growth__intent_domain_clearbit_reveal_companies"]
        RB2B_INT["int_growth_intent_domain_rb2b_companies"]
    end
    
    subgraph IntentMart ["Intent Sources Mart"]
        INTENT_MART["mart_growth__intent_domain_sources"]
    end
    
    subgraph MasterDomain ["Master Domain Sources"]
        MASTER["stg_growth__master_domain_sources"]
    end
    
    subgraph ULD ["Unified Lead Database"]
        LSW["mart_growth__lsw_lead_data"]
    end
    
    G2_RAW --> G2_STG --> G2_INT --> INTENT_MART
    GARTNER_RAW --> GARTNER_STG --> GARTNER_INT --> INTENT_MART
    DEMANDBASE_RAW --> DEMANDBASE_STG --> DEMANDBASE_INT --> INTENT_MART
    TRUSTRADIUS_RAW --> TRUSTRADIUS_STG --> TRUSTRADIUS_INT --> INTENT_MART
    CLEARBIT_REVEAL --> CLEARBIT_INT --> INTENT_MART
    RB2B_RAW --> RB2B_STG --> RB2B_INT --> INTENT_MART
    
    INTENT_MART --> MASTER --> LSW
```

---

### Internal Systems

CRM and engagement platform data provides context on existing relationships:

| System | What It Provides |
|--------|------------------|
| Salesforce CRM | Existing leads, contacts, accounts, opportunities, ownership |
| Outreach.io | Email sequence status, engagement history, prospect records |
| Google Sheets | Audience configuration, suppression lists, campaign parameters |

**Key models:**

| Stage | Model | Description |
|-------|-------|-------------|
| Staging | `stg_sfdc__lead` | Salesforce lead records |
| Staging | `stg_sfdc__contact` | Salesforce contact records |
| Staging | `stg_sfdc__account` | Salesforce account records |
| Staging | `stg_outreach__sequence_state` | Email sequence membership |
| Staging | `stg_outreach__prospect` | Outreach prospect records |

```mermaid
flowchart LR
    subgraph Salesforce ["Salesforce CRM (PROD_RIPPLING_DWH.SFDC)"]
        SFDC_LEAD["LEAD"]
        SFDC_CONTACT["CONTACT"]
        SFDC_ACCOUNT["ACCOUNT"]
        SFDC_OPPT["OPPORTUNITY"]
    end
    
    subgraph Outreach ["Outreach.io (PROD_RIPPLING_DWH.OUTREACH)"]
        OUTREACH_SEQ["SEQUENCE"]
        OUTREACH_STATE["SEQUENCE_STATE"]
        OUTREACH_PROS["PROSPECT"]
        OUTREACH_MAIL["MAILING"]
    end
    
    subgraph GSheets ["Google Sheets (PROD_RIPPLING_DWH.GOOGLE_SHEETS)"]
        CONFIG["MO_AUDIENCE_CONFIG"]
    end
    
    subgraph SFDCStaging ["Salesforce Staging"]
        STG_LEAD["stg_sfdc__lead"]
        STG_CONTACT["stg_sfdc__contacts"]
        STG_ACCOUNT["stg_sfdc__accounts"]
        STG_OPPT["stg_sfdc__opportunity"]
    end
    
    subgraph OutreachStaging ["Outreach Staging"]
        STG_SEQ["stg_outreach__sequence"]
        STG_STATE["stg_outreach__sequence_state"]
        STG_PROS["stg_outreach__prospect"]
    end
    
    subgraph ConfigStaging ["Config Staging"]
        STG_CONFIG["stg_google_sheets__mo_audience_config"]
    end
    
    subgraph Processing ["SFDC Suppression & Context"]
        SFDC_SUPP["mart_growth__lead_sfdc_suppression"]
        SFDC_INPUT["mart_growth__lsw_lead_sfdc_input"]
    end
    
    subgraph ULD ["Unified Lead Database"]
        LSW["mart_growth__lsw_lead_data"]
    end
    
    SFDC_LEAD --> STG_LEAD --> SFDC_SUPP
    SFDC_CONTACT --> STG_CONTACT --> SFDC_SUPP
    SFDC_ACCOUNT --> STG_ACCOUNT --> SFDC_SUPP
    SFDC_OPPT --> STG_OPPT
    
    OUTREACH_SEQ --> STG_SEQ
    OUTREACH_STATE --> STG_STATE
    OUTREACH_PROS --> STG_PROS
    
    CONFIG --> STG_CONFIG
    
    SFDC_SUPP --> SFDC_INPUT --> LSW
    STG_STATE --> LSW
```

---

## The Unified Lead Database

The database consolidates all input sources into a single, deduplicated view of every prospecting lead.

### Core Models

| Model | Location | Purpose |
|-------|----------|---------|
| `mart_growth__lsw_lead_data` | `models/marts/growth/mart/lsw/` | **Primary unified lead table** - single source of truth |
| `mart_growth__lsw_lead_aggregate` | `models/marts/growth/mart/lsw/` | Multi-provider aggregation before final merge |

### Key Fields

The unified lead record includes:

- **Identity**: email, first_name, last_name, linkedin_url
- **Role**: title, persona, seniority, department
- **Company**: company_name, domain, industry, employee_count
- **Contact**: phone, mobile_phone, address
- **Enrichment**: enrichment_source, enrichment_date, data_quality_score
- **Salesforce**: lead_id, contact_id, account_id, owner

### Deduplication Logic

1. **Email as primary key**: All leads matched by lowercase email address
2. **Provider priority**: When multiple sources have conflicting data, a priority hierarchy determines the winning value
3. **Recency weighting**: More recent enrichment data may override older records
4. **Quality scoring**: Data completeness and validation status factor into field selection

---

## Outputs: What Uses the Database

### Email Campaign Audience

**Model**: `mart_growth__mo_eligible_audience`  
**Location**: `models/marts/growth/mart/mo_population/`

Determines which leads are eligible for automated email sequences based on:

- Suppression rules (existing customers, opt-outs, competitors)
- Sequence assignment logic
- Personalization flags for email content

**Destinations**: Outreach.io sequences, Brevo marketing campaigns

```mermaid
flowchart LR
    subgraph ULD ["Unified Lead Database"]
        LSW["mart_growth__lsw_lead_data"]
    end
    
    subgraph Sources ["Configuration & State"]
        POP["stg_growth__mechanized_outreach_population"]
        CONFIG["stg_google_sheets__mo_audience_config"]
        SEQ_STATE["stg_outreach__sequence_state"]
        SEQ["stg_outreach__sequence"]
    end
    
    subgraph Processing ["Eligibility Processing"]
        ELIGIBLE["mart_growth__mo_eligible_audience"]
    end
    
    subgraph Destinations ["Email Platforms"]
        OUTREACH["Outreach.io Sequences"]
        BREVO["Brevo Campaigns"]
    end
    
    LSW --> POP
    POP --> ELIGIBLE
    CONFIG --> ELIGIBLE
    SEQ_STATE --> ELIGIBLE
    SEQ --> ELIGIBLE
    
    ELIGIBLE --> OUTREACH
    ELIGIBLE --> BREVO
```

---

### Direct Mail Campaigns

**Model**: `mart_growth__direct_mail_lead_enrichment`  
**Location**: `models/marts/growth/mart/direct_mail/`

Provides verified mailing addresses for physical mail campaigns:

- Address validation and deliverability status
- Distance from Rippling offices (for local events)
- Mail-specific suppression rules

**Destination**: Lahlouh (print/mail fulfillment vendor)

```mermaid
flowchart LR
    subgraph ULD ["Unified Lead Database"]
        LSW["mart_growth__lsw_lead_data"]
    end
    
    subgraph Sources ["Address Sources"]
        ENRICHMENT["stg_mech_outreach__direct_mail_lead_enrichment"]
        GEONAMES["int_growth__geonames_city_coordinates"]
        LEAD["stg_sfdc__lead"]
        CONTACT["stg_sfdc__contacts"]
    end
    
    subgraph Processing ["Address Processing"]
        ADDR["mart_growth__direct_mail_lead_address"]
        DOMAIN_ADDR["mart_growth__direct_mail_domain_address"]
        DM_ENRICH["mart_growth__direct_mail_lead_enrichment"]
    end
    
    subgraph Destination ["Fulfillment"]
        LAHLOUH["Lahlouh<br/>(Print/Mail Vendor)"]
    end
    
    LSW --> ENRICHMENT
    LEAD --> ADDR
    CONTACT --> ADDR
    ENRICHMENT --> DM_ENRICH
    GEONAMES --> DM_ENRICH
    ADDR --> DOMAIN_ADDR
    DOMAIN_ADDR --> DM_ENRICH
    
    DM_ENRICH --> LAHLOUH
```

---

### AI Email Personalization

**Model**: `mart_growth__ai_email_contact_and_account_data`  
**Location**: `models/marts/growth/mart/ai_email/`

Provides context for AI-generated email content:

- Recent company news and milestones
- Funding events, hiring trends
- Past email engagement history
- Gong call summaries

**Destination**: AI email assistant tools for SDRs

```mermaid
flowchart LR
    subgraph ULD ["Unified Lead Database"]
        LSW["mart_growth__lsw_lead_data"]
    end
    
    subgraph CRM ["Salesforce Data"]
        LEAD["stg_sfdc__lead"]
        CONTACT["stg_sfdc__contacts"]
        ACCOUNT["stg_sfdc__accounts"]
        OPPT["stg_sfdc__opportunity"]
        GONG["stg_sfdc__gong_call"]
        TASK["stg_sfdc__task"]
    end
    
    subgraph CompanyData ["Company Intelligence"]
        MASTER["stg_growth__master_domain_sources"]
        CASE_STUDIES["int_growth__marketing_case_studies_crosswalked"]
    end
    
    subgraph IntModels ["Intermediate Processing"]
        CONTACT_DATA["int_growth__ai_email_contact_data"]
        ACCOUNT_DATA["int_growth__ai_email_account_data"]
        EMAIL_AGG["int_growth__email_aggregation"]
        OPPT_DATA["int_growth__opportunity_data"]
        GONG_AGG["int_growth__gong_calls_aggregation"]
    end
    
    subgraph MartModel ["AI Email Mart"]
        AI_EMAIL["mart_growth__ai_email_contact_and_account_data"]
    end
    
    subgraph Destination ["AI Tools"]
        SDR["SDR AI Email Assistant"]
    end
    
    LSW --> CONTACT_DATA
    LEAD --> CONTACT_DATA
    CONTACT --> CONTACT_DATA
    ACCOUNT --> CONTACT_DATA
    ACCOUNT --> ACCOUNT_DATA
    MASTER --> ACCOUNT_DATA
    CASE_STUDIES --> ACCOUNT_DATA
    TASK --> EMAIL_AGG
    OPPT --> OPPT_DATA
    GONG --> GONG_AGG
    
    CONTACT_DATA --> AI_EMAIL
    ACCOUNT_DATA --> AI_EMAIL
    EMAIL_AGG --> AI_EMAIL
    OPPT_DATA --> AI_EMAIL
    GONG_AGG --> AI_EMAIL
    
    AI_EMAIL --> SDR
```

---

### CRM Enrichment

**Model**: `mart_growth__lsw_lead_data`

Enriched lead data flows back to Salesforce to:

- Fill in missing contact information
- Update job titles and company details
- Add intent signals and scoring

**Destination**: Salesforce CRM

```mermaid
flowchart LR
    subgraph Providers ["Lead Enrichment Providers"]
        APOLLO["int_growth__apollo_lead_enrichment_output"]
        ZOOMINFO["int_growth__zoominfo_lead_enrichment_output"]
        COGNISM["int_growth__cognism_lead_enrichment_output"]
        CLEARBIT["int_growth__clearbit_lead_enrichment_output"]
    end
    
    subgraph CompanyData ["Company Intelligence"]
        MASTER["stg_growth__master_domain_sources"]
        MERGED["stg_growth__mo_merged_companies"]
    end
    
    subgraph Aggregation ["Multi-Provider Aggregation"]
        AGGREGATE["mart_growth__lsw_lead_aggregate"]
    end
    
    subgraph ULD ["Unified Lead Database"]
        LSW["mart_growth__lsw_lead_data"]
        SNAPSHOT["mart_growth__lsw_lead_data_snapshot"]
    end
    
    subgraph Destination ["CRM"]
        SFDC["Salesforce CRM"]
    end
    
    APOLLO --> AGGREGATE
    ZOOMINFO --> AGGREGATE
    COGNISM --> AGGREGATE
    CLEARBIT --> AGGREGATE
    
    AGGREGATE --> LSW
    MASTER --> LSW
    MERGED --> LSW
    
    LSW --> SNAPSHOT
    LSW --> SFDC
```

---

### BI Dashboards & Analytics

**Model**: `mart_growth__email_sends`  
**Location**: `models/marts/growth/mart/compliance/`

Tracks email engagement and compliance:

- Send/open/click/reply events
- Opt-out tracking
- Deliverability metrics
- Marketing attribution

**Destination**: BI dashboards, marketing analytics

```mermaid
flowchart LR
    subgraph EmailPlatforms ["Email Platforms"]
        BREVO_RAW["stg_growth__brevo_marketing_email_events"]
        BREVO_TMPL["stg_marketing_ops__brevo_email_events"]
        OUTREACH_MAIL["stg_outreach__mailing"]
        OUTREACH_PROS["stg_outreach__prospect"]
        OUTREACH_SEQ["stg_outreach__sequence"]
    end
    
    subgraph CRM ["Salesforce Context"]
        ACCOUNT["stg_sfdc__accounts"]
        ACCT_HIST["stg_sfdc__account_history"]
        CONTACT["stg_sfdc__contacts"]
        LEAD["stg_sfdc__lead"]
        EMAIL_LOOKUP["int_growth__sfdc_email_lookup"]
    end
    
    subgraph IntModels ["Intermediate Processing"]
        BREVO_SENDS["int_growth__brevo_email_sends"]
        OUTREACH_SENDS["int_growth__outreach_email_sends"]
    end
    
    subgraph MartModel ["Compliance Mart"]
        EMAIL_SENDS["mart_growth__email_sends"]
        FORM_FILLS["mart_growth__form_fill_submissions"]
    end
    
    subgraph Destinations ["Analytics"]
        BI["BI Dashboards"]
        MARKETING["Marketing Analytics"]
    end
    
    BREVO_RAW --> BREVO_SENDS
    BREVO_TMPL --> BREVO_SENDS
    EMAIL_LOOKUP --> BREVO_SENDS
    
    OUTREACH_MAIL --> OUTREACH_SENDS
    OUTREACH_PROS --> OUTREACH_SENDS
    OUTREACH_SEQ --> OUTREACH_SENDS
    
    BREVO_SENDS --> EMAIL_SENDS
    OUTREACH_SENDS --> EMAIL_SENDS
    ACCOUNT --> EMAIL_SENDS
    ACCT_HIST --> EMAIL_SENDS
    CONTACT --> EMAIL_SENDS
    LEAD --> EMAIL_SENDS
    
    EMAIL_SENDS --> BI
    EMAIL_SENDS --> MARKETING
    FORM_FILLS --> BI
```

---

## External Data Source Reference

| Category | Source | Database/Schema | Key Tables | I/O |
|----------|--------|-----------------|------------|-----|
| Lead Enrichment | Apollo | `PROD_DATALAKE_DB.MECH_OUTREACH` | `APOLLO_LEAD_ENRICHMENT`, `APOLLO_LEAD_SEARCH` | Input |
| Lead Enrichment | ZoomInfo | `PROD_DATALAKE_DB.MECH_OUTREACH` | `ZOOMINFO_LEAD_ENRICHMENT`, `ZOOMINFO_LEAD_SEARCH` | Input |
| Lead Enrichment | Cognism | `PROD_DATALAKE_DB.MECH_OUTREACH` | `COGNISM_LEAD_ENRICHMENT`, `COGNISM_LEAD_SEARCH` | Input |
| Lead Enrichment | Clearbit | `PROD_DATALAKE_DB.MECH_OUTREACH` | `CLEARBIT_LEAD_ENRICHMENT`, `CLEARBIT_LEAD_SEARCH` | Input |
| Company Data | Coresignal | `PROD_DATALAKE_DB.MECH_OUTREACH` | `CORESIGNAL_DAILY_JOBS`, `CORESIGNAL_MULTI_COMPANIES` | Input |
| Company Data | Crunchbase | `PROD_DATALAKE_DB.MECH_OUTREACH` | `CRUNCHBASE_PEO`, `CRUNCHBASE_TERMSHEET` | Input |
| Intent Signals | G2 | `PROD_RIPPLING_DWH.GROWTH` | `G2_EVENTS` | Input |
| Intent Signals | Gartner | `PROD_RIPPLING_DWH.GROWTH` | `GARTNER_EVENTS` | Input |
| Intent Signals | Demandbase | `PROD_RIPPLING_DWH.GROWTH` | `DEMANDBASE_COMPANIES` | Input |
| CRM | Salesforce | `PROD_RIPPLING_DWH.SFDC` | `LEAD`, `CONTACT`, `ACCOUNT`, `OPPORTUNITY` | Both |
| Platform | Outreach.io | `PROD_RIPPLING_DWH.OUTREACH` | `SEQUENCE`, `SEQUENCE_STATE`, `PROSPECT`, `MAILING` | Both |
| Config | Google Sheets | `PROD_RIPPLING_DWH.GOOGLE_SHEETS` | `MO_AUDIENCE_CONFIG` | Input |
| Email Campaigns | Brevo | External | Marketing campaigns | Output |
| Direct Mail | Lahlouh | External | Print/mail fulfillment | Output |
| AI Email | AI Email Tools | External | SDR email personalization | Output |
| Analytics | BI Dashboards | External | Dashboards, marketing analytics | Output |
