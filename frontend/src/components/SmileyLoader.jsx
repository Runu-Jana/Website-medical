import './SmileyLoader.css'

// Animated smiley loader (eyes rotate in, right eye blinks, parts merge into a
// smile). Colours come from CSS variables themed to the project's teal in both
// light and dark mode — see SmileyLoader.css.
export default function SmileyLoader({ className = '', size }) {
  return (
    <svg
      role="img"
      aria-label="Loading"
      className={`smiley ${className}`}
      style={size ? { width: size, height: size } : undefined}
      viewBox="0 0 128 128"
      width="128"
      height="128"
    >
      <defs>
        <clipPath id="smiley-eyes">
          <circle className="smiley__eye1" cx="64" cy="64" r="8" transform="rotate(-40,64,64) translate(0,-56)" />
          <circle className="smiley__eye2" cx="64" cy="64" r="8" transform="rotate(40,64,64) translate(0,-56)" />
        </clipPath>
        <linearGradient id="smiley-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" />
          <stop offset="100%" stopColor="#fff" />
        </linearGradient>
        <mask id="smiley-mask">
          <rect x="0" y="0" width="128" height="128" fill="url(#smiley-grad)" />
        </mask>
      </defs>
      <g strokeLinecap="round" strokeWidth="12" strokeDasharray="175.93 351.86">
        <g className="smiley__layer1">
          <rect width="128" height="64" clipPath="url(#smiley-eyes)" />
          <g fill="none">
            <circle className="smiley__mouth1" cx="64" cy="64" r="56" transform="rotate(180,64,64)" />
            <circle className="smiley__mouth2" cx="64" cy="64" r="56" transform="rotate(0,64,64)" />
          </g>
        </g>
        <g className="smiley__layer2" mask="url(#smiley-mask)">
          <rect width="128" height="64" clipPath="url(#smiley-eyes)" />
          <g fill="none">
            <circle className="smiley__mouth1" cx="64" cy="64" r="56" transform="rotate(180,64,64)" />
            <circle className="smiley__mouth2" cx="64" cy="64" r="56" transform="rotate(0,64,64)" />
          </g>
        </g>
      </g>
    </svg>
  )
}
