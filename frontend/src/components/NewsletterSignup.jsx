import { useState } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import api from '../lib/api'

// Newsletter signup — captures the email into the backend mailing list.
export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('sending')
    try {
      await api.post('/newsletter', { email })
      setStatus('done')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not subscribe. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section className="container-x mt-14">
      <div className="rounded-2xl bg-dark px-6 py-10 text-center text-white sm:px-12">
        {status === 'done' ? (
          <div className="py-2">
            <FaCheckCircle className="mx-auto text-accent" size={34} />
            <h3 className="mt-3 text-2xl font-bold">You're subscribed!</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
              Thanks for joining — we'll send offers, health tips and product updates to your inbox.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold">Subscribe to our Newsletter</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
              Get the latest offers, health tips and product updates delivered to your inbox.
            </p>
            <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-base flex-1 text-dark"
                aria-label="Email address"
              />
              <button type="submit" disabled={status === 'sending'} className="btn-accent shrink-0">
                {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </>
        )}
      </div>
    </section>
  )
}
