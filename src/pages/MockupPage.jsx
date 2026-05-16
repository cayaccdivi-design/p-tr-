import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import {
  Upload, Wand2, Download, Trash2, Sparkles, Image as ImageIcon,
  Layers, ChevronRight, Check, RotateCcw, ZoomIn,
} from 'lucide-react'
import { useMockupStore, computePlacement } from '../store/useMockupStore'
import { useAppStore } from '../store/useAppStore'
import MockupCanvas from '../components/mockup/MockupCanvas'

/* ─── Design tokens ─────────────────────────────────────────────── */
const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}
function getImageSize(url) {
  return new Promise(res => {
    const img = new Image()
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => res({ w: 1200, h: 800 })
    img.src = url
  })
}

/* ─── Upload Zone ───────────────────────────────────────────────── */
function UploadZone({ label, accept, onFile, preview, icon: Icon, hint }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handle = useCallback(async (f) => {
    if (!f) return
    const url = await readFileAsDataURL(f)
    onFile(url, f)
  }, [onFile])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        'relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden flex flex-col items-center justify-center gap-2',
        dragging ? 'border-brand-400 bg-brand-500/10 scale-[1.02]' : 'border-white/[0.1] hover:border-brand-400/50 hover:bg-white/[0.02]',
      )}
      style={{ minHeight: 160 }}>
      {preview
        ? <img src={preview} alt={label} className="w-full h-full object-contain max-h-36 rounded-xl" />
        : <>
          <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center transition-all',
            dragging ? 'bg-brand-500/30 border-brand-400/50' : 'bg-white/[0.04] border-white/[0.08]', 'border')}>
            <Icon size={22} className={dragging ? 'text-brand-400' : 'text-white/30'} />
          </div>
          <p className="text-sm font-medium text-white/70">{label}</p>
          {hint && <p className="text-[11px] text-white/30">{hint}</p>}
        </>}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => handle(e.target.files?.[0])} />
    </div>
  )
}

/* ─── Item Selector ─────────────────────────────────────────────── */
function ItemSelector({ selectedId, onSelect }) {
  const { groups, items } = useMockupStore()
  const [activeGroup, setActiveGroup] = useState('')
  const visible = items.filter(i => i.active && (!activeGroup || i.groupId === activeGroup))

  return (
    <div className="space-y-3">
      {/* Group filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveGroup('')}
          className={clsx('px-3 py-1 rounded-full text-xs font-medium transition-all',
            !activeGroup ? 'text-white' : 'text-white/40 hover:text-white/70')}
          style={!activeGroup ? {
            background: 'rgba(110,75,255,0.2)',
            border: '1px solid rgba(110,75,255,0.4)',
          } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          Tất cả
        </button>
        {groups.map(g => (
          <button key={g.id} onClick={() => setActiveGroup(g.id)}
            className={clsx('px-3 py-1 rounded-full text-xs font-medium transition-all',
              activeGroup === g.id ? 'text-white' : 'text-white/40 hover:text-white/70')}
            style={activeGroup === g.id ? {
              background: `${g.color}22`,
              border: `1px solid ${g.color}55`,
              color: g.color,
            } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {g.icon} {g.name}
          </button>
        ))}
      </div>

      {/* Item grid */}
      {visible.length === 0
        ? <p className="text-xs text-white/25 text-center py-8">Chưa có vật phẩm nào trong nhóm này</p>
        : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
            {visible.map(item => {
              const selected = selectedId === item.id
              const group = groups.find(g => g.id === item.groupId)
              return (
                <motion.button key={item.id}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(item)}
                  className="relative rounded-xl p-2 flex flex-col items-center gap-1.5 transition-all"
                  style={{
                    background: selected ? 'rgba(110,75,255,0.18)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1.5px solid rgba(110,75,255,0.55)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: selected ? '0 0 16px rgba(110,75,255,0.3)' : 'none',
                  }}>
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{
                      background: 'url("data:image/svg+xml,%3Csvg width=\'8\' height=\'8\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'4\' height=\'4\' fill=\'%23ffffff06\'/%3E%3Crect x=\'4\' y=\'4\' width=\'4\' height=\'4\' fill=\'%23ffffff06\'/%3E%3C/svg%3E")',
                    }}>
                    {item.url
                      ? <img src={item.url} alt={item.name} className="w-full h-full object-contain" />
                      : <ImageIcon size={16} className="text-white/20" />}
                  </div>
                  <span className="text-[10px] text-white/60 text-center leading-tight truncate w-full">{item.name}</span>
                  {group && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: `${group.color}18`, color: group.color }}>
                      {group.icon}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function MockupPage() {
  const { items } = useMockupStore()
  const { toast } = useAppStore()

  const [bgUrl, setBgUrl]         = useState(null)
  const [bgSize, setBgSize]       = useState({ w: 900, h: 600 })
  const [selectedItem, setSelectedItem] = useState(null)
  const [placement, setPlacement] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult]       = useState(null) // final composite data url

  const canvasRef = useRef()

  // Canvas display dimensions (fit within 900×600 max, keep aspect)
  const CANVAS_W = 900
  const CANVAS_H = 600

  /* Upload background */
  const handleBg = useCallback(async (url, file) => {
    const size = await getImageSize(url)
    setBgUrl(url)
    setBgSize(size)
    setResult(null)
    setPlacement(null)
    toast('Đã tải ảnh nền ✓', 'success')
  }, [toast])

  /* Select item → compute AI placement */
  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item)
    setResult(null)
    if (!bgUrl) { toast('Hãy upload ảnh nền trước', 'info'); return }
    const p = computePlacement(item, CANVAS_W, CANVAS_H)
    setPlacement(p)
  }, [bgUrl, toast])

  /* Generate / apply mockup */
  const handleGenerate = useCallback(async () => {
    if (!bgUrl) { toast('Chưa có ảnh nền', 'error'); return }
    if (!selectedItem) { toast('Chưa chọn vật phẩm', 'error'); return }
    setGenerating(true)
    // Re-compute placement in case bg changed
    const p = computePlacement(selectedItem, CANVAS_W, CANVAS_H)
    setPlacement(p)
    // Let canvas re-render then capture
    await new Promise(r => setTimeout(r, 200))
    const dataUrl = canvasRef.current?.exportPNG()
    if (dataUrl) setResult(dataUrl)
    setGenerating(false)
    toast('AI Mockup hoàn thành ✨', 'success')
  }, [bgUrl, selectedItem, toast])

  /* Download */
  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `mockup-${Date.now()}.png`
    a.click()
    toast('Đã tải xuống ✓', 'success')
  }

  /* Reset */
  const handleReset = () => {
    setBgUrl(null)
    setSelectedItem(null)
    setPlacement(null)
    setResult(null)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 badge mb-3">
          <Wand2 size={13} /> AI Tool
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          AI <span className="grad">Game Item Mockup</span>
        </h1>
        <p className="text-white/40 text-sm max-w-lg mx-auto">
          Upload ảnh nền + chọn vật phẩm — AI tự động đặt vào đúng vị trí chuẩn
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* ── Left: Canvas ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="rounded-2xl overflow-hidden" style={CARD}>
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Layers size={13} className="text-brand-400" /> Mockup Preview
              </span>
              {placement && selectedItem && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Check size={10} /> AI đã tính vị trí
                </span>
              )}
            </div>
            <div className="p-4" style={{
              background: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'8\' height=\'8\' fill=\'%23ffffff04\'/%3E%3Crect x=\'8\' y=\'8\' width=\'8\' height=\'8\' fill=\'%23ffffff04\'/%3E%3C/svg%3E")',
            }}>
              {result ? (
                <img src={result} alt="mockup result" className="w-full rounded-xl" />
              ) : (
                <MockupCanvas
                  ref={canvasRef}
                  bgUrl={bgUrl}
                  itemUrl={selectedItem?.url}
                  placement={placement}
                  canvasW={CANVAS_W}
                  canvasH={CANVAS_H}
                />
              )}
            </div>
          </div>

          {/* Action row */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={!bgUrl || !selectedItem || generating}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              {generating
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang tạo…</>
                : <><Wand2 size={15} /> Tạo Mockup AI</>}
            </motion.button>

            {result && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
                style={{ background: 'linear-gradient(135deg,#10b981,#14b8a6)' }}>
                <Download size={15} /> Tải xuống PNG
              </motion.button>
            )}

            <button onClick={handleReset}
              className="btn-ghost flex items-center gap-2 px-5 py-2.5 text-sm">
              <RotateCcw size={14} /> Làm lại
            </button>
          </div>

          {/* Info banner */}
          {placement && selectedItem && !result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
              style={{ background: 'rgba(110,75,255,0.1)', border: '1px solid rgba(110,75,255,0.25)' }}>
              <Sparkles size={16} className="text-brand-300 flex-shrink-0" />
              <span className="text-white/70">
                AI đã tính vị trí cho <span className="text-white font-semibold">{selectedItem.name}</span> —
                nhấn <span className="text-brand-300 font-semibold">Tạo Mockup AI</span> để xuất ảnh hoàn chỉnh
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* ── Right: Controls ── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

          {/* Step 1 – Background */}
          <div className="rounded-2xl p-4 space-y-3" style={CARD}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: bgUrl ? '#10b981' : 'rgba(110,75,255,0.6)' }}>
                {bgUrl ? '✓' : '1'}
              </span>
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Upload ảnh nền</span>
            </div>
            <UploadZone
              label="Kéo & thả ảnh nền"
              accept="image/*"
              onFile={handleBg}
              preview={bgUrl}
              icon={Upload}
              hint="JPG, PNG, WEBP — bất kỳ kích thước" />
            {bgUrl && (
              <div className="flex items-center justify-between text-[10px] text-white/35">
                <span>Kích thước gốc: {bgSize.w}×{bgSize.h}px</span>
                <button onClick={() => { setBgUrl(null); setResult(null); setPlacement(null) }}
                  className="text-rose-400 hover:text-rose-300 transition">
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Step 2 – Item */}
          <div className="rounded-2xl p-4 space-y-3" style={CARD}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: selectedItem ? '#10b981' : 'rgba(110,75,255,0.6)' }}>
                {selectedItem ? '✓' : '2'}
              </span>
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Chọn vật phẩm</span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 text-white/25">
                <ImageIcon size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Admin chưa upload vật phẩm nào</p>
              </div>
            ) : (
              <ItemSelector selectedId={selectedItem?.id} onSelect={handleSelectItem} />
            )}
          </div>

          {/* Step 3 – Generate hint */}
          <div className="rounded-2xl p-4" style={CARD}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: result ? '#10b981' : 'rgba(255,255,255,0.15)' }}>
                {result ? '✓' : '3'}
              </span>
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">AI tự đặt & xuất ảnh</span>
            </div>
            <div className="space-y-2 text-[11px] text-white/40">
              {[
                'AI phân tích nhóm vật phẩm để chọn vị trí phù hợp',
                'Vị trí tham chiếu do admin cài sẵn sẽ được ưu tiên',
                'Xuất file PNG nền trong suốt hoặc ghép sẵn với nền',
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight size={11} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
