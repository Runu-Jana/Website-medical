import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import { formatPrice } from '../lib/helpers'
import AddressAutocomplete from '../components/AddressAutocomplete'
import { FaSignOutAlt, FaUserCircle, FaBoxOpen, FaMapMarkerAlt } from 'react-icons/fa'

export default function Account() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const [addr, setAddr] = useState({
    line1: user?.address?.line1 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || '',
  })
  const [savingAddr, setSavingAddr] = useState(false)
  const [addrMsg, setAddrMsg] = useState('')

  const saveAddress = async (e) => {
    e.preventDefault()
    setSavingAddr(true)
    setAddrMsg('')
    try {
      const { data } = await api.put('/auth/profile', { address: addr })
      updateUser(data.user)
      setAddrMsg('Address saved!')
    } catch (err) {
      setAddrMsg(err.response?.data?.message || 'Could not save address')
    } finally {
      setSavingAddr(false)
    }
  }

  useEffect(() => {
    let active = true
    api
      .get('/orders/mine')
      .then(({ data }) => active && setOrders(Array.isArray(data) ? data : data.orders || []))
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-2xl font-bold">My Account</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <FaUserCircle size={64} className="mx-auto text-primary" />
            <h3 className="mt-3 text-lg font-bold">{user?.name}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.phone && <p className="text-sm text-slate-500">{user.phone}</p>}
            <button onClick={handleLogout} className="btn-outline mt-5 w-full">
              <FaSignOutAlt /> Logout
            </button>
          </div>

          {/* Delivery address */}
          <div className="card mt-6 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <FaMapMarkerAlt className="text-primary" /> Delivery Address
            </h3>
            <form onSubmit={saveAddress} className="space-y-3">
              <div>
                <AddressAutocomplete
                  onSelect={(a) => setAddr((prev) => ({ ...prev, ...a }))}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Start typing and pick a suggestion — city, state, country &amp; postal code fill
                  in automatically.
                </p>
              </div>
              <input
                className="input-base"
                placeholder="Address line"
                value={addr.line1}
                onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input-base"
                  placeholder="City"
                  value={addr.city}
                  onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                />
                <input
                  className="input-base"
                  placeholder="State"
                  value={addr.state}
                  onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input-base"
                  placeholder="Postal code"
                  value={addr.postalCode}
                  onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })}
                />
                <input
                  className="input-base"
                  placeholder="Country"
                  value={addr.country}
                  onChange={(e) => setAddr({ ...addr, country: e.target.value })}
                />
              </div>
              {addrMsg && <p className="text-sm font-medium text-accent">{addrMsg}</p>}
              <button type="submit" disabled={savingAddr} className="btn-primary w-full">
                {savingAddr ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <FaBoxOpen className="text-primary" /> My Orders
            </h3>
            {loading ? (
              <Spinner />
            ) : orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                You have no orders yet.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => {
                  const items = o.items || o.orderItems || []
                  const total = o.totalPrice ?? o.total
                  return (
                    <div key={o._id} className="rounded-xl border border-bordergray p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold">#{o._id}</p>
                          <p className="text-xs text-slate-400">
                            {o.createdAt
                              ? new Date(o.createdAt).toLocaleDateString()
                              : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{formatPrice(total)}</p>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {o.status || (o.isDelivered ? 'Delivered' : 'Processing')}
                          </span>
                        </div>
                      </div>
                      {items.length > 0 && (
                        <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                          {items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
