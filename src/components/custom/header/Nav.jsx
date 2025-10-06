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
    <nav className='hidden lg:flex items-center gap-2 text-sm'>
      <button onClick={goHome} className='px-3 py-1.5 rounded-md text-foreground'>Home</button>
      <button onClick={() => navigate('/about')} className='px-3 py-1.5 rounded-md text-foreground'>About Us</button>
      <button onClick={goFaq} className='px-3 py-1.5 rounded-md text-foreground'>FAQ</button>
      {currentUser && (
        <>
          <button onClick={()=>navigate('/my-trips')} className='px-3 py-1.5 rounded-md text-foreground'>Trips</button>
          <button onClick={()=>navigate('/profile')} className='px-3 py-1.5 rounded-md text-foreground'>Profile</button>
        </>
      )}
    </nav>
  )
}

export default Nav


