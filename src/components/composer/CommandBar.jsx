import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, CheckCircle, XCircle, AlertTriangle, Clock, Loader2, Trash2 } from 'lucide-react'
import { useComposerStore } from '../../store/useComposerStore'

const STATUS_ICON = {
  success:    <CheckCircle    size={13} className="text-emerald-400 flex-shrink-0" />,
  error:      <XCircle        size={13} className="text-rose-400    flex-shrink-0" />,
  warn:       <AlertTriangle  size={13} className="text-amber-400   flex-shrink-0" />,
  processing: <Loader2        size={13} className="text-brand-300   flex-shrink-0 animate-spin" />,
}

const STATUS_BG = {
  success:    'rgba(16,185,129,0.08)',
  error:      'rgba(239,68,68,0.08)',
  warn:       'rgba(245,158,11,0.08)',
  processing: 'rgba(110,75,255,0.08)',
}

function LogRow({ entry }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-start gap-2 px-3 py-2 rounded-xl"
      style={{ background: STATUS_BG[entry.status] || 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {STATUS_ICON[entry.status] || STATUS_ICON.processing}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 leading-snug truncate">
          <span className="font-medium text-white/90">"{entry.text}"</span>
        </p>
        <p className="text-[10px] text-white/35 mt-0.5 leading-snug">{entry.message}</p>
      </div>
      <span className="text-[9px] text-white/25 flex-shrink-0 flex items-center gap-0.5 pt-0.5">
        <Clock size={8} />{entry.time}
      </span>
    </motion.div>
  )
}

export default function CommandBar() {
  const { commands, isProcessing, aiLog, processCommand, clearLog } = useComposerStore()
  const [input, setInput] = useState('')
  const inputRef = useRef()

  const activeCommands = commands.filter(c => c.active).slice(0, 6)

  const handleSubmit = useCallback(async () => {
    const text = input.trim()
    if (!text || isProcessing) return
    setInput('')
    await processCommand(text)
    inputRef.current?.focus()
  }, [input, isProcessing, processCommand])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const recentLog = aiLog.slice(0, 5)

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col gap-0"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(110,75,255,0.2)', border: '1px solid rgba(110,75,255,0.35)' }}>
            <Sparkles size={14} className="text-brand-300" />
          </div>
          <span className="text-xs font-semibold text-white/70">AI Command</span>
          {isProcessing && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] text-brand-300"
              style={{ background: 'rgba(110,75,255,0.15)', border: '1px solid rgba(110,75,255,0.3)' }}>
              <Loader2 size={10} className="animate-spin" /> AI đang xử lý...
            </motion.div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder="Nhập lệnh AI... vd: Thêm xe thể thao vào background"
            className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-brand-500/60 focus:bg-white/[0.07] transition-all disabled:opacity-50"
          />
          <motion.button whileTap={{ scale: 0.92 }} onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #6e4bff 0%, #4dd0ff 100%)', boxShadow: '0 4px 16px rgba(110,75,255,0.4)' }}>
            {isProcessing ? <Loader2 size={16} className="text-white animate-spin" /> : <Sparkles size={16} className="text-white" />}
          </motion.button>
        </div>

        {activeCommands.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeCommands.map(cmd => (
              <motion.button key={cmd.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setInput(cmd.keyword)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:bg-white/[0.1]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
                <span>{cmd.icon}</span><span>{cmd.keyword}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {recentLog.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 flex flex-col gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between pt-2.5 pb-0.5">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wide">Activity Log</span>
                <button onClick={clearLog} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                  <Trash2 size={9} /> Clear
                </button>
              </div>
              <AnimatePresence mode="popLayout" initial={false}>
                {recentLog.map(entry => <LogRow key={entry.id} entry={entry} />)}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
