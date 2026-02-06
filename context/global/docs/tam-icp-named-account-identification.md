<!-- Source: RO-Data Governance _ Prospect Account (TAM, ICP, Named) Identification-060226-204531.pdf -->
<!-- Added: 2026-02-06 -->
<!-- Type: Documentation -->

# Data Governance | Prospect Account (TAM, ICP, Named) Identification

## TAM Account Criteria

Accounts in our CRM can become included in our **TAM Account** list if they meet certain criteria. There are two main categories of information that we look at when pulling TAM Accounts:

1. **Firmographic Data**: Does the Account meet firmographic criteria?
   - Examples: Is not serving industries on our Prohibited List, HQ is located in a country we sell to

2. **Account Data Quality Criteria**: Is the Account high enough quality from a data hygiene perspective?
   - Examples: Account has a website, is not a Rippling Competitor, has a LinkedIn URL, has an address, etc.

### Key Account Filters

**TAM Account** and **ICP Account** are master fields on the account level, which are updated by a daily **Census sync**. This sync references both queries at the bottom of this document.

> This document is our source of truth for TAM and ICP account filters. These filters are subject to change, but have been used during the FY25 Named Account refresh process.

**Definitions:**
- **TAM Account**: All accounts that fall within the company's total market scope
- **ICP Account**: All Accounts that strongly align with the company's Ideal Customer Profile
- **Named Account**: All Accounts in CRM which are owned by a human (e.g. Outbound SDR) and is undergoing prospecting

### TAM Account Filter Details

These are the filters that power the Census Sync which populates the checkbox **TAM Account** in SFDC.

| Field | Operator | Value | Description |
|-------|----------|-------|-------------|
| Account Status | is not equal to | Customer, In Implementation, Pending Churn, Open Opportunity, Ex-Client | Excludes accounts who are actively engaged with Rippling, or have had a bad relationship with us. |
| Bookings Total ARR | equals | NULL | Account is not a customer |
| Rippling Company ID | equals | NULL | Safeguard for account is not a customer |
| Account Record Type | equals | Customer (`RECORD_TYPE_ID = '0126A000000DVWDQA4'`) | Only pull in accounts for Direct Sales Account Types |
| Related Email Domain: Competitor | equals | FALSE | Related Email Domain object related to account is not marked as a competitor. |
| Industry Segment Color | is not equal to | Red, Excluded | Account is not in an Industry that Rippling does not serve (CORE ONLY) |
| Website | is not equal to | NULL, linktr.ee, [unknown], yelp.com, facebook.com, linkedin.com, gmail.com, outlook.com, etc. | Account's website is not a faulty domain |
| Industry | is not equal to | NULL | Account has an industry populated |
| LinkedIn URL | is not equal to | NULL | Account has a LinkedIn URL populated |
| NAL Removal Reason | is not equal to | Out of Business, Do Not Contact | Account has not been removed as a bad account by a human before |
| Of Partner Child Accounts | is equal to | 0 | If this is > 0, then the account is a "parent partner account" |

---

## ICP Account Criteria

Accounts in our CRM can become included in our **ICP Account** list if they meet certain criteria beyond the TAM Account criteria outlined above. There is one additional category of information that we look at when pulling ICP Accounts:

- **Rules of Engagement Criteria**: Is the Account currently under protected ownership and therefore can't be subject to an ownership change?
  - Examples: Account has an open opportunity, Account has a very recently closed lost opportunity, Account is a Customer, Account has been referred by a partner recently, etc.

For certain segments where there are a surplus of TAM accounts, we refine the ICP Accounts further by zeroing in on accounts within 'Green' Industries, VC backed, etc.

### ICP Account Filter Details

These filters are what we use to allocate Named Accounts during Book Setting periods and include 'ROE' type filters.

These are the filters that power the Census Sync which populates the checkbox **ICP Account** in SFDC.

| Field | Operator | Value | Description |
|-------|----------|-------|-------------|
| TAM Account | equals | TRUE | Powered by Census (Query below). |
| Account Status | is not equal to | Open Opportunity | Dupe filter to ensure Account has not moved into 'Open Opportunity' Status since last TAM Account Census run. Used in SFDC Reporting. |
| Referring Account Last Updated Date | is not equal to | Last 180 Days | Per ROE, do not pull in accounts that have been referred by a Partner recently. |
| Last Closed Lost Opportunity Date | is not equal to | Last 90 Days | Per ROE, do not pull in accounts with a recent closed lost opportunity. |

### US SMB Variable ICP Parameters

| Bucket | Criteria | Description |
|--------|----------|-------------|
| **Bucket 1** | No. of Employees between 11 and 20 AND either: Industry Segment = Tech AND Funding >= $250k, OR any company with any amount of funding from list of top investors. No. of Employees between 21 and 50, Industry Segment = Tech, Core Account Fit Tier = Tier 1, Last Funding Round in the last 5 years | Likely to be fastest growing, highest lifetime value accounts. |
| **Bucket 2** | Not Bucket 1, Industry Segment = Tech, Funding Amount >= $1 | Likely to be fast-growing, with high lifetime value. Likely to be true Tech. |
| **Bucket 3** | Not Bucket 1 or 2, Industry Color = Green, Yellow, or Orange, Funding Amount >= $1 | Likely to be fast-growing, with high lifetime value. If Industry is not Tech they might be self misclassifying. |
| **Bucket 4** | Not Bucket 1, 2 or 3, Industry = Software Development, Technology Information and Internet, IT Services and IT Consulting, Computer and Network Security, Business Intelligence Platforms, Computer Software | Any account within our top 6 Tech industries. |
| **Parent Account** | equals NULL | Account does not have a parent. |

### AU SMB Variable ICP Parameters

| Bucket | Criteria | Description |
|--------|----------|-------------|
| **Bucket 1** | VC Backed = True | Account is VC backed. |
| **Bucket 2** | Not Bucket 1, Industry Segment = Tech, United States Employee Count >= 1 | Tech Accounts with US Employees. |
| **Bucket 3** | Not Bucket 1 or 2, Industry Segment = Tech, New Zealand/Singapore/United Kingdom Employee Count >= 1, United States Employee Count = 0 | Tech Accounts with Employees in NZ, SG, or the UKI, without employees in the US. |

---

## Named Account Criteria

Accounts in our CRM will be tagged as **Named Account** = TRUE when they are currently allocated to a seller (SDR, AE) for Outbound prospecting.

See the **Annual Refresh | FY26 Territory Build Details** for more information on the Named Account program -- including staffed territories, book balancing criteria and more.

---

## Census Sync Query

The Census sync query used to classify TAM and ICP accounts is stored separately in `context/global/sql-patterns/tam_icp_account_classification.sql`.
