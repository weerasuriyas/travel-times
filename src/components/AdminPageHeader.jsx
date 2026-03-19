export default function AdminPageHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}
