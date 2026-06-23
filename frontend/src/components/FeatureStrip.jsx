import { FaShippingFast, FaHeadset, FaShieldAlt, FaUndoAlt } from 'react-icons/fa'

const features = [
  { icon: FaShippingFast, title: 'Free Shipping', text: 'On orders over $1000' },
  { icon: FaHeadset, title: '24/7 Support', text: 'Dedicated assistance' },
  { icon: FaShieldAlt, title: 'Genuine Products', text: '100% authentic' },
  { icon: FaUndoAlt, title: 'Easy Returns', text: '7-day return policy' },
]

export default function FeatureStrip() {
  return (
    <div className="container-x mt-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card flex items-center gap-3 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <f.icon size={22} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-dark">{f.title}</h4>
              <p className="text-xs text-slate-500">{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
