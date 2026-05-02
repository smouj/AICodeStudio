import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireLocalDevTools } from '@/lib/security/local-dev-tools';

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

export async function POST(req: NextRequest) {
  const denied = requireLocalDevTools(req, 'database');
  if (denied) return denied;

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

async function handleConnect(body: {
  type?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
}) {
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

  return NextResponse.json({
    success: true,
    type: dbType,
    message:
      `Connection configuration received for ${dbType}. ` +
      'External database connections require additional driver setup.',
    connected: false,
    config: {
      host: body.host,
      port: body.port,
      database: body.database,
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

  try {
    const normalizedSql = sql.trim().toUpperCase();
    const isResultSet = normalizedSql.startsWith('SELECT') || normalizedSql.startsWith('PRAGMA') || normalizedSql.startsWith('WITH');
    let result: unknown;

    if (isResultSet) {
      result = params && params.length > 0 ? await db.$queryRawUnsafe(sql, ...params) : await db.$queryRawUnsafe(sql);
    } else {
      const affectedRows = params && params.length > 0 ? await db.$executeRawUnsafe(sql, ...params) : await db.$executeRawUnsafe(sql);
      result = { affectedRows };
    }

    return NextResponse.json({
      success: true,
      sql,
      type: isResultSet ? 'query' : 'execute',
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
    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeTableName || safeTableName !== tableName) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const columns = await db.$queryRawUnsafe<PragmaColumnInfo[]>(`PRAGMA table_info(${safeTableName})`);
    const indexes = await db.$queryRawUnsafe<PragmaIndexInfo[]>(`PRAGMA index_list(${safeTableName})`);
    const foreignKeys = await db.$queryRawUnsafe<PragmaForeignKeyInfo[]>(`PRAGMA foreign_key_list(${safeTableName})`);

    const schema = {
      tableName: safeTableName,
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
