# Common Snowflake Tables

This document lists commonly used Snowflake tables in the Rippling data warehouse.

---

## dev_rippling_db

### growth_christian Schema
- `dev_rippling_db.growth_christian.TEMP_SDR_INSTANT_GIFTING_LEADS`

---

## prod_rippling_dwh

### google_sheets Schema
- `prod_rippling_dwh.google_sheets.automated_email_sequences_id`

### growth Schema
- `prod_rippling_dwh.growth.analyzed_replies`
- `prod_rippling_dwh.growth.mechanized_outreach_population`
- `prod_rippling_dwh.growth.mo_reply_classification_results`
- `prod_rippling_dwh.growth.mo_reply_classification_results_biz_layer`
- `prod_rippling_dwh.growth.mech_outreach_email_classification_input`
- `prod_rippling_dwh.growth.master_email_validation_data`


### outreach Schema

**📘 [Detailed Documentation: OUTREACH_TABLES.md](./OUTREACH_TABLES.md)**

- `prod_rippling_dwh.outreach.data_connection` - Maps Outreach objects to external systems (Salesforce)
- `prod_rippling_dwh.outreach.event` - All events and activities in Outreach (~1.8B records)
- `prod_rippling_dwh.outreach.mailing` - Email communications with delivery status and engagement metrics (~104M records)
- `prod_rippling_dwh.outreach.prospect` - Contact/lead information with detailed profile data (~24.9M records)
- `prod_rippling_dwh.outreach.sequence` - Email/outreach sequence definitions and performance (~22K records)
- `prod_rippling_dwh.outreach.sequence_state` - Individual prospects' progress through sequences (~35M records)
- `prod_rippling_dwh.outreach.sequence_step` - Individual steps within sequences (~95K records)
- `prod_rippling_dwh.outreach.sequence_tag` - Tags for sequence organization

### sfdc Schema

**📘 [Detailed Documentation: SFDC_TABLES.md](./SFDC_TABLES.md)**

- `prod_rippling_dwh.sfdc.account` (~681K records, 982 columns)
- `prod_rippling_dwh.sfdc.campaign` (~11.8K records)
- `prod_rippling_dwh.sfdc.campaign_member` (~3.1M records)
- `prod_rippling_dwh.sfdc.contact` (~1.2M records, 720 columns)
- `prod_rippling_dwh.sfdc.EXTERNAL_EMAIL_TEMPLATE_C` (~92 records)
- `prod_rippling_dwh.sfdc.gong_gong_call_c` (~115K records)
- `prod_rippling_dwh.sfdc.lead` (~18.7M records, 727 columns)
- `prod_rippling_dwh.sfdc.mech_outreach_email_alias_c` (~189 records)
- `prod_rippling_dwh.sfdc.opportunity` (~622K records, 551 columns)
- `prod_rippling_dwh.sfdc.opportunity_contact_role` (~575K records)
- `prod_rippling_dwh.sfdc.opportunity_team_member` (~1.3M records)
- `prod_rippling_dwh.sfdc.outbound_marketing_communication_c` (~47.2M records)
- `prod_rippling_dwh.sfdc.record_type` (~235 records)
- `prod_rippling_dwh.sfdc.related_email_domain_c` (~1.2M records)
- `prod_rippling_dwh.sfdc.report` (~11.1K records)
- `prod_rippling_dwh.sfdc.task` (~22.3M records)
- `prod_rippling_dwh.sfdc.user` (~493K records, 334 columns)

### marketing_ops Schema
- `prod_rippling_dwh.marketing_ops.inbound_retry_processed`
- `prod_rippling_dwh.marketing_ops.inbound_retry_blocked`