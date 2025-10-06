import React from "react"
import { useNavigate } from "react-router-dom"

const Footer = () => {
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  const goHome = () => {
    if (window.location.pathname !== '/') navigate('/')
    else {
      const el = document.getElementById('hero')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const goFaq = () => {
    if (window.location.pathname !== '/') navigate('/')
    else {
      const el = document.getElementById('faq')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <footer className="border-t bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <p className="font-semibold">Travel Planner</p>
          <p className="text-sm text-muted-foreground">© {year} Travel Planner. All rights reserved.</p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <button onClick={goHome} className="px-2 py-1.5 rounded-md text-foreground">Home</button>
          <button onClick={() => navigate('/about')} className="px-2 py-1.5 rounded-md text-foreground">About Us</button>
          <button onClick={goFaq} className="px-2 py-1.5 rounded-md text-foreground">FAQ</button>
          <button onClick={() => navigate('/my-trips')} className="px-2 py-1.5 rounded-md text-foreground">My Trips</button>
        </nav>
      </div>
    </footer>
  )
}

export default Footer


