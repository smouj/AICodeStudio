'use client'

import { useIDEStore, type EditorSettings } from '@/store/ide-store'
import { Settings, RotateCcw } from 'lucide-react'
import { RuntimeStatus } from './runtime-status'

export function SettingsPanel() {
  const editorSettings = useIDEStore((s) => s.editorSettings)
  const updateEditorSettings = useIDEStore((s) => s.updateEditorSettings)
  const addNotification = useIDEStore((s) => s.addNotification)

  const handleReset = () => {
    const defaults: EditorSettings = {
      fontSize: 13,
      tabSize: 2,
      minimap: true,
      wordWrap: 'off',
      autoSave: true,
      fontLigatures: true,
      lineNumbers: 'on',
      bracketPairColorization: true,
      theme: 'dark',
    }
    updateEditorSettings(defaults)
    addNotification('info', 'Settings reset to defaults.')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Settings</span>
        <button
          onClick={handleReset}
          className="text-[#30363d] hover:text-[#00d4aa] transition-colors cursor-pointer flex items-center gap-1"
          title="Reset to defaults"
        >
          <RotateCcw size={10} />
          <span className="text-[10px]">Reset</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="text-[13px] text-[#e6edf3] font-mono mb-4 flex items-center gap-2">
          <Settings size={14} className="text-[#00d4aa]/50" />
          Editor Preferences
        </div>

        <div className="space-y-4">
          {/* Font Size */}
          <SettingRow label="Font Size">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={24}
                value={editorSettings.fontSize}
                onChange={(e) => updateEditorSettings({ fontSize: parseInt(e.target.value) })}
                className="w-20 accent-[#00d4aa]"
              />
              <span className="text-[12px] text-[#00d4aa] font-mono w-8">{editorSettings.fontSize}px</span>
            </div>
          </SettingRow>

          {/* Tab Size */}
          <SettingRow label="Tab Size">
            <select
              value={editorSettings.tabSize}
              onChange={(e) => updateEditorSettings({ tabSize: parseInt(e.target.value) })}
              className="bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-0.5 text-[12px] text-[#e6edf3] font-mono outline-none cursor-pointer"
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </SettingRow>

          {/* Minimap */}
          <SettingRow label="Minimap">
            <ToggleSwitch
              checked={editorSettings.minimap}
              onChange={(val) => updateEditorSettings({ minimap: val })}
            />
          </SettingRow>

          {/* Word Wrap */}
          <SettingRow label="Word Wrap">
            <select
              value={editorSettings.wordWrap}
              onChange={(e) => updateEditorSettings({ wordWrap: e.target.value as EditorSettings['wordWrap'] })}
              className="bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-0.5 text-[12px] text-[#e6edf3] font-mono outline-none cursor-pointer"
            >
              <option value="off">Off</option>
              <option value="on">On</option>
              <option value="wordWrapColumn">Wrap Column</option>
            </select>
          </SettingRow>

          {/* Auto Save */}
          <SettingRow label="Auto Save">
            <ToggleSwitch
              checked={editorSettings.autoSave}
              onChange={(val) => updateEditorSettings({ autoSave: val })}
            />
          </SettingRow>

          {/* Font Ligatures */}
          <SettingRow label="Font Ligatures">
            <ToggleSwitch
              checked={editorSettings.fontLigatures}
              onChange={(val) => updateEditorSettings({ fontLigatures: val })}
            />
          </SettingRow>

          {/* Line Numbers */}
          <SettingRow label="Line Numbers">
            <select
              value={editorSettings.lineNumbers}
              onChange={(e) => updateEditorSettings({ lineNumbers: e.target.value as EditorSettings['lineNumbers'] })}
              className="bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-0.5 text-[12px] text-[#e6edf3] font-mono outline-none cursor-pointer"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="relative">Relative</option>
            </select>
          </SettingRow>

          {/* Bracket Pair Colorization */}
          <SettingRow label="Bracket Pairs">
            <ToggleSwitch
              checked={editorSettings.bracketPairColorization}
              onChange={(val) => updateEditorSettings({ bracketPairColorization: val })}
            />
          </SettingRow>

          {/* Theme */}
          <SettingRow label="Color Theme">
            <select
              value={editorSettings.theme}
              onChange={(e) => updateEditorSettings({ theme: e.target.value as EditorSettings['theme'] })}
              className="bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-2 py-0.5 text-[12px] text-[#e6edf3] font-mono outline-none cursor-pointer"
            >
              <option value="dark">Dark (AICodeStudio)</option>
              <option value="light">Light</option>
            </select>
          </SettingRow>
        </div>

        <div className="mt-6 pt-4 border-t border-[rgba(0,212,170,0.06)]">
          <RuntimeStatus />
        </div>

        <div className="mt-4 pt-3 border-t border-[rgba(0,212,170,0.06)]">
          <div className="text-[11px] text-[#30363d] font-mono">
            Settings are applied immediately to the editor.
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#6e7681] font-mono">{label}</span>
      {children}
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        w-8 h-4 rounded-full transition-colors cursor-pointer relative
        ${checked ? 'bg-[#00d4aa]/30' : 'bg-[#30363d]'}
      `}
      role="switch"
      aria-checked={checked}
    >
      <div className={`
        w-3 h-3 rounded-full transition-all absolute top-0.5
        ${checked ? 'left-4.5 bg-[#00d4aa]' : 'left-0.5 bg-[#484f58]'}
      `} />
    </button>
  )
}
