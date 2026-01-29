# /create-project - Create New Project

Create a new analysis project in the database.

## Trigger

User says "create project", "/create-project [name]", or "new project".

## Workflow

1. **Get Project Name**
   - If user provided name, use it
   - Otherwise, ask for project name
   - Convert to slug format (lowercase, hyphens): "My Analysis" → "my-analysis"

2. **Get User Identity**
   - Get git email: `git config user.email`
   - Validate it's `@rippling.com`
   - This will be the project owner

3. **Check for Existing Project**
   - Query database for existing project with same slug
   - If exists, warn and ask for different name

4. **Create Project in Database**
   
   Use Prisma to create the project:
   ```typescript
   import 'dotenv/config';
   import { PrismaClient } from '@prisma/client';
   
   const prisma = new PrismaClient({
     accelerateUrl: process.env.PRISMA_DATABASE_URL,
   });
   
   // Get or create user
   const user = await prisma.user.upsert({
     where: { email: gitEmail },
     create: { email: gitEmail },
     update: {},
   });
   
   // Create project
   const project = await prisma.project.create({
     data: {
       slug: projectSlug,
       name: projectName,
       description: '', // User can update later
       ownerId: user.id,
     },
   });
   
   // Create default empty dashboard
   await prisma.dashboard.create({
     data: {
       projectId: project.id,
       name: 'main',
       config: {
         title: projectName,
         widgets: [],
       },
     },
   });
   
   await prisma.$disconnect();
   ```

5. **Output Confirmation**
   ```
   ✅ Project created!
   
   Project: [Project Name]
   Slug: [project-slug]
   Owner: [your-email]
   
   Next steps:
   1. Run /query to execute SQL and save results
   2. Queries will automatically be added to the dashboard
   3. Run /report to add written documentation
   
   View at: /projects/[slug]
   ```

## No Local Files

**Important:** Projects are stored entirely in the database. No local files are created.

- No `projects/[slug]/` folder
- No `projects.json`
- No data JSON files

All data lives in Vercel Postgres.

## Example Script

Run this to create a project:

```bash
npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
const slug = 'my-analysis';
const name = 'My Analysis';

async function main() {
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  
  const project = await prisma.project.create({
    data: {
      slug,
      name,
      ownerId: user.id,
    },
  });
  
  await prisma.dashboard.create({
    data: {
      projectId: project.id,
      name: 'main',
      config: { title: name, widgets: [] },
    },
  });
  
  console.log('Created:', project.slug);
  await prisma.\$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
"
```

## URL Routes

After creating a project, it will be accessible at:
- Project overview: `/projects/[slug]`
- Dashboard: `/projects/[slug]/dashboards/main`

## Error Handling

| Error | Solution |
|-------|----------|
| Project name empty | Prompt user for name |
| Project slug exists | Suggest different name |
| Git email not @rippling.com | Run `git config user.email "you@rippling.com"` |
| Database connection fails | Check DATABASE_URL in .env |
| User not in database | Run /setup first |
