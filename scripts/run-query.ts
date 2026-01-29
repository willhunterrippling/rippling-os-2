#!/usr/bin/env npx tsx

/**
 * Snowflake Query Runner
 * 
 * Execute SQL queries against Snowflake and save results to the database.
 * Uses externalbrowser authentication (SSO) with token caching.
 * 
 * Single Query Mode:
 *   npm run query -- --project <project-slug> --name <query-name> [--sql <sql-file>]
 *   npm run query -- -p <project-slug> -n <query-name> [-s <sql-file>]
 * 
 * Batch Mode (multiple queries, single auth):
 *   npm run query -- --project <project-slug> --batch <queries-json-file>
 *   npm run query -- -p <project-slug> -b <queries-json-file>
 * 
 * Examples:
 *   npm run query -- --project my-analysis --name weekly_s1 --sql query.sql
 *   npm run query -- -p my-analysis -n weekly_s1
 *   npm run query -- -p my-analysis --batch queries.json
 * 
 * Batch JSON format:
 *   [
 *     { "name": "query1", "sql": "SELECT * FROM table1 LIMIT 10" },
 *     { "name": "query2", "sqlFile": "path/to/query2.sql" }
 *   ]
 */

import * as snowflake from 'snowflake-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

// Parse command line arguments
interface SingleQueryArgs {
  mode: 'single';
  projectSlug: string;
  queryName: string;
  sqlFile?: string;
}

interface BatchQueryArgs {
  mode: 'batch';
  projectSlug: string;
  batchFile: string;
}

type Args = SingleQueryArgs | BatchQueryArgs;

// Batch query item format
interface BatchQueryItem {
  name: string;
  sql?: string;
  sqlFile?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  
  let projectSlug = '';
  let queryName = '';
  let sqlFile: string | undefined;
  let batchFile: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--project' || arg === '-p') {
      projectSlug = args[++i];
    } else if (arg === '--name' || arg === '-n') {
      queryName = args[++i];
    } else if (arg === '--sql' || arg === '-s') {
      sqlFile = args[++i];
    } else if (arg === '--batch' || arg === '-b') {
      batchFile = args[++i];
    }
  }
  
  if (!projectSlug) {
    printUsage();
    process.exit(1);
  }
  
  // Batch mode
  if (batchFile) {
    return { mode: 'batch', projectSlug, batchFile };
  }
  
  // Single query mode
  if (!queryName) {
    printUsage();
    process.exit(1);
  }
  
  return { mode: 'single', projectSlug, queryName, sqlFile };
}

function printUsage(): void {
  console.error('Usage:');
  console.error('  Single query: npm run query -- --project <slug> --name <name> [--sql <file>]');
  console.error('  Batch mode:   npm run query -- --project <slug> --batch <queries.json>');
  console.error('');
  console.error('Options:');
  console.error('  -p, --project  Project slug (required)');
  console.error('  -n, --name     Query name (required for single mode)');
  console.error('  -s, --sql      SQL file path (optional)');
  console.error('  -b, --batch    Batch JSON file with multiple queries');
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
    clientStoreTemporaryCredential: true, // Cache SSO token to avoid repeated browser auth
    database: process.env.SNOWFLAKE_DATABASE || 'PROD_RIPPLING_DWH',
    schema: process.env.SNOWFLAKE_SCHEMA || 'MARKETING_OPS',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'PROD_RIPPLING_INTEGRATION_DWH',
    role: process.env.SNOWFLAKE_ROLE || 'PROD_RIPPLING_MARKETING',
  };
}

// Connect to Snowflake
async function connect(config: snowflake.ConnectionOptions): Promise<snowflake.Connection> {
  console.log('🔗 Connecting to Snowflake...');
  console.log('📱 Using cached SSO token if available, otherwise a browser window will open.');
  console.log('');
  
  const connection = snowflake.createConnection(config);
  
  // Use connectAsync for external browser authentication
  await connection.connectAsync();
  console.log('✅ Connected to Snowflake');
  return connection;
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

// Execute and save a single query
async function runSingleQuery(
  connection: snowflake.Connection,
  projectId: string,
  queryName: string,
  sql: string,
  userEmail: string
): Promise<{ rowCount: number }> {
  // Create or update the query record
  const query = await prisma.query.upsert({
    where: {
      projectId_name: {
        projectId,
        name: queryName,
      },
    },
    create: {
      projectId,
      name: queryName,
      sql,
    },
    update: {
      sql,
    },
  });
  
  console.log(`💾 Query "${queryName}" saved to database: ${query.id}`);
  
  // Execute query
  const results = await executeQuery(connection, sql);
  
  // Save results to database (upsert to overwrite previous results)
  console.log(`💾 Saving results for "${queryName}"...`);
  
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
  
  return { rowCount: results.length };
}

// Run single query mode
async function runSingleQueryMode(args: SingleQueryArgs) {
  const { projectSlug, queryName, sqlFile } = args;
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
  let rowCount: number;
  try {
    const result = await runSingleQuery(connection, project.id, queryName, sql, userEmail);
    rowCount = result.rowCount;
  } catch (err) {
    console.error('❌ Query failed:', err);
    await new Promise<void>((resolve) => connection.destroy(() => resolve()));
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Destroy connection and disconnect Prisma
  await new Promise<void>((resolve) => {
    connection.destroy(() => {
      resolve();
    });
  });
  
  await prisma.$disconnect();
  
  console.log('');
  console.log('✅ Done!');
  console.log(`📊 Results saved: ${rowCount} rows`);
  console.log(`🔗 View at: /projects/${projectSlug}/dashboards/main`);
  
  process.exit(0);
}

// Run batch query mode
async function runBatchQueryMode(args: BatchQueryArgs) {
  const { projectSlug, batchFile } = args;
  const userEmail = getGitEmail();
  
  console.log(`👤 Running as: ${userEmail}`);
  console.log(`📁 Project: ${projectSlug}`);
  console.log(`📦 Batch mode: ${batchFile}`);
  console.log('');
  
  // Read batch file
  if (!fs.existsSync(batchFile)) {
    console.error(`Error: Batch file not found: ${batchFile}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  let queries: BatchQueryItem[];
  try {
    const batchContent = fs.readFileSync(batchFile, 'utf-8');
    queries = JSON.parse(batchContent);
    
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('Batch file must contain a non-empty array of queries');
    }
  } catch (err) {
    console.error(`Error: Failed to parse batch file: ${err}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log(`📋 Found ${queries.length} queries to execute`);
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
  
  // Validate and resolve SQL for all queries
  const resolvedQueries: { name: string; sql: string }[] = [];
  for (const item of queries) {
    if (!item.name) {
      console.error('Error: Each query in batch must have a "name" field');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    let sql: string;
    if (item.sql) {
      sql = item.sql;
    } else if (item.sqlFile) {
      if (!fs.existsSync(item.sqlFile)) {
        console.error(`Error: SQL file not found for query "${item.name}": ${item.sqlFile}`);
        await prisma.$disconnect();
        process.exit(1);
      }
      sql = fs.readFileSync(item.sqlFile, 'utf-8');
    } else {
      // Try to get SQL from existing query in database
      const existingQuery = await prisma.query.findUnique({
        where: {
          projectId_name: {
            projectId: project.id,
            name: item.name,
          },
        },
      });
      
      if (!existingQuery) {
        console.error(`Error: Query "${item.name}" has no SQL and doesn't exist in database`);
        await prisma.$disconnect();
        process.exit(1);
      }
      sql = existingQuery.sql;
    }
    
    resolvedQueries.push({ name: item.name, sql });
  }
  
  console.log('✅ All queries validated');
  console.log('');
  
  // Connect to Snowflake (single auth for all queries)
  const config = getConnectionConfig();
  let connection: snowflake.Connection;
  
  try {
    connection = await connect(config);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Execute all queries with the same connection
  const results: { name: string; rowCount: number; success: boolean; error?: string }[] = [];
  
  for (let i = 0; i < resolvedQueries.length; i++) {
    const { name, sql } = resolvedQueries[i];
    console.log(`[${i + 1}/${resolvedQueries.length}] Executing: ${name}`);
    
    try {
      const result = await runSingleQuery(connection, project.id, name, sql, userEmail);
      results.push({ name, rowCount: result.rowCount, success: true });
      console.log(`✅ ${name}: ${result.rowCount} rows`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({ name, rowCount: 0, success: false, error: errorMsg });
      console.error(`❌ ${name}: ${errorMsg}`);
    }
    
    console.log('');
  }
  
  // Destroy connection and disconnect Prisma
  await new Promise<void>((resolve) => {
    connection.destroy(() => {
      resolve();
    });
  });
  
  await prisma.$disconnect();
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📊 Batch Summary:');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`   ✅ Successful: ${successful.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  console.log('');
  
  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    const info = r.success ? `${r.rowCount} rows` : r.error;
    console.log(`   ${status} ${r.name}: ${info}`);
  }
  
  console.log('');
  console.log(`🔗 View at: /projects/${projectSlug}/dashboards/main`);
  
  // Exit with error code if any queries failed
  process.exit(failed.length > 0 ? 1 : 0);
}

// Main function
async function main() {
  const args = parseArgs();
  
  if (args.mode === 'batch') {
    await runBatchQueryMode(args);
  } else {
    await runSingleQueryMode(args);
  }
}

// Run
main().catch(async (err) => {
  console.error('❌ Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
