#!/usr/bin/env npx tsx

/**
 * Snowflake Query Runner
 * 
 * Execute SQL queries against Snowflake and save results to the database.
 * Uses externalbrowser authentication (SSO).
 * 
 * Usage:
 *   npm run query -- --project <project-slug> --name <query-name> [--sql <sql-file>]
 *   npm run query -- -p <project-slug> -n <query-name> [-s <sql-file>]
 * 
 * Examples:
 *   npm run query -- --project my-analysis --name weekly_s1 --sql query.sql
 *   npm run query -- -p my-analysis -n weekly_s1
 */

import * as snowflake from 'snowflake-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Parse command line arguments
interface Args {
  projectSlug: string;
  queryName: string;
  sqlFile?: string;
  sql?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  
  let projectSlug = '';
  let queryName = '';
  let sqlFile: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--project' || arg === '-p') {
      projectSlug = args[++i];
    } else if (arg === '--name' || arg === '-n') {
      queryName = args[++i];
    } else if (arg === '--sql' || arg === '-s') {
      sqlFile = args[++i];
    }
  }
  
  if (!projectSlug || !queryName) {
    console.error('Usage: npm run query -- --project <project-slug> --name <query-name> [--sql <sql-file>]');
    console.error('');
    console.error('Options:');
    console.error('  -p, --project  Project slug (required)');
    console.error('  -n, --name     Query name (required)');
    console.error('  -s, --sql      SQL file path (optional, will use existing query from DB if not provided)');
    process.exit(1);
  }
  
  return { projectSlug, queryName, sqlFile };
}

// Get git user email for identity
function getGitEmail(): string {
  try {
    const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
    if (!email) {
      throw new Error('Git email not configured');
    }
    return email;
  } catch {
    console.error('Error: Could not get git user email');
    console.error('Please configure git: git config user.email "you@rippling.com"');
    process.exit(1);
  }
}

// Get connection configuration
function getConnectionConfig(): snowflake.ConnectionOptions {
  const email = process.env.RIPPLING_ACCOUNT_EMAIL;
  
  if (!email) {
    console.error('Error: RIPPLING_ACCOUNT_EMAIL environment variable is not set');
    console.error('Please set it in your .env file:');
    console.error('  RIPPLING_ACCOUNT_EMAIL=your.email@rippling.com');
    process.exit(1);
  }
  
  return {
    account: process.env.SNOWFLAKE_ACCOUNT || 'RIPPLINGORG-RIPPLING',
    username: email,
    authenticator: 'EXTERNALBROWSER',
    database: process.env.SNOWFLAKE_DATABASE || 'PROD_RIPPLING_DWH',
    schema: process.env.SNOWFLAKE_SCHEMA || 'MARKETING_OPS',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'PROD_RIPPLING_INTEGRATION_DWH',
    role: process.env.SNOWFLAKE_ROLE || 'PROD_RIPPLING_MARKETING',
  };
}

// Connect to Snowflake
async function connect(config: snowflake.ConnectionOptions): Promise<snowflake.Connection> {
  return new Promise((resolve, reject) => {
    console.log('🔗 Connecting to Snowflake...');
    console.log('📱 A browser window will open for SSO authentication.');
    console.log('');
    
    const connection = snowflake.createConnection(config);
    
    connection.connect((err, conn) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Connected to Snowflake');
        resolve(conn);
      }
    });
  });
}

// Execute query
async function executeQuery(
  connection: snowflake.Connection,
  sql: string
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    console.log('📊 Executing query...');
    
    connection.execute({
      sqlText: sql,
      complete: (err, _stmt, rows) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ Query returned ${rows?.length || 0} rows`);
          resolve(rows as Record<string, unknown>[]);
        }
      },
    });
  });
}

// Main function
async function main() {
  const { projectSlug, queryName, sqlFile } = parseArgs();
  const userEmail = getGitEmail();
  
  console.log(`👤 Running as: ${userEmail}`);
  console.log(`📁 Project: ${projectSlug}`);
  console.log(`📝 Query: ${queryName}`);
  console.log('');
  
  // Find the project in the database
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });
  
  if (!project) {
    console.error(`Error: Project not found: ${projectSlug}`);
    console.error('Run /create-project first to create the project.');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Get or read SQL
  let sql: string;
  
  if (sqlFile) {
    // Read SQL from file
    if (!fs.existsSync(sqlFile)) {
      console.error(`Error: SQL file not found: ${sqlFile}`);
      await prisma.$disconnect();
      process.exit(1);
    }
    sql = fs.readFileSync(sqlFile, 'utf-8');
    console.log(`📄 Reading SQL from: ${sqlFile}`);
  } else {
    // Try to get SQL from existing query in database
    const existingQuery = await prisma.query.findUnique({
      where: {
        projectId_name: {
          projectId: project.id,
          name: queryName,
        },
      },
    });
    
    if (!existingQuery) {
      console.error(`Error: Query not found in database: ${queryName}`);
      console.error('Provide a SQL file with --sql or create the query first.');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    sql = existingQuery.sql;
    console.log(`📄 Using SQL from database`);
  }
  
  // Create or update the query record
  const query = await prisma.query.upsert({
    where: {
      projectId_name: {
        projectId: project.id,
        name: queryName,
      },
    },
    create: {
      projectId: project.id,
      name: queryName,
      sql,
    },
    update: {
      sql,
    },
  });
  
  console.log(`💾 Query saved to database: ${query.id}`);
  console.log('');
  
  // Connect to Snowflake
  const config = getConnectionConfig();
  let connection: snowflake.Connection;
  
  try {
    connection = await connect(config);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Execute query
  let results: Record<string, unknown>[];
  try {
    results = await executeQuery(connection, sql);
  } catch (err) {
    console.error('❌ Query failed:', err);
    connection.destroy(() => {});
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Save results to database (upsert to overwrite previous results)
  console.log('💾 Saving results to database...');
  
  await prisma.queryResult.upsert({
    where: { queryId: query.id },
    create: {
      queryId: query.id,
      data: results,
      rowCount: results.length,
      executedBy: userEmail,
    },
    update: {
      data: results,
      rowCount: results.length,
      executedAt: new Date(),
      executedBy: userEmail,
    },
  });
  
  // Destroy connection and disconnect Prisma
  connection.destroy(async () => {
    await prisma.$disconnect();
    console.log('');
    console.log('✅ Done!');
    console.log(`📊 Results saved: ${results.length} rows`);
    console.log(`🔗 View at: /projects/${projectSlug}/dashboards/main`);
  });
}

// Run
main().catch(async (err) => {
  console.error('❌ Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
