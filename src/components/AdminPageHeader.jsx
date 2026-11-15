'use client'

export default function AdminPageHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
      <div className="min-w-0">
        <h1 className="admin-title text-2xl font-semibold text-stone-900 dark:text-stone-100">{title}</h1>
        {description && <p className="mt-0.5 text-base text-stone-600 dark:text-stone-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
