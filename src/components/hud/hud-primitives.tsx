'use client'

/**
 * AICodeStudio HUD Primitives
 *
 * Reusable UI primitives for the agent-first IDE shell.
 * All components reference the design token system via
 * consistent Tailwind classes and CSS custom properties.
 */

import { type ReactNode, type HTMLAttributes, forwardRef } from 'react'
import { colors, radius, typography } from './tokens'

// ─── HUDShell ─────────────────────────────────────────────────
// Root layout wrapper for the entire IDE

export function HUDShell({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: colors.bg.root }}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── HUDTopBar ────────────────────────────────────────────────
// Mission/title bar at the top of the IDE

export function HUDTopBar({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="h-9 flex items-center justify-between px-3 shrink-0 select-none"
      style={{
        background: colors.bg.base,
        borderBottom: `1px solid ${colors.border.default}`,
      }}
      role="banner"
      {...props}
    >
      {children}
    </div>
  )
}

// ─── HUDPanel ─────────────────────────────────────────────────
// Generic panel container (sidebar, bottom, etc.)

interface HUDPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'sidebar' | 'bottom' | 'surface' | 'elevated'
}

export const HUDPanel = forwardRef<HTMLDivElement, HUDPanelProps>(
  function HUDPanel({ variant = 'surface', children, style, ...props }, ref) {
    const bgMap = {
      sidebar: colors.bg.panel,
      bottom: colors.bg.surface,
      surface: colors.bg.surface,
      elevated: colors.bg.elevated,
    }

    return (
      <div
        ref={ref}
        className="flex flex-col overflow-hidden"
        style={{
          background: bgMap[variant],
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

// ─── HUDSectionHeader ─────────────────────────────────────────
// Section header used in sidebar panels, bottom tabs, etc.

interface HUDSectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  actions?: ReactNode
}

export function HUDSectionHeader({ title, actions, children, ...props }: HUDSectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 shrink-0"
      style={{
        borderBottom: `1px solid ${colors.border.default}`,
        background: colors.bg.base,
      }}
      {...props}
    >
      <span
        className="uppercase tracking-wider font-semibold"
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.dim,
          fontFamily: typography.fontFamily.mono,
        }}
      >
        {title}
      </span>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
      {children}
    </div>
  )
}

// ─── HUDIconButton ────────────────────────────────────────────
// Small icon button for toolbar/actions

interface HUDIconButtonProps extends HTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: 'default' | 'accent' | 'danger'
  size?: 'sm' | 'md'
}

export function HUDIconButton({
  label,
  variant = 'default',
  size = 'md',
  children,
  className = '',
  style,
  ...props
}: HUDIconButtonProps) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'
  const colorMap = {
    default: {
      color: colors.text.dim,
      hoverColor: colors.text.secondary,
    },
    accent: {
      color: colors.accent.DEFAULT,
      hoverColor: colors.accent.DEFAULT,
    },
    danger: {
      color: colors.text.dim,
      hoverColor: colors.danger.DEFAULT,
    },
  }
  const c = colorMap[variant]

  return (
    <button
      aria-label={label}
      title={label}
      className={`
        inline-flex items-center justify-center shrink-0
        transition-colors cursor-pointer
        hover:bg-[rgba(0,212,170,0.06)]
        focus-visible:outline focus-visible:outline-1
        ${sizeClasses} ${className}
      `}
      style={{
        color: c.color,
        borderRadius: radius.md,
        outlineColor: colors.border.focus,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── HUDBadge ─────────────────────────────────────────────────
// Small badge for counts, status indicators

interface HUDBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

export function HUDBadge({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  style,
  ...props
}: HUDBadgeProps) {
  const colorMap = {
    default: { bg: colors.bg.elevated, color: colors.text.dim },
    accent:  { bg: colors.accent.dim, color: colors.accent.DEFAULT },
    success: { bg: colors.success.dim, color: colors.success.DEFAULT },
    warning: { bg: colors.warning.dim, color: colors.warning.DEFAULT },
    danger:  { bg: colors.danger.dim, color: colors.danger.DEFAULT },
    info:    { bg: colors.info.dim, color: colors.info.DEFAULT },
  }
  const c = colorMap[variant]
  const sizeStyles = size === 'sm'
    ? { fontSize: typography.fontSize.xs, padding: '0 4px', minHeight: '14px' }
    : { fontSize: typography.fontSize.sm, padding: '0 6px', minHeight: '16px' }

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold ${className}`}
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: radius.md,
        fontFamily: typography.fontFamily.mono,
        lineHeight: '1',
        ...sizeStyles,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}

// ─── AgentStatusChip ──────────────────────────────────────────
// Status chip for agent/runtime status display

interface AgentStatusChipProps extends HTMLAttributes<HTMLDivElement> {
  status: 'active' | 'idle' | 'waiting' | 'error' | 'off' | 'simulated' | 'unavailable'
  label?: string
  size?: 'sm' | 'md'
}

export function AgentStatusChip({
  status,
  label,
  size = 'sm',
  className = '',
  style,
  ...props
}: AgentStatusChipProps) {
  const statusConfig = {
    active:      { color: colors.success.DEFAULT, bg: colors.success.dim, text: 'Active' },
    idle:        { color: colors.accent.DEFAULT,  bg: colors.accent.dim,  text: 'Idle' },
    waiting:     { color: colors.warning.DEFAULT, bg: colors.warning.dim, text: 'Waiting' },
    error:       { color: colors.danger.DEFAULT,  bg: colors.danger.dim,  text: 'Error' },
    off:         { color: colors.text.dim,        bg: 'transparent',      text: 'Off' },
    simulated:   { color: colors.warning.DEFAULT, bg: colors.warning.dim, text: 'Simulated' },
    unavailable: { color: colors.text.disabled,   bg: 'transparent',      text: 'N/A' },
  }
  const cfg = statusConfig[status]
  const isSm = size === 'sm'
  const fontSize = isSm ? typography.fontSize.xs : typography.fontSize.sm

  return (
    <div
      className={`inline-flex items-center gap-1 font-mono ${className}`}
      style={{
        background: cfg.bg,
        color: cfg.color,
        borderRadius: radius.md,
        fontSize,
        padding: isSm ? '1px 6px' : '2px 8px',
        lineHeight: '1.4',
        ...style,
      }}
      {...props}
    >
      <span
        className="shrink-0 rounded-full"
        style={{
          width: isSm ? '5px' : '6px',
          height: isSm ? '5px' : '6px',
          background: cfg.color,
        }}
      />
      <span>{label || cfg.text}</span>
    </div>
  )
}

// ─── RuntimeHealthChip ────────────────────────────────────────
// Compact chip for runtime health indicators

interface RuntimeHealthChipProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  status: 'enabled' | 'disabled' | 'simulated' | 'unavailable'
}

export function RuntimeHealthChip({
  name,
  status,
  className = '',
  style,
  ...props
}: RuntimeHealthChipProps) {
  const statusMap = {
    enabled:     AgentStatusChip,
    simulated:   AgentStatusChip,
    disabled:    AgentStatusChip,
    unavailable: AgentStatusChip,
  }
  const chipStatusMap = {
    enabled: 'active' as const,
    simulated: 'simulated' as const,
    disabled: 'off' as const,
    unavailable: 'unavailable' as const,
  }

  return (
    <div
      className={`flex items-center justify-between ${className}`}
      style={{
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.mono,
        color: colors.text.secondary,
        ...style,
      }}
      {...props}
    >
      <span className="capitalize">{name}</span>
      <AgentStatusChip status={chipStatusMap[status]} size="sm" />
    </div>
  )
}

// ─── ToolPermissionBadge ──────────────────────────────────────
// Badge for agent tool permissions (read/write/shell/etc.)

interface ToolPermissionBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  permission: string
  granted: boolean
}

export function ToolPermissionBadge({
  permission,
  granted,
  className = '',
  style,
  ...props
}: ToolPermissionBadgeProps) {
  return (
    <HUDBadge
      variant={granted ? 'accent' : 'default'}
      size="sm"
      className={className}
      style={{
        opacity: granted ? 1 : 0.5,
        ...style,
      }}
      {...props}
    >
      {granted ? permission : `${permission}:off`}
    </HUDBadge>
  )
}

// ─── AgentActivityRow ─────────────────────────────────────────
// Row in the agent activity timeline

interface AgentActivityRowProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  label: string
  time?: string
  status?: 'success' | 'error' | 'pending'
}

export function AgentActivityRow({
  icon,
  label,
  time,
  status,
  className = '',
  style,
  ...props
}: AgentActivityRowProps) {
  const statusColor = status === 'success'
    ? colors.success.DEFAULT
    : status === 'error'
      ? colors.danger.DEFAULT
      : colors.text.dim

  return (
    <div
      className={`flex items-center gap-2 py-0.5 ${className}`}
      style={{
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.mono,
        ...style,
      }}
      {...props}
    >
      {icon && (
        <span style={{ color: statusColor, width: '14px', display: 'inline-flex', justifyContent: 'center' }}>
          {icon}
        </span>
      )}
      {!icon && (
        <span
          className="shrink-0 rounded-full"
          style={{ width: '4px', height: '4px', background: statusColor }}
        />
      )}
      <span style={{ color: colors.text.muted, flex: 1 }}>{label}</span>
      {time && <span style={{ color: colors.text.disabled, fontSize: typography.fontSize.xs }}>{time}</span>}
    </div>
  )
}

// ─── HUDSeparator ─────────────────────────────────────────────
// Thin separator line

export function HUDSeparator({
  orientation = 'horizontal',
  className = '',
  ...props
}: { orientation?: 'horizontal' | 'vertical' } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`shrink-0 ${className}`}
      style={{
        background: colors.border.default,
        ...(orientation === 'horizontal'
          ? { height: '1px', width: '100%' }
          : { width: '1px', height: '100%' }),
      }}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  )
}
