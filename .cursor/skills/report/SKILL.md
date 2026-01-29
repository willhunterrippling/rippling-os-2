# /report - Create or Edit Report

Create or edit markdown reports saved to the database.

## Trigger

User says "report", "/report", "create report", "add report", or "edit report".

## Workflow

### 1. Identify Project and Report

Ask user for:
- **Project**: Which project should this report belong to?
- **Report name**: What should this report be called? (e.g., "findings", "summary")

### 2. Get or Edit Content

**For new report:**
- Ask user what the report should contain
- Generate markdown content based on user description
- Include relevant data from project's queries if applicable

**For existing report:**
- Fetch current content from database
- Ask user what changes to make
- Edit the markdown accordingly

### 3. Save to Database

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

### 4. Output Confirmation

```
✅ Report saved!

Project: [project-name]
Report: [report-name]

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

If the project has query results, you can include them:

```markdown
## Data Summary

Based on the `weekly_s1_count` query:
- Total S1 leads this week: [value]
- Week over week change: [value]%
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
