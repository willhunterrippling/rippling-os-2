-- Source: mo_leads_with_suppression.sql
-- Added: 2026-01-29
-- Type: Code Reference - MO Suppression Logic Implementation
-- Description: Main SQL file that calculates all suppression flags for MO leads
-- Output Table: GROWTH.MASTER_MECH_OUTREACH_LEADS

INSERT INTO {{ params.schema }}.MASTER_MECH_OUTREACH_LEADS_V2_SNAPSHOT
(
    SALESFORCE_ID,
    SFDC_OBJECT_TYPE,
    FIRST_NAME,
    LAST_NAME,
    TITLE,
    PERSONA,
    EMAIL,
    EXPERIMENT,
    PEO_PROVIDER,
    PEO_PROVIDER_C,
    PEO_PROVIDER_LAST_UPDATED_C,
    HQ_COUNTRY,
    HQ_REGION,
    HQ_CITY,
    HQ_STREET_ADDRESS,
    EMAIL_SOURCE,
    LINKEDIN_URL,
    DOMAIN,
    COMPANY_NAME,
    EE_SIZE,
    LAST_FORM_FILL_DATE_TIME_C,
    NEW_RECYCLED_STATUS,
    PERSONALIZED_SENTENCE_1,
    PERSONALIZED_SENTENCE_2,
    LAST_ACTIVITY_DATE,
    ADDED_TO_SEQUENCE,
    COMPANY_START_DATE,
    POSITION_START_DATE,
    LAST_INBOUND_CONTENT_FF_C,
    LAST_INBOUND_CONTENT_FF_DATE_TIME_C,

    IS_ON_OPPORTUNITY,
    CLOSED_LOST_DATE,
    FUTURE_CONTACT_DATE,
    LAST_STAGE_BEFORE_CLOSE,
    CLOSED_LOST_ACCOUNT_SEGMENT,
    AUDIENCE_TYPE,
    JOB_FUNCTION_PREDICTION,
    SENIORITY_PREDICTION,

    INDUSTRY,
    INDUSTRY_SEGMENT,
    IS_ELIGIBLE_FOR_RANKING,
    CAMPAIGN_TYPE,

    OUTREACH_ID,
    JOB_CHANGE,
    JOB_CHANGE_DATE,
    JOB_PROMOTION,
    JOB_PROMOTION_DATE,
    EMAIL_NVRB_VALIDATED_TS,

    INELIGIBLE_PERSONA,
    SALES_OWNED_LEAD,
    LEAD_IN_ACTIVE_SEQUENCE,
    LEAD_ENROLLED_IN_SEQUENCE,
    GENERIC_OUTREACH_SUPPRESSION,
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
    IS_LEAD_SUPPRESSION,

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
    IS_WHEN_I_WORK_ACCOUNT,
    IS_ACCOUNT_SUPPRESSED,
    IS_RECORD_SUPPRESSED,

    RUN_DT,

    --Lifcycle Related Fields
    DEMO_REQUEST_DATE_TIME_C,
    QUOTE_REQUEST_DATE_TIME_C,
    PEO_REQUEST_DATE_TIME_C,
    TOUR_REQUEST_DATE_TIME_C,
    CONTACT_US_DATE_TIME_C,
    OWNER_ROLE_NAME,
    IS_INBOUND_LEAD,
    DEAL_LOSS_OUTCOME_C,
    DEMO_DATE_C,

    OPEN_OPPORTUNITY_ON_LEAD

    , IS_WEBINAR_LEAD
    , LEAD_LATEST_WEBINAR_DATE
    , LEAD_LATEST_WEBINAR_CAMPAIGN
    , IS_EVENT_LEAD
    , LEAD_LATEST_EVENT_DATE
    , LEAD_LATEST_EVENT_CAMPAIGN
    , IS_CONTENT_LEAD
    , LEAD_LATEST_CONTENT_DATE
    , LEAD_LATEST_CONTENT_CAMPAIGN
    , IS_FORM_FILL_LEAD
    , LEAD_LATEST_FORM_FILL_DATE
    , IS_CLOSED_LOST_LEAD
    , LEAD_LATEST_CLOSED_LOST_DATE

    , GLOBAL_ATTACH_OPPORTUNITY_ON_LEAD
    , GLOBAL_ONLY_OPPORTUNITY_ON_LEAD
    , LEAD_LAST_STAGE_CHANGE_DATE
    , LEAD_CLOSED_OWNER_ROLE
    , LEAD_GLOBAL_REFERRAL_STATUS
    , LEAD_PRODUCT_INTEREST

    , ACCOUNT_ID_ON_LEAD
    , LIKELY_GLOBAL_FIT
    , COMPANY_SEGMENT
    , GROWTH_TIER
)
SELECT
    SALESFORCE_ID,
    SFDC_OBJECT_TYPE,
    FIRST_NAME,
    LAST_NAME,
    TITLE,
    PERSONA,
    EMAIL,
    EXPERIMENT,
    PEO_PROVIDER,
    PEO_PROVIDER_C,
    PEO_PROVIDER_LAST_UPDATED_C,
    HQ_COUNTRY,
    HQ_REGION,
    HQ_CITY,
    HQ_STREET_ADDRESS,
    EMAIL_SOURCE,
    LINKEDIN_URL,
    DOMAIN,
    COMPANY_NAME,
    EE_SIZE,
    LAST_FORM_FILL_DATE_TIME_C,
    NEW_RECYCLED_STATUS,
    PERSONALIZED_SENTENCE_1,
    PERSONALIZED_SENTENCE_2,
    LAST_ACTIVITY_DATE,
    ADDED_TO_SEQUENCE,
    COMPANY_START_DATE,
    POSITION_START_DATE,
    LAST_INBOUND_CONTENT_FF_C,
    LAST_INBOUND_CONTENT_FF_DATE_TIME_C,

    IS_ON_OPPORTUNITY,
    CLOSED_LOST_DATE,
    FUTURE_CONTACT_DATE,
    LAST_STAGE_BEFORE_CLOSE,
    CLOSED_LOST_ACCOUNT_SEGMENT,
    AUDIENCE_TYPE,
    JOB_FUNCTION_PREDICTION,
    SENIORITY_PREDICTION,

    INDUSTRY,
    INDUSTRY_SEGMENT,
    IS_ELIGIBLE_FOR_RANKING,
    CAMPAIGN_TYPE,

    OUTREACH_ID,
    JOB_CHANGE,
    JOB_CHANGE_DATE,
    JOB_PROMOTION,
    JOB_PROMOTION_DATE,
    EMAIL_NVRB_VALIDATED_TS,

    INELIGIBLE_PERSONA,
    SALES_OWNED_LEAD,
    LEAD_IN_ACTIVE_SEQUENCE,
    LEAD_ENROLLED_IN_SEQUENCE,
    GENERIC_OUTREACH_SUPPRESSION,
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
    IS_LEAD_SUPPRESSION,

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
    IS_WHEN_I_WORK_ACCOUNT,
    IS_ACCOUNT_SUPPRESSED,
    IS_RECORD_SUPPRESSED,

    RUN_DT,

    DEMO_REQUEST_DATE_TIME_C,
    QUOTE_REQUEST_DATE_TIME_C,
    PEO_REQUEST_DATE_TIME_C,
    TOUR_REQUEST_DATE_TIME_C,
    CONTACT_US_DATE_TIME_C,
    OWNER_ROLE_NAME,
    IS_INBOUND_LEAD,
    DEAL_LOSS_OUTCOME_C,
    DEMO_DATE_C,

    OPEN_OPPORTUNITY_ON_LEAD

    , IS_WEBINAR_LEAD
    , LEAD_LATEST_WEBINAR_DATE
    , LEAD_LATEST_WEBINAR_CAMPAIGN
    , IS_EVENT_LEAD
    , LEAD_LATEST_EVENT_DATE
    , LEAD_LATEST_EVENT_CAMPAIGN
    , IS_CONTENT_LEAD
    , LEAD_LATEST_CONTENT_DATE
    , LEAD_LATEST_CONTENT_CAMPAIGN
    , IS_FORM_FILL_LEAD
    , LEAD_LATEST_FORM_FILL_DATE
    , IS_CLOSED_LOST_LEAD
    , LEAD_LATEST_CLOSED_LOST_DATE

    , GLOBAL_ATTACH_OPPORTUNITY_ON_LEAD
    , GLOBAL_ONLY_OPPORTUNITY_ON_LEAD
    , LEAD_LAST_STAGE_CHANGE_DATE
    , LEAD_CLOSED_OWNER_ROLE
    , LEAD_GLOBAL_REFERRAL_STATUS
    , LEAD_PRODUCT_INTEREST

    , ACCOUNT_ID_ON_LEAD
    , LIKELY_GLOBAL_FIT
    , COMPANY_SEGMENT
    , GROWTH_TIER
FROM {{ params.schema }}.MASTER_MECH_OUTREACH_LEADS;
INSERT OVERWRITE INTO {{ params.schema }}.MASTER_MECH_OUTREACH_LEADS(
    SALESFORCE_ID,
    SFDC_OBJECT_TYPE,
    FIRST_NAME,
    LAST_NAME,
    TITLE,
    PERSONA,
    EMAIL,
    EXPERIMENT,
    PEO_PROVIDER,
    PEO_PROVIDER_C,
    PEO_PROVIDER_LAST_UPDATED_C,
    HQ_COUNTRY,
    HQ_REGION,
    HQ_CITY,
    HQ_STREET_ADDRESS,
    EMAIL_SOURCE,
    LINKEDIN_URL,
    DOMAIN,
    COMPANY_NAME,
    EE_SIZE,
    LAST_FORM_FILL_DATE_TIME_C,
    NEW_RECYCLED_STATUS,
    PERSONALIZED_SENTENCE_1,
    PERSONALIZED_SENTENCE_2,
    LAST_ACTIVITY_DATE,
    ADDED_TO_SEQUENCE,
    COMPANY_START_DATE,
    POSITION_START_DATE,
    LAST_INBOUND_CONTENT_FF_C,
    LAST_INBOUND_CONTENT_FF_DATE_TIME_C,

    IS_ON_OPPORTUNITY,
    CLOSED_LOST_DATE,
    FUTURE_CONTACT_DATE,
    LAST_STAGE_BEFORE_CLOSE,
    CLOSED_LOST_ACCOUNT_SEGMENT,
    AUDIENCE_TYPE,
    STATUS,
    OWNER,
    SEQUENCE_NAME,
    COMPANY_TYPE,
    DEMO_REQUEST_DATE_TIME_C,
    QUOTE_REQUEST_DATE_TIME_C,
    PEO_REQUEST_DATE_TIME_C,
    TOUR_REQUEST_DATE_TIME_C,
    CONTACT_US_DATE_TIME_C,
    JOB_FUNCTION_PREDICTION,
    SENIORITY_PREDICTION,

    INDUSTRY,
    INDUSTRY_SEGMENT,
    IS_ELIGIBLE_FOR_RANKING,
    CAMPAIGN_TYPE,

    OUTREACH_ID,
    JOB_CHANGE,
    JOB_CHANGE_DATE,
    JOB_PROMOTION,
    JOB_PROMOTION_DATE,
    EMAIL_NVRB_VALIDATED_TS,

    INELIGIBLE_PERSONA,
    SALES_OWNED_LEAD,
    LEAD_IN_ACTIVE_SEQUENCE,
    LEAD_ENROLLED_IN_SEQUENCE,
    GENERIC_OUTREACH_SUPPRESSION,
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
    IS_LEAD_SUPPRESSION,

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
    IS_WHEN_I_WORK_ACCOUNT,
    IS_ACCOUNT_SUPPRESSED,
    IS_RECORD_SUPPRESSED,

    RUN_DT,

    OWNER_ROLE_NAME,
    IS_INBOUND_LEAD,
    DEAL_LOSS_OUTCOME_C,
    DEMO_DATE_C,

    OPEN_OPPORTUNITY_ON_LEAD

    , IS_WEBINAR_LEAD
    , LEAD_LATEST_WEBINAR_DATE
    , LEAD_LATEST_WEBINAR_CAMPAIGN
    , IS_EVENT_LEAD
    , LEAD_LATEST_EVENT_DATE
    , LEAD_LATEST_EVENT_CAMPAIGN
    , IS_CONTENT_LEAD
    , LEAD_LATEST_CONTENT_DATE
    , LEAD_LATEST_CONTENT_CAMPAIGN
    , IS_FORM_FILL_LEAD
    , LEAD_LATEST_FORM_FILL_DATE
    , IS_CLOSED_LOST_LEAD
    , LEAD_LATEST_CLOSED_LOST_DATE

    , GLOBAL_ATTACH_OPPORTUNITY_ON_LEAD
    , GLOBAL_ONLY_OPPORTUNITY_ON_LEAD
    , LEAD_LAST_STAGE_CHANGE_DATE
    , LEAD_CLOSED_OWNER_ROLE
    , LEAD_GLOBAL_REFERRAL_STATUS
    , LEAD_PRODUCT_INTEREST

    , ACCOUNT_ID_ON_LEAD
    , LIKELY_GLOBAL_FIT
    , COMPANY_SEGMENT
    , GROWTH_TIER
)

WITH
 LARGE_COMPANIES AS ({{params.invalid_big_companies_query}})
, latest_dm_activity as (
    select coalesce(cm.lead_id, cm.contact_id) sfdc_id, max(c.start_date) dm_activity_date from sfdc.campaign_member cm
    left join sfdc.campaign c on cm.campaign_id = c.id
    where c.start_date is not null and c.type = 'Direct Mail'
    and c.start_date < current_date()
    group by 1
)
,gov_domains AS (
    SELECT DISTINCT
       '%.' || suffix || '%' as suffix_patten
    FROM growth.lsw_domain_type_suppression
    WHERE suppression_config:mo_pop::BOOLEAN = true
)
,wiw_users AS (
    SELECT DISTINCT
        users.id AS owner_id,
        user_roles.name AS user_role_name
    FROM prod_rippling_dwh.sfdc.user AS users
    INNER JOIN prod_rippling_dwh.sfdc.user_role AS user_roles
        ON users.user_role_id = user_roles.id
    WHERE user_roles.name ILIKE '%WIW%'
)
, leads AS (
    SELECT
       lead.* exclude(last_activity_date, account_c),
       'LEAD' AS SFDC_OBJECT_TYPE,
       GREATEST_IGNORE_NULLS(lead.LAST_ACTIVITY_DATE, dm_activity_date) LAST_ACTIVITY_DATE,
       COALESCE(red.ACCOUNT_C, lead.ACCOUNT_C, lead.LEAN_DATA_REPORTING_MATCHED_ACCOUNT_C) AS ACCOUNT_C,
        EXISTS (
            SELECT 1 FROM gov_domains WHERE lead.website ILIKE suffix_patten OR SPLIT_PART(lead.email, '@', 2) ILIKE suffix_patten
        ) AS IS_GOV_DOMAIN,
        (wiw_users.owner_id IS NOT NULL) AS IS_WHEN_I_WORK
    FROM SFDC.LEAD lead
    LEFT JOIN latest_dm_activity on lead.ID = latest_dm_activity.sfdc_id
    LEFT JOIN sfdc.RELATED_EMAIL_DOMAIN_C red on red.ID = lead.RELATED_EMAIL_DOMAIN_C
    LEFT JOIN wiw_users ON lead.owner_id = wiw_users.owner_id
    WHERE lead.IS_DELETED = FALSE AND lead.IS_CONVERTED = FALSE
)
, contacts AS (
    SELECT
       contact.* exclude(last_activity_date),
       'CONTACT' AS SFDC_OBJECT_TYPE,
       GREATEST_IGNORE_NULLS(contact.LAST_ACTIVITY_DATE, dm_activity_date) LAST_ACTIVITY_DATE,
       EXISTS (SELECT 1 FROM gov_domains WHERE SPLIT_PART(email, '@', 2) ILIKE suffix_patten) AS IS_GOV_DOMAIN,
       (wiw_users.owner_id IS NOT NULL) AS IS_WHEN_I_WORK
    FROM SFDC.CONTACT
    LEFT JOIN latest_dm_activity on contact.ID = latest_dm_activity.sfdc_id
    LEFT JOIN wiw_users ON contact.owner_id = wiw_users.owner_id
    WHERE IS_DELETED = FALSE
)
, accounts AS (
    SELECT
       Account.*,
       international_ee_count_c,
       EXISTS (SELECT 1 FROM gov_domains WHERE domain_text_for_matching_c ILIKE suffix_patten) AS IS_GOV_DOMAIN,
       (Account.wiw_id_c IS NOT NULL) AS IS_WHEN_I_WORK
    FROM SFDC.ACCOUNT
    LEFT JOIN SFDC.COMPANY_DATA_C ON ACCOUNT.ID = COMPANY_DATA_C.ACCOUNT_C
    WHERE Account.IS_DELETED = FALSE
)
, red AS (
    SELECT * FROM SFDC.RELATED_EMAIL_DOMAIN_C WHERE IS_DELETED = FALSE
)

-- data helpers
, dsar_compliance_leads AS (
    SELECT EMAIL
    FROM SFDC.LEAD
    WHERE DSAR_COMPLIANCE_FLAG_C = TRUE
    AND EMAIL IS NOT NULL
)
, invalid_emails AS (
    SELECT EMAIL
    FROM GROWTH.MASTER_EMAIL_VALIDATION_DATA
    WHERE EMAIL_VALID_NEVERBOUNCE = FALSE
    AND EMAIL IS NOT NULL
)
, domain_source AS (
    SELECT domain AS MASTER_DOMAIN, EE_SIZE, COMPANY_SEGMENT, GROWTH_TIER FROM
    prod_rippling_dwh.growth.master_domain_sources
)

, sequence_count AS (
    SELECT
        pe.EMAIL,
        COUNT(DISTINCT ss.RELATIONSHIP_SEQUENCE_ID) AS SEQUENCE_COUNT
    FROM prod_rippling_dwh.outreach.prospect_email pe
    LEFT JOIN prod_rippling_dwh.outreach.sequence_state ss ON ss.RELATIONSHIP_PROSPECT_ID = pe.PROSPECT_ID
    GROUP BY pe.EMAIL
)

, negative_replies AS(
    SELECT DISTINCT
        input.EMAIL
    FROM PROD_RIPPLING_DWH.GROWTH.MECH_OUTREACH_EMAIL_CLASSIFICATION_INPUT input
    LEFT JOIN PROD_RIPPLING_DWH.GROWTH.MO_REPLY_CLASSIFICATION_RESULTS_BIZ_LAYER output ON output.REPLY_ID = input.ID
    WHERE output.biz_layer_RESULT = 'Negative'
)
, outreach_prospects AS (
    SELECT
        SYSTEM_OBJECT_ID AS SFDC_LEAD_ID,
        OUTREACH_PROSPECT_ID
    FROM GROWTH.OUTREACH_PROSPECT_METADATA
    QUALIFY row_number() OVER (PARTITION BY SFDC_LEAD_ID ORDER BY RUN_DT DESC) <= 1
)
, jc_leads AS (
    SELECT
    EMAIL AS JOB_CHANGE_EMAIL,
    PREVIOUS_COMPANY_DOMAIN AS JOB_CHANGE_PREVIOUS_COMPANY_DOMAIN,
    JOB_START_DATE AS JOB_CHANGE_START_DATE
    FROM GROWTH.PRIMER_JOB_CHANGE_MERGED_LEADS
    QUALIFY row_number() OVER (PARTITION BY EMAIL ORDER BY RUN_DT DESC) <= 1
)

-- audience
, closed_lost_opportunities_for_contacts AS (
    SELECT DISTINCT
        C.ID AS CONTACT_ID,
        C.ACCOUNT_ID AS ACCOUNT_ID,
        CLOSE_DATE AS CLOSED_LOST_DATE,
        LAST_STAGE_BEFORE_CLOSE_C AS LAST_STAGE_BEFORE_CLOSE,
        CASE
            WHEN C.FUTURE_CONTACT_DATE_C < CAST(DATEADD('day', -1, GETDATE()) AS DATE) THEN NULL
            ELSE C.FUTURE_CONTACT_DATE_C
        END AS FUTURE_CONTACT_DATE,
        CASE
            WHEN UR.NAME ILIKE '%Enterprise Mid Market%' THEN 'ENT'
            WHEN UR.NAME ILIKE '%Mid Market%' THEN 'MM'
            WHEN UR.NAME ILIKE '%SMB%' THEN 'SMB'
            WHEN UR.NAME ILIKE '%SSB%' THEN 'SSB'
            WHEN UR.NAME ILIKE '%Enterprise%' THEN 'ENT'
            ELSE NULL
        END CLOSED_LOST_ACCOUNT_SEGMENT
    FROM SFDC.OPPORTUNITY O
    LEFT JOIN SFDC.CONTACT C ON C.ID = O.CONTACT_ID
    INNER JOIN SFDC.USER U ON O.OWNER_ID = U.ID
    INNER JOIN SFDC.USER_ROLE UR ON U.USER_ROLE_ID = UR.ID
    WHERE C.ID IS NOT NULL AND O.STAGE_NAME = 'Closed Lost' AND O.IS_DELETED = FALSE
    QUALIFY ROW_NUMBER() OVER (PARTITION BY O.CONTACT_ID ORDER BY CLOSED_LOST_DATE DESC) = 1
)
, closed_lost_accounts AS (
    SELECT ACCOUNT_ID, CLOSED_LOST_DATE, LAST_STAGE_BEFORE_CLOSE, CLOSED_LOST_ACCOUNT_SEGMENT, MIN(FUTURE_CONTACT_DATE) FUTURE_CONTACT_DATE
    FROM closed_lost_opportunities_for_contacts
    WHERE ACCOUNT_ID IS NOT NULL
    GROUP BY 1,2,3,4
    QUALIFY ROW_NUMBER() OVER (PARTITION BY ACCOUNT_ID ORDER BY CLOSED_LOST_DATE) <= 1
)
, closed_lost_contacts AS (
    SELECT
        DISTINCT
        contacts.ID,
        'CONTACT' AS SFDC_OBJECT_TYPE,
        closed_lost_opportunities_for_contacts.CONTACT_ID IS NOT NULL AS IS_ON_OPPORTUNITY,
        closed_lost_opportunities_for_contacts.CLOSED_LOST_DATE AS CLOSED_LOST_DATE,
        closed_lost_accounts.FUTURE_CONTACT_DATE AS FUTURE_CONTACT_DATE,
        closed_lost_accounts.LAST_STAGE_BEFORE_CLOSE AS LAST_STAGE_BEFORE_CLOSE,
        closed_lost_accounts.CLOSED_LOST_ACCOUNT_SEGMENT AS CLOSED_LOST_ACCOUNT_SEGMENT,
        'CLOSED_LOST' AS AUDIENCE_TYPE
    FROM contacts
    LEFT JOIN closed_lost_opportunities_for_contacts on contacts.ID = closed_lost_opportunities_for_contacts.CONTACT_ID
    LEFT JOIN closed_lost_accounts on contacts.ACCOUNT_ID = closed_lost_accounts.ACCOUNT_ID
    WHERE closed_lost_accounts.ACCOUNT_ID is not null
    QUALIFY ROW_NUMBER() OVER (PARTITION BY contacts.ID ORDER BY closed_lost_accounts.CLOSED_LOST_DATE DESC) = 1
)
, closed_lost_leads AS (
    SELECT
        DISTINCT
        leads.ID,
        'LEAD' AS SFDC_OBJECT_TYPE,
        FALSE AS IS_ON_OPPORTUNITY,
        NULL AS CLOSED_LOST_DATE,
        closed_lost_accounts.FUTURE_CONTACT_DATE AS FUTURE_CONTACT_DATE,
        closed_lost_accounts.LAST_STAGE_BEFORE_CLOSE AS LAST_STAGE_BEFORE_CLOSE,
        closed_lost_accounts.CLOSED_LOST_ACCOUNT_SEGMENT AS CLOSED_LOST_ACCOUNT_SEGMENT,
        'CLOSED_LOST' AS AUDIENCE_TYPE
    FROM leads
    LEFT JOIN red on leads.RELATED_EMAIL_DOMAIN_C = red.ID
    LEFT JOIN closed_lost_accounts on leads.ACCOUNT_C = closed_lost_accounts.ACCOUNT_ID
    OR red.ACCOUNT_C = closed_lost_accounts.ACCOUNT_ID
    WHERE closed_lost_accounts.ACCOUNT_ID is not null
    QUALIFY ROW_NUMBER() OVER (PARTITION BY leads.ID ORDER BY closed_lost_accounts.CLOSED_LOST_DATE DESC) = 1
)

--
, cumulative_leads AS (
    SELECT
        ID,
        SFDC_OBJECT_TYPE,
        NULL AS IS_ON_OPPORTUNITY,
        NULL AS CLOSED_LOST_DATE,
        NULL AS FUTURE_CONTACT_DATE,
        NULL AS LAST_STAGE_BEFORE_CLOSE,
        NULL AS CLOSED_LOST_ACCOUNT_SEGMENT,
        'NON_CLOSED_LOST' AS AUDIENCE_TYPE
    FROM leads WHERE ID NOT IN (SELECT ID FROM closed_lost_leads)
    UNION
    SELECT * FROM closed_lost_leads
)
, cumulative_contacts AS (
    SELECT
        ID,
        SFDC_OBJECT_TYPE,
        NULL AS IS_ON_OPPORTUNITY,
        NULL AS CLOSED_LOST_DATE,
        NULL AS FUTURE_CONTACT_DATE,
        NULL AS LAST_STAGE_BEFORE_CLOSE,
        NULL AS CLOSED_LOST_ACCOUNT_SEGMENT,
        'NON_CLOSED_LOST' AS AUDIENCE_TYPE
    FROM contacts WHERE ID NOT IN (SELECT ID FROM closed_lost_contacts)
    UNION
    SELECT * FROM closed_lost_contacts
)

, final_leads_data AS (
    SELECT
    leads.ID AS SALESFORCE_ID,
    leads.SFDC_OBJECT_TYPE,
    leads.FIRST_NAME AS FIRST_NAME,
    leads.LAST_NAME AS LAST_NAME,
    leads.TITLE AS TITLE,
    leads.PERSONA_C AS PERSONA,
    leads.EMAIL AS EMAIL,
    leads.EXPERIMENT_NAME_C AS EXPERIMENT,
    leads.PEO_PROVIDER_C AS PEO_PROVIDER, -- TODO Deprecate after fields are merged/new field is used everywhere
    leads.PEO_PROVIDER_C AS PEO_PROVIDER_C,
    leads.PEO_PROVIDER_LAST_UPDATED_C AS PEO_PROVIDER_LAST_UPDATED_C,
    leads.COUNTRY_CODE AS HQ_COUNTRY,
    leads.STATE_CODE AS HQ_REGION,
    leads.CITY AS HQ_CITY,
    leads.STREET AS HQ_STREET_ADDRESS,
    leads.IMPORT_SOURCE_C AS EMAIL_SOURCE,
    leads.LINKED_IN_SALES_URL_C AS LINKEDIN_URL,
    GROWTH.CLEAN_DOMAIN_NAME(leads.WEBSITE) AS DOMAIN,
    leads.COMPANY AS COMPANY_NAME,
    leads.NUMBER_OF_EMPLOYEES AS EE_SIZE,
    leads.LAST_FORM_FILL_DATE_TIME_C AS LAST_FORM_FILL_DATE_TIME_C,
    CASE
        WHEN (leads.STATUS = 'New' or leads.STATUS IS NULL) AND leads.ADDED_TO_SEQUENCE_C IS NULL AND leads.LAST_ACTIVITY_DATE IS NULL THEN 'NEW'
        WHEN (leads.STATUS = 'New' or leads.STATUS IS NULL or leads.STATUS IN ('No Response/Unable to Contact', 'Recycled')) THEN 'RECYCLED'
    END AS NEW_RECYCLED_STATUS,
    leads.EMAIL_PERSONALIZED_SENTENCE_1_C AS PERSONALIZED_SENTENCE_1,
    leads.EMAIL_PERSONALIZED_SENTENCE_2_C AS PERSONALIZED_SENTENCE_2,
    leads.LAST_ACTIVITY_DATE AS LAST_ACTIVITY_DATE,
    leads.ADDED_TO_SEQUENCE_C as ADDED_TO_SEQUENCE,
    leads.COMPANY_START_DATE_C as COMPANY_START_DATE,
    leads.JOB_START_DATE_C as POSITION_START_DATE,
    leads.LAST_INBOUND_CONTENT_FF_C as LAST_INBOUND_CONTENT_FF_C,
    leads.LAST_INBOUND_CONTENT_FF_DATE_TIME_C as LAST_INBOUND_CONTENT_FF_DATE_TIME_C,

--     leads.INDUSTRY_SEGMENT_C as INDUSTRY_SEGMENT,


    IS_ON_OPPORTUNITY,
    CLOSED_LOST_DATE,
    FUTURE_CONTACT_DATE,
    LAST_STAGE_BEFORE_CLOSE,
    CLOSED_LOST_ACCOUNT_SEGMENT,
    AUDIENCE_TYPE,
    leads.STATUS AS STATUS,
    leads.OWNER_ID AS OWNER,
    leads.SEQUENCE_NAME_FOR_AUTOMATION_C AS SEQUENCE_NAME,
    leads.COMPANY_TYPE_C AS COMPANY_TYPE,

    leads.DEMO_REQUEST_DATE_TIME_C,
    leads.QUOTE_REQUEST_DATE_TIME_C,
    leads.PEO_REQUEST_DATE_TIME_C,
    leads.TOUR_REQUEST_DATE_TIME_C,
    leads.CONTACT_US_DATE_TIME_C,

    leads.ACCOUNT_C AS ACCOUNT_ID_ON_LEAD,
    coalesce(
        accounts.Product_Overlay_Marketing_Signals_c, leads.Product_Overlay_Marketing_Signals_c
    ) = 'Likely Global Fit'
    AND (
        accounts.international_ee_count_c >= 5 or global_workforce_summary_employees_c >= 5
    )
    AS LIKELY_GLOBAL_FIT_C
    FROM cumulative_leads
    LEFT JOIN leads ON cumulative_leads.ID = leads.ID
    LEFT JOIN accounts on leads.ACCOUNT_C = accounts.ID
)
, final_contacts_data AS (
    SELECT
    contacts.ID AS SALESFORCE_ID,
    contacts.SFDC_OBJECT_TYPE,
    contacts.FIRST_NAME AS FIRST_NAME,
    contacts.LAST_NAME AS LAST_NAME,
    contacts.TITLE AS TITLE,
    contacts.PERSONA_C AS PERSONA,
    contacts.EMAIL AS EMAIL,
    contacts.EXPERIMENT_NAME_C AS EXPERIMENT,
    contacts.PEO_PROVIDER_C AS PEO_PROVIDER,
    contacts.PEO_PROVIDER_C AS PEO_PROVIDER_C,
    contacts.PEO_PROVIDER_LAST_UPDATED_C AS PEO_PROVIDER_LAST_UPDATED_C,
    contacts.MAILING_COUNTRY_CODE AS HQ_COUNTRY,
    contacts.MAILING_STATE_CODE AS HQ_REGION,
    contacts.MAILING_CITY AS HQ_CITY,
    contacts.MAILING_STREET AS HQ_STREET_ADDRESS,
    contacts.IMPORT_SOURCE_C AS EMAIL_SOURCE,
    contacts.CONTACT_LINKED_IN_URL_C AS LINKEDIN_URL,
    GROWTH.CLEAN_DOMAIN_NAME(accounts.WEBSITE) AS DOMAIN,
    accounts.NAME AS COMPANY_NAME,
    accounts.NUMBER_OF_EMPLOYEES AS EE_SIZE,
    contacts.LAST_FORM_FILL_DATE_TIME_C AS LAST_FORM_FILL_DATE_TIME_C,
    CASE
        WHEN (contacts.PERSON_STATUS_SFDC_C = 'New' or contacts.PERSON_STATUS_SFDC_C IS NULL) and contacts.ADDED_TO_SEQUENCE_C IS NULL AND contacts.LAST_ACTIVITY_DATE IS NULL THEN 'NEW'
        WHEN (contacts.PERSON_STATUS_SFDC_C = 'New' or contacts.PERSON_STATUS_SFDC_C IS NULL or contacts.PERSON_STATUS_SFDC_C IN ('No Response/Unable to Contact', 'Recycled')) THEN 'RECYCLED'
    END AS NEW_RECYCLED_STATUS,
    EMAIL_PERSONALIZED_SENTENCE_1_C AS PERSONALIZED_SENTENCE_1,
    EMAIL_PERSONALIZED_SENTENCE_2_C AS PERSONALIZED_SENTENCE_2,
    contacts.LAST_ACTIVITY_DATE AS LAST_ACTIVITY_DATE,
    contacts.ADDED_TO_SEQUENCE_C as ADDED_TO_SEQUENCE,
    contacts.COMPANY_START_DATE_C as COMPANY_START_DATE,
    NULL as POSITION_START_DATE,
    contacts.LAST_INBOUND_CONTENT_FF_C as LAST_INBOUND_CONTENT_FF_C,
    contacts.LAST_INBOUND_CONTENT_FF_DATE_TIME_C as LAST_INBOUND_CONTENT_FF_DATE_TIME_C,

--     NULL INDUSTRY_SEGMENT,

    IS_ON_OPPORTUNITY,
    CLOSED_LOST_DATE,
    FUTURE_CONTACT_DATE,
    LAST_STAGE_BEFORE_CLOSE,
    CLOSED_LOST_ACCOUNT_SEGMENT,
    AUDIENCE_TYPE,
    contacts.PERSON_STATUS_SFDC_C AS STATUS,
    contacts.OWNER_ID AS OWNER,
    contacts.SEQUENCE_NAME_FOR_AUTOMATION_C AS SEQUENCE_NAME,
    contacts.COMPANY_TYPE_DETAIL_C AS COMPANY_TYPE,

    contacts.DEMO_REQUEST_DATE_TIME_C,
    contacts.QUOTE_REQUEST_DATE_TIME_C,
    contacts.PEO_REQUEST_DATE_TIME_C,
    contacts.TOUR_REQUEST_DATE_TIME_C,
    contacts.CONTACT_US_DATE_TIME_C,

    contacts.ACCOUNT_ID AS ACCOUNT_ID_ON_LEAD,
    accounts.Product_Overlay_Marketing_Signals_c = 'Likely Global Fit'
    AND (
        accounts.international_ee_count_c >= 5 or global_workforce_summary_employees_c >= 5
    )
    AS LIKELY_GLOBAL_FIT_C
    FROM cumulative_contacts
    LEFT JOIN contacts on cumulative_contacts.ID = contacts.ID
    LEFT JOIN accounts on contacts.ACCOUNT_ID = accounts.ID
)
, combined_data AS (
    WITH sub_data AS (
        SELECT * FROM final_leads_data
        UNION
        SELECT * FROM final_contacts_data
    )

    SELECT
       sub_data.*,
       mesr.SEGMENT AS COMPANY_SIZE_SEGMENT,
       JOB_FUNCTION_PREDICTION,
       SENIORITY_PREDICTION
    FROM sub_data
    LEFT JOIN GROWTH.mech_outreach_segment_ranges mesr
    on ee_size between mesr.ee_size_lowerbound and mesr.ee_size_upper_bound and (
        (end_date is null or end_date >= current_date()) and start_date <= current_date()
    )
    LEFT JOIN prod_rippling_dwh.growth.personas_lead_reference AS lead_personas ON sub_data.SALESFORCE_ID = lead_personas.ID
)

, INDUSTRY_SEGMENT_EXCLUSION_LIST AS (
   {{ params.industry_segment_exclusion_list_query }}
)

, CHANNEL_OWNED_ACCOUNTS AS (
    select
        distinct account.ID
    from sfdc.account account
    left join sfdc.user sfuser on account.OWNER_ID = sfuser.ID
    left join sfdc.user_role user_role on sfuser.USER_ROLE_ID = user_role.ID
    where user_role.NAME ilike any ( {{ params.channel_owned_accounts }} )
)

-- suppression
, accounts_suppression_data AS (
    SELECT
        accounts.ID AS ACCOUNT_ID,
        accounts.INDUSTRY,
        accounts.INDUSTRY_SEGMENT_C,
        red.ID AS RED_ID,
        COALESCE(red.NAME, accounts.WEBSITE) AS WEBSITE,
        coalesce(suppression1.IS_COMPANY_CURRENT_CUSTOMER, suppression2.IS_COMPANY_CURRENT_CUSTOMER) IS_CUSTOMER,

        coalesce(suppression1.IS_COMPANY_CHURNED_CUSTOMER, suppression2.IS_COMPANY_CHURNED_CUSTOMER) IS_CHURNED,

        coalesce(suppression1.IS_COMPANY_IN_IMPLEMENTATION, suppression2.IS_COMPANY_IN_IMPLEMENTATION) IS_IN_IMPLEMENTATION,

        coalesce(suppression1.IS_COMPANY_COMPETITOR, suppression2.IS_COMPANY_COMPETITOR) IS_COMPETITOR,

        coalesce(suppression1.IS_COMPANY_COUNTRY_SANCTIONED, suppression2.IS_COMPANY_COUNTRY_SANCTIONED) IS_SANCTIONED_COUNTRY,

        coalesce(suppression1.IS_COMPANY_HQ_COUNTRY_INVALID, suppression2.IS_COMPANY_HQ_COUNTRY_INVALID) IS_INVALID_HQ_COUNTRY,

        coalesce(suppression1.IS_COMPANY_OPTED_OUT, suppression2.IS_COMPANY_OPTED_OUT) IS_OPT_OUT_ACCOUNT,
        coalesce(suppression1.IS_COMPANY_LEGALLY_EXCLUDED, suppression2.IS_COMPANY_LEGALLY_EXCLUDED) LEGAL_EXCLUSION,
        IS_OPT_OUT_ACCOUNT OR LEGAL_EXCLUSION OTHER_GLOBAL_EXCLUSIONS,

--         CASE
--             WHEN accounts.INDUSTRY_SEGMENT_C IN (
--                 'Real Estate', 'Hospitality', 'Restaurants and Food Production', 'Construction', 'Agriculture, Ranching, Forestry',
--                 'Government', 'Health Care', 'Manufacturing', 'Non-profit', 'Education', 'Mining, Oil and Gas Extraction, Energy'
--             ) THEN TRUE ELSE FALSE
--         END
-- TODO Jagadeesh: Need to add the above logic once the new list of excluded industries is finalized
        CASE WHEN
            (
                (
                         accounts.INDUSTRY ILIKE ANY (
                            {{params.industry_exclusion_list_str}}
                        )
                        OR (
                             INDUSTRY_SEGMENT_EXCLUSION_LIST.LIST_INDUSTRY_SEGMENT IS NOT NULL
                        )
                        OR (
                             mesr.segment = 'SMB' AND
                                 accounts.INDUSTRY_SEGMENT_C IS NULL
                        )
                        OR (
                             mesr.segment = 'SSB' AND
                                 accounts.INDUSTRY_SEGMENT_C IS NULL
                        )
                )
                AND NOT (
                    (
                        accounts.billing_country_code IN ('GB', 'AU') AND accounts.INDUSTRY_SEGMENT_C IN ({{params.industry_segment_overrides_for_au_uk}})
                    ) OR (
                        accounts.billing_country_code = 'CA'
                        AND accounts.INDUSTRY_SEGMENT_C IN
                        ({{params.industry_segment_overrides_for_ca}})
                    )
                 )
            )
            OR (
                accounts.NAME ILIKE '%cannabis%'
            )
            OR accounts.INDUSTRY ILIKE '%government%'
            THEN TRUE ELSE FALSE
        END ACCOUNT_INELIGIBLE_INDUSTRY,
        CASE
            WHEN mesr.segment is not null OR ACCOUNTS.ID IS NULL THEN FALSE ELSE TRUE
        END INELIGIBLE_SIZE,
        accounts.IS_GOV_DOMAIN,
        CASE
            WHEN accounts.RECORD_TYPE_ID IN ('0126A000000DVWIQA4', '0123s000000JSjWAAW')
                    or CHANNEL_OWNED_ACCOUNTS.ID is not null
            THEN TRUE ELSE FALSE
        END IS_PARTNER_ACCOUNT,

        CASE
            WHEN ACCOUNT_STATUS_C = 'Open Opportunity' OR OPEN_OPPORTUNITIES_HQ_C > 0 THEN TRUE ELSE FALSE
        END OPEN_OPPORTUNITY,
        IS_PARTNER_ACCOUNT OR OPEN_OPPORTUNITY INELIGIBLE_ACCOUNTS,

        NVL(NAMED_ACCOUNT_C, FALSE) IS_NAMED_ACCOUNT,
        accounts.IS_WHEN_I_WORK,
        (
            IS_CUSTOMER
            OR IS_CHURNED
            OR IS_IN_IMPLEMENTATION
            OR IS_COMPETITOR
            OR IS_OPT_OUT_ACCOUNT
            OR LEGAL_EXCLUSION
            OR ACCOUNT_INELIGIBLE_INDUSTRY
            OR INELIGIBLE_SIZE
            OR IS_PARTNER_ACCOUNT
            OR OPEN_OPPORTUNITY
            OR IS_NAMED_ACCOUNT
            OR IS_INVALID_HQ_COUNTRY
            OR IS_SANCTIONED_COUNTRY
            OR accounts.IS_GOV_DOMAIN
            OR accounts.IS_WHEN_I_WORK
       ) AS IS_SUPPRESSED

    FROM accounts
    FULL OUTER JOIN red on red.ACCOUNT_C = accounts.ID
    LEFT JOIN GROWTH.mech_outreach_segment_ranges mesr
    on number_of_employees between mesr.ee_size_lowerbound and mesr.ee_size_upper_bound and (
        (end_date is null or end_date >= current_date()) and start_date <= current_date()
    )
    LEFT JOIN INDUSTRY_SEGMENT_EXCLUSION_LIST ON LOWER(accounts.INDUSTRY_SEGMENT_C) = LOWER(INDUSTRY_SEGMENT_EXCLUSION_LIST.LIST_INDUSTRY_SEGMENT) AND
        MESR.SEGMENT = INDUSTRY_SEGMENT_EXCLUSION_LIST.SEGMENT
    LEFT JOIN growth.global_systemic_suppression_companies suppression1 on coalesce(red.account_c, accounts.id) = suppression1.account_id
    LEFT JOIN growth.global_systemic_suppression_companies suppression2 on coalesce(red.name, accounts.website) = suppression2.website
    LEFT JOIN CHANNEL_OWNED_ACCOUNTS ON CHANNEL_OWNED_ACCOUNTS.ID = accounts.ID
    QUALIFY ROW_NUMBER() OVER (PARTITION BY COALESCE(red.ID, accounts.ID) ORDER BY CASE WHEN IS_SUPPRESSED THEN 1 ELSE 2 END) = 1
)
, campaign_type AS (
    SELECT
    cm.EMAIL
    , c.TYPE
    FROM SFDC.CAMPAIGN_MEMBER cm
    LEFT JOIN SFDC.CAMPAIGN c ON cm.CAMPAIGN_ID = c.ID
    WHERE cm.EMAIL IS NOT NULL
    QUALIFY ROW_NUMBER() OVER(PARTITION BY cm.EMAIL ORDER BY cm.CREATED_DATE DESC) = 1
)
, open_oppty_leads AS (
    SELECT
    DISTINCT CONTACT_ID
    FROM (
        SELECT
            OCR.CONTACT_ID
        FROM
            PROD_RIPPLING_DWH.SFDC.OPPORTUNITY O
        LEFT JOIN PROD_RIPPLING_DWH.SFDC.OPPORTUNITY_CONTACT_ROLE OCR ON OCR.OPPORTUNITY_ID = O.ID
        LEFT JOIN SFDC.RECORD_TYPE RT ON O.RECORD_TYPE_ID = RT.ID
        WHERE
            STAGE_NAME NOT IN ('0 - Disqualified', 'Closed Lost', 'Closed Won')
            and OCR.CONTACT_ID IS NOT NULL

        UNION

        SELECT
            O.CONTACT_ID
        FROM
            PROD_RIPPLING_DWH.SFDC.OPPORTUNITY O
        LEFT JOIN SFDC.RECORD_TYPE RT ON O.RECORD_TYPE_ID = RT.ID
        WHERE
            STAGE_NAME NOT IN ('0 - Disqualified', 'Closed Lost', 'Closed Won')
            AND O.CONTACT_ID IS NOT NULL
    )
)
, global_attach_oppty_leads AS (
    SELECT DISTINCT CONTACT_ID
    FROM (
        SELECT
            OCR.CONTACT_ID
        FROM
            PROD_RIPPLING_DWH.SFDC.OPPORTUNITY O
        LEFT JOIN PROD_RIPPLING_DWH.SFDC.OPPORTUNITY_CONTACT_ROLE OCR ON OCR.OPPORTUNITY_ID = O.ID
        LEFT JOIN SFDC.RECORD_TYPE RT ON O.RECORD_TYPE_ID = RT.ID
        WHERE
            O.CLOSED_OWNER_ROLE_C ILIKE '%Global%'
            AND RT.NAME = 'SaaS Add-On'
            and OCR.CONTACT_ID IS NOT NULL

        UNION

        SELECT
            O.CONTACT_ID
        FROM
            PROD_RIPPLING_DWH.SFDC.OPPORTUNITY O
        LEFT JOIN SFDC.RECORD_TYPE RT ON O.RECORD_TYPE_ID = RT.ID
        WHERE
            O.CLOSED_OWNER_ROLE_C ILIKE '%Global%'
            AND RT.NAME = 'SaaS Add-On'
            AND O.CONTACT_ID IS NOT NULL
    )
)
, global_only_oppty_leads AS (
    SELECT DISTINCT CONTACT_ID
    FROM (
        SELECT
            OCR.CONTACT_ID
        FROM
            PROD_RIPPLING_DWH.SFDC.OPPORTUNITY O
        LEFT JOIN PROD_RIPPLING_DWH.SFDC.OPPORTUNITY_CONTACT_ROLE OCR ON OCR.OPPORTUNITY_ID = O.ID
        LEFT JOIN SFDC.RECORD_TYPE RT ON O.RECORD_TYPE_ID = RT.ID
        WHERE
            O.CLOSED_OWNER_ROLE_C ILIKE '%Global%'
            AND RT.NAME = 'SaaS'
            and OCR.CONTACT_ID IS NOT NULL

        UNION

        SELECT
            O.CONTACT_ID
        FROM
            PROD_RIPPLING_DWH.SFDC.OPPORTUNITY O
        LEFT JOIN SFDC.RECORD_TYPE RT ON O.RECORD_TYPE_ID = RT.ID
        WHERE
            O.CLOSED_OWNER_ROLE_C ILIKE '%Global%'
            AND RT.NAME = 'SaaS'
            AND O.CONTACT_ID IS NOT NULL
    )
)
, leads_data_with_suppression AS (
    SELECT
        combined_data.* EXCLUDE (COMPANY_SIZE_SEGMENT, ACCOUNT_ID_ON_LEAD, LIKELY_GLOBAL_FIT_C),
       COALESCE(
            accounts_suppression_data.INDUSTRY,
            leads_red_account_suppression.INDUSTRY,
            leads.INDUSTRY
        ) AS INDUSTRY,
        COALESCE(
            accounts_suppression_data.INDUSTRY_SEGMENT_C,
            leads_red_account_suppression.INDUSTRY_SEGMENT_C,
            leads.INDUSTRY_SEGMENT_C,
            lim.rippling_industry_segment
        ) AS INDUSTRY_SEGMENT,

        TRUE AS IS_ELIGIBLE_FOR_RANKING,

        campaign_type.TYPE AS CAMPAIGN_TYPE,

        outreach_prospects.OUTREACH_PROSPECT_ID AS OUTREACH_ID,
        CASE
            WHEN (jc_leads.JOB_CHANGE_EMAIL IS NOT NULL) AND (jc_leads.JOB_CHANGE_PREVIOUS_COMPANY_DOMAIN <> DOMAIN) THEN True
            ELSE FALSE
        END AS JOB_CHANGE,
        CASE
            WHEN JOB_CHANGE = True THEN jc_leads.JOB_CHANGE_START_DATE
            ELSE NULL
        END AS JOB_CHANGE_DATE,
        CASE
            WHEN (jc_leads.JOB_CHANGE_EMAIL IS NOT NULL) AND (jc_leads.JOB_CHANGE_PREVIOUS_COMPANY_DOMAIN = DOMAIN) THEN True
            ELSE FALSE
        END AS JOB_PROMOTION,
        CASE
            WHEN JOB_PROMOTION = True THEN jc_leads.JOB_CHANGE_START_DATE
            ELSE NULL
        END AS JOB_PROMOTION_DATE,
        -- NULL AS LATEST_WEBINAR_DATE,
        -- NULL AS RECEIVED_DIRECT_MAIL,
        e.RUN_DT AS EMAIL_NVRB_VALIDATED_TS,

        CASE
            WHEN COMPANY_SIZE_SEGMENT = 'ENT' AND (
                (
                    (SENIORITY_PREDICTION IS NULL OR SENIORITY_PREDICTION <> 'EXECUTIVE')
                    AND ( JOB_FUNCTION_PREDICTION IS NOT NULL AND JOB_FUNCTION_PREDICTION ILIKE ANY ({{params.ml_job_prediction_exclusions_str}}) )
                )
                OR (SENIORITY_PREDICTION = 'LOW' AND JOB_FUNCTION_PREDICTION LIKE 'IT%')
            ) THEN TRUE -- TODO This part should be maintained in a snowflake table and handled using joins
            WHEN
            (
                PERSONA IS NOT NULL
                AND PERSONA IN (
                    -- 'Accountant', 'Insurance', 'Legal', 'Non-profit', 'Other', 'Sales',
                    -- 'Facilities', 'None', 'Office Manager', 'Tech Partnership'
                    'CEO / Founder', 'CTO / ENG', 'CFO / Finance', 'COO / Operations', 'HR / People', 'IT'
                )
            )
            OR (
                combined_data.LAST_FORM_FILL_DATE_TIME_C IS NOT NULL
                OR combined_data.LAST_INBOUND_CONTENT_FF_DATE_TIME_C IS NOT NULL
            )
            THEN FALSE
            ELSE TRUE
        END INELIGIBLE_PERSONA,

        CASE
            WHEN leads.OWNER_ID IN ('0056A000000w3muQAA', '0056A000002se2FQAQ', '0058X00000FAUjGQAX') or contacts.ID IS NOT NULL or sfdc_u.is_active = false THEN FALSE
            ELSE TRUE
        END SALES_OWNED_LEAD,

        CASE
            WHEN COALESCE(leads.ACTIVELY_BEING_SEQUENCED_C, contacts.ACTIVELY_BEING_SEQUENCED_C) = TRUE THEN TRUE
            ELSE FALSE
        END LEAD_IN_ACTIVE_SEQUENCE,

        CASE
            WHEN COALESCE(leads.SEQUENCE_NAME_FOR_AUTOMATION_C, contacts.SEQUENCE_NAME_FOR_AUTOMATION_C) IS NOT NULL THEN TRUE
            ELSE FALSE
        END LEAD_ENROLLED_IN_SEQUENCE,

        NULL AS GENERIC_OUTREACH_SUPPRESSION,

        SALES_OWNED_LEAD OR LEAD_IN_ACTIVE_SEQUENCE OR LEAD_ENROLLED_IN_SEQUENCE AS INELIGIBLE_LIFECYCLE_STAGE,

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
        END INELIGIBLE_LEAD_SOURCE,

        CASE
            WHEN combined_data.NEW_RECYCLED_STATUS in ('NEW', 'RECYCLED') THEN FALSE
            ELSE TRUE
        END INELIGIBLE_LEAD_STATUS,

        CASE WHEN dsar.email IS NOT NULL THEN TRUE ELSE FALSE END DSAR_COMPLIANCE_LEAD_SUPPRESSION,
        CASE WHEN invalid_emails.EMAIL IS NOT NULL THEN TRUE
        WHEN combined_data.EMAIL IS NULL OR combined_data.EMAIL ILIKE ANY (
            '%gmail%', '%@aol%', '%@yahoo%', '%@hotmail%', '%@outlook%', '%@proton%', '%@icloud%'
        ) OR pep.free_email_domains IS NOT NULL THEN TRUE
        ELSE FALSE END INVALID_EMAIL,

        INELIGIBLE_LEAD_SOURCE OR INELIGIBLE_LEAD_STATUS
        OR INVALID_EMAIL OR DSAR_COMPLIANCE_LEAD_SUPPRESSION OTHER_INELIGIBLE_LEADS,

        COALESCE(global_systemic_suppression_leads.IS_LEAD_OPTED_OUT, FALSE) LEAD_OPTED_OUT,

        CASE WHEN COALESCE(leads.NO_LONGER_AT_ACCOUNT_C, contacts.NO_LONGER_AT_ACCOUNT_C) = TRUE
        THEN TRUE ELSE FALSE END IS_LEAD_NO_LONGER_AT_ACCOUNT,

        CASE
            WHEN mds.EE_SIZE > 5000
            THEN TRUE ELSE FALSE
        END EE_SIZE_OUT_OF_RANGE,

        CASE
            WHEN sequence_count.SEQUENCE_COUNT >= 8 -- 03/12/2025 todo: change back to 6 after 60 days
            THEN TRUE ELSE FALSE
        END ADDED_IN_SEQUENCE_MORE_THAN_6,

        CASE
            WHEN negative_replies.EMAIL is not null
            THEN TRUE ELSE FALSE
        END WITH_NEGATIVE_REPLY,

        INELIGIBLE_PERSONA
        OR INELIGIBLE_LIFECYCLE_STAGE
        OR OTHER_INELIGIBLE_LEADS
        OR LEAD_OPTED_OUT
        OR IS_LEAD_NO_LONGER_AT_ACCOUNT
        OR EE_SIZE_OUT_OF_RANGE
        OR ADDED_IN_SEQUENCE_MORE_THAN_6
        OR WITH_NEGATIVE_REPLY
        IS_LEAD_SUPPRESSION,

        accounts_suppression_data.IS_CUSTOMER OR leads_red_account_suppression.IS_CUSTOMER IS_CUSTOMER,
        accounts_suppression_data.IS_CHURNED OR leads_red_account_suppression.IS_CHURNED IS_CHURNED,
        accounts_suppression_data.IS_IN_IMPLEMENTATION OR leads_red_account_suppression.IS_IN_IMPLEMENTATION IS_IN_IMPLEMENTATION,
        accounts_suppression_data.IS_COMPETITOR OR leads_red_account_suppression.IS_COMPETITOR IS_COMPETITOR,

        accounts_suppression_data.IS_OPT_OUT_ACCOUNT OR leads_red_account_suppression.IS_OPT_OUT_ACCOUNT IS_OPT_OUT_ACCOUNT,
        accounts_suppression_data.LEGAL_EXCLUSION OR leads_red_account_suppression.LEGAL_EXCLUSION LEGAL_EXCLUSION,
        accounts_suppression_data.OTHER_GLOBAL_EXCLUSIONS OR leads_red_account_suppression.OTHER_GLOBAL_EXCLUSIONS OTHER_GLOBAL_EXCLUSIONS,

--         accounts_suppression_data.ACCOUNT_INELIGIBLE_INDUSTRY OR leads_red_account_suppression.ACCOUNT_INELIGIBLE_INDUSTRY OR CASE WHEN leads.industry_segment_c in (
--             'Real Estate',
--             'Hospitality',
--             'Restaurants & Food Production',
--             'Construction',
--             'Agriculture',
--             'Government',
--             'Health Care',
--             'Manufacturing',
--             'Non-profit',
--             'Education',
--             'Energy'
--         ) THEN TRUE ELSE FALSE END
-- TODO Jagadeesh: Enable once the list of ineligible industries is finalized

        accounts_suppression_data.ACCOUNT_INELIGIBLE_INDUSTRY OR
        leads_red_account_suppression.ACCOUNT_INELIGIBLE_INDUSTRY OR
        CASE WHEN ((leads.INDUSTRY ILIKE ANY (
                {{params.industry_exclusion_list_str}}
            )
            OR (
                 INDUSTRY_SEGMENT_EXCLUSION_LIST.LIST_INDUSTRY_SEGMENT IS NOT NULL
            )
            OR (
                 COMPANY_SIZE_SEGMENT = 'SMB' AND
                    INDUSTRY_SEGMENT IS NULL
            )
            OR (
                COMPANY_SIZE_SEGMENT = 'SSB' AND
                    INDUSTRY_SEGMENT IS NULL
            ))
            AND NOT (
                        (
                            hq_country IN ('GB', 'AU') AND industry_segment IN ({{params.industry_segment_overrides_for_au_uk}})
                        ) OR (
                            hq_country = 'CA'
                            AND industry_segment IN
                            ({{params.industry_segment_overrides_for_ca}})
                        )
                     )
            )
            OR (
                combined_data.COMPANY_NAME ILIKE '%cannabis%'
            )
            OR leads.INDUSTRY ILIKE '%government%'
            OR leads.INDUSTRY_SEGMENT_C ILIKE '%government%'
        THEN TRUE ELSE FALSE
        END INELIGIBLE_INDUSTRY, -- ineligible industry can be applied to lead industry segment attribute as well
        accounts_suppression_data.INELIGIBLE_SIZE = true OR leads_red_account_suppression.INELIGIBLE_SIZE = true
        or combined_data.domain in (select website from large_companies)
        INELIGIBLE_COMPANY_SIZE,
        (
            accounts_suppression_data.IS_GOV_DOMAIN
            OR leads_red_account_suppression.IS_GOV_DOMAIN
            OR leads.IS_GOV_DOMAIN
            OR contacts.IS_GOV_DOMAIN
        ) AS IS_GOV_COMPANY,
        accounts_suppression_data.IS_PARTNER_ACCOUNT OR leads_red_account_suppression.IS_PARTNER_ACCOUNT IS_PARTNER_ACCOUNT,
        accounts_suppression_data.OPEN_OPPORTUNITY OR leads_red_account_suppression.OPEN_OPPORTUNITY OPEN_OPPORTUNITY,
        accounts_suppression_data.INELIGIBLE_ACCOUNTS OR leads_red_account_suppression.INELIGIBLE_ACCOUNTS INELIGIBLE_ACCOUNTS,

        accounts_suppression_data.IS_NAMED_ACCOUNT OR leads_red_account_suppression.IS_NAMED_ACCOUNT IS_NAMED_ACCOUNT,

        (
            accounts_suppression_data.IS_WHEN_I_WORK
            OR leads_red_account_suppression.IS_WHEN_I_WORK
            OR leads.IS_WHEN_I_WORK
            OR contacts.IS_WHEN_I_WORK
        ) AS IS_WHEN_I_WORK_ACCOUNT,

        (
            accounts_suppression_data.IS_SUPPRESSED
            OR leads_red_account_suppression.IS_SUPPRESSED
            OR INELIGIBLE_INDUSTRY
            OR EE_SIZE_OUT_OF_RANGE
            OR combined_data.domain IN (SELECT website FROM large_companies)
            OR INELIGIBLE_COMPANY_SIZE
            OR IS_GOV_COMPANY
            OR IS_WHEN_I_WORK_ACCOUNT
        ) AS IS_ACCOUNT_SUPPRESSED,

        IS_LEAD_SUPPRESSION
        OR IS_ACCOUNT_SUPPRESSED
        IS_RECORD_SUPPRESSED,

        CURRENT_TIMESTAMP() AS RUN_DT,

        sfdc_ur.NAME AS OWNER_ROLE_NAME,
        CASE
            WHEN COALESCE(
                combined_data.DEMO_REQUEST_DATE_TIME_C
                , combined_data.QUOTE_REQUEST_DATE_TIME_C
                , combined_data.PEO_REQUEST_DATE_TIME_C
                , combined_data.TOUR_REQUEST_DATE_TIME_C
                , combined_data.CONTACT_US_DATE_TIME_C
                , combined_data.LAST_INBOUND_CONTENT_FF_DATE_TIME_C
                , combined_data.LAST_FORM_FILL_DATE_TIME_C
            ) IS NULL THEN FALSE
            ELSE TRUE
        END AS IS_INBOUND_LEAD,
        sfdc_oppty.DEAL_LOSS_OUTCOME_C,
        sfdc_oppty.DEMO_DATE_C,

        CASE
            WHEN open_oppty_leads.CONTACT_ID IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS OPEN_OPPORTUNITY_ON_LEAD

        , lead_interactions.IS_WEBINAR_LEAD
        , lead_interactions.LEAD_LATEST_WEBINAR_DATE
        , lead_interactions.LEAD_LATEST_WEBINAR_CAMPAIGN
        , lead_interactions.IS_EVENT_LEAD
        , lead_interactions.LEAD_LATEST_EVENT_DATE
        , lead_interactions.LEAD_LATEST_EVENT_CAMPAIGN
        , lead_interactions.IS_CONTENT_LEAD
        , lead_interactions.LEAD_LATEST_CONTENT_DATE
        , lead_interactions.LEAD_LATEST_CONTENT_CAMPAIGN
        , lead_interactions.IS_FORM_FILL_LEAD
        , lead_interactions.LEAD_LATEST_FORM_FILL_DATE
        , lead_interactions.IS_CLOSED_LOST_LEAD
        , lead_interactions.LEAD_LATEST_CLOSED_LOST_DATE

        , CASE
            WHEN global_attach_oppty_leads.CONTACT_ID IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS GLOBAL_ATTACH_OPPORTUNITY_ON_LEAD
        , CASE
            WHEN global_only_oppty_leads.CONTACT_ID IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS GLOBAL_ONLY_OPPORTUNITY_ON_LEAD
        , sfdc_oppty.LAST_STAGE_CHANGE_DATE
        , sfdc_oppty.CLOSED_OWNER_ROLE_C
        , sfdc_oppty.GLOBAL_REFERRAL_STATUS_C
        , sfdc_oppty.PRODUCT_INTEREST_C

        , combined_data.ACCOUNT_ID_ON_LEAD
        , combined_data.LIKELY_GLOBAL_FIT_C LIKELY_GLOBAL_FIT
        , mds.COMPANY_SEGMENT
        , mds.GROWTH_TIER

    FROM combined_data
    LEFT JOIN leads ON combined_data.SALESFORCE_ID = leads.ID
    LEFT JOIN contacts ON combined_data.SALESFORCE_ID = contacts.ID
    LEFT JOIN invalid_emails on combined_data.EMAIL = invalid_emails.EMAIL
    LEFT JOIN dsar_compliance_leads dsar ON dsar.EMAIL = combined_data.EMAIL

    LEFT JOIN accounts_suppression_data
    ON (accounts_suppression_data.ACCOUNT_ID = COALESCE(leads.ACCOUNT_C, contacts.ACCOUNT_ID)) and accounts_suppression_data.account_id is not null

    LEFT JOIN accounts_suppression_data leads_red_account_suppression
    ON (leads_red_account_suppression.RED_ID = leads.RELATED_EMAIL_DOMAIN_C) and leads_red_account_suppression.red_id is not null


    LEFT JOIN outreach_prospects ON combined_data.SALESFORCE_ID = outreach_prospects.SFDC_LEAD_ID
    LEFT JOIN jc_leads ON combined_data.EMAIL = jc_leads.JOB_CHANGE_EMAIL
    LEFT JOIN GROWTH.MASTER_EMAIL_VALIDATION_DATA e ON combined_data.EMAIL = e.EMAIL
    LEFT JOIN campaign_type ON combined_data.EMAIL = campaign_type.EMAIL
    LEFT JOIN SFDC.USER sfdc_u ON combined_data.OWNER = sfdc_u.ID
    LEFT JOIN SFDC.USER_ROLE sfdc_ur ON sfdc_u.USER_ROLE_ID = sfdc_ur.ID
    LEFT JOIN SFDC.OPPORTUNITY sfdc_oppty ON combined_data.SALESFORCE_ID = sfdc_oppty.CONTACT_ID
    LEFT JOIN open_oppty_leads ON combined_data.SALESFORCE_ID = open_oppty_leads.CONTACT_ID
    LEFT JOIN GROWTH.LEAD_INTERACTIONS lead_interactions ON combined_data.SALESFORCE_ID = lead_interactions.ID
    LEFT JOIN global_attach_oppty_leads ON combined_data.SALESFORCE_ID = global_attach_oppty_leads.CONTACT_ID
    LEFT JOIN global_only_oppty_leads ON combined_data.SALESFORCE_ID = global_only_oppty_leads.CONTACT_ID
    LEFT JOIN google_sheets.personal_email_providers pep on split(combined_data.email, '@')[1] = case when free_email_domains ilike '%@%' then split(free_email_domains, '@')[1] else free_email_domains end
    left join (SELECT * EXCLUDE(industry_segment) FROM google_sheets.lsi_industry_mapping) lim on lower(leads.industry) = lower(lim.linkedin_company_profile_industry)
    LEFT JOIN sequence_count ON sequence_count.EMAIL = combined_data.EMAIL
    LEFT JOIN negative_replies ON negative_replies.EMAIL = combined_data.EMAIL
    LEFT JOIN domain_source mds on mds.MASTER_DOMAIN = split_part(combined_data.EMAIL,'@',2)
    LEFT JOIN INDUSTRY_SEGMENT_EXCLUSION_LIST on LOWER(INDUSTRY_SEGMENT) = LOWER(INDUSTRY_SEGMENT_EXCLUSION_LIST.LIST_INDUSTRY_SEGMENT)
        AND COMPANY_SIZE_SEGMENT = INDUSTRY_SEGMENT_EXCLUSION_LIST.SEGMENT
    LEFT JOIN growth.global_systemic_suppression_leads on combined_data.email = global_systemic_suppression_leads.email
    WHERE (
        combined_data.FIRST_NAME IS NOT NULL AND combined_data.FIRST_NAME NOT ILIKE '[[unknown]]'
        AND
        combined_data.LAST_NAME IS NOT NULL AND combined_data.LAST_NAME NOT ILIKE '[[unknown]]'
        AND
        combined_data.TITLE IS NOT NULL AND combined_data.TITLE NOT ILIKE '[[unknown]]'
        AND
        combined_data.COMPANY_NAME IS NOT NULL AND combined_data.COMPANY_NAME NOT ILIKE '[[unknown]]'
    )

    QUALIFY ROW_NUMBER() OVER (PARTITION BY combined_data.SALESFORCE_ID ORDER BY CASE WHEN IS_RECORD_SUPPRESSED THEN 1 ELSE 2 END) = 1
)

SELECT * FROM leads_data_with_suppression
