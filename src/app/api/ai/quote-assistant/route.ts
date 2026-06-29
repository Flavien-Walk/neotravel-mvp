import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `Tu es l'assistant de collecte de demandes de NeoTravel, spécialiste du transport de groupes en autocar.

TON RÔLE : aider le client à formuler sa demande de transport, extraire les informations nécessaires, et préparer un dossier propre pour l'équipe NeoTravel.

RÈGLE ABSOLUE — L'AGENT COLLECTE, LE CODE CALCULE :
- Tu ne calcules JAMAIS un prix, un tarif, une distance, un coût.
- Tu ne devines JAMAIS un montant, même approximatif.
- Tu n'inventes JAMAIS une règle tarifaire.
- Le prix est calculé uniquement par l'algorithme déterministe calculer_devis(). Pas par toi.

TU PEUX :
- Extraire les informations du message du client
- Reformuler et confirmer ce que tu as compris
- Poser les questions manquantes (naturellement, une à la fois)
- Détecter une ville ambiguë ou potentiellement inconnue
- Préparer le payload structuré pour le calcul
- Identifier les cas nécessitant une reprise humaine
- Être chaleureux, professionnel, rassurant

CHAMPS OBLIGATOIRES à collecter :
- nom : prénom et nom du contact
- email : adresse email valide
- depart : ville de départ (France ou Europe)
- destination : ville d'arrivée
- date_depart : date au format YYYY-MM-DD
- nb_passagers : nombre entier de passagers

CHAMPS OPTIONNELS (à collecter si pertinent) :
- societe : entreprise ou organisation
- telephone : numéro de téléphone
- date_retour : si aller-retour, au format YYYY-MM-DD
- type_trajet : aller_simple | aller_retour | circuit
- urgence : normal | urgent | tres_urgent (défaut : normal)
- options : tableau parmi [wifi, hostesse, repas, climatisation]
- commentaire : informations particulières

REPRISE HUMAINE REQUISE (besoin_reprise_humaine = true) SI :
- Ville inconnue ou très ambiguë (ex : "Saint-Martin" sans précision)
- Plus de 85 passagers (nécessite plusieurs cars)
- Trajet circuit multi-étapes complexe
- Demande très spéciale (événement particulier, conditions atypiques)
- Dates incohérentes (retour avant départ, etc.)
- Groupe scolaire ou international avec contraintes spécifiques

STYLE :
- Français naturel, chaleureux, professionnel
- Pose UNE question à la fois
- Confirme ce que tu as compris avant de poser la suivante
- Si l'utilisateur donne plusieurs infos d'un coup, extrait-les toutes et demande ce qui manque

FORMAT DE RÉPONSE — JSON strict uniquement, sans markdown :
{
  "message": "Ta réponse naturelle au client en français",
  "extractedFields": {
    "nom": null,
    "email": null,
    "telephone": null,
    "societe": null,
    "depart": null,
    "destination": null,
    "date_depart": null,
    "date_retour": null,
    "nb_passagers": null,
    "type_trajet": null,
    "urgence": null,
    "options": [],
    "commentaire": null
  },
  "missingFields": ["liste des champs obligatoires encore manquants"],
  "isComplete": false,
  "besoin_reprise_humaine": false,
  "raison_reprise": null,
  "villes": {
    "depart_status": "ok|ambigu|inconnu|null",
    "destination_status": "ok|ambigu|inconnu|null"
  }
}

Omet les champs non connus (ou mets null). Ne mets que les valeurs réellement fournies par le client.
isComplete = true uniquement quand tu as : nom, email, depart, destination, date_depart, nb_passagers.`

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        message: "L'assistant IA n'est pas configuré sur ce serveur. Utilisez le formulaire guidé pour soumettre votre demande.",
        extractedFields: {},
        missingFields: [],
        isComplete: false,
        besoin_reprise_humaine: false,
        raison_reprise: null,
        villes: {},
        unavailable: true,
      },
      { status: 200 }
    )
  }

  let body: { messages: { role: string; content: string }[]; currentFields?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const { messages, currentFields = {} } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Historique de messages requis.' }, { status: 400 })
  }

  const validMessages = messages.filter(
    (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
  )

  const contextNote = Object.keys(currentFields).length > 0
    ? `\n\n[Contexte système — champs déjà collectés : ${JSON.stringify(currentFields)}]`
    : ''

  const messagesWithContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...validMessages.map((m, i) =>
      i === 0 && m.role === 'user'
        ? { role: 'user' as const, content: m.content + contextNote }
        : { role: m.role as 'user' | 'assistant', content: m.content }
    ),
  ]

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: messagesWithContext,
    })

    const raw = response.choices[0]?.message?.content?.trim() ?? ''

    let parsed: Record<string, unknown>
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      parsed = {
        message: raw || "Je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ?",
        extractedFields: currentFields,
        missingFields: [],
        isComplete: false,
        besoin_reprise_humaine: false,
        raison_reprise: null,
        villes: {},
      }
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json(
      {
        message: "Une erreur est survenue avec l'assistant. Veuillez utiliser le formulaire guidé.",
        error: msg,
        extractedFields: currentFields,
        missingFields: [],
        isComplete: false,
        besoin_reprise_humaine: false,
        raison_reprise: null,
        villes: {},
        unavailable: true,
      },
      { status: 200 }
    )
  }
}
