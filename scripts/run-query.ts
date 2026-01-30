#!/usr/bin/env npx tsx

/**
 * Snowflake Query Runner
 * 
 * Execute SQL queries against Snowflake. Queries must be attached to a dashboard
 * or report, or run as temporary (not saved).
 * 
 * Modes:
 *   Temp query (not saved):
 *     npm run query -- --project <slug> --sql <file> --temp
 * 
 *   Save to dashboard:
 *     npm run query -- --project <slug> --name <name> --sql <file> --dashboard <dashboard-name>
 * 
 *   Save to report:
 *     npm run query -- --project <slug> --name <name> --sql <file> --report <report-name>
 * 
 *   Batch mode (multiple queries):
 *     npm run query -- --project <slug> --batch <queries.json> --dashboard <name>
 *     npm run query -- --project <slug> --batch <queries.json> --report <name>
 * 
 * Examples:
 *   npm run query -- -p my-analysis --sql query.sql --temp
 *   npm run query -- -p my-analysis -n weekly_s1 --sql query.sql --dashboard main
 *   npm run query -- -p my-analysis -n report_01_status --sql query.sql --report findings
 */

import * as snowflake from 'snowflake-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as TOML from '@iarna/toml';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

// Parse command line arguments
interface TempQueryArgs {
  mode: 'temp';
  projectSlug: string;
  sqlFile: string;
}

interface SavedQueryArgs {
  mode: 'saved';
  projectSlug: string;
  queryName: string;
  sqlFile?: string;
  dashboardName?: string;
  reportName?: string;
}

interface BatchQueryArgs {
  mode: 'batch';
  projectSlug: string;
  batchFile: string;
  dashboardName?: string;
  reportName?: string;
}

type Args = TempQueryArgs | SavedQueryArgs | BatchQueryArgs;

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
  let dashboardName: string | undefined;
  let reportName: string | undefined;
  let isTemp = false;
  
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
    } else if (arg === '--dashboard' || arg === '-d') {
      dashboardName = args[++i];
    } else if (arg === '--report' || arg === '-r') {
      reportName = args[++i];
    } else if (arg === '--temp' || arg === '-t') {
      isTemp = true;
    }
  }
  
  if (!projectSlug) {
    printUsage();
    process.exit(1);
  }
  
  // Temp mode
  if (isTemp) {
    if (!sqlFile) {
      console.error('Error: --temp mode requires --sql <file>');
      process.exit(1);
    }
    return { mode: 'temp', projectSlug, sqlFile };
  }
  
  // Batch mode
  if (batchFile) {
    if (!dashboardName && !reportName) {
      console.error('Error: Batch mode requires --dashboard or --report');
      printUsage();
      process.exit(1);
    }
    return { mode: 'batch', projectSlug, batchFile, dashboardName, reportName };
  }
  
  // Saved query mode
  if (!queryName) {
    console.error('Error: Must specify --name for saved queries');
    printUsage();
    process.exit(1);
  }
  
  if (!dashboardName && !reportName) {
    console.error('Error: Must specify --dashboard or --report (or use --temp for unsaved queries)');
    printUsage();
    process.exit(1);
  }
  
  return { mode: 'saved', projectSlug, queryName, sqlFile, dashboardName, reportName };
}

function printUsage(): void {
  console.error('Usage:');
  console.error('  Temp query:     npm run query -- --project <slug> --sql <file> --temp');
  console.error('  To dashboard:   npm run query -- --project <slug> --name <name> --sql <file> --dashboard <dashboard>');
  console.error('  To report:      npm run query -- --project <slug> --name <name> --sql <file> --report <report>');
  console.error('  Batch mode:     npm run query -- --project <slug> --batch <file.json> --dashboard <dashboard>');
  console.error('');
  console.error('Options:');
  console.error('  -p, --project    Project slug (required)');
  console.error('  -n, --name       Query name (required for saved queries)');
  console.error('  -s, --sql        SQL file path');
  console.error('  -d, --dashboard  Attach query to this dashboard');
  console.error('  -r, --report     Attach query to this report');
  console.error('  -t, --temp       Run without saving (temp query)');
  console.error('  -b, --batch      Batch JSON file with multiple queries');
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

// Interface for TOML connection configuration
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

// Read connection from ~/.snowflake/connections.toml (shared with VSCode extension)
function getConnectionFromToml(): snowflake.ConnectionOptions | null {
  // Check standard Snowflake config locations
  const possiblePaths = [
    path.join(os.homedir(), '.snowflake', 'connections.toml'),
    path.join(os.homedir(), '.snowflake', 'config.toml'),
  ];
  
  for (const tomlPath of possiblePaths) {
    if (!fs.existsSync(tomlPath)) continue;
    
    try {
      const content = fs.readFileSync(tomlPath, 'utf-8');
      const config = TOML.parse(content) as Record<string, unknown>;
      
      // Look for connection profiles in order of preference
      const profileNames = ['rippling', 'default'];
      
      for (const profileName of profileNames) {
        // Check for [connections.profileName] format (config.toml style)
        const connections = config.connections as Record<string, TomlConnection> | undefined;
        if (connections && connections[profileName]) {
          const conn = connections[profileName];
          console.log(`📄 Using connection "${profileName}" from ${tomlPath}`);
          return tomlConnectionToSnowflake(conn);
        }
        
        // Check for [profileName] format (connections.toml style)
        const directConn = config[profileName] as TomlConnection | undefined;
        if (directConn && (directConn.account || directConn.user)) {
          console.log(`📄 Using connection "${profileName}" from ${tomlPath}`);
          return tomlConnectionToSnowflake(directConn);
        }
      }
      
      // If no named profile found, try to use the first connection available
      if (connections) {
        const firstProfile = Object.keys(connections)[0];
        if (firstProfile) {
          console.log(`📄 Using connection "${firstProfile}" from ${tomlPath}`);
          return tomlConnectionToSnowflake(connections[firstProfile]);
        }
      }
    } catch (err) {
      console.warn(`⚠️  Could not parse ${tomlPath}: ${err}`);
    }
  }
  
  return null;
}

// Convert TOML connection format to Snowflake SDK options
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

// Get connection configuration
// Priority: 1. Environment variables  2. ~/.snowflake/connections.toml
function getConnectionConfig(): snowflake.ConnectionOptions {
  const email = process.env.RIPPLING_ACCOUNT_EMAIL;
  
  // If email is set in env, use environment-based config
  if (email) {
    return {
      account: process.env.SNOWFLAKE_ACCOUNT || 'RIPPLINGORG-RIPPLING',
      username: email,
      authenticator: 'EXTERNALBROWSER',
      clientStoreTemporaryCredential: true,
      database: process.env.SNOWFLAKE_DATABASE || 'PROD_RIPPLING_DWH',
      schema: process.env.SNOWFLAKE_SCHEMA || 'MARKETING_OPS',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'PROD_RIPPLING_INTEGRATION_DWH',
      role: process.env.SNOWFLAKE_ROLE || 'PROD_RIPPLING_MARKETING',
    };
  }
  
  // Try to read from TOML config (shared with VSCode Snowflake extension)
  const tomlConfig = getConnectionFromToml();
  if (tomlConfig) {
    if (!tomlConfig.username) {
      console.error('Error: Connection found in TOML but no user/username specified');
      process.exit(1);
    }
    return tomlConfig;
  }
  
  // No config found
  console.error('Error: No Snowflake connection configuration found.');
  console.error('');
  console.error('Option 1: Set RIPPLING_ACCOUNT_EMAIL in your .env file:');
  console.error('  RIPPLING_ACCOUNT_EMAIL=your.email@rippling.com');
  console.error('');
  console.error('Option 2: Configure ~/.snowflake/connections.toml (shared with VSCode extension):');
  console.error('  [rippling]');
  console.error('  account = "RIPPLINGORG-RIPPLING"');
  console.error('  user = "your.email@rippling.com"');
  console.error('  authenticator = "externalbrowser"');
  console.error('  database = "PROD_RIPPLING_DWH"');
  console.error('  schema = "MARKETING_OPS"');
  console.error('  warehouse = "PROD_RIPPLING_INTEGRATION_DWH"');
  console.error('  role = "PROD_RIPPLING_MARKETING"');
  process.exit(1);
}

// Connect to Snowflake
async function connect(config: snowflake.ConnectionOptions): Promise<snowflake.Connection> {
  console.log('🔗 Connecting to Snowflake...');
  console.log('📱 Using cached SSO token if available, otherwise a browser window will open.');
  console.log('');
  
  const connection = snowflake.createConnection(config);
  await connection.connectAsync();
  console.log('✅ Connected to Snowflake');
  return connection;
}

// Execute query (just run, don't save)
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

// Execute and save a query, creating junction record
async function runAndSaveQuery(
  connection: snowflake.Connection,
  projectId: string,
  queryName: string,
  sql: string,
  userEmail: string,
  dashboardId?: string,
  reportId?: string
): Promise<{ rowCount: number; queryId: string }> {
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
  
  // Create junction record for dashboard
  if (dashboardId) {
    await prisma.dashboardQuery.upsert({
      where: {
        dashboardId_queryId: {
          dashboardId,
          queryId: query.id,
        },
      },
      create: {
        dashboardId,
        queryId: query.id,
      },
      update: {},
    });
    console.log(`🔗 Linked to dashboard`);
  }
  
  // Create junction record for report
  if (reportId) {
    await prisma.reportQuery.upsert({
      where: {
        reportId_queryId: {
          reportId,
          queryId: query.id,
        },
      },
      create: {
        reportId,
        queryId: query.id,
      },
      update: {},
    });
    console.log(`🔗 Linked to report`);
  }
  
  // Execute query
  const results = await executeQuery(connection, sql);
  
  // Save results to database
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
  
  return { rowCount: results.length, queryId: query.id };
}

// Run temp query mode (no save)
async function runTempQueryMode(args: TempQueryArgs) {
  const { projectSlug, sqlFile } = args;
  
  console.log(`📁 Project: ${projectSlug}`);
  console.log(`📝 Mode: Temporary (not saved)`);
  console.log('');
  
  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });
  
  if (!project) {
    console.error(`Error: Project not found: ${projectSlug}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Read SQL
  if (!fs.existsSync(sqlFile)) {
    console.error(`Error: SQL file not found: ${sqlFile}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  console.log(`📄 Reading SQL from: ${sqlFile}`);
  console.log('');
  
  // Connect and execute
  const config = getConnectionConfig();
  let connection: snowflake.Connection;
  
  try {
    connection = await connect(config);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  let results: Record<string, unknown>[];
  try {
    results = await executeQuery(connection, sql);
  } catch (err) {
    console.error('❌ Query failed:', err);
    await new Promise<void>((resolve) => connection.destroy(() => resolve()));
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Cleanup
  await new Promise<void>((resolve) => connection.destroy(() => resolve()));
  await prisma.$disconnect();
  
  // Output results
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Results (not saved):');
  console.log('');
  
  if (results.length === 0) {
    console.log('   (no rows returned)');
  } else {
    // Show first 10 rows
    const preview = results.slice(0, 10);
    console.log(JSON.stringify(preview, null, 2));
    if (results.length > 10) {
      console.log(`   ... and ${results.length - 10} more rows`);
    }
  }
  
  console.log('');
  console.log('💡 To save this query, re-run with --dashboard or --report flag');
  
  process.exit(0);
}

// Run saved query mode
async function runSavedQueryMode(args: SavedQueryArgs) {
  const { projectSlug, queryName, sqlFile, dashboardName, reportName } = args;
  const userEmail = getGitEmail();
  
  console.log(`👤 Running as: ${userEmail}`);
  console.log(`📁 Project: ${projectSlug}`);
  console.log(`📝 Query: ${queryName}`);
  if (dashboardName) console.log(`📊 Dashboard: ${dashboardName}`);
  if (reportName) console.log(`📄 Report: ${reportName}`);
  console.log('');
  
  // Find project
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });
  
  if (!project) {
    console.error(`Error: Project not found: ${projectSlug}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Find dashboard if specified
  let dashboardId: string | undefined;
  if (dashboardName) {
    const dashboard = await prisma.dashboard.findUnique({
      where: {
        projectId_name: {
          projectId: project.id,
          name: dashboardName,
        },
      },
    });
    if (!dashboard) {
      console.error(`Error: Dashboard not found: ${dashboardName}`);
      await prisma.$disconnect();
      process.exit(1);
    }
    dashboardId = dashboard.id;
  }
  
  // Find report if specified
  let reportId: string | undefined;
  if (reportName) {
    const report = await prisma.report.findUnique({
      where: {
        projectId_name: {
          projectId: project.id,
          name: reportName,
        },
      },
    });
    if (!report) {
      console.error(`Error: Report not found: ${reportName}`);
      await prisma.$disconnect();
      process.exit(1);
    }
    reportId = report.id;
  }
  
  // Get SQL
  let sql: string;
  if (sqlFile) {
    if (!fs.existsSync(sqlFile)) {
      console.error(`Error: SQL file not found: ${sqlFile}`);
      await prisma.$disconnect();
      process.exit(1);
    }
    sql = fs.readFileSync(sqlFile, 'utf-8');
    console.log(`📄 Reading SQL from: ${sqlFile}`);
  } else {
    // Try to get SQL from existing query
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
      console.error('Provide a SQL file with --sql');
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
  
  // Execute and save
  let rowCount: number;
  try {
    const result = await runAndSaveQuery(
      connection,
      project.id,
      queryName,
      sql,
      userEmail,
      dashboardId,
      reportId
    );
    rowCount = result.rowCount;
  } catch (err) {
    console.error('❌ Query failed:', err);
    await new Promise<void>((resolve) => connection.destroy(() => resolve()));
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Cleanup
  await new Promise<void>((resolve) => connection.destroy(() => resolve()));
  await prisma.$disconnect();
  
  console.log('');
  console.log('✅ Done!');
  console.log(`📊 Results saved: ${rowCount} rows`);
  if (dashboardName) {
    console.log(`🔗 View at: /projects/${projectSlug}/dashboards/${dashboardName}`);
  }
  if (reportName) {
    console.log(`🔗 View at: /projects/${projectSlug}/reports/${reportName}`);
  }
  
  process.exit(0);
}

// Run batch query mode
async function runBatchQueryMode(args: BatchQueryArgs) {
  const { projectSlug, batchFile, dashboardName, reportName } = args;
  const userEmail = getGitEmail();
  
  console.log(`👤 Running as: ${userEmail}`);
  console.log(`📁 Project: ${projectSlug}`);
  console.log(`📦 Batch mode: ${batchFile}`);
  if (dashboardName) console.log(`📊 Dashboard: ${dashboardName}`);
  if (reportName) console.log(`📄 Report: ${reportName}`);
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
  
  // Find project
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });
  
  if (!project) {
    console.error(`Error: Project not found: ${projectSlug}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Find dashboard if specified
  let dashboardId: string | undefined;
  if (dashboardName) {
    const dashboard = await prisma.dashboard.findUnique({
      where: {
        projectId_name: {
          projectId: project.id,
          name: dashboardName,
        },
      },
    });
    if (!dashboard) {
      console.error(`Error: Dashboard not found: ${dashboardName}`);
      await prisma.$disconnect();
      process.exit(1);
    }
    dashboardId = dashboard.id;
  }
  
  // Find report if specified
  let reportId: string | undefined;
  if (reportName) {
    const report = await prisma.report.findUnique({
      where: {
        projectId_name: {
          projectId: project.id,
          name: reportName,
        },
      },
    });
    if (!report) {
      console.error(`Error: Report not found: ${reportName}`);
      await prisma.$disconnect();
      process.exit(1);
    }
    reportId = report.id;
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
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Execute all queries
  const results: { name: string; rowCount: number; success: boolean; error?: string }[] = [];
  
  for (let i = 0; i < resolvedQueries.length; i++) {
    const { name, sql } = resolvedQueries[i];
    console.log(`[${i + 1}/${resolvedQueries.length}] Executing: ${name}`);
    
    try {
      const result = await runAndSaveQuery(
        connection,
        project.id,
        name,
        sql,
        userEmail,
        dashboardId,
        reportId
      );
      results.push({ name, rowCount: result.rowCount, success: true });
      console.log(`✅ ${name}: ${result.rowCount} rows`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({ name, rowCount: 0, success: false, error: errorMsg });
      console.error(`❌ ${name}: ${errorMsg}`);
    }
    
    console.log('');
  }
  
  // Cleanup
  await new Promise<void>((resolve) => connection.destroy(() => resolve()));
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
  if (dashboardName) {
    console.log(`🔗 View at: /projects/${projectSlug}/dashboards/${dashboardName}`);
  }
  if (reportName) {
    console.log(`🔗 View at: /projects/${projectSlug}/reports/${reportName}`);
  }
  
  process.exit(failed.length > 0 ? 1 : 0);
}

// Main function
async function main() {
  const args = parseArgs();
  
  if (args.mode === 'temp') {
    await runTempQueryMode(args);
  } else if (args.mode === 'batch') {
    await runBatchQueryMode(args);
  } else {
    await runSavedQueryMode(args);
  }
}

// Run
main().catch(async (err) => {
  console.error('❌ Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
