import { create } from 'zustand'

// ─── LocalStorage keys ───────────────────────────────────────────────
const GROUPS_KEY = 'nova_mockup_groups_v1'
const ITEMS_KEY  = 'nova_mockup_items_v1'

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
const saveJSON = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Default groups ──────────────────────────────────────────────────
const DEFAULT_GROUPS = [
  { id: 'weapons',    name: 'Vũ khí',       icon: '⚔️',  color: '#ef4444', desc: 'Kiếm, giáo, súng…' },
  { id: 'armor',      name: 'Giáp',          icon: '🛡️',  color: '#6e4bff', desc: 'Áo giáp, mũ trụ…' },
  { id: 'potions',    name: 'Thuốc',         icon: '🧪',  color: '#10b981', desc: 'Bình máu, mana…' },
  { id: 'accessories',name: 'Phụ kiện',      icon: '💎',  color: '#f59e0b', desc: 'Nhẫn, vòng cổ…' },
  { id: 'mounts',     name: 'Ngựa/Cưỡi',    icon: '🐉',  color: '#ec4899', desc: 'Phương tiện cưỡi…' },
  { id: 'consumables',name: 'Tiêu hao',      icon: '🍖',  color: '#14b8a6', desc: 'Đồ ăn, bùa chú…' },
]

// ─── AI auto-placement engine ────────────────────────────────────────
/**
 * Given a background size and an item, compute where to place it.
 *
 * Strategy:
 * 1. Admin can save a "reference position" on an item: { anchorX, anchorY, scale }
 *    as percentages (0-1) of the canvas. If present, use those directly.
 * 2. Fall back to group-based heuristics:
 *    weapons  → center-right, lower half
 *    armor    → center, slightly lower
 *    potions  → bottom-right corner, small
 *    accessories → bottom-left, small
 *    mounts   → center-bottom, large
 *    default  → center
 */
export function computePlacement(item, bgW, bgH) {
  // If admin saved a reference position, honor it
  if (item.anchorX != null && item.anchorY != null && item.anchorScale != null) {
    const scale = item.anchorScale
    const w = (item.naturalW || 300) * scale
    const h = (item.naturalH || 300) * scale
    const x = bgW * item.anchorX - w / 2
    const y = bgH * item.anchorY - h / 2
    return {
      x: Math.round(Math.max(0, Math.min(x, bgW - w))),
      y: Math.round(Math.max(0, Math.min(y, bgH - h))),
      w: Math.round(w),
      h: Math.round(h),
      scale,
    }
  }

  // Group-based heuristics
  const nW = item.naturalW || 300
  const nH = item.naturalH || 300
  let ax = 0.5, ay = 0.5, scale = 0.35

  switch (item.groupId) {
    case 'weapons':
      ax = 0.62; ay = 0.58; scale = 0.42; break
    case 'armor':
      ax = 0.5;  ay = 0.52; scale = 0.45; break
    case 'potions':
      ax = 0.82; ay = 0.78; scale = 0.20; break
    case 'accessories':
      ax = 0.18; ay = 0.78; scale = 0.18; break
    case 'mounts':
      ax = 0.5;  ay = 0.68; scale = 0.60; break
    case 'consumables':
      ax = 0.50; ay = 0.80; scale = 0.22; break
    default:
      ax = 0.5;  ay = 0.5;  scale = 0.35
  }

  const w = nW * scale
  const h = nH * scale
  const x = bgW * ax - w / 2
  const y = bgH * ay - h / 2

  return {
    x: Math.round(Math.max(0, Math.min(x, bgW - w))),
    y: Math.round(Math.max(0, Math.min(y, bgH - h))),
    w: Math.round(w),
    h: Math.round(h),
    scale,
  }
}

// ─── Store ───────────────────────────────────────────────────────────
export const useMockupStore = create((set, get) => ({
  groups: loadJSON(GROUPS_KEY, DEFAULT_GROUPS),
  items:  loadJSON(ITEMS_KEY,  []),

  // ── Group CRUD ──────────────────────────────────────────────────
  addGroup: (g) => {
    const group = {
      id: `grp_${Date.now()}`,
      icon: '📦', color: '#6e4bff', desc: '',
      ...g,
      createdAt: new Date().toISOString(),
    }
    const groups = [...get().groups, group]
    saveJSON(GROUPS_KEY, groups)
    set({ groups })
    return group.id
  },

  updateGroup: (id, patch) => {
    const groups = get().groups.map(g => g.id === id ? { ...g, ...patch } : g)
    saveJSON(GROUPS_KEY, groups)
    set({ groups })
  },

  removeGroup: (id) => {
    const groups = get().groups.filter(g => g.id !== id)
    // orphan items — clear their groupId
    const items = get().items.map(i => i.groupId === id ? { ...i, groupId: '' } : i)
    saveJSON(GROUPS_KEY, groups)
    saveJSON(ITEMS_KEY, items)
    set({ groups, items })
  },

  // ── Item CRUD ───────────────────────────────────────────────────
  addItem: (item) => {
    const newItem = {
      id: `item_${Date.now()}`,
      name: '', groupId: '', url: '',
      naturalW: 300, naturalH: 300,
      // Reference placement (null = use heuristics)
      anchorX: null, anchorY: null, anchorScale: null,
      active: true,
      createdAt: new Date().toISOString(),
      ...item,
    }
    const items = [...get().items, newItem]
    saveJSON(ITEMS_KEY, items)
    set({ items })
    return newItem.id
  },

  updateItem: (id, patch) => {
    const items = get().items.map(i => i.id === id ? { ...i, ...patch } : i)
    saveJSON(ITEMS_KEY, items)
    set({ items })
  },

  removeItem: (id) => {
    const items = get().items.filter(i => i.id !== id)
    saveJSON(ITEMS_KEY, items)
    set({ items })
  },

  // Save a reference placement for an item (called from admin position editor)
  saveAnchor: (id, anchorX, anchorY, anchorScale) => {
    get().updateItem(id, { anchorX, anchorY, anchorScale })
  },
}))
