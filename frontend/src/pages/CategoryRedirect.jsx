import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'

export default function CategoryRedirect() {
  const { slug } = useParams()
  const [target, setTarget] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get('/categories')
      .then(({ data }) => {
        if (!active) return
        const list = Array.isArray(data) ? data : []
        const match = list.find((c) => c.slug === slug || c._id === slug)
        setTarget(match ? `/shop?category=${match._id}` : '/shop')
      })
      .catch(() => active && setTarget('/shop'))
      .finally(() => active && setDone(true))
    return () => {
      active = false
    }
  }, [slug])

  if (!done) return <Spinner className="py-32" />
  return <Navigate to={target || '/shop'} replace />
}
