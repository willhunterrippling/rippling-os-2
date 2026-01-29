-- ============================================================================
-- BUG SAMPLE QUERY TEMPLATE: [Bug Name]
-- ============================================================================
-- Purpose: Get sample records showing [Bug Name] - records that are
--          incorrectly suppressed/not suppressed due to [bug cause]
-- 
-- Expected: [What should happen]
-- Actual: [What actually happens]
-- ============================================================================

WITH
-- Step 1: Base data (same as main diagnostic)
base_data AS (
    SELECT 
        main_table.*,
        lookup.DERIVED_FIELD AS DERIVED_FIELD
    FROM [SCHEMA].[MAIN_TABLE] main_table
    LEFT JOIN [SCHEMA].[LOOKUP_TABLE] lookup
        ON main_table.KEY = lookup.KEY
),

-- Step 2: Define reference values (same as main diagnostic)
allowed_values AS (
    SELECT * FROM VALUES 
        ('value1'),
        ('value2')
    AS t(allowed_value)
),

-- Step 3: Classify records with bug flag
classified_records AS (
    SELECT 
        bd.*,
        -- Bug detection flag (same logic as main diagnostic)
        CASE 
            WHEN <bug_condition>
            THEN TRUE 
            ELSE FALSE 
        END AS bug_flag
    FROM base_data bd
)

-- Get sample records with key diagnostic fields
SELECT 
    -- Identifiers
    ID_FIELD,
    EMAIL,
    
    -- Key fields for understanding the bug
    KEY_FIELD,                    -- The field driving suppression
    SEGMENT_FIELD,                -- Segmentation
    EXCEPTION_FIELD,              -- Why it should be an exception
    
    -- Suppression result
    [SUPPRESSION_FIELD],          -- Actual result
    
    -- Context fields
    COMPANY_NAME,
    DOMAIN,
    OTHER_RELEVANT_FIELD
FROM classified_records
WHERE bug_flag = TRUE
ORDER BY RANDOM()
LIMIT 100;
