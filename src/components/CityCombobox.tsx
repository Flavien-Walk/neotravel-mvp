'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { City, searchCities, findCity } from '@/lib/cities'

interface Props {
  value: string
  onChange: (value: string, city?: City | null) => void
  placeholder?: string
  label?: string
  error?: string | null
  autoFocus?: boolean
}

export default function CityCombobox({ value, onChange, placeholder = 'Ex: Paris, Lyon, Bordeaux…', label, error, autoFocus }: Props) {
  const [query, setQuery]           = useState(value)
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [open, setOpen]             = useState(false)
  const [focused, setFocused]       = useState(false)
  const [selectedCity, setSelectedCity] = useState<City | null>(() => findCity(value))
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const activeIndex  = useRef(-1)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const results = searchCities(query)
    setSuggestions(results)
    activeIndex.current = -1
  }, [query])

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const selectCity = useCallback((city: City) => {
    setQuery(city.nom)
    setSelectedCity(city)
    onChange(city.nom, city)
    setOpen(false)
  }, [onChange])

  const useRawInput = useCallback(() => {
    setSelectedCity(null)
    onChange(query, null)
    setOpen(false)
  }, [query, onChange])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    setSelectedCity(null)
    onChange(v, undefined)
    setOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const items = suggestions.length > 0 ? suggestions : []
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeIndex.current = Math.min(activeIndex.current + 1, items.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeIndex.current = Math.max(activeIndex.current - 1, 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex.current >= 0 && items[activeIndex.current]) {
        selectCity(items[activeIndex.current])
      } else if (suggestions.length === 1) {
        selectCity(suggestions[0])
      } else {
        useRawInput()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const notFound = focused && query.length >= 2 && suggestions.length === 0 && !selectedCity
  const showDrop = open && (suggestions.length > 0 || notFound)

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: selectedCity ? '#60A5FA' : 'rgba(255,255,255,0.25)' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { setFocused(true); if (query.length >= 2) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="input !pl-10"
          style={
            error ? { borderColor: 'rgba(239,68,68,0.4)' } :
            selectedCity ? { borderColor: 'rgba(37,99,235,0.4)' } :
            notFound ? { borderColor: 'rgba(245,158,11,0.3)' } :
            undefined
          }
        />
        {selectedCity && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(37,99,235,0.12)', color: '#93C5FD' }}
          >
            <CheckCircle2 className="w-3 h-3" />
            {selectedCity.zone}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#F87171' }}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}

      {notFound && !showDrop && (
        <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#FBBF24' }}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          Ville non reconnue — un conseiller NeoTravel traitera votre dossier
        </p>
      )}

      {showDrop && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: '#061435',
            border: '1px solid rgba(37,99,235,0.22)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
          }}
        >
          {suggestions.map((city, i) => (
            <button
              key={city.id}
              onMouseDown={e => { e.preventDefault(); selectCity(city) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
              style={{
                background: i === activeIndex.current ? 'rgba(37,99,235,0.12)' : undefined,
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
              }}
              onMouseEnter={() => { activeIndex.current = i }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(37,99,235,0.12)' }}
              >
                <MapPin className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-white">{city.nom}</span>
                <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.28)' }}>{city.zone}</span>
              </div>
            </button>
          ))}
          {notFound && (
            <button
              onMouseDown={e => { e.preventDefault(); useRawInput() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-amber-500/5"
              style={{ borderTop: suggestions.length > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.1)' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#FBBF24' }} />
              </div>
              <div>
                <span className="text-sm font-semibold" style={{ color: '#FCD34D' }}>Utiliser &quot;{query}&quot;</span>
                <span className="text-xs block" style={{ color: 'rgba(255,255,255,0.25)' }}>Un conseiller traitera votre dossier manuellement</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
