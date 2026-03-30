import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const Nav = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const goHome = () => {
    if (location.pathname !== '/') navigate('/')
    else {
      const el = document.getElementById('hero');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItemClass = (isActive) => cn(
    "relative px-4 py-2 text-base font-medium transition-all duration-300 ease-out rounded-full group tracking-wide",
    "text-foreground/70 hover:text-foreground",
    "focus-visible:outline-none focus-visible:bg-black/5",
    isActive ? "text-foreground bg-black/5" : ""
  );

  return (
    <nav className='hidden lg:flex items-center gap-2' aria-label="Main Navigation">
      <button 
        onClick={goHome} 
        className={navItemClass(location.pathname === '/' && !location.hash)}
        aria-current={location.pathname === '/' ? 'page' : undefined}
      >
        <span className="relative z-10">Home</span>
        {location.pathname === '/' && !location.hash && (
          <span className="absolute inset-0 bg-black/5 rounded-full animate-fade-in" />
        )}
      </button>
      <button 
        onClick={() => navigate('/about')} 
        className={navItemClass(location.pathname === '/about')}
        aria-current={location.pathname === '/about' ? 'page' : undefined}
      >
        <span className="relative z-10">About Us</span>
        {location.pathname === '/about' && (
          <span className="absolute inset-0 bg-black/5 rounded-full animate-fade-in" />
        )}
      </button>
      {currentUser && (
        <>
          <button 
            onClick={()=>navigate('/my-trips')} 
            className={navItemClass(location.pathname === '/my-trips')}
            aria-current={location.pathname === '/my-trips' ? 'page' : undefined}
          >
            <span className="relative z-10">Trips</span>
            {location.pathname === '/my-trips' && (
              <span className="absolute inset-0 bg-black/5 rounded-full animate-fade-in" />
            )}
          </button>
          <button 
            onClick={()=>navigate('/profile')} 
            className={navItemClass(location.pathname === '/profile')}
            aria-current={location.pathname === '/profile' ? 'page' : undefined}
          >
            <span className="relative z-10">Profile</span>
            {location.pathname === '/profile' && (
              <span className="absolute inset-0 bg-black/5 rounded-full animate-fade-in" />
            )}
          </button>
        </>
      )}
    </nav>
  )
}

export default Nav


