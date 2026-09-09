# Feuille de route

État du code par rapport aux 4 phases définies dans le cahier des charges
(section 24). Toutes les fonctionnalités listées dans le cahier des charges
ont désormais du code correspondant, à l'exception de trois intégrations
qui dépendent de comptes tiers que je ne peux pas ouvrir à ta place
(WhatsApp Business, Mobile Money, un prestataire de paiement récurrent) —
détail dans la section "Ce qui dépend de toi" plus bas.

## Phase 1 — MVP — fait

- authentification, propriétaires, propriétés, unités, locataires, loyers,
  paiements manuels, échéances, tableau de bord, historique des paiements

## Phase 2 — fait

- dépenses par propriété, branchées sur le tableau de bord (revenu net)
- contrats de location : création, modification, renouvellement,
  résiliation, alerte d'expiration à 30 jours (email + badge visuel)
- reçus PDF avec QR code, téléchargeables par le propriétaire et le locataire
- espace locataire : connexion séparée, consultation logement/loyer/
  échéance/historique, téléchargement des reçus
- gestion multi-propriétaires pour les gestionnaires (table de liaison
  `PropertyManager`, un gestionnaire peut être assigné à des propriétés de
  plusieurs propriétaires différents)
- rappels et notifications par email (échéance proche, jour J, retard,
  expiration de contrat), déduplication en base, déclenchement manuel ou
  via cron externe
- signalement de problèmes par le locataire (catégorie, description, photo
  uploadée via Cloudinary si configuré), notification email au
  propriétaire, réponse et suivi de statut

## Phase 3 — fait, avec une réserve sur le paiement en ligne

- messagerie propriétaire ↔ locataire (une conversation par locataire,
  rafraîchissement automatique toutes les 5 à 8 secondes plutôt que du
  temps réel par WebSocket — largement suffisant pour un usage à ce stade)
- rapports périodiques (revenus, dépenses, net, occupation, nouveaux
  locataires), export CSV et envoi par email
- **paiement en ligne : pas fait.** Dépend d'un compte marchand Mobile
  Money par opérateur/pays, hors de portée du code lui-même.

## Phase 4 — évolution — partiel

- score de gestion : fait (formule pondérée — paiements, occupation,
  retards, signalements non résolus, maîtrise des dépenses)
- panel d'administration : fait (page `/admin`, gestion des rôles et des
  plans par un compte ADMIN)
- modèle économique (plans Gratuit/Starter/Pro/Business) : **partiel**.
  Les limites sont réellement appliquées (nombre de propriétés/unités,
  fonctionnalités déverrouillées par palier), mais il n'y a **aucune
  facturation réelle** — le plan d'un compte se change à la main depuis
  `/admin`, faute de prestataire de paiement récurrent branché.
- intégrations externes :
  - **Cloudinary (upload de photos) : fait**, sous réserve de configuration
    (voir `guide.md`)
  - **WhatsApp Business API : pas fait** — validation Meta requise, hors
    de portée du code
  - **Mobile Money : pas fait** — compte marchand requis par opérateur/pays
  - Google Calendar, Wave, comptabilité, API publique, marketplace : pas
    commencé, cohérent avec leur place en phase 4 du cahier des charges
    d'origine

## Ce qui dépend de toi, pas du code

Trois blocs ne peuvent pas être "finis" par du code seul :

1. **WhatsApp Business API** — nécessite un compte Meta Business vérifié et
   un processus d'approbation de plusieurs jours.
2. **Mobile Money** — nécessite un compte marchand par opérateur (MTN,
   Moov...) et par pays ciblé.
3. **Facturation des abonnements** — nécessite un prestataire de paiement
   récurrent qui fonctionne en FCFA pour un compte basé en Afrique de
   l'Ouest (Stripe ne le fait pas nativement) ; ce choix mérite une
   vérification à part avant même d'écrire du code.

Le guide détaillé de ce qu'il faut ouvrir/configurer, étape par étape, est
dans `guide.md`.

## Une réserve honnête sur le calcul de statut

Le statut d'un locataire (à jour / échéance proche / en retard) est recalculé
à la volée à partir du mois en cours — voir `backend/src/lib/rentStatus.ts`.
C'est volontairement simple : ça ne regarde pas les arriérés des mois
précédents. Un locataire qui doit deux mois de retard et vient de payer le
mois en cours réapparaîtra comme "à jour", ce qui est trompeur. Pour un usage
réel au-delà d'une démo, il faut soit stocker un solde cumulé par locataire,
soit comparer la somme des paiements depuis la date d'entrée au loyer total
dû sur la même période. Je ne l'ai pas fait dans ce MVP parce que ça touche
au tableau de bord, à l'historique et aux notifications en même temps — mieux
vaut le trancher avec de vraies données de retard sous les yeux plutôt que de
deviner la bonne règle à l'avance.

## Une réserve honnête sur le score de gestion

Les pondérations (40% paiements, 25% occupation, 15% absence de retard, 10%
absence de signalement non résolu, 10% maîtrise des dépenses — voir
`backend/src/lib/managementScore.ts`) sont un choix arbitraire de ma part,
pas une formule validée par des propriétaires réels. À ajuster une fois que
tu auras des retours sur ce que "bien géré" veut vraiment dire pour tes
utilisateurs.
