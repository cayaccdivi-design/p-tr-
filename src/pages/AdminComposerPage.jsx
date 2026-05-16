import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Shield, Upload, Plus, Trash2, Edit3, Save, X, Image, Terminal, Tag, Sparkles, CheckCircle, XCircle, FolderOpen, Eye, EyeOff, Link } from 'lucide-react'
import { useComposerStore } from '../store/useComposerStore'
import { useAuthStore } from '../store/useAuthStore'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px) saturate(180%)' }
const INPUT_CLS = 'w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500/60 focus:bg-white/[0.07] transition-all'
const BLEND_MODES = ['normal','screen','multiply','overlay','lighten']

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
      active ? 'bg-brand-500/20 text-brand-300 border border-brand-500/35' : 'text-white/45 hover:text-white/75 hover:bg-white/[0.05] border border-transparent')}>
      <Icon size={15} />{label}
    </button>
  )
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(110,75,255,0.18)', border: '1px solid rgba(110,75,255,0.3)' }}>
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
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
      style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="text-center p-4">
        <XCircle size={28} className="text-rose-400 mx-auto mb-2" />
        <p className="text-sm text-white/80 mb-3">Xác nhận xóa?</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onConfirm} className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all">Xóa</button>
          <button onClick={onCancel} className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] border border-white/10 text-white/60 hover:bg-white/[0.1] transition-all">Hủy</button>
        </div>
      </div>
    </motion.div>
  )
}

function AddBtn({ onClick, open, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{ background: open ? 'rgba(239,68,68,0.12)' : 'rgba(110,75,255,0.15)', border: open ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(110,75,255,0.35)', color: open ? '#fca5a5' : '#a893ff' }}>
      {open ? <><X size={13} /> Đóng</> : <><Plus size={13} /> {label}</>}
    </button>
  )
}


function ResourcesTab() {
  const { resources, categories, addResource, updateResource, removeResource } = useComposerStore()
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const fileRef = useRef()
  const empty = { name:'', url:'', categoryId:'', width:300, height:300, blendMode:'normal', defaultOpacity:1, active:true }
  const [form, setForm] = useState(empty)
  const [editForm, setEditForm] = useState({})

  const handleFileRead = (e, setter) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setter(p => ({ ...p, url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <SectionHeader icon={Image} title={`Resources (${resources.length})`} action={<AddBtn onClick={() => setShowAdd(v => !v)} open={showAdd} label="Thêm resource" />} />
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden mb-6">
            <div className="rounded-2xl p-5 mb-2" style={CARD}>
              <p className="text-xs font-semibold text-brand-300 mb-4">+ Thêm Resource mới</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className={INPUT_CLS} placeholder="Tên resource *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
                <select className={INPUT_CLS} value={form.categoryId} onChange={e => setForm(p => ({...p, categoryId: e.target.value}))}>
                  <option value="">— Chọn danh mục —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <div className="sm:col-span-2 flex gap-2">
                  <input className={INPUT_CLS} placeholder="URL ảnh (paste link)" value={form.url} onChange={e => setForm(p => ({...p, url: e.target.value}))} />
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileRead(e, setForm)} />
                  <button onClick={() => fileRef.current?.click()} className="flex-shrink-0 px-3 py-2 rounded-xl text-white/60 hover:text-white transition-all" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}><Upload size={15} /></button>
                </div>
                <input className={INPUT_CLS} type="number" placeholder="Width (px)" value={form.width} onChange={e => setForm(p => ({...p, width: e.target.value}))} />
                <input className={INPUT_CLS} type="number" placeholder="Height (px)" value={form.height} onChange={e => setForm(p => ({...p, height: e.target.value}))} />
                <select className={INPUT_CLS} value={form.blendMode} onChange={e => setForm(p => ({...p, blendMode: e.target.value}))}>
                  {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/40">Opacity: {form.defaultOpacity.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.01" value={form.defaultOpacity} onChange={e => setForm(p => ({...p, defaultOpacity: +e.target.value}))} className="w-full accent-brand-500" />
                </div>
              </div>
              {form.url && <div className="mt-3 flex items-center gap-3"><img src={form.url} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-white/10" /><span className="text-xs text-white/40 truncate max-w-xs">{form.url.slice(0,60)}</span></div>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { if(form.name.trim()){addResource({...form,width:+form.width,height:+form.height}); setForm(empty); setShowAdd(false)} }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background:'linear-gradient(135deg,#6e4bff,#4dd0ff)', color:'#fff' }}><Save size={12} /> Lưu</button>
                <button onClick={() => { setShowAdd(false); setForm(empty) }} className="px-4 py-2 rounded-xl text-xs text-white/50" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>Hủy</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {resources.length === 0 && <div className="text-center py-16 text-white/25"><Image size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Chưa có resource nào. Thêm resource đầu tiên!</p></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {resources.map(res => {
            const cat = categories.find(c => c.id === res.categoryId)
            const isEditing = editingId === res.id
            return (
              <motion.div key={res.id} layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }} className="relative rounded-2xl p-4 flex flex-col gap-3" style={CARD}>
                {confirmDeleteId === res.id && <ConfirmDelete onConfirm={() => { removeResource(res.id); setConfirmDeleteId(null) }} onCancel={() => setConfirmDeleteId(null)} />}
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
                    {res.url ? <img src={res.url} alt={res.name} className="w-full h-full object-cover" /> : <Image size={20} className="text-white/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? <input className={INPUT_CLS+' mb-1'} value={editForm.name||''} onChange={e => setEditForm(p => ({...p,name:e.target.value}))} />
                      : <p className="font-semibold text-white text-sm truncate">{res.name||'(Chưa đặt tên)'}</p>}
                    {cat && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1" style={{ background:`${cat.color}20`, color:cat.color, border:`1px solid ${cat.color}40` }}>{cat.icon} {cat.name}</span>}
                  </div>
                  <button onClick={() => updateResource(res.id, { active: !res.active })} className={clsx('flex-shrink-0 p-1.5 rounded-lg transition-all', res.active?'text-emerald-400 bg-emerald-500/10':'text-white/25 bg-white/[0.04]')}>
                    {res.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
                {isEditing && (
                  <div className="grid grid-cols-2 gap-2">
                    <input className={INPUT_CLS} placeholder="URL ảnh" value={editForm.url||''} onChange={e => setEditForm(p=>({...p,url:e.target.value}))} />
                    <select className={INPUT_CLS} value={editForm.categoryId||''} onChange={e => setEditForm(p=>({...p,categoryId:e.target.value}))}>
                      <option value="">— Danh mục —</option>
                      {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                    <input type="number" className={INPUT_CLS} placeholder="Width" value={editForm.width||''} onChange={e=>setEditForm(p=>({...p,width:e.target.value}))} />
                    <input type="number" className={INPUT_CLS} placeholder="Height" value={editForm.height||''} onChange={e=>setEditForm(p=>({...p,height:e.target.value}))} />
                    <select className={INPUT_CLS} value={editForm.blendMode||'normal'} onChange={e=>setEditForm(p=>({...p,blendMode:e.target.value}))}>
                      {BLEND_MODES.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/35">Opacity: {(editForm.defaultOpacity??1).toFixed(2)}</label>
                      <input type="range" min="0" max="1" step="0.01" value={editForm.defaultOpacity??1} onChange={e=>setEditForm(p=>({...p,defaultOpacity:+e.target.value}))} className="accent-brand-500" />
                    </div>
                  </div>
                )}
                {!isEditing && <div className="flex items-center gap-3 text-[10px] text-white/30"><span>{res.width}×{res.height}</span><span className="capitalize">{res.blendMode}</span><span>op:{res.defaultOpacity?.toFixed(2)}</span></div>}
                <div className="flex gap-2 pt-1">
                  {isEditing ? (
                    <>
                      <button onClick={() => { updateResource(res.id,{...editForm,width:+editForm.width,height:+editForm.height}); setEditingId(null) }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)' }}><Save size={11} /> Lưu</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-xl text-xs text-white/45" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}><X size={11} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(res.id); setEditForm({...res}) }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-brand-300" style={{ background:'rgba(110,75,255,0.1)', border:'1px solid rgba(110,75,255,0.25)' }}><Edit3 size={11} /> Sửa</button>
                      <button onClick={() => setConfirmDeleteId(res.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-rose-300" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)' }}><Trash2 size={11} /> Xóa</button>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}


function CommandsTab() {
  const { commands, categories, resources, addCommand, updateCommand, removeCommand } = useComposerStore()
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const empty = { keyword:'', categoryId:'', resourceId:'', prompt:'', icon:'✨', active:true }
  const [form, setForm] = useState(empty)
  const [editForm, setEditForm] = useState({})

  return (
    <div>
      <SectionHeader icon={Terminal} title={`Commands (${commands.length})`} action={<AddBtn onClick={() => setShowAdd(v => !v)} open={showAdd} label="Thêm lệnh" />} />
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden mb-6">
            <div className="rounded-2xl p-5" style={CARD}>
              <p className="text-xs font-semibold text-brand-300 mb-4">+ Thêm Command mới</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <input className={INPUT_CLS+' w-14 text-center text-xl flex-shrink-0'} placeholder="🏎️" value={form.icon} onChange={e=>setForm(p=>({...p,icon:e.target.value}))} maxLength={4} />
                  <input className={INPUT_CLS} placeholder="Keyword (vd: xe thể thao) *" value={form.keyword} onChange={e=>setForm(p=>({...p,keyword:e.target.value}))} />
                </div>
                <select className={INPUT_CLS} value={form.categoryId} onChange={e=>setForm(p=>({...p,categoryId:e.target.value}))}>
                  <option value="">— Chọn danh mục —</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <select className={INPUT_CLS} value={form.resourceId} onChange={e=>setForm(p=>({...p,resourceId:e.target.value}))}>
                  <option value="">— Resource (tùy chọn) —</option>
                  {resources.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e=>setForm(p=>({...p,active:e.target.checked}))} className="accent-brand-500 w-4 h-4" /> Kích hoạt
                </label>
                <div className="sm:col-span-2">
                  <textarea className={INPUT_CLS+' resize-none'} rows={3} placeholder="Prompt AI (mô tả cách xử lý ảnh)..." value={form.prompt} onChange={e=>setForm(p=>({...p,prompt:e.target.value}))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { if(form.keyword.trim()){addCommand({...form,resourceId:form.resourceId||null}); setForm(empty); setShowAdd(false)} }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background:'linear-gradient(135deg,#6e4bff,#4dd0ff)', color:'#fff' }}><Save size={12}/> Lưu lệnh</button>
                <button onClick={() => { setShowAdd(false); setForm(empty) }} className="px-4 py-2 rounded-xl text-xs text-white/50" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>Hủy</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {commands.length === 0 && <div className="text-center py-16 text-white/25"><Terminal size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Chưa có lệnh nào.</p></div>}
      <div className="space-y-3">
        <AnimatePresence>
          {commands.map(cmd => {
            const cat = categories.find(c=>c.id===cmd.categoryId)
            const res = resources.find(r=>r.id===cmd.resourceId)
            const isEditing = editingId === cmd.id
            return (
              <motion.div key={cmd.id} layout initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20 }} className="relative rounded-2xl p-4" style={CARD}>
                {confirmDeleteId === cmd.id && <ConfirmDelete onConfirm={() => { removeCommand(cmd.id); setConfirmDeleteId(null) }} onCancel={() => setConfirmDeleteId(null)} />}
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex gap-2">
                      <input className={INPUT_CLS+' w-14 text-center text-xl flex-shrink-0'} value={editForm.icon||''} onChange={e=>setEditForm(p=>({...p,icon:e.target.value}))} maxLength={4} />
                      <input className={INPUT_CLS} placeholder="Keyword" value={editForm.keyword||''} onChange={e=>setEditForm(p=>({...p,keyword:e.target.value}))} />
                    </div>
                    <select className={INPUT_CLS} value={editForm.categoryId||''} onChange={e=>setEditForm(p=>({...p,categoryId:e.target.value}))}>
                      <option value="">— Danh mục —</option>
                      {categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                    <select className={INPUT_CLS} value={editForm.resourceId||''} onChange={e=>setEditForm(p=>({...p,resourceId:e.target.value}))}>
                      <option value="">— Resource (tùy chọn) —</option>
                      {resources.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                      <input type="checkbox" checked={editForm.active??true} onChange={e=>setEditForm(p=>({...p,active:e.target.checked}))} className="accent-brand-500 w-4 h-4" /> Kích hoạt
                    </label>
                    <div className="sm:col-span-2">
                      <textarea className={INPUT_CLS+' resize-none'} rows={2} placeholder="Prompt AI..." value={editForm.prompt||''} onChange={e=>setEditForm(p=>({...p,prompt:e.target.value}))} />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <button onClick={() => { updateCommand(cmd.id,{...editForm,resourceId:editForm.resourceId||null}); setEditingId(null) }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)' }}><Save size={11}/> Lưu</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-xl text-xs text-white/45" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}><X size={11}/></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 leading-none pt-0.5">{cmd.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{cmd.keyword}</span>
                        {cat && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background:`${cat.color}20`, color:cat.color, border:`1px solid ${cat.color}40` }}>{cat.icon} {cat.name}</span>}
                        {res && <span className="px-2 py-0.5 rounded-full text-[10px] text-cyan-300" style={{ background:'rgba(77,208,255,0.1)', border:'1px solid rgba(77,208,255,0.25)' }}>{res.name}</span>}
                      </div>
                      <p className="text-xs text-white/35 mt-1 line-clamp-2">{cmd.prompt}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => updateCommand(cmd.id,{active:!cmd.active})} className={clsx('p-1.5 rounded-lg transition-all', cmd.active?'text-emerald-400 bg-emerald-500/10':'text-white/25 bg-white/[0.04]')}>
                        {cmd.active ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                      </button>
                      <button onClick={() => { setEditingId(cmd.id); setEditForm({...cmd,resourceId:cmd.resourceId||''}) }} className="p-1.5 rounded-lg text-brand-300 hover:bg-brand-500/10 transition-all"><Edit3 size={14}/></button>
                      <button onClick={() => setConfirmDeleteId(cmd.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={14}/></button>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}


function CategoriesTab() {
  const { categories, resources, commands, addCategory, updateCategory, removeCategory } = useComposerStore()
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const empty = { name:'', icon:'📁', color:'#6e4bff' }
  const [form, setForm] = useState(empty)
  const [editForm, setEditForm] = useState({})
  const rCount = id => resources.filter(r=>r.categoryId===id).length
  const cCount = id => commands.filter(c=>c.categoryId===id).length

  return (
    <div>
      <SectionHeader icon={Tag} title={`Categories (${categories.length})`} action={<AddBtn onClick={() => setShowAdd(v=>!v)} open={showAdd} label="Thêm danh mục" />} />
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden mb-6">
            <div className="rounded-2xl p-5" style={CARD}>
              <div className="flex gap-3 flex-wrap">
                <input className={INPUT_CLS+' w-14 text-center text-xl flex-shrink-0'} placeholder="📁" value={form.icon} onChange={e=>setForm(p=>({...p,icon:e.target.value}))} maxLength={4} />
                <input className={INPUT_CLS+' flex-1 min-w-[140px]'} placeholder="Tên danh mục *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40">Màu:</label>
                  <input type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5" style={{ background:'rgba(255,255,255,0.06)' }} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { if(form.name.trim()){addCategory(form); setForm(empty); setShowAdd(false)} }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background:'linear-gradient(135deg,#6e4bff,#4dd0ff)', color:'#fff' }}><Save size={12}/> Lưu</button>
                <button onClick={() => { setShowAdd(false); setForm(empty) }} className="px-4 py-2 rounded-xl text-xs text-white/50" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>Hủy</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {categories.map(cat => {
            const isEditing = editingId === cat.id
            return (
              <motion.div key={cat.id} layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }} className="relative rounded-2xl p-4 flex flex-col gap-3" style={{ ...CARD, borderColor:`${cat.color}30` }}>
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background:`linear-gradient(90deg, transparent, ${cat.color}, transparent)` }} />
                {confirmDeleteId === cat.id && <ConfirmDelete onConfirm={() => { removeCategory(cat.id); setConfirmDeleteId(null) }} onCancel={() => setConfirmDeleteId(null)} />}
                {isEditing ? (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      <input className={INPUT_CLS+' w-12 text-center text-xl flex-shrink-0'} value={editForm.icon||''} onChange={e=>setEditForm(p=>({...p,icon:e.target.value}))} maxLength={4} />
                      <input className={INPUT_CLS+' flex-1'} value={editForm.name||''} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} />
                      <input type="color" value={editForm.color||'#6e4bff'} onChange={e=>setEditForm(p=>({...p,color:e.target.value}))} className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { updateCategory(cat.id, editForm); setEditingId(null) }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)' }}><Save size={11}/> Lưu</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-xl text-xs text-white/45" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}><X size={11}/></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:`${cat.color}18`, border:`1px solid ${cat.color}30` }}>{cat.icon}</div>
                      <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm">{cat.name}</p><p className="text-[10px] text-white/35">{cat.id}</p></div>
                    </div>
                    <div className="flex gap-3 text-[11px]">
                      <span className="px-2 py-0.5 rounded-lg" style={{ background:`${cat.color}15`, color:cat.color }}>{rCount(cat.id)} resources</span>
                      <span className="px-2 py-0.5 rounded-lg" style={{ background:`${cat.color}15`, color:cat.color }}>{cCount(cat.id)} commands</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(cat.id); setEditForm({...cat}) }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-brand-300" style={{ background:'rgba(110,75,255,0.1)', border:'1px solid rgba(110,75,255,0.25)' }}><Edit3 size={11}/> Sửa</button>
                      <button onClick={() => setConfirmDeleteId(cat.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-rose-300" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)' }}><Trash2 size={11}/> Xóa</button>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

function EffectsTab() {
  const { effects, addEffect, updateEffect, removeEffect } = useComposerStore()
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const empty = { name:'', icon:'✨', type:'filter', value:'', active:true }
  const [form, setForm] = useState(empty)
  const [editForm, setEditForm] = useState({})

  return (
    <div>
      <SectionHeader icon={Sparkles} title={`Effects (${effects.length})`} action={<AddBtn onClick={() => setShowAdd(v=>!v)} open={showAdd} label="Thêm effect" />} />
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden mb-6">
            <div className="rounded-2xl p-5" style={CARD}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <input className={INPUT_CLS+' w-14 text-center text-xl flex-shrink-0'} placeholder="✨" value={form.icon} onChange={e=>setForm(p=>({...p,icon:e.target.value}))} maxLength={4} />
                  <input className={INPUT_CLS} placeholder="Tên effect *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
                </div>
                <select className={INPUT_CLS} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                  <option value="filter">filter (CSS filter)</option>
                  <option value="overlay">overlay (CSS gradient)</option>
                </select>
                <div className="sm:col-span-2">
                  <input className={INPUT_CLS} placeholder="Value (vd: blur(3px) hoặc radial-gradient(...))" value={form.value} onChange={e=>setForm(p=>({...p,value:e.target.value}))} />
                </div>
                {form.value && <div className="sm:col-span-2"><code className="text-[10px] text-cyan-300 bg-white/[0.04] px-2 py-1 rounded-lg break-all">{form.value}</code></div>}
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e=>setForm(p=>({...p,active:e.target.checked}))} className="accent-brand-500 w-4 h-4" /> Kích hoạt
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { if(form.name.trim()){addEffect(form); setForm(empty); setShowAdd(false)} }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background:'linear-gradient(135deg,#6e4bff,#4dd0ff)', color:'#fff' }}><Save size={12}/> Lưu effect</button>
                <button onClick={() => { setShowAdd(false); setForm(empty) }} className="px-4 py-2 rounded-xl text-xs text-white/50" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>Hủy</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {effects.map(fx => {
            const isEditing = editingId === fx.id
            const tc = fx.type === 'filter' ? '#4dd0ff' : '#a893ff'
            return (
              <motion.div key={fx.id} layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }} className="relative rounded-2xl p-4 flex flex-col gap-3" style={CARD}>
                {confirmDeleteId === fx.id && <ConfirmDelete onConfirm={() => { removeEffect(fx.id); setConfirmDeleteId(null) }} onCancel={() => setConfirmDeleteId(null)} />}
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex gap-2">
                        <input className={INPUT_CLS+' w-12 text-center text-xl flex-shrink-0'} value={editForm.icon||''} onChange={e=>setEditForm(p=>({...p,icon:e.target.value}))} maxLength={4} />
                        <input className={INPUT_CLS} value={editForm.name||''} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} />
                      </div>
                      <select className={INPUT_CLS} value={editForm.type||'filter'} onChange={e=>setEditForm(p=>({...p,type:e.target.value}))}>
                        <option value="filter">filter</option><option value="overlay">overlay</option>
                      </select>
                      <div className="col-span-2"><input className={INPUT_CLS} value={editForm.value||''} onChange={e=>setEditForm(p=>({...p,value:e.target.value}))} /></div>
                      <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer col-span-2">
                        <input type="checkbox" checked={editForm.active??true} onChange={e=>setEditForm(p=>({...p,active:e.target.checked}))} className="accent-brand-500 w-4 h-4" /> Kích hoạt
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { updateEffect(fx.id, editForm); setEditingId(null) }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)' }}><Save size={11}/> Lưu</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-xl text-xs text-white/45" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}><X size={11}/></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:`${tc}15`, border:`1px solid ${tc}30` }}>{fx.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{fx.name}</p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background:`${tc}20`, color:tc }}>{fx.type}</span>
                        </div>
                        <code className="text-[10px] text-white/35 mt-0.5 truncate block">{fx.value}</code>
                      </div>
                      <button onClick={() => updateEffect(fx.id,{active:!fx.active})} className={clsx('p-1.5 rounded-lg transition-all flex-shrink-0', fx.active?'text-emerald-400 bg-emerald-500/10':'text-white/25 bg-white/[0.04]')}>
                        {fx.active ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                      </button>
                    </div>
                    <div className="h-10 rounded-xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
                      {fx.type === 'filter' ? <div className="w-full h-full" style={{ background:'linear-gradient(90deg,#6e4bff,#4dd0ff)', filter:fx.value }} /> : <div className="w-full h-full" style={{ background:fx.value }} />}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(fx.id); setEditForm({...fx}) }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-brand-300" style={{ background:'rgba(110,75,255,0.1)', border:'1px solid rgba(110,75,255,0.25)' }}><Edit3 size={11}/> Sửa</button>
                      <button onClick={() => setConfirmDeleteId(fx.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-rose-300" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)' }}><Trash2 size={11}/> Xóa</button>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

const TABS = [
  { id:'resources',  label:'Resources',  icon:Image    },
  { id:'commands',   label:'Commands',   icon:Terminal },
  { id:'categories', label:'Categories', icon:Tag      },
  { id:'effects',    label:'Effects',    icon:Sparkles },
]

export default function AdminComposerPage() {
  const navigate = useNavigate()
  const isAdmin = useAuthStore(s => s.isAdmin())
  const { resources, commands, categories, effects } = useComposerStore()
  const [activeTab, setActiveTab] = useState('resources')

  if (!isAdmin) { navigate('/'); return null }

  const counts = { resources: resources.length, commands: commands.length, categories: categories.length, effects: effects.length }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ ease:[0.22,0.8,0.22,1] }}
        className="relative overflow-hidden rounded-3xl p-6"
        style={{ background:'linear-gradient(135deg, rgba(110,75,255,0.2) 0%, rgba(77,208,255,0.1) 60%, rgba(43,242,192,0.06) 100%)', border:'1px solid rgba(110,75,255,0.3)', backdropFilter:'blur(32px) saturate(200%)' }}>
        <div className="absolute -right-12 -top-12 w-60 h-60 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(110,75,255,0.3) 0%, transparent 70%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(110,75,255,0.25)', border:'1px solid rgba(110,75,255,0.4)' }}><Shield size={18} className="text-brand-300" /></div>
              <span className="text-xs font-semibold text-brand-300 uppercase tracking-widest">Admin Panel</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">AI Composer Manager</h1>
            <p className="text-white/40 text-sm mt-1">Quản lý resources, lệnh AI, danh mục và effects cho hệ thống ghép ảnh</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => (
              <div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
                <t.icon size={12} className="text-white/50" />
                <span className="text-white/50">{t.label}:</span>
                <span className="font-semibold text-white">{counts[t.id]}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }} className="flex gap-2 flex-wrap">
        {TABS.map(t => <TabBtn key={t.id} active={activeTab===t.id} onClick={() => setActiveTab(t.id)} icon={t.icon} label={t.label} />)}
      </motion.div>

      <motion.div key={activeTab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ ease:[0.22,0.8,0.22,1] }} className="rounded-2xl p-6" style={CARD}>
        {activeTab === 'resources'  && <ResourcesTab />}
        {activeTab === 'commands'   && <CommandsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'effects'    && <EffectsTab />}
      </motion.div>
    </div>
  )
}
