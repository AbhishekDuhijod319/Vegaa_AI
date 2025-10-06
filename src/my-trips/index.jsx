import React, { useCallback, useEffect, useRef, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../sevice/firebaseConfig'
import { Link, useNavigate } from 'react-router-dom'
import SmartImage from '@/components/ui/SmartImage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Trash2, Loader2, CloudSun, CloudRain, Sun, Cloud, CloudFog, Snowflake } from 'lucide-react'
import { getWeatherByCity } from '@/sevice/GlobalAPI'
import { toast } from 'sonner'

// Utility: days between two ISO dates
function diffDays(start, end) {
  try {
    const s = new Date(start)
    const e = new Date(end)
    const ms = e - s
    if (!isFinite(ms)) return null
    const d = Math.round(ms / (1000 * 60 * 60 * 24))
    return d || null
  } catch {
    return null
  }
}

function formatCurrency(amount, currency) {
  if (amount == null || amount === '') return null
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(Number(amount))
  } catch {
    // Fallback formatting
    return `${currency || 'USD'} ${amount}`
  }
}

function formatDateRange(start, end) {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  if (!isFinite(s) || !isFinite(e)) return null
  const MMM = (d) => d.toLocaleString(undefined, { month: 'short' })
  const DD = (d) => d.toLocaleString(undefined, { day: '2-digit' })
  const YYYY = (d) => d.getFullYear()
  const sameYear = YYYY(s) === YYYY(e)
  const range = `${MMM(s)} ${DD(s)} - ${MMM(e)} ${DD(e)}`
  return sameYear ? `${range}, ${YYYY(e)}` : `${MMM(s)} ${DD(s)}, ${YYYY(s)} - ${MMM(e)} ${DD(e)}, ${YYYY(e)}`
}

// Map OpenWeather main -> icon
function WeatherIcon({ main }) {
  const key = (main || '').toLowerCase()
  if (key.includes('rain') || key.includes('drizzle')) return <CloudRain className="size-4" />
  if (key.includes('snow')) return <Snowflake className="size-4" />
  if (key.includes('fog') || key.includes('mist') || key.includes('haze')) return <CloudFog className="size-4" />
  if (key.includes('clear')) return <Sun className="size-4" />
  if (key.includes('cloud')) return <Cloud className="size-4" />
  return <CloudSun className="size-4" />
}

// Virtual item that mounts children only when visible
function VirtualItem({ estimatedHeight = 340, children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible(true)
        })
      },
      { root: null, rootMargin: '200px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ minHeight: estimatedHeight }}>
      {visible ? children : (
        <div className="rounded-2xl border bg-card" style={{ height: estimatedHeight }} />
      )}
    </div>
  )
}

function MyTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const run = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) {
          navigate('/');
          return;
        }
        const user = JSON.parse(stored);

        const qTrips = query(collection(db, 'AITrips'), where('userEmail', '==', user.email));
        const snapshot = await getDocs(qTrips);
        const items = snapshot.docs.map((d) => d.data());
        setTrips(items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      } catch (e) {
        console.error('Failed to load trips', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [navigate]);

  const onDelete = useCallback(async () => {
    if (!confirmId) return
    try {
      setDeletingId(confirmId)
      const id = confirmId
      await deleteDoc(doc(db, 'AITrips', id))
      setTrips((prev) => prev.filter((t) => t.id !== id))
      toast.success('Trip deleted')
    } catch (e) {
      console.error('Delete failed', e)
      toast.error('Failed to delete trip')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }, [confirmId])

  if (loading) {
    return <div className='mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 pt-24 pb-12'>Loading your trips...</div>;
  }

  return (
    <div className='mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 pt-24 pb-12'>
      <h1 className='text-2xl font-semibold mb-4'>My Trips</h1>
      {trips.length === 0 ? (
        <p className='text-muted-foreground'>No trips yet. Create one from the Home page.</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 min-[1200px]:grid-cols-3 gap-4'>
          {trips.map((t) => {
            const selection = t?.userSelection || {}
            const city = selection?.destination?.label || selection?.location?.label || selection?.destination || selection?.location || 'Trip'
            const days = selection?.noOfDays || diffDays(selection?.startDate, selection?.endDate) || 0
            const budgetFmt = formatCurrency(selection?.budgetAmount, selection?.currency) || selection?.budget || null
            const datesFmt = formatDateRange(selection?.startDate, selection?.endDate) || null

            return (
              <VirtualItem key={t.id}>
                <article className='relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden'>
                  {/* Actions */}
                  <div className='absolute top-2 right-2 z-10 flex gap-2'>
                    <Button
                      variant='secondary'
                      size='icon'
                      aria-label='Edit trip'
                      className='size-11 min-w-11'
                      onClick={(e) => { e.preventDefault(); navigate(`/edit-trip/${t.id}`) }}
                      title='Edit trip'
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant='outline'
                      size='icon'
                      aria-label='Delete trip'
                      className='size-11 min-w-11'
                      onClick={(e) => { e.preventDefault(); setConfirmId(t.id) }}
                      title='Delete trip'
                    >
                      {deletingId === t.id ? <Loader2 className='animate-spin' /> : <Trash2 />}
                    </Button>
                  </div>

                  {/* Image */}
                  <div className='w-full overflow-hidden bg-muted' style={{ aspectRatio: '16/9' }}>
                    <SmartImage query={city} alt={city} className='w-full h-full object-cover' />
                  </div>

                  {/* Body */}
                  <Link to={`/view-trip/${t.id}`} className='block p-4'>
                    <h3 className='font-semibold text-[18px] sm:text-[20px] leading-tight'>{city}</h3>

                    <div className='mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground'>
                      <div className=''>
                        <span className='block'>Duration</span>
                        <span className='font-medium text-foreground'>{days} day{days === 1 ? '' : 's'}</span>
                      </div>
                      <div className=''>
                        <span className='block'>Budget</span>
                        <span className='font-medium text-foreground'>{budgetFmt || '—'}</span>
                      </div>
                    </div>

                    <TripWeather city={city} />

                    {datesFmt && (
                      <p className='mt-2 text-xs text-muted-foreground'>{datesFmt}</p>
                    )}

                    <p className='text-[11px] text-muted-foreground mt-1'>Created {new Date(t.createdAt).toLocaleString()}</p>
                  </Link>
                </article>
              </VirtualItem>
            )
          })}
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && !deletingId && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete trip?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently remove the trip from your account.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirmId(null)} disabled={!!deletingId}>Cancel</Button>
            <Button variant='destructive' onClick={onDelete} disabled={!!deletingId}>
              {deletingId ? (<><Loader2 className='animate-spin' /> Deleting...</>) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TripWeather({ city }) {
  const [state, setState] = useState({ loading: true, temp: null, main: '', desc: '' })
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!city) return setState({ loading: false, temp: null, main: '', desc: '' })
      try {
        const w = await getWeatherByCity(city)
        if (!cancelled) {
          setState({
            loading: false,
            temp: Math.round(w?.main?.temp ?? 0),
            main: w?.weather?.[0]?.main || '',
            desc: w?.weather?.[0]?.description || ''
          })
        }
      } catch {
        if (!cancelled) setState({ loading: false, temp: null, main: '', desc: '' })
      }
    }
    run()
    return () => { cancelled = true }
  }, [city])

  if (state.loading) {
    return <div className='mt-3 h-6 w-28 bg-muted animate-pulse rounded' />
  }

  if (state.temp == null) return null

  return (
    <div className='mt-3 inline-flex items-center gap-2 text-sm'>
      <WeatherIcon main={state.main} />
      <span className='font-medium'>{state.temp}°C</span>
      <span className='text-muted-foreground capitalize'>{state.desc}</span>
    </div>
  )
}

export default MyTrips