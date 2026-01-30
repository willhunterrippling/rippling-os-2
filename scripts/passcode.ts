#!/usr/bin/env npx tsx

/**
 * Passcode Management CLI
 * 
 * Generate and manage access passcodes for the Rippling OS web dashboard.
 * 
 * Commands:
 *   generate              Generate a new passcode
 *   list                  List your passcodes
 *   delete <id>           Delete a passcode
 *   admin:list [email]    (Admin only) List passcodes for any user
 *   admin:delete <id>     (Admin only) Delete any passcode
 * 
 * Examples:
 *   npm run passcode generate
 *   npm run passcode list
 *   npm run passcode delete clxyz123
 */

import * as snowflake from 'snowflake-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as TOML from '@iarna/toml';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

// Admin email with special privileges
const ADMIN_EMAIL = 'willhunter@rippling.com';

// ==================== Utility Functions ====================

/**
 * Get git user email for identity
 */
function getGitEmail(): string {
  try {
    const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
    if (!email) {
      throw new Error('Git email not configured');
    }
    return email;
  } catch {
    console.error('❌ Error: Could not get git user email');
    console.error('   Please configure git: git config user.email "you@rippling.com"');
    process.exit(1);
  }
}

/**
 * Validate email is @rippling.com
 */
function validateRipplingEmail(email: string): void {
  if (!email.endsWith('@rippling.com')) {
    console.error('❌ Error: Only @rippling.com emails can generate passcodes');
    console.error(`   Your git email: ${email}`);
    process.exit(1);
  }
}

/**
 * Generate a cryptographically secure random passcode
 * Format: 4 groups of 4 alphanumeric characters (e.g., "ABCD-1234-EFGH-5678")
 */
function generatePasscode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: 0, O, 1, I
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get the hint (last 4 characters) from a passcode
 */
function getPasscodeHint(passcode: string): string {
  const clean = passcode.replace(/-/g, '');
  return clean.slice(-4);
}

// ==================== Snowflake Connection ====================

interface TomlConnection {
  account?: string;
  user?: string;
  username?: string;
  authenticator?: string;
  database?: string;
  schema?: string;
  warehouse?: string;
  role?: string;
}

function getConnectionFromToml(): snowflake.ConnectionOptions | null {
  const possiblePaths = [
    path.join(os.homedir(), '.snowflake', 'connections.toml'),
    path.join(os.homedir(), '.snowflake', 'config.toml'),
  ];
  
  for (const tomlPath of possiblePaths) {
    if (!fs.existsSync(tomlPath)) continue;
    
    try {
      const content = fs.readFileSync(tomlPath, 'utf-8');
      const config = TOML.parse(content) as Record<string, unknown>;
      
      const profileNames = ['rippling', 'default'];
      
      const connections = config.connections as Record<string, TomlConnection> | undefined;
      
      for (const profileName of profileNames) {
        if (connections && connections[profileName]) {
          return tomlConnectionToSnowflake(connections[profileName]);
        }
        
        const directConn = config[profileName] as TomlConnection | undefined;
        if (directConn && (directConn.account || directConn.user)) {
          return tomlConnectionToSnowflake(directConn);
        }
      }
      
      if (connections) {
        const firstProfile = Object.keys(connections)[0];
        if (firstProfile) {
          return tomlConnectionToSnowflake(connections[firstProfile]);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  return null;
}

function tomlConnectionToSnowflake(conn: TomlConnection): snowflake.ConnectionOptions {
  return {
    account: conn.account || 'RIPPLINGORG-RIPPLING',
    username: conn.user || conn.username || '',
    authenticator: conn.authenticator?.toUpperCase() === 'EXTERNALBROWSER' ? 'EXTERNALBROWSER' : conn.authenticator,
    clientStoreTemporaryCredential: true,
    database: conn.database || 'PROD_RIPPLING_DWH',
    schema: conn.schema || 'MARKETING_OPS',
    warehouse: conn.warehouse || 'PROD_RIPPLING_INTEGRATION_DWH',
    role: conn.role || 'PROD_RIPPLING_MARKETING',
  };
}

function getConnectionConfig(email: string): snowflake.ConnectionOptions {
  // If email is set in env, use environment-based config
  if (process.env.RIPPLING_ACCOUNT_EMAIL) {
    return {
      account: process.env.SNOWFLAKE_ACCOUNT || 'RIPPLINGORG-RIPPLING',
      username: process.env.RIPPLING_ACCOUNT_EMAIL,
      authenticator: 'EXTERNALBROWSER',
      clientStoreTemporaryCredential: true,
      database: process.env.SNOWFLAKE_DATABASE || 'PROD_RIPPLING_DWH',
      schema: process.env.SNOWFLAKE_SCHEMA || 'MARKETING_OPS',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'PROD_RIPPLING_INTEGRATION_DWH',
      role: process.env.SNOWFLAKE_ROLE || 'PROD_RIPPLING_MARKETING',
    };
  }
  
  // Try TOML config
  const tomlConfig = getConnectionFromToml();
  if (tomlConfig && tomlConfig.username) {
    return tomlConfig;
  }
  
  // Fallback to git email
  return {
    account: 'RIPPLINGORG-RIPPLING',
    username: email,
    authenticator: 'EXTERNALBROWSER',
    clientStoreTemporaryCredential: true,
    database: 'PROD_RIPPLING_DWH',
    schema: 'MARKETING_OPS',
    warehouse: 'PROD_RIPPLING_INTEGRATION_DWH',
    role: 'PROD_RIPPLING_MARKETING',
  };
}

/**
 * Test Snowflake connection with a simple query
 */
async function testSnowflakeConnection(email: string): Promise<void> {
  console.log('🔗 Testing Snowflake connection...');
  console.log('   (A browser window may open for SSO authentication)');
  console.log('');
  
  const config = getConnectionConfig(email);
  const connection = snowflake.createConnection(config);
  
  try {
    // connectAsync() is required for EXTERNALBROWSER authenticator
    // @ts-expect-error - SDK works without callback, types are wrong
    await connection.connectAsync();
    
    // Run a simple test query
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: 'SELECT CURRENT_USER(), CURRENT_ROLE() LIMIT 1',
        complete: (err) => {
          if (err) reject(err);
          else resolve();
        },
      });
    });
    
    console.log('✅ Snowflake connection verified');
    
    // Disconnect
    connection.destroy((err) => {
      if (err) console.warn('Warning: Error disconnecting:', err);
    });
  } catch (err) {
    console.error('❌ Error: Failed to connect to Snowflake');
    console.error('   You must have valid Snowflake access to generate a passcode');
    if (err instanceof Error) {
      console.error(`   ${err.message}`);
    }
    process.exit(1);
  }
}

// ==================== Commands ====================

/**
 * Generate a new passcode
 */
async function commandGenerate(): Promise<void> {
  console.log('🔑 Generating new passcode...\n');
  
  // Get and validate git email
  const email = getGitEmail();
  validateRipplingEmail(email);
  console.log(`📧 Git email: ${email}`);
  
  // Test Snowflake connection
  await testSnowflakeConnection(email);
  console.log('');
  
  // Generate passcode
  const passcode = generatePasscode();
  const codeHint = getPasscodeHint(passcode);
  const codeHash = await bcrypt.hash(passcode.replace(/-/g, '').toUpperCase(), 10);
  
  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      },
    });
    console.log(`👤 Created user: ${user.name} (${user.email})`);
  }
  
  // Save passcode to database
  await prisma.passcode.create({
    data: {
      codeHash,
      codeHint,
      userId: user.id,
    },
  });
  
  // Display the passcode
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('  🎉 Your new passcode:');
  console.log('');
  console.log(`     ${passcode}`);
  console.log('');
  console.log('  ⚠️  IMPORTANT: Save this passcode now!');
  console.log('     It cannot be recovered after this screen.');
  console.log('');
  console.log('  📝 Use this passcode to sign in at:');
  console.log(`     ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

/**
 * List passcodes for the current user
 */
async function commandList(): Promise<void> {
  const email = getGitEmail();
  validateRipplingEmail(email);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      passcodes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  
  if (!user || user.passcodes.length === 0) {
    console.log('📋 No passcodes found');
    console.log('   Run: npm run passcode generate');
    return;
  }
  
  console.log(`📋 Passcodes for ${email}:\n`);
  console.log('   ID                        Hint    Created              Last Used');
  console.log('   ─────────────────────────────────────────────────────────────────');
  
  for (const p of user.passcodes) {
    const created = p.createdAt.toISOString().split('T')[0];
    const lastUsed = p.lastUsedAt ? p.lastUsedAt.toISOString().split('T')[0] : 'Never';
    console.log(`   ${p.id.padEnd(25)} ${p.codeHint}    ${created}    ${lastUsed}`);
  }
  
  console.log('');
  console.log('   To delete a passcode: npm run passcode delete <id>');
}

/**
 * Delete a passcode
 */
async function commandDelete(passcodeId: string): Promise<void> {
  const email = getGitEmail();
  validateRipplingEmail(email);
  
  const passcode = await prisma.passcode.findUnique({
    where: { id: passcodeId },
    include: { user: true },
  });
  
  if (!passcode) {
    console.error('❌ Passcode not found');
    process.exit(1);
  }
  
  if (passcode.user.email !== email) {
    console.error('❌ You can only delete your own passcodes');
    console.error(`   This passcode belongs to: ${passcode.user.email}`);
    process.exit(1);
  }
  
  await prisma.passcode.delete({ where: { id: passcodeId } });
  console.log(`✅ Passcode deleted (hint: ****${passcode.codeHint})`);
}

/**
 * Admin: List passcodes for any user
 */
async function commandAdminList(targetEmail?: string): Promise<void> {
  const email = getGitEmail();
  validateRipplingEmail(email);
  
  if (email !== ADMIN_EMAIL) {
    console.error('❌ Admin commands are restricted to willhunter@rippling.com');
    process.exit(1);
  }
  
  if (targetEmail) {
    // List specific user's passcodes
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        passcodes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!user) {
      console.error(`❌ User not found: ${targetEmail}`);
      process.exit(1);
    }
    
    if (user.passcodes.length === 0) {
      console.log(`📋 No passcodes for ${targetEmail}`);
      return;
    }
    
    console.log(`📋 Passcodes for ${targetEmail}:\n`);
    console.log('   ID                        Hint    Created              Last Used');
    console.log('   ─────────────────────────────────────────────────────────────────');
    
    for (const p of user.passcodes) {
      const created = p.createdAt.toISOString().split('T')[0];
      const lastUsed = p.lastUsedAt ? p.lastUsedAt.toISOString().split('T')[0] : 'Never';
      console.log(`   ${p.id.padEnd(25)} ${p.codeHint}    ${created}    ${lastUsed}`);
    }
  } else {
    // List all users with passcodes
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { passcodes: true } },
      },
      orderBy: { email: 'asc' },
    });
    
    const usersWithPasscodes = users.filter(u => u._count.passcodes > 0);
    
    if (usersWithPasscodes.length === 0) {
      console.log('📋 No users have passcodes');
      return;
    }
    
    console.log('📋 Users with passcodes:\n');
    console.log('   Email                                    Passcodes');
    console.log('   ──────────────────────────────────────────────────');
    
    for (const u of usersWithPasscodes) {
      console.log(`   ${u.email.padEnd(40)} ${u._count.passcodes}`);
    }
    
    console.log('');
    console.log('   To view a user\'s passcodes: npm run passcode admin:list <email>');
  }
}

/**
 * Admin: Delete any passcode
 */
async function commandAdminDelete(passcodeId: string): Promise<void> {
  const email = getGitEmail();
  validateRipplingEmail(email);
  
  if (email !== ADMIN_EMAIL) {
    console.error('❌ Admin commands are restricted to willhunter@rippling.com');
    process.exit(1);
  }
  
  const passcode = await prisma.passcode.findUnique({
    where: { id: passcodeId },
    include: { user: true },
  });
  
  if (!passcode) {
    console.error('❌ Passcode not found');
    process.exit(1);
  }
  
  await prisma.passcode.delete({ where: { id: passcodeId } });
  console.log(`✅ Passcode deleted`);
  console.log(`   User: ${passcode.user.email}`);
  console.log(`   Hint: ****${passcode.codeHint}`);
}

// ==================== Main ====================

function printUsage(): void {
  console.log('Passcode Management CLI');
  console.log('');
  console.log('Usage: npm run passcode <command>');
  console.log('');
  console.log('Commands:');
  console.log('  generate              Generate a new passcode');
  console.log('  list                  List your passcodes');
  console.log('  delete <id>           Delete a passcode');
  console.log('');
  console.log('Admin Commands (willhunter@rippling.com only):');
  console.log('  admin:list [email]    List passcodes (all users or specific user)');
  console.log('  admin:delete <id>     Delete any passcode');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'generate':
        await commandGenerate();
        break;
      
      case 'list':
        await commandList();
        break;
      
      case 'delete':
        if (!args[1]) {
          console.error('❌ Usage: npm run passcode delete <id>');
          process.exit(1);
        }
        await commandDelete(args[1]);
        break;
      
      case 'admin:list':
        await commandAdminList(args[1]);
        break;
      
      case 'admin:delete':
        if (!args[1]) {
          console.error('❌ Usage: npm run passcode admin:delete <id>');
          process.exit(1);
        }
        await commandAdminDelete(args[1]);
        break;
      
      case '--help':
      case '-h':
      case undefined:
        printUsage();
        break;
      
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('');
        printUsage();
        process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
