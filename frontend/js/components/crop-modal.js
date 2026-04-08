/**
 * Simple canvas-based image cropper.
 * Usage:
 *   const file = await openCropModal(imageFile, { aspect: 1 })
 *   // returns a cropped File (JPEG) or null if cancelled
 */

export function openCropModal(file, { aspect = 1, outputSize = 400 } = {}) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      showModal(img, aspect, outputSize, resolve)
    }
    img.src = objectUrl
  })
}

function showModal(img, aspect, outputSize, resolve) {
  // ── Overlay ──────────────────────────────────────────────────────────────
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:1rem;
  `

  const modal = document.createElement('div')
  modal.style.cssText = `
    background:var(--bg-card);border-radius:16px;padding:1.5rem;
    max-width:480px;width:100%;display:flex;flex-direction:column;gap:1rem;
  `

  const title = document.createElement('h3')
  title.textContent = 'Crop Image'
  title.style.cssText = 'font-size:1.125rem;font-weight:700;margin:0'

  // ── Canvas ────────────────────────────────────────────────────────────────
  const CANVAS_SIZE = 380
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  canvas.style.cssText = `
    width:100%;border-radius:8px;cursor:crosshair;
    border:2px solid var(--border);touch-action:none;
  `
  const ctx = canvas.getContext('2d')

  // Fit image into canvas
  const scale = Math.min(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height)
  const imgW = img.width * scale
  const imgH = img.height * scale
  const imgX = (CANVAS_SIZE - imgW) / 2
  const imgY = (CANVAS_SIZE - imgH) / 2

  // Initial crop box — centred, respecting aspect ratio
  let cropW = Math.min(imgW, imgH * aspect)
  let cropH = cropW / aspect
  let cropX = imgX + (imgW - cropW) / 2
  let cropY = imgY + (imgH - cropH) / 2

  // Drag state
  let dragging = false, resizing = false, handle = null
  let startX = 0, startY = 0, startCrop = {}
  const HANDLE_SIZE = 10

  function draw() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.drawImage(img, imgX, imgY, imgW, imgH)

    // Dim outside crop
    ctx.fillStyle = 'rgba(0,0,0,.5)'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.clearRect(cropX, cropY, cropW, cropH)
    ctx.drawImage(img, imgX, imgY, imgW, imgH)
    ctx.clearRect(cropX, cropY, cropW, cropH)
    ctx.drawImage(img,
      (cropX - imgX) / scale, (cropY - imgY) / scale,
      cropW / scale, cropH / scale,
      cropX, cropY, cropW, cropH
    )

    // Border
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 2
    ctx.strokeRect(cropX, cropY, cropW, cropH)

    // Rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,.3)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(cropX + cropW * i / 3, cropY); ctx.lineTo(cropX + cropW * i / 3, cropY + cropH); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cropX, cropY + cropH * i / 3); ctx.lineTo(cropX + cropW, cropY + cropH * i / 3); ctx.stroke()
    }

    // Corner handles
    ctx.fillStyle = '#f97316'
    const corners = getHandles()
    corners.forEach(h => ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE))
  }

  function getHandles() {
    return [
      { id: 'nw', x: cropX,           y: cropY },
      { id: 'ne', x: cropX + cropW,   y: cropY },
      { id: 'sw', x: cropX,           y: cropY + cropH },
      { id: 'se', x: cropX + cropW,   y: cropY + cropH },
    ]
  }

  function hitHandle(x, y) {
    return getHandles().find(h => Math.abs(h.x - x) < HANDLE_SIZE && Math.abs(h.y - y) < HANDLE_SIZE)
  }

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)) }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_SIZE / rect.width
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleX }
  }

  canvas.addEventListener('mousedown', onDown)
  canvas.addEventListener('touchstart', onDown, { passive: false })

  function onDown(e) {
    e.preventDefault()
    const { x, y } = getPos(e)
    startX = x; startY = y
    startCrop = { cropX, cropY, cropW, cropH }
    handle = hitHandle(x, y)
    if (handle) { resizing = true }
    else if (x >= cropX && x <= cropX + cropW && y >= cropY && y <= cropY + cropH) { dragging = true }
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('touchmove', onMove, { passive: false })

  function onMove(e) {
    if (!dragging && !resizing) return
    e.preventDefault()
    const { x, y } = getPos(e)
    const dx = x - startX, dy = y - startY

    if (dragging) {
      cropX = clamp(startCrop.cropX + dx, imgX, imgX + imgW - cropW)
      cropY = clamp(startCrop.cropY + dy, imgY, imgY + imgH - cropH)
    } else if (resizing) {
      let nx = startCrop.cropX, ny = startCrop.cropY
      let nw = startCrop.cropW, nh = startCrop.cropH

      if (handle.id === 'se') { nw = startCrop.cropW + dx; nh = nw / aspect }
      if (handle.id === 'sw') { nw = startCrop.cropW - dx; nh = nw / aspect; nx = startCrop.cropX + startCrop.cropW - nw }
      if (handle.id === 'ne') { nw = startCrop.cropW + dx; nh = nw / aspect; ny = startCrop.cropY + startCrop.cropH - nh }
      if (handle.id === 'nw') { nw = startCrop.cropW - dx; nh = nw / aspect; nx = startCrop.cropX + startCrop.cropW - nw; ny = startCrop.cropY + startCrop.cropH - nh }

      const minSize = 40
      nw = Math.max(minSize, nw); nh = nw / aspect
      nx = clamp(nx, imgX, imgX + imgW - nw)
      ny = clamp(ny, imgY, imgY + imgH - nh)
      if (nx + nw > imgX + imgW) nw = imgX + imgW - nx
      if (ny + nh > imgY + imgH) nh = imgY + imgH - ny

      cropX = nx; cropY = ny; cropW = nw; cropH = nh
    }
    draw()
  }

  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchend', onUp)

  function onUp() { dragging = false; resizing = false; handle = null }

  // ── Buttons ───────────────────────────────────────────────────────────────
  const btnRow = document.createElement('div')
  btnRow.style.cssText = 'display:flex;gap:.75rem;justify-content:flex-end'

  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = 'Cancel'
  cancelBtn.className = 'btn btn-outline'

  const cropBtn = document.createElement('button')
  cropBtn.textContent = 'Apply Crop'
  cropBtn.className = 'btn btn-primary'

  btnRow.append(cancelBtn, cropBtn)
  modal.append(title, canvas, btnRow)
  overlay.appendChild(modal)
  document.body.appendChild(overlay)
  draw()

  function cleanup() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('mouseup', onUp)
    window.removeEventListener('touchend', onUp)
    document.body.removeChild(overlay)
  }

  cancelBtn.addEventListener('click', () => { cleanup(); resolve(null) })

  cropBtn.addEventListener('click', () => {
    // Render cropped region to output canvas
    const out = document.createElement('canvas')
    out.width = outputSize; out.height = Math.round(outputSize / aspect)
    const octx = out.getContext('2d')
    octx.drawImage(img,
      (cropX - imgX) / scale, (cropY - imgY) / scale,
      cropW / scale, cropH / scale,
      0, 0, out.width, out.height
    )
    out.toBlob(blob => {
      cleanup()
      resolve(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}
