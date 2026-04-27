'use client'

import { useState, useCallback } from 'react'
import { Search, X, ChevronDown, File, Folder } from 'lucide-react'
import { useIDEStore, type SearchResult } from '@/store/ide-store'

export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setRegex] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const searchInFiles = useIDEStore((s) => s.searchInFiles)
  const openFile = useIDEStore((s) => s.openFile)
  const fileContents = useIDEStore((s) => s.fileContents)

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)

    // Small timeout to avoid blocking UI on large searches
    setTimeout(() => {
      if (useRegex) {
        try {
          const regex = new RegExp(query, caseSensitive ? 'g' : 'gi')
          const found: SearchResult[] = []
          Object.entries(fileContents).forEach(([filePath, content]) => {
            const lines = content.split('\n')
            lines.forEach((line, index) => {
              if (regex.test(line)) {
                found.push({
                  filePath,
                  fileName: filePath.split('/').pop() || filePath,
                  line: index + 1,
                  column: 1,
                  text: line.trim().substring(0, 120),
                })
              }
              regex.lastIndex = 0
            })
          })
          setResults(found.slice(0, 200))
        } catch {
          setResults([])
        }
      } else {
        let searchQuery = query
        if (wholeWord) {
          searchQuery = `\\b${searchQuery}\\b`
        }
        const found = searchInFiles(caseSensitive ? searchQuery : searchQuery.toLowerCase())
        // If case-insensitive, do our own filtering since store does toLowerCase
        if (!caseSensitive) {
          setResults(found.slice(0, 200))
        } else {
          const caseResults: SearchResult[] = []
          Object.entries(fileContents).forEach(([filePath, content]) => {
            const lines = content.split('\n')
            lines.forEach((line, index) => {
              if (line.includes(query)) {
                caseResults.push({
                  filePath,
                  fileName: filePath.split('/').pop() || filePath,
                  line: index + 1,
                  column: line.indexOf(query) + 1,
                  text: line.trim().substring(0, 120),
                })
              }
            })
          })
          setResults(caseResults.slice(0, 200))
        }
      }
      setIsSearching(false)
    }, 50)
  }, [query, caseSensitive, wholeWord, useRegex, searchInFiles, fileContents])

  const handleResultClick = (result: SearchResult) => {
    openFile(result.filePath)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#30363d] border-b border-[rgba(0,212,170,0.08)]">
        <span>Search</span>
        {results.length > 0 && (
          <span className="text-[10px] text-[#30363d] font-mono">{results.length} results</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[rgba(0,212,170,0.08)] rounded px-3 py-1.5 focus-within:border-[rgba(0,212,170,0.25)] transition-colors">
          <Search size={14} className="text-[#30363d] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in files..."
            className="flex-1 bg-transparent text-[13px] text-[#e6edf3] placeholder-[#30363d] outline-none font-mono"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }} className="text-[#30363d] hover:text-[#6e7681] cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#30363d]">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`flex items-center gap-1 transition-colors cursor-pointer ${caseSensitive ? 'text-[#00d4aa]' : 'hover:text-[#484f58]'}`}
          >
            <ChevronDown size={10} />
            <span>Aa</span>
          </button>
          <button
            onClick={() => setWholeWord(!wholeWord)}
            className={`transition-colors cursor-pointer ${wholeWord ? 'text-[#00d4aa]' : 'hover:text-[#484f58]'}`}
          >
            W
          </button>
          <button
            onClick={() => setRegex(!useRegex)}
            className={`transition-colors cursor-pointer ${useRegex ? 'text-[#00d4aa]' : 'hover:text-[#484f58]'}`}
          >
            .*
          </button>
          <button
            onClick={performSearch}
            disabled={!query.trim() || isSearching}
            className="ml-auto text-[#00d4aa]/60 hover:text-[#00d4aa] disabled:text-[#30363d] transition-colors cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {isSearching && (
          <div className="text-center py-4 text-[12px] text-[#30363d] font-mono">Searching...</div>
        )}
        {!isSearching && query && results.length === 0 && (
          <div className="text-center py-4 text-[12px] text-[#30363d] font-mono">No results found</div>
        )}
        {!isSearching && results.length > 0 && results.map((r, i) => (
          <div
            key={`${r.filePath}-${r.line}-${i}`}
            onClick={() => handleResultClick(r)}
            className="px-2 py-1.5 hover:bg-[rgba(0,212,170,0.04)] cursor-pointer transition-colors rounded"
          >
            <div className="flex items-center gap-2 text-[12px]">
              <File size={10} className="text-[#30363d] shrink-0" />
              <span className="text-[#6e7681] font-mono">{r.fileName}</span>
              <span className="text-[#30363d]">:{r.line}</span>
              <span className="text-[#30363d]">:{r.column}</span>
            </div>
            <div className="text-[11px] text-[#484f58] font-mono mt-0.5 pl-5">
              {highlightMatch(r.text, query)}
            </div>
          </div>
        ))}
        {!query && (
          <div className="text-center py-8 text-[12px] text-[#30363d] font-mono">
            <Search size={24} className="mx-auto mb-2 text-[#30363d]/40" />
            <p>Type a search query and press Enter</p>
            <p className="text-[10px] mt-1">Searches through all open files in your workspace</p>
          </div>
        )}
      </div>
    </div>
  )
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  if (index === -1) return text

  return (
    <>
      {text.substring(0, index)}
      <span className="bg-[rgba(0,212,170,0.15)] text-[#00d4aa]">{text.substring(index, index + query.length)}</span>
      {text.substring(index + query.length)}
    </>
  )
}
