import React from 'react'
import { Link } from 'react-router-dom'

const Brand = () => {
  return (
    <Link to="/" className='flex items-center gap-3'>
      <div className='h-9 w-9 rounded-lg bg-secondary border' />
      <span className='font-semibold tracking-wide'>Vegaa AI</span>
    </Link>
  )
}

export default Brand


