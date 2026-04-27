import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Database Operations API
// Uses the Prisma client for SQLite (configured in the project).
// Can be extended for other database backends.
// ---------------------------------------------------------------------------

// Type definitions for PRAGMA results
interface PragmaColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
}

interface PragmaIndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface PragmaForeignKeyInfo {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

/**
 * POST /api/database
 * Connect / execute operations on the database.
 * Body: { action: 'connect'|'query'|'tables'|'schema', ...params }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'connect':
        return await handleConnect(body);
      case 'query':
        return await handleQuery(body);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: connect, query` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Database operation failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/database
 * Retrieve database metadata.
 * Query params:
 *   - action=tables|schema
 *   - table=<tableName> (required for schema action)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'tables';
    const table = searchParams.get('table');

    switch (action) {
      case 'tables':
        return await handleListTables();
      case 'schema':
        if (!table) {
          return NextResponse.json(
            { error: 'table query parameter is required for schema action' },
            { status: 400 }
          );
        }
        return await handleGetSchema(table);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: tables, schema` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Database operation failed: ${message}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleConnect(body: {
  type?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
}) {
  // For SQLite (default), we already have a connection via Prisma.
  // For other databases, this would establish a new connection.
  const dbType = body.type || 'sqlite';

  if (dbType === 'sqlite') {
    try {
      // Verify the connection is alive
      await db.$queryRaw`SELECT 1`;
      return NextResponse.json({
        success: true,
        type: 'sqlite',
        message: 'Connected to SQLite database successfully',
        connected: true,
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to connect to SQLite database', connected: false },
        { status: 500 }
      );
    }
  }

  // Placeholder for other database types
  return NextResponse.json({
    success: true,
    type: dbType,
    message: `Connection configuration received for ${dbType}. ` +
      'External database connections require additional driver setup.',
    connected: false,
    config: {
      host: body.host,
      port: body.port,
      database: body.database,
      // Never echo back passwords
    },
  });
}

async function handleQuery(body: { sql?: string; params?: unknown[] }) {
  const { sql, params } = body;

  if (!sql || typeof sql !== 'string') {
    return NextResponse.json(
      { error: 'sql is required and must be a string' },
      { status: 400 }
    );
  }

  // Basic safety: identify query type
  const normalizedSql = sql.trim().toUpperCase();
  const isSelect = normalizedSql.startsWith('SELECT') || normalizedSql.startsWith('PRAGMA');

  try {
    let result: unknown;

    if (isSelect || normalizedSql.startsWith('WITH')) {
      if (params && params.length > 0) {
        result = await db.$queryRawUnsafe(sql, ...params);
      } else {
        result = await db.$queryRawUnsafe(sql);
      }
    } else {
      if (params && params.length > 0) {
        result = await db.$executeRawUnsafe(sql, ...params);
      } else {
        result = await db.$executeRawUnsafe(sql);
      }
      result = { affectedRows: result };
    }

    return NextResponse.json({
      success: true,
      sql,
      type: isSelect ? 'query' : 'execute',
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Query execution failed: ${message}`, sql },
      { status: 400 }
    );
  }
}

async function handleListTables() {
  try {
    // SQLite: query sqlite_master for table names
    const tables = await db.$queryRawUnsafe<
      Array<{ name: string; type: string; tbl_name: string; sql: string }>
    >(
      "SELECT name, type, tbl_name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    const tableList = tables.map((t) => ({
      name: t.name,
      type: t.type,
      createStatement: t.sql,
    }));

    return NextResponse.json({
      success: true,
      action: 'tables',
      data: tableList,
      total: tableList.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to list tables: ${message}` },
      { status: 500 }
    );
  }
}

async function handleGetSchema(tableName: string) {
  try {
    // Get column info using PRAGMA
    const columns = await db.$queryRawUnsafe<PragmaColumnInfo[]>(
      'PRAGMA table_info(?)', tableName
    );

    // Get index info
    const indexes = await db.$queryRawUnsafe<PragmaIndexInfo[]>(
      'PRAGMA index_list(?)', tableName
    );

    // Get foreign keys
    const foreignKeys = await db.$queryRawUnsafe<PragmaForeignKeyInfo[]>(
      'PRAGMA foreign_key_list(?)', tableName
    );

    const schema = {
      tableName,
      columns: columns.map((col) => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        defaultValue: col.dflt_value,
        primaryKey: col.pk > 0,
      })),
      indexes: indexes.map((idx) => ({
        name: idx.name,
        unique: idx.unique === 1,
        origin: idx.origin,
      })),
      foreignKeys: foreignKeys.map((fk) => ({
        from: fk.from,
        to: fk.to,
        table: fk.table,
        onUpdate: fk.on_update,
        onDelete: fk.on_delete,
      })),
    };

    return NextResponse.json({
      success: true,
      action: 'schema',
      data: schema,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get schema for ${tableName}: ${message}` },
      { status: 500 }
    );
  }
}
