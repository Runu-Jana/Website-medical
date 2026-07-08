import { useRef } from 'react'
import { FaQuoteLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const testimonials = [
  {
    name: 'Niti Rohan',
    date: 'December 11, 2024',
    text: "I ordered my dad's heart medication through the app late in the evening and to my surprise, it was delivered the next morning. The process was really smooth, and I even got a good discount. Making repeat orders is even more convenient.",
  },
  {
    name: 'Yogesh Shukla',
    date: 'January 10, 2025',
    text: "I had mistakenly ordered the wrong strip of tablets and thought I'd have to go through a lot of hassle to return it, but the customer support made it super easy. They arranged a return pickup and my refund was processed in just 2 days.",
  },
  {
    name: 'Anuj Kumar',
    date: 'March 12, 2025',
    text: 'DBL Life Care is the best application for ordering medicines and lab tests. I have been using it for the last 5 years. The customer support is also good.',
  },
  {
    name: 'Meha Jain',
    date: 'April 3, 2025',
    text: 'Excellent app for medicine check ups. Best part is it gives you the option of a range of generic medicines manufactured by reputed companies — helps save a lot of money giving so many options to choose from! Loved it.',
  },
  {
    name: 'Rahul Verma',
    date: 'May 20, 2025',
    text: 'Genuine products and on-time delivery every single time. The reminders for refilling my regular medicines are a lifesaver. Highly recommend DBL Life Care to everyone.',
  },
]

export default function Testimonials() {
  const scrollRef = useRef(null)

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' })
  }

  return (
    <section className="container-x mt-16">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-dark sm:text-3xl">
          What Our Customers have to Say
        </h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-bordergray text-slate-500 transition hover:border-primary hover:text-primary active:bg-primary active:text-white"
          >
            <FaChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-bordergray text-slate-500 transition hover:border-primary hover:text-primary active:bg-primary active:text-white"
          >
            <FaChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-2"
      >
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="w-[80vw] max-w-[320px] shrink-0 snap-start sm:w-[320px]"
          >
            <p className="font-bold text-dark">{t.name}</p>
            <p className="text-sm text-slate-500">{t.date}</p>
            <div className="mt-4 rounded-2xl bg-[#e9f7ef] p-6">
              <FaQuoteLeft className="text-2xl text-primary/40" />
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{t.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile scroll hint */}
      <p className="mt-2 text-center text-xs text-slate-400 sm:hidden">← Swipe to see more reviews →</p>
    </section>
  )
}
