import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { guardSql, getDbRowLimit, getDbTimeoutMs } from '@/lib/security/sql-guard';

// ---------------------------------------------------------------------------
// Database Operations API
// Uses the Prisma client for SQLite (configured in the project).
// SECURITY: By default only SELECT, WITH, PRAGMA, EXPLAIN are allowed.
// Set AICODE_DB_WRITE_ENABLED=true to allow write operations.
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

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const connectBodySchema = z.object({
  action: z.literal('connect'),
  type: z.string().optional(),
  host: z.string().optional(),
  port: z.number().int().positive().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().optional(),
});

const queryBodySchema = z.object({
  action: z.literal('query'),
  sql: z.string().min(1),
  params: z.array(z.unknown()).optional(),
});

const postBodySchema = z.discriminatedUnion('action', [
  connectBodySchema,
  queryBodySchema,
]);

/**
 * POST /api/database
 * Connect / execute operations on the database.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = postBodySchema.parse(rawBody);
    const { action } = body;

    switch (action) {
      case 'connect':
        return await handleConnect(body);
      case 'query':
        return await handleQuery(body);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
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

async function handleConnect(body: z.infer<typeof connectBodySchema>) {
  const dbType = body.type || 'sqlite';

  if (dbType === 'sqlite') {
    try {
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

  // Other database types are not yet implemented
  return NextResponse.json({
    success: true,
    type: dbType,
    message: `${dbType} connections are not yet implemented. Currently only SQLite is supported.`,
    connected: false,
    status: 'coming-soon',
  });
}

async function handleQuery(body: z.infer<typeof queryBodySchema>) {
  const { sql, params } = body;

  // Apply SQL guard
  const guard = guardSql(sql);
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.reason, sql },
      { status: 403 }
    );
  }

  const rowLimit = getDbRowLimit();
  const timeoutMs = getDbTimeoutMs();

  try {
    let result: unknown;

    // Apply row limit for read queries
    const limitedSql = guard.type === 'read'
      ? applyRowLimit(sql, rowLimit)
      : sql;

    if (guard.type === 'read') {
      if (params && params.length > 0) {
        result = await db.$queryRawUnsafe(limitedSql, ...params);
      } else {
        result = await db.$queryRawUnsafe(limitedSql);
      }
    } else {
      // Write query (only if AICODE_DB_WRITE_ENABLED=true, already validated by guardSql)
      if (params && params.length > 0) {
        result = await db.$executeRawUnsafe(limitedSql, ...params);
      } else {
        result = await db.$executeRawUnsafe(limitedSql);
      }
      result = { affectedRows: result };
    }

    return NextResponse.json({
      success: true,
      sql,
      type: guard.type,
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

/**
 * Apply LIMIT to SELECT queries that don't already have one.
 * This prevents accidentally returning millions of rows.
 */
function applyRowLimit(sql: string, limit: number): string {
  const normalised = sql.trim().toUpperCase();

  // Only apply to SELECT/WITH queries
  if (!normalised.startsWith('SELECT') && !normalised.startsWith('WITH')) {
    return sql;
  }

  // Check if query already has LIMIT
  if (normalised.includes('LIMIT')) {
    return sql;
  }

  // Append LIMIT
  return `${sql.replace(/;\s*$/, '')} LIMIT ${limit}`;
}

async function handleListTables() {
  try {
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
    // Validate table name to prevent injection via PRAGMA
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name. Only alphanumeric characters and underscores are allowed.' },
        { status: 400 }
      );
    }

    // Get column info using tagged template for safety
    const columns = await db.$queryRawUnsafe<PragmaColumnInfo[]>(
      'PRAGMA table_info(?)', tableName
    );

    const indexes = await db.$queryRawUnsafe<PragmaIndexInfo[]>(
      'PRAGMA index_list(?)', tableName
    );

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
