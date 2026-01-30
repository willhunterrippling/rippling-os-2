/**
 * create-user.ts - Create or verify user in database
 * 
 * Usage: npx tsx .cursor/skills/setup/scripts/create-user.ts
 * 
 * This script:
 * 1. Gets the git email from local config
 * 2. Validates it's a @rippling.com email
 * 3. Creates the user in the database if they don't exist (upsert)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function main() {
  // Get git email
  const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
  
  if (!email) {
    console.error('Error: Git email not configured');
    console.error('Run: git config user.email "you@rippling.com"');
    process.exit(1);
  }
  
  if (!email.endsWith('@rippling.com')) {
    console.error('Error: Git email must be @rippling.com');
    console.error(`Current email: ${email}`);
    console.error('Run: git config user.email "you@rippling.com"');
    process.exit(1);
  }
  
  // Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  
  console.log('User ready:', user.email);
  console.log('User ID:', user.id);
  
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
