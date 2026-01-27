import { clsx } from "clsx"
import React, { useState, useEffect, useRef } from "react"
import {
  Settings as SettingsIcon,
  Book,
  Search as SearchIcon,
  Loader2,
  Trash2,
  ExternalLink,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Sparkles,
  History,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useStorage } from "@plasmohq/storage/hook"

import "../globals.css"

import { sendToBackground } from "@plasmohq/messaging"
import { useSettings } from "../utils/settings"
import { useQuery, useMutation } from "~hooks/use-query"
import { useTranslation } from "~utils/i18n"
import Detail from "~components/detail"

// --- Constants ---
const HISTORY_STORAGE_KEY = "search_history"
const MAX_HISTORY_ITEMS = 10

// --- Components ---

interface WordItemProps {
  word: string
  onUnstar: (word: string) => void
  isUnstarring: boolean
  onClick: (word: string) => void
}

const WordItem: React.FC<WordItemProps> = ({ word, onUnstar, isUnstarring, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        "flex flex-row items-center p-4 mb-3 box-border w-full transition-all duration-300 rounded-2xl cursor-pointer group",
        "bg-surface border border-border hover:border-main/30 hover:shadow-md hover:shadow-main/5",
        isUnstarring && "opacity-50 pointer-events-none"
      )}
      onClick={() => onClick(word)}
    >
      <div className="flex-grow flex flex-col gap-0.5">
        <div className="text-base font-semibold tracking-tight text-text-primary group-hover:text-main transition-colors">
          {word}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className={clsx(
            "p-2 rounded-xl text-text-muted transition-all duration-300",
            "hover:bg-red-500/10 hover:text-red-500",
            "active:scale-90"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onUnstar(word);
          }}
          disabled={isUnstarring}
          title="Remove"
        >
          <Trash2 size={16} />
        </button>
        <ChevronRight size={18} className="text-text-muted/30" />
      </div>
    </motion.div>
  )
}

const WordBookView: React.FC<{ onWordClick: (word: string) => void }> = ({ onWordClick }) => {
  const { t } = useTranslation(['popup', 'common'])
  const [filterKey, setFilterKey] = useState('')
  const [unstarringWord, setUnstarringWord] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery<{ keys: string[] }>(
    ["word-list"],
    async () => {
      return await sendToBackground({ name: "list" })
    }
  )

  const { mutate: unstar } = useMutation<{ code: number; message: string | null }, string>(
    async (wordKey) => {
      return await sendToBackground({
        name: "unstar",
        body: { key: wordKey }
      })
    },
    {
      onSuccess: (response) => {
        setUnstarringWord(null)
        if (response.code === 0) {
          refetch()
        }
      },
      onError: () => setUnstarringWord(null)
    }
  )

  const words = data?.keys ?? []
  const filteredWords = words.filter((word) =>
    word.toLowerCase().includes(filterKey.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-main-soft/30">
      <div className="px-5 pt-6 pb-4">
        <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Book className="text-main" size={24} />
          {t('tabWordBook')}
        </h2>
        <div className="relative group flex items-center">
          <input
            className={clsx(
              "w-full h-11 pl-11 pr-10 rounded-2xl border border-border bg-surface text-text-primary",
              "focus:outline-none focus:ring-4 focus:ring-main/10 focus:border-main transition-all",
              "placeholder:text-text-muted/40 text-sm font-medium"
            )}
            placeholder={t('searchPlaceholder')}
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
          />
          <div className="absolute left-4 flex items-center justify-center pointer-events-none">
            <SearchIcon size={18} className="text-text-muted group-focus-within:text-main transition-colors" />
          </div>
          <AnimatePresence>
            {filterKey && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 flex items-center"
              >
                <button
                  onClick={() => setFilterKey("")}
                  className="p-1 rounded-full text-text-muted hover:bg-main/10 hover:text-main transition-all flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-main/40" />
          </div>
        ) : filteredWords.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredWords.map((word) => (
              <WordItem
                key={word}
                word={word}
                onUnstar={unstar}
                isUnstarring={unstarringWord === word}
                onClick={onWordClick}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface mb-4 flex items-center justify-center border border-border">
              <Book size={28} className="text-text-muted opacity-30" />
            </div>
            <p className="text-sm font-medium text-text-muted italic max-w-[200px]">
              {words.length === 0 ? t('noWordsStarred') : t('noMatchingWords')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const QueryView: React.FC<{ initialWord?: string }> = ({ initialWord }) => {
  const { t } = useTranslation(['popup', 'common', 'detail'])
  const [query, setQuery] = useState(initialWord || '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [history, setHistory] = useStorage<string[]>(HISTORY_STORAGE_KEY, [])
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce the query to avoid firing too many requests while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 400) // 400ms delay

    return () => clearTimeout(handler)
  }, [query])

  const { data, isLoading, refetch, setData } = useQuery<any>(
    ["query-word", debouncedQuery],
    async () => {
      const trimmedQuery = debouncedQuery.trim()
      if (!trimmedQuery) return null

      const response = await sendToBackground({
        name: "query",
        body: { key: trimmedQuery }
      })

      // If query is successful and it's a real word, add to history
      if (response && response.code === 0 && response.meanings?.length > 0) {
        addToHistory(trimmedQuery.toLowerCase())
      }

      return response
    },
    { enabled: !!debouncedQuery.trim() }
  )

  // Clear search results when query is emptied
  useEffect(() => {
    if (!query.trim()) {
      setData(null)
    }
  }, [query, setData])

  const addToHistory = (word: string) => {
    setHistory((prev = []) => {
      const newHistory = [word, ...prev.filter(w => w !== word)].slice(0, MAX_HISTORY_ITEMS)
      return newHistory
    })
  }

  const clearHistory = () => {
    setHistory([])
  }

  const removeFromHistory = (word: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory((prev = []) => prev.filter(w => w !== word))
  }

  useEffect(() => {
    if (initialWord) setQuery(initialWord)
  }, [initialWord])

  useEffect(() => {
    if (!initialWord) {
      inputRef.current?.focus()
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="pt-8 px-6 pb-2">
        <div className="flex items-center gap-2 mb-6 text-main/80">
          <Sparkles size={18} />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Explore Language</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="px-6 mb-4">
        <div className="relative group flex items-center">
          <input
            ref={inputRef}
            className={clsx(
              "w-full h-14 pl-12 pr-12 rounded-3xl border-2 border-border bg-surface text-text-primary text-lg font-semibold",
              "focus:outline-none focus:border-main focus:shadow-[0_0_0_5px_rgba(var(--main),0.1)] transition-all",
              "placeholder:text-text-muted/30 placeholder:font-normal",
              isLoading && "pr-20"
            )}
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute left-4 flex items-center justify-center pointer-events-none">
            <SearchIcon size={24} className="text-text-muted group-focus-within:text-main transition-colors" />
          </div>
          <AnimatePresence>
            {query && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={clsx(
                  "absolute flex items-center",
                  isLoading ? "right-12" : "right-4"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-2 rounded-full text-text-muted hover:bg-main/10 hover:text-main transition-all flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </motion.div>
            )}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-4 flex items-center justify-center"
              >
                <Loader2 size={20} className="animate-spin text-main" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              key={data.key}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="mt-2 glass rounded-3xl p-5 border border-border shadow-sm"
            >
              <Detail text={data.key} data={data} />
            </motion.div>
          ) : !isLoading && !query ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full"
            >
              {history && history.length > 0 ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-text-muted">
                      <History size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest">{t('historyTitle')}</span>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="text-[10px] font-bold text-text-muted hover:text-main transition-colors uppercase tracking-tighter"
                    >
                      {t('clearHistory')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((word) => (
                      <motion.div
                        layout
                        key={word}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-main-soft/30 hover:bg-main hover:text-white border border-main/5 cursor-pointer transition-all duration-300"
                        onClick={() => setQuery(word)}
                      >
                        <span className="text-sm font-medium">{word}</span>
                        <button
                          onClick={(e) => removeFromHistory(word, e)}
                          className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
                        >
                          <X size={10} className="text-inherit opacity-40 group-hover:opacity-100" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-text-muted/30">
                  <div className="relative">
                    <SearchIcon size={80} className="mb-4 opacity-5" />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <SearchIcon size={40} className="text-main/10" />
                    </motion.div>
                  </div>
                  <p className="text-sm font-medium">{t('searchPlaceholder')}</p>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

const SettingsView: React.FC = () => {
  const { t } = useTranslation(['popup', 'common'])
  const [settings, setSettings] = useSettings()

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'auto', icon: Monitor, label: 'Auto' },
  ]

  const openFullOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(chrome.runtime.getURL('options.html'))
    }
  }

  return (
    <div className="flex flex-col h-full bg-main-soft/30 overflow-y-auto custom-scrollbar">
      <div className="px-6 pt-8 pb-6">
        <h2 className="text-2xl font-bold tracking-tight mb-8">{t('tabSettings')}</h2>

        <section className="mb-8">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 block">
            Appearance
          </label>
          <div className="flex p-1 bg-surface border border-border rounded-2xl">
            {themes.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setSettings({ ...settings, theme: id as any })}
                className={clsx(
                  "flex items-center justify-center gap-2 flex-1 py-3 rounded-xl transition-all",
                  settings.theme === id
                    ? "bg-main text-white shadow-lg shadow-main/20"
                    : "text-text-muted hover:text-text-primary hover:bg-main/5"
                )}
              >
                <Icon size={18} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <button
            onClick={openFullOptions}
            className={clsx(
              "w-full flex items-center justify-between p-5 rounded-2xl border border-border shadow-sm",
              "bg-surface hover:border-main/50 transition-all group"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-main/10 flex items-center justify-center text-main group-hover:bg-main group-hover:text-white transition-colors">
                <SettingsIcon size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Preferences</div>
                <div className="text-xs text-text-muted">Configure shortcuts and API</div>
              </div>
            </div>
            <ExternalLink size={16} className="text-text-muted/40 group-hover:text-main" />
          </button>

          <div className="p-5 rounded-2xl border border-border bg-surface text-center opacity-40">
            <div className="text-[10px] font-medium tracking-widest text-text-muted uppercase">Version 0.1.0 (Alpha)</div>
          </div>
        </section>
      </div>
    </div>
  )
}

// --- Main App ---

function Index() {
  const { t } = useTranslation('popup')
  const [activeTab, setActiveTab] = useState<'search' | 'wordbook' | 'settings'>('search')
  const [selectedWord, setSelectedWord] = useState<string | undefined>()
  const [settings] = useSettings()

  useEffect(() => {
    const isDark = settings.theme === "dark" ||
      (settings.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, [settings.theme])

  const handleWordClick = (word: string) => {
    setSelectedWord(word)
    setActiveTab('search')
  }

  const tabs = [
    { id: 'search', icon: SearchIcon, label: t('tabSearch') },
    { id: 'wordbook', icon: Book, label: t('tabWordBook') },
    { id: 'settings', icon: SettingsIcon, label: t('tabSettings') },
  ] as const

  return (
    <div
      className={clsx(
        "flex flex-col w-[380px] h-[580px]",
        "bg-surface text-text-primary selection:bg-main/20 selection:text-main transition-colors duration-300 overflow-hidden"
      )}
    >
      {/* Main Content Container */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <QueryView initialWord={selectedWord} />
            </motion.div>
          )}
          {activeTab === 'wordbook' && (
            <motion.div
              key="wordbook"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <WordBookView onWordClick={handleWordClick} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modern Floating Bottom Nav */}
      <div className="px-6 pb-6 pt-2 bg-surface">
        <nav className="flex items-center justify-between p-1.5 rounded-[24px] bg-main-soft/50 border border-main/10 backdrop-blur-xl">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id)
                if (id !== 'search') setSelectedWord(undefined)
              }}
              className={clsx(
                "relative flex flex-col items-center justify-center flex-1 py-2.5 px-2 rounded-[18px] transition-all duration-500",
                activeTab === id ? "bg-surface shadow-[0_4px_12px_rgba(var(--main),0.1)]" : "hover:bg-main/5 text-text-muted hover:text-text-primary"
              )}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="active-bg"
                  className="absolute inset-0 bg-surface rounded-[18px]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon size={18} className={clsx("transition-transform duration-300", activeTab === id ? "text-main scale-110" : "text-text-muted")} />
                <span className={clsx(
                  "text-[9px] font-bold uppercase tracking-wider transition-colors duration-300",
                  activeTab === id ? "text-main" : "text-text-muted"
                )}>
                  {label}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default Index
