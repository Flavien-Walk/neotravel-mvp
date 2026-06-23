import Link from 'next/link'

export default function MerciPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="card max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Demande reçue !</h1>
        <p className="text-gray-600 mb-2">
          Votre demande de devis a bien été enregistrée. Un conseiller NeoTravel va l&apos;analyser et vous recontactera
          <strong> sous 2 heures ouvrées</strong>.
        </p>
        <p className="text-sm text-gray-400 mb-8">Pensez à vérifier vos spams si vous ne recevez pas d&apos;email.</p>
        <div className="bg-blue-50 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm font-medium text-blue-900 mb-2">Ce qu&apos;il se passe maintenant :</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✓ Votre demande est enregistrée dans notre système</li>
            <li>✓ Un devis est généré automatiquement</li>
            <li>✓ Un conseiller valide et vous envoie le devis</li>
            <li>✓ Vous recevez un email de confirmation</li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="btn-secondary flex-1">
            Retour à l&apos;accueil
          </Link>
          <Link href="/devis" className="btn-primary flex-1">
            Nouvelle demande
          </Link>
        </div>
      </div>
    </div>
  )
}
