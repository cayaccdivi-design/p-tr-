import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

/**
 * MockupCanvas
 * Renders background + item overlay onto a <canvas>.
 * Exposes an `exportPNG()` method via ref.
 *
 * Props:
 *   bgUrl    — background image data-url / src
 *   itemUrl  — item PNG data-url / src (transparent PNG)
 *   placement — { x, y, w, h } in canvas pixels
 *   canvasW, canvasH — canvas dimensions
 */
const MockupCanvas = forwardRef(function MockupCanvas(
  { bgUrl, itemUrl, placement, canvasW = 900, canvasH = 600 },
  ref,
) {
  const canvasRef = useRef(null)

  // Expose exportPNG
  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      const canvas = canvasRef.current
      if (!canvas) return null
      return canvas.toDataURL('image/png')
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvasW, canvasH)

    const drawItem = (bgLoaded) => {
      if (!itemUrl || !placement) {
        return
      }
      const item = new Image()
      item.crossOrigin = 'anonymous'
      item.onload = () => {
        ctx.drawImage(item, placement.x, placement.y, placement.w, placement.h)
      }
      item.src = itemUrl
    }

    if (bgUrl) {
      const bg = new Image()
      bg.crossOrigin = 'anonymous'
      bg.onload = () => {
        // Fill canvas, cover mode
        const bgAspect = bg.naturalWidth / bg.naturalHeight
        const cAspect  = canvasW / canvasH
        let sx = 0, sy = 0, sw = bg.naturalWidth, sh = bg.naturalHeight
        if (bgAspect > cAspect) {
          sw = bg.naturalHeight * cAspect
          sx = (bg.naturalWidth - sw) / 2
        } else {
          sh = bg.naturalWidth / cAspect
          sy = (bg.naturalHeight - sh) / 2
        }
        ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, canvasW, canvasH)
        drawItem(true)
      }
      bg.onerror = () => drawItem(false)
      bg.src = bgUrl
    } else {
      // Checkerboard placeholder
      const sq = 20
      for (let row = 0; row < canvasH / sq; row++) {
        for (let col = 0; col < canvasW / sq; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? '#1a1a2e' : '#16213e'
          ctx.fillRect(col * sq, row * sq, sq, sq)
        }
      }
      drawItem(false)
    }
  }, [bgUrl, itemUrl, placement, canvasW, canvasH])

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }}
    />
  )
})

export default MockupCanvas
