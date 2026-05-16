import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import {
  Shield, Upload, Plus, Trash2, Edit3, Save, X,
  Image as ImageIcon, Tag, Layers, Move, CheckCircle,
  XCircle, Eye, EyeOff, FolderOpen, Crosshair,
} from 'lucide-react'
import { useMockupStore, computePlacement } from '../store/useMockupStore'
import { useAuthStore } from '../store/useAuthStore'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'

/* ─── Design tokens ─────────────────────────────────────────────── */
const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
}
const INPUT = 'w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500/60 focus:bg-white/[0.07] transition-all'

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
    img.onerror = () => res({ w: 300, h: 300 })
    img.src = url
  })
}

/* ─── Shared UI ─────────────────────────────────────────────────── */
function PrimaryBtn({ children, onClick, icon: Icon, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: 'linear-gradient(135deg,#6e4bff,#4dd0ff)' }}>
      {Icon && <Icon size={12} />}{children}
    </button>
  )
}
function GhostBtn({ children, onClick, icon: Icon }) {
  return (
    <button onClick={onClick}
      className="px-4 py-2 rounded-xl text-xs text-white/55 hover:text-white/80 hover:bg-white/[0.08] transition-all"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {Icon && <Icon size={11} className="inline-block mr-1 -mt-0.5" />}{children}
    </button>
  )
}
function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(110,75,255,0.18)', border: '1px solid rgba(110,75,255,0.3)' }}>
          <Icon size={15} className="text-brand-300" />
        </div>
        <h2 className="font-display font-semibold text-white text-base">{title}</h2>
      </div>
      {action}
    </div>
  )
}
function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
      style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="text-center p-4">
        <XCircle size={28} className="text-rose-400 mx-auto mb-2" />
        <p className="text-sm text-white/80 mb-3">Xác nhận xóa?</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onConfirm} className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30">Xóa</button>
          <button onClick={onCancel} className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] border border-white/10 text-white/60 hover:bg-white/[0.1]">Hủy</button>
        </div>
      </div>
    </motion.div>
  )
}


/* ─── Position Editor Modal ─────────────────────────────────────── */
function PositionEditorModal({ item, open, onClose }) {
  const { saveAnchor } = useMockupStore()
  const { toast } = useAppStore()

  // Preview canvas size (fixed inside the modal)
  const PREV_W = 480
  const PREV_H = 320

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(0.35)
  const [dragging, setDragging] = useState(false)
  const [bgUrl, setBgUrl] = useState(null)
  const bgRef = useRef()
  const canvasRef = useRef()
  const dragStart = useRef(null)

  // Compute rendered item size
  const iW = Math.round((item?.naturalW || 300) * scale)
  const iH = Math.round((item?.naturalH || 300) * scale)

  // Init position from saved anchor or heuristic
  useEffect(() => {
    if (!open || !item) return
    if (item.anchorX != null) {
      setPos({
        x: PREV_W * item.anchorX - iW / 2,
        y: PREV_H * item.anchorY - iH / 2,
      })
      setScale(item.anchorScale)
    } else {
      const p = computePlacement(item, PREV_W, PREV_H)
      setPos({ x: p.x, y: p.y })
      setScale(p.scale)
    }
  }, [open, item?.id]) // eslint-disable-line

  const handleBgUpload = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = await readFileAsDataURL(f)
    setBgUrl(url)
    e.target.value = ''
  }

  // Mouse drag handlers on the item overlay
  const onMouseDown = (e) => {
    e.preventDefault()
    setDragging(true)
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      ox: pos.x, oy: pos.y,
    }
  }
  const onMouseMove = useCallback((e) => {
    if (!dragging || !dragStart.current) return
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    setPos({
      x: Math.max(0, Math.min(dragStart.current.ox + dx, PREV_W - iW)),
      y: Math.max(0, Math.min(dragStart.current.oy + dy, PREV_H - iH)),
    })
  }, [dragging, iW, iH])
  const onMouseUp = useCallback(() => setDragging(false), [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging, onMouseMove, onMouseUp])

  const handleSave = () => {
    const ax = (pos.x + iW / 2) / PREV_W
    const ay = (pos.y + iH / 2) / PREV_H
    saveAnchor(item.id, ax, ay, scale)
    toast('Đã lưu vị trí tham chiếu ✓', 'success')
    onClose()
  }

  if (!open || !item) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,12,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl p-6 space-y-5"
        style={{
          background: 'linear-gradient(180deg,rgba(20,15,40,0.98),rgba(15,11,30,0.98))',
          border: '1px solid rgba(110,75,255,0.3)',
          boxShadow: '0 20px 80px rgba(110,75,255,0.2)',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(110,75,255,0.2)', border: '1px solid rgba(110,75,255,0.4)' }}>
              <Crosshair size={16} className="text-brand-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Chỉnh vị trí AI</h3>
              <p className="text-xs text-white/40">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06]">
            <X size={16} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs text-white/60 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Upload size={13} /> Upload ảnh nền thử
            <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
          </label>
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <span className="text-xs text-white/40 whitespace-nowrap">Scale: {scale.toFixed(2)}</span>
            <input type="range" min={0.05} max={1} step={0.01} value={scale}
              onChange={e => setScale(+e.target.value)}
              className="flex-1 accent-brand-500" />
          </div>
        </div>

        {/* Canvas */}
        <div className="relative rounded-2xl overflow-hidden select-none"
          ref={canvasRef}
          style={{ width: PREV_W, height: PREV_H, maxWidth: '100%',
            background: bgUrl ? `url(${bgUrl}) center/cover` : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'default' }}>

          {!bgUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-white/15 text-sm pointer-events-none">
              Upload ảnh nền để xem trước
            </div>
          )}

          {/* Crosshair grid lines */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

          {/* Draggable item */}
          {item.url && (
            <div
              onMouseDown={onMouseDown}
              style={{
                position: 'absolute',
                left: pos.x, top: pos.y,
                width: iW, height: iH,
                cursor: dragging ? 'grabbing' : 'grab',
                userSelect: 'none',
              }}>
              <img src={item.url} alt={item.name}
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
              <div className="absolute inset-0 border-2 border-brand-400/70 rounded-lg pointer-events-none"
                style={{ boxShadow: '0 0 12px rgba(110,75,255,0.5)' }} />
            </div>
          )}
        </div>

        <p className="text-[11px] text-white/30">
          🖱️ Kéo vật phẩm để đặt vị trí. Vị trí này sẽ được AI dùng làm chuẩn khi tự động đặt.
        </p>

        <div className="flex gap-2 pt-1">
          <PrimaryBtn icon={Save} onClick={handleSave}>Lưu vị trí</PrimaryBtn>
          <GhostBtn onClick={onClose}>Hủy</GhostBtn>
        </div>
      </motion.div>
    </motion.div>
  )
}


/* ─── Item Card ─────────────────────────────────────────────────── */
function ItemCard({ item }) {
  const { groups, updateItem, removeItem } = useMockupStore()
  const { toast } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [posEditor, setPosEditor] = useState(false)
  const [form, setForm] = useState(item)
  const fileRef = useRef()

  const group = groups.find(g => g.id === item.groupId)

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = await readFileAsDataURL(f)
    const { w, h } = await getImageSize(url)
    setForm(p => ({ ...p, url, naturalW: w, naturalH: h }))
    e.target.value = ''
  }

  const save = () => {
    updateItem(item.id, { ...form })
    setEditing(false)
    toast('Đã cập nhật vật phẩm', 'success')
  }

  return (
    <motion.div layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="relative rounded-2xl p-4 flex flex-col gap-3" style={CARD}>
      {confirmDel && <ConfirmDelete onConfirm={() => { removeItem(item.id); toast('Đã xóa', 'success') }} onCancel={() => setConfirmDel(false)} />}

      <AnimatePresence>
        {posEditor && <PositionEditorModal item={item} open={posEditor} onClose={() => setPosEditor(false)} />}
      </AnimatePresence>

      {/* Thumbnail */}
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'8\' height=\'8\' viewBox=\'0 0 8 8\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'4\' height=\'4\' fill=\'%23ffffff08\'/%3E%3Crect x=\'4\' y=\'4\' width=\'4\' height=\'4\' fill=\'%23ffffff08\'/%3E%3C/svg%3E")' }}>
          {item.url
            ? <img src={item.url} alt={item.name} className="w-full h-full object-contain" />
            : <ImageIcon size={20} className="text-white/20" />}
        </div>
        <div className="flex-1 min-w-0">
          {editing
            ? <input className={INPUT + ' mb-1'} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Tên vật phẩm" />
            : <p className="font-semibold text-white text-sm truncate">{item.name || '(Chưa đặt tên)'}</p>}
          {group && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1"
              style={{ background: `${group.color}20`, color: group.color, border: `1px solid ${group.color}40` }}>
              {group.icon} {group.name}
            </span>
          )}
          <p className="text-[10px] text-white/30 mt-1">{item.naturalW}×{item.naturalH}px</p>
        </div>
        <button onClick={() => updateItem(item.id, { active: !item.active })}
          className={clsx('flex-shrink-0 p-1.5 rounded-lg transition-all',
            item.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/25 bg-white/[0.04]')}>
          {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Edit fields */}
      {editing && (
        <div className="space-y-2">
          <select className={INPUT} value={form.groupId} onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))}>
            <option value="">— Chọn nhóm —</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input className={INPUT} placeholder="URL ảnh PNG" value={form.url || ''} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
            <input ref={fileRef} type="file" accept="image/png,image/*" className="hidden" onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()} title="Upload PNG"
              className="flex-shrink-0 px-3 py-2 rounded-xl text-white/60 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Upload size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Anchor badge */}
      {item.anchorX != null && !editing && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-300"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '4px 8px' }}>
          <Crosshair size={10} />
          Vị trí AI: {Math.round(item.anchorX * 100)}% × {Math.round(item.anchorY * 100)}% — scale {item.anchorScale?.toFixed(2)}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 flex-wrap">
        {editing ? (
          <>
            <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Save size={11} /> Lưu
            </button>
            <button onClick={() => { setEditing(false); setForm(item) }}
              className="px-3 py-1.5 rounded-xl text-xs text-white/45"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <X size={11} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setEditing(true); setForm(item) }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-brand-300"
              style={{ background: 'rgba(110,75,255,0.1)', border: '1px solid rgba(110,75,255,0.25)' }}>
              <Edit3 size={11} /> Sửa
            </button>
            <button onClick={() => setPosEditor(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-cyan-300"
              style={{ background: 'rgba(77,208,255,0.1)', border: '1px solid rgba(77,208,255,0.25)' }}>
              <Move size={11} /> Vị trí AI
            </button>
            <button onClick={() => setConfirmDel(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-rose-300"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Trash2 size={11} /> Xóa
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}


/* ─── Items Tab ─────────────────────────────────────────────────── */
function ItemsTab() {
  const { items, groups, addItem } = useMockupStore()
  const { toast } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [filterGroup, setFilterGroup] = useState('')
  const fileRef = useRef()
  const empty = { name: '', groupId: '', url: '', naturalW: 300, naturalH: 300, active: true }
  const [form, setForm] = useState(empty)

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = await readFileAsDataURL(f)
    const { w, h } = await getImageSize(url)
    setForm(p => ({ ...p, url, naturalW: w, naturalH: h }))
    e.target.value = ''
  }

  const handleSave = () => {
    if (!form.name.trim()) { toast('Cần nhập tên vật phẩm', 'error'); return }
    if (!form.url.trim()) { toast('Cần upload ảnh PNG', 'error'); return }
    addItem({ ...form })
    setForm(empty)
    setShowAdd(false)
    toast('Đã thêm vật phẩm ✓', 'success')
  }

  const filtered = items.filter(i => !filterGroup || i.groupId === filterGroup)

  return (
    <div>
      <SectionHeader icon={ImageIcon} title={`Vật phẩm PNG (${items.length})`}
        action={
          <div className="flex gap-2">
            <select className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-2 py-1.5 text-xs text-white/70 outline-none"
              value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
              <option value="">Tất cả nhóm</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
            </select>
            <button onClick={() => setShowAdd(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: showAdd ? 'rgba(239,68,68,0.12)' : 'rgba(110,75,255,0.15)',
                border: showAdd ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(110,75,255,0.35)',
                color: showAdd ? '#fca5a5' : '#a893ff',
              }}>
              {showAdd ? <><X size={13} /> Đóng</> : <><Plus size={13} /> Thêm vật phẩm</>}
            </button>
          </div>
        } />

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6">
            <div className="rounded-2xl p-5" style={CARD}>
              <p className="text-xs font-semibold text-brand-300 mb-4">+ Thêm vật phẩm mới</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={INPUT} placeholder="Tên vật phẩm *" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <select className={INPUT} value={form.groupId}
                  onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))}>
                  <option value="">— Chọn nhóm —</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
                </select>
                <div className="sm:col-span-2 flex gap-2">
                  <input className={INPUT} placeholder="URL ảnh PNG (hoặc upload →)" value={form.url}
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  <button onClick={() => fileRef.current?.click()} title="Upload PNG"
                    className="flex-shrink-0 px-3 py-2 rounded-xl text-white/60 hover:text-white transition"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Upload size={15} />
                  </button>
                </div>
              </div>
              {form.url && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={form.url} alt="preview" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] text-white/40">{form.naturalW}×{form.naturalH}px</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <PrimaryBtn icon={Save} onClick={handleSave}>Lưu vật phẩm</PrimaryBtn>
                <GhostBtn onClick={() => { setShowAdd(false); setForm(empty) }}>Hủy</GhostBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0
        ? <div className="text-center py-16 text-white/25"><ImageIcon size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Chưa có vật phẩm nào</p></div>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map(item => <ItemCard key={item.id} item={item} />)}
            </AnimatePresence>
          </div>
        )}
    </div>
  )
}


/* ─── Groups Tab ────────────────────────────────────────────────── */
function GroupsTab() {
  const { groups, items, addGroup, updateGroup, removeGroup } = useMockupStore()
  const { toast } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', icon: '📦', color: '#6e4bff', desc: '' })
  const [confirmDel, setConfirmDel] = useState(null)

  const handleAdd = () => {
    if (!form.name.trim()) { toast('Cần nhập tên nhóm', 'error'); return }
    addGroup({ ...form })
    setForm({ name: '', icon: '📦', color: '#6e4bff', desc: '' })
    setShowAdd(false)
    toast('Đã tạo nhóm ✓', 'success')
  }

  const handleUpdate = (id) => {
    updateGroup(id, { ...form })
    setEditingId(null)
    toast('Đã cập nhật nhóm', 'success')
  }

  return (
    <div>
      <SectionHeader icon={FolderOpen} title={`Nhóm chủ đề (${groups.length})`}
        action={
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: showAdd ? 'rgba(239,68,68,0.12)' : 'rgba(110,75,255,0.15)',
              border: showAdd ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(110,75,255,0.35)',
              color: showAdd ? '#fca5a5' : '#a893ff',
            }}>
            {showAdd ? <><X size={13} /> Đóng</> : <><Plus size={13} /> Thêm nhóm</>}
          </button>
        } />

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6">
            <div className="rounded-2xl p-5" style={CARD}>
              <p className="text-xs font-semibold text-brand-300 mb-4">+ Tạo nhóm mới</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <input className={INPUT + ' w-14 text-center text-xl'} maxLength={4} placeholder="📦"
                    value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
                  <input className={INPUT} placeholder="Tên nhóm *" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent" />
                  <input className={INPUT} placeholder="Mô tả (tuỳ chọn)" value={form.desc}
                    onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <PrimaryBtn icon={Save} onClick={handleAdd}>Tạo nhóm</PrimaryBtn>
                <GhostBtn onClick={() => setShowAdd(false)}>Hủy</GhostBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {groups.map(g => {
            const count = items.filter(i => i.groupId === g.id).length
            const isEdit = editingId === g.id
            return (
              <motion.div key={g.id} layout
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="relative rounded-2xl p-4" style={CARD}>
                {confirmDel === g.id && (
                  <ConfirmDelete
                    onConfirm={() => { removeGroup(g.id); setConfirmDel(null); toast('Đã xóa nhóm', 'success') }}
                    onCancel={() => setConfirmDel(null)} />
                )}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: `${g.color}20`, border: `1px solid ${g.color}40` }}>
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEdit
                      ? <input className={INPUT + ' mb-1'} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                      : <p className="font-semibold text-white text-sm">{g.name}</p>}
                    {isEdit
                      ? <input className={INPUT + ' text-xs'} placeholder="Mô tả" value={form.desc || ''} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
                      : <p className="text-[11px] text-white/35 mt-0.5">{g.desc || '—'}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${g.color}18`, color: g.color, border: `1px solid ${g.color}35` }}>
                    {count} vật phẩm
                  </span>
                  <div className="flex gap-1.5">
                    {isEdit ? (
                      <>
                        <button onClick={() => handleUpdate(g.id)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"><Save size={13} /></button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg text-white/30 hover:bg-white/[0.06] transition-all"><X size={13} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(g.id); setForm({ name: g.name, icon: g.icon, color: g.color, desc: g.desc || '' }) }}
                          className="p-1.5 rounded-lg text-brand-300 hover:bg-brand-500/10 transition-all"><Edit3 size={13} /></button>
                        <button onClick={() => setConfirmDel(g.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}


/* ─── Main Page ─────────────────────────────────────────────────── */
const TABS = [
  { id: 'items',  label: 'Vật phẩm PNG', icon: ImageIcon },
  { id: 'groups', label: 'Nhóm chủ đề',  icon: FolderOpen },
]

export default function AdminMockupPage() {
  const navigate = useNavigate()
  const isAdmin = useAuthStore(s => s.isAdmin())
  const [tab, setTab] = useState('items')

  useEffect(() => {
    if (!isAdmin) navigate('/', { replace: true })
  }, [isAdmin, navigate])

  if (!isAdmin) return null

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <Shield size={22} className="text-rose-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="font-display text-2xl font-bold text-white">Admin Mockup</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">ADMIN</span>
          </div>
          <p className="text-sm text-white/40">Quản lý vật phẩm PNG & nhóm chủ đề cho AI Mockup</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng vật phẩm', value: useMockupStore.getState().items.length, color: '#6e4bff', icon: ImageIcon },
          { label: 'Nhóm chủ đề',   value: useMockupStore.getState().groups.length, color: '#10b981', icon: FolderOpen },
          { label: 'Có vị trí AI',  value: useMockupStore.getState().items.filter(i => i.anchorX != null).length, color: '#f59e0b', icon: Crosshair },
          { label: 'Đang hiển thị', value: useMockupStore.getState().items.filter(i => i.active).length, color: '#4dd0ff', icon: Eye },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={CARD}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} style={{ color: s.color }} />
              <span className="text-[11px] text-white/40">{s.label}</span>
            </div>
            <p className="text-2xl font-bold font-display" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        <div className="flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={clsx('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70')}
              style={tab === t.id ? {
                background: 'linear-gradient(135deg,rgba(110,75,255,0.25),rgba(77,208,255,0.15))',
                border: '1px solid rgba(110,75,255,0.3)',
              } : {}}>
              <t.icon size={15} />{t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-6" style={CARD}>
          <AnimatePresence mode="wait">
            {tab === 'items'  && <motion.div key="items"  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ItemsTab /></motion.div>}
            {tab === 'groups' && <motion.div key="groups" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><GroupsTab /></motion.div>}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
