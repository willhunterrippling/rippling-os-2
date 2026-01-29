-- Source: suppression_reason_breakdown.sql
-- Added: 2026-01-29
-- Type: SQL Pattern - Suppression Analysis Query
-- Description: Analyze all suppression reasons in MO leads population, ranked by volume
-- Table: PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS

-- =============================================================================
-- SUPPRESSION REASON BREAKDOWN QUERY
-- =============================================================================
-- Purpose: Analyze all suppression reasons in the MO leads population
-- Output: Count of leads suppressed by each reason, sorted by volume
-- Table: PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS
-- 
-- Reference: MO_SUPPRESSION_RULES_DOCUMENTATION.md
-- 
-- Notes:
-- - Leads can have multiple suppression reasons (flags are not mutually exclusive)
-- - This query separates aggregate rollup flags from underlying suppression reasons
-- - Aggregate flags: IS_RECORD_SUPPRESSED, IS_LEAD_SUPPRESSION, IS_ACCOUNT_SUPPRESSED
-- =============================================================================

WITH total_leads AS (
    SELECT COUNT(*) AS total_count
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS
),

-- Aggregate rollup flags (for summary metrics only)
aggregate_flags AS (
    SELECT 'Is Record Suppressed' AS suppression_reason, COUNT(*) AS lead_count
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_RECORD_SUPPRESSED = TRUE
    
    UNION ALL
    SELECT 'Is Lead Suppression', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_LEAD_SUPPRESSION = TRUE
    
    UNION ALL
    SELECT 'Is Account Suppressed', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_ACCOUNT_SUPPRESSED = TRUE
),

-- Underlying suppression reasons (the actual drivers)
suppression_counts AS (
    -- =========================================================================
    -- LEAD-LEVEL SUPPRESSION FLAGS (Person-level)
    -- =========================================================================
    
    -- INELIGIBLE_PERSONA: Wrong job function/persona for outreach
    SELECT 'Ineligible Persona' AS suppression_reason, 'Lead' AS suppression_type, COUNT(*) AS lead_count
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE INELIGIBLE_PERSONA = TRUE
    
    UNION ALL
    -- SALES_OWNED_LEAD: Lead is owned by active sales rep (not automation queues)
    SELECT 'Sales Owned Lead', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE SALES_OWNED_LEAD = TRUE
    
    UNION ALL
    -- LEAD_IN_ACTIVE_SEQUENCE: Currently being sequenced in Outreach
    SELECT 'Lead In Active Sequence', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE LEAD_IN_ACTIVE_SEQUENCE = TRUE
    
    UNION ALL
    -- LEAD_ENROLLED_IN_SEQUENCE: Has sequence name assigned
    SELECT 'Lead Enrolled In Sequence', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE LEAD_ENROLLED_IN_SEQUENCE = TRUE
    
    UNION ALL
    -- INELIGIBLE_LEAD_SOURCE: Lead source is Outbound/Prospected (already touched)
    SELECT 'Ineligible Lead Source', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE INELIGIBLE_LEAD_SOURCE = TRUE
    
    UNION ALL
    -- INELIGIBLE_LEAD_STATUS: Status not NEW or RECYCLED
    SELECT 'Ineligible Lead Status', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE INELIGIBLE_LEAD_STATUS = TRUE
    
    UNION ALL
    -- DSAR_COMPLIANCE_LEAD_SUPPRESSION: GDPR/CCPA compliance
    SELECT 'DSAR Compliance Lead Suppression', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE DSAR_COMPLIANCE_LEAD_SUPPRESSION = TRUE
    
    UNION ALL
    -- INVALID_EMAIL: Failed NeverBounce/Emailable validation or personal domain
    SELECT 'Invalid Email', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE INVALID_EMAIL = TRUE
    
    UNION ALL
    -- GENERIC_OUTREACH_SUPPRESSION: Currently unused (always NULL)
    SELECT 'Generic Outreach Suppression', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE GENERIC_OUTREACH_SUPPRESSION = TRUE
    
    UNION ALL
    -- LEAD_OPTED_OUT: Person opted out of communications
    SELECT 'Lead Opted Out', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE LEAD_OPTED_OUT = TRUE
    
    UNION ALL
    -- IS_LEAD_NO_LONGER_AT_ACCOUNT: Person left the company
    SELECT 'Is Lead No Longer At Account', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_LEAD_NO_LONGER_AT_ACCOUNT = TRUE
    
    UNION ALL
    -- EE_SIZE_OUT_OF_RANGE: Company >5000 employees (from domain lookup)
    SELECT 'EE Size Out Of Range', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE EE_SIZE_OUT_OF_RANGE = TRUE
    
    UNION ALL
    -- ADDED_IN_SEQUENCE_MORE_THAN_6: Been in 8+ sequences (threshold raised from 6)
    SELECT 'Added In Sequence More Than 6', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE ADDED_IN_SEQUENCE_MORE_THAN_6 = TRUE
    
    UNION ALL
    -- WITH_NEGATIVE_REPLY: ML classified a reply as negative
    SELECT 'With Negative Reply', 'Lead', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE WITH_NEGATIVE_REPLY = TRUE
    
    -- =========================================================================
    -- ACCOUNT-LEVEL SUPPRESSION FLAGS (Company-level)
    -- =========================================================================
    
    UNION ALL
    -- IS_NAMED_ACCOUNT: Strategic/named account owned by specific reps
    SELECT 'Is Named Account', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_NAMED_ACCOUNT = TRUE
    
    UNION ALL
    -- IS_CUSTOMER: Current Rippling customer
    SELECT 'Is Customer', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_CUSTOMER = TRUE
    
    UNION ALL
    -- IS_CHURNED: Former/churned customer
    SELECT 'Is Churned', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_CHURNED = TRUE
    
    UNION ALL
    -- IS_IN_IMPLEMENTATION: Currently implementing Rippling
    SELECT 'Is In Implementation', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_IN_IMPLEMENTATION = TRUE
    
    UNION ALL
    -- IS_COMPETITOR: Company is a competitor
    SELECT 'Is Competitor', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_COMPETITOR = TRUE
    
    UNION ALL
    -- IS_OPT_OUT_ACCOUNT: Account opted out of communications
    SELECT 'Is Opt Out Account', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_OPT_OUT_ACCOUNT = TRUE
    
    UNION ALL
    -- LEGAL_EXCLUSION: Legally excluded from outreach
    SELECT 'Legal Exclusion', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE LEGAL_EXCLUSION = TRUE
    
    UNION ALL
    -- INELIGIBLE_INDUSTRY: Industry in exclusion list (govt, cannabis, mining, etc.)
    SELECT 'Ineligible Industry', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE INELIGIBLE_INDUSTRY = TRUE
    
    UNION ALL
    -- INELIGIBLE_COMPANY_SIZE: Outside segment ranges or in large_companies list
    SELECT 'Ineligible Company Size', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE INELIGIBLE_COMPANY_SIZE = TRUE
    
    UNION ALL
    -- IS_GOV_COMPANY: Government entity (based on domain suffix)
    SELECT 'Is Gov Company', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_GOV_COMPANY = TRUE
    
    UNION ALL
    -- IS_PARTNER_ACCOUNT: Partner record type or channel-owned
    SELECT 'Is Partner Account', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_PARTNER_ACCOUNT = TRUE
    
    UNION ALL
    -- OPEN_OPPORTUNITY: Has active opportunity on account
    SELECT 'Open Opportunity', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE OPEN_OPPORTUNITY = TRUE
    
    UNION ALL
    -- IS_WHEN_I_WORK_ACCOUNT: From When I Work acquisition
    SELECT 'Is When I Work Account', 'Account', COUNT(*)
    FROM PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS WHERE IS_WHEN_I_WORK_ACCOUNT = TRUE
)

-- Main output: underlying suppression reasons ranked by volume
SELECT
    ROW_NUMBER() OVER (ORDER BY lead_count DESC) AS rank,
    suppression_reason,
    suppression_type,
    lead_count,
    ROUND(lead_count * 100.0 / total_count, 2) AS percentage_of_total_leads
FROM suppression_counts, total_leads
ORDER BY lead_count DESC;
