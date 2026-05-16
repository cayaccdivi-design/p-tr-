import { create } from 'zustand'

const STORAGE_KEY = 'nova_composer_v1'
const ADMIN_RESOURCES_KEY = 'nova_composer_resources_v1'
const ADMIN_COMMANDS_KEY = 'nova_composer_commands_v1'
const ADMIN_CATEGORIES_KEY = 'nova_composer_categories_v1'
const ADMIN_EFFECTS_KEY = 'nova_composer_effects_v1'

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback }
}

// ── Default Admin Data ─────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'vehicles',    name: 'Xe cộ',         icon: '🚗', color: '#6e4bff' },
  { id: 'characters',  name: 'Nhân vật',       icon: '🧑‍🎨', color: '#ec4899' },
  { id: 'nature',      name: 'Thiên nhiên',    icon: '🌿', color: '#10b981' },
  { id: 'effects',     name: 'Hiệu ứng',       icon: '✨', color: '#f59e0b' },
  { id: 'logos',       name: 'Logo & Brand',   icon: '🏷️', color: '#0ea5e9' },
  { id: 'stickers',    name: 'Sticker',        icon: '🎭', color: '#8b5cf6' },
]

const DEFAULT_COMMANDS = [
  { id: 'cmd_1', keyword: 'xe thể thao',    categoryId: 'vehicles',   resourceId: null, prompt: 'Thêm xe thể thao vào background, căn vị trí phù hợp với phối cảnh', icon: '🏎️', active: true },
  { id: 'cmd_2', keyword: 'anime',          categoryId: 'characters', resourceId: null, prompt: 'Thêm nhân vật anime phong cách Nhật Bản, blend màu tự nhiên',         icon: '🧑‍🎨', active: true },
  { id: 'cmd_3', keyword: 'hiệu ứng lửa',  categoryId: 'effects',    resourceId: null, prompt: 'Thêm hiệu ứng lửa rực rỡ, ánh sáng cam đỏ tự nhiên',                  icon: '🔥', active: true },
  { id: 'cmd_4', keyword: 'logo góc phải', categoryId: 'logos',      resourceId: null, prompt: 'Đặt logo ở góc phải dưới, kích thước vừa phải không che nội dung',       icon: '🏷️', active: true },
  { id: 'cmd_5', keyword: 'hoa anh đào',   categoryId: 'nature',     resourceId: null, prompt: 'Thêm cánh hoa anh đào bay, màu hồng nhẹ nhàng lãng mạn',               icon: '🌸', active: true },
  { id: 'cmd_6', keyword: 'tuyết rơi',     categoryId: 'effects',    resourceId: null, prompt: 'Thêm hiệu ứng tuyết rơi nhẹ nhàng, màu trắng trong suốt',               icon: '❄️', active: true },
  { id: 'cmd_7', keyword: 'siêu anh hùng', categoryId: 'characters', resourceId: null, prompt: 'Thêm nhân vật siêu anh hùng năng động, blend ánh sáng với nền',         icon: '🦸', active: true },
  { id: 'cmd_8', keyword: 'rồng lửa',      categoryId: 'characters', resourceId: null, prompt: 'Thêm rồng lửa khổng lồ uy nghi, ánh sáng cam vàng hoành tráng',         icon: '🐉', active: true },
]

const DEFAULT_EFFECTS = [
  { id: 'fx_blur',      name: 'Blur nền',      icon: '🌫️', type: 'filter',   value: 'blur(3px)',                         active: true },
  { id: 'fx_brightness',name: 'Sáng hơn',      icon: '☀️',  type: 'filter',   value: 'brightness(1.3)',                   active: true },
  { id: 'fx_contrast',  name: 'Tương phản',    icon: '⚫',  type: 'filter',   value: 'contrast(1.4)',                     active: true },
  { id: 'fx_grayscale', name: 'Đen trắng',     icon: '🎞️', type: 'filter',   value: 'grayscale(1)',                      active: true },
  { id: 'fx_sepia',     name: 'Sepia',          icon: '🟤',  type: 'filter',   value: 'sepia(0.8)',                        active: true },
  { id: 'fx_saturate',  name: 'Sặc sỡ',        icon: '🌈',  type: 'filter',   value: 'saturate(2)',                       active: true },
  { id: 'fx_vignette',  name: 'Vignette',       icon: '🔲',  type: 'overlay',  value: 'radial-gradient(ellipse, transparent 60%, rgba(0,0,0,0.7) 100%)', active: true },
  { id: 'fx_neon',      name: 'Neon Glow',      icon: '💜',  type: 'overlay',  value: 'radial-gradient(ellipse at 50% 50%, rgba(110,75,255,0.3) 0%, transparent 70%)', active: true },
  { id: 'fx_sunset',    name: 'Sunset',         icon: '🌅',  type: 'overlay',  value: 'linear-gradient(to bottom, rgba(255,100,0,0.2) 0%, rgba(255,200,0,0.15) 100%)', active: true },
  { id: 'fx_dark',      name: 'Dark Mode',      icon: '🌑',  type: 'overlay',  value: 'rgba(0,0,0,0.45)',                  active: true },
]

// ── AI Position Logic ──────────────────────────────────────
export function getAIPosition(keyword, canvasW, canvasH, imgW, imgH) {
  const kw = keyword.toLowerCase()
  let x = (canvasW - imgW) / 2
  let y = (canvasH - imgH) / 2
  let scale = 1

  if (kw.includes('góc phải') || kw.includes('right')) {
    x = canvasW - imgW - 20; y = canvasH - imgH - 20; scale = 0.35
  } else if (kw.includes('góc trái') || kw.includes('left')) {
    x = 20; y = canvasH - imgH - 20; scale = 0.35
  } else if (kw.includes('trái') || kw.includes('left')) {
    x = 20; y = (canvasH - imgH) / 2; scale = 0.6
  } else if (kw.includes('phải') || kw.includes('right')) {
    x = canvasW - imgW * 0.6 - 20; y = (canvasH - imgH * 0.6) / 2; scale = 0.6
  } else if (kw.includes('trên') || kw.includes('top')) {
    x = (canvasW - imgW) / 2; y = 20; scale = 0.55
  } else if (kw.includes('dưới') || kw.includes('bottom')) {
    x = (canvasW - imgW) / 2; y = canvasH - imgH - 20; scale = 0.55
  } else if (kw.includes('logo') || kw.includes('watermark')) {
    x = canvasW - imgW * 0.25 - 16; y = canvasH - imgH * 0.25 - 16; scale = 0.25
  } else if (kw.includes('xe') || kw.includes('car') || kw.includes('vehicle')) {
    x = (canvasW - imgW * 0.65) / 2; y = canvasH - imgH * 0.65 - 30; scale = 0.65
  } else if (kw.includes('nhân vật') || kw.includes('character') || kw.includes('anime')) {
    x = canvasW * 0.55; y = canvasH * 0.05; scale = 0.7
  } else if (kw.includes('hiệu ứng') || kw.includes('effect') || kw.includes('lửa') || kw.includes('tuyết')) {
    x = 0; y = 0; scale = 1.0
  } else {
    x = (canvasW - imgW * 0.5) / 2; y = (canvasH - imgH * 0.5) / 2; scale = 0.5
  }

  return { x: Math.round(x), y: Math.round(y), scale }
}

// ── AI Process Command ─────────────────────────────────────
export function processAICommand(inputText, commands, resources) {
  const lower = inputText.toLowerCase()
  
  // Find matching command by keyword
  const matchedCmd = commands.find(cmd =>
    cmd.active && lower.includes(cmd.keyword.toLowerCase())
  )
  
  if (!matchedCmd) return null

  // Find resource for this command
  let resource = null
  if (matchedCmd.resourceId) {
    resource = resources.find(r => r.id === matchedCmd.resourceId)
  } else {
    // Find any resource matching category
    const catResources = resources.filter(r => r.categoryId === matchedCmd.categoryId && r.active)
    if (catResources.length > 0) {
      resource = catResources[Math.floor(Math.random() * catResources.length)]
    }
  }

  return { command: matchedCmd, resource }
}

// ── Store ──────────────────────────────────────────────────
export const useComposerStore = create((set, get) => ({
  // Canvas state
  background: null,       // { url, width, height }
  layers: [],             // [{ id, type, name, url, x, y, width, height, rotation, opacity, visible, locked, effects, zIndex }]
  selectedLayerId: null,
  canvasSize: { width: 900, height: 600 },
  history: [],
  historyIndex: -1,
  isProcessing: false,
  aiLog: [],              // AI activity log

  // Admin data (persisted)
  resources: loadJSON(ADMIN_RESOURCES_KEY, []),
  commands: loadJSON(ADMIN_COMMANDS_KEY, DEFAULT_COMMANDS),
  categories: loadJSON(ADMIN_CATEGORIES_KEY, DEFAULT_CATEGORIES),
  effects: loadJSON(ADMIN_EFFECTS_KEY, DEFAULT_EFFECTS),

  // ── Canvas ────────────────────────────────────────────────
  setBackground: (bg) => {
    set({ background: bg })
    get()._pushHistory()
  },

  setCanvasSize: (size) => set({ canvasSize: size }),

  // ── Layers ───────────────────────────────────────────────
  addLayer: (layer) => {
    const layers = [...get().layers]
    const newLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      type: 'image',
      name: 'Layer mới',
      url: null,
      x: 100, y: 100,
      width: 200, height: 200,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      effects: [],
      blendMode: 'normal',
      zIndex: layers.length,
      ...layer,
    }
    set({ layers: [...layers, newLayer], selectedLayerId: newLayer.id })
    get()._pushHistory()
    return newLayer.id
  },

  updateLayer: (id, patch) => {
    set(s => ({
      layers: s.layers.map(l => l.id === id ? { ...l, ...patch } : l)
    }))
  },

  removeLayer: (id) => {
    set(s => ({
      layers: s.layers.filter(l => l.id !== id),
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId
    }))
    get()._pushHistory()
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  reorderLayers: (layers) => {
    set({ layers })
    get()._pushHistory()
  },

  moveLayerUp: (id) => {
    const layers = [...get().layers]
    const idx = layers.findIndex(l => l.id === id)
    if (idx < layers.length - 1) {
      ;[layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]]
      set({ layers })
    }
  },

  moveLayerDown: (id) => {
    const layers = [...get().layers]
    const idx = layers.findIndex(l => l.id === id)
    if (idx > 0) {
      ;[layers[idx], layers[idx - 1]] = [layers[idx - 1], layers[idx]]
      set({ layers })
    }
  },

  duplicateLayer: (id) => {
    const layer = get().layers.find(l => l.id === id)
    if (!layer) return
    get().addLayer({
      ...layer,
      id: undefined,
      name: layer.name + ' (copy)',
      x: layer.x + 20,
      y: layer.y + 20,
    })
  },

  // ── AI Processing ─────────────────────────────────────────
  processCommand: async (inputText) => {
    const { commands, resources, background, canvasSize } = get()
    set({ isProcessing: true })

    const logEntry = {
      id: Date.now(),
      text: inputText,
      time: new Date().toLocaleTimeString('vi-VN'),
      status: 'processing',
      message: 'AI đang xử lý...',
    }
    set(s => ({ aiLog: [logEntry, ...s.aiLog].slice(0, 20) }))

    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600))

    const result = processAICommand(inputText, commands, resources)

    if (!result) {
      set(s => ({
        isProcessing: false,
        aiLog: s.aiLog.map(l => l.id === logEntry.id
          ? { ...l, status: 'error', message: '❌ Không tìm thấy lệnh phù hợp. Admin cần thêm lệnh này!' }
          : l)
      }))
      return { success: false, message: 'Không tìm thấy lệnh phù hợp' }
    }

    const { command, resource } = result

    if (!resource) {
      set(s => ({
        isProcessing: false,
        aiLog: s.aiLog.map(l => l.id === logEntry.id
          ? { ...l, status: 'warn', message: `⚠️ Lệnh "${command.keyword}" chưa có resource ảnh. Admin cần upload ảnh!` }
          : l)
      }))
      return { success: false, message: 'Chưa có resource ảnh cho lệnh này' }
    }

    // Calculate smart position
    const imgW = resource.width || 300
    const imgH = resource.height || 300
    const pos = getAIPosition(inputText, canvasSize.width, canvasSize.height, imgW, imgH)

    const layerId = get().addLayer({
      type: 'image',
      name: command.keyword,
      url: resource.url,
      x: pos.x,
      y: pos.y,
      width: Math.round(imgW * pos.scale),
      height: Math.round(imgH * pos.scale),
      opacity: resource.defaultOpacity || 1,
      blendMode: resource.blendMode || 'normal',
      categoryId: command.categoryId,
      resourceId: resource.id,
    })

    set(s => ({
      isProcessing: false,
      aiLog: s.aiLog.map(l => l.id === logEntry.id
        ? { ...l, status: 'success', message: `✅ Đã thêm "${command.keyword}" — ${command.prompt}` }
        : l)
    }))

    return { success: true, layerId, resource, command }
  },

  clearLog: () => set({ aiLog: [] }),

  // ── History (Undo/Redo) ───────────────────────────────────
  _pushHistory: () => {
    const { layers, background, history, historyIndex } = get()
    const snapshot = JSON.stringify({ layers, background })
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(snapshot)
    set({ history: newHistory.slice(-30), historyIndex: newHistory.length - 1 })
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const snap = JSON.parse(history[historyIndex - 1])
    set({ ...snap, historyIndex: historyIndex - 1 })
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const snap = JSON.parse(history[historyIndex + 1])
    set({ ...snap, historyIndex: historyIndex + 1 })
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // ── Admin: Resources ─────────────────────────────────────
  addResource: (resource) => {
    const resources = [...get().resources, {
      id: `res_${Date.now()}`,
      name: '',
      url: '',
      categoryId: '',
      width: 300,
      height: 300,
      active: true,
      blendMode: 'normal',
      defaultOpacity: 1,
      tags: [],
      createdAt: new Date().toISOString(),
      ...resource,
    }]
    localStorage.setItem(ADMIN_RESOURCES_KEY, JSON.stringify(resources))
    set({ resources })
  },

  updateResource: (id, patch) => {
    const resources = get().resources.map(r => r.id === id ? { ...r, ...patch } : r)
    localStorage.setItem(ADMIN_RESOURCES_KEY, JSON.stringify(resources))
    set({ resources })
  },

  removeResource: (id) => {
    const resources = get().resources.filter(r => r.id !== id)
    localStorage.setItem(ADMIN_RESOURCES_KEY, JSON.stringify(resources))
    set({ resources })
  },

  // ── Admin: Commands ──────────────────────────────────────
  addCommand: (cmd) => {
    const commands = [...get().commands, {
      id: `cmd_${Date.now()}`,
      keyword: '',
      categoryId: '',
      resourceId: null,
      prompt: '',
      icon: '✨',
      active: true,
      createdAt: new Date().toISOString(),
      ...cmd,
    }]
    localStorage.setItem(ADMIN_COMMANDS_KEY, JSON.stringify(commands))
    set({ commands })
  },

  updateCommand: (id, patch) => {
    const commands = get().commands.map(c => c.id === id ? { ...c, ...patch } : c)
    localStorage.setItem(ADMIN_COMMANDS_KEY, JSON.stringify(commands))
    set({ commands })
  },

  removeCommand: (id) => {
    const commands = get().commands.filter(c => c.id !== id)
    localStorage.setItem(ADMIN_COMMANDS_KEY, JSON.stringify(commands))
    set({ commands })
  },

  // ── Admin: Categories ────────────────────────────────────
  addCategory: (cat) => {
    const categories = [...get().categories, {
      id: `cat_${Date.now()}`,
      name: '',
      icon: '📁',
      color: '#6e4bff',
      createdAt: new Date().toISOString(),
      ...cat,
    }]
    localStorage.setItem(ADMIN_CATEGORIES_KEY, JSON.stringify(categories))
    set({ categories })
  },

  updateCategory: (id, patch) => {
    const categories = get().categories.map(c => c.id === id ? { ...c, ...patch } : c)
    localStorage.setItem(ADMIN_CATEGORIES_KEY, JSON.stringify(categories))
    set({ categories })
  },

  removeCategory: (id) => {
    const categories = get().categories.filter(c => c.id !== id)
    localStorage.setItem(ADMIN_CATEGORIES_KEY, JSON.stringify(categories))
    set({ categories })
  },

  // ── Admin: Effects ───────────────────────────────────────
  addEffect: (fx) => {
    const effects = [...get().effects, {
      id: `fx_${Date.now()}`,
      name: '',
      icon: '✨',
      type: 'filter',
      value: '',
      active: true,
      createdAt: new Date().toISOString(),
      ...fx,
    }]
    localStorage.setItem(ADMIN_EFFECTS_KEY, JSON.stringify(effects))
    set({ effects })
  },

  updateEffect: (id, patch) => {
    const effects = get().effects.map(e => e.id === id ? { ...e, ...patch } : e)
    localStorage.setItem(ADMIN_EFFECTS_KEY, JSON.stringify(effects))
    set({ effects })
  },

  removeEffect: (id) => {
    const effects = get().effects.filter(e => e.id !== id)
    localStorage.setItem(ADMIN_EFFECTS_KEY, JSON.stringify(effects))
    set({ effects })
  },

  // ── Reset ────────────────────────────────────────────────
  resetCanvas: () => {
    set({
      background: null,
      layers: [],
      selectedLayerId: null,
      history: [],
      historyIndex: -1,
      aiLog: [],
    })
  },
}))
