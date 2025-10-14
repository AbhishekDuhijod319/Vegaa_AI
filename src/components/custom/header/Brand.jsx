import React from 'react'
import { Link } from 'react-router-dom'

const Brand = () => {
  return (
    <Link to="/" className="flex items-center gap-[clamp(0.5rem,0.4rem+0.8vw,0.85rem)]">
      <div className="shrink-0 h-[clamp(28px,6vw,40px)] w-[clamp(28px,6vw,40px)] rounded-lg bg-secondary border" />
      <span className="font-semibold tracking-wide sm:tracking-wider text-[clamp(0.95rem,0.85rem+0.5vw,1.25rem)] leading-tight">Vegaa AI</span>
    </Link>
  )
}

export default Brand


