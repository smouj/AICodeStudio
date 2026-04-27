'use client'

import { useState, useCallback } from 'react'
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  Table2,
  Key,
  Clock,
  X,
  Plug,
  Unplug,
  Server,
  Shield,
  Search,
} from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'
import type { DBConnection, DBTable, DBQueryResult } from '@/store/ide-store'

// ─── DB Type Config ──────────────────────────────────────────

const DB_TYPE_CONFIG: Record<string, { color: string; defaultPort: number; icon: string }> = {
  postgresql: { color: 'text-[#336791]', defaultPort: 5432, icon: '🐘' },
  mysql: { color: 'text-[#00758f]', defaultPort: 3306, icon: '🐬' },
  sqlite: { color: 'text-[#00d4aa]', defaultPort: 0, icon: '📄' },
  mongodb: { color: 'text-[#47a248]', defaultPort: 27017, icon: '🍃' },
  redis: { color: 'text-[#dc382d]', defaultPort: 6379, icon: '🔴' },
  mssql: { color: 'text-[#cc2927]', defaultPort: 1433, icon: '🗄️' },
}

// ─── Connection Form ─────────────────────────────────────────

function ConnectionForm({ onClose }: { onClose: () => void }) {
  const addDBConnection = useIDEStore((s) => s.addDBConnection)
  const [type, setType] = useState<DBConnection['type']>('postgresql')
  const [name, setName] = useState('')
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState(5432)
  const [database, setDatabase] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [ssl, setSsl] = useState(false)

  const handleTypeChange = (newType: DBConnection['type']) => {
    setType(newType)
    const cfg = DB_TYPE_CONFIG[newType]
    if (cfg) {
      setPort(cfg.defaultPort)
      if (newType === 'sqlite') {
        setHost('')
        setUsername('')
        setPassword('')
      } else {
        if (!host) setHost('localhost')
      }
    }
  }

  const handleSubmit = () => {
    if (!name.trim() || !database.trim()) return
    if (type !== 'sqlite' && !host.trim()) return

    addDBConnection({
      name: name.trim(),
      type,
      host: type === 'sqlite' ? database : host.trim(),
      port,
      database: database.trim(),
      username: username || undefined,
      ssl: ssl || undefined,
    })
    onClose()
  }

  return (
    <div className="p-3 border-b border-[rgba(0,212,170,0.08)] bg-[#060a10]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono text-[#00d4aa] uppercase tracking-wider">New Connection</span>
        <button onClick={onClose} className="text-[#30363d] hover:text-[#f85149] cursor-pointer">
          <X size={12} />
        </button>
      </div>

      {/* DB Type selector */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {(Object.keys(DB_TYPE_CONFIG) as DBConnection['type'][]).map((dbType) => {
          const cfg = DB_TYPE_CONFIG[dbType]
          return (
            <button
              key={dbType}
              onClick={() => handleTypeChange(dbType)}
              className={`px-2 py-1 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                type === dbType
                  ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                  : 'text-[#484f58] hover:text-[#6e7681] hover:bg-[rgba(0,212,170,0.04)]'
              }`}
            >
              {cfg.icon} {dbType}
            </button>
          )
        })}
      </div>

      {/* Form fields */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[9px] text-[#484f58] font-mono uppercase tracking-wider mb-0.5 block">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Database"
              className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors"
            />
          </div>
        </div>

        {type !== 'sqlite' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] text-[#484f58] font-mono uppercase tracking-wider mb-0.5 block">Host</label>
              <input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost"
                className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors"
              />
            </div>
            <div className="w-20">
              <label className="text-[9px] text-[#484f58] font-mono uppercase tracking-wider mb-0.5 block">Port</label>
              <input
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                type="number"
                className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-[9px] text-[#484f58] font-mono uppercase tracking-wider mb-0.5 block">
            {type === 'sqlite' ? 'File Path' : 'Database'}
          </label>
          <input
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            placeholder={type === 'sqlite' ? '/path/to/database.db' : 'mydb'}
            className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors"
          />
        </div>

        {type !== 'sqlite' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] text-[#484f58] font-mono uppercase tracking-wider mb-0.5 block">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="root"
                className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-[#484f58] font-mono uppercase tracking-wider mb-0.5 block">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••"
                className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors"
              />
            </div>
          </div>
        )}

        {type !== 'sqlite' && (
          <label className="flex items-center gap-2 text-[10px] text-[#484f58] font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={ssl}
              onChange={(e) => setSsl(e.target.checked)}
              className="accent-[#00d4aa]"
            />
            <Shield size={10} className="text-[#484f58]" />
            Use SSL
          </label>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !database.trim() || (type !== 'sqlite' && !host.trim())}
          className={`
            w-full text-[11px] font-mono py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5
            ${name.trim() && database.trim()
              ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)]'
              : 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
            }
          `}
        >
          <Plus size={11} />
          Add Connection
        </button>
      </div>
    </div>
  )
}

// ─── Schema Viewer ───────────────────────────────────────────

function SchemaViewer({ table }: { table: DBTable }) {
  if (!table.columns || table.columns.length === 0) {
    return (
      <div className="px-4 py-2 text-[10px] text-[#30363d] font-mono">
        No schema information available. Select the table to load columns.
      </div>
    )
  }

  return (
    <div className="px-3 pb-2">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="text-[#30363d] border-b border-[rgba(0,212,170,0.06)]">
            <th className="text-left py-1 pr-2 font-normal">Column</th>
            <th className="text-left py-1 pr-2 font-normal">Type</th>
            <th className="text-center py-1 pr-2 font-normal">Null</th>
            <th className="text-center py-1 font-normal">Key</th>
          </tr>
        </thead>
        <tbody>
          {table.columns.map((col) => (
            <tr key={col.name} className="border-b border-[rgba(0,212,170,0.03)] hover:bg-[rgba(0,212,170,0.02)]">
              <td className="py-1 pr-2 text-[#e6edf3]">
                <div className="flex items-center gap-1">
                  {col.primaryKey && <Key size={8} className="text-[#ffa657]" />}
                  <span>{col.name}</span>
                </div>
              </td>
              <td className="py-1 pr-2 text-[#79c0ff]">{col.type}</td>
              <td className="py-1 pr-2 text-center">
                {col.nullable ? (
                  <span className="text-[#484f58]">YES</span>
                ) : (
                  <span className="text-[#f85149]/60">NO</span>
                )}
              </td>
              <td className="py-1 text-center">
                {col.primaryKey ? (
                  <span className="text-[#ffa657]">PK</span>
                ) : (
                  <span className="text-[#30363d]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Query Results Table ─────────────────────────────────────

function QueryResults({ result }: { result: DBQueryResult }) {
  if (result.rows.length === 0) {
    return (
      <div className="p-3 text-center">
        <p className="text-[11px] text-[#484f58] font-mono">Query returned 0 rows</p>
        {result.affectedRows !== undefined && result.affectedRows > 0 && (
          <p className="text-[10px] text-[#3fb950] font-mono mt-1">{result.affectedRows} row(s) affected</p>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="border-b border-[rgba(0,212,170,0.1)] bg-[#0a0f18]">
            {result.columns.map((col) => (
              <th key={col} className="text-left px-2 py-1.5 text-[#00d4aa]/70 font-semibold whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-[rgba(0,212,170,0.03)] hover:bg-[rgba(0,212,170,0.03)]"
            >
              {result.columns.map((col) => (
                <td key={col} className="px-2 py-1 text-[#e6edf3] whitespace-nowrap max-w-[200px] truncate">
                  {row[col] === null ? (
                    <span className="text-[#30363d] italic">NULL</span>
                  ) : typeof row[col] === 'object' ? (
                    <span className="text-[#79c0ff]">{JSON.stringify(row[col])}</span>
                  ) : (
                    String(row[col])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Database Panel ─────────────────────────────────────

export function DatabasePanel() {
  const dbConnections = useIDEStore((s) => s.dbConnections)
  const dbActiveConnection = useIDEStore((s) => s.dbActiveConnection)
  const dbTables = useIDEStore((s) => s.dbTables)
  const dbQueryResult = useIDEStore((s) => s.dbQueryResult)
  const dbQueryRunning = useIDEStore((s) => s.dbQueryRunning)
  const addDBConnection = useIDEStore((s) => s.addDBConnection)
  const removeDBConnection = useIDEStore((s) => s.removeDBConnection)
  const connectDB = useIDEStore((s) => s.connectDB)
  const disconnectDB = useIDEStore((s) => s.disconnectDB)
  const executeQuery = useIDEStore((s) => s.executeQuery)
  const fetchTables = useIDEStore((s) => s.fetchTables)
  const addNotification = useIDEStore((s) => s.addNotification)

  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [activeView, setActiveView] = useState<'tables' | 'query' | 'connections'>('connections')
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [sqlQuery, setSqlQuery] = useState('')
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [tableSearch, setTableSearch] = useState('')

  // Get active connection object
  const activeConn = dbConnections.find((c) => c.id === dbActiveConnection)

  // Auto-switch view when connecting (derived from store state)
  const effectiveView = dbActiveConnection && activeView === 'connections' ? 'tables' : activeView

  // Handle execute query
  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim() || !dbActiveConnection) return

    const queryText = sqlQuery.trim()
    setQueryHistory((prev) => [queryText, ...prev.filter((q) => q !== queryText)].slice(0, 20))
    await executeQuery(queryText)
  }

  // Handle table click — load schema
  const handleTableClick = async (tableName: string) => {
    if (expandedTable === tableName) {
      setExpandedTable(null)
      return
    }
    setExpandedTable(tableName)

    // Fetch column info for the table
    try {
      const res = await fetch(
        `/api/database/tables/${tableName}/schema?XTransformPort=3002&connectionId=${dbActiveConnection}`
      )
      if (res.ok) {
        const data = await res.json()
        // Update the table with columns info
        const store = useIDEStore.getState()
        const updatedTables = store.dbTables.map((t) =>
          t.name === tableName ? { ...t, columns: data.columns || [] } : t
        )
        useIDEStore.setState({ dbTables: updatedTables })
      }
    } catch {
      // Silently fail — schema will just not show
    }
  }

  // Select a row from query result for preview
  const handleSelectTable = async (tableName: string) => {
    setSqlQuery(`SELECT * FROM ${tableName} LIMIT 100;`)
    setActiveView('query')
  }

  // Filter tables by search
  const filteredTables = tableSearch
    ? dbTables.filter((t) => t.name.toLowerCase().includes(tableSearch.toLowerCase()))
    : dbTables

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <div className="flex items-center gap-2">
          <Database size={12} className="text-[#00d4aa]/60" />
          <span>Database</span>
        </div>
        <div className="flex items-center gap-2">
          {activeConn && (
            <span className="text-[9px] font-mono text-[#3fb950] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shadow-[0_0_4px_rgba(63,185,80,0.4)]" />
              {activeConn.name}
            </span>
          )}
          <button
            onClick={() => fetchTables()}
            className="text-[#30363d] hover:text-[#00d4aa] cursor-pointer transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center border-b border-[rgba(0,212,170,0.08)]">
        <button
          onClick={() => setActiveView('connections')}
          className={`flex-1 px-2 py-1.5 text-[10px] font-mono cursor-pointer transition-colors border-b-2 ${
            effectiveView === 'connections'
              ? 'text-[#00d4aa] border-[#00d4aa]'
              : 'text-[#30363d] border-transparent hover:text-[#484f58]'
          }`}
        >
          <Plug size={10} className="inline mr-1 -mt-0.5" />
          Connections
        </button>
        <button
          onClick={() => setActiveView('tables')}
          disabled={!dbActiveConnection}
          className={`flex-1 px-2 py-1.5 text-[10px] font-mono cursor-pointer transition-colors border-b-2 ${
            effectiveView === 'tables'
              ? 'text-[#00d4aa] border-[#00d4aa]'
              : !dbActiveConnection
                ? 'text-[#1c2128] border-transparent cursor-not-allowed'
                : 'text-[#30363d] border-transparent hover:text-[#484f58]'
          }`}
        >
          <Table2 size={10} className="inline mr-1 -mt-0.5" />
          Tables
        </button>
        <button
          onClick={() => setActiveView('query')}
          disabled={!dbActiveConnection}
          className={`flex-1 px-2 py-1.5 text-[10px] font-mono cursor-pointer transition-colors border-b-2 ${
            effectiveView === 'query'
              ? 'text-[#00d4aa] border-[#00d4aa]'
              : !dbActiveConnection
                ? 'text-[#1c2128] border-transparent cursor-not-allowed'
                : 'text-[#30363d] border-transparent hover:text-[#484f58]'
          }`}
        >
          <Play size={10} className="inline mr-1 -mt-0.5" />
          Query
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ─── Connections View ─────────────────────────────── */}
        {effectiveView === 'connections' && (
          <>
            {showConnectionForm && (
              <ConnectionForm onClose={() => setShowConnectionForm(false)} />
            )}

            {dbConnections.length === 0 && !showConnectionForm ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Database size={28} className="text-[#00d4aa]/10 mb-3" />
                <p className="text-[12px] text-[#30363d] font-mono">No database connections</p>
                <p className="text-[10px] text-[#30363d] mt-1">Add a connection to start querying</p>
                <button
                  onClick={() => setShowConnectionForm(true)}
                  className="mt-4 px-3 py-1.5 text-[11px] font-mono bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)] rounded cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Plus size={11} /> New Connection
                </button>
              </div>
            ) : (
              <div className="px-2 py-1">
                {dbConnections.map((conn) => {
                  const cfg = DB_TYPE_CONFIG[conn.type]
                  const isActive = dbActiveConnection === conn.id

                  return (
                    <div
                      key={conn.id}
                      className={`flex items-center gap-2 px-2 py-2 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded mb-0.5 ${
                        isActive ? 'bg-[rgba(0,212,170,0.06)]' : ''
                      }`}
                    >
                      {/* Connection status indicator */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        conn.connected
                          ? 'bg-[#3fb950] shadow-[0_0_4px_rgba(63,185,80,0.4)]'
                          : 'bg-[#f85149]/60'
                      }`} />

                      {/* Connection info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-[#e6edf3] font-mono truncate">{conn.name}</span>
                          <span className="text-[9px] font-mono text-[#484f58] bg-[rgba(0,212,170,0.06)] px-1 py-px rounded">
                            {cfg?.icon} {conn.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#484f58] font-mono truncate">
                          {conn.type === 'sqlite'
                            ? conn.host
                            : `${conn.host}:${conn.port}/${conn.database}`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {conn.connected ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); disconnectDB(conn.id) }}
                            className="p-1 text-[#30363d] hover:text-[#ffa657] cursor-pointer rounded hover:bg-[rgba(255,166,87,0.1)]"
                            title="Disconnect"
                          >
                            <Unplug size={11} />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); connectDB(conn.id) }}
                            className="p-1 text-[#30363d] hover:text-[#3fb950] cursor-pointer rounded hover:bg-[rgba(63,185,80,0.1)]"
                            title="Connect"
                          >
                            <Plug size={11} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (conn.connected) {
                              addNotification('warning', 'Disconnect before removing')
                            } else {
                              removeDBConnection(conn.id)
                            }
                          }}
                          className="p-1 text-[#30363d] hover:text-[#f85149] cursor-pointer rounded hover:bg-[rgba(248,81,73,0.1)]"
                          title="Remove"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Add connection button */}
                {!showConnectionForm && (
                  <button
                    onClick={() => setShowConnectionForm(true)}
                    className="w-full mt-1 px-2 py-1.5 text-[10px] font-mono text-[#30363d] hover:text-[#00d4aa] cursor-pointer rounded hover:bg-[rgba(0,212,170,0.04)] transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={10} /> Add Connection
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── Tables View ──────────────────────────────────── */}
        {effectiveView === 'tables' && (
          <>
            {/* Table search */}
            <div className="p-2 border-b border-[rgba(0,212,170,0.04)]">
              <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-1 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
                <Search size={12} className="text-[#30363d] shrink-0" />
                <input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter tables..."
                  className="flex-1 bg-transparent text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
                />
              </div>
            </div>

            {dbTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Table2 size={28} className="text-[#00d4aa]/10 mb-3" />
                <p className="text-[12px] text-[#30363d] font-mono">No tables found</p>
                <p className="text-[10px] text-[#30363d] mt-1">Connect to a database to browse tables</p>
              </div>
            ) : (
              <div className="px-2 py-1">
                {filteredTables.map((table) => {
                  const isExpanded = expandedTable === table.name

                  return (
                    <div key={table.name} className="mb-0.5">
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded group"
                        onClick={() => handleTableClick(table.name)}
                      >
                        {/* Expand chevron */}
                        {isExpanded ? (
                          <ChevronDown size={10} className="text-[#484f58] shrink-0" />
                        ) : (
                          <ChevronRight size={10} className="text-[#30363d] group-hover:text-[#484f58] shrink-0" />
                        )}

                        <Table2 size={12} className="text-[#00d4aa]/40 shrink-0" />

                        {/* Table name */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] text-[#e6edf3] font-mono">{table.name}</span>
                          {table.schema && (
                            <span className="text-[9px] text-[#30363d] ml-1.5">{table.schema}</span>
                          )}
                        </div>

                        {/* Row count badge */}
                        <span className="text-[9px] font-mono text-[#484f58] bg-[rgba(0,212,170,0.06)] px-1.5 py-0.5 rounded">
                          {table.rowCount.toLocaleString()} rows
                        </span>

                        {/* Quick select button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectTable(table.name) }}
                          className="p-1 text-[#30363d] hover:text-[#79c0ff] cursor-pointer rounded hover:bg-[rgba(121,192,255,0.1)] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="SELECT * from this table"
                        >
                          <Play size={10} />
                        </button>
                      </div>

                      {/* Schema viewer (expanded) */}
                      {isExpanded && <SchemaViewer table={table} />}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── Query View ───────────────────────────────────── */}
        {effectiveView === 'query' && (
          <div className="flex flex-col h-full">
            {/* SQL Editor */}
            <div className="p-2 border-b border-[rgba(0,212,170,0.08)]">
              <div className="relative">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleExecuteQuery()
                    }
                  }}
                  placeholder="-- Enter SQL query here... (Ctrl+Enter to execute)"
                  className="w-full bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-2 text-[11px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono focus:border-[rgba(0,212,170,0.25)] transition-colors resize-y min-h-[80px] max-h-[200px] leading-relaxed custom-scrollbar"
                  rows={4}
                  spellCheck={false}
                />
              </div>

              {/* Query actions bar */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecuteQuery}
                    disabled={dbQueryRunning || !sqlQuery.trim() || !dbActiveConnection}
                    className={`px-3 py-1 text-[10px] font-mono rounded cursor-pointer transition-colors flex items-center gap-1.5 ${
                      dbQueryRunning
                        ? 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
                        : sqlQuery.trim() && dbActiveConnection
                          ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.18)]'
                          : 'bg-[rgba(0,212,170,0.04)] text-[#30363d] cursor-not-allowed'
                    }`}
                  >
                    {dbQueryRunning ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Play size={10} />
                    )}
                    {dbQueryRunning ? 'Running...' : 'Execute'}
                  </button>

                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-2 py-1 text-[10px] font-mono rounded cursor-pointer transition-colors flex items-center gap-1 ${
                      showHistory
                        ? 'bg-[rgba(0,212,170,0.12)] text-[#00d4aa]'
                        : 'text-[#30363d] hover:text-[#484f58]'
                    }`}
                  >
                    <Clock size={10} />
                    History
                  </button>
                </div>

                {sqlQuery && (
                  <button
                    onClick={() => setSqlQuery('')}
                    className="text-[#30363d] hover:text-[#f85149] cursor-pointer transition-colors"
                    title="Clear query"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Query History dropdown */}
            {showHistory && queryHistory.length > 0 && (
              <div className="border-b border-[rgba(0,212,170,0.08)] max-h-32 overflow-y-auto custom-scrollbar">
                <div className="px-2 py-1">
                  <div className="text-[9px] text-[#30363d] font-mono uppercase tracking-wider mb-1">Recent Queries</div>
                  {queryHistory.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setSqlQuery(q); setShowHistory(false) }}
                      className="w-full text-left px-2 py-1 text-[10px] text-[#484f58] font-mono hover:bg-[rgba(0,212,170,0.04)] rounded cursor-pointer truncate transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Query Results */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              {dbQueryRunning && !dbQueryResult && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={16} className="animate-spin text-[#00d4aa]/30" />
                  <span className="ml-2 text-[11px] text-[#30363d] font-mono">Executing query...</span>
                </div>
              )}

              {dbQueryResult && (
                <div>
                  {/* Results header */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[rgba(0,212,170,0.06)] bg-[#0a0f18]">
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-[#3fb950]">{dbQueryResult.rows.length} row{dbQueryResult.rows.length !== 1 ? 's' : ''}</span>
                      <span className="text-[#30363d]">·</span>
                      <span className="text-[#484f58]">{dbQueryResult.columns.length} column{dbQueryResult.columns.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      <Clock size={9} className="text-[#484f58]" />
                      <span className="text-[#ffa657]">{dbQueryResult.executionTime}ms</span>
                    </div>
                  </div>

                  {/* Results table */}
                  <QueryResults result={dbQueryResult} />
                </div>
              )}

              {!dbQueryRunning && !dbQueryResult && !sqlQuery.trim() && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Server size={28} className="text-[#00d4aa]/10 mb-3" />
                  <p className="text-[12px] text-[#30363d] font-mono">Enter a SQL query to execute</p>
                  <p className="text-[10px] text-[#30363d] mt-1">Use Ctrl+Enter to run</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
