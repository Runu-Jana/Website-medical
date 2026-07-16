import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { API } from '../lib/api'
import Spinner from '../components/Spinner'
import Seo from '../components/Seo'
import { imgFallback } from '../lib/helpers'
import { FaRegCalendarAlt, FaUser, FaArrowLeft } from 'react-icons/fa'

const resolveImg = (u) => {
  if (!u) return ''
  if (u.startsWith('http')) return u
  return `${API}${u.startsWith('/') ? '' : '/'}${u}`
}

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get(`/posts/${slug}`)
      .then(({ data }) => active && setPost(data))
      .catch(() => active && setPost(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <Spinner className="py-32" />

  if (!post) {
    return (
      <div className="container-x py-24 text-center">
        <h2 className="text-2xl font-bold">Post not found</h2>
        <Link to="/blog" className="btn-primary mt-6">
          Back to Blog
        </Link>
      </div>
    )
  }

  const seoImage = post.image ? resolveImg(post.image) : ''
  return (
    <article className="container-x py-8">
      <Seo
        title={post.title}
        description={post.excerpt || (post.content || '').slice(0, 160)}
        image={seoImage}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          image: seoImage || undefined,
          datePublished: post.createdAt,
          author: { '@type': 'Organization', name: post.author || 'DBL Life Care' },
        }}
      />
      <nav className="mb-5 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{' '}
        /{' '}
        <Link to="/blog" className="hover:text-primary">
          Blog
        </Link>{' '}
        / <span className="text-dark">{post.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {post.category || 'Health'}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-dark sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1.5">
            <FaUser /> {post.author || 'DBL Life Care Team'}
          </span>
          <span className="flex items-center gap-1.5">
            <FaRegCalendarAlt /> {formatDate(post.createdAt)}
          </span>
        </div>

        {post.image && (
          <div className="mt-6 overflow-hidden rounded-2xl bg-lightbg">
            <img
              src={resolveImg(post.image)}
              onError={imgFallback}
              alt={post.title}
              className="max-h-[460px] w-full object-cover"
            />
          </div>
        )}

        <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-slate-700">
          {post.content || post.excerpt}
        </div>

        <Link
          to="/blog"
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3"
        >
          <FaArrowLeft size={12} /> Back to Blog
        </Link>
      </div>
    </article>
  )
}
