#!/usr/bin/env npx tsx

/**
 * Snowflake Query Runner
 * 
 * Execute SQL queries against Snowflake and save results as JSON.
 * Uses externalbrowser authentication (SSO).
 * 
 * Usage:
 *   npm run query -- <sql-file> [--output <json-file>]
 *   npx tsx scripts/run-query.ts <sql-file> [--output <json-file>]
 * 
 * Examples:
 *   npm run query -- projects/my-analysis/queries/count.sql
 *   npm run query -- projects/my-analysis/queries/count.sql --output projects/my-analysis/data/count.json
 */

import * as snowflake from 'snowflake-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse command line arguments
function parseArgs(): { sqlFile: string; outputFile: string | null } {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run query -- <sql-file> [--output <json-file>]');
    process.exit(1);
  }
  
  let sqlFile = '';
  let outputFile: string | null = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      outputFile = args[i + 1];
      i++;
    } else if (!args[i].startsWith('-')) {
      sqlFile = args[i];
    }
  }
  
  if (!sqlFile) {
    console.error('Error: SQL file is required');
    process.exit(1);
  }
  
  return { sqlFile, outputFile };
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
  const { sqlFile, outputFile } = parseArgs();
  
  // Read SQL file
  if (!fs.existsSync(sqlFile)) {
    console.error(`Error: SQL file not found: ${sqlFile}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  console.log(`📄 Reading SQL from: ${sqlFile}`);
  
  // Determine output file
  let output = outputFile;
  if (!output) {
    // Default: same name as SQL file, but in data/ folder with .json extension
    const dir = path.dirname(sqlFile);
    const base = path.basename(sqlFile, '.sql');
    const dataDir = path.join(dir, '..', 'data');
    output = path.join(dataDir, `${base}.json`);
  }
  
  // Connect to Snowflake
  const config = getConnectionConfig();
  let connection: snowflake.Connection;
  
  try {
    connection = await connect(config);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }
  
  // Execute query
  let results: Record<string, unknown>[];
  try {
    results = await executeQuery(connection, sql);
  } catch (err) {
    console.error('❌ Query failed:', err);
    connection.destroy(() => {});
    process.exit(1);
  }
  
  // Ensure output directory exists
  const outputDir = path.dirname(output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save results
  console.log(`💾 Saving results to: ${output}`);
  fs.writeFileSync(output, JSON.stringify(results, null, 2));
  
  // Destroy connection
  connection.destroy(() => {
    console.log('');
    console.log('✅ Done!');
    console.log(`📁 Results saved to: ${output}`);
    console.log(`📊 Total rows: ${results.length}`);
  });
}

// Run
main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
