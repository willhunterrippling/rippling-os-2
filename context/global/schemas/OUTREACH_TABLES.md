# Outreach Schema Tables Reference

Detailed documentation for Outreach.io tables in `prod_rippling_dwh.outreach` schema.

---

## Table of Contents
- [data_connection](#data_connection)
- [event](#event)
- [mailing](#mailing)
- [prospect](#prospect)
- [sequence](#sequence)
- [sequence_state](#sequence_state)
- [sequence_step](#sequence_step)
- [sequence_tag](#sequence_tag)

---

## data_connection

**Purpose**: Maps Outreach objects to external systems (primarily Salesforce). Tracks the connection between Outreach records and their corresponding records in CRM systems.

**Record Count**: ~153M records

### Key Columns
- `ID` - Salesforce/External system ID
- `PARENT_ID` - ID of the parent Outreach object
- `PARENT_TYPE` - Type of parent object in Outreach
- `TYPE` - Type of object in external system
- `CONNECTION` - External system name (typically "salesforce")
- `URL` - Direct link to record in external system
- `_FIVETRAN_SYNCED` - Timestamp of last sync

### Distinct Values

**PARENT_TYPE** (10 values):
- `mailing` - 61.9M records
- `event` - 52.2M records
- `prospect` - 22.5M records
- `call` - 8.8M records
- `task` - 5.2M records
- `account` - 2.2M records
- `opportunity` - 624K records
- `user` - 3.6K records
- `opportunityStage` - 99 records
- `stage` - 19 records

**TYPE** (8 values):
- `Task` - 128.2M records
- `Lead` - 13.4M records
- `Contact` - 9.2M records
- `Account` - 2.2M records
- `Opportunity` - 624K records
- `User` - 3.6K records
- `OpportunityStage` - 99 records
- `LeadStatus` - 19 records

---

## event

**Record Count**: ~1.8B records

### Key Columns
- `ID` - Unique event identifier
- `TYPE` - Event type (always "event")
- `BODY` - Event body content
- `CREATED_AT` - Event creation timestamp
- `EVENT_AT` - When the event occurred
- `EXTERNAL_URL` - Link to external resource
- `NAME` - Event name/type (e.g., "prospect_stage_changed", "sequence_state_finished", "outbound_message")
- `PAYLOAD` - JSON payload with event details
- `REQUEST_CITY` - City where request originated
- `REQUEST_DEVICE` - Device type
- `REQUEST_HOST` - Host information
- `REQUEST_PROXIED` - Whether request was proxied (Boolean)
- `REQUEST_REGION` - Geographic region
- `RELATIONSHIP_MAILING_ID` - Related mailing ID
- `RELATIONSHIP_PROSPECT_ID` - Related prospect ID
- `RELATIONSHIP_USER_ID` - Related user ID
- `RELATIONSHIP_OPPORTUNITY_ID` - Related opportunity ID
- `RELATIONSHIP_ACCOUNT_ID` - Related account ID
- `RELATIONSHIP_TASK_ID` - Related task ID
- `RELATIONSHIP_CALL_ID` - Related call ID
- `UPDATED_AT` - Last update timestamp
- `_FIVETRAN_DELETED` - Soft delete flag
- `_FIVETRAN_SYNCED` - Last sync timestamp

---

## mailing

**Purpose**: Stores all email communications sent through Outreach including sequence emails, single sends, and campaign emails. Contains email content, delivery status, and engagement metrics.

**Record Count**: ~104.7M records

### Key Columns
- `ID` - Unique mailing identifier
- `TYPE` - Record type (always "mailing")
- `BODY_HTML` - HTML version of email body
- `BODY_TEXT` - Plain text version of email body
- `SUBJECT` - Email subject line
- `MAILBOX_ADDRESS` - Sender email address
- `MAILING_TYPE` - Type of mailing (sequence/single/campaign)
- `STATE` - Current delivery state
- `STATE_CHANGED_AT` - When state last changed
- `SCHEDULED_AT` - When email is/was scheduled to send
- `CREATED_AT` - Creation timestamp
- `DELIVERED_AT` - Delivery timestamp
- `OPENED_AT` - First open timestamp
- `CLICKED_AT` - First click timestamp
- `REPLIED_AT` - Reply timestamp
- `BOUNCED_AT` - Bounce timestamp
- `UNSUBSCRIBED_AT` - Unsubscribe timestamp
- `MARKED_AS_SPAM_AT` - Spam report timestamp
- `OPEN_COUNT` - Number of opens
- `CLICK_COUNT` - Number of clicks
- `RETRY_AT` - Next retry timestamp
- `RETRY_COUNT` - Number of retry attempts
- `RETRY_INTERVAL` - Time between retries
- `ERROR_REASON` - Failure reason
- `ERROR_BACKTRACE` - Error details
- `MESSAGE_ID` - Email message ID
- `TRACK_OPENS` - Whether to track opens (Boolean)
- `TRACK_LINKS` - Whether to track clicks (Boolean)
- `OVERRIDE_SAFETY_SETTINGS` - Override safety checks (Boolean)
- `FOLLOW_UP_TASK_SCHEDULED_AT` - Follow-up task timestamp
- `FOLLOW_UP_TASK_TYPE` - Type of follow-up task
- `NOTIFY_THREAD_CONDITION` - Notification condition
- `NOTIFY_THREAD_SCHEDULED_AT` - Thread notification schedule
- `NOTIFY_THREAD_STATUS` - Thread notification status
- `RELATIONSHIP_MAILBOX_ID` - Related mailbox ID
- `RELATIONSHIP_OPPORTUNITY_ID` - Related opportunity ID
- `RELATIONSHIP_PROSPECT_ID` - Related prospect ID
- `RELATIONSHIP_SEQUENCE_ID` - Related sequence ID
- `RELATIONSHIP_SEQUENCE_STATE_ID` - Related sequence state ID
- `RELATIONSHIP_SEQUENCE_STEP_ID` - Related sequence step ID
- `RELATIONSHIP_TASK_ID` - Related task ID
- `RELATIONSHIP_TEMPLATE_ID` - Related template ID
- `RELATIONSHIP_FOLLOW_UP_SEQUENCE_ID` - Follow-up sequence ID
- `RELATIONSHIP_USER_ID` - Related user ID
- `UPDATED_AT` - Last update timestamp
- `_FIVETRAN_DELETED` - Soft delete flag
- `_FIVETRAN_SYNCED` - Last sync timestamp

### Distinct Values

**STATE** (10 values):
- `delivered` - 60.5M records
- `opened` - 34.2M records
- `replied` - 5.0M records
- `bounced` - 2.7M records
- `scheduled` - 1.7M records
- `drafted` - 248K records
- `failed` - 228K records
- `placeholder` - 1.2K records
- `queued` - 47 records
- `delivering` - 2 records

**MAILING_TYPE** (3 values):
- `sequence` - 94.4M records
- `single` - 10.0M records
- `campaign` - 228K records

**FOLLOW_UP_TASK_TYPE** (2 values):
- `no_reply` - 4.7K records
- `follow_up` - 155 records

**NOTIFY_THREAD_STATUS** (3 values):
- `sent` - 169K records
- `skipped` - 79K records
- `pending` - 512 records

---

## prospect

**Record Count**: ~24.9M records

### Key Columns
- `ID` - Unique prospect identifier
- `TYPE` - Record type (always "prospect")
- `FIRST_NAME` - First name
- `LAST_NAME` - Last name
- `MIDDLE_NAME` - Middle name
- `NAME` - Full name
- `NICKNAME` - Nickname
- `TITLE` - Job title
- `COMPANY` - Company name
- `EMAILS_OPT_STATUS` - Email opt-out status
- `CALLS_OPT_STATUS` - Call opt-out status
- `SMS_OPT_STATUS` - SMS opt-out status
- `OPTED_OUT` - Overall opt-out flag (Boolean)
- `EMAIL_OPTED_OUT` - Email opt-out flag (Boolean)
- `CALL_OPTED_OUT` - Call opt-out flag (Boolean)
- `SMS_OPTED_OUT` - SMS opt-out flag (Boolean)
- `OPTED_OUT_AT` - Opt-out timestamp
- `EMAILS_OPTED_AT` - Email opt-out timestamp
- `CALLS_OPTED_AT` - Call opt-out timestamp
- `SMS_OPTED_AT` - SMS opt-out timestamp
- `STAGE_NAME` - Current stage name
- `PERSONA_NAME` - Persona classification
- `ACCOUNT_NAME` - Associated account name
- `COMPANY_TYPE` - Type of company
- `COMPANY_NATURAL` - Natural company name
- `COMPANY_INDUSTRY` - Industry classification
- `COMPANY_SIZE` - Company size
- `COMPANY_FOUNDED_AT` - Company founding date
- `COMPANY_LINKED_IN` - Company LinkedIn URL
- `COMPANY_LINKED_IN_EMPLOYEES` - LinkedIn employee count
- `COMPANY_FOLLOWERS` - Social media followers
- `ADDRESS_STREET` - Street address
- `ADDRESS_STREET_2` - Address line 2
- `ADDRESS_CITY` - City
- `ADDRESS_STATE` - State/province
- `ADDRESS_ZIP` - Postal code
- `ADDRESS_COUNTRY` - Country
- `REGION` - Geographic region
- `TIME_ZONE` - Time zone
- `TIME_ZONE_IANA` - IANA time zone
- `TIME_ZONE_INFERRED` - Inferred time zone
- `LINKED_IN_URL` - LinkedIn profile URL
- `LINKED_IN_ID` - LinkedIn ID
- `LINKED_IN_SLUG` - LinkedIn slug
- `LINKED_IN_CONNECTIONS` - LinkedIn connection count
- `LINKED_IN_EMPLOYEES` - LinkedIn reported employees
- `TWITTER_URL` - Twitter profile URL
- `TWITTER_USERNAME` - Twitter handle
- `FACEBOOK_URL` - Facebook profile URL
- `GITHUB_URL` - GitHub profile URL
- `GITHUB_USERNAME` - GitHub username
- `GOOGLE_PLUS_URL` - Google+ profile URL
- `QUORA_URL` - Quora profile URL
- `ANGEL_LIST_URL` - AngelList profile URL
- `STACK_OVERFLOW_ID` - Stack Overflow ID
- `STACK_OVERFLOW_URL` - Stack Overflow profile URL
- `WEBSITE_URL_1` - Primary website
- `WEBSITE_URL_2` - Secondary website
- `WEBSITE_URL_3` - Tertiary website
- `EXTERNAL_ID` - External system ID
- `EXTERNAL_OWNER` - External owner
- `EXTERNAL_SOURCE` - External source system
- `SOURCE` - Lead source
- `CAMPAIGN_NAME` - Campaign name
- `EVENT_NAME` - Event name
- `SPECIALTIES` - Job specialties
- `OCCUPATION` - Occupation
- `GENDER` - Gender
- `DATE_OF_BIRTH` - Birth date
- `DEGREE` - Education degree
- `SCHOOL` - School/university
- `GRADUATION_DATE` - Graduation date
- `JOB_START_DATE` - Job start date
- `PERSONAL_NOTE_1` - Personal note field 1
- `PERSONAL_NOTE_2` - Personal note field 2
- `PREFERRED_CONTACT` - Preferred contact method
- `SHARING_TEAM_ID` - Sharing team ID
- `ENGAGED_SCORE` - Engagement score
- `SCORE` - Overall score
- `OPEN_COUNT` - Total email opens
- `CLICK_COUNT` - Total email clicks
- `REPLY_COUNT` - Total email replies
- `CALL_OPTED_OUT` - Call opt-out status (Boolean)
- `EMAIL_OPTED_OUT` - Email opt-out status (Boolean)
- `OPTED_OUT` - Overall opt-out (Boolean)
- `ENRICHABLE` - Can be enriched (Boolean)
- `CREATED_AT` - Creation timestamp
- `UPDATED_AT` - Last update timestamp
- `ADDED_AT` - Added to Outreach timestamp
- `AVAILABLE_AT` - Available timestamp
- `ENGAGED_AT` - Last engagement timestamp
- `TOUCHED_AT` - Last touched timestamp
- `TRASHED_AT` - Trash timestamp
- `RELATIONSHIP_CREATOR_ID` - Creator user ID
- `RELATIONSHIP_OWNER_ID` - Owner user ID
- `RELATIONSHIP_ACCOUNT_ID` - Related account ID
- `RELATIONSHIP_STAGE_ID` - Current stage ID
- `RELATIONSHIP_PERSONA_ID` - Persona ID
- `RELATIONSHIP_UPDATER_ID` - Last updater ID
- `UPDATER_TYPE` - Type of updater
- `UPDATER_ID` - Updater ID
- `REAL_CREATOR_TYPE` - Original creator type
- `REAL_CREATOR_ID` - Original creator ID
- `EMAIL_CONTACTS` - Email contact data
- `CONTACT_HISTOGRAM` - Contact frequency histogram
- `CUSTOM_1` through `CUSTOM_150` - Custom field values
- `_FIVETRAN_DELETED` - Soft delete flag
- `_FIVETRAN_SYNCED` - Last sync timestamp

### Distinct Values

**STAGE_NAME** (19 values):
- `New` - 12.0M records
- `No Response/Unable to Contact` - 6.1M records
- `Bad Contact Info` - 2.5M records
- `In Cadence` - 1.3M records
- `Do Not Contact / Opt Out` - 1.3M records
- `Recycled` - 459K records
- `Do Not Contact / Opt Out ` - 335K records
- `Qualified` - 263K records
- `Disqualified` - 229K records
- `Replied` - 117K records
- `Engaged` - 113K records
- `Working` - 22K records
- `Not Interested` - 9.8K records
- `Contact in the Future` - 5.6K records
- `Pass Off` - 461 records
- `Unqualified` - 325 records
- `Interested / Went Dark` - 223 records
- `Booking` - 82 records
- `Hold` - 52 records

**COMPANY_TYPE** (30 values):
Top 10:
- `Customer` - 24.2M records
- `Partner` - 283K records
- `Accountant` - 50.5K records
- `Insurance Broker` - 23.8K records
- `HR Consultant` - 7.4K records
- `CFO Consultant` - 1.4K records
- `Other` - 1.3K records
- `VC Firm` - 747 records
- `MSP` - 480 records
- `VAR` - 288 records

**UPDATER_TYPE** (5 values):
- `Plugin` - 20.8M records
- `Sequence` - 2.0M records
- `Import` - 1.1M records
- `Trigger` - 563K records
- `User` - 294K records

**REAL_CREATOR_TYPE** (3 values):
- `Plugin` - 11.2M records
- `User` - 166K records
- `Import` - 57.9K records

**ADDRESS_STATE** (100+ values):
Top 10:
- `CA` - 1.9M records
- `NY` - 1.1M records
- `TX` - 1.0M records
- `FL` - 785K records
- `IL` - 548K records
- `MA` - 455K records
- `PA` - 454K records
- `ON` - 401K records
- `GA` - 397K records
- `OH` - 389K records

---

## sequence

**Purpose**: Defines email/outreach sequences (cadences) including their configuration, automation settings, performance metrics, and sharing settings.

**Record Count**: ~22K records

### Key Columns
- `ID` - Unique sequence identifier
- `TYPE` - Record type (always "sequence")
- `NAME` - Sequence name
- `DESCRIPTION` - Sequence description
- `SEQUENCE_TYPE` - Type of sequence timing
- `SCHEDULE_INTERVAL_TYPE` - Interval scheduling type
- `SHARE_TYPE` - Sharing configuration
- `PRIMARY_REPLY_ACTION` - Action on primary reply
- `SECONDARY_REPLY_ACTION` - Action on secondary reply
- `PRIMARY_REPLY_PAUSE_DURATION` - Pause duration for primary reply (seconds)
- `SECONDARY_REPLY_PAUSE_DURATION` - Pause duration for secondary reply (seconds)
- `ENABLED` - Whether sequence is enabled (Boolean)
- `FINISH_ON_REPLY` - Finish sequence on reply (Boolean)
- `LOCKED` - Whether sequence is locked (Boolean)
- `THROTTLE_PAUSED` - Whether throttle is paused (Boolean)
- `TRANSACTIONAL` - Transactional email flag (Boolean)
- `SEQUENCE_STEP_COUNT` - Number of steps
- `DURATION_IN_DAYS` - Total duration in days
- `MAX_ACTIVATIONS` - Maximum simultaneous activations
- `THROTTLE_CAPACITY` - Throttle capacity
- `THROTTLE_MAX_ADDS_PER_DAY` - Max daily additions
- `AUTOMATION_PERCENTAGE` - Percentage automated (0-1)
- `NUM_CONTACTED_PROSPECTS` - Total prospects contacted
- `NUM_REPLIED_PROSPECTS` - Total prospects replied
- `BOUNCE_COUNT` - Total bounces
- `CLICK_COUNT` - Total clicks
- `DELIVER_COUNT` - Total deliveries
- `FAILURE_COUNT` - Total failures
- `OPEN_COUNT` - Total opens
- `OPT_OUT_COUNT` - Total opt-outs
- `REPLY_COUNT` - Total replies
- `SCHEDULE_COUNT` - Total scheduled
- `NEGATIVE_REPLY_COUNT` - Negative replies
- `NEUTRAL_REPLY_COUNT` - Neutral replies
- `POSITIVE_REPLY_COUNT` - Positive replies
- `CREATED_AT` - Creation timestamp
- `UPDATED_AT` - Last update timestamp
- `ENABLED_AT` - Enabled timestamp
- `LAST_USED_AT` - Last used timestamp
- `THROTTLE_PAUSED_AT` - Throttle pause timestamp
- `LOCKED_AT` - Lock timestamp
- `RELATIONSHIP_CREATOR_ID` - Creator user ID
- `RELATIONSHIP_OWNER_ID` - Owner user ID
- `RELATIONSHIP_UPDATER_ID` - Last updater ID
- `RELATIONSHIP_RULESET_ID` - Related ruleset ID
- `_FIVETRAN_DELETED` - Soft delete flag
- `_FIVETRAN_SYNCED` - Last sync timestamp

### Distinct Values

**SEQUENCE_TYPE** (2 values):
- `interval` - 18.2K records
- `date` - 3.8K records

**SCHEDULE_INTERVAL_TYPE** (2 values):
- `calendar` - 13.0K records
- `schedule` - 8.9K records

**SHARE_TYPE** (3 values):
- `shared` - 16.4K records
- `private` - 4.9K records
- `read_only` - 633 records

---

## sequence_state

**Record Count**: ~35.2M records

### Key Columns
- `ID` - Unique sequence state identifier
- `TYPE` - Record type (always "sequenceState")
- `STATE` - Current state of enrollment
- `STATE_CHANGED_AT` - When state last changed
- `PAUSE_REASON` - Reason for pause
- `ERROR_REASON` - Error details
- `BOUNCE_COUNT` - Bounces in this sequence
- `CLICK_COUNT` - Clicks in this sequence
- `DELIVER_COUNT` - Deliveries in this sequence
- `FAILURE_COUNT` - Failures in this sequence
- `OPEN_COUNT` - Opens in this sequence
- `OPT_OUT_COUNT` - Opt-outs in this sequence
- `REPLY_COUNT` - Replies in this sequence
- `SCHEDULE_COUNT` - Scheduled items in this sequence
- `NEGATIVE_REPLY_COUNT` - Negative replies
- `NEUTRAL_REPLY_COUNT` - Neutral replies
- `POSITIVE_REPLY_COUNT` - Positive replies
- `SEQUENCE_EXCLUSIVITY` - Exclusivity setting
- `AUTO_RESUME_OOTO_PROSPECTS` - Auto-resume out-of-office (Boolean)
- `INCLUDE_UNSUBSCRIBE_LINKS` - Include unsubscribe links (Boolean)
- `STEP_OVERRIDES_ENABLED` - Step overrides enabled (Boolean)
- `CREATED_AT` - Creation timestamp
- `UPDATED_AT` - Last update timestamp
- `ACTIVE_AT` - Activation timestamp
- `CALL_COMPLETED_AT` - Call completion timestamp
- `REPLIED_AT` - Reply timestamp
- `RELATIONSHIP_CREATOR_ID` - Creator user ID
- `RELATIONSHIP_ACCOUNT_ID` - Related account ID
- `RELATIONSHIP_OPPORTUNITY_ID` - Related opportunity ID
- `RELATIONSHIP_SEQUENCE_ID` - Parent sequence ID
- `RELATIONSHIP_SEQUENCE_STEP_ID` - Current step ID
- `RELATIONSHIP_PROSPECT_ID` - Prospect ID
- `RELATIONSHIP_MAILBOX_ID` - Mailbox ID
- `_FIVETRAN_DELETED` - Soft delete flag
- `_FIVETRAN_SYNCED` - Last sync timestamp

### Distinct Values

**STATE** (8 values):
- `finished` - 34.5M records
- `active` - 309K records
- `paused` - 126K records
- `disabled` - 103K records
- `opted_out` - 99K records
- `pending` - 70K records
- `failed` - 22K records
- `bounced` - 408 records

---

## sequence_step

**Purpose**: Defines individual steps within sequences including email templates, calls, tasks, and LinkedIn actions. Represents the building blocks of outreach cadences.

**Record Count**: ~95K records

### Key Columns
- `ID` - Unique step identifier
- `TYPE` - Record type (always "sequenceStep")
- `STEP_TYPE` - Type of step action
- `DISPLAY_NAME` - Step display name
- `ORDER` - Step order in sequence
- `INTERVAL` - Days/hours before executing
- `DATE` - Specific execution date (for date-based sequences)
- `TASK_NOTE` - Task description
- `TASK_AUTOSKIP_DELAY` - Auto-skip delay for tasks
- `BOUNCE_COUNT` - Total bounces on this step
- `CLICK_COUNT` - Total clicks on this step
- `DELIVER_COUNT` - Total deliveries of this step
- `FAILURE_COUNT` - Total failures on this step
- `OPEN_COUNT` - Total opens on this step
- `OPT_OUT_COUNT` - Total opt-outs on this step
- `REPLY_COUNT` - Total replies on this step
- `SCHEDULE_COUNT` - Times this step was scheduled
- `NEGATIVE_REPLY_COUNT` - Negative replies
- `NEUTRAL_REPLY_COUNT` - Neutral replies
- `POSITIVE_REPLY_COUNT` - Positive replies
- `CREATED_AT` - Creation timestamp
- `UPDATED_AT` - Last update timestamp
- `RELATIONSHIP_CREATOR_ID` - Creator user ID
- `RELATIONSHIP_SEQUENCE_ID` - Parent sequence ID
- `RELATIONSHIP_CALL_PURPOSE_ID` - Call purpose ID (for call steps)
- `RELATIONSHIP_TASK_PRIORITY_ID` - Task priority ID (for task steps)
- `RELATIONSHIP_UPDATER_ID` - Last updater ID
- `_FIVETRAN_DELETED` - Soft delete flag
- `_FIVETRAN_SYNCED` - Last sync timestamp

### Distinct Values

**STEP_TYPE** (10 values):
- `auto_email` - 58.8K records
- `call` - 25.6K records
- `manual_email` - 5.4K records
- `linkedin_send_connection_request` - 2.9K records
- `linkedin_send_message` - 1.5K records
- `task` - 688 records
- `linkedin_view_profile` - 273 records
- `linkedin_interact_with_post` - 181 records
- `linkedin_other` - 75 records
- `manual_sms` - 1 record

---

## sequence_tag

### Key Columns
- `SEQUENCE_ID`
- `TAG_NAME`
- `_FIVETRAN_SYNCED`

---

## Observed Patterns

### Timestamps
- Timestamp fields use UTC with timezone offset format
- Common timestamp columns: `CREATED_AT`, `UPDATED_AT`, `_FIVETRAN_SYNCED`

### Soft Deletes
- `_FIVETRAN_DELETED` - Boolean field (False/True)

### Relationships
- Foreign key columns follow pattern: `RELATIONSHIP_[OBJECT]_ID`

### Custom Fields
- Prospect table has 150 custom fields: `CUSTOM_1` through `CUSTOM_150`

---

*Last Updated: 2024-12-11*
*Analysis Based On: 10 sample rows per table + distinct value analysis*

