---
name: report
description: Create or edit markdown reports saved to the database. Use when the user says "/report", wants to create documentation, write findings, or add a report to a project.
---

# /report - Create or Edit Report

Create or edit markdown reports saved to the database.

## Trigger

User says "report", "/report", "create report", "add report", or "edit report".

## Session Continuity (CRITICAL)

**When you create or edit a report, you are in a "report session" for that report.** Follow-up questions from the user should continue editing the SAME report until the user explicitly:
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

When a follow-up comes in, always fetch the current report content first, then update it.

## Workflow

### 0. Check for Active Report Session (ALWAYS DO THIS FIRST)

Before asking the user anything, check if you're already in a report session:

1. **Review the conversation** - Have you already created/edited a report in this session?
2. **If YES** - Continue editing that report. Do NOT ask for project/report name again.
3. **If NO** - Proceed to step 1 to identify the project and report.

```
Is this a follow-up question about an active report?
├── YES → Fetch current report, add new findings, save
└── NO → Ask user for project and report name (step 1)
```

### 1. Identify Project and Report

**Only ask these if NOT continuing an existing session:**

#### Clarifying the Project (IMPORTANT)

Before proceeding, you MUST know which project to use. **If the project is unclear, ask the user to clarify.** A project is unclear when:

- The user didn't specify a project name
- Multiple projects exist and the user said something generic like "create a report"
- The conversation context doesn't make it obvious which project they mean

**How to clarify:**

1. Query the database for the user's projects:
   ```typescript
   const projects = await prisma.project.findMany({
     where: { ownerId: userId },
     select: { slug: true, name: true },
     orderBy: { updatedAt: 'desc' },
     take: 10
   });
   ```

2. Present options to the user:
   ```
   Which project should this report belong to?
   
   Your recent projects:
   - project-alpha
   - sales-analysis  
   - q4-review
   
   Or specify a different project name.
   ```

3. Wait for the user's response before proceeding.

**When you DON'T need to ask:**
- User explicitly named the project (e.g., "create a report in project-alpha")
- You just created/queried a project in this conversation
- Only one project exists for the user

Ask user for:
- **Project**: Which project should this report belong to? (clarify if unclear)
- **Report name**: What should this report be called? (e.g., "findings", "summary")

### 2. Check Schema Documentation First!

**BEFORE writing any queries**, read the relevant schema docs:

```
context/global/schemas/
├── SFDC_TABLES.md           # Lead, Contact, Account, Opportunity, User
├── SFDC_HISTORY_TABLES.md   # Lead_History, Contact_History (status transitions!)
├── SNOWFLAKE_TABLES.md      # Growth tables, MO tables
└── OUTREACH_TABLES.md       # Outreach integration
```

This prevents bugs like:
- Using `OLD_VALUE__C` instead of `OLD_VALUE` in history tables
- Wrong table names or column references
- Missing required filters

### 3. Gather Data (Save All Queries!)

**IMPORTANT:** When you need to run queries to gather data for the report, you MUST save each query and link it to the report.

**Query iteratively** - let each result inform the next:

1. **Start with an exploratory query** to understand the data
2. **Analyze results** - what patterns emerge? What follow-up questions arise?
3. **Run targeted queries** based on what you learned
4. **Repeat** until you have the full picture

This approach leads to better insights than planning all queries upfront.

```bash
# Run a query and link to this report
npm run query -- --project [slug] --name report_initial_analysis --sql query.sql --report [report-name]

# Review results, then run follow-up based on what you learned
npm run query -- --project [slug] --name report_deep_dive --sql followup.sql --report [report-name]
```

**Note:** Always use the `--report [report-name]` flag to link queries to the report. This:
- Creates the query-report relationship in the database
- Shows the query in the "Queries Used" section on the report page
- Enables reproducibility and audit trail

This ensures:
- Better insights - each query builds on previous learnings
- Reproducibility - queries can be re-run to refresh data
- Transparency - audit trail shows where numbers came from
- Reuse - queries can also power dashboards later

**Note:** If you have multiple truly independent questions that don't depend on each other, batch mode is available:
```bash
npm run query -- --project [slug] --batch queries.json --report [report-name]
```

### Query Naming Convention

Use descriptive names with `report_` prefix:
- `report_status_breakdown` - Status distribution
- `report_lifecycle_analysis` - Record aging patterns
- `report_transition_history` - Status change tracking
- `report_user_activity` - Who made changes

For numbered sequences, use two-digit prefixes:
- `report_01_status_breakdown`
- `report_02_lifecycle_analysis`
- `report_03_transition_history`

### Standard Queries for Investigations

For status/suppression investigations, run these query types:

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

### 4. Get or Edit Content

**For new report:**
- Ask user what the report should contain
- Run and save any queries needed to answer questions
- Generate markdown content referencing the saved queries
- Include relevant data from project's queries

**For existing report:**
- Fetch current content from database
- Ask user what changes to make
- Run and save any new queries needed
- Edit the markdown accordingly

**For follow-up questions (most common!):**
- Fetch current report content from database
- Run new queries to answer the follow-up question
- Add a NEW SECTION to the existing report with findings
- Update the executive summary if there are key new insights
- Update the appendix with any new queries
- Save immediately after adding the section

**Example follow-up flow:**
```
User: "What about the conversion rates?"

1. Fetch current report: prisma.report.findUnique(...)
2. Run new query: report_05_conversion_rates
3. Add new section: "## 5. Conversion Rate Analysis"
4. Update appendix with new query
5. Save updated report
6. Show user what was added
```

### 5. Save Report to Database

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

// Get project
const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
});

// Create or update report
await prisma.report.upsert({
  where: {
    projectId_name: {
      projectId: project.id,
      name: reportName,
    },
  },
  create: {
    projectId: project.id,
    name: reportName,
    content: markdownContent,
  },
  update: {
    content: markdownContent,
  },
});

await prisma.$disconnect();
```

### 6. Output Confirmation

**For new reports:**
```
✅ Report created!

Project: [project-name]
Report: [report-name]
Queries saved: [list of query names created for this report]

Preview:
[first 500 chars of markdown]

View at: /projects/[slug]/reports/[name]
```

**For follow-up additions (use this format to show continuity):**
```
✅ Report updated!

Added: "## [N]. [New Section Title]"
New queries: [list of new query names]

The report now has [X] sections. Ask more questions to continue exploring, or say "done" when finished.
```

## Report Structure

Reports should follow this comprehensive structure for maximum readability:

```markdown
# [Report Title]

**Investigation Date:** YYYY-MM-DD  
**Analyst:** [Name] (via Cursor Agent)

---

## Executive Summary

Provide a quick overview with a key findings table:

| Finding | Impact |
|---------|--------|
| **Key finding 1** | X records affected |
| **Key finding 2** | Y% of total |
| **Data is NOT stale** | Last updated today |

---

## 1. [First Major Section]

Use **numbered sections** for easy navigation. Include tables with clear headers:

| Category | Count | % | Notes |
|----------|------:|--:|-------|
| Category A | 1,234 | 45% | Explanation |
| Category B | 567 | 21% | Explanation |

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

## Appendix: Queries

List all queries used in this report for reproducibility:

| Query Name | Purpose |
|------------|---------|
| `report_status_breakdown` | Status distribution by type |
| `report_lifecycle_analysis` | Record aging patterns |
| `report_transition_data` | Status change tracking |

---

*Report generated on [date] from [project-name] project*
```

### Formatting Best Practices

1. **Use visual indicators** for eligibility/status:
   - ✅ for eligible/passing/good
   - ❌ for ineligible/failing/issues
   - Example: `| New | 5.4M | ✅ ELIGIBLE |`

2. **Right-align numbers** in tables for readability:
   - Use `|------:|` in table separator for right alignment

3. **Bold key findings** to make them scannable

4. **Use horizontal rules** (`---`) between major sections

5. **Reference queries inline** when citing data:
   - "Based on `report_status_breakdown`, we found..."

6. **Include source references** when analyzing SQL logic:
   - "The logic is defined in `file.sql` (lines 100-120)"

### Narrative Structure (Tell a Story!)

Reports should have a **narrative arc**, not just dump data. Guide the reader through your investigation:

**Good narrative structure:**
1. **Setup** - What question are we investigating?
2. **Initial finding** - What did we discover first?
3. **Complications** - What surprised us or raised more questions?
4. **Resolution** - What's the actual answer after deeper investigation?
5. **Implications** - What should we do about it?

**Example narrative arc:**

```markdown
## Executive Summary
Initially, we thought 2.7M "Qualified" leads were stuck. After deeper investigation,
we found that 99.99% are actually converted - the system is working correctly.

## 1. Initial Analysis
We found 2.7M leads with "Qualified" status that appear trapped...

## 2. The "Trap" Hypothesis
These leads average 677 days old with no path back to the pool...

## 3. Critical Discovery: IS_CONVERTED Check
Wait - let's check if these are actually converted...
**Result:** 99.99% are converted! They became Contacts.

## 4. Conclusion
The "Qualified trap" is actually a success story. Only 272 leads are truly stuck.
```

**Avoid "data dump" reports:**
- Don't just list tables of numbers without interpretation
- Don't skip surprising findings - dig deeper
- Don't present raw data without context or recommendations

### Investigation Depth Checklist

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

## Integration with Queries

**Always reference saved queries in your report.** This creates a clear audit trail and enables reproducibility.

### Inline References

When citing data, reference the query name:

```markdown
## Data Summary

Based on `report_weekly_s1_count`:
- Total S1 leads this week: 1,234
- Week over week change: +12%

Based on `report_conversion_rate`:
- S1 to S2 conversion: 45%
- S2 to Closed Won: 23%
```

### Appendix Section (Required)

Every report MUST include an Appendix listing all queries:

```markdown
## Appendix: Queries

| Query Name | Purpose |
|------------|---------|
| `report_weekly_s1_count` | Weekly S1 lead counts |
| `report_conversion_rate` | Funnel conversion rates |
| `report_pipeline_metrics` | Pipeline health metrics |

---
*Report generated on [date]*
```

This ensures:
- **Reproducibility** - Anyone can re-run the queries
- **Audit trail** - Clear source for every number
- **Maintainability** - Easy to update stale data

### Fetching Query Results for Reports

To include data from saved queries in your report:

```typescript
// Get project with its queries and results
const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
  include: {
    queries: {
      include: { result: true }
    }
  }
});

// Access query results
for (const query of project.queries) {
  console.log(`Query: ${query.name}`);
  console.log(`Results: ${JSON.stringify(query.result?.data)}`);
}
```

## Example Script

```bash
npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function main() {
  const project = await prisma.project.findUnique({
    where: { slug: 'my-analysis' },
  });
  
  await prisma.report.upsert({
    where: {
      projectId_name: {
        projectId: project.id,
        name: 'findings',
      },
    },
    create: {
      projectId: project.id,
      name: 'findings',
      content: '# Findings Report\\n\\nContent here...',
    },
    update: {
      content: '# Updated Findings\\n\\nNew content...',
    },
  });
  
  console.log('Report saved!');
  await prisma.\$disconnect();
}

main();
"
```

## Iterative Report Building

Reports often grow through conversation as the user asks follow-up questions and makes new discoveries. This section provides guidance for building reports incrementally.

### Core Principle

**Build incrementally.** When the user asks follow-ups or discovers new things, decide whether to:
- **Expand** - Add new sections for new topics or deeper dives
- **Replace** - Rewrite sections when findings change or the user wants a different angle
- **Refine** - Update existing content with better data or clearer explanations

Use judgment based on context. If the user says "actually, focus on X instead" → replace. If they say "what about Y too?" → expand.

### Workflow for Iterative Building

#### 1. Start with Initial Findings

When you first create a report, structure it to accommodate growth:

```markdown
# [Investigation Topic]

**Status:** 🔄 In Progress  
**Last Updated:** YYYY-MM-DD HH:MM

---

## Executive Summary
[Initial findings - will be updated as investigation progresses]

---

## 1. Initial Analysis
[First findings go here]

---

## Open Questions
- [ ] Question raised during analysis
- [ ] Another area to explore

---

## Appendix: Queries
| Query Name | Purpose |
|------------|---------|
| `report_01_initial` | First analysis |
```

#### 2. On Each Follow-up Question

When the user asks a follow-up or wants to explore something new:

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

#### 3. Section Numbering

Use sequential numbering so new sections fit naturally:

```markdown
## 1. Initial Status Analysis
[Original findings]

## 2. Deep Dive: Suppression Rates  ← Added after follow-up
[New findings from user's question about suppression]

## 3. Owner Attribution Analysis  ← Added after another follow-up
[New findings from user's question about who owns records]
```

#### 4. Track Investigation Progress

Keep an "Investigation Log" section for longer sessions:

```markdown
## Investigation Log

| Time | Question | Finding | Section |
|------|----------|---------|---------|
| 10:30 | Initial request | Found 5.4M records in scope | §1 |
| 10:45 | "Why so many suppressed?" | 60% due to Rule X | §2 |
| 11:00 | "Who owns these?" | 3 users own 80% | §3 |
```

#### 5. Update Status Markers

Use status indicators that reflect progress:

- `🔄 In Progress` - Active investigation
- `⏸️ Paused` - Waiting for user input
- `✅ Complete` - Investigation finished
- `📝 Draft` - Findings need review

### Incremental Save Pattern

**Save after every significant addition.** This ensures:
- No work is lost if the session ends
- User can see progress in the web UI
- Other team members can follow along

```typescript
async function addToReport(projectSlug: string, reportName: string, newSection: string) {
  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  
  const existing = await prisma.report.findUnique({
    where: { projectId_name: { projectId: project.id, name: reportName } }
  });
  
  // Insert new section before "Open Questions" or "Appendix"
  const insertPoint = existing.content.indexOf('## Open Questions') 
    || existing.content.indexOf('## Appendix');
  
  const updated = insertPoint > 0
    ? existing.content.slice(0, insertPoint) + newSection + '\n\n---\n\n' + existing.content.slice(insertPoint)
    : existing.content + '\n\n---\n\n' + newSection;
  
  // Update timestamp
  const withTimestamp = updated.replace(
    /\*\*Last Updated:\*\* .+/,
    `**Last Updated:** ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
  );
  
  await prisma.report.update({
    where: { id: existing.id },
    data: { content: withTimestamp }
  });
}
```

### Conversation Cues

Watch for these signals to expand the report:

| User Says | Action |
|-----------|--------|
| "Why is that?" | Add a deep-dive section explaining the finding |
| "What about X?" | Add a new section investigating X |
| "Can you break that down?" | Add subsections with more detail |
| "Who/what/when?" | Run attribution query, add findings |
| "Is that normal?" | Add comparison/benchmark section |
| "What should we do?" | Add recommendations section |

### Example: Iterative Session

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

### Finalizing Reports

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

## Result Validation

**CRITICAL:** Always validate query results before including them in reports.

### Detecting Problematic 0-Row Results

After running queries for a report, check for unexpected empty results:

```typescript
// After running batch queries, validate results
for (const query of project.queries) {
  if (query.result?.rowCount === 0) {
    console.warn(`⚠️ Query "${query.name}" returned 0 rows - investigate!`);
  }
}
```

### When 0 Rows Indicates a Bug

| Query Type | Expected Rows | If 0 Rows |
|------------|---------------|-----------|
| Status breakdown | > 0 (statuses exist) | Check table name, filters |
| History transitions | > 0 (changes happen) | Check column names (`OLD_VALUE` not `OLD_VALUE__C`) |
| User attribution | > 0 (users exist) | Check JOIN conditions |
| Time-based analysis | > 0 (data exists for period) | Check date functions/format |

### Investigation Workflow

If a query returns 0 rows unexpectedly:

1. **Check schema documentation** - Read `context/global/schemas/SFDC_HISTORY_TABLES.md`
2. **Verify column names** - History tables use `OLD_VALUE`/`NEW_VALUE`, not `__C` variants
3. **Test incrementally** - Remove filters and verify base table has data
4. **Fix and re-run** - Correct the SQL and re-execute

### Including Validation in Reports

When a query returns 0 rows, **do not silently skip it**. Either:

1. **Fix the query** and include the correct data
2. **Document the gap** in the report:

```markdown
### Data Gap

The query `report_transition_history` returned 0 rows. This could indicate:
- No transitions occurred in the time period
- A data quality issue
- Incorrect query logic

Further investigation recommended.
```

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Run /create-project first |
| Database connection fails | Check DATABASE_URL in .env |
| User not owner/editor | Need permission to edit project |
| **Query returns 0 rows unexpectedly** | **Investigate before proceeding - check schema docs and column names** |
| **tsx/sandbox error** | **Agent must request `all` permissions when running queries or tsx scripts** |
| **"Can't run in this environment"** | **Missing permissions - user must approve the permission dialog** |

## Cursor Agent Permissions

When reports require running queries via `npm run query`, the agent MUST request `all` permissions.

The report workflow often involves:
1. Running multiple queries to gather data (requires network + tsx)
2. Saving results to database (requires network)
3. Creating/updating the report (requires network)

**If queries fail with sandbox errors:**
- The agent should retry with `required_permissions: ["all"]`
- User must approve the permission dialog that appears

**First-time users:** The first Snowflake query opens a browser window for Okta SSO. After authentication, the token is cached locally.
