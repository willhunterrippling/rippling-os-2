# SFDC (Salesforce) Schema Tables Reference

Detailed documentation for Salesforce tables in `prod_rippling_dwh.sfdc` schema.

---

## Table of Contents
- [account](#account)
- [campaign](#campaign)
- [campaign_member](#campaign_member)
- [contact](#contact)
- [EXTERNAL_EMAIL_TEMPLATE_C](#external_email_template_c)
- [gong_gong_call_c](#gong_gong_call_c)
- [lead](#lead)
- [mech_outreach_email_alias_c](#mech_outreach_email_alias_c)
- [opportunity](#opportunity)
- [opportunity_contact_role](#opportunity_contact_role)
- [opportunity_team_member](#opportunity_team_member)
- [outbound_marketing_communication_c](#outbound_marketing_communication_c)
- [record_type](#record_type)
- [related_email_domain_c](#related_email_domain_c)
- [report](#report)
- [task](#task)
- [user](#user)

---

## account

**Column Count**: 982 columns

### Key Columns (Sample)
- `ID`
- `IS_DELETED`
- `MASTER_RECORD_ID`
- `NAME`
- `TYPE`
- `PARENT_ID`
- `BILLING_STREET`
- `BILLING_CITY`
- `BILLING_STATE`
- `BILLING_POSTAL_CODE`
- `BILLING_COUNTRY`
- `BILLING_STATE_CODE`
- `BILLING_COUNTRY_CODE`
- `BILLING_LATITUDE`
- `BILLING_LONGITUDE`
- `BILLING_GEOCODE_ACCURACY`
- `SHIPPING_STREET`
- `SHIPPING_CITY`
- `SHIPPING_STATE`
- `SHIPPING_POSTAL_CODE`
- `SHIPPING_COUNTRY`
- `SHIPPING_STATE_CODE`
- `SHIPPING_COUNTRY_CODE`
- `SHIPPING_LATITUDE`
- `SHIPPING_LONGITUDE`
- `SHIPPING_GEOCODE_ACCURACY`
- `PHONE`
- `FAX`
- `WEBSITE`
- `PHOTO_URL`
- `INDUSTRY`
- `ANNUAL_REVENUE`
- `NUMBER_OF_EMPLOYEES`
- `OWNERSHIP`
- `OWNER_ID`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `LAST_ACTIVITY_DATE`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `JIGSAW`
- `JIGSAW_COMPANY_ID`
- `ACCOUNT_SOURCE`
- `SICS_CODE`
- `DESCRIPTION`
- `OPERATING_HOURS_ID`
- `CURRENCY_ISO_CODE`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`
- *(Note: 900+ additional custom fields exist)*

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 601,087 records
- `True` - 80,834 records

**TYPE** (35+ values):
- `Customer` - 552,089 records
- `Partner` - 50,451 records
- `Other` - 11,448 records
- `Insurance Broker` - 10,593 records
- `Prospect` - 5,965 records
- `Accountant` - 5,046 records
- *(30+ more values)*

---

## campaign

**Column Count**: 139 columns

### Key Columns (Sample)
- `ID`
- `IS_DELETED`
- `NAME`
- `PARENT_ID`
- `TYPE`
- `STATUS`
- `START_DATE`
- `END_DATE`
- `EXPECTED_REVENUE`
- `BUDGETED_COST`
- `ACTUAL_COST`
- `EXPECTED_RESPONSE`
- `NUMBER_SENT`
- `IS_ACTIVE`
- `DESCRIPTION`
- `NUMBER_OF_LEADS`
- `NUMBER_OF_CONVERTED_LEADS`
- `NUMBER_OF_CONTACTS`
- `NUMBER_OF_RESPONSES`
- `NUMBER_OF_OPPORTUNITIES`
- `NUMBER_OF_WON_OPPORTUNITIES`
- `AMOUNT_ALL_OPPORTUNITIES`
- `AMOUNT_WON_OPPORTUNITIES`
- `HIERARCHY_NUMBER_OF_LEADS`
- `HIERARCHY_NUMBER_OF_CONVERTED_LEADS`
- `HIERARCHY_NUMBER_OF_CONTACTS`
- `HIERARCHY_NUMBER_OF_RESPONSES`
- `HIERARCHY_NUMBER_OF_OPPORTUNITIES`
- `HIERARCHY_NUMBER_OF_WON_OPPORTUNITIES`
- `HIERARCHY_AMOUNT_WON_OPPORTUNITIES`
- `HIERARCHY_BUDGETED_COST`
- `HIERARCHY_ACTUAL_COST`
- `OWNER_ID`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `LAST_ACTIVITY_DATE`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `CAMPAIGN_MEMBER_RECORD_TYPE_ID`
- `CURRENCY_ISO_CODE`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_ACTIVE** (2 values):
- `True` - 7,381 records
- `False` - 4,394 records

**IS_DELETED** (2 values):
- `False` - 10,668 records
- `True` - 1,107 records

**TYPE** (15 values):
- `Webinar` - 2,858 records
- `Email` - 2,506 records
- `Other` - 1,972 records
- `Gated Content` - 1,115 records
- `Web Form` - 958 records
- `Event` - 602 records
- `High Intent Form Fill` - 482 records
- `Direct Mail` - 351 records
- *(7 more values)*

**STATUS** (7 values):
- `Completed` - 6,697 records
- `In Progress` - 3,021 records
- `Planned` - 1,787 records
- `Aborted` - 146 records
- `Active` - 75 records
- `On Hold` - 39 records
- `Never Active` - 10 records

---

## campaign_member

**Column Count**: 294 columns

### Key Columns (Sample)
- `ID`
- `IS_DELETED`
- `CAMPAIGN_ID`
- `LEAD_ID`
- `CONTACT_ID`
- `STATUS`
- `HAS_RESPONDED`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `FIRST_RESPONDED_DATE`
- `SALUTATION`
- `NAME`
- `FIRST_NAME`
- `LAST_NAME`
- `TITLE`
- `STREET`
- `CITY`
- `STATE`
- `POSTAL_CODE`
- `COUNTRY`
- `EMAIL`
- `PHONE`
- `FAX`
- `MOBILE_PHONE`
- `DESCRIPTION`
- `DO_NOT_CALL`
- `HAS_OPTED_OUT_OF_EMAIL`
- `HAS_OPTED_OUT_OF_FAX`
- `LEAD_SOURCE`
- `COMPANY_OR_ACCOUNT`
- `TYPE`
- `LEAD_OR_CONTACT_ID`
- `LEAD_OR_CONTACT_OWNER_ID`
- `CURRENCY_ISO_CODE`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 3,064,618 records
- `True` - 27,903 records

**HAS_RESPONDED** (2 values):
- `False` - 2,690,619 records
- `True` - 401,902 records

**STATUS** (37 values):
- `Downloaded` - 550,856 records
- `Registered` - 395,683 records
- `Delivered` - 356,766 records
- `Opened` - 222,449 records
- `Sent` - 211,181 records
- `Form Filled` - 201,298 records
- `Submitted` - 168,851 records
- `Attended` - 105,738 records
- `Responded` - 97,989 records
- `Clicked` - 95,935 records
- *(27 more values)*

---

## contact

**Column Count**: 720 columns

### Key Columns (Sample)
- `ID`
- `IS_DELETED`
- `MASTER_RECORD_ID`
- `ACCOUNT_ID`
- `LAST_NAME`
- `FIRST_NAME`
- `SALUTATION`
- `MIDDLE_NAME`
- `SUFFIX`
- `NAME`
- `MAILING_STREET`
- `MAILING_CITY`
- `MAILING_STATE`
- `MAILING_POSTAL_CODE`
- `MAILING_COUNTRY`
- `MAILING_STATE_CODE`
- `MAILING_COUNTRY_CODE`
- `MAILING_LATITUDE`
- `MAILING_LONGITUDE`
- `MAILING_GEOCODE_ACCURACY`
- `PHONE`
- `FAX`
- `MOBILE_PHONE`
- `HOME_PHONE`
- `OTHER_PHONE`
- `ASSISTANT_PHONE`
- `REPORTS_TO_ID`
- `EMAIL`
- `TITLE`
- `DEPARTMENT`
- `ASSISTANT_NAME`
- `LEAD_SOURCE`
- `BIRTHDATE`
- `DESCRIPTION`
- `OWNER_ID`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `LAST_ACTIVITY_DATE`
- `LAST_CU_REQUEST_DATE`
- `LAST_CU_UPDATE_DATE`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `EMAIL_BOUNCED_REASON`
- `EMAIL_BOUNCED_DATE`
- `IS_EMAIL_BOUNCED`
- `PHOTO_URL`
- `JIGSAW`
- `JIGSAW_CONTACT_ID`
- `INDIVIDUAL_ID`
- `CURRENCY_ISO_CODE`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`
- *(Note: 650+ additional custom fields exist)*

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 1,155,127 records
- `True` - 10,056 records

**IS_EMAIL_BOUNCED** (2 values):
- `False` - 958,088 records
- `True` - 186,846 records

---

## EXTERNAL_EMAIL_TEMPLATE_C

**Column Count**: 28 columns

### Key Columns
- `ID`
- `OWNER_ID`
- `IS_DELETED`
- `NAME`
- `CURRENCY_ISO_CODE`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `TYPE_C`
- `SUBJECT_LINE_C`
- `BODY_C`
- `STATUS_C`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 71 records
- `True` - 21 records

**TYPE_C** (2 values):
- `Reply to Email` - 84 records
- `Cold Outreach` - 8 records

**STATUS_C** (2 values):
- `Active` - 66 records
- `Inactive` - 26 records

---

## gong_gong_call_c

**Column Count**: 59 columns

### Key Columns (Sample)
- `ID`
- `IS_DELETED`
- `NAME`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `OWNER_ID`
- `CURRENCY_ISO_CODE`
- `GONG_CALL_TITLE_C`
- `GONG_CALL_URL_C`
- `GONG_STARTED_C`
- `GONG_DURATION_SECONDS_C`
- `GONG_DIRECTION_C`
- `GONG_PRIMARY_USER_C`
- `GONG_WORKSPACE_ID_C`
- `GONG_WORKSPACE_C`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 113,430 records
- `True` - 2,110 records

**GONG_DIRECTION_C** (3 values):
- `inbound` - 80,893 records
- `outbound` - 33,598 records
- `conference` - 1,049 records

---

## lead

**Column Count**: 727 columns

### Key Columns (Sample)
- `ID`
- `IS_DELETED`
- `MASTER_RECORD_ID`
- `LAST_NAME`
- `FIRST_NAME`
- `SALUTATION`
- `MIDDLE_NAME`
- `SUFFIX`
- `NAME`
- `TITLE`
- `COMPANY`
- `STREET`
- `CITY`
- `STATE`
- `POSTAL_CODE`
- `COUNTRY`
- `STATE_CODE`
- `COUNTRY_CODE`
- `LATITUDE`
- `LONGITUDE`
- `GEOCODE_ACCURACY`
- `PHONE`
- `MOBILE_PHONE`
- `FAX`
- `EMAIL`
- `WEBSITE`
- `PHOTO_URL`
- `LEAD_SOURCE`
- `STATUS`
- `INDUSTRY`
- `RATING`
- `NUMBER_OF_EMPLOYEES`
- `OWNER_ID`
- `HAS_OPTED_OUT_OF_EMAIL`
- `IS_CONVERTED`
- `CONVERTED_DATE`
- `CONVERTED_ACCOUNT_ID`
- `CONVERTED_CONTACT_ID`
- `CONVERTED_OPPORTUNITY_ID`
- `IS_UNREAD_BY_OWNER`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `LAST_ACTIVITY_DATE`
- `DO_NOT_CALL`
- `HAS_OPTED_OUT_OF_FAX`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `JIGSAW`
- `JIGSAW_CONTACT_ID`
- `EMAIL_BOUNCED_REASON`
- `EMAIL_BOUNCED_DATE`
- `INDIVIDUAL_ID`
- `CURRENCY_ISO_CODE`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`
- *(Note: 650+ additional custom fields exist)*

### Distinct Values

**STATUS** (19 values):
- `New` - 7,744,283 records
- `No Response/Unable to Contact` - 4,547,799 records
- `Qualified` - 2,686,127 records
- `Bad Contact Info` - 2,004,561 records
- `In Cadence` - 709,691 records
- `Do Not Contact / Opt Out` - 619,862 records
- `Recycled` - 185,656 records
- `Disqualified` - 65,278 records
- `Engaged` - 63,180 records
- `Replied` - 31,034 records
- `Not Interested` - 7,158 records
- `Working` - 6,562 records
- `Contact in the Future` - 3,633 records
- `Pass Off` - 380 records
- `Unqualified` - 280 records
- `Interested / Went Dark` - 198 records
- `Hold` - 36 records
- `Booking` - 30 records
- `No Response / Unable to Contact` - 3 records

**IS_DELETED** (2 values):
- `False` - 17,934,681 records
- `True` - 740,784 records

**IS_CONVERTED** (2 values):
- `False` - 17,797,606 records
- `True` - 877,859 records

---

## mech_outreach_email_alias_c

**Column Count**: 52 columns

### Key Columns (Sample)
- `ID`
- `OWNER_ID`
- `IS_DELETED`
- `NAME`
- `CURRENCY_ISO_CODE`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `LAST_ACTIVITY_DATE`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `EMAIL_ADDRESS_C`
- `OUTREACH_MAILBOX_ID_C`
- `STATUS_C`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 182 records
- `True` - 7 records

**STATUS_C** (2 values):
- `Active` - 136 records
- `Inactive` - 53 records

---

## opportunity

**Column Count**: 551 columns

### Key Columns (Sample)
- `ID`
- `IS_DELETED`
- `ACCOUNT_ID`
- `RECORD_TYPE_ID`
- `NAME`
- `DESCRIPTION`
- `STAGE_NAME`
- `AMOUNT`
- `PROBABILITY`
- `CLOSE_DATE`
- `TYPE`
- `NEXT_STEP`
- `LEAD_SOURCE`
- `IS_CLOSED`
- `IS_WON`
- `FORECAST_CATEGORY`
- `FORECAST_CATEGORY_NAME`
- `CAMPAIGN_ID`
- `HAS_OPPORTUNITY_LINE_ITEM`
- `PRICEBOOK_2_ID`
- `OWNER_ID`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `LAST_ACTIVITY_DATE`
- `LAST_STAGE_CHANGE_DATE`
- `FISCAL_QUARTER`
- `FISCAL_YEAR`
- `FISCAL`
- `CONTACT_ID`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `HAS_OPEN_ACTIVITY`
- `HAS_OVERDUE_TASK`
- `CURRENCY_ISO_CODE`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`
- *(Note: 500+ additional custom fields exist)*

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 619,418 records
- `True` - 3,160 records

**IS_CLOSED** (2 values):
- `False` - 194,382 records
- `True` - 425,036 records

**IS_WON** (2 values):
- `False` - 539,046 records
- `True` - 80,372 records

**TYPE** (3 values):
- `New Business` - 135 records
- `Application Add-on` - 1 record
- `Renewal` - 1 record

---

## opportunity_contact_role

**Column Count**: 18 columns

### Key Columns
- `ID`
- `OPPORTUNITY_ID`
- `CONTACT_ID`
- `ROLE`
- `IS_PRIMARY`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `IS_DELETED`
- `CURRENCY_ISO_CODE`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_PRIMARY** (2 values):
- `True` - 527,892 records
- `False` - 47,564 records

**IS_DELETED** (2 values):
- `False` - 564,852 records
- `True` - 10,604 records

---

## opportunity_team_member

**Column Count**: 18 columns

### Key Columns
- `ID`
- `OPPORTUNITY_ID`
- `USER_ID`
- `NAME`
- `PHOTO_URL`
- `TITLE`
- `TEAM_MEMBER_ROLE`
- `OPPORTUNITY_ACCESS_LEVEL`
- `CURRENCY_ISO_CODE`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `IS_DELETED`
- `_FIVETRAN_DELETED`
- `_FIVETRAN_SYNCED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 1,024,751 records
- `True` - 280,449 records

---

## outbound_marketing_communication_c

**Column Count**: 93 columns

### Key Columns (Sample)
- `ID`
- `OWNER_ID`
- `IS_DELETED`
- `NAME`
- `CURRENCY_ISO_CODE`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `CONTACT_C`
- `LEAD_C`
- `OUTREACH_INTEGRATION_C`
- `OUTREACH_MAILBOX_ID_C`
- `SEND_TO_EMAIL_C`
- `SENT_FROM_EMAIL_C`
- `SEQUENCE_ID_C`
- `TYPE_C`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 44,931,043 records
- `True` - 2,223,026 records

**TYPE_C** (5 values):
- `Outreach Mailing` - 44,821,089 records
- `Automated intent email` - 2,286,933 records
- `Outreach` - 21,619 records
- `Outreach Event` - 20,799 records
- `Scheduled Outreach Mailing` - 3,629 records

---

## record_type

**Column Count**: 15 columns

### Key Columns
- `ID`
- `NAME`
- `DEVELOPER_NAME`
- `NAMESPACE_PREFIX`
- `DESCRIPTION`
- `BUSINESS_PROCESS_ID`
- `SOBJECT_TYPE`
- `IS_ACTIVE`
- `CREATED_BY_ID`
- `CREATED_DATE`
- `LAST_MODIFIED_BY_ID`
- `LAST_MODIFIED_DATE`
- `SYSTEM_MODSTAMP`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_ACTIVE** (2 values):
- `True` - 217 records
- `False` - 18 records

---

## related_email_domain_c

**Column Count**: 59 columns

### Key Columns (Sample)
- `ID`
- `OWNER_ID`
- `IS_DELETED`
- `NAME`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `CURRENCY_ISO_CODE`
- `ACCOUNT_C`
- `ACCOUNT_NAME_C`
- `EMAIL_DOMAIN_C`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 1,143,063 records
- `True` - 45,621 records

---

## report

**Column Count**: 19 columns

### Key Columns
- `ID`
- `NAME`
- `DEVELOPER_NAME`
- `NAMESPACE_PREFIX`
- `FOLDER_NAME`
- `FOLDER_ID`
- `FORMAT`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `IS_DELETED`
- `LAST_RUN_DATE`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `SYSTEM_MODSTAMP`
- `DESCRIPTION`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 8,044 records
- `True` - 3,067 records

---

## task

**Column Count**: 185 columns

### Key Columns (Sample)
- `ID`
- `WHO_ID`
- `WHAT_ID`
- `WHO_COUNT`
- `WHAT_COUNT`
- `SUBJECT`
- `ACTIVITY_DATE`
- `STATUS`
- `PRIORITY`
- `IS_HIGH_PRIORITY`
- `OWNER_ID`
- `DESCRIPTION`
- `TYPE`
- `IS_DELETED`
- `ACCOUNT_ID`
- `IS_CLOSED`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `IS_ARCHIVED`
- `CALL_DURATION_IN_SECONDS`
- `CALL_TYPE`
- `CALL_DISPOSITION`
- `CALL_OBJECT_IDENTIFIER`
- `REMINDER_DATE_TIME`
- `IS_REMINDER_SET`
- `RECURRENCE_ACTIVITY_ID`
- `IS_RECURRENCE`
- `COMPLETED_DATE_TIME`
- `TASK_SUBTYPE`
- `CURRENCY_ISO_CODE`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`

### Distinct Values

**IS_DELETED** (2 values):
- `False` - 12,990,695 records
- `True` - 9,293,479 records

**IS_CLOSED** (2 values):
- `True` - 21,691,012 records
- `False` - 593,162 records

**STATUS** (17 values):
- `Completed` - 19,849,766 records
- `Not Started` - 438,959 records
- `Completed (not attempted)` - 1,702,869 records
- `In Progress` - 82,823 records
- `Waiting on someone else` - 66,073 records
- `Deferred` - 38,869 records
- `Completed: Connect` - 4,176 records
- `Attempted` - 893 records
- `Scheduled` - 560 records
- `Active` - 73 records
- `Pending` - 72 records
- `Completed: Left Voicemail` - 37 records
- `Rescheduled` - 2 records
- *(4 more values)*

**PRIORITY** (3 values):
- `Normal` - 21,838,854 records
- `High` - 439,959 records
- `Low` - 5,361 records

---

## user

**Column Count**: 334 columns

### Key Columns (Sample)
- `ID`
- `USERNAME`
- `LAST_NAME`
- `FIRST_NAME`
- `MIDDLE_NAME`
- `SUFFIX`
- `NAME`
- `COMPANY_NAME`
- `DIVISION`
- `DEPARTMENT`
- `TITLE`
- `STREET`
- `CITY`
- `STATE`
- `POSTAL_CODE`
- `COUNTRY`
- `STATE_CODE`
- `COUNTRY_CODE`
- `LATITUDE`
- `LONGITUDE`
- `GEOCODE_ACCURACY`
- `EMAIL`
- `EMAIL_PREFERENCESAUTOBCC`
- `EMAIL_ENCODING_KEY`
- `SENDER_EMAIL`
- `SENDER_NAME`
- `SIGNATURE`
- `STAYS_IN_PUBLIC_GROUP`
- `MANAGER_ID`
- `LAST_LOGIN_DATE`
- `LAST_PASSWORD_CHANGE_DATE`
- `CREATED_DATE`
- `CREATED_BY_ID`
- `LAST_MODIFIED_DATE`
- `LAST_MODIFIED_BY_ID`
- `SYSTEM_MODSTAMP`
- `OFFLINE_TRIAL_EXPIRATION_DATE`
- `OFFLINE_PDA_TRIAL_EXPIRATION_DATE`
- `USER_PERMISSIONS_MARKETING_USER`
- `USER_PERMISSIONS_OFFLINE_USER`
- `USER_PERMISSIONS_AVS_USER`
- `USER_PERMISSIONS_CALL_CENTER_AUTO_LOGIN`
- `USER_PERMISSIONS_MOBILE_USER`
- `USER_PERMISSIONS_SF_CONTENT_USER`
- `USER_PERMISSIONS_KNOWLEDGE_USER`
- `USER_PERMISSIONS_INTERACTION_USER`
- `USER_PERMISSIONS_SUPPORT_USER`
- `USER_PERMISSIONS_SITE_FORCE_CONTRIBUTOR_USER`
- `USER_PERMISSIONS_SITE_FORCE_PUBLISHER_USER`
- `USER_PERMISSIONS_WORK_DOT_COM_USER_FEATURE`
- `FORECAS_ENABLED`
- `USER_ROLE_ID`
- `PROFILE_ID`
- `ACCOUNT_ID`
- `CALL_CENTER_ID`
- `CONTACT_ID`
- `DELEGATED_APPROVER_ID`
- `IS_ACTIVE`
- `USER_TYPE`
- `LANGUAGE_LOCALE_KEY`
- `LOCALE_SID_KEY`
- `TIME_ZONE_SID_KEY`
- `CURRENCY_ISO_CODE`
- `COMMUNITY_NICKNAME`
- `DIGEST_FREQUENCY`
- `DEFAULT_GROUP_NOTIFICATION_FREQUENCY`
- `LAST_VIEWED_DATE`
- `LAST_REFERENCED_DATE`
- `BANNER_PHOTO_URL`
- `SMALL_BANNER_PHOTO_URL`
- `MEDIUM_BANNER_PHOTO_URL`
- `IS_PROFILE_PHOTO_ACTIVE`
- `INDIVIDUAL_ID`
- `_FIVETRAN_SYNCED`
- `_FIVETRAN_DELETED`
- *(Note: 250+ additional custom fields exist)*

### Distinct Values

**IS_ACTIVE** (2 values):
- `True` - 487,835 records
- `False` - 5,465 records

**USER_TYPE** (7 values):
- `CspLitePortal` - 483,803 records
- `Standard` - 6,765 records
- `PowerPartner` - 2,720 records
- `Guest` - 6 records
- `AutomatedProcess` - 4 records
- `CsnOnly` - 1 record
- `CloudIntegrationUser` - 1 record

**IS_PORTAL_ENABLED** (2 values):
- `True` - 486,030 records
- `False` - 7,270 records

**IS_PROFILE_PHOTO_ACTIVE** (2 values):
- `False` - 492,218 records
- `True` - 1,082 records

---

## Observed Patterns

### Timestamps
- Timestamp fields use UTC with timezone offset format
- Common timestamp columns: `CREATED_DATE`, `LAST_MODIFIED_DATE`, `SYSTEM_MODSTAMP`, `_FIVETRAN_SYNCED`

### Soft Deletes
- `_FIVETRAN_DELETED` - Boolean field (True/False)
- `IS_DELETED` - Boolean field (True/False)

### Relationships
- Foreign key columns often end with `_ID` suffix
- Common ID patterns: `OWNER_ID`, `CREATED_BY_ID`, `LAST_MODIFIED_BY_ID`, `ACCOUNT_ID`, `CONTACT_ID`, `LEAD_ID`

### Custom Fields
- Custom fields follow pattern: `FIELD_NAME_C`
- Many tables have 100+ custom fields
- Custom fields represent Rippling-specific configurations

### Currency
- `CURRENCY_ISO_CODE` field present across most tables
- Amount fields often have corresponding `_IN_USD` variants

---

*Last Updated: 2024-12-11*
*Analysis Based On: 10 sample rows per table + distinct value analysis*

