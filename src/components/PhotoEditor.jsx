'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Loader2, RotateCcw, RotateCw, X } from 'lucide-react'

// Longest side of the saved photo. Keeps uploads small and stays inside
// the canvas size phones and tablets can handle.
const MAX_SIDE = 2400

const SHAPES = [
  { key: 'original', label: 'Original' },
  { key: 'wide',     label: 'Wide',   ratio: 16 / 9 },
  { key: 'standard', label: 'Standard', ratio: 4 / 3 },
  { key: 'square',   label: 'Square', ratio: 1 },
  { key: 'tall',     label: 'Tall',   ratio: 3 / 4 },
]

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The photo could not be opened.'))
    img.src = src
  })
}

// Draws the turned, cropped and adjusted photo and returns it as a JPEG.
async function renderPhoto(src, area, rotation, brightness, contrast) {
  const image = await loadImage(src)
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
  const w = image.naturalWidth * scale
  const h = image.naturalHeight * scale
  const rad = (rotation * Math.PI) / 180
  const boxW = Math.abs(Math.cos(rad) * w) + Math.abs(Math.sin(rad) * h)
  const boxH = Math.abs(Math.sin(rad) * w) + Math.abs(Math.cos(rad) * h)

  const turned = document.createElement('canvas')
  turned.width = Math.round(boxW)
  turned.height = Math.round(boxH)
  const tctx = turned.getContext('2d')
  tctx.fillStyle = '#ffffff'
  tctx.fillRect(0, 0, turned.width, turned.height)
  tctx.translate(turned.width / 2, turned.height / 2)
  tctx.rotate(rad)
  tctx.drawImage(image, -w / 2, -h / 2, w, h)

  const outW = Math.max(1, Math.round(area.width * scale))
  const outH = Math.max(1, Math.round(area.height * scale))
  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const octx = out.getContext('2d')
  octx.drawImage(turned, Math.round(area.x * scale), Math.round(area.y * scale), outW, outH, 0, 0, outW, outH)

  // Brightness then contrast, done by hand because not every browser
  // supports filters on a canvas. Matches the CSS filters used on screen.
  if (brightness !== 100 || contrast !== 100) {
    const b = brightness / 100
    const c = contrast / 100
    const data = octx.getImageData(0, 0, outW, outH)
    const px = data.data
    for (let i = 0; i < px.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        px[i + k] = (px[i + k] * b - 127.5) * c + 127.5
      }
    }
    octx.putImageData(data, 0, 0)
  }

  return new Promise((resolve, reject) => {
    out.toBlob(blob => (blob ? resolve(blob) : reject(new Error('The photo could not be saved.'))), 'image/jpeg', 0.9)
  })
}

function Slider({ label, value, min, max, step = 1, onChange, display }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-base font-semibold text-stone-800 dark:text-stone-200">
        {label}
        <span className="text-sm font-normal text-stone-600 dark:text-stone-400">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="mt-1 w-full h-8 accent-emerald-600"
      />
    </label>
  )
}

const BTN = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold transition-colors disabled:opacity-50'
const BTN_QUIET = `${BTN} border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700`

export default function PhotoEditor({ image, onCancel, onSave }) {
  const [src, setSrc] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [natural, setNatural] = useState(null)
  const [mediaSize, setMediaSize] = useState(null)
  const [frameSize, setFrameSize] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [turns, setTurns] = useState(0)   // quarter turns
  const [tilt, setTilt] = useState(0)     // fine straightening, in degrees
  const [shape, setShape] = useState('original')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const areaRef = useRef(null)
  const dialogRef = useRef(null)

  // Fetch the photo into memory first. Drawing straight from another web
  // address can make the browser refuse to save the edited result.
  useEffect(() => {
    let objectUrl = null
    let cancelled = false
    fetch(image.url)
      .then(res => { if (!res.ok) throw new Error(); return res.blob() })
      .then(blob => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => { if (!cancelled) setLoadError('This photo could not be opened for editing. Check your internet connection and try again.') })
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [image.url])

  useEffect(() => {
    dialogRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape' && !saving) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel, saving])

  const rotation = turns * 90 + tilt
  const sideways = Math.abs(turns % 2) === 1
  const originalRatio = natural ? (sideways ? natural.height / natural.width : natural.width / natural.height) : 4 / 3
  const aspect = SHAPES.find(s => s.key === shape)?.ratio ?? originalRatio

  // A tilted photo leaves empty corners inside the frame. Work out how far
  // it must be zoomed in for the frame to sit fully on the photo.
  let neededZoom = 1
  if (mediaSize && frameSize) {
    const rad = (rotation * Math.PI) / 180
    const c = Math.abs(Math.cos(rad))
    const s = Math.abs(Math.sin(rad))
    neededZoom = Math.min(4, Math.max(
      1,
      (frameSize.width * c + frameSize.height * s) / mediaSize.width,
      (frameSize.width * s + frameSize.height * c) / mediaSize.height,
    ))
  }
  const shownZoom = Math.max(zoom, neededZoom)

  const changed = turns !== 0 || tilt !== 0 || zoom !== 1 || shape !== 'original' || brightness !== 100 || contrast !== 100 || crop.x !== 0 || crop.y !== 0

  const reset = () => {
    setCrop({ x: 0, y: 0 }); setZoom(1); setTurns(0); setTilt(0); setShape('original'); setBrightness(100); setContrast(100)
  }

  const onCropComplete = useCallback((_area, areaPixels) => { areaRef.current = areaPixels }, [])

  const save = async () => {
    if (!src || !areaRef.current) return
    setSaving(true)
    setSaveError('')
    try {
      const blob = await renderPhoto(src, areaRef.current, rotation, brightness, contrast)
      await onSave(blob)
    } catch (err) {
      setSaveError(err.message || 'The photo could not be saved. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-ui fixed inset-0 z-[100] bg-black/70 flex items-stretch md:items-center justify-center md:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Edit photo"
        tabIndex={-1}
        className="flex flex-col w-full max-w-5xl md:max-h-full bg-white dark:bg-stone-900 md:rounded-xl overflow-hidden outline-none"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-stone-200 dark:border-stone-700">
          <h2 className="admin-title text-xl font-semibold text-stone-900 dark:text-stone-100">Edit photo</h2>
          <button onClick={onCancel} disabled={saving} aria-label="Close without saving" className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          <div className="relative flex-shrink-0 h-[45vh] md:h-auto md:flex-1 md:min-h-[460px] bg-stone-900">
            {loadError ? (
              <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-base text-white">{loadError}</p>
            ) : !src ? (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={28} className="animate-spin text-white" /></div>
            ) : (
              <Cropper
                image={src}
                crop={crop}
                zoom={shownZoom}
                rotation={rotation}
                aspect={aspect}
                minZoom={neededZoom}
                maxZoom={4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onCropSizeChange={setFrameSize}
                onMediaLoaded={m => {
                  setNatural({ width: m.naturalWidth, height: m.naturalHeight })
                  setMediaSize({ width: m.width, height: m.height })
                }}
                style={{ mediaStyle: { filter: `brightness(${brightness}%) contrast(${contrast}%)` } }}
              />
            )}
          </div>

          <div className="md:w-80 flex-shrink-0 md:overflow-y-auto p-5 space-y-5">
            <p className="text-base text-stone-700 dark:text-stone-300">
              Drag the photo to choose the part to keep. Everything outside the frame is cut off.
            </p>

            <div>
              <p className="mb-2 text-base font-semibold text-stone-800 dark:text-stone-200">Shape</p>
              <div className="flex flex-wrap gap-2">
                {SHAPES.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={shape === s.key}
                    onClick={() => { setShape(s.key); setCrop({ x: 0, y: 0 }) }}
                    className={`rounded-lg px-3 py-2 text-base font-semibold border transition-colors ${
                      shape === s.key
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                        : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-base font-semibold text-stone-800 dark:text-stone-200">Turn</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setTurns(t => t - 1); setCrop({ x: 0, y: 0 }) }} className={`${BTN_QUIET} flex-1`}>
                  <RotateCcw size={18} /> Turn left
                </button>
                <button type="button" onClick={() => { setTurns(t => t + 1); setCrop({ x: 0, y: 0 }) }} className={`${BTN_QUIET} flex-1`}>
                  <RotateCw size={18} /> Turn right
                </button>
              </div>
            </div>

            <Slider label="Straighten" value={tilt} min={-20} max={20} step={0.5} onChange={setTilt} display={tilt === 0 ? 'Level' : `${tilt > 0 ? '+' : ''}${tilt}°`} />
            <Slider label="Zoom in" value={shownZoom} min={1} max={4} step={0.05} onChange={z => setZoom(Math.max(z, neededZoom))} display={`${Math.round(shownZoom * 100)}%`} />
            <Slider label="Brightness" value={brightness} min={60} max={140} onChange={setBrightness} display={brightness === 100 ? 'Normal' : brightness > 100 ? 'Brighter' : 'Darker'} />
            <Slider label="Contrast" value={contrast} min={60} max={140} onChange={setContrast} display={contrast === 100 ? 'Normal' : contrast > 100 ? 'Stronger' : 'Softer'} />

            <button type="button" onClick={reset} disabled={!changed} className={`${BTN_QUIET} w-full`}>Start over</button>
          </div>
        </div>

        <div className="border-t border-stone-200 dark:border-stone-700 px-5 py-3">
          {saveError && <p role="alert" className="mb-2 text-base text-red-700 dark:text-red-400">{saveError}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 min-w-48 text-sm text-stone-600 dark:text-stone-400">
              Saving makes an edited copy and uses it in this article. Your original photo is kept.
            </p>
            <button type="button" onClick={onCancel} disabled={saving} className={BTN_QUIET}>Cancel</button>
            <button type="button" onClick={save} disabled={saving || !src} className={`${BTN} bg-emerald-600 text-white hover:bg-emerald-700`}>
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
