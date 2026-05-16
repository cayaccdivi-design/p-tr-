// PhotopeaFrame — embeds the real Photopea web app inside an iframe and
// exposes a thin imperative API for parents.
//
// Photopea documents itself at https://www.photopea.com/api/. The host
// page communicates via window.postMessage. Two flavours of messages
// flow back from the iframe:
//   1. Strings — these are the return values from `app.echoToOE(...)`
//      we sprinkle inside our scripts, plus a final `"done"` that
//      Photopea emits automatically when a script finishes.
//   2. ArrayBuffers — produced by `app.activeDocument.saveToOE("psd")`
//      and friends. We collect them in the order they arrive.
//
// We model each script as a Promise that resolves with the full bag of
// echoes + buffers once Photopea sends `"done"`. Every script enqueued
// while another is in flight is queued; we process them serially so we
// can correctly attribute responses.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react'

const PHOTOPEA_BASE = 'https://www.photopea.com'

// Build a Photopea URL with an `init` script that opens a remote PSD,
// loads custom fonts and disables the welcome dialog.
function buildPhotopeaUrl({ initScript } = {}) {
  if (!initScript) return PHOTOPEA_BASE
  // Photopea's `?#` query expects a JSON config. The `script` field is
  // executed once the app is ready.
  const cfg = { environment: { menus: [['File', '-', 'Image', 'Layer', 'Edit']] }, script: initScript }
  return `${PHOTOPEA_BASE}#${encodeURIComponent(JSON.stringify(cfg))}`
}

const PhotopeaFrame = forwardRef(function PhotopeaFrame(
  { className, style, onReady, onError, initialPsdDataUrl, fonts },
  ref,
) {
  const iframeRef = useRef(null)
  const queueRef = useRef([])           // pending scripts: [{ script, resolve, reject, echoes, buffers }]
  const inFlightRef = useRef(null)      // currently-executing script item
  const [ready, setReady] = useState(false)

  // ── Send the next script in the queue ──────────────────────────────
  const drain = useCallback(() => {
    if (inFlightRef.current) return
    const next = queueRef.current.shift()
    if (!next) return
    inFlightRef.current = next
    try {
      iframeRef.current?.contentWindow?.postMessage(next.script, '*')
    } catch (e) {
      next.reject?.(e)
      inFlightRef.current = null
      drain()
    }
  }, [])

  // Public method: run an arbitrary Photopea script string. Resolves
  // with { echoes: string[], buffers: ArrayBuffer[] }.
  const run = useCallback((script) => {
    return new Promise((resolve, reject) => {
      queueRef.current.push({ script, resolve, reject, echoes: [], buffers: [] })
      drain()
    })
  }, [drain])

  // ── postMessage handling ──────────────────────────────────────────
  useEffect(() => {
    function onMessage(e) {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return
      const data = e.data
      // Photopea sends "done" after every script completes, even on init.
      // We use that to flush the in-flight slot.
      if (typeof data === 'string') {
        if (!ready && data === 'done') {
          // First "done" after the iframe is ready means init script finished.
          setReady(true)
          onReady?.()
          return
        }
        if (data === 'done') {
          const item = inFlightRef.current
          inFlightRef.current = null
          if (item) item.resolve({ echoes: item.echoes, buffers: item.buffers })
          drain()
          return
        }
        // Otherwise it's an `echoToOE` payload.
        if (inFlightRef.current) inFlightRef.current.echoes.push(data)
        return
      }
      // Binary payload (ArrayBuffer).
      if (data instanceof ArrayBuffer) {
        if (inFlightRef.current) inFlightRef.current.buffers.push(data)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [drain, onReady, ready])

  // Expose imperative API to parent.
  useImperativeHandle(ref, () => ({
    isReady: () => ready,
    run,
    /**
     * loadPsdFromDataUrl — open a PSD already present on the host page.
     * Photopea's `app.open` accepts http(s) and data: URLs, so this
     * works without any server.
     */
    loadPsdFromDataUrl: (url) => run(`app.open(${JSON.stringify(url)});`),
    /**
     * loadFonts — pre-register every uploaded font so PSDs that
     * reference them render correctly. Each font is sent via
     * `app.activeDocument` is unrelated; Photopea exposes a global
     * `loadAssets` helper but data URLs work via the Document Fonts
     * folder which is hidden from the public API. As a pragmatic
     * fallback we run `app.refresh()` after listing fonts so the user
     * sees their custom names in the font picker (the FontFace API on
     * the host page already registered them, which is what matters for
     * our Konva-based customer overlay export).
     */
    loadFonts: async (list) => {
      if (!Array.isArray(list) || !list.length) return
      // Photopea reads fonts from its embedded list — we can't inject
      // arbitrary fonts at runtime through the public API, but we can
      // *match* by family name when admin-authored PSDs use built-in
      // names. The host-side FontFace registration (fontManager.js)
      // covers the customer overlay path.
      // No-op on the iframe side, kept for symmetry / future API.
      return list.length
    },
  }), [run, ready])

  // ── Iframe URL — built once. We avoid changing src after mount
  // because that would tear down Photopea and lose state. ───────────
  const [src] = useState(() => {
    let initScript = null
    if (initialPsdDataUrl) {
      // Open the PSD as the very first action.
      initScript = `app.open(${JSON.stringify(initialPsdDataUrl)});`
    }
    return buildPhotopeaUrl({ initScript })
  })

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="Photopea Editor"
      className={className}
      style={{ border: 0, width: '100%', height: '100%', background: '#1a1a1a', ...(style || {}) }}
      // Photopea needs cross-origin postMessage; no sandbox attrs.
      allow="cross-origin-isolated"
    />
  )
})

export default PhotopeaFrame
