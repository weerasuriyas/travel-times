import { Router } from 'express'
import { requireAuth, requireSuperAdmin } from '../auth.js'
import { getSupabaseAdmin } from '../supabaseAdmin.js'

const router = Router()

router.use(requireAuth, requireSuperAdmin)

// GET / — list all admins enriched with Supabase auth info
router.get('/', async (_req, res) => {
  const supa = getSupabaseAdmin()
  try {
    const { data: admins, error } = await supa
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)

    const enriched = await Promise.all(admins.map(async admin => {
      try {
        const { data: { user } } = await supa.auth.admin.getUserById(admin.user_id)
        return {
          ...admin,
          email: user?.email ?? null,
          name: user?.user_metadata?.full_name ?? user?.email ?? null,
          avatar_url: user?.user_metadata?.avatar_url ?? null,
        }
      } catch {
        return { ...admin, email: null, name: null, avatar_url: null }
      }
    }))
    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST / — add admin by email (user must have signed in at least once)
router.post('/', async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email is required' })

  const supa = getSupabaseAdmin()
  try {
    const { data: { users }, error: listErr } = await supa.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listErr) throw new Error(listErr.message)

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      return res.status(404).json({
        error: 'No account found with that email. They need to sign in with Google at /admin/login first (they\'ll see "No Admin Access" — that\'s expected). Then try adding them again.',
      })
    }

    const { data, error } = await supa
      .from('admin_users')
      .upsert({ user_id: user.id, email: user.email, is_active: true, is_super_admin: false }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw new Error(error.message)

    res.json({
      ...data,
      email: user.email,
      name: user.user_metadata?.full_name ?? user.email,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /:userId — toggle is_active or is_super_admin
router.patch('/:userId', async (req, res) => {
  const { userId } = req.params
  const self = req.user.sub

  if (userId === self && req.body.is_super_admin === false) {
    return res.status(400).json({ error: 'Cannot remove your own super admin status' })
  }
  if (userId === self && req.body.is_active === false) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' })
  }

  const updates = {}
  if (req.body.is_active !== undefined) updates.is_active = !!req.body.is_active
  if (req.body.is_super_admin !== undefined) updates.is_super_admin = !!req.body.is_super_admin
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' })

  const supa = getSupabaseAdmin()
  try {
    const { data, error } = await supa
      .from('admin_users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /:userId — remove admin
router.delete('/:userId', async (req, res) => {
  const { userId } = req.params
  if (userId === req.user.sub) {
    return res.status(400).json({ error: 'Cannot remove your own admin access' })
  }
  const supa = getSupabaseAdmin()
  try {
    const { error } = await supa.from('admin_users').delete().eq('user_id', userId)
    if (error) throw new Error(error.message)
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
