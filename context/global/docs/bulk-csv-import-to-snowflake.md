<!-- Source: user knowledge (manual entry) -->
<!-- Added: 2026-02-06 -->
<!-- Type: Documentation -->

# Bulk CSV Import to Snowflake

## How to Add a CSV or Create a New Table in Snowflake

You **cannot** directly upload CSVs or create new tables in Snowflake. Instead, the process goes through Fivetran:

1. **Upload the CSV to Google Drive** -- place the CSV file in the appropriate Google Drive location
2. **Configure Fivetran** -- point a Fivetran connector at the Google Drive CSV
3. **Fivetran syncs to Snowflake** -- Fivetran handles the ingestion and creates/updates the table in Snowflake

This is the standard pipeline for getting ad-hoc or bulk data into Snowflake. The end user is responsible for setting up the Fivetran connector.

## Key Points

- There is no direct CSV upload path to Snowflake
- Fivetran is the required intermediary for CSV-to-Snowflake ingestion
- The source of truth for the CSV lives in Google Drive
