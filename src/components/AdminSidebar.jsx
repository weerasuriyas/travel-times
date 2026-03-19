import { NavLink, Link, useNavigate } from 'react-router-dom'
import { FileText, PenLine, Inbox, Upload, MapPin, Info, Settings, Users, LogOut, ExternalLink, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'

const GROUP_CLS = 'text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 px-3 mb-1 mt-4 first:mt-0'
const BASE_CLS = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-100 hover:bg-white/5 transition-colors'
const ACTIVE_CLS = 'bg-white/10 text-white border-l-2 border-[#00E676]'

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${BASE_CLS} ${isActive ? ACTIVE_CLS : ''}`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function AdminSidebar({ onClose }) {
  const navigate = useNavigate()
  const { user, signOut, isSuperAdmin } = useAuth()

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch (err) { console.error(err) }
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email || 'Admin'

  return (
    <div className="flex flex-col w-56 flex-shrink-0 bg-stone-950 h-full">
      {/* Logo + mobile close */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">Travel Times</p>
          <p className="text-[10px] text-stone-500 mt-0.5">Sri Lanka</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-stone-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className={GROUP_CLS}>Content</p>
        <NavItem to="/admin" end icon={FileText} label="Articles" />
        <NavItem to="/admin/write" icon={PenLine} label="Write" />
        <NavItem to="/admin/staging" icon={Inbox} label="Staging" />
        <NavItem to="/admin/ingest" icon={Upload} label="Ingest" />

        <p className={GROUP_CLS}>Manage</p>
        <NavItem to="/admin/destinations" icon={MapPin} label="Destinations" />
        <NavItem to="/admin/about" icon={Info} label="About" />
        <NavItem to="/admin/settings" icon={Settings} label="Settings" />

        {isSuperAdmin && (
          <>
            <p className={GROUP_CLS}>Admin</p>
            <NavItem to="/admin/users" icon={Users} label="Users" />
          </>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={16} />
            <span>View site</span>
          </Link>
          <ThemeToggle className="w-full justify-start text-stone-400 hover:text-stone-200 hover:bg-white/5 mt-0.5" />
        </div>
      </nav>

      {/* User / logout */}
      <div className="border-t border-white/10 px-3 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-stone-700 flex-shrink-0 overflow-hidden">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-bold">{displayName[0]?.toUpperCase()}</div>
          }
        </div>
        <p className="text-xs text-stone-400 truncate flex-1">{displayName}</p>
        <button
          onClick={handleSignOut}
          className="text-stone-600 hover:text-red-400 transition-colors flex-shrink-0"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  )
}
