-- Example: Get key pipeline metrics
-- This is sample SQL - replace with your actual queries

SELECT
    COUNT(DISTINCT CASE WHEN is_deleted = FALSE THEN id END) as total_s1,
    COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL AND is_deleted = FALSE THEN id END) as total_s2,
    ROUND(
        COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL AND is_deleted = FALSE THEN id END) * 100.0 /
        NULLIF(COUNT(DISTINCT CASE WHEN is_deleted = FALSE THEN id END), 0),
        1
    ) || '%' as conversion_rate,
    (SELECT COUNT(*) FROM prod_rippling_dwh.outreach.sequence WHERE _fivetran_deleted = FALSE) as active_sequences
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
LIMIT 1;
