import SmileyLoader from './SmileyLoader'

// App-wide loading indicator — the themed smiley, so every loading state
// (page data fetches, route chunks, etc.) shows one consistent brand loader.
export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <SmileyLoader size="3.25rem" />
    </div>
  )
}
