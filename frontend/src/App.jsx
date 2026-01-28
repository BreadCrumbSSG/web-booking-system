import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Card, CardBody, CardTitle } from './components/Card.jsx'
import { Button } from './components/Button.jsx'
import { Input } from './components/Input.jsx'
import { ThemeToggle } from './components/ThemeToggle.jsx'
import Modal from './components/Modal.jsx'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID
const GOOGLE_MAPS_LANGUAGE = import.meta.env.VITE_MAPS_LANGUAGE || 'en'
const GOOGLE_MAPS_REGION = import.meta.env.VITE_MAPS_REGION || 'CA'

const fareRules = {
  economy: { label: 'Economy', base: 3, perKm: 0.9, perMin: 0.2 },
  premium: { label: 'Premium', base: 5, perKm: 1.4, perMin: 0.35 },
  xl: { label: 'XL', base: 6.5, perKm: 1.8, perMin: 0.45 }
}

function computeFare(category, km, min) {
  const r = fareRules[category]
  const fare = r.base + r.perKm * km + r.perMin * min
  return Math.max(3, Math.round(fare * 100) / 100)
}

export default function App() {
  const mapRef = useRef(null)
  const pickupRef = useRef(null)
  const dropoffRef = useRef(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [map, setMap] = useState(null)
  const directionsRendererRef = useRef(null)
  const directionsServiceRef = useRef(null)
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [distanceKm, setDistanceKm] = useState(0)
  const [durationMin, setDurationMin] = useState(0)
  const [category, setCategory] = useState('economy')
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [history, setHistory] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [justBooked, setJustBooked] = useState(null)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      mapIds: GOOGLE_MAPS_ID ? [GOOGLE_MAPS_ID] : undefined,
      libraries: ['places'],
      language: GOOGLE_MAPS_LANGUAGE,
      region: GOOGLE_MAPS_REGION
    })
    loader.load().then(() => {
      setMapsLoaded(true)

      // Canada bounds (approx) and default center (Toronto)
      const canadaBounds = new google.maps.LatLngBounds(
        { lat: 41.6766, lng: -141.0 }, // SW
        { lat: 83.3362, lng: -52.6481 }  // NE
      )
      const defaultCenter = { lat: 43.6532, lng: -79.3832 } // Toronto

      const m = new google.maps.Map(mapRef.current, { center: defaultCenter, zoom: 10, mapId: GOOGLE_MAPS_ID })
      setMap(m)
      directionsServiceRef.current = new google.maps.DirectionsService()
      directionsRendererRef.current = new google.maps.DirectionsRenderer({ map: m })

      const acOptions = {
        fields: ['formatted_address', 'geometry'],
        componentRestrictions: { country: ['ca'] },
        bounds: canadaBounds,
        strictBounds: true
      }

      const pAC = new google.maps.places.Autocomplete(pickupRef.current, acOptions)
      pAC.addListener('place_changed', () => {
        const place = pAC.getPlace()
        setPickup(place.formatted_address || pickupRef.current.value)
      })
      const dAC = new google.maps.places.Autocomplete(dropoffRef.current, acOptions)
      dAC.addListener('place_changed', () => {
        const place = dAC.getPlace()
        setDropoff(place.formatted_address || dropoffRef.current.value)
      })
    })
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/api/bookings`).then(r => r.json()).then(setHistory).catch(() => {})
  }, [])

  const fare = useMemo(() => computeFare(category, distanceKm, durationMin), [category, distanceKm, durationMin])

  async function calcRoute() {
    if (!pickup || !dropoff || !directionsServiceRef.current) return
    setLoadingRoute(true)
    try {
      const result = await directionsServiceRef.current.route({
        origin: pickup,
        destination: dropoff,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      directionsRendererRef.current.setDirections(result)
      const leg = result.routes[0].legs[0]
      const km = leg.distance.value / 1000
      const min = leg.duration.value / 60
      setDistanceKm(km)
      setDurationMin(min)
    } catch (e) {
      console.error(e)
      alert('Could not calculate route')
    } finally {
      setLoadingRoute(false)
    }
  }

  function swapLocations() {
    const p = pickup
    setPickup(dropoff)
    setDropoff(p)
    if (pickupRef.current && dropoffRef.current) {
      const pv = pickupRef.current.value
      pickupRef.current.value = dropoffRef.current.value
      dropoffRef.current.value = pv
    }
    setTimeout(() => calcRoute(), 0)
  }

  async function bookRide() {
    if (!pickup || !dropoff || distanceKm <= 0) {
      alert('Enter valid locations and calculate route first')
      return
    }
    try {
      // Geocode to get precise lat/lng from the displayed route legs
      const geocoder = new google.maps.Geocoder()
      const [pGeocode, dGeocode] = await Promise.all([
        geocoder.geocode({ address: pickup, region: GOOGLE_MAPS_REGION }),
        geocoder.geocode({ address: dropoff, region: GOOGLE_MAPS_REGION })
      ])
      const pLoc = pGeocode.results[0]?.geometry.location
      const dLoc = dGeocode.results[0]?.geometry.location

      const payload = {
        pickup_address: pickup,
        dropoff_address: dropoff,
        pickup_lat: pLoc?.lat(),
        pickup_lng: pLoc?.lng(),
        dropoff_lat: dLoc?.lat(),
        dropoff_lng: dLoc?.lng(),
        distance_km: Number(distanceKm.toFixed(2)),
        duration_min: Number(durationMin.toFixed(2)),
        category,
        fare
      }
  const res = await fetch(`${API_BASE}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Booking failed')
  const saved = await res.json()
  setHistory(h => [saved, ...h])
  setJustBooked(saved)
  setShowModal(true)
    } catch (e) {
      console.error(e)
      alert('Booking failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ride Booking</h1>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">Canada-first</div>
            <ThemeToggle />
          </div>
        </div>

        {!GOOGLE_MAPS_ID && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
            <strong>Note:</strong> No Google Maps ID provided. The app will still work; for custom styling provide VITE_GOOGLE_MAPS_ID in frontend/.env.
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex gap-2">
                <Input ref={pickupRef} placeholder="Pickup location" defaultValue={pickup} onBlur={(e) => setPickup(e.target.value)} />
                <Button variant="secondary" onClick={swapLocations}>Swap</Button>
              </div>
              <div className="flex gap-2">
                <Input ref={dropoffRef} placeholder="Destination" defaultValue={dropoff} onBlur={(e) => setDropoff(e.target.value)} />
                <Button onClick={calcRoute} disabled={loadingRoute}>{loadingRoute ? 'Calculating…' : 'Show Route'}</Button>
              </div>
              <div id="map" ref={mapRef} className="w-full h-[420px] rounded-lg" />

              <div className="mt-4">
                <div className="rounded-lg border bg-white p-3 dark:bg-slate-800 dark:border-slate-700">
                  <h4 className="text-sm font-semibold mb-2">Fare Estimates</h4>
                  <div className="space-y-2">
                    {Object.entries(fareRules).map(([key, r]) => {
                      const price = computeFare(key, distanceKm, durationMin).toFixed(2)
                      return (
                        <div key={key} className={`flex items-center justify-between p-2 rounded-md ${category === key ? 'bg-brand-50 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                          <div>
                            <div className="font-semibold">{r.label}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Base {r.base.toFixed(2)} + {r.perKm.toFixed(2)}/km + {r.perMin.toFixed(2)}/min</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-semibold">${price}</div>
                            <Button variant={category === key ? 'primary' : 'outline'} onClick={() => setCategory(key)} className="px-3 py-1 text-sm">{category === key ? 'Selected' : 'Select'}</Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-sm">
                  <div>Distance: <span className="font-semibold">{distanceKm.toFixed(2)} km</span></div>
                  <div>Duration: <span className="font-semibold">{durationMin.toFixed(0)} min</span></div>
                </div>
                <Button onClick={bookRide} disabled={!distanceKm} className="px-4">Book Ride (${fare.toFixed(2)})</Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Destination History</CardTitle>
              <div className="max-h-[420px] overflow-auto divide-y divide-slate-200 dark:divide-slate-800">
                {history.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No bookings yet.</div>}
                {history.map(b => (
                  <div className="py-2" key={b.id}>
                    <div className="font-semibold">{b.pickup_address} → {b.dropoff_address}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(b.created_at).toLocaleString()} · {b.category.toUpperCase()} · {Number(b.distance_km).toFixed(2)} km · {Number(b.duration_min).toFixed(0)} min · ${Number(b.fare).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {!GOOGLE_MAPS_API_KEY && (
          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
            <strong>Missing Google Maps API Key.</strong> Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env.
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Ride booked! 🎉">
        {justBooked && (
          <div className="space-y-2">
            <div className="font-medium">{justBooked.pickup_address} → {justBooked.dropoff_address}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{new Date(justBooked.created_at).toLocaleString()}</div>
            <div className="text-sm">Category: <strong>{justBooked.category}</strong></div>
            <div className="text-sm">Distance: <strong>{Number(justBooked.distance_km).toFixed(2)} km</strong></div>
            <div className="text-sm">Fare: <strong>${Number(justBooked.fare).toFixed(2)}</strong></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
