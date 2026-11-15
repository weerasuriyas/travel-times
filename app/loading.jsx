export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFB] dark:bg-stone-950">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Loading...</p>
      </div>
    </div>
  )
}
