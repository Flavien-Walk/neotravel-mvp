'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { RefreshCw } from 'lucide-react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neo-900 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-white/30" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
