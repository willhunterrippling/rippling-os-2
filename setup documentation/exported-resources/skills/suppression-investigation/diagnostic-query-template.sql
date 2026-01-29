-- ============================================================================
-- DIAGNOSTIC QUERY TEMPLATE: [SUPPRESSION_FIELD] Breakdown
-- ============================================================================
-- Purpose: Break down the [SUPPRESSION_FIELD] suppression logic to understand
--          which conditions are excluding records and identify potential bugs
-- 
-- Reference: [source_file.sql] lines X-Y
-- ============================================================================

WITH
-- Step 1: Base data with any required joins
base_data AS (
    SELECT 
        main_table.*,
        -- Add any derived/joined fields needed
        lookup.DERIVED_FIELD AS DERIVED_FIELD
    FROM [SCHEMA].[MAIN_TABLE] main_table
    LEFT JOIN [SCHEMA].[LOOKUP_TABLE] lookup
        ON main_table.KEY = lookup.KEY
),

-- Step 2: Define allowed values as CTEs (extracted from source code)
allowed_values AS (
    SELECT * FROM VALUES 
        ('value1'),
        ('value2'),
        ('value3')
    AS t(allowed_value)
),

-- Step 3: Define excluded values (if applicable)
excluded_values AS (
    SELECT * FROM VALUES 
        ('excluded1'),
        ('excluded2')
    AS t(excluded_value)
),

-- Step 4: Classify each record by condition
classified_records AS (
    SELECT 
        bd.*,
        
        -- Condition 1: [Description]
        CASE 
            WHEN <condition_1_logic>
            THEN TRUE 
            ELSE FALSE 
        END AS condition_1_flag,
        
        -- Condition 2: [Description]
        CASE 
            WHEN <condition_2_logic>
            THEN TRUE 
            ELSE FALSE 
        END AS condition_2_flag,
        
        -- Exception 1: Has allowed value (should NOT be suppressed)
        CASE 
            WHEN bd.KEY_FIELD IS NOT NULL 
                AND EXISTS (SELECT 1 FROM allowed_values av WHERE av.allowed_value = bd.KEY_FIELD)
            THEN TRUE 
            ELSE FALSE 
        END AS exception_1_allowed_value,
        
        -- Exception 2: Has override condition (should NOT be suppressed)
        CASE 
            WHEN bd.OVERRIDE_FIELD IS NOT NULL
            THEN TRUE 
            ELSE FALSE 
        END AS exception_2_override,
        
        -- Bug Detection 1: Order of evaluation issue
        -- Records with exception that are still suppressed due to condition order
        CASE 
            WHEN <exception_condition> = TRUE
                AND <exclusion_condition> = TRUE
            THEN TRUE 
            ELSE FALSE 
        END AS bug_1_order_of_evaluation,
        
        -- Bug Detection 2: Case sensitivity issue
        CASE 
            WHEN bd.FIELD ILIKE 'pattern%'
                AND bd.FIELD NOT LIKE 'PATTERN%'
            THEN TRUE 
            ELSE FALSE 
        END AS bug_2_case_sensitivity
        
    FROM base_data bd
),

-- Step 5: Overall summary
overall_summary AS (
    SELECT 
        'Overall Summary' AS section,
        'Total Records' AS metric,
        COUNT(*) AS count,
        CAST(NULL AS NUMBER) AS percentage
    FROM classified_records
    
    UNION ALL
    
    SELECT 
        'Overall Summary' AS section,
        'SUPPRESSED = TRUE' AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage
    FROM classified_records
    WHERE [SUPPRESSION_FIELD] = TRUE
    
    UNION ALL
    
    SELECT 
        'Overall Summary' AS section,
        'SUPPRESSED = FALSE' AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage
    FROM classified_records
    WHERE [SUPPRESSION_FIELD] = FALSE
),

-- Step 6: Condition breakdown
condition_breakdown AS (
    SELECT 
        'Condition Breakdown' AS section,
        'Condition 1: [Name]' AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage
    FROM classified_records
    WHERE condition_1_flag = TRUE
    
    UNION ALL
    
    SELECT 
        'Condition Breakdown' AS section,
        'Exception: Allowed Value' AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage
    FROM classified_records
    WHERE exception_1_allowed_value = TRUE
),

-- Step 7: Value discovery - all distinct values
value_discovery AS (
    SELECT 
        'Value Discovery' AS section,
        COALESCE(KEY_FIELD, 'NULL') AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage
    FROM classified_records
    GROUP BY KEY_FIELD
),

-- Step 8: Values NOT in allowed list
values_not_allowed AS (
    SELECT 
        'Values Not Allowed' AS section,
        COALESCE(cr.KEY_FIELD, 'NULL') AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage,
        COUNT(CASE WHEN cr.[SUPPRESSION_FIELD] = TRUE THEN 1 END) AS suppressed_count
    FROM classified_records cr
    WHERE NOT EXISTS (
        SELECT 1 FROM allowed_values av WHERE av.allowed_value = cr.KEY_FIELD
    )
    GROUP BY cr.KEY_FIELD
),

-- Step 9: Segment analysis
segment_analysis AS (
    SELECT 
        'Segment Analysis' AS section,
        COALESCE(SEGMENT_FIELD, 'NULL') AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage,
        COUNT(CASE WHEN [SUPPRESSION_FIELD] = TRUE THEN 1 END) AS suppressed_count,
        ROUND(COUNT(CASE WHEN [SUPPRESSION_FIELD] = TRUE THEN 1 END) * 100.0 / COUNT(*), 2) AS suppression_rate
    FROM classified_records
    GROUP BY SEGMENT_FIELD
),

-- Step 10: Bug detection summary
bug_detection AS (
    SELECT 
        'Bug Detection' AS section,
        'Bug 1: Order of Evaluation' AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage
    FROM classified_records
    WHERE bug_1_order_of_evaluation = TRUE
    
    UNION ALL
    
    SELECT 
        'Bug Detection' AS section,
        'Bug 2: Case Sensitivity' AS metric,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM classified_records), 2) AS percentage
    FROM classified_records
    WHERE bug_2_case_sensitivity = TRUE
),

-- Step 11: Suppression distribution by key field value
suppression_distribution AS (
    SELECT 
        'Suppression Distribution' AS section,
        COALESCE(KEY_FIELD, 'NULL') AS metric,
        COUNT(CASE WHEN [SUPPRESSION_FIELD] = TRUE THEN 1 END) AS suppressed_count,
        COUNT(CASE WHEN [SUPPRESSION_FIELD] = FALSE THEN 1 END) AS not_suppressed_count,
        COUNT(*) AS total_count,
        ROUND(COUNT(CASE WHEN [SUPPRESSION_FIELD] = TRUE THEN 1 END) * 100.0 / COUNT(*), 2) AS suppression_rate
    FROM classified_records
    GROUP BY KEY_FIELD
)

-- Final output: Combine all sections
SELECT 
    section,
    metric,
    count,
    percentage,
    suppressed_count,
    not_suppressed_count,
    total_count,
    suppression_rate
FROM (
    SELECT section, metric, count, percentage, 
           CAST(NULL AS NUMBER) AS suppressed_count,
           CAST(NULL AS NUMBER) AS not_suppressed_count,
           CAST(NULL AS NUMBER) AS total_count,
           CAST(NULL AS NUMBER) AS suppression_rate
    FROM overall_summary
    
    UNION ALL
    
    SELECT section, metric, count, percentage,
           CAST(NULL AS NUMBER), CAST(NULL AS NUMBER), CAST(NULL AS NUMBER), CAST(NULL AS NUMBER)
    FROM condition_breakdown
    
    UNION ALL
    
    SELECT section, metric, count, percentage,
           CAST(NULL AS NUMBER), CAST(NULL AS NUMBER), CAST(NULL AS NUMBER), CAST(NULL AS NUMBER)
    FROM value_discovery
    
    UNION ALL
    
    SELECT section, metric, count, percentage,
           suppressed_count, CAST(NULL AS NUMBER), CAST(NULL AS NUMBER), CAST(NULL AS NUMBER)
    FROM values_not_allowed
    
    UNION ALL
    
    SELECT section, metric, count, percentage,
           suppressed_count, CAST(NULL AS NUMBER), CAST(NULL AS NUMBER), suppression_rate
    FROM segment_analysis
    
    UNION ALL
    
    SELECT section, metric, count, percentage,
           CAST(NULL AS NUMBER), CAST(NULL AS NUMBER), CAST(NULL AS NUMBER), CAST(NULL AS NUMBER)
    FROM bug_detection
    
    UNION ALL
    
    SELECT section, metric, total_count AS count,
           CAST(NULL AS NUMBER) AS percentage,
           suppressed_count, not_suppressed_count, total_count, suppression_rate
    FROM suppression_distribution
)
ORDER BY section, count DESC NULLS LAST;
