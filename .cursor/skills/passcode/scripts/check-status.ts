#!/usr/bin/env npx tsx
/**
 * Check passcode status for the current user
 * Quick way to see if user has passcodes and their status
 */

import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

function getGitEmail(): string | null {
  try {
    return execSync('git config user.email', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

async function main() {
  const email = getGitEmail();
  
  console.log('📊 Passcode Status Check\n');
  
  if (!email) {
    console.log('❌ Git email not configured');
    console.log('   Run: git config user.email "you@rippling.com"');
    process.exit(1);
  }
  
  if (!email.endsWith('@rippling.com')) {
    console.log(`❌ Git email is not @rippling.com: ${email}`);
    process.exit(1);
  }
  
  console.log(`📧 User: ${email}`);
  console.log('');
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      passcodes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  
  if (!user) {
    console.log('👤 User not in database yet');
    console.log('');
    console.log('Generate your first passcode:');
    console.log('   npm run passcode generate');
    return;
  }
  
  console.log(`👤 User ID: ${user.id}`);
  console.log(`📅 Created: ${user.createdAt.toISOString().split('T')[0]}`);
  console.log('');
  
  if (user.passcodes.length === 0) {
    console.log('🔑 Passcodes: None');
    console.log('');
    console.log('Generate your first passcode:');
    console.log('   npm run passcode generate');
    return;
  }
  
  console.log(`🔑 Passcodes: ${user.passcodes.length}`);
  console.log('');
  console.log('   Hint    Created       Last Used');
  console.log('   ─────────────────────────────────');
  
  for (const p of user.passcodes) {
    const created = p.createdAt.toISOString().split('T')[0];
    const lastUsed = p.lastUsedAt 
      ? p.lastUsedAt.toISOString().split('T')[0] 
      : 'Never';
    console.log(`   ${p.codeHint}    ${created}    ${lastUsed}`);
  }
  
  console.log('');
  console.log('Commands:');
  console.log('   npm run passcode list      - Full list with IDs');
  console.log('   npm run passcode generate  - Create new passcode');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
