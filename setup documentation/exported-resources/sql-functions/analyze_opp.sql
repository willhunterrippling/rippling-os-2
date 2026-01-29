-- ================================================================
--  ANALYZE OPP
-- ================================================================
--  OVERVIEW:
--    Created: 2025-12-01
--    Owner: chaskins@rippling.com
-- ================================================================
--  EXAMPLES
-- ================================================================
SELECT * FROM TABLE(analyze_opp(ARRAY_CONSTRUCT('006Ud00000N1OB7IAN', '006Ud00000L13XdIAJ', '006Ud00000MqjcKIAR')));
-- EXPECTED RESULTS:
-- OPP_ID	OPP_RECORD_TYPE	OPP_NAME	OPP_STAGE	OPP_SQO_DATE	OPP_SOURCE_CATEGORY	OPP_SOURCE_TYPE	OPP_SOURCE_DETAIL
-- 006Ud00000MqjcKIAR	Shield Technology Partners - Customer- SaaS	SaaS	Closed Won	2025-11-26	Sequence	No Reply	21279
-- 006Ud00000N1OB7IAN	CarsXE- SaaS	SaaS	1 - Qualify Need	null	Sequence	Direct Reply	21279
-- 006Ud00000L13XdIAJ	NYC Social Club- SaaS	SaaS	Closed Lost	null	Sequence	Direct Reply	21279
-- ================================================================


-- =====================================================================
-- 1) DEV FUNCTION
-- =====================================================================
USE LANGUAGE SQL;
USE DATABASE dev_rippling_db;
USE SCHEMA growth_christian;
CREATE OR REPLACE FUNCTION analyze_opp(
    opp_ids ARRAY
)
    RETURNS TABLE (
        opp_id STRING,
        opp_name STRING,
        opp_record_type STRING,
        opp_created_date DATE,
        opp_stage STRING,
        opp_sqo_date DATE DEFAULT NULL,
        opp_first_step_delivered_at DATE DEFAULT NULL,
        opp_source_category STRING DEFAULT NULL,
        opp_source_type STRING DEFAULT NULL,
        opp_source_detail STRING DEFAULT NULL
    )
    LANGUAGE SQL
    AS
    $$
    WITH flattened_inputs AS (
        SELECT value::string AS input_value
        FROM TABLE(FLATTEN(input => opp_ids))
    ),
    opps AS (
        SELECT rt.name AS opp_record_type, o.*
        FROM flattened_inputs fi
        JOIN prod_rippling_dwh.sfdc.opportunity o
            ON o.id = fi.input_value
        JOIN prod_rippling_dwh.sfdc.record_type rt
            ON rt.id = o.record_type_id
    ),
    opp_contacts AS (
        SELECT ocr.contact_id AS opp_contact_id, ocr.role AS opp_contact_role, o.id AS opp_id, o.created_date AS opp_created_date, o.opp_record_type AS opp_record_type
        FROM opps o
        JOIN prod_rippling_dwh.sfdc.opportunity_contact_role ocr
            ON ocr.opportunity_id = o.id
    ),
    opp_qualified_sequences AS (
        SELECT
            oc.opp_id AS opp_id,
            oc.opp_record_type AS opp_record_type,
            oc.opp_contact_id AS opp_sequenced_contact_id,
            ss.relationship_sequence_id AS sequence_id,
            oc.opp_created_date AS opp_created_date,
            ss.replied_at AS opp_contact_sequence_reply_date,
            ss.created_at AS sequence_state_created_at,
            ROW_NUMBER() OVER (PARTITION BY oc.opp_id ORDER BY ss.replied_at IS NOT NULL DESC, ss.created_at DESC) AS rn
        FROM prod_rippling_dwh.outreach.sequence_state ss
        JOIN prod_rippling_dwh.outreach.data_connection dc
            ON dc.parent_id = ss.relationship_prospect_id AND dc.type in ('Contact', 'Lead')
        JOIN opp_contacts oc ON oc.opp_contact_id = dc.id
        WHERE ss.relationship_sequence_id IS NOT NULL
            AND ss.deliver_count > 0
            AND ABS(DATEDIFF('day', ss.created_at, oc.opp_created_date)) <= 45
            AND EXISTS (
                SELECT 1
                FROM prod_rippling_dwh.outreach.sequence_tag st
                WHERE st.sequence_id = ss.relationship_sequence_id
                    AND st.tag_name IN ('EmailProgram-MechOutreach', 'EmailProgram-DirectMail', 'include_attribution')
            )
    ),
    first_step_mailing AS (
        SELECT
            oqs.opp_id as first_mailing_opp_id,
            oqs.opp_sequenced_contact_id as first_mailing_opp_sequenced_contact_id,
            oqs.sequence_id as first_mailing_sequence_id,
            m.delivered_at AS first_step_delivered_at,
            ROW_NUMBER() OVER (PARTITION BY oqs.opp_id ORDER BY m.delivered_at ASC) AS first_mailing_rn
        FROM opp_qualified_sequences oqs
        JOIN prod_rippling_dwh.outreach.mailing m
            ON m.relationship_sequence_id = oqs.sequence_id
        JOIN prod_rippling_dwh.outreach.sequence_step ss
            ON ss.id = m.relationship_sequence_step_id
        JOIN prod_rippling_dwh.outreach.data_connection dc
            ON dc.parent_id = m.relationship_prospect_id AND dc.type in ('Contact', 'Lead')
        WHERE
            DATE_TRUNC('day', m.delivered_at) <= DATE_TRUNC('day', oqs.opp_created_date)
            AND ss.display_name ILIKE '%Step #1%'
            AND m._fivetran_deleted = FALSE
            AND dc.id::string = oqs.opp_sequenced_contact_id::string
    ),
    best_qualified_sequence AS (
        SELECT *, fsm.first_step_delivered_at AS opp_first_step_delivered_at FROM opp_qualified_sequences oqs
        LEFT JOIN first_step_mailing fsm
            ON fsm.first_mailing_opp_id = oqs.opp_id AND fsm.first_mailing_rn = 1
        WHERE oqs.rn = 1
    ),
    final_results AS (
        SELECT
            o.id AS opp_id,
            o.name AS opp_name,
            o.opp_record_type AS opp_record_type,
            o.created_date::date AS opp_created_date,
            o.stage_name AS opp_stage,
            o.sqo_qualified_date_c::date AS opp_sqo_date,
            bqs.opp_first_step_delivered_at::date AS opp_first_step_delivered_at,
            CASE WHEN bqs.sequence_id IS NOT NULL THEN 'Sequence' ELSE 'Inbound' END AS opp_source_category,
            CASE WHEN bqs.sequence_id IS NOT NULL THEN CASE WHEN bqs.opp_contact_sequence_reply_date IS NOT NULL THEN 'Direct Reply' ELSE 'No Reply' END ELSE 'No Sequence' END AS opp_source_type,
            bqs.sequence_id::string AS opp_source_detail
        FROM opps o
        LEFT JOIN best_qualified_sequence bqs
            ON bqs.opp_id = o.id
    )
    SELECT * FROM final_results
    $$
;



-- =====================================================================
-- 2) PROD QUERY - CTE VERSION (WITH SECTION BREAKS)
-- =====================================================================
-- ========== INPUTS ==========
WITH flattened_inputs AS (
    SELECT '006Ud00000N1OB7IAN' AS input_value
    UNION ALL
    SELECT '006Ud00000L13XdIAJ' AS input_value
    UNION ALL
    SELECT '006Ud00000MqjcKIAR' AS input_value
),

-- ========== LOGIC ==========
opps AS (
    SELECT rt.name AS opp_record_type, o.*
    FROM flattened_inputs fi
    JOIN prod_rippling_dwh.sfdc.opportunity o
        ON o.id = fi.input_value
    JOIN prod_rippling_dwh.sfdc.record_type rt
        ON rt.id = o.record_type_id
),
opp_contacts AS (
    SELECT ocr.contact_id AS opp_contact_id, ocr.role AS opp_contact_role, o.id AS opp_id, o.created_date AS opp_created_date, o.opp_record_type AS opp_record_type
    FROM opps o
    JOIN prod_rippling_dwh.sfdc.opportunity_contact_role ocr
        ON ocr.opportunity_id = o.id
),
opp_qualified_sequences AS (
    SELECT
        oc.opp_id AS opp_id,
        oc.opp_record_type AS opp_record_type,
        oc.opp_contact_id AS opp_sequenced_contact_id,
        ss.relationship_sequence_id AS sequence_id,
        oc.opp_created_date AS opp_created_date,
        ss.replied_at AS opp_contact_sequence_reply_date,
        ss.created_at AS sequence_state_created_at,
        ROW_NUMBER() OVER (PARTITION BY oc.opp_id ORDER BY ss.replied_at IS NOT NULL DESC, ss.created_at DESC) AS rn
    FROM prod_rippling_dwh.outreach.sequence_state ss
    JOIN prod_rippling_dwh.outreach.data_connection dc
        ON dc.parent_id = ss.relationship_prospect_id AND dc.type in ('Contact', 'Lead')
    JOIN opp_contacts oc ON oc.opp_contact_id = dc.id
    WHERE ss.relationship_sequence_id IS NOT NULL
        AND ss.deliver_count > 0
        AND ABS(DATEDIFF('day', ss.created_at, oc.opp_created_date)) <= 45
        AND EXISTS (
            SELECT 1
            FROM prod_rippling_dwh.outreach.sequence_tag st
            WHERE st.sequence_id = ss.relationship_sequence_id
                AND st.tag_name IN ('EmailProgram-MechOutreach', 'EmailProgram-DirectMail', 'include_attribution')
        )
),
first_step_mailing AS (
    SELECT
        oqs.opp_id as first_mailing_opp_id,
        oqs.opp_sequenced_contact_id as first_mailing_opp_sequenced_contact_id,
        oqs.sequence_id as first_mailing_sequence_id,
        m.delivered_at AS first_step_delivered_at,
        ROW_NUMBER() OVER (PARTITION BY oqs.opp_id ORDER BY m.delivered_at ASC) AS first_mailing_rn
    FROM opp_qualified_sequences oqs
    JOIN prod_rippling_dwh.outreach.mailing m
        ON m.relationship_sequence_id = oqs.sequence_id
    JOIN prod_rippling_dwh.outreach.sequence_step ss
        ON ss.id = m.relationship_sequence_step_id
    JOIN prod_rippling_dwh.outreach.data_connection dc
        ON dc.parent_id = m.relationship_prospect_id AND dc.type in ('Contact', 'Lead')
    WHERE
        DATE_TRUNC('day', m.delivered_at) <= DATE_TRUNC('day', oqs.opp_created_date)
        AND ss.display_name ILIKE '%Step #1%'
        AND m._fivetran_deleted = FALSE
        AND dc.id::string = oqs.opp_sequenced_contact_id::string
),
best_qualified_sequence AS (
    SELECT *, fsm.first_step_delivered_at AS opp_first_step_delivered_at FROM opp_qualified_sequences oqs
    LEFT JOIN first_step_mailing fsm
        ON fsm.first_mailing_opp_id = oqs.opp_id AND fsm.first_mailing_rn = 1
    WHERE oqs.rn = 1
),
final_results AS (
    SELECT
        o.id AS opp_id,
        o.name AS opp_name,
        o.opp_record_type AS opp_record_type,
        o.created_date::date AS opp_created_date,
        o.stage_name AS opp_stage,
        o.sqo_qualified_date_c::date AS opp_sqo_date,
        bqs.opp_first_step_delivered_at::date AS opp_first_step_delivered_at,
        CASE WHEN bqs.sequence_id IS NOT NULL THEN 'Sequence' ELSE 'Inbound' END AS opp_source_category,
        CASE WHEN bqs.sequence_id IS NOT NULL THEN CASE WHEN bqs.opp_contact_sequence_reply_date IS NOT NULL THEN 'Direct Reply' ELSE 'No Reply' END ELSE 'No Sequence' END AS opp_source_type,
        bqs.sequence_id::string AS opp_source_detail
    FROM opps o
    LEFT JOIN best_qualified_sequence bqs
        ON bqs.opp_id = o.id
)
SELECT * FROM final_results;