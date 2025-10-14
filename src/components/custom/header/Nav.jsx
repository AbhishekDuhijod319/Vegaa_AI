import React from 'react'
import { useNavigate } from 'react-router-dom'

const Nav = ({ currentUser }) => {
  const navigate = useNavigate();

  const goHome = () => {
    if (window.location.pathname !== '/') navigate('/')
    else {
      const el = document.getElementById('hero');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goFaq = () => {
    if (window.location.pathname !== '/') navigate('/')
    else {
      const el = document.getElementById('faq');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className='hidden md:flex items-center gap-[clamp(0.4rem,0.3rem+0.8vw,1rem)] text-[clamp(0.9rem,0.85rem+0.25vw,1rem)]'>
      <button onClick={goHome} className='px-[clamp(0.5rem,0.4rem+0.7vw,1rem)] py-[clamp(0.35rem,0.3rem+0.5vw,0.6rem)] rounded-md text-foreground'>Home</button>
      <button onClick={() => navigate('/about')} className='px-[clamp(0.5rem,0.4rem+0.7vw,1rem)] py-[clamp(0.35rem,0.3rem+0.5vw,0.6rem)] rounded-md text-foreground'>About Us</button>
      <button onClick={goFaq} className='px-[clamp(0.5rem,0.4rem+0.7vw,1rem)] py-[clamp(0.35rem,0.3rem+0.5vw,0.6rem)] rounded-md text-foreground'>FAQ</button>
      {currentUser && (
        <>
          <button onClick={()=>navigate('/my-trips')} className='px-[clamp(0.5rem,0.4rem+0.7vw,1rem)] py-[clamp(0.35rem,0.3rem+0.5vw,0.6rem)] rounded-md text-foreground'>Trips</button>
          <button onClick={()=>navigate('/profile')} className='px-[clamp(0.5rem,0.4rem+0.7vw,1rem)] py-[clamp(0.35rem,0.3rem+0.5vw,0.6rem)] rounded-md text-foreground'>Profile</button>
        </>
      )}
    </nav>
  )
}

export default Nav


