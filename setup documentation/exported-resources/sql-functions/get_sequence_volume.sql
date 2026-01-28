-- ================================================================
--  GET SEQUENCE VOLUME
-- ================================================================
--  OVERVIEW:
--    Created: 2025-12-01
--    Owner: chaskins@rippling.com
-- ================================================================
--  EXAMPLES
-- ================================================================
SELECT * FROM TABLE(get_sequence_volume(ARRAY_CONSTRUCT('CH-Cannon-V2-AutomatedIntent', 'CH-Cannon-V2-JobChange'))); -- DEFAULT NO TIMEFRAME
SELECT * FROM TABLE(get_sequence_volume(ARRAY_CONSTRUCT('CH-Cannon-V2-AutomatedIntent', 'CH-Cannon-V2-JobChange'), '2025-11-29')); -- START DATE TO PRESENT
SELECT * FROM TABLE(get_sequence_volume(ARRAY_CONSTRUCT('CH-Cannon-V2-AutomatedIntent', 'CH-Cannon-V2-JobChange'), '2025-11-01', '2025-11-30')); -- START DATE AND END DATE
-- EXPECTED RESULTS for CH-Cannon-V2-AutomatedIntent: 18746 unique prospects, 39460 total sends
SELECT * FROM TABLE(get_sequence_volume(ARRAY_CONSTRUCT('CH-Cannon-V2-AutomatedIntent', 'CH-Cannon-V2-JobChange'), '2025-11-26', '2025-11-26')); -- SINGLE DAY
-- EXPECTED RESULTS for CH-Cannon-V2-AutomatedIntent: 2499 unique prospects, 2385 total sends
-- ================================================================


-- =====================================================================
-- 1) DEV FUNCTION
-- =====================================================================
USE LANGUAGE SQL;
USE DATABASE dev_rippling_db;
USE SCHEMA growth_christian;

CREATE OR REPLACE FUNCTION get_sequence_volume(
    sequence_names_or_ids ARRAY,
    start_date VARCHAR DEFAULT NULL,
    end_date VARCHAR DEFAULT NULL
)
    RETURNS TABLE (
        sequence_name STRING,
        sequence_id STRING,
        unique_prospects INT,
        total_sends INT
    )
    LANGUAGE SQL
    AS
    $$
    WITH flattened_inputs AS (
        SELECT value::string AS input_value
        FROM TABLE(FLATTEN(input => sequence_names_or_ids))
    ),
    timeframe AS (
        SELECT
            start_date::DATE AS start_date,
            end_date::DATE AS end_date
    ),
    matched_sequences AS (
        SELECT 
            fi.input_value,
            seq.id::string AS sequence_id,
            seq.name AS sequence_name,
            ss_step.id AS step_1_id
        FROM flattened_inputs fi
        JOIN prod_rippling_dwh.outreach.sequence seq
            ON seq.name = fi.input_value OR seq.id::string = fi.input_value
        JOIN prod_rippling_dwh.outreach.sequence_step ss_step
            ON seq.id::string = ss_step.relationship_sequence_id::string AND ss_step.display_name ILIKE '%Step #1%'
    ),
    unique_prospects_by_sequence AS (
        SELECT 
            ms.sequence_id,
            COUNT(DISTINCT ss.relationship_prospect_id) AS unique_prospects
        FROM matched_sequences ms
        CROSS JOIN timeframe tf
        JOIN prod_rippling_dwh.outreach.mailing ss
            ON ms.sequence_id = ss.relationship_sequence_id
        WHERE ss._fivetran_deleted = FALSE
            AND ss.relationship_sequence_step_id::string = ms.step_1_id::string
            AND (tf.start_date IS NULL OR DATE_TRUNC('day', ss.delivered_at) >= DATE_TRUNC('day', tf.start_date::DATE))
            AND (tf.end_date IS NULL OR DATE_TRUNC('day', ss.delivered_at) <= DATE_TRUNC('day', tf.end_date::DATE))
        GROUP BY ms.sequence_id
    ),
    total_sends_by_sequence AS (
        SELECT 
            ms.sequence_id,
            COUNT(DISTINCT m.id) AS total_sends
        FROM matched_sequences ms
        CROSS JOIN timeframe tf
        JOIN prod_rippling_dwh.outreach.mailing m
            ON ms.sequence_id = m.relationship_sequence_id
        WHERE m._fivetran_deleted = FALSE
            AND (tf.start_date IS NULL OR DATE_TRUNC('day', m.delivered_at) >= DATE_TRUNC('day', tf.start_date::DATE))
            AND (tf.end_date IS NULL OR DATE_TRUNC('day', m.delivered_at) <= DATE_TRUNC('day', tf.end_date::DATE))
        GROUP BY ms.sequence_id
    )
    SELECT
        ms.sequence_name,
        ms.sequence_id,
        COALESCE(ups.unique_prospects, 0) AS unique_prospects,
        COALESCE(tsbs.total_sends, 0) AS total_sends
    FROM matched_sequences ms
    LEFT JOIN unique_prospects_by_sequence ups ON ms.sequence_id = ups.sequence_id
    LEFT JOIN total_sends_by_sequence tsbs ON ms.sequence_id = tsbs.sequence_id
    $$
;



-- =====================================================================
-- 2) PROD QUERY - CTE VERSION (WITH SECTION BREAKS)
-- =====================================================================
-- ========== INPUTS ==========
WITH flattened_inputs AS (
    SELECT 'CH-Cannon-V2-AutomatedIntent' AS input_value
    -- UNION ALL
    -- SELECT 'CH-Cannon-V2-JobChange' AS input_value
),
timeframe AS (
    SELECT
        '2025-11-26'::DATE AS start_date,
        '2025-11-26'::DATE AS end_date
),

-- ========== LOGIC ==========
