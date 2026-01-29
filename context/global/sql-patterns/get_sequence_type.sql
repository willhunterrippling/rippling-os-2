-- ================================================================
--  GET SEQUENCE TYPE
-- ================================================================
--  OVERVIEW:
--    Created: 2025-12-01
--    Owner: chaskins@rippling.com
-- ================================================================
--  EXAMPLES
-- ================================================================
SELECT * FROM TABLE(get_sequence_type(ARRAY_CONSTRUCT('CH-Cannon-V2-AutomatedIntent', 'CH-Cannon-V2-JobChange')));
SELECT * FROM TABLE(get_sequence_type(ARRAY_CONSTRUCT('3856', '10364')));
-- ================================================================


-- =====================================================================
-- 1) DEV FUNCTION
-- =====================================================================
USE LANGUAGE SQL;
USE DATABASE dev_rippling_db;
USE SCHEMA growth_christian;
CREATE OR REPLACE FUNCTION get_sequence_type(
    sequence_names_or_ids ARRAY
)
    RETURNS TABLE (
        sequence_id STRING,
        sequence_name STRING,
        sequence_type STRING,
        sequence_sub_type STRING,
        outreach_sequence_tags ARRAY
    )
    LANGUAGE SQL
    AS
    $$
    WITH flattened_inputs AS (
        SELECT value::string AS input_value
        FROM TABLE(FLATTEN(input => sequence_names_or_ids))
    ),
    matched_sequences AS (
        SELECT 
            fi.input_value,
            seq.id::string AS sequence_id,
            seq.name AS sequence_name
        FROM flattened_inputs fi
        JOIN prod_rippling_dwh.outreach.sequence seq
            ON seq.name = fi.input_value OR seq.id::string = fi.input_value
    ),
    sequence_tags AS (
        SELECT 
            sequence_id::string AS sequence_id, 
            ARRAY_AGG(DISTINCT tag_name) AS tag_names
        FROM prod_rippling_dwh.outreach.sequence_tag 
        WHERE sequence_id IN (SELECT sequence_id FROM matched_sequences)
        GROUP BY sequence_id
    ),
    -- ========== SEQUENCE TYPE REFERENCE LISTS ==========
    cannon_sequence_ids AS (
        SELECT DISTINCT sequence_id::string AS sequence_id
        FROM prod_rippling_dwh.outreach.sequence_tag WHERE tag_name = 'Cannon'
        UNION
        SELECT DISTINCT id::string AS sequence_id
        FROM prod_rippling_dwh.outreach.sequence WHERE name ILIKE '%CH-Cannon%'
    ),
    autobound_sequence_ids AS (
        SELECT DISTINCT sequence_id::string AS sequence_id
        FROM prod_rippling_dwh.outreach.sequence_tag WHERE tag_name = 'Autobound'
        UNION
        SELECT DISTINCT id::string AS sequence_id
        FROM prod_rippling_dwh.outreach.sequence WHERE name ILIKE '%Autobound%'
    ),
    classic_mo_not_personalized_ids AS (
        SELECT column1::string AS sequence_id FROM VALUES
            ('13976'), ('13977'), ('13978'), ('13979'), ('13980'), ('13981'), ('13982'), ('13983'), ('13984'), ('13985')
    ),
    classic_mo_personalized_ids AS (
        SELECT column1::string AS sequence_id FROM VALUES
            ('8438'), ('7016'), ('4072'), ('3870'), ('3872'), ('7573'), ('8100'), ('6006'), ('8484'), ('8510'), ('6417'), ('3871'), ('3856'), ('7327'), ('3869'), ('8437'), ('3862'), ('7807'), ('6007')
    ),
    automated_intent_sequence_ids AS (
        SELECT DISTINCT sequence_id::string AS sequence_id
        FROM prod_rippling_dwh.outreach.sequence_tag
        WHERE tag_name ILIKE '%AutomatedIntent%'
            OR tag_name ILIKE '%Automated Intent%'
            OR tag_name ILIKE '%EmailProgram-AutomatedIntent%'
        UNION
        SELECT DISTINCT id::string AS sequence_id
        FROM prod_rippling_dwh.outreach.sequence
        WHERE name ILIKE '%AutomatedIntent%'
            OR name ILIKE '%Automated Intent%'
    ),
    -- ========== CLASSIFY SEQUENCES ==========
    classified_sequences AS (
        SELECT 
            ms.sequence_id,
            ms.sequence_name,
            COALESCE(st.tag_names, ARRAY_CONSTRUCT()) AS tag_names,
            -- SEQUENCE_TYPE classification
            CASE
                WHEN cs.sequence_id IS NOT NULL THEN 'CANNON'
                WHEN ab.sequence_id IS NOT NULL THEN 'AUTOBOUND'
                WHEN cmnp.sequence_id IS NOT NULL THEN 'CLASSIC_MO_NOT_PERSONALIZED'
                WHEN cmp.sequence_id IS NOT NULL THEN 'CLASSIC_MO_PERSONALIZED'
                WHEN ai.sequence_id IS NOT NULL THEN 'OTHER_AUTOMATED_INTENT'
                ELSE 'OTHER'
            END AS sequence_type
        FROM matched_sequences ms
        LEFT JOIN sequence_tags st ON ms.sequence_id = st.sequence_id
        LEFT JOIN cannon_sequence_ids cs ON ms.sequence_id = cs.sequence_id
        LEFT JOIN autobound_sequence_ids ab ON ms.sequence_id = ab.sequence_id
        LEFT JOIN classic_mo_not_personalized_ids cmnp ON ms.sequence_id = cmnp.sequence_id
        LEFT JOIN classic_mo_personalized_ids cmp ON ms.sequence_id = cmp.sequence_id
        LEFT JOIN automated_intent_sequence_ids ai ON ms.sequence_id = ai.sequence_id
    )
    SELECT
        cs.sequence_id,
        cs.sequence_name,
        cs.sequence_type,
        -- SEQUENCE_SUB_TYPE classification
        CASE
            -- Cannon Multi Sequence
            WHEN cs.sequence_name ILIKE '%Cannon%' THEN 'Multi Sequence'
            -- Job Change
            WHEN cs.sequence_name ILIKE '%JobChange%' 
                OR cs.sequence_name ILIKE '%Job Change%' 
                OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Job-change%' 
                OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Job Change%' THEN 'Job Change'
            -- Automated Intent
            WHEN cs.sequence_name ILIKE '%AutomatedIntent%' 
                OR cs.sequence_name ILIKE '%Automated Intent%' 
                OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%AutomatedIntent%' 
                OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Automated Intent%' THEN 'Automated Intent'
            -- Inbound Automated
            WHEN cs.sequence_name ILIKE '%Inbound Automated%' 
                OR (ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Automated Follow Up%' 
                    AND (ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Inbound%' OR cs.sequence_name ILIKE '%Inbound%')) THEN 'Inbound Automated'
            -- Cold Outbound
            WHEN ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%EmailProgram-MechOutreach%' 
                OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Cold Outbound%' 
                OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Cold-Outbound%' THEN 'Cold Outbound'
            -- Other
            ELSE 'Other'
        END AS sequence_sub_type,
        cs.tag_names AS outreach_sequence_tags
    FROM classified_sequences cs
    $$
;



-- =====================================================================
-- 2) PROD QUERY - CTE VERSION (WITH SECTION BREAKS)
-- =====================================================================
-- ========== INPUTS ==========
WITH flattened_inputs AS (
    SELECT 'CH-Cannon-V2-AutomatedIntent' AS input_value
    UNION ALL
    SELECT 'CH-Cannon-V2-JobChange' AS input_value
),

-- ========== LOGIC ==========
matched_sequences AS (
    SELECT 
        fi.input_value,
        seq.id::string AS sequence_id,
        seq.name AS sequence_name
    FROM flattened_inputs fi
    JOIN prod_rippling_dwh.outreach.sequence seq
        ON seq.name = fi.input_value OR seq.id::string = fi.input_value
),
sequence_tags AS (
    SELECT 
        sequence_id::string AS sequence_id, 
        ARRAY_AGG(DISTINCT tag_name) AS tag_names
    FROM prod_rippling_dwh.outreach.sequence_tag 
    WHERE sequence_id IN (SELECT sequence_id FROM matched_sequences)
    GROUP BY sequence_id
),
-- ========== SEQUENCE TYPE REFERENCE LISTS ==========
cannon_sequence_ids AS (
    SELECT DISTINCT sequence_id::string AS sequence_id
    FROM prod_rippling_dwh.outreach.sequence_tag WHERE tag_name = 'Cannon'
    UNION
    SELECT DISTINCT id::string AS sequence_id
    FROM prod_rippling_dwh.outreach.sequence WHERE name ILIKE '%CH-Cannon%'
),
autobound_sequence_ids AS (
    SELECT DISTINCT sequence_id::string AS sequence_id
    FROM prod_rippling_dwh.outreach.sequence_tag WHERE tag_name = 'Autobound'
    UNION
    SELECT DISTINCT id::string AS sequence_id
    FROM prod_rippling_dwh.outreach.sequence WHERE name ILIKE '%Autobound%'
),
classic_mo_not_personalized_ids AS (
    SELECT column1::string AS sequence_id FROM VALUES
        ('13976'), ('13977'), ('13978'), ('13979'), ('13980'), ('13981'), ('13982'), ('13983'), ('13984'), ('13985')
),
classic_mo_personalized_ids AS (
    SELECT column1::string AS sequence_id FROM VALUES
        ('8438'), ('7016'), ('4072'), ('3870'), ('3872'), ('7573'), ('8100'), ('6006'), ('8484'), ('8510'), ('6417'), ('3871'), ('3856'), ('7327'), ('3869'), ('8437'), ('3862'), ('7807'), ('6007')
),
automated_intent_sequence_ids AS (
    SELECT DISTINCT sequence_id::string AS sequence_id
    FROM prod_rippling_dwh.outreach.sequence_tag
    WHERE tag_name ILIKE '%AutomatedIntent%'
        OR tag_name ILIKE '%Automated Intent%'
        OR tag_name ILIKE '%EmailProgram-AutomatedIntent%'
    UNION
    SELECT DISTINCT id::string AS sequence_id
    FROM prod_rippling_dwh.outreach.sequence
    WHERE name ILIKE '%AutomatedIntent%'
        OR name ILIKE '%Automated Intent%'
),
-- ========== CLASSIFY SEQUENCES ==========
classified_sequences AS (
    SELECT 
        ms.sequence_id,
        ms.sequence_name,
        COALESCE(st.tag_names, ARRAY_CONSTRUCT()) AS tag_names,
        -- SEQUENCE_TYPE classification
        CASE
            WHEN cs.sequence_id IS NOT NULL THEN 'CANNON'
            WHEN ab.sequence_id IS NOT NULL THEN 'AUTOBOUND'
            WHEN cmnp.sequence_id IS NOT NULL THEN 'CLASSIC_MO_NOT_PERSONALIZED'
            WHEN cmp.sequence_id IS NOT NULL THEN 'CLASSIC_MO_PERSONALIZED'
            WHEN ai.sequence_id IS NOT NULL THEN 'OTHER_AUTOMATED_INTENT'
            ELSE 'OTHER'
        END AS sequence_type
    FROM matched_sequences ms
    LEFT JOIN sequence_tags st ON ms.sequence_id = st.sequence_id
    LEFT JOIN cannon_sequence_ids cs ON ms.sequence_id = cs.sequence_id
    LEFT JOIN autobound_sequence_ids ab ON ms.sequence_id = ab.sequence_id
    LEFT JOIN classic_mo_not_personalized_ids cmnp ON ms.sequence_id = cmnp.sequence_id
    LEFT JOIN classic_mo_personalized_ids cmp ON ms.sequence_id = cmp.sequence_id
    LEFT JOIN automated_intent_sequence_ids ai ON ms.sequence_id = ai.sequence_id
)
SELECT
    cs.sequence_id,
    cs.sequence_name,
    cs.sequence_type,
    -- SEQUENCE_SUB_TYPE classification
    CASE
        -- Cannon Multi Sequence
        WHEN cs.sequence_name ILIKE '%Cannon%' THEN 'Multi Sequence'
        -- Job Change
        WHEN cs.sequence_name ILIKE '%JobChange%' 
            OR cs.sequence_name ILIKE '%Job Change%' 
            OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Job-change%' 
            OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Job Change%' THEN 'Job Change'
        -- Automated Intent
        WHEN cs.sequence_name ILIKE '%AutomatedIntent%' 
            OR cs.sequence_name ILIKE '%Automated Intent%' 
            OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%AutomatedIntent%' 
            OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Automated Intent%' THEN 'Automated Intent'
        -- Inbound Automated
        WHEN cs.sequence_name ILIKE '%Inbound Automated%' 
            OR (ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Automated Follow Up%' 
                AND (ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Inbound%' OR cs.sequence_name ILIKE '%Inbound%')) THEN 'Inbound Automated'
        -- Cold Outbound
        WHEN ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%EmailProgram-MechOutreach%' 
            OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Cold Outbound%' 
            OR ARRAY_TO_STRING(cs.tag_names, ',') ILIKE '%Cold-Outbound%' THEN 'Cold Outbound'
        -- Other
        ELSE 'Other'
    END AS sequence_sub_type,
    cs.tag_names AS outreach_sequence_tags
FROM classified_sequences cs;

