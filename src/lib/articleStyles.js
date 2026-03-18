// src/lib/articleStyles.js

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
  'condensed': {
    default: 'font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose max-w-2xl',
    hero:    'font-sans font-black uppercase tracking-widest text-sm md:text-base leading-loose max-w-2xl text-white/90',
    picker:  'font-sans font-black uppercase tracking-widest',
  },
}

export function subtitleClasses(style, variant = 'default') {
  return (SUBTITLE_CLASSES[style] ?? SUBTITLE_CLASSES['serif-italic'])[variant]
}
