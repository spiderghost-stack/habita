# HaBiTa — état final des fonctionnalités du cahier des charges

Toutes les sections du cahier des charges (4 à 21) ont désormais du code
correspondant. Ce document liste ce qui reste imparfait ou hors de portée
du code seul — il n'y a plus de section "pas commencé" au sens propre.

## Fonctionnalités avec une limite assumée

| Section | Limite |
|---|---|
| 4.3 Espace locataire | Pas de paiement en ligne (dépend de Mobile Money) |
| 5. Comptes | Pas de récupération de mot de passe ni de vérification d'email automatique (dépend d'un flux email dédié, au-delà des rappels déjà en place) |
| 10. Paiements | Paiement numérique par le locataire non disponible (même dépendance Mobile Money) |
| 12/13/15. Reçus, contrats, signalements | Upload de fichiers réel disponible **seulement si Cloudinary est configuré** (voir `guide.md`) — sinon repli sur un lien texte |
| 19. Multi-propriétaires | Vue gestionnaire = liste plate de propriétés, pas encore regroupée visuellement par propriétaire |
| 20. Intégrations | Cloudinary fait ; WhatsApp Business API et Mobile Money non commencés — comptes tiers à ouvrir, hors de portée du code |
| 21. Modèle économique | Limites par plan réellement appliquées ; **aucune facturation réelle** — changement de plan manuel par un admin, faute de prestataire de paiement récurrent branché |

## Dette technique et sécurité (non bloquante pour une démo)

- Pas de limitation de débit sur `/auth/login` — rien n'empêche un essai de
  mots de passe en boucle.
- Pas de révocation de token JWT — un token volé reste valide jusqu'à
  expiration (7 jours par défaut).
- Pas de journalisation des actions importantes (qui a modifié quoi, utile
  en cas de litige).
- Sauvegarde de la base de données : dépend du plan Render choisi, le plan
  gratuit ne sauvegarde pas automatiquement.

## Ce qui dépend uniquement de toi (pas du code)

1. **WhatsApp Business API** — compte Meta Business vérifié, validation de
   plusieurs jours.
2. **Mobile Money** — compte marchand par opérateur et par pays ciblé.
3. **Facturation des abonnements** — prestataire de paiement récurrent
   fonctionnant en FCFA (Stripe ne le fait pas nativement pour un compte
   ouest-africain).

Le détail complet, étape par étape avec les boutons et onglets précis à
ouvrir pour la configuration qui est possible dès maintenant (base de
données, SMTP, Cloudinary, déploiement Render), est dans **`guide.md`**.
