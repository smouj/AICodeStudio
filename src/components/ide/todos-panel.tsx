'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Trash2, Plus, Zap, Filter, User, Bot } from 'lucide-react'
import { useIDEStore } from '@/store/ide-store'

export function TodosPanel() {
  const { todos, addTodo, toggleTodo, removeTodo, clearCompletedTodos } = useIDEStore()
  const [newTodo, setNewTodo] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const pendingCount = todos.filter((t) => !t.completed).length
  const completedCount = todos.filter((t) => t.completed).length

  const priorityStyles = {
    high: 'border-l-[#ff6b6b] bg-[#ff6b6b]/5',
    medium: 'border-l-[#ffd93d] bg-[#ffd93d]/5',
    low: 'border-l-[#6bcb77] bg-[#6bcb77]/5',
  }

  const priorityDots = {
    high: 'bg-[#ff6b6b]',
    medium: 'bg-[#ffd93d]',
    low: 'bg-[#6bcb77]',
  }

  const handleAdd = () => {
    if (!newTodo.trim()) return
    addTodo(newTodo.trim(), newPriority, 'user')
    setNewTodo('')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#484f58] border-b border-white/[0.06]">
        <span>TODOs</span>
        <span className="text-white/40 font-mono text-[10px]">{pendingCount} pending</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.03]">
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <Circle size={8} className="text-white" />
          <span className="text-[#e6edf3]">{pendingCount}</span>
          <span className="text-[#3d4450]">pending</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <CheckCircle2 size={8} className="text-[#3fb950]" />
          <span className="text-[#e6edf3]">{completedCount}</span>
          <span className="text-[#3d4450]">done</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/[0.03]">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
              filter === f ? 'bg-white/[0.06] text-white' : 'text-[#3d4450] hover:text-[#484f58]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {completedCount > 0 && (
          <button
            onClick={clearCompletedTodos}
            className="ml-auto text-[10px] font-mono text-[#3d4450] hover:text-[#ff6b6b] transition-colors cursor-pointer"
          >
            Clear done
          </button>
        )}
      </div>

      {/* Add TODO */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#0d1117] border border-white/[0.08] rounded px-3 py-1.5 focus-within:border-white/[0.15] transition-colors">
            <Plus size={12} className="text-[#3d4450] shrink-0" />
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Add a task..."
              className="flex-1 bg-transparent text-[12px] text-[#e6edf3] placeholder-[#3d4450] outline-none font-mono"
            />
          </div>
          <div className="flex items-center gap-1">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                  priorityDots[p]
                } ${newPriority === p ? 'ring-2 ring-offset-1 ring-offset-[#0d1117] ring-white/50 scale-110' : 'opacity-40 hover:opacity-70'}`}
                title={`${p} priority`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* TODO List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 custom-scrollbar">
        {filteredTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#3d4450] text-center py-8">
            <CheckCircle2 size={32} className="mb-2 text-white/20" />
            <p className="text-[12px] font-mono">
              {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
            </p>
            <p className="text-[10px] mt-1">Add a task or ask the AI agent</p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-start gap-2 px-2 py-2 border-l-2 rounded-r mb-0.5 transition-colors group ${priorityStyles[todo.priority]} ${
                todo.completed ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className="mt-0.5 shrink-0 cursor-pointer transition-colors"
              >
                {todo.completed ? (
                  <CheckCircle2 size={14} className="text-[#3fb950]" />
                ) : (
                  <Circle size={14} className="text-[#484f58] hover:text-white" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-[12px] font-mono leading-tight ${todo.completed ? 'line-through text-[#484f58]' : 'text-[#e6edf3]'}`}>
                  {todo.text}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${priorityDots[todo.priority]}`} />
                  <span className="text-[9px] text-[#3d4450] font-mono uppercase">{todo.priority}</span>
                  {todo.source && (
                    <span className="flex items-center gap-0.5 text-[9px] text-[#3d4450]">
                      {todo.source === 'agent' ? <Bot size={8} /> : <User size={8} />}
                      {todo.source}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-[#3d4450] hover:text-[#ff6b6b] transition-all shrink-0 cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Agent Hint */}
      <div className="px-3 py-2 border-t border-white/[0.03]">
        <div className="flex items-center gap-1.5 text-[10px] text-[#3d4450] font-mono">
          <Zap size={10} className="text-white/50" />
          <span>AI agent tasks appear here automatically</span>
        </div>
      </div>
    </div>
  )
}
