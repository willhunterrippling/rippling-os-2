#!/usr/bin/env python3
"""
Rippling OS Query Runner
A flexible CLI tool for executing Snowflake queries and saving results
"""

import argparse
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / ".env")

from core.clients.snowflake.snowflake_executor import SnowflakeExecutor


def main():
    parser = argparse.ArgumentParser(
        description='Execute Snowflake queries and save results',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run query from SQL file
  python query_runner.py --sql queries/my_query.sql --output ./results/data
  
  # Run inline query
  python query_runner.py --query "SELECT * FROM table LIMIT 10" --output ./output/test
  
  # Specify output format
  python query_runner.py --sql query.sql --output ./data/report --format json
  
  # Custom output filename
  python query_runner.py --sql query.sql --output ./data --name my_results
        """
    )
    
    # Query source (either --sql file or --query string)
    query_group = parser.add_mutually_exclusive_group(required=True)
    query_group.add_argument(
        '--sql', '-s',
        type=str,
        help='Path to SQL file containing the query'
    )
    query_group.add_argument(
        '--query', '-q',
        type=str,
        help='Inline SQL query string'
    )
    
    # Output options
    parser.add_argument(
        '--output', '-o',
        type=str,
        required=True,
        help='Output directory path (e.g., ./temp/results)'
    )
    parser.add_argument(
        '--name', '-n',
        type=str,
        default='query_results',
        help='Output filename (without extension, default: query_results)'
    )
    parser.add_argument(
        '--format', '-f',
        type=str,
        choices=['csv', 'json', 'excel'],
        default='csv',
        help='Output format (default: csv)'
    )
    
    # Connection options (optional overrides)
    parser.add_argument(
        '--database', '-d',
        type=str,
        help='Snowflake database (default: PROD_RIPPLING_DWH)'
    )
    parser.add_argument(
        '--warehouse', '-w',
        type=str,
        help='Snowflake warehouse (default: PROD_RIPPLING_DWH)'
    )
    parser.add_argument(
        '--role', '-r',
        type=str,
        help='Snowflake role (default: PROD_RIPPLING_MARKETING)'
    )
    
    # Display options
    parser.add_argument(
        '--preview',
        type=int,
        default=5,
        help='Number of rows to preview (default: 5, use 0 to disable)'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Suppress output (only show errors)'
    )
    
    args = parser.parse_args()
    
    # Initialize executor with optional overrides
    executor_kwargs = {}
    if args.database:
        executor_kwargs['database'] = args.database
    if args.warehouse:
        executor_kwargs['warehouse'] = args.warehouse
    if args.role:
        executor_kwargs['role'] = args.role
    
    executor = SnowflakeExecutor(**executor_kwargs)
    
    try:
        # Execute query
        if args.sql:
            # From SQL file
            sql_path = Path(args.sql).resolve()
            if not sql_path.exists():
                print(f"❌ Error: SQL file not found: {sql_path}")
                sys.exit(1)
            df = executor.execute_sql_file(str(sql_path))
        else:
            # Inline query
            df = executor.execute_query(args.query)
        
        if df.empty:
            print("⚠️  Query returned no results")
            return
        
        # Display preview if not quiet
        if not args.quiet and args.preview > 0:
            print("\n" + "="*80)
            print("QUERY RESULTS PREVIEW:")
            print("="*80)
            print(f"Total rows: {len(df)}")
            print(f"Total columns: {len(df.columns)}")
            print(f"Columns: {', '.join(df.columns.tolist())}")
            print(f"\nFirst {min(args.preview, len(df))} rows:")
            print(df.head(args.preview).to_string(index=False))
        
        # Save results
        output_path = executor.save_results(
            df,
            filename=args.name,
            format=args.format,
            output_dir=args.output
        )
        
        if not args.quiet:
            print("\n" + "="*80)
            print(f"✅ Success! Results saved to: {output_path}")
            print("="*80)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)
    finally:
        executor.close()


if __name__ == "__main__":
    main()

