import logging
import os
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

import ddtrace
from snowflake.connector import connect as snowflake_connect
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import SQLAlchemyError

from common.exceptions import SnowflakeException

logger = logging.getLogger(__name__)


def get_rippling_account_email() -> str:
    """Get the Rippling account email from environment variable."""
    email = os.getenv("RIPPLING_ACCOUNT_EMAIL")
    if not email:
        raise ValueError(
            "RIPPLING_ACCOUNT_EMAIL environment variable not set. "
            "Please set it with: export RIPPLING_ACCOUNT_EMAIL='your.email@rippling.com'"
        )
    return email
UPDATED_RECORDS_COL = (
    "number of rows updated"  # Column name in Snowflake results for updated rows
)
INSERTED_RECORDS_COL = (
    "number of rows inserted"  # Column name in Snowflake results for inserted rows
)


class SnowflakeMgr:
    CONNECTION_POOL_SIZE = 2
    CONNECTION_MAX_POOL_SIZE = 10
    CONNECTION_POOL_TIMEOUT_SECS = 120  # 2 minutes
    CONNECTION_POOL_RECYCLE_SECS = 3600  # 1 hour

    def __init__(
        self,
        uri: Optional[str] = None,
        user_name: Optional[str] = None,
        authenticator: str = "EXTERNALBROWSER",
        role_name: Optional[str] = None,
        warehouse_name: Optional[str] = None,
        account_name: Optional[str] = None,
        database: Optional[str] = None,
        schema: Optional[str] = None,
    ) -> None:
        """
        Initialize the Snowflake manager with external browser authentication by default.
        For local development with Rippling Snowflake.
        
        All settings can be configured via environment variables:
            SNOWFLAKE_ACCOUNT    (default: rippling)
            RIPPLING_ACCOUNT_EMAIL or SNOWFLAKE_USER
            SNOWFLAKE_DATABASE   (optional)
            SNOWFLAKE_ROLE       (default: PROD_RIPPLING_MARKETING)
            SNOWFLAKE_WAREHOUSE  (default: PROD_RIPPLING_DWH)
            SNOWFLAKE_SCHEMA     (optional)
        
        :param uri: Optional connection URI for Snowflake (overrides other params if provided)
        :param user_name: Snowflake username (email)
        :param authenticator: Authentication method (default: EXTERNALBROWSER for SSO)
        :param role_name: Snowflake role (default: PROD_RIPPLING_MARKETING)
        :param warehouse_name: Snowflake warehouse (default: PROD_RIPPLING_DWH)
        :param account_name: Snowflake account (default: rippling)
        :param database: Snowflake database
        :param schema: Snowflake schema
        """
        if uri:
            self._uri = uri
            self._use_uri = True
        else:
            # Build URI from parameters with external browser auth as default
            # Read from env vars with fallback to defaults
            self._use_uri = False
            self.user_name = user_name or os.getenv('SNOWFLAKE_USER')
            self.authenticator = authenticator
            self.role_name = role_name or os.getenv('SNOWFLAKE_ROLE', "PROD_RIPPLING_MARKETING")
            self.warehouse_name = warehouse_name or os.getenv('SNOWFLAKE_WAREHOUSE', "PROD_RIPPLING_DWH")
            self.account_name = account_name or os.getenv('SNOWFLAKE_ACCOUNT', "rippling")
            self.database = database or os.getenv('SNOWFLAKE_DATABASE')
            self.schema = schema or os.getenv('SNOWFLAKE_SCHEMA')
            self._uri = self._build_uri()
        
        self._engine: Optional[Engine] = None
    
    def _build_uri(self) -> str:
        """Build Snowflake URI with external browser authentication."""
        if self.authenticator == "EXTERNALBROWSER":
            # For local development, use external browser authentication
            account = self.account_name or "rippling"
            host = f"{account}.snowflakecomputing.com"
            user = quote_plus(self.user_name or get_rippling_account_email())
            
            # Base URI
            uri_parts = [f"snowflake://{user}@{host}"]
            
            # Add database and schema if provided
            if self.database:
                uri_parts.append(f"/{self.database}")
                if self.schema:
                    uri_parts.append(f"/{self.schema}")
            
            # Add query parameters
            params = [
                f"authenticator=externalbrowser",
                f"warehouse={self.warehouse_name}",
                f"role={self.role_name}",
                f"account={self.account_name}",
            ]
            
            uri = "".join(uri_parts) + "?" + "&".join(params)
            return uri
        else:
            raise ValueError(f"Unsupported authenticator: {self.authenticator}")

    def __del__(self) -> None:
        self.shutdown()

    @property
    def uri(self) -> str:
        return self._uri

    @property
    def engine(self) -> Engine:
        if not self._engine:
            self._engine = self._create_engine()
        return self._engine

    def _create_engine(self) -> Engine:
        return create_engine(
            url=self.uri,
            pool_size=self.CONNECTION_POOL_SIZE,  # the number of connections to keep open
            max_overflow=self.CONNECTION_MAX_POOL_SIZE
            - self.CONNECTION_POOL_SIZE,  # the number of connections to allow in connection pool
            pool_timeout=self.CONNECTION_POOL_TIMEOUT_SECS,  # Max wait time for a connection (seconds)
            pool_recycle=self.CONNECTION_POOL_RECYCLE_SECS,  # Recycle connections after N seconds (optional, 1hr here)
            pool_pre_ping=True,  # Enable 'pre-ping' to test connection health on each checkout
        )

    def get_connection(self) -> Connection:
        """
        Get a connection from the engine's connection pool
        Close the connection after use to return it to the pool.
        Usage:
        with snowflake_client.get_connection() as conn:
            # Execute queries using conn
            result = conn.execute("SELECT * FROM my_table")
            data = result.fetchall()
        """
        return self.engine.connect().execution_options(isolation_level="AUTOCOMMIT")

    def _query(
        self,
        stmt: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Optional[List[Dict[str, Any]]]:
        """Internal method to execute a query and return results."""
        with self.engine.connect().execution_options(
            isolation_level="AUTOCOMMIT"
        ) as conn:
            # acquire a connection from the pool and close after statement execution
            results = conn.execute(
                text(stmt)
                .bindparams(**params or {})
                .execution_options(autocommit=True),
            )
            columns = results.keys()
            return [dict(zip(columns, row)) for row in results.fetchall()]

    @ddtrace.tracer.wrap("growth_services.clients.snowflakes")
    def query(
        self,
        stmt: str,
        params: Optional[Dict[str, Any]] = None,
        raise_errors: bool = True,
    ) -> Optional[List[Dict[str, Any]]]:
        try:
            return self._query(stmt, params)
        except SQLAlchemyError as e:
            logger.exception(
                f"Query failed with statement {stmt} and parameters {params}: {e}"
            )
            if raise_errors:
                raise SnowflakeException(f"Query failed {e}") from e
        return None

    def update_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> int:
        """Executes an update query and returns the number of updated records."""
        results = self.query(query, params=params)
        if not results:
            return 0

        if isinstance(results, dict):
            return results.get(UPDATED_RECORDS_COL, 0)

        return results[0].get(UPDATED_RECORDS_COL, 0)

    def insert_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> int:
        """Executes an insert query and returns the number of updated records."""
        results = self.query(query, params=params)
        if not results:
            return 0

        if isinstance(results, dict):
            return results.get(INSERTED_RECORDS_COL, 0)

        return results[0].get(INSERTED_RECORDS_COL, 0)

    # Close all connections in the pool on shutdown (optional)
    def shutdown(self) -> None:
        if self._engine:
            self._engine.dispose()
