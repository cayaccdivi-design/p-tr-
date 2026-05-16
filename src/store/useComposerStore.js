import { create } from 'zustand'

// ─── localStorage keys ──────────────────────────────────────────────
const ADMIN_RESOURCES_KEY  = 'nova_composer_resources_v1'
const ADMIN_COMMANDS_KEY   = 'nova_composer_commands_v1'
const ADMIN_CATEGORIES_KEY = 'nova_composer_categories_v1'
const ADMIN_EFFECTS_KEY    = 'nova_composer_effects_v1'

const loadJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}
const saveJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) }
  catch (err) { console.warn(`[composer] save ${key} failed`, err) }
}

// ─── Admin defaults ─────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'vehicles',   name: 'Xe cộ',        icon: '🚗',    color: '#6e4bff' },
  { id: 'characters', name: 'Nhân vật',     icon: '🧑‍🎨', color: '#ec4899' },
  { id: 'nature',     name: 'Thiên nhiên',  icon: '🌿',    color: '#10b981' },
  { id: 'effects',    name: 'Hiệu ứng',     icon: '✨',    color: '#f59e0b' },
  { id: 'logos',      name: 'Logo & Brand', icon: '🏷️',   color: '#0ea5e9' },
  { id: 'stickers',   name: 'Sticker',      icon: '🎭',    color: '#8b5cf6' },
]

const DEFAULT_COMMANDS = [
  { id: 'cmd_1', keyword: 'xe thể thao',    categoryId: 'vehicles',   resourceId: null, prompt: 'Thêm xe thể thao vào background',           icon: '🏎️', active: true },
  { id: 'cmd_2', keyword: 'anime',          categoryId: 'characters', resourceId: null, prompt: 'Thêm nhân vật anime phong cách Nhật Bản',  icon: '🧑‍🎨', active: true },
  { id: 'cmd_3', keyword: 'hiệu ứng lửa',   categoryId: 'effects',    resourceId: null, prompt: 'Thêm hiệu ứng lửa rực rỡ',                  icon: '🔥', active: true },
  { id: 'cmd_4', keyword: 'logo góc phải',  categoryId: 'logos',      resourceId: null, prompt: 'Đặt logo ở góc phải dưới',                  icon: '🏷️', active: true },
  { id: 'cmd_5', keyword: 'hoa anh đào',    categoryId: 'nature',     resourceId: null, prompt: 'Thêm cánh hoa anh đào bay',                 icon: '🌸', active: true },
  { id: 'cmd_6', keyword: 'tuyết rơi',      categoryId: 'effects',    resourceId: null, prompt: 'Thêm hiệu ứng tuyết rơi nhẹ nhàng',         icon: '❄️', active: true },
  { id: 'cmd_7', keyword: 'siêu anh hùng',  categoryId: 'characters', resourceId: null, prompt: 'Thêm nhân vật siêu anh hùng',               icon: '🦸', active: true },
  { id: 'cmd_8', keyword: 'rồng lửa',       categoryId: 'characters', resourceId: null, prompt: 'Thêm rồng lửa khổng lồ uy nghi',           icon: '🐉', active: true },
]

const DEFAULT_EFFECTS = [
  { id: 'fx_blur',       name: 'Blur nền',    icon: '🌫️', type: 'filter',  value: 'blur(3px)',                         active: true },
  { id: 'fx_brightness', name: 'Sáng hơn',    icon: '☀️',  type: 'filter',  value: 'brightness(1.3)',                   active: true },
  { id: 'fx_contrast',   name: 'Tương phản',  icon: '⚫',  type: 'filter',  value: 'contrast(1.4)',                     active: true },
  { id: 'fx_grayscale',  name: 'Đen trắng',   icon: '🎞️', type: 'filter',  value: 'grayscale(1)',                      active: true },
  { id: 'fx_sepia',      name: 'Sepia',       icon: '🟤',  type: 'filter',  value: 'sepia(0.8)',                        active: true },
  { id: 'fx_saturate',   name: 'Sặc sỡ',      icon: '🌈',  type: 'filter',  value: 'saturate(2)',                       active: true },
  { id: 'fx_vignette',   name: 'Vignette',    icon: '🔲',  type: 'overlay', value: 'radial-gradient(ellipse, transparent 60%, rgba(0,0,0,0.7) 100%)', active: true },
  { id: 'fx_neon',       name: 'Neon Glow',   icon: '💜',  type: 'overlay', value: 'radial-gradient(ellipse at 50% 50%, rgba(110,75,255,0.3) 0%, transparent 70%)', active: true },
  { id: 'fx_sunset',     name: 'Sunset',      icon: '🌅',  type: 'overlay', value: 'linear-gradient(to bottom, rgba(255,100,0,0.2) 0%, rgba(255,200,0,0.15) 100%)', active: true },
  { id: 'fx_dark',       name: 'Dark Mode',   icon: '🌑',  type: 'overlay', value: 'rgba(0,0,0,0.45)',                  active: true },
]

// ─── AI helpers ─────────────────────────────────────────────────────
// Pick a position based on Vietnamese / English keywords. Returns
// already-rounded x/y/scale values relative to the canvas.
export function getAIPosition(keyword, canvasW, canvasH, imgW, imgH) {
  const kw = keyword.toLowerCase()
  let x = (canvasW - imgW) / 2
  let y = (canvasH - imgH) / 2
  let scale = 0.6

  if (kw.includes('góc phải') || kw.includes('bottom-right')) {
    x = canvasW - imgW * 0.35 - 20; y = canvasH - imgH * 0.35 - 20; scale = 0.35
  } else if (kw.includes('góc trái') || kw.includes('bottom-left')) {
    x = 20; y = canvasH - imgH * 0.35 - 20; scale = 0.35
  } else if (kw.includes('logo') || kw.includes('watermark')) {
    x = canvasW - imgW * 0.25 - 16; y = canvasH - imgH * 0.25 - 16; scale = 0.25
  } else if (kw.includes('trái') || kw === 'left') {
    x = 20; scale = 0.6
  } else if (kw.includes('phải') || kw === 'right') {
    x = canvasW - imgW * 0.6 - 20; scale = 0.6
  } else if (kw.includes('trên') || kw.includes('top')) {
    y = 20; scale = 0.55
  } else if (kw.includes('dưới') || kw.includes('bottom')) {
    y = canvasH - imgH * 0.55 - 20; scale = 0.55
  } else if (kw.includes('xe') || kw.includes('car')) {
    y = canvasH - imgH * 0.65 - 30; scale = 0.65
  } else if (kw.includes('nhân vật') || kw.includes('anime')) {
    x = canvasW * 0.55; y = canvasH * 0.05; scale = 0.7
  } else if (kw.includes('hiệu ứng') || kw.includes('lửa') || kw.includes('tuyết')) {
    x = 0; y = 0; scale = 1
  } else {
    scale = 0.5
  }

  // Clamp
  const w = imgW * scale, h = imgH * scale
  x = Math.max(0, Math.min(x, canvasW - w))
  y = Math.max(0, Math.min(y, canvasH - h))
  return { x: Math.round(x), y: Math.round(y), scale }
}

// Scan input text for the first matching active command and pick a
// resource (explicit > random within category).
export function processAICommand(input, commands, resources) {
  const lower = input.toLowerCase()
  const matched = commands.find(c => c.active && lower.includes(c.keyword.toLowerCase()))
  if (!matched) return null

  let resource = null
  if (matched.resourceId) {
    resource = resources.find(r => r.id === matched.resourceId && r.active !== false) || null
  }
  if (!resource) {
    const pool = resources.filter(r => r.categoryId === matched.categoryId && r.active !== false)
    if (pool.length > 0) resource = pool[Math.floor(Math.random() * pool.length)]
  }
  return { command: matched, resource }
}

// ─── Layer factory ──────────────────────────────────────────────────
let layerCounter = 0
const newLayerId = () => `layer_${Date.now()}_${++layerCounter}`

const makeLayer = (overrides = {}) => ({
  id: newLayerId(),
  type: 'image',
  name: 'Layer',
  url: null,
  text: '',
  x: 100, y: 100,
  width: 200, height: 200,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  blendMode: 'normal',
  ...overrides,
})

// ─── Store ──────────────────────────────────────────────────────────
export const useComposerStore = create((set, get) => ({
  // Canvas state
  background: null,                    // { url, width, height }
  layers: [],                          // ordered array — first = bottom
  selectedLayerId: null,
  canvasSize: { width: 900, height: 600 },

  // Undo/redo (snapshots of {background, layers})
  history: [],
  historyIndex: -1,

  // AI processing
  isProcessing: false,
  aiLog: [],

  // Admin (persisted)
  resources:  loadJSON(ADMIN_RESOURCES_KEY,  []),
  commands:   loadJSON(ADMIN_COMMANDS_KEY,   DEFAULT_COMMANDS),
  categories: loadJSON(ADMIN_CATEGORIES_KEY, DEFAULT_CATEGORIES),
  effects:    loadJSON(ADMIN_EFFECTS_KEY,    DEFAULT_EFFECTS),

  // ── Canvas ────────────────────────────────────────────────────────
  setBackground: (bg) => {
    set({ background: bg })
    get()._pushHistory()
  },

  setCanvasSize: (size) => set({ canvasSize: size }),

  // ── Layers ────────────────────────────────────────────────────────
  // Layer order is encoded purely by array index. The render layer just
  // walks `layers` in order — first item = bottom-most.
  addLayer: (props = {}) => {
    const layer = makeLayer(props)
    set(s => ({ layers: [...s.layers, layer], selectedLayerId: layer.id }))
    get()._pushHistory()
    return layer.id
  },

  updateLayer: (id, patch) => {
    set(s => ({ layers: s.layers.map(l => l.id === id ? { ...l, ...patch } : l) }))
  },

  removeLayer: (id) => {
    set(s => ({
      layers: s.layers.filter(l => l.id !== id),
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
    }))
    get()._pushHistory()
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  // Move a layer relative to its current array position. PS-style: "up"
  // means closer to the viewer (later index in array).
  moveLayerUp: (id) => {
    const { layers } = get()
    const i = layers.findIndex(l => l.id === id)
    if (i < 0 || i === layers.length - 1) return
    const next = layers.slice()
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    set({ layers: next })
    get()._pushHistory()
  },

  moveLayerDown: (id) => {
    const { layers } = get()
    const i = layers.findIndex(l => l.id === id)
    if (i <= 0) return
    const next = layers.slice()
    ;[next[i], next[i - 1]] = [next[i - 1], next[i]]
    set({ layers: next })
    get()._pushHistory()
  },

  duplicateLayer: (id) => {
    const layer = get().layers.find(l => l.id === id)
    if (!layer) return
    return get().addLayer({
      ...layer,
      name: layer.name + ' (copy)',
      x: layer.x + 20, y: layer.y + 20,
    })
  },

  // ── AI processing ─────────────────────────────────────────────────
  processCommand: async (input) => {
    const text = input.trim()
    if (!text) return { success: false, message: 'Empty input' }

    const logId = Date.now()
    set(s => ({
      isProcessing: true,
      aiLog: [{ id: logId, text, time: new Date().toLocaleTimeString('vi-VN'), status: 'processing', message: 'AI đang xử lý...' }, ...s.aiLog].slice(0, 20),
    }))

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))

    const { commands, resources, canvasSize } = get()
    const result = processAICommand(text, commands, resources)

    const updateLog = (status, message) => set(s => ({
      isProcessing: false,
      aiLog: s.aiLog.map(l => l.id === logId ? { ...l, status, message } : l),
    }))

    if (!result) {
      updateLog('error', '❌ Không tìm thấy lệnh phù hợp. Admin cần thêm lệnh này!')
      return { success: false, message: 'Không tìm thấy lệnh phù hợp' }
    }
    const { command, resource } = result
    if (!resource) {
      updateLog('warn', `⚠️ Lệnh "${command.keyword}" chưa có resource ảnh.`)
      return { success: false, message: 'Chưa có resource cho lệnh này' }
    }

    const imgW = resource.width || 300
    const imgH = resource.height || 300
    const pos = getAIPosition(text, canvasSize.width, canvasSize.height, imgW, imgH)
    const id = get().addLayer({
      type: 'image',
      name: command.keyword,
      url: resource.url,
      x: pos.x, y: pos.y,
      width: Math.round(imgW * pos.scale),
      height: Math.round(imgH * pos.scale),
      opacity: resource.defaultOpacity ?? 1,
      blendMode: resource.blendMode || 'normal',
    })

    updateLog('success', `✅ Đã thêm "${command.keyword}" — ${command.prompt}`)
    return { success: true, layerId: id, command, resource }
  },

  clearLog: () => set({ aiLog: [] }),

  // ── History ───────────────────────────────────────────────────────
  _pushHistory: () => {
    const { layers, background, history, historyIndex } = get()
    const snap = JSON.stringify({ layers, background })
    const next = history.slice(0, historyIndex + 1)
    next.push(snap)
    const trimmed = next.slice(-30)
    set({ history: trimmed, historyIndex: trimmed.length - 1 })
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const snap = JSON.parse(history[historyIndex - 1])
    set({ ...snap, historyIndex: historyIndex - 1, selectedLayerId: null })
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const snap = JSON.parse(history[historyIndex + 1])
    set({ ...snap, historyIndex: historyIndex + 1, selectedLayerId: null })
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // ── Admin CRUD (resources / commands / categories / effects) ──────
  // All four entities share the same shape: id-keyed list persisted to
  // localStorage. _crud is the generic factory.
  _crud: (key, storageKey, defaults = {}) => ({
    add: (item) => {
      const list = [...get()[key], { id: `${key}_${Date.now()}`, createdAt: new Date().toISOString(), ...defaults, ...item }]
      saveJSON(storageKey, list); set({ [key]: list })
    },
    update: (id, patch) => {
      const list = get()[key].map(x => x.id === id ? { ...x, ...patch } : x)
      saveJSON(storageKey, list); set({ [key]: list })
    },
    remove: (id) => {
      const list = get()[key].filter(x => x.id !== id)
      saveJSON(storageKey, list); set({ [key]: list })
    },
  }),

  addResource:    (r) => get()._crud('resources',  ADMIN_RESOURCES_KEY,  { active: true, blendMode: 'normal', defaultOpacity: 1 }).add(r),
  updateResource: (id, p) => get()._crud('resources',  ADMIN_RESOURCES_KEY).update(id, p),
  removeResource: (id)    => get()._crud('resources',  ADMIN_RESOURCES_KEY).remove(id),

  addCommand:     (c) => get()._crud('commands',   ADMIN_COMMANDS_KEY,   { active: true, icon: '✨' }).add(c),
  updateCommand:  (id, p) => get()._crud('commands',   ADMIN_COMMANDS_KEY).update(id, p),
  removeCommand:  (id)    => get()._crud('commands',   ADMIN_COMMANDS_KEY).remove(id),

  addCategory:    (c) => get()._crud('categories', ADMIN_CATEGORIES_KEY, { icon: '📁', color: '#6e4bff' }).add(c),
  updateCategory: (id, p) => get()._crud('categories', ADMIN_CATEGORIES_KEY).update(id, p),
  removeCategory: (id)    => get()._crud('categories', ADMIN_CATEGORIES_KEY).remove(id),

  addEffect:      (e) => get()._crud('effects',    ADMIN_EFFECTS_KEY,    { active: true, icon: '✨', type: 'filter' }).add(e),
  updateEffect:   (id, p) => get()._crud('effects',    ADMIN_EFFECTS_KEY).update(id, p),
  removeEffect:   (id)    => get()._crud('effects',    ADMIN_EFFECTS_KEY).remove(id),

  // ── Reset ─────────────────────────────────────────────────────────
  resetCanvas: () => set({
    background: null,
    layers: [],
    selectedLayerId: null,
    history: [],
    historyIndex: -1,
    aiLog: [],
  }),
}))
