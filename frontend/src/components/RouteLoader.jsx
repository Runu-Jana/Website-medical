import SmileyLoader from './SmileyLoader'

// Shown while a lazily-loaded route chunk is fetched. The navbar/footer stay
// mounted (this only fills the content area), so navigation feels instant:
// a slim progress bar sweeps at the top and the themed smiley animates below.
export default function RouteLoader() {
  return (
    <>
      {/* Indeterminate progress bar pinned to the top of the viewport */}
      <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/10">
        <div className="h-full w-full origin-left animate-loadbar bg-primary" />
      </div>

      {/* Themed animated smiley */}
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <SmileyLoader />
        <p className="text-sm font-medium text-slate-400">Loading…</p>
      </div>
    </>
  )
}
