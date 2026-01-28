# Impact Report Template

Use this structure for all suppression impact reports.

---

```markdown
# Impact Report: [Change Name]

**Date:** YYYY-MM-DD  
**Source Table:** `PROD_RIPPLING_DWH.GROWTH.MASTER_MECH_OUTREACH_LEADS`  
**File Modified:** `[path to SQL file]`

---

## Executive Summary

[1-2 sentence description of what changed]

### Combined Impact

| Metric | Value |
|--------|-------|
| Current MO Population | X leads |
| Could benefit from change | X leads |
| Would still be suppressed (other flags) | X leads |
| **Net New Eligible Leads** | **X leads (+X.X%)** |
| **New Population** | **~X leads** |

---

## Problem Description

### Background

[Explain the bug or issue being addressed]

### The Bug/Issue

[Technical explanation with code snippets]

### The Fix

[Show the new logic with code snippets]

---

## Changes Made

### Change 1: [Name] (Lines X-Y)

**Before:**
```sql
[old code]
```

**After:**
```sql
[new code]
```

**Why:** [Explanation]

[Repeat for each change]

---

## Detailed Breakdown

| # | Category | Lead Count | % | Status |
|---|----------|------------|---|--------|
| 1 | [Reason 1] | X | X% | Working as designed |
| 2 | [Reason 2] | X | X% | Working as designed |
| 3 | **[Affected Category]** | **X** | **X%** | Bug affected |

**Total suppressed by [FLAG]:** X leads

---

## Net Impact Analysis

### Why Most Affected Leads Would Still Be Suppressed

| Other Suppression Flag | Count | % of Affected |
|------------------------|-------|---------------|
| Is Named Account | X | X% |
| Is Customer | X | X% |
| Lead-level suppressions | X | X% |
| **No other suppressions** | **X** | **X%** |

### Final Calculation

```
Net New Eligible = Affected - Still Suppressed
Net New Eligible = X - X
Net New Eligible = X leads
```

### Population Change

```
New Population = Current + Net New Eligible
New Population = X + X
New Population = X leads (+X.X%)
```

---

## Decision Matrix

| Scenario A | Scenario B | Result |
|------------|------------|--------|
| Value 1 | Value 1 | **Eligible** / **Suppress** |
| Value 2 | Value 2 | **Eligible** / **Suppress** |

### Key Behaviors

1. [Behavior 1]
2. [Behavior 2]

---

## Edge Case Validation

### [Edge Case Name]

| Scenario | Expected | Actual |
|----------|----------|--------|
| [Scenario 1] | [Expected result] | ✅ Correct |
| [Scenario 2] | [Expected result] | ✅ Correct |

---

## Risk Assessment

### Risk: [LOW/MEDIUM/HIGH]

| Factor | Assessment |
|--------|------------|
| [Factor 1] | [Assessment] |
| [Factor 2] | [Assessment] |

### Potential Edge Cases

| Scenario | Risk | Mitigation |
|----------|------|------------|
| [Scenario] | [Risk level] | [Mitigation] |

---

## Validation Queries

### Post-Deployment Verification

```sql
-- 1. Check [metric] (should show X)
[SQL query]

-- 2. Verify [metric]
[SQL query]

-- 3. Verify no regressions
[SQL query]
```

---

## Appendix: [Reference Data Title]

[Tables, definitions, or reference information]

---

## Appendix: Query Results Files

All queries saved in: `temp/[folder]/`

| File | Description |
|------|-------------|
| `01_baseline.csv` | [Description] |
| `02_breakdown.csv` | [Description] |

---

*Generated: YYYY-MM-DD*
```
