// Layer naming convention for Nova AI Studio PSD editor
// ---------------------------------------------------------------
// Two distinct concerns share this file:
//   1. EDITABLE_LAYER_NAMES – strict whitelist of layer names whose
//      content can be edited inside the in-browser PSD editor. Both
//      text and image layers participate; everything else is auto-
//      locked when the PSD loads (the user can still open the lock
//      manually from the layer panel).
//   2. LAYER_ROLES – broader convention used by the *publish to shop*
//      and *customer editor* flows. Kept stable for backward compat.
// ---------------------------------------------------------------

// 1) Strict whitelist for in-editor edits.
//    Names are matched case-insensitively, trimmed of whitespace.
export const EDITABLE_TEXT_NAMES  = ['text_1', 'text_title']
export const EDITABLE_IMAGE_NAMES = ['image_1', 'logo_1']
export const EDITABLE_LAYER_NAMES = [...EDITABLE_TEXT_NAMES, ...EDITABLE_IMAGE_NAMES]

// Note: Photoshop has no formal "type" for a layer name, so the lookup is
// purely by name. The walker still detects whether the underlying layer
// is text or image and keeps both in sync.

function clean(name) {
  return name ? String(name).trim().toLowerCase() : ''
}

export function isEditableTextLayer(name) {
  return EDITABLE_TEXT_NAMES.includes(clean(name))
}

export function isEditableImageLayer(name) {
  return EDITABLE_IMAGE_NAMES.includes(clean(name))
}

export function isEditableLayer(name) {
  return EDITABLE_LAYER_NAMES.includes(clean(name))
}

export function editableTextHint()  { return EDITABLE_TEXT_NAMES.join(', ') }
export function editableImageHint() { return EDITABLE_IMAGE_NAMES.join(', ') }

// 2) Broader role mapping (publish-to-shop / customer editor).
//    Kept compatible: existing shop products still resolve their
//    editable fields by these role names.
export const LAYER_ROLES = {
  // TEXT layers
  text_1:     { role: 'text_1',     label: 'Tiêu đề chính',     type: 'text',  icon: 'Type' },
  text_title: { role: 'text_title', label: 'Tiêu đề',            type: 'text',  icon: 'Type' },
  // legacy text aliases (kept so existing shop products still resolve)
  text_price: { role: 'text_price', label: 'Giá',                type: 'text',  icon: 'Type' },
  text_2:     { role: 'text_2',     label: 'Nội dung phụ',       type: 'text',  icon: 'Type' },
  text_3:     { role: 'text_3',     label: 'Nội dung 3',         type: 'text',  icon: 'Type' },
  title_logo: { role: 'title_logo', label: 'Tên / Tiêu đề Logo', type: 'text',  icon: 'Type' },
  text_logo:  { role: 'text_logo',  label: 'Text logo phụ',      type: 'text',  icon: 'Type' },
  // IMAGE layers
  image_1:    { role: 'image_1',    label: 'Ảnh chính',          type: 'image', icon: 'Image',      shape: 'rect'   },
  logo_1:     { role: 'logo_1',     label: 'Logo',               type: 'image', icon: 'Star',       shape: 'rect'   },
  // legacy image aliases
  nvat_png:   { role: 'nvat_png',   label: 'Nhân vật PNG',       type: 'image', icon: 'User',       shape: 'rect'   },
  avt_png:    { role: 'avt_png',    label: 'Avatar (tròn)',       type: 'image', icon: 'UserCircle', shape: 'circle' },
  logo:       { role: 'logo',       label: 'Logo chính',          type: 'image', icon: 'Star',       shape: 'rect'   },
}

export function detectLayerRole(layerName) {
  return LAYER_ROLES[clean(layerName)] || null
}

export function groupLayersByRole(layers) {
  const result = { text: [], image: [], other: [] }
  for (const layer of layers) {
    const role = detectLayerRole(layer.name)
    if (role) {
      if (role.type === 'text') result.text.push({ ...layer, role })
      else result.image.push({ ...layer, role })
    } else {
      result.other.push(layer)
    }
  }
  return result
}
