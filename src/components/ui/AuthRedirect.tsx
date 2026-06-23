'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * Client island that silently redirects authenticated users to /dashboard.
 * Placed in the landing page so the server component stays SEO-friendly.
 */
export default function AuthRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === 'client' ? '/client' : '/dashboard')
    }
  }, [user, loading, router])

  return null
}
