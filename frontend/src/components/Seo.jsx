import { Helmet } from 'react-helmet-async'
import { siteConfig } from '../config/site'

const BRAND = siteConfig.brandName || 'DBL Life Care'
const DEFAULT_DESC =
  'Order genuine medicines, book lab tests and consult doctors online. Fast delivery, secure payments and expert care.'

// Per-page <title>, meta description and Open Graph / Twitter tags, plus optional
// JSON-LD structured data. Makes each route shareable (rich WhatsApp/social
// previews) and gives search engines proper per-page metadata.
export default function Seo({ title, description, image, url, type = 'website', jsonLd }) {
  const fullTitle = title ? `${title} · ${BRAND}` : `${BRAND} — Online Pharmacy & Healthcare`
  const desc = description || DEFAULT_DESC
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : '')

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}
