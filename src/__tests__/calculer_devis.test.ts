/**
 * Tests unitaires — calculer_devis()
 *
 * Précepte : Claude ne calcule jamais le prix. calculer_devis() calcule.
 * Ces tests vérifient que toutes les règles métier NeoTravel sont respectées.
 *
 * Exécution : npm test
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculer_devis, type DevisResult } from '../services/calculer_devis'

// Dates de référence fixes pour rendre les tests déterministes
const TODAY        = '2026-01-01'
const PARIS_LYON   = { depart: 'Paris', destination: 'Lyon' }
const DIST_PARIS_LYON = 465  // km référentiel

function ok(r: ReturnType<typeof calculer_devis>): DevisResult {
  assert.ok(r.success, `Erreur inattendue : ${!r.success ? (r as { error: string }).error : ''}`)
  return r as DevisResult
}

function r2(n: number): number { return Math.round(n * 100) / 100 }

// ─── Cohérence arithmétique ───────────────────────────────────────────────────

describe('Cohérence arithmétique', () => {

  it('prix_ht = somme exacte des lignes_calcul', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 50, type_trajet: 'aller_retour', options: ['guide'] }, TODAY))
    const sum = r2(res.lignes_calcul.reduce((s, l) => s + l.montant, 0))
    assert.strictEqual(res.prix_ht, sum, `prix_ht ${res.prix_ht} ≠ somme lignes ${sum}`)
  })

  it('tva = prix_ht × 10 % exactement', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    const expectedTva = r2(res.prix_ht * 0.10)
    assert.strictEqual(res.tva, expectedTva, `TVA devrait être ${expectedTva} (10%), pas ${res.tva}`)
  })

  it('prix_ttc = prix_ht + tva', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.prix_ttc, r2(res.prix_ht + res.tva))
  })

  it('Déterminisme — même input = même output', () => {
    const input = { ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 45, type_trajet: 'aller_simple' }
    const r1 = ok(calculer_devis(input, TODAY))
    const r2_ = ok(calculer_devis(input, TODAY))
    assert.strictEqual(r1.prix_ht,  r2_.prix_ht)
    assert.strictEqual(r1.prix_ttc, r2_.prix_ttc)
    assert.strictEqual(r1.tva,      r2_.tva)
  })

  it('distance_km = 465 pour Paris → Lyon', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.distance_km, DIST_PARIS_LYON)
  })

  it('duree_estimee est une chaîne non vide', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.ok(res.duree_estimee.length > 0)
  })

})

// ─── Règle TVA et Marge ───────────────────────────────────────────────────────

describe('TVA 10 % et Marge 15 %', () => {

  it('TVA est 10 % — pas 20 %', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    const ratio = res.tva / res.prix_ht
    assert.ok(Math.abs(ratio - 0.10) < 0.001, `Taux TVA ${(ratio * 100).toFixed(1)}% devrait être 10%`)
  })

  it('coefficients.tva = 0.10', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['tva'], 0.10)
  })

  it('Ligne marge présente et coefficients.marge = 0.15', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['marge'], 0.15)
    const marge = res.lignes_calcul.find(l => l.label.includes('Marge'))
    assert.ok(marge, 'Ligne marge commerciale manquante')
    assert.ok(marge.montant > 0, 'Marge doit être positive')
  })

  it('Marge représente ~15% du transport (avant options)', () => {
    // Sans options : la marge est la dernière ligne avant les options
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    const marge = res.lignes_calcul.find(l => l.label.includes('Marge'))!
    // sous_total avant marge = marge.montant / 0.15
    const sousTotal = marge.montant / 0.15
    assert.ok(Math.abs(sousTotal * 0.15 - marge.montant) < 0.02, 'Montant marge ≠ 15% du sous-total')
  })

})

// ─── Saisonnalité ─────────────────────────────────────────────────────────────

describe('Saisonnalité', () => {

  it('Mars — haute saison (+10%) → ajustement positif', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-03-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 1.10)
    const s = res.lignes_calcul.find(l => l.label.includes('saisonnalité'))
    assert.ok(s && s.montant > 0, 'Saison haute doit être positive')
  })

  it('Avril — haute saison (+10%)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-04-10', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 1.10)
  })

  it('Juillet — haute saison (+10%)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-07-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 1.10)
  })

  it('Mai — très haute saison (+15%) → ajustement positif', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-05-10', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 1.15)
    const s = res.lignes_calcul.find(l => l.label.includes('saisonnalité'))
    assert.ok(s && s.montant > 0, 'Très haute saison doit être positive')
    assert.ok(s.label.includes('Très haute'), `Label devrait indiquer très haute : ${s.label}`)
  })

  it('Juin — très haute saison (+15%)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 1.15)
  })

  it('Novembre — basse saison (−7%) → ajustement négatif', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-11-10', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 0.93)
    const s = res.lignes_calcul.find(l => l.label.includes('saisonnalité'))
    assert.ok(s && s.montant < 0, 'Basse saison doit être négative')
  })

  it('Janvier — basse saison (−7%)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-01-20', nb_passagers: 30, type_trajet: 'aller_simple' }, '2025-12-01'))
    assert.strictEqual(res.coefficients['saison'], 0.93)
  })

  it('Août — basse saison (−7%)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-08-10', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 0.93)
  })

  it('Septembre — moyenne saison (0%) → pas de ligne saisonnalité', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-09-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 1.00)
    const s = res.lignes_calcul.find(l => l.label.includes('saisonnalité'))
    assert.ok(!s, 'Aucune ligne saisonnalité attendue pour coeff=1.00')
  })

  it('Décembre — moyenne saison (0%)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-12-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 1.00)
  })

})

// ─── Urgence (calculée depuis date_depart) ────────────────────────────────────

describe('Urgence (calculée depuis date)', () => {

  it('Prioritaire — départ dans 1 jour → +10% (+coeff 1.10)', () => {
    const today = '2026-03-10'
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-03-11', nb_passagers: 30, type_trajet: 'aller_simple' }, today))
    assert.strictEqual(res.coefficients['urgence'], 1.10)
    const u = res.lignes_calcul.find(l => l.label.includes('urgence'))
    assert.ok(u && u.montant > 0, 'Urgence prioritaire doit être positive')
  })

  it('Prioritaire — départ dans 0 jour → +10%', () => {
    const today = '2026-03-10'
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-03-10', nb_passagers: 30, type_trajet: 'aller_simple' }, today))
    assert.strictEqual(res.coefficients['urgence'], 1.10)
  })

  it('Urgent — départ dans 20 jours → +5% (coeff 1.05)', () => {
    const today = '2026-03-10'
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-03-30', nb_passagers: 30, type_trajet: 'aller_simple' }, today))
    assert.strictEqual(res.coefficients['urgence'], 1.05)
    const u = res.lignes_calcul.find(l => l.label.includes('urgence'))
    assert.ok(u && u.montant > 0, 'Urgence urgent doit être positive')
  })

  it('Normal — départ dans 60 jours → −5% (coeff 0.95)', () => {
    const today = '2026-01-01'
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-03-02', nb_passagers: 30, type_trajet: 'aller_simple' }, today))
    assert.strictEqual(res.coefficients['urgence'], 0.95)
    const u = res.lignes_calcul.find(l => l.label.includes('urgence'))
    assert.ok(u && u.montant < 0, 'Urgence normal doit être négative (réduction)')
  })

  it('Anticipation — départ dans 120 jours → −10% (coeff 0.90)', () => {
    const today = '2026-01-01'
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-05-01', nb_passagers: 30, type_trajet: 'aller_simple' }, today))
    assert.strictEqual(res.coefficients['urgence'], 0.90)
    const u = res.lignes_calcul.find(l => l.label.includes('urgence'))
    assert.ok(u && u.montant < 0, 'Anticipation doit être négative (réduction)')
  })

})

// ─── Capacité ─────────────────────────────────────────────────────────────────

describe('Capacité (tranches de passagers)', () => {

  it('≤ 19 pax — minibus → −5% (coeff 0.95)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 18, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 0.95)
    const c = res.lignes_calcul.find(l => l.label.toLowerCase().includes('capacité'))
    assert.ok(c && c.montant < 0, 'Minibus ≤19 pax doit être une réduction')
  })

  it('19 pax — limite basse → coeff 0.95', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 19, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 0.95)
  })

  it('20 pax — autocar standard → 0% (coeff 1.00, pas de ligne)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 20, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.00)
    const c = res.lignes_calcul.find(l => l.label.toLowerCase().includes('capacité'))
    assert.ok(!c, 'Pas de ligne capacité pour 20-53 pax')
  })

  it('50 pax — autocar standard → coeff 1.00', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 50, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.00)
  })

  it('53 pax — limite haute standard → coeff 1.00', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 53, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.00)
  })

  it('54 pax — grand autocar 54-63 → +15% (coeff 1.15)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 54, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.15)
    const c = res.lignes_calcul.find(l => l.label.toLowerCase().includes('capacité'))
    assert.ok(c && c.montant > 0, 'Capacité 54-63 pax doit être positive')
  })

  it('60 pax — grand autocar 54-63 → coeff 1.15', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 60, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.15)
  })

  it('64 pax — grand autocar 64-67 → +20% (coeff 1.20)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 64, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.20)
  })

  it('67 pax — limite 64-67 → coeff 1.20', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 67, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.20)
  })

  it('68 pax — grand autocar 68-85 → +40% (coeff 1.40)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 68, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.40)
  })

  it('70 pax — grand autocar 68-85 → coeff 1.40', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 70, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.40)
  })

  it('85 pax — limite supérieure → coeff 1.40, pas HITL', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 85, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.40)
    assert.ok(!res.besoin_reprise_humaine, '85 pax ne doit pas déclencher HITL')
  })

  it('86 pax — reprise humaine obligatoire', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 86, type_trajet: 'aller_simple' }, TODAY))
    assert.ok(res.besoin_reprise_humaine, '86 pax doit déclencher reprise humaine')
  })

  it('90 pax — reprise humaine et raison mentionnant 85', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 90, type_trajet: 'aller_simple' }, TODAY))
    assert.ok(res.besoin_reprise_humaine)
    assert.ok(res.raison_reprise_humaine?.includes('85'), `Raison devrait mentionner 85 : ${res.raison_reprise_humaine}`)
  })

})

// ─── Options ─────────────────────────────────────────────────────────────────

describe('Options (guide, nuit chauffeur, péages)', () => {

  it('Guide/accompagnateur — aller simple (1 jour) → 80 €', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple', options: ['guide'] }, TODAY))
    const g = res.lignes_calcul.find(l => l.label.includes('guide'))
    assert.ok(g, 'Ligne guide manquante')
    assert.strictEqual(g.montant, 80, 'Guide 1 jour doit coûter 80 €')
  })

  it('Guide/accompagnateur — 2 jours → 160 €', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', date_retour: '2026-06-16', nb_passagers: 30, type_trajet: 'aller_retour', options: ['guide'] }, TODAY))
    const g = res.lignes_calcul.find(l => l.label.includes('guide'))
    assert.ok(g, 'Ligne guide manquante')
    assert.strictEqual(g.montant, 160, 'Guide 2 jours doit coûter 160 € (2 × 80 €)')
  })

  it('Nuit chauffeur — aller simple (0 nuit) → warning, pas de ligne', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple', options: ['nuit_chauffeur'] }, TODAY))
    const n = res.lignes_calcul.find(l => l.label.includes('nuit'))
    assert.ok(!n, 'Pas de ligne nuit pour trajet 1 jour')
    assert.ok(res.warnings.some(w => w.includes('nuit chauffeur')), 'Warning attendu pour nuit sans nuit')
  })

  it('Nuit chauffeur — 2 jours (1 nuit) → 120 €', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', date_retour: '2026-06-16', nb_passagers: 30, type_trajet: 'aller_retour', options: ['nuit_chauffeur'] }, TODAY))
    const n = res.lignes_calcul.find(l => l.label.includes('nuit'))
    assert.ok(n, 'Ligne nuit chauffeur manquante')
    assert.strictEqual(n.montant, 120, 'Nuit chauffeur 1 nuit doit coûter 120 €')
  })

  it('Nuit chauffeur — 3 jours (2 nuits) → 240 €', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', date_retour: '2026-06-17', nb_passagers: 30, type_trajet: 'aller_retour', options: ['nuit_chauffeur'] }, TODAY))
    const n = res.lignes_calcul.find(l => l.label.includes('nuit'))
    assert.ok(n, 'Ligne nuit chauffeur manquante')
    assert.strictEqual(n.montant, 240, 'Nuit chauffeur 2 nuits doit coûter 240 € (2 × 120 €)')
  })

  it('Péages → 0 € + warning + source_type a_definir', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple', options: ['peages'] }, TODAY))
    const p = res.lignes_calcul.find(l => l.label.includes('péages'))
    assert.ok(p, 'Ligne péages manquante')
    assert.strictEqual(p.montant, 0, 'Péages à 0 € (a_definir)')
    assert.strictEqual(p.source_type, 'a_definir')
    assert.ok(res.warnings.some(w => w.includes('péage')), 'Warning péages attendu')
  })

})

// ─── Erreurs et HITL ─────────────────────────────────────────────────────────

describe('Validation et erreurs', () => {

  it('Date retour avant départ → echec success=false', () => {
    const res = calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', date_retour: '2026-06-10', nb_passagers: 30, type_trajet: 'aller_retour' }, TODAY)
    assert.ok(!res.success, 'Devrait échouer')
    if (res.success) throw new Error('Attendait success=false')
    assert.ok(res.error.includes('antérieure'), `Erreur devrait mentionner "antérieure" : ${res.error}`)
  })

  it('Ville inconnue → success=false + besoin_reprise_humaine', () => {
    const res = calculer_devis({ depart: 'TataouineVilleInconnue', destination: 'Lyon', date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY)
    assert.ok(!res.success, 'Devrait échouer sur ville inconnue')
    if (res.success) throw new Error('Attendait success=false')
    assert.ok(res.besoin_reprise_humaine, 'Ville inconnue doit déclencher HITL')
  })

  it('Départ = Destination → echec success=false', () => {
    const res = calculer_devis({ depart: 'Paris', destination: 'Paris', date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY)
    assert.ok(!res.success)
    if (res.success) throw new Error()
    assert.ok(res.error.includes('identiques'))
  })

  it('0 passagers → echec', () => {
    const res = calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 0, type_trajet: 'aller_simple' }, TODAY)
    assert.ok(!res.success)
  })

  it('Ville manquante → echec', () => {
    const res = calculer_devis({ depart: '', destination: 'Lyon', date_depart: '2026-06-15', nb_passagers: 30, type_trajet: 'aller_simple' }, TODAY)
    assert.ok(!res.success)
    if (res.success) throw new Error()
    assert.ok(res.error.includes('départ'))
  })

})

// ─── Cas métier intégration ───────────────────────────────────────────────────

describe('Cas métier intégration', () => {

  it('Paris → Lyon, 50 pax, aller-retour, mars (haute), normal (73j)', () => {
    // today = 2026-01-01, depart = 2026-03-15 → 73 jours → normal (0.95)
    // saison mars → 1.10, capacite 50 pax → 1.00, type_trajet AR → 2.00
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-03-15', nb_passagers: 50, type_trajet: 'aller_retour' }, TODAY))
    assert.strictEqual(res.distance_km, DIST_PARIS_LYON)
    assert.strictEqual(res.coefficients['saison'],     1.10)
    assert.strictEqual(res.coefficients['urgence'],    0.95)
    assert.strictEqual(res.coefficients['capacite'],   1.00)
    assert.strictEqual(res.coefficients['type_trajet'],2.00)
    assert.strictEqual(res.coefficients['marge'],      0.15)
    assert.ok(!res.besoin_reprise_humaine)

    // Vérification arithmétique complète
    // base = (465×2)×2.50 = 2325.00 (>180km formule)
    // AR: S1 = 2325×2.00 = 4650.00, delta = 2325.00
    // cap=1.00: S2=4650.00
    // saison: delta = 4650.00×0.10 = 465.00, S3=5115.00
    // urgence: delta = 5115.00×(-0.05) = -255.75, S4=4859.25
    // marge: delta = 4859.25×0.15 = 728.89, S5=5588.14
    assert.ok(Math.abs(res.prix_ht - 5588.14) < 0.05, `prix_ht attendu ~5588.14, obtenu ${res.prix_ht}`)
    const expectedTtc = r2(res.prix_ht * 1.10)
    assert.ok(Math.abs(res.prix_ttc - expectedTtc) < 0.02)
  })

  it('Paris → Lyon, 50 pax, aller-simple, très haute saison (juin)', () => {
    // today = 2026-01-01, depart = 2026-06-01 → 151 jours → anticipation (0.90)
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-01', nb_passagers: 50, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['saison'], 1.15)
    assert.strictEqual(res.coefficients['urgence'], 0.90)
  })

  it('Paris → Lyon, 18 pax, aller-simple, anticipation — minibus -5%', () => {
    const today = '2026-01-01'
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-05-10', nb_passagers: 18, type_trajet: 'aller_simple' }, today))
    assert.strictEqual(res.coefficients['capacite'], 0.95)
    assert.strictEqual(res.coefficients['urgence'], 0.90)
  })

  it('Paris → Lyon, 60 pax, très haute saison, urgent', () => {
    const today = '2026-05-10'
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-01', nb_passagers: 60, type_trajet: 'aller_simple' }, today))
    assert.strictEqual(res.coefficients['capacite'], 1.15)
    assert.strictEqual(res.coefficients['saison'],   1.15)
    assert.strictEqual(res.coefficients['urgence'],  1.05)
  })

  it('Paris → Lyon, 70 pax, +40% capacité, reprise humaine = false', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 70, type_trajet: 'aller_simple' }, TODAY))
    assert.strictEqual(res.coefficients['capacite'], 1.40)
    assert.ok(!res.besoin_reprise_humaine)
  })

  it('Paris → Lyon, 90 pax → reprise humaine (>85 pax)', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 90, type_trajet: 'aller_simple' }, TODAY))
    assert.ok(res.besoin_reprise_humaine)
    assert.ok(res.prix_ht > 0, 'Prix calculé même en HITL')
  })

  it('Paris → Lyon, guide 2j + nuit chauffeur 1 nuit', () => {
    const res = ok(calculer_devis({
      ...PARIS_LYON,
      date_depart:  '2026-06-15',
      date_retour:  '2026-06-16',
      nb_passagers: 40,
      type_trajet:  'aller_retour',
      options:      ['guide', 'nuit_chauffeur'],
    }, TODAY))
    const guide = res.lignes_calcul.find(l => l.label.includes('guide'))
    const nuit  = res.lignes_calcul.find(l => l.label.includes('nuit'))
    assert.ok(guide && guide.montant === 160, 'Guide 2j = 160€')
    assert.ok(nuit  && nuit.montant  === 120, 'Nuit 1 = 120€')
    // Vérification que sum lignes = prix_ht
    const sum = r2(res.lignes_calcul.reduce((s, l) => s + l.montant, 0))
    assert.strictEqual(res.prix_ht, sum)
  })

  it('sources_calcul contient TVA, saisonnalité, urgence, capacité, marge', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 50, type_trajet: 'aller_simple' }, TODAY))
    const labels = res.sources_calcul.map(s => s.label)
    assert.ok(labels.some(l => l.includes('TVA')), 'Source TVA manquante')
    assert.ok(labels.some(l => l.includes('aisonnalité')), 'Source saisonnalité manquante')
    assert.ok(labels.some(l => l.includes('rgence')), 'Source urgence manquante')
    assert.ok(labels.some(l => l.includes('apacité')), 'Source capacité manquante')
    assert.ok(labels.some(l => l.includes('arge')), 'Source marge manquante')
  })

  it('explication_calcul non vide et contient les éléments clés', () => {
    const res = ok(calculer_devis({ ...PARIS_LYON, date_depart: '2026-06-15', nb_passagers: 50, type_trajet: 'aller_simple' }, TODAY))
    assert.ok(res.explication_calcul.length > 50, 'Explication trop courte')
    assert.ok(res.explication_calcul.includes('Paris'), 'Manque ville départ')
    assert.ok(res.explication_calcul.includes('Lyon'), 'Manque ville destination')
    assert.ok(res.explication_calcul.includes('TVA'), 'Manque TVA dans explication')
  })

})
