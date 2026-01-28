#!/usr/bin/env python3
"""
Snowflake Query Executor with SSO Authentication
Execute SQL queries against Snowflake and export results to various formats.
"""

import os
from datetime import datetime
from typing import Optional, List

import pandas as pd
import snowflake.connector


def get_rippling_account_email() -> str:
    """Get the Rippling account email from environment variable."""
    email = os.getenv("RIPPLING_ACCOUNT_EMAIL")
    if not email:
        raise ValueError(
            "RIPPLING_ACCOUNT_EMAIL environment variable not set. "
            "Add it to your .env file: RIPPLING_ACCOUNT_EMAIL='your.email@rippling.com'"
        )
    return email


class SnowflakeExecutor:
    """Execute Snowflake queries with SSO authentication"""
    
    def __init__(self, 
                 account: Optional[str] = None,
                 user: Optional[str] = None,
                 database: Optional[str] = None,
                 role: Optional[str] = None,
                 warehouse: Optional[str] = None,
                 schema: Optional[str] = None):
        """
        Initialize Snowflake connection parameters with Rippling defaults.
        
        All settings can be configured via environment variables:
            SNOWFLAKE_ACCOUNT    (default: rippling)
            RIPPLING_ACCOUNT_EMAIL or SNOWFLAKE_USER
            SNOWFLAKE_DATABASE   (default: PROD_RIPPLING_DWH)
            SNOWFLAKE_ROLE       (default: PROD_RIPPLING_MARKETING)
            SNOWFLAKE_WAREHOUSE  (default: PROD_RIPPLING_DWH)
            SNOWFLAKE_SCHEMA     (optional)
        
        Args:
            account: Snowflake account identifier
            user: Username/email for authentication
            database: Default database
            role: Default role  
            warehouse: Default warehouse
            schema: Default schema (optional)
        """
        self.connection_params = {
            'account': account or os.getenv('SNOWFLAKE_ACCOUNT', 'rippling'),
            'user': user or os.getenv('SNOWFLAKE_USER') or get_rippling_account_email(),
            'authenticator': 'externalbrowser',  # SSO authentication
            'database': database or os.getenv('SNOWFLAKE_DATABASE', 'PROD_RIPPLING_DWH'),
            'role': role or os.getenv('SNOWFLAKE_ROLE', 'PROD_RIPPLING_MARKETING'),
            'warehouse': warehouse or os.getenv('SNOWFLAKE_WAREHOUSE', 'PROD_RIPPLING_DWH'),
        }
        
        # Add schema if specified
        schema_val = schema or os.getenv('SNOWFLAKE_SCHEMA')
        if schema_val:
            self.connection_params['schema'] = schema_val
        
        self.connection = None
    
    def _split_sql_statements(self, query: str) -> List[str]:
        """
        Split a multi-statement SQL query into individual statements
        
        Args:
            query: SQL query string potentially containing multiple statements
            
        Returns:
            List of individual SQL statements
        """
        statements = []
        current_statement = ""
        in_string = False
        string_char = None
        in_comment = False
        
        i = 0
        while i < len(query):
            char = query[i]
            
            # Handle newlines - end line comments
            if char == '\n':
                in_comment = False
                if not in_string:
                    current_statement += char
                i += 1
                continue
            
            # Skip characters if we're in a comment
            if in_comment:
                i += 1
                continue
            
            # Check for start of line comment (-- but not inside strings)
            if char == '-' and i + 1 < len(query) and query[i + 1] == '-' and not in_string:
                in_comment = True
                i += 2  # Skip both dashes
                continue
            
            # Handle string literals (single or double quotes)
            if char in ("'", '"') and not in_string:
                in_string = True
                string_char = char
                current_statement += char
            elif char == string_char and in_string:
                # Check if it's an escaped quote
                if i + 1 < len(query) and query[i + 1] == string_char:
                    current_statement += char + char
                    i += 1  # Skip the next quote
                else:
                    in_string = False
                    string_char = None
                    current_statement += char
            elif char == ';' and not in_string:
                # End of statement
                if current_statement.strip():
                    statements.append(current_statement.strip())
                current_statement = ""
            else:
                current_statement += char
            
            i += 1
        
        # Add the last statement if it doesn't end with semicolon
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        return statements
    
    def connect(self) -> None:
        """Establish connection to Snowflake with SSO"""
        print("🔗 Connecting to Snowflake with SSO authentication...")
        print("📱 A browser window will open for authentication.")
        
        try:
            self.connection = snowflake.connector.connect(**self.connection_params)
            print("✅ Connected to Snowflake.")
        except Exception as e:
            print(f"❌ Connection failed: {str(e)}")
            raise
    
    def execute_query(self, query: str) -> pd.DataFrame:
        """
        Execute a SQL query and return results as DataFrame
        Handles both single statements and multi-statement queries
        
        Args:
            query: SQL query string (single or multiple statements)
            
        Returns:
            pandas.DataFrame with query results from the last SELECT statement
        """
        if not self.connection:
            self.connect()
        
        print("\n📊 Executing query...")
        
        try:
            cursor = self.connection.cursor()
            
            # Split query into individual statements
            statements = self._split_sql_statements(query)
            print(f"📝 Found {len(statements)} SQL statement(s)")
            
            final_df = pd.DataFrame()  # Default empty DataFrame
            
            for i, statement in enumerate(statements, 1):
                statement = statement.strip()
                if not statement:
                    continue
                
                print(f"   Executing statement {i}/{len(statements)}: {statement[:50]}{'...' if len(statement) > 50 else ''}")
                
                cursor.execute(statement)
                
                # Check if this statement returns results
                if cursor.description is not None:
                    # This is a SELECT or other statement that returns data
                    results = cursor.fetchall()
                    columns = [desc[0] for desc in cursor.description]
                    
                    print(f"   ✅ Statement {i} returned {len(results)} rows")
                    
                    # Store the results (last SELECT statement wins)
                    final_df = pd.DataFrame(results, columns=columns)
                else:
                    # This is a DDL/DML statement that doesn't return data
                    print(f"   ✅ Statement {i} executed successfully (no results returned)")
            
            cursor.close()
            
            if not final_df.empty:
                print(f"✅ Query completed! Final result set has {len(final_df)} rows.")
            else:
                print("✅ Query completed! No result set returned.")
            
            return final_df
            
        except Exception as e:
            print(f"❌ Query execution failed: {str(e)}")
            raise
    
    def execute_sql_file(self, sql_file_path: str) -> pd.DataFrame:
        """
        Execute SQL query from file
        
        Args:
            sql_file_path: Path to SQL file
            
        Returns:
            pandas.DataFrame with query results
        """
        if not os.path.exists(sql_file_path):
            raise FileNotFoundError(f"SQL file not found: {sql_file_path}")
        
        print(f"📄 Reading SQL from: {sql_file_path}")
        with open(sql_file_path, 'r') as f:
            query = f.read()
        
        return self.execute_query(query)
    
    def save_results(self, df: pd.DataFrame, 
                    filename: str, 
                    format: str = 'csv', 
                    output_dir: str = '_outputs') -> str:
        """
        Save DataFrame to file
        
        Args:
            df: DataFrame to save
            filename: Output filename (without extension)
            format: Output format ('csv', 'json', 'excel')
            output_dir: Output directory (default: _outputs)
            
        Returns:
            Full path to saved file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Save results to file
        if format.lower() == 'csv':
            output_path = f"{output_dir}/{filename}_{timestamp}.csv"
            df.to_csv(output_path, index=False)
        elif format.lower() == 'json':
            output_path = f"{output_dir}/{filename}_{timestamp}.json"
            df.to_json(output_path, orient='records', indent=2)
        elif format.lower() == 'excel':
            output_path = f"{output_dir}/{filename}_{timestamp}.xlsx"
            df.to_excel(output_path, index=False)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        print(f"💾 Results saved to: {output_path}")
        return output_path
    
    def close(self) -> None:
        """Close Snowflake connection"""
        if self.connection:
            self.connection.close()
            print("🔐 Connection closed.")

