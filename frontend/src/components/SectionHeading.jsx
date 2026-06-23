import { Link } from 'react-router-dom'

export default function SectionHeading({ title, subtitle, link, linkText = 'View All' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {subtitle && (
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            {subtitle}
          </p>
        )}
        <h2 className="text-xl font-bold text-dark sm:text-2xl">{title}</h2>
      </div>
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
