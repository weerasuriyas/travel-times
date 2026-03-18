export default function AdminPageHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-stone-200 bg-white">
      <h1 className="text-xl font-bold text-stone-900">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}
