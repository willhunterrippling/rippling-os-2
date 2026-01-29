---
name: report
description: Create or edit markdown reports saved to the database. Use when the user says "/report", wants to create documentation, write findings, or add a report to a project.
---

# /report - Create or Edit Report

Create or edit markdown reports saved to the database.

## Trigger

User says "report", "/report", "create report", "add report", or "edit report".

## Workflow

### 1. Identify Project and Report

Ask user for:
- **Project**: Which project should this report belong to?
- **Report name**: What should this report be called? (e.g., "findings", "summary")

### 2. Gather Data (Save All Queries!)

**IMPORTANT:** When you need to run queries to gather data for the report, you MUST save each query to the project.

**USE BATCH MODE** to avoid multiple browser authentication prompts:

1. **Prepare all queries** in a JSON file with `report_` prefix names
2. **Run batch mode** - single authentication for all queries
3. **Reference saved queries** in your report markdown

```bash
# Create a batch file with all report queries
cat > /tmp/report_queries.json << 'EOF'
[
  { "name": "report_weekly_s1_count", "sql": "SELECT ..." },
  { "name": "report_conversion_rate", "sql": "SELECT ..." },
  { "name": "report_pipeline_metrics", "sql": "SELECT ..." }
]
EOF

# Run all queries with single authentication
npm run query -- --project [slug] --batch /tmp/report_queries.json
```

This ensures:
- **Single auth** - only one browser tab opens for all queries
- Reproducibility - queries can be re-run to refresh data
- Transparency - audit trail shows where numbers came from
- Reuse - queries can power dashboards later

### 3. Get or Edit Content

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

### 4. Save Report to Database

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

### 5. Output Confirmation

```
✅ Report saved!

Project: [project-name]
Report: [report-name]
Queries saved: [list of query names created for this report]

Preview:
[first 500 chars of markdown]

View at: /projects/[slug]/reports/[name]
```

## Report Structure

Reports are markdown documents with standard formatting:

```markdown
# Report Title

## Summary
Brief overview of findings...

## Key Metrics
- Metric 1: value
- Metric 2: value

## Analysis
Detailed analysis...

## Recommendations
1. First recommendation
2. Second recommendation

---
*Generated on [date]*
```

## Integration with Queries

**Always reference saved queries in your report.** This creates a clear audit trail:

```markdown
## Data Summary

Based on the `report_weekly_s1_count` query:
- Total S1 leads this week: 1,234
- Week over week change: +12%

Based on the `report_conversion_rate` query:
- S1 to S2 conversion: 45%
- S2 to Closed Won: 23%
```

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

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Run /create-project first |
| Database connection fails | Check DATABASE_URL in .env |
| User not owner/editor | Need permission to edit project |
