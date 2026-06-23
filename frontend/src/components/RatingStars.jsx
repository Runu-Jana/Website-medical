import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'

export default function RatingStars({ rating = 0, count, size = 'text-sm' }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<FaStar key={i} />)
    else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />)
    else stars.push(<FaRegStar key={i} />)
  }
  return (
    <div className={`flex items-center gap-1 ${size}`}>
      <span className="flex items-center gap-0.5 text-amber-400">{stars}</span>
      {count !== undefined && (
        <span className="ml-1 text-xs text-slate-500">({count})</span>
      )}
    </div>
  )
}
