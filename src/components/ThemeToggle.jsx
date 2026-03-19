import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ICONS = { light: Sun, dark: Moon, system: Monitor }
const LABELS = { light: 'Light', dark: 'Dark', system: 'System' }

export default function ThemeToggle({ className = '' }) {
  const { theme, cycleTheme } = useTheme()
  const Icon = ICONS[theme]
  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${LABELS[theme]} — click to switch`}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${className}`}
    >
      <Icon size={13} />
      <span className="hidden sm:inline">{LABELS[theme]}</span>
    </button>
  )
}
