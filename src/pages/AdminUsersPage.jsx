import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Trash2, Shield, ShieldOff, UserCheck, UserX, Loader2 } from 'lucide-react'
import { apiGetAuth, apiPost, apiPatch, apiDelete } from '../lib/api'
import AdminPageHeader from '../components/AdminPageHeader'

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const loadAdmins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGetAuth('admin-users')
      setAdmins(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAdmins() }, [loadAdmins])

  async function handleAdd(e) {
    e.preventDefault()
    const email = addEmail.trim()
    if (!email) return
    setAdding(true)
    setAddError('')
    try {
      const newAdmin = await apiPost('admin-users', { email })
      setAdmins(prev => [...prev, newAdmin])
      setAddEmail('')
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(userId, field, currentValue) {
    try {
      await apiPatch(`admin-users/${userId}`, { [field]: !currentValue })
      setAdmins(prev => prev.map(a => a.user_id === userId ? { ...a, [field]: !currentValue } : a))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRemove(userId, name) {
    if (!window.confirm(`Remove ${name || 'this user'} from admins?`)) return
    try {
      await apiDelete(`admin-users/${userId}`)
      setAdmins(prev => prev.filter(a => a.user_id !== userId))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-full">
      <AdminPageHeader title="Admin Users" />

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        {/* Add admin */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <UserPlus size={16} />
            Add Admin by Email
          </h2>
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="email"
              placeholder="user@example.com"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-2 px-5 py-2 bg-stone-950 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {adding ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              Add
            </button>
          </form>
          {addError && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{addError}</p>
          )}
          <p className="mt-3 text-xs text-stone-400">
            The person must have signed in with Google at <code className="bg-stone-100 px-1 rounded">/admin/login</code> at least once before you can add them.
          </p>
        </div>

        {/* Admins list */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-700">Current Admins</h2>
          </div>

          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-600">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              Loading...
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">No admins found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">User</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Active</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Super Admin</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {admins.map(admin => (
                  <tr key={admin.user_id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {admin.avatar_url ? (
                          <img src={admin.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 text-xs font-bold">
                            {(admin.name || admin.email || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-stone-900">{admin.name || admin.email || 'Unknown'}</p>
                          {admin.name && admin.email && (
                            <p className="text-xs text-stone-400">{admin.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggle(admin.user_id, 'is_active', admin.is_active)}
                        title={admin.is_active ? 'Deactivate' : 'Activate'}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-stone-100 transition-colors"
                      >
                        {admin.is_active
                          ? <UserCheck size={18} className="text-green-600" />
                          : <UserX size={18} className="text-stone-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggle(admin.user_id, 'is_super_admin', admin.is_super_admin)}
                        title={admin.is_super_admin ? 'Remove super admin' : 'Make super admin'}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-stone-100 transition-colors"
                      >
                        {admin.is_super_admin
                          ? <Shield size={18} className="text-[#00E676]" />
                          : <ShieldOff size={18} className="text-stone-300" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleRemove(admin.user_id, admin.name || admin.email)}
                        title="Remove admin"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
