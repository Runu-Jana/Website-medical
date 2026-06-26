import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { API } from '../lib/api'
import SectionHeading from './SectionHeading'
import { imgFallback } from '../lib/helpers'
import { FaRegCalendarAlt, FaArrowRight } from 'react-icons/fa'

const resolveImg = (u) => {
  if (!u) return ''
  if (u.startsWith('http')) return u
  return `${API}${u.startsWith('/') ? '' : '/'}${u}`
}

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

export default function BlogTeaser() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    api
      .get('/posts?published=true')
      .then(({ data }) => setPosts(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setPosts([]))
  }, [])

  if (posts.length === 0) return null

  return (
    <section className="container-x mt-14">
      <SectionHeading subtitle="Latest" title="From Our Blog" link="/blog" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <article
            key={p._id}
            className="card group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-lift"
          >
            <Link
              to={`/blog/${p.slug || p._id}`}
              className="block aspect-[16/10] overflow-hidden bg-lightbg"
            >
              <img
                src={resolveImg(p.image)}
                onError={imgFallback}
                alt={p.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </Link>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                  {p.category || 'Health'}
                </span>
                <span className="flex items-center gap-1">
                  <FaRegCalendarAlt /> {formatDate(p.createdAt)}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold leading-snug text-dark group-hover:text-primary">
                <Link to={`/blog/${p.slug || p._id}`}>{p.title}</Link>
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">{p.excerpt}</p>
              <Link
                to={`/blog/${p.slug || p._id}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3"
              >
                Read More <FaArrowRight size={12} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
