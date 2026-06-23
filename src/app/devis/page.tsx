import ChatBot from '@/components/ChatBot'
import Link from 'next/link'

export default function DevisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">NeoTravel</span>
          </Link>
          <span className="text-sm text-gray-500">Demande de devis</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Demandez votre devis gratuit</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Répondez à quelques questions pour nous permettre de vous préparer un devis précis.
            L&apos;agent collecte vos informations — nos systèmes calculent le prix.
          </p>
        </div>
        <ChatBot />
      </main>
    </div>
  )
}
