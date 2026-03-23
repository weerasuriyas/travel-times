// src/lib/articleStyles.js

// ── Subtitle styles ───────────────────────────────────────────────────────────

const SUBTITLE_CLASSES = {
  'serif-italic': {
    default: 'font-serif italic text-lg md:text-xl leading-relaxed max-w-2xl',
    hero:    'font-serif italic text-base md:text-xl leading-relaxed max-w-2xl text-white/80',
    picker:  'font-serif italic',
  },
  'bold-serif': {
    default: 'font-serif font-bold text-xl md:text-2xl leading-snug max-w-2xl',
    hero:    'font-serif font-bold text-xl md:text-2xl leading-snug max-w-2xl text-white/90',
    picker:  'font-serif font-bold',
  },
  'sans-light': {
    default: 'font-sans font-light text-xl md:text-2xl tracking-wide leading-relaxed max-w-2xl',
    hero:    'font-sans font-light text-xl md:text-2xl tracking-wide leading-relaxed max-w-2xl text-white/80',
    picker:  'font-sans font-light',
  },
  'sans-italic': {
    default: 'font-sans italic text-lg md:text-xl leading-relaxed max-w-2xl',
    hero:    'font-sans italic text-lg md:text-xl leading-relaxed max-w-2xl text-white/80',
    picker:  'font-sans italic',
  },
  'sans-bold': {
    default: 'font-sans font-bold text-xl md:text-2xl leading-snug max-w-2xl',
    hero:    'font-sans font-bold text-xl md:text-2xl leading-snug max-w-2xl text-white/90',
    picker:  'font-sans font-bold',
  },
  'condensed': {
    default: 'font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose max-w-2xl',
    hero:    'font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose max-w-2xl text-white/90',
    picker:  'font-sans font-black uppercase tracking-widest',
  },
}

export function subtitleClasses(style, variant = 'default') {
  return (SUBTITLE_CLASSES[style] ?? SUBTITLE_CLASSES['serif-italic'])[variant]
}

export const SUBTITLE_PRESETS = [
  // Serif group
  { value: 'serif-italic', label: 'Serif Italic',  group: 'Serif' },
  { value: 'bold-serif',   label: 'Serif Bold',    group: 'Serif' },
  // Sans group
  { value: 'sans-light',   label: 'Sans Light',    group: 'Sans'  },
  { value: 'sans-italic',  label: 'Sans Italic',   group: 'Sans'  },
  { value: 'sans-bold',    label: 'Sans Bold',     group: 'Sans'  },
  { value: 'condensed',    label: 'Condensed',     group: 'Sans'  },
]

// ── Body font ─────────────────────────────────────────────────────────────────

export const BODY_FONT_OPTIONS = [
  { value: 'serif', label: 'Serif',       css: "Georgia, 'Times New Roman', serif",    cls: 'body-font-serif' },
  { value: 'sans',  label: 'Sans-serif',  css: 'system-ui, -apple-system, sans-serif', cls: 'body-font-sans'  },
  { value: 'mono',  label: 'Monospace',   css: "'Courier New', Courier, monospace",     cls: 'body-font-mono'  },
]

export function bodyFontClass(value) {
  return BODY_FONT_OPTIONS.find(o => o.value === value)?.cls ?? 'body-font-serif'
}

export function bodyFontCss(value) {
  return BODY_FONT_OPTIONS.find(o => o.value === value)?.css ?? "Georgia, 'Times New Roman', serif"
}
