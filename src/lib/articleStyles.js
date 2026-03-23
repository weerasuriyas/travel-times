// src/lib/articleStyles.js

// ── Subtitle styles ───────────────────────────────────────────────────────────

// Base Tailwind class sets keyed by visual style variant
const BASE_CLASSES = {
  'italic':    { tw: 'italic font-normal text-lg md:text-xl leading-relaxed',   heroExtra: 'text-white/80' },
  'bold':      { tw: 'font-bold text-xl md:text-2xl leading-snug',               heroExtra: 'text-white/90' },
  'light':     { tw: 'font-light text-xl md:text-2xl tracking-wide leading-relaxed', heroExtra: 'text-white/80' },
  'condensed': { tw: 'font-black uppercase tracking-widest text-sm md:text-base leading-loose', heroExtra: 'text-white/90' },
}

export function subtitleClasses(style, variant = 'default') {
  const preset = SUBTITLE_PRESETS.find(p => p.value === style) ?? SUBTITLE_PRESETS[0]
  const base = BASE_CLASSES[preset.variant] ?? BASE_CLASSES['italic']
  const shared = `max-w-2xl ${base.tw}`
  if (variant === 'hero') return `${shared} ${base.heroExtra}`
  if (variant === 'picker') return base.tw
  return shared
}

export function subtitleFontCss(style) {
  return SUBTITLE_PRESETS.find(p => p.value === style)?.css ?? null
}

export const SUBTITLE_PRESETS = [
  // Georgia
  { value: 'serif-italic',          label: 'Georgia — Italic',              group: 'Georgia',       variant: 'italic',    css: "Georgia, 'Times New Roman', serif" },
  { value: 'bold-serif',            label: 'Georgia — Bold',                group: 'Georgia',       variant: 'bold',      css: "Georgia, 'Times New Roman', serif" },
  // Merriweather
  { value: 'merriweather-italic',   label: 'Merriweather — Italic',         group: 'Merriweather',  variant: 'italic',    css: "'Merriweather', Georgia, serif" },
  { value: 'merriweather-bold',     label: 'Merriweather — Bold',           group: 'Merriweather',  variant: 'bold',      css: "'Merriweather', Georgia, serif" },
  // Playfair Display
  { value: 'playfair-italic',       label: 'Playfair Display — Italic',     group: 'Playfair',      variant: 'italic',    css: "'Playfair Display', Georgia, serif" },
  { value: 'playfair-bold',         label: 'Playfair Display — Bold',       group: 'Playfair',      variant: 'bold',      css: "'Playfair Display', Georgia, serif" },
  // Lora
  { value: 'lora-italic',           label: 'Lora — Italic',                 group: 'Lora',          variant: 'italic',    css: "'Lora', Georgia, serif" },
  { value: 'lora-bold',             label: 'Lora — Bold',                   group: 'Lora',          variant: 'bold',      css: "'Lora', Georgia, serif" },
  // EB Garamond
  { value: 'garamond-italic',       label: 'EB Garamond — Italic',          group: 'Garamond',      variant: 'italic',    css: "'EB Garamond', Georgia, serif" },
  { value: 'garamond-bold',         label: 'EB Garamond — Bold',            group: 'Garamond',      variant: 'bold',      css: "'EB Garamond', Georgia, serif" },
  // Libre Baskerville
  { value: 'baskerville-italic',    label: 'Libre Baskerville — Italic',    group: 'Baskerville',   variant: 'italic',    css: "'Libre Baskerville', Georgia, serif" },
  // Inter
  { value: 'sans-light',            label: 'Inter — Light',                 group: 'Inter',         variant: 'light',     css: "'Inter', system-ui, sans-serif" },
  { value: 'sans-italic',           label: 'Inter — Italic',                group: 'Inter',         variant: 'italic',    css: "'Inter', system-ui, sans-serif" },
  { value: 'sans-bold',             label: 'Inter — Bold',                  group: 'Inter',         variant: 'bold',      css: "'Inter', system-ui, sans-serif" },
  // Source Sans 3
  { value: 'source-sans-light',     label: 'Source Sans 3 — Light',         group: 'Source Sans',   variant: 'light',     css: "'Source Sans 3', system-ui, sans-serif" },
  { value: 'source-sans-bold',      label: 'Source Sans 3 — Bold',          group: 'Source Sans',   variant: 'bold',      css: "'Source Sans 3', system-ui, sans-serif" },
  // Raleway
  { value: 'raleway-light',         label: 'Raleway — Light',               group: 'Raleway',       variant: 'light',     css: "'Raleway', system-ui, sans-serif" },
  { value: 'raleway-bold',          label: 'Raleway — Bold',                group: 'Raleway',       variant: 'bold',      css: "'Raleway', system-ui, sans-serif" },
  // Nunito
  { value: 'nunito-light',          label: 'Nunito — Light',                group: 'Nunito',        variant: 'light',     css: "'Nunito', system-ui, sans-serif" },
  { value: 'nunito-bold',           label: 'Nunito — Bold',                 group: 'Nunito',        variant: 'bold',      css: "'Nunito', system-ui, sans-serif" },
  // Condensed
  { value: 'condensed',             label: 'Condensed Caps',                group: 'Special',       variant: 'condensed', css: 'system-ui, -apple-system, sans-serif' },
]

// ── Body font ─────────────────────────────────────────────────────────────────

export const BODY_FONT_OPTIONS = [
  // Serif
  { value: 'serif',        label: 'Georgia (Serif)',       css: "Georgia, 'Times New Roman', serif",                cls: 'body-font-serif'       },
  { value: 'merriweather', label: 'Merriweather',          css: "'Merriweather', Georgia, serif",                   cls: 'body-font-merriweather' },
  { value: 'playfair',     label: 'Playfair Display',      css: "'Playfair Display', Georgia, serif",               cls: 'body-font-playfair'    },
  { value: 'lora',         label: 'Lora',                  css: "'Lora', Georgia, serif",                           cls: 'body-font-lora'        },
  { value: 'garamond',     label: 'EB Garamond',           css: "'EB Garamond', Georgia, serif",                    cls: 'body-font-garamond'    },
  { value: 'baskerville',  label: 'Libre Baskerville',     css: "'Libre Baskerville', Georgia, serif",              cls: 'body-font-baskerville' },
  // Sans-serif
  { value: 'sans',         label: 'System Sans-serif',     css: 'system-ui, -apple-system, sans-serif',             cls: 'body-font-sans'        },
  { value: 'inter',        label: 'Inter',                 css: "'Inter', system-ui, sans-serif",                   cls: 'body-font-inter'       },
  { value: 'source-sans',  label: 'Source Sans 3',         css: "'Source Sans 3', system-ui, sans-serif",           cls: 'body-font-source-sans' },
  { value: 'raleway',      label: 'Raleway',               css: "'Raleway', system-ui, sans-serif",                 cls: 'body-font-raleway'     },
  { value: 'nunito',       label: 'Nunito',                css: "'Nunito', system-ui, sans-serif",                  cls: 'body-font-nunito'      },
  // Monospace
  { value: 'mono',         label: 'Monospace',             css: "'Courier New', Courier, monospace",                cls: 'body-font-mono'        },
  { value: 'source-code',  label: 'Source Code Pro',       css: "'Source Code Pro', 'Courier New', monospace",     cls: 'body-font-source-code' },
]

export function bodyFontClass(value) {
  return BODY_FONT_OPTIONS.find(o => o.value === value)?.cls ?? 'body-font-serif'
}

export function bodyFontCss(value) {
  return BODY_FONT_OPTIONS.find(o => o.value === value)?.css ?? "Georgia, 'Times New Roman', serif"
}
