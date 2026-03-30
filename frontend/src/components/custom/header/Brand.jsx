import React from 'react'
import { Link } from 'react-router-dom'

const Brand = () => {
  return (
    <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 duration-300">
      <img src="/logo.svg" alt="Vegaa AI Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
      <span className="font-script font-bold tracking-tight text-2xl md:text-3xl text-foreground">Vegaaai</span>
    </Link>
  )
}

export default Brand


