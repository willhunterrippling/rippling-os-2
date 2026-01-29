-- Source: explore_suppression_columns.sql
-- Added: 2026-01-29
-- Type: SQL Pattern - Schema Exploration

-- Explore all suppression-related columns in the MO population table
-- to understand all possible suppression reasons

-- Option 1: Show all column names containing 'suppress' or similar keywords
SELECT column_name, data_type
FROM prod_rippling_dwh.information_schema.columns
WHERE table_schema = 'GROWTH'
  AND table_name = 'MECHANIZED_OUTREACH_POPULATION'
  AND (
    LOWER(column_name) LIKE '%suppress%'
    OR LOWER(column_name) LIKE '%block%'
    OR LOWER(column_name) LIKE '%exclude%'
    OR LOWER(column_name) LIKE '%dnc%'
    OR LOWER(column_name) LIKE '%do_not%'
    OR LOWER(column_name) LIKE '%lookback%'
    OR LOWER(column_name) LIKE '%hold%'
  )
ORDER BY column_name;
