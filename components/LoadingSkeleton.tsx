export function CardSkeleton() {
  return (
    <div className="rounded-xl p-4 animate-pulse" style={{ background: '#1a1a2e' }}>
      <div className="h-40 rounded-lg mb-3" style={{ background: '#16213e' }} />
      <div className="h-4 rounded mb-2" style={{ background: '#16213e', width: '70%' }} />
      <div className="h-3 rounded" style={{ background: '#16213e', width: '40%' }} />
    </div>
  )
}

export function TextSkeleton({ width = '100%' }: { width?: string }) {
  return (
    <div
      className="h-4 rounded animate-pulse"
      style={{ background: '#1a1a2e', width }}
    />
  )
}
