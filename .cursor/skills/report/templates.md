# Report Templates and Formatting

This document contains report structure templates, formatting best practices, and narrative guidance.

## Comprehensive Report Template

```markdown
# [Report Title]

**Investigation Date:** YYYY-MM-DD  
**Analyst:** [Name] (via Cursor Agent)

---

## Executive Summary

Provide a quick overview with a key findings table:

| Finding | Impact |
|---------|--------|
| **Key finding 1** | X records affected [1] |
| **Key finding 2** | Y% of total [2] |
| **Data is NOT stale** | Last updated today [3] |

---

## 1. [First Major Section]

Use **numbered sections** for easy navigation. Include tables with clear headers:

| Category | Count | % | Notes |
|----------|------:|--:|-------|
| Category A | 1,234 [4] | 45% | Explanation |
| Category B | 567 [4] | 21% | Explanation |

### Subsection
Break down complex topics into subsections.

---

## 2. [Second Major Section]

Continue with numbered sections...

---

## 3. Summary / Recommendations

### Key Takeaways
- Use bullet points for actionable items
- Prioritize by impact

### Recommendations

| Priority | Action | Expected Impact |
|----------|--------|-----------------|
| HIGH | Do X first | Affects Y records |
| MEDIUM | Then do Z | Improves W% |

---

## References
[1]: report_01_key_finding
[2]: report_02_percentage_analysis
[3]: report_03_data_freshness
[4]: report_04_category_breakdown

---

*Report generated on [date] from [project-name] project*
```

## Formatting Best Practices

### 1. Visual Indicators

Use visual indicators for eligibility/status:
- ✅ for eligible/passing/good
- ❌ for ineligible/failing/issues

Example: `| New | 5.4M | ✅ ELIGIBLE |`

### 2. Table Alignment

Right-align numbers in tables for readability:
```markdown
| Category | Count | Percentage |
|----------|------:|-----------:|
| Type A   | 1,234 |        45% |
| Type B   |   567 |        21% |
```

Use `|------:|` in table separator for right alignment.

### 3. Bold Key Findings

Make reports scannable by bolding key findings:
```markdown
Based on `report_status_breakdown`, we found **2.7M leads in "Qualified" status**.
```

### 4. Horizontal Rules

Use horizontal rules (`---`) between major sections for visual separation.

### 5. Query Citations

**Use numbered citations** to link findings to their source queries. Citations render as superscript links.

```markdown
The total population is 5.4M leads [1], with 60% in "New" status [2].

---

## References
[1]: report_01_total_population
[2]: report_02_status_breakdown
```

This renders `[1]` and `[2]` as clickable superscript links to `/projects/slug/queries/report_01_total_population` etc.

**Best practices:**
- Add citations after every number or percentage that comes from a query
- Use sequential numbering: [1], [2], [3]
- Always include a References section at the bottom
- Query names must match exactly (no `.sql` extension)

**Example in context:**
```markdown
## Executive Summary

| Finding | Impact |
|---------|--------|
| Total leads in scope | 5.4M [1] |
| Suppressed leads | 3.2M (60%) [2] |
| Top suppression reason | "Ineligible Status" (45%) [3] |

---

## References
[1]: report_01_total_leads
[2]: report_02_suppression_count
[3]: report_03_suppression_reasons
```

### 6. Source References

Include source references when analyzing SQL logic:
```markdown
The logic is defined in `file.sql` (lines 100-120)
```

## Narrative Structure

Reports should have a **narrative arc**, not just dump data. Guide the reader through your investigation.

### Good Narrative Structure

1. **Setup** - What question are we investigating?
2. **Initial finding** - What did we discover first?
3. **Complications** - What surprised us or raised more questions?
4. **Resolution** - What's the actual answer after deeper investigation?
5. **Implications** - What should we do about it?

### Example Narrative Arc

```markdown
## Executive Summary
Initially, we thought 2.7M "Qualified" leads were stuck [1]. After deeper investigation,
we found that 99.99% are actually converted [2] - the system is working correctly.

## 1. Initial Analysis
We found 2.7M leads with "Qualified" status that appear trapped [1]...

## 2. The "Trap" Hypothesis
These leads average 677 days old [3] with no path back to the pool...

## 3. Critical Discovery: IS_CONVERTED Check
Wait - let's check if these are actually converted...
**Result:** 99.99% are converted [2]! They became Contacts.

## 4. Conclusion
The "Qualified trap" is actually a success story. Only 272 leads are truly stuck [4].

---

## References
[1]: report_01_qualified_count
[2]: report_02_conversion_check
[3]: report_03_age_analysis
[4]: report_04_truly_stuck
```

### Avoid "Data Dump" Reports

- Don't just list tables of numbers without interpretation
- Don't skip surprising findings - dig deeper
- Don't present raw data without context or recommendations

## Investigation Depth Checklist

For thorough investigations, answer these questions:

| Question | Query Type |
|----------|------------|
| **What** exists? | Status breakdown, count by category |
| **Where** does the data come from? | Source table identification |
| **When** does it change? | Temporal analysis (30/90 day windows) |
| **Who** is making changes? | Attribution query (user, automation) |
| **Why** is it happening? | Root cause analysis, transitions |
| **How often** does it happen? | Frequency, trends over time |
| **Is it working as expected?** | Validation queries (e.g., IS_CONVERTED check) |

Don't stop at surface-level analysis. If something looks wrong or surprising, dig deeper before concluding.

## Standard Query Types for Investigations

| # | Query Type | Purpose | Example Name |
|---|------------|---------|--------------|
| 1 | **Status breakdown** | What values exist? What's the distribution? | `report_01_status_breakdown` |
| 2 | **Temporal analysis** | Is data stale? How old are records? | `report_02_data_freshness` |
| 3 | **Transitions TO** | How do records reach this status? | `report_03_transitions_to_status` |
| 4 | **Transitions FROM** | Where do records go after this status? | `report_04_transitions_from_status` |
| 5 | **Attribution** | Who/what is making changes? Manual vs automated? | `report_05_who_changes_status` |
| 6 | **Cycling analysis** | Do records ever cycle back? How often? | `report_06_cycling_patterns` |
| 7 | **Validation** | Verify assumptions (e.g., IS_CONVERTED check) | `report_07_validation_check` |

**Key insight:** Don't skip the history table queries (3, 4, 5). These reveal HOW things change, which is often more important than just WHAT exists.
