'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { PenLine, Upload, MapPin, Info, Settings, Users, LogOut, ClipboardList, ExternalLink, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { FOLDERS, defaultFolder, useAdminInbox } from '../contexts/AdminInboxContext'
import ThemeToggle from './ThemeToggle'

const GROUP_CLS = 'text-sm font-semibold text-stone-500 px-3 mb-1 mt-6'
const ITEM_CLS = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-colors'
const IDLE_CLS = 'text-stone-300 hover:text-white hover:bg-white/5'
const ACTIVE_CLS = 'bg-white/10 text-white font-semibold'

function NavItem({ to, icon: Icon, label }) {
  const pathname = usePathname()
  const isActive = pathname === to || pathname.startsWith(to + '/')
  return (
    <Link href={to} aria-current={isActive ? 'page' : undefined} className={`${ITEM_CLS} ${isActive ? ACTIVE_CLS : IDLE_CLS}`}>
      <Icon size={18} className="flex-shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

function FolderItem({ folder, count, isActive }) {
  const Icon = folder.icon
  return (
    <Link
      href={`/admin?show=${folder.key}`}
      aria-current={isActive ? 'page' : undefined}
      className={`${ITEM_CLS} ${isActive ? ACTIVE_CLS : IDLE_CLS}`}
    >
      <span className={`w-1.5 h-5 rounded-full flex-shrink-0 ${folder.bar}`} />
      <Icon size={18} className="flex-shrink-0" />
      <span className="flex-1">{folder.label}</span>
      <span
        className={`min-w-7 text-center rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums ${
          folder.key === 'review' && count > 0 ? folder.pill : 'bg-white/10 text-stone-300'
        }`}
      >
        {count}
      </span>
    </Link>
  )
}

export default function AdminSidebar({ onClose }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, signOut, isSuperAdmin } = useAuth()
  const { counts, loaded } = useAdminInbox()

  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email || 'Admin'

  // Which folder is on screen: the home page shows one folder at a time,
  // and the review screen belongs to "To review".
  let activeFolder = null
  if (pathname === '/admin') activeFolder = searchParams.get('show') || (loaded ? defaultFolder(counts) : null)
  else if (pathname.startsWith('/admin/staging')) activeFolder = 'review'

  return (
    <div className="flex flex-col w-64 flex-shrink-0 bg-stone-950 h-full">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin" className="font-sans text-2xl font-black text-white uppercase tracking-tighter italic leading-[0.82] select-none">
          TRAVEL<br />
          TIMES<span className="text-[#00E676]">.</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <Link
          href="/admin/write"
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-[#00E676] text-stone-950 text-base font-semibold hover:bg-[#00c853] transition-colors"
        >
          <PenLine size={18} />
          Write a new article
        </Link>

        <p className={GROUP_CLS}>Articles</p>
        {FOLDERS.map(folder => (
          <FolderItem key={folder.key} folder={folder} count={counts[folder.key]} isActive={activeFolder === folder.key} />
        ))}

        <p className={GROUP_CLS}>Website pages</p>
        <NavItem to="/admin/destinations" icon={MapPin} label="Destinations" />
        <NavItem to="/admin/about" icon={Info} label="About page" />
        <NavItem to="/admin/settings" icon={Settings} label="Settings" />

        <p className={GROUP_CLS}>Tools</p>
        <NavItem to="/admin/ingest" icon={Upload} label="Upload articles" />
        <NavItem to="/admin/archive" icon={ClipboardList} label="Old archive report" />
        {isSuperAdmin && <NavItem to="/admin/users" icon={Users} label="Who can sign in" />}

        <div className="mt-6 pt-4 border-t border-white/10">
          <Link href="/" target="_blank" className={`${ITEM_CLS} ${IDLE_CLS}`}>
            <ExternalLink size={18} className="flex-shrink-0" />
            <span>Open the website</span>
          </Link>
        </div>

        <div className="mt-3 px-1">
          <p className="text-sm font-semibold text-stone-500 px-2 mb-1.5">Screen colours</p>
          <ThemeToggle />
        </div>
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-stone-700 flex-shrink-0 overflow-hidden">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm font-semibold">{displayName[0]?.toUpperCase()}</div>
            }
          </div>
          <p className="text-sm text-stone-300 truncate flex-1">{displayName}</p>
        </div>
        <button
          onClick={() => signOut().catch(err => console.error(err))}
          className={`${ITEM_CLS} ${IDLE_CLS} w-full`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}
