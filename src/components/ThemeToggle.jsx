import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'system', icon: Monitor, label: 'Auto' },
  { value: 'dark', icon: Moon, label: 'Dark' },
]

// compact: small 3-icon pill used in the public header
// default: full segmented control with labels used in the admin sidebar
export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme()

  if (compact) {
    return (
      <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-full p-0.5 gap-0.5">
        {OPTIONS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            className={`p-1.5 rounded-full transition-all ${
              theme === value
                ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            <Icon size={12} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-[9px] font-black uppercase tracking-wide transition-all ${
            theme === value
              ? 'bg-[#00E676] text-stone-950'
              : 'text-stone-500 hover:text-stone-200'
          }`}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  )
}
