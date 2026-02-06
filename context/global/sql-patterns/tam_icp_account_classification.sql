-- Source: tam_icp_account_classification.sql
-- Added: 2026-02-06
-- Type: SQL Pattern
-- Description: Classifies SFDC accounts as TAM, ICP Core, and ICP Global based on
--   account status, industry, quality signals, competitor domains, funding, and territory rules.

WITH 

red_cte AS (
    SELECT 
        ACCOUNT_C AS account_id, 
        SUM(CASE WHEN COMPETITOR_C = true THEN 1 ELSE 0 END) AS red_competitor_count
    FROM PROD_RIPPLING_DWH.SFDC.RELATED_EMAIL_DOMAIN_C
    GROUP BY ACCOUNT_C
),

opps_exclusion as (
    select
        account_id,
        max(opps.close_date) as last_closed_lost_opportunity_date,
    from prod_dbt_db.core_sales_stage.int_sales__opportunities opps
    join prod_rippling_dwh.sfdc.account accts
        on accts.id = opps.account_id
        and datediff('day', opps.close_date, current_date) between 1 and 90
    where is_closed
        and stage_name = 'Closed Lost'
    group by 1
),

funding as (
    select 
        account_c,
        sum(raised_amount_c) as total_funding_amount,
        max(funding_date_c) as last_funding_date
    from PROD_RIPPLING_DWH.SFDC.FUNDING_ROUND_C
    where not is_deleted
    group by 1
),

final as (
    SELECT distinct
        accts.ID AS account_id, 
        core_territory.hq_region,
        core_territory.min_employees,
        core_territory.max_employees,
        core_territory.billing_state_code,
        CASE 
            -- Not a customer or current prospect checks 
            WHEN accts.account_status_c IN ('Customer', 'In Implementation', 'Pending Churn', 'Open Opportunity', 'Ex-client') THEN 'false'
            WHEN accts.bookings_total_arr_c > 0 AND accts.rippling_company_id_c IS NOT NULL THEN 'false'
            -- Net New Incremental Accounts FY26
            WHEN accts.tam_source_c ilike any ('FY26 D&B TAM Stock', 'FY26 Apollo TAM Stock') then 'true'
            -- Not in a terrible industry checks 
            WHEN accts.industry_segment_color_c = 'Excluded' THEN 'false'
            WHEN accts.industry_segment_color_c = 'Red' THEN 'false'
            WHEN accts.tam_source_c ILIKE '%Nursing Homes%' THEN 'false'
            WHEN accts.tam_source_c ILIKE '%VC2024%' and accts.name ILIKE '%Cribl%' then 'false' -- exclude specific vc partner accounts
            WHEN accts.tam_source_c ILIKE '%VC2024%' and accts.name ILIKE '%Together AI%' then 'false' -- exclude specific vc partner accounts
            WHEN accts.tam_source_c ILIKE '%ZI US TAM Expansion - Green%' THEN 'false'
            --Not an Education industry account that has "School District", "Public", "University" in name checks
            WHEN accts.industry_segment_c = 'Education' AND name ILIKE ANY ('%School District%','%Public%','%University%') THEN 'false'
            -- Not a bad quality account checks
            WHEN accts.WEBSITE IS NULL THEN 'false'
            WHEN accts.WEBSITE ILIKE ANY (
                '%linktr.ee%', '%[unknown]%', '%yelp.com%', '%facebook.com%', 
                '%linkedin.com%', '%bit.ly%', '%@gmail.com%', '%@yahoo.com%', 
                '%@outlook.com%', '%@hotmail.com%', '%@aol.com%', '%@hotmail.co.uk%', 
                '%@hotmail.fr%', '%@msn.com%', '%@live.com%'
            ) THEN 'false'
            WHEN accts.INDUSTRY IS NULL THEN 'false'
            WHEN accts.HQ_REGION_C IS NULL THEN 'false'
            WHEN accts.NAL_REMOVAL_REASON_C IN ('Out of Business', 'Do Not Contact') THEN 'false'
            WHEN accts.ACCOUNT_LINKED_IN_URL_C IS NULL and accts.LINKEDIN_SI_COMPANY_PROFILE_C IS NULL THEN 'false'
            WHEN COALESCE(red.red_competitor_count, 0) >= 1 THEN 'false'
            WHEN accts.record_type_id != '0126A000000DVWDQA4' then 'false' -- Only Direct Sales Accounts, not Partner
            WHEN accts.of_partner_child_accounts_c > 0 then 'false'
            ELSE 'true'
        END AS tam_account,
    case
    -- US SMB Core parent account logic
        when account_sales_territory ilike '%Core | US SMB%'
            and parent_id is not null
            and account_eligible_to_be_named_c = true
            and (account_status_c != 'Open Opportunity'
                or account_status_c is null)
            and (referring_account_last_updated_c <= current_date - interval '180 days'
                or referring_account_last_updated_c is null)
            and opps_exclusion.last_closed_lost_opportunity_date is null
            and ((industry_segment_color_c in ('Green', 'Yellow', 'Orange') and funding.total_funding_amount >= 1)
                or ((funding.total_funding_amount is null or funding.total_funding_amount = 0) and industry in (
                    'IT Services and IT Consulting', 
                    'Software Development', 
                    'Technology, Information and Internet',
                    'Computer and Network Security',
                    'Business Intelligence Platforms'
                    )
                )
            )
        then 'true'
    -- All other segments
        when account_eligible_to_be_named_c = true
            and (not account_sales_territory ilike any ('Core | US SMB')
                or account_sales_territory is null)
            and (account_status_c != 'Open Opportunity'
                or account_status_c is null)
            and (referring_account_last_updated_c <= current_date - interval '180 days'
                or referring_account_last_updated_c is null)
            and opps_exclusion.last_closed_lost_opportunity_date is null
        then 'true'
        else 'false'
    end as icp_account_core,
    iff(
        account_eligible_to_be_named_c
        and (account_status_c != 'Open Opportunity'
            or account_status_c is null)
        and (referring_account_last_updated_c <= current_date - interval '180 days'
            or referring_account_last_updated_c is null)
        and opps_exclusion.last_closed_lost_opportunity_date is null
        and not industry_segment_color_c in ('Red', 'Excluded')
        and number_of_employees >= global_territory.min_employees
        and number_of_employees <= global_territory.max_employees
        , 'true'
        , 'false'
    ) as icp_account_global
    FROM prod_rippling_dwh.sfdc.account accts
    LEFT JOIN red_cte red 
        ON accts.ID = red.account_id
    left join prod_rippling_dwh.google_sheets.account_sales_territories core_territory
        on accts.hq_region_c = core_territory.hq_region
        and accts.number_of_employees >= core_territory.min_employees
        and accts.number_of_employees <= core_territory.max_employees
        /*and (accts.billing_state_code = core_territory.billing_state_code
            or (core_territory.billing_state_code is null
                and accts.billing_state_code != 'QC'
                and hq_region = 'NAMER | CA'))*/
    left join prod_rippling_dwh.google_sheets.global_account_sales_territories global_territory
        on accts.hq_region_c = global_territory.hq_region
    left join opps_exclusion
        on opps_exclusion.account_id = accts.id
    left join funding
        on accts.id = funding.account_c
    WHERE
        accts.is_deleted = false -- Not deleted 
)

SELECT 
    account_id,
    tam_account,
    icp_account_core,
    icp_account_global
FROM final
--where account_id = '0018X00003JEHq1QAH'
group by all
order by 2 desc
;
