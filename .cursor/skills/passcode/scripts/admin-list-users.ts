#!/usr/bin/env npx tsx
/**
 * Admin script: List all users with passcode counts
 * Restricted to willhunter@rippling.com
 */

import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

const ADMIN_EMAIL = 'willhunter@rippling.com';

function getGitEmail(): string | null {
  try {
    return execSync('git config user.email', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

async function main() {
  const email = getGitEmail();
  
  if (email !== ADMIN_EMAIL) {
    console.error('❌ This script is restricted to willhunter@rippling.com');
    process.exit(1);
  }
  
  console.log('👑 Admin: Passcode Overview\n');
  
  const users = await prisma.user.findMany({
    include: {
      _count: { select: { passcodes: true } },
      passcodes: {
        select: {
          lastUsedAt: true,
        },
        orderBy: { lastUsedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { email: 'asc' },
  });
  
  const usersWithPasscodes = users.filter(u => u._count.passcodes > 0);
  const usersWithoutPasscodes = users.filter(u => u._count.passcodes === 0);
  
  console.log(`📊 Total users: ${users.length}`);
  console.log(`🔑 Users with passcodes: ${usersWithPasscodes.length}`);
  console.log(`⚪ Users without passcodes: ${usersWithoutPasscodes.length}`);
  console.log('');
  
  if (usersWithPasscodes.length > 0) {
    console.log('Users with passcodes:');
    console.log('');
    console.log('   Email                                    Count   Last Active');
    console.log('   ────────────────────────────────────────────────────────────');
    
    for (const u of usersWithPasscodes) {
      const lastActive = u.passcodes[0]?.lastUsedAt
        ? u.passcodes[0].lastUsedAt.toISOString().split('T')[0]
        : 'Never';
      console.log(`   ${u.email.padEnd(40)} ${String(u._count.passcodes).padEnd(7)} ${lastActive}`);
    }
  }
  
  console.log('');
  console.log('Commands:');
  console.log('   npm run passcode admin:list <email>  - View user\'s passcodes');
  console.log('   npm run passcode admin:delete <id>   - Delete a passcode');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
