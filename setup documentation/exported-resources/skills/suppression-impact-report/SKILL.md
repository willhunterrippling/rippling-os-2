---
name: suppression-impact-report
description: Generate comprehensive impact reports for SQL suppression code changes in the MO leads pipeline. Use when analyzing bug fixes, rule changes, or modifications to suppression logic in mo_leads_with_suppression.sql or related files.
---

# Suppression Impact Report Generator

Generate detailed impact reports for changes to MO leads suppression logic, including TAM impact, edge case validation, and risk assessment.

## When to Use

- Bug fixes to suppression SQL (NULL handling, logic errors)
- Rule changes (threshold adjustments, new suppression flags)
- Fallback logic additions
- Any modification to `mo_leads_with_suppression.sql`

## Report Generation Workflow

### Phase 1: Understand the Change

1. Read the fix documentation or code diff
2. Identify:
   - What problem is being addressed?
   - What SQL logic changed?
   - What edge cases exist?

### Phase 2: Run Baseline Queries

Execute queries against `MASTER_MECH_OUTREACH_LEADS` to establish:

```
Task Progress:
- [ ] Current MO population count
- [ ] Total suppressed by the affected flag
- [ ] Breakdown by suppression reason
- [ ] Other suppression flags that would still apply
- [ ] Net new eligible leads calculation
```

See [query-templates.md](query-templates.md) for starter queries.

### Phase 3: Validate Edge Cases

For each edge case in the logic:
1. Write a query to isolate records in that scenario
2. Verify the new logic handles it correctly
3. Document expected vs actual behavior

### Phase 4: Calculate Net Impact

```
Net New Eligible = Affected Leads - Still Suppressed by Other Flags
```

Always account for:
- IS_CUSTOMER, IS_COMPETITOR, IS_PARTNER
- IS_NAMED_ACCOUNT
- INELIGIBLE_INDUSTRY
- IS_LEAD_SUPPRESSION (lead-level flags)
- Domain-level rules (>100 leads, EE >5000)

### Phase 5: Write the Report

Use the template structure from [report-template.md](report-template.md).

## Report Structure

| Section | Purpose |
|---------|---------|
| Executive Summary | Combined impact table, key metrics |
| Problem Description | What bug/issue is being fixed |
| Changes Made | Before/after SQL snippets |
| Detailed Breakdown | Suppression reason categories |
| Net Impact Analysis | Gross vs net calculation |
| Edge Case Validation | Decision matrix, scenarios |
| Risk Assessment | LOW/MEDIUM/HIGH with rationale |
| Validation Queries | Post-deployment verification SQL |
| Appendix | Query results, reference data |

## Key Tables

| Table | Purpose |
|-------|---------|
| `GROWTH.MASTER_MECH_OUTREACH_LEADS` | Main MO population with all flags |
| `GROWTH.MASTER_DOMAIN_SOURCES` | Domain-level data (EE_SIZE, MAX_EE_SIZE) |
| `GROWTH.MECH_OUTREACH_SEGMENT_RANGES` | Segment definitions (SSB/SMB/MM/ENT/STRAT) |
| `SFDC.ACCOUNT` | Account employee data |
| `SFDC.CONTACT` / `SFDC.LEAD` | Lead/contact records |

## Critical Suppression Flags

Always check these when calculating net impact:

```sql
-- Account-level suppressions
IS_CUSTOMER, IS_COMPETITOR, IS_PARTNER_ACCOUNT, IS_CHURNED,
IS_NAMED_ACCOUNT, INELIGIBLE_INDUSTRY, OPEN_OPPORTUNITY

-- Lead-level suppressions  
IS_LEAD_SUPPRESSION

-- Company size
INELIGIBLE_COMPANY_SIZE, EE_SIZE_OUT_OF_RANGE
```

## Query Execution

Run queries via:
```bash
python3 core/query_runner.py --sql <file.sql> --output temp/<folder>/_outputs --preview 30
```

## Output Location

Save reports to: `projects/suppression_issues/reports/`

Naming convention: `<CHANGE_NAME>_IMPACT.md`
- `INELIGIBLE_COMPANY_SIZE_FIX_IMPACT.md`
- `LARGE_COMPANY_SUPPRESSION_CHANGES_IMPACT.md`

## Additional Resources

- [report-template.md](report-template.md) - Full report template
- [query-templates.md](query-templates.md) - SQL query patterns
- [suppression-flags.md](suppression-flags.md) - Flag reference
