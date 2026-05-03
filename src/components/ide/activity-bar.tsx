'use client'

import { memo, useCallback } from 'react'
import {
  Files,
  Search,
  GitBranch,
  Bot,
  GitFork,
  Blocks,
  CheckSquare,
  Settings,
  Container,
  Database,
  Users,
  Code2,
  Mic,
  Palette,
  LayoutGrid,
  PenTool,
  Terminal,
} from 'lucide-react'
import { useIDEStore, type SidebarPanel } from '@/store/ide-store'
import { colors, typography } from '@/components/hud/tokens'

// ─── Activity Item Types ─────────────────────────────────────

interface ActivityItem {
  id: SidebarPanel
  icon: typeof Files
  label: string
}

interface ActivityGroup {
  name: string
  items: ActivityItem[]
}

// ─── Group Definitions ───────────────────────────────────────

const activityGroups: ActivityGroup[] = [
  {
    name: 'Workspace',
    items: [
      { id: 'explorer', icon: Files, label: 'Explorer' },
      { id: 'search', icon: Search, label: 'Search' },
      { id: 'git', icon: GitBranch, label: 'Source Control' },
    ],
  },
  {
    name: 'Agents',
    items: [
      { id: 'ai', icon: Bot, label: 'AI Assistant' },
      { id: 'todos', icon: CheckSquare, label: 'TODOs' },
      { id: 'canvas', icon: LayoutGrid, label: 'Canvas Navigation' },
      { id: 'whiteboard', icon: PenTool, label: 'Whiteboard' },
    ],
  },
  {
    name: 'Runtime',
    items: [
      { id: 'docker', icon: Container, label: 'Docker' },
      { id: 'database', icon: Database, label: 'Database' },
      { id: 'lsp', icon: Code2, label: 'Language Servers' },
      { id: 'terminal', icon: Terminal, label: 'Terminal' },
    ],
  },
  {
    name: 'Integrations',
    items: [
      { id: 'github', icon: GitFork, label: 'GitHub' },
      { id: 'extensions', icon: Blocks, label: 'Extensions' },
      { id: 'collaboration', icon: Users, label: 'Collaboration' },
      { id: 'voice', icon: Mic, label: 'Voice-to-Code' },
      { id: 'themes', icon: Palette, label: 'Themes' },
    ],
  },
]

// ─── Separator Component ─────────────────────────────────────

function GroupSeparator() {
  return (
    <div
      className="w-6 my-1"
      style={{
        height: '1px',
        backgroundColor: colors.border.muted,
      }}
      role="separator"
    />
  )
}

// ─── Activity Button Component ───────────────────────────────

interface ActivityButtonProps {
  item: ActivityItem
  groupName: string
  isActive: boolean
  showBadge: boolean
  badgeCount: number
  showConnectedDot: boolean
  onClick: () => void
}

const ActivityButton = memo(function ActivityButton({
  item,
  groupName,
  isActive,
  showBadge,
  badgeCount,
  showConnectedDot,
  onClick,
}: ActivityButtonProps) {
  const Icon = item.icon
  const ariaLabel = `${item.label} - ${groupName}`

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
    [onClick]
  )

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      title={item.label}
      className="relative w-full h-11 flex items-center justify-center transition-colors cursor-pointer group"
      style={{
        color: isActive ? colors.accent.DEFAULT : colors.text.disabled,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = colors.text.dim
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = isActive ? colors.accent.DEFAULT : colors.text.disabled
      }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
          style={{
            width: '2px',
            height: '20px',
            backgroundColor: colors.accent.DEFAULT,
          }}
        />
      )}

      {/* Icon */}
      <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />

      {/* Badge */}
      {showBadge && (
        <div
          className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full px-0.5"
          style={{
            minWidth: '14px',
            height: '14px',
            backgroundColor: colors.accent.DEFAULT,
            color: colors.bg.root,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
          }}
          aria-label={`${badgeCount} pending tasks`}
        >
          {badgeCount > 9 ? '9+' : badgeCount}
        </div>
      )}

      {/* Connected dot */}
      {showConnectedDot && !showBadge && (
        <div
          className="absolute top-1.5 right-1.5 rounded-full animate-pulse"
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: colors.success.DEFAULT,
          }}
        />
      )}

      {/* Custom tooltip */}
      <div
        className="absolute left-14 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
        style={{
          backgroundColor: colors.bg.elevated,
          color: colors.text.primary,
          border: `1px solid ${colors.border.active}`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.6)`,
          zIndex: 80,
        }}
        role="tooltip"
      >
        {item.label}
      </div>
    </button>
  )
})

// ─── Main Activity Bar Component ─────────────────────────────

export const ActivityBar = memo(function ActivityBar() {
  const activeSidebarPanel = useIDEStore((s) => s.activeSidebarPanel)
  const setActiveSidebarPanel = useIDEStore((s) => s.setActiveSidebarPanel)
  const todos = useIDEStore((s) => s.todos)
  const pendingTodos = todos.filter((t) => !t.completed).length
  const collabConnected = useIDEStore((s) => s.collabConnected)
  const dockerConnected = useIDEStore((s) => s.dockerConnected)
  const voiceListening = useIDEStore((s) => s.voiceListening)

  const isSettingsActive = activeSidebarPanel === 'settings'

  const handleSettingsKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setActiveSidebarPanel('settings')
      }
    },
    [setActiveSidebarPanel]
  )

  return (
    <nav
      className="flex flex-col items-center w-12 py-2 shrink-0 overflow-y-auto custom-scrollbar"
      style={{
        backgroundColor: colors.bg.base,
        borderRight: `1px solid ${colors.border.default}`,
      }}
      aria-label="Activity bar"
    >
      {/* Grouped activity items */}
      {activityGroups.map((group, groupIndex) => (
        <div key={group.name} className="flex flex-col items-center w-full">
          {groupIndex > 0 && <GroupSeparator />}
          {group.items.map((item) => {
            const isActive = activeSidebarPanel === item.id
            const showBadge = item.id === 'todos' && pendingTodos > 0
            const showConnectedDot =
              (item.id === 'collaboration' && collabConnected) ||
              (item.id === 'docker' && dockerConnected) ||
              (item.id === 'voice' && voiceListening)

            return (
              <ActivityButton
                key={item.id}
                item={item}
                groupName={group.name}
                isActive={isActive}
                showBadge={showBadge}
                badgeCount={pendingTodos}
                showConnectedDot={showConnectedDot}
                onClick={() => setActiveSidebarPanel(item.id)}
              />
            )
          })}
        </div>
      ))}

      {/* Settings — pinned to bottom */}
      <div className="mt-auto">
        <GroupSeparator />
        <button
          onClick={() => setActiveSidebarPanel('settings')}
          onKeyDown={handleSettingsKeyDown}
          tabIndex={0}
          aria-pressed={isSettingsActive}
          aria-label="Settings - Settings"
          title="Settings"
          className="w-full h-11 flex items-center justify-center transition-colors cursor-pointer"
          style={{
            color: isSettingsActive ? colors.accent.DEFAULT : colors.text.disabled,
          }}
          onMouseEnter={(e) => {
            if (!isSettingsActive) e.currentTarget.style.color = colors.text.dim
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isSettingsActive ? colors.accent.DEFAULT : colors.text.disabled
          }}
        >
          {isSettingsActive && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
              style={{
                width: '2px',
                height: '20px',
                backgroundColor: colors.accent.DEFAULT,
              }}
            />
          )}
          <Settings size={20} strokeWidth={isSettingsActive ? 2 : 1.5} />
        </button>
      </div>
    </nav>
  )
})
