#!/usr/bin/env npx tsx

/**
 * Local Query Runner - Run SQL without needing a project
 * 
 * Usage: npx tsx scripts/local-query.ts <sql-file>
 * 
 * This script connects to Snowflake and runs a query, outputting results
 * to console. No database/project required.
 */

import * as snowflake from 'snowflake-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import * as TOML from '@iarna/toml';

// Load environment variables
dotenv.config();

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

// Read connection from ~/.snowflake/connections.toml
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
          const conn = connections[profileName];
          console.log(`📄 Using connection "${profileName}" from ${tomlPath}`);
          return tomlConnectionToSnowflake(conn);
        }
        
        const directConn = config[profileName] as TomlConnection | undefined;
        if (directConn && (directConn.account || directConn.user)) {
          console.log(`📄 Using connection "${profileName}" from ${tomlPath}`);
          return tomlConnectionToSnowflake(directConn);
        }
      }
      
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

function getConnectionConfig(): snowflake.ConnectionOptions {
  const email = process.env.RIPPLING_ACCOUNT_EMAIL;
  
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
  
  const tomlConfig = getConnectionFromToml();
  if (tomlConfig) {
    if (!tomlConfig.username) {
      console.error('Error: Connection found in TOML but no user/username specified');
      process.exit(1);
    }
    return tomlConfig;
  }
  
  console.error('Error: No Snowflake connection configuration found.');
  console.error('Set RIPPLING_ACCOUNT_EMAIL in .env or configure ~/.snowflake/connections.toml');
  process.exit(1);
}

async function connect(config: snowflake.ConnectionOptions): Promise<snowflake.Connection> {
  console.log('🔗 Connecting to Snowflake...');
  console.log('📱 Using cached SSO token if available, otherwise a browser window will open.');
  console.log('');
  
  const connection = snowflake.createConnection(config);
  await connection.connectAsync(() => {});
  console.log('✅ Connected to Snowflake');
  return connection;
}

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

async function main() {
  const sqlFile = process.argv[2];
  
  if (!sqlFile) {
    console.error('Usage: npx tsx scripts/local-query.ts <sql-file>');
    process.exit(1);
  }
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`Error: SQL file not found: ${sqlFile}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  console.log(`📄 Reading SQL from: ${sqlFile}`);
  console.log('');
  
  const config = getConnectionConfig();
  let connection: snowflake.Connection;
  
  try {
    connection = await connect(config);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }
  
  let results: Record<string, unknown>[];
  try {
    results = await executeQuery(connection, sql);
  } catch (err) {
    console.error('❌ Query failed:', err);
    await new Promise<void>((resolve) => connection.destroy(() => resolve()));
    process.exit(1);
  }
  
  await new Promise<void>((resolve) => connection.destroy(() => resolve()));
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Results:');
  console.log('');
  
  if (results.length === 0) {
    console.log('   (no rows returned)');
  } else {
    // Print results as formatted JSON
    console.log(JSON.stringify(results, null, 2));
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
