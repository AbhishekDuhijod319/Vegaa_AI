import React, { useState, useRef, useEffect } from 'react'
// Removed Link usage as menu now only contains Logout
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const UserMenu = ({ user, onLogout }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();
  const displayName = user?.name || user?.email || ''

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!menuOpen) return
      const b = buttonRef.current
      const m = menuRef.current
      if (b && b.contains(e.target)) return
      if (m && m.contains(e.target)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className='relative'>
      <button
        ref={buttonRef}
        className='flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring'
        aria-haspopup='menu'
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((s) => !s)}
      >
        {/* User name aligned to the left of profile photo */}
        {displayName && (
          <span className='hidden xl:inline text-sm text-foreground font-medium truncate max-w-[160px]' title={displayName}>
            {displayName}
          </span>
        )}
        <div className='relative'>
          {user?.picture ? (
            <img src={user.picture} referrerPolicy='no-referrer' onError={(e)=>{e.currentTarget.style.display='none'}} alt={user.name || 'User'} className='h-9 w-9 rounded-full object-cover border' />
          ) : (
            <div className='h-9 w-9 rounded-full bg-secondary border flex items-center justify-center font-semibold'>
              {initial}
            </div>
          )}
        </div>
      </button>
      {/* Dropdown: only Logout; opens on click */}
      {menuOpen && (
        <div
          ref={menuRef}
          role='menu'
          aria-label='User menu'
          className='absolute right-0 mt-2 w-44 bg-card border rounded-md shadow-md text-sm p-1'
        >
          <button
            role='menuitem'
            onClick={()=>setConfirmOpen(true)}
            className='w-full text-left block px-3 py-2 rounded-sm text-destructive hover:bg-accent hover:text-destructive'
          >
            Logout
          </button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={(o) => { setConfirmOpen(o); if (!o) setMenuOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
            <div className='mt-4 flex justify-end gap-2'>
              <Button variant='outline' onClick={()=>setConfirmOpen(false)}>Cancel</Button>
              <Button variant='destructive' onClick={()=>{ setConfirmOpen(false); setMenuOpen(false); onLogout(); }}>Logout</Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserMenu