import { Link } from 'react-router-dom'

export default function SectionHeading({ title, link, linkText = 'View All' }) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <h2 className="whitespace-nowrap text-xl font-bold text-dark sm:text-2xl">{title}</h2>
      {link && (
        <Link
          to={link}
          className="shrink-0 text-sm font-semibold text-primary hover:text-primaryDark"
        >
          {linkText} →
        </Link>
      )}
    </div>
  )
}
