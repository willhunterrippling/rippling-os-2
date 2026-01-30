# Create Project Reference

Detailed Prisma patterns, error handling, and technical reference for project creation.

## Database Architecture

**Projects are stored entirely in the database.** No local files are created.

- No `projects/[slug]/` folder
- No `projects.json`
- No data JSON files

All data lives in Vercel Postgres via Prisma.

## Prisma Patterns

### Initialize Prisma Client

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});
```

### Get or Create User

```typescript
const user = await prisma.user.upsert({
  where: { email: gitEmail },
  create: { email: gitEmail },
  update: {},
});
```

### Create Project

```typescript
const project = await prisma.project.create({
  data: {
    slug: projectSlug,
    name: projectName,
    description: '', // User can update later
    ownerId: user.id,
  },
});
```

### Check for Existing Project

```typescript
const existing = await prisma.project.findUnique({
  where: { slug: projectSlug },
});

if (existing) {
  console.error(`Project "${projectSlug}" already exists`);
  process.exit(1);
}
```

### Always Disconnect

```typescript
await prisma.$disconnect();
```

## URL Routes

After creating a project, it will be accessible at:

| Resource | URL |
|----------|-----|
| Project overview | `/projects/[slug]` |
| Queries | `/projects/[slug]/queries/[name]` |
| Reports | `/projects/[slug]/reports/[name]` |
| Dashboards | `/projects/[slug]/dashboards/[name]` |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Project name empty | User didn't provide name | Prompt user for name |
| Project slug exists | Duplicate slug in database | Suggest different name |
| Git email not @rippling.com | Wrong git config | Run `git config user.email "you@rippling.com"` |
| Database connection fails | Missing or invalid env var | Check `PRISMA_DATABASE_URL` in `.env` |
| User not in database | First-time setup incomplete | Run `/setup` first |
| Prisma client error | Schema out of sync | Run `npx prisma generate` |

## Slug Format

Convert project names to slugs:

- Lowercase all characters
- Replace spaces with hyphens
- Remove special characters
- Examples:
  - "My Analysis" → `my-analysis`
  - "Q4 2024 Revenue" → `q4-2024-revenue`
  - "MO Lead Investigation" → `mo-lead-investigation`

```typescript
const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
```

## Complete Example

Full script combining all patterns:

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function createProject(name: string, slug: string) {
  // Get git email for owner
  const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
  
  if (!email.endsWith('@rippling.com')) {
    throw new Error(`Git email must be @rippling.com, got: ${email}`);
  }

  // Check for existing project
  const existing = await prisma.project.findUnique({
    where: { slug },
  });
  
  if (existing) {
    throw new Error(`Project "${slug}" already exists`);
  }

  // Get or create user
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      slug,
      name,
      description: '',
      ownerId: user.id,
    },
  });

  await prisma.$disconnect();
  return project;
}
```
