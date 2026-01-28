# Report Template: Suppression Logic Breakdown

Use this template when documenting suppression investigation findings.

---

```markdown
# [SUPPRESSION_FIELD] Suppression Breakdown Report

**Generated Date**: YYYY-MM-DD  
**Query**: `diagnostic_queries/##_[suppression_field]_breakdown.sql`  
**Source Table**: `[DATABASE].[SCHEMA].[TABLE]`

---

## Executive Summary

This report breaks down the `[SUPPRESSION_FIELD]` suppression logic to understand which conditions are excluding records and identify potential bugs.

**Key Findings**:
- **[FIELD] is the #X suppression reason** (X records, X% of total)
- **[BUG STATUS]**: [Impact description]
- **[Key insight about data distribution]**

---

## Overall Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Records | X | 100.00% |
| [FIELD] = TRUE | X | X% |
| [FIELD] = FALSE | X | X% |

---

## Condition-Level Breakdown

| Condition | Count | Percentage | Notes |
|-----------|-------|------------|-------|
| [Condition 1] | X | X% | [Explanation] |
| [Condition 2] | X | X% | [Explanation] |
| [Exception 1] | X | X% | Should NOT be suppressed |

---

## Value Discovery

### All [KEY_FIELD] Values in Data

| Value | Count | Percentage | In Allowed List? |
|-------|-------|------------|------------------|
| [value1] | X | X% | Yes/No |
| NULL | X | X% | No |

**Allowed Values** (from code):
- value1
- value2

---

## Segment Analysis

| Segment | Total | Suppressed | Rate |
|---------|-------|------------|------|
| [Segment1] | X | X | X% |

---

## Bug Detection

### Bug 1: [Bug Name]

**Issue**: [Description of the bug]

**Impact**: **X records affected (X% of population)**

**Severity**: [CRITICAL/HIGH/MEDIUM/LOW]

**Example Scenario**:
- Record has [field] = "[value]" (allowed)
- Record has [other_field] = "[value]" (excluded)
- Result: Record is suppressed (incorrect)

**Expected Behavior**: [What should happen]

**Sample Records**: See `##b_bug_samples_[name].sql`

---

## Recommendations

### Immediate Actions

1. **[SEVERITY]: [Fix Name]** 
   - **Impact**: X records
   - **Action**: [What to do]
   - **Expected Result**: [Outcome]

### Long-Term Improvements

1. [Improvement suggestion]

---

## Appendix

### SQL Logic Reference

The [FIELD] logic is defined in `[file]` lines X-Y:

\`\`\`sql
[Paste the relevant CASE statement]
\`\`\`

### Suggested Fix

\`\`\`sql
[Paste the corrected CASE statement]
\`\`\`

---

## Query Results

**Status**: [Pending/Completed]  
**Results File**: `temp/_outputs/[filename].csv`
```
