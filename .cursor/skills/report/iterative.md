# Iterative Report Building

This document covers patterns for building reports incrementally through conversation, including session continuity and follow-up handling.

## Session Continuity

**When you create or edit a report, you are in a "report session."** Follow-up questions should continue editing the SAME report until the user explicitly:
- Asks to create a different report
- Switches to a different project
- Says they're done with the report

### Recognizing Follow-up Questions

These should ALL trigger continued editing of the current report:

| User Says | Action |
|-----------|--------|
| "What about X?" | Add section about X to current report |
| "Can you also look at Y?" | Add section about Y to current report |
| "Why is that?" | Add explanatory section to current report |
| "Break that down more" | Expand existing section in current report |
| "What do you recommend?" | Add recommendations section to current report |
| "Who owns these?" | Run query, add findings to current report |
| "Is that normal?" | Add comparison/context section to current report |
| "How does that compare to Z?" | Add comparison section to current report |
| "Dig deeper into that" | Expand analysis in current report |

### What NOT to Do

**DO NOT:**
- Create a new report for each follow-up question
- Ask "which report?" when there's an obvious active report
- Lose track of the report context between turns
- Require the user to say "/report" again to continue editing

**DO:**
- Remember which project/report you're working on
- Fetch the current report content and append/update it
- Save incrementally after each significant addition
- Keep the report structure cohesive as it grows

### Maintaining Context

Track these across the conversation:
- **Project slug**: The project the report belongs to
- **Report name**: The report being edited
- **Last query number**: For sequential numbering (e.g., `report_04_...`)
- **Report status**: In Progress, Complete, etc.

## Incremental Building Workflow

### 1. Start with Initial Findings

Structure reports to accommodate growth:

```markdown
# [Investigation Topic]

**Status:** 🔄 In Progress  
**Last Updated:** YYYY-MM-DD HH:MM

---

## Executive Summary
[Initial findings - will be updated as investigation progresses]

---

## 1. Initial Analysis
Total records in scope: X [1]

---

## Open Questions
- [ ] Question raised during analysis
- [ ] Another area to explore

---

## References
[1]: report_01_initial
```

### 2. On Each Follow-up

1. **Fetch current report** from database
2. **Run new queries** to answer the question (save with `report_` prefix)
3. **Add a new section** to the report with findings
4. **Update the summary** if there are significant new insights
5. **Move answered items** from "Open Questions" to completed sections
6. **Save incrementally** after each addition

```typescript
// Fetch existing report
const existingReport = await prisma.report.findUnique({
  where: {
    projectId_name: { projectId: project.id, name: reportName }
  }
});

// Parse, add new section, update
const updatedContent = addNewSection(existingReport.content, newFindings);

// Save immediately
await prisma.report.update({
  where: { id: existingReport.id },
  data: { content: updatedContent }
});
```

### 3. Section Numbering

Use sequential numbering so new sections fit naturally:

```markdown
## 1. Initial Status Analysis
[Original findings]

## 2. Deep Dive: Suppression Rates  ← Added after follow-up
[New findings from user's question about suppression]

## 3. Owner Attribution Analysis  ← Added after another follow-up
[New findings from user's question about who owns records]
```

### 4. Investigation Log (Optional)

For longer sessions, track progress:

```markdown
## Investigation Log

| Time | Question | Finding | Section |
|------|----------|---------|---------|
| 10:30 | Initial request | Found 5.4M records in scope | §1 |
| 10:45 | "Why so many suppressed?" | 60% due to Rule X | §2 |
| 11:00 | "Who owns these?" | 3 users own 80% | §3 |
```

### 5. Status Markers

Use status indicators that reflect progress:

- `🔄 In Progress` - Active investigation
- `⏸️ Paused` - Waiting for user input
- `✅ Complete` - Investigation finished
- `📝 Draft` - Findings need review

## Example Session Flow

**Turn 1:** User asks for suppression analysis
- Create report with initial findings
- Save with status "In Progress"

**Turn 2:** User asks "Why are so many in category X?"
- Run new query `report_02_category_x_breakdown`
- Add "## 2. Category X Deep Dive" section
- Save updated report

**Turn 3:** User asks "Who owns these records?"
- Run new query `report_03_owner_attribution`
- Add "## 3. Owner Attribution" section
- Save updated report

**Turn 4:** User says "OK, what do you recommend?"
- Add "## 4. Recommendations" section
- Update status to "Complete"
- Final save

## Finalizing Reports

When the investigation is complete:

1. **Update status** to "✅ Complete"
2. **Review executive summary** - ensure it captures all key findings
3. **Clean up Open Questions** - mark resolved or move to future work
4. **Verify appendix** - all queries should be listed
5. **Add conclusion** if appropriate

```markdown
---

## Conclusion

This investigation revealed [key finding]. The recommended next steps are:
1. [Action item]
2. [Action item]

---

*Investigation completed on [date]. Total queries: [N]. Report sections: [N].*
```
