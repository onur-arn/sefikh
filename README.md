# SEFIKH — Search Engine For Know-How

Plateforme de sourcing qui met en relation les **créatifs** (architectes, designers, hôteliers, particuliers) avec les **makers** (artisans, ateliers, fabricants, fournisseurs de matériaux).

- **Client** : trouve un artisan avec une seule barre de recherche, qui combine description, image de référence, catégories et localisation, décrit ses projets, échange avec les makers, sauvegarde ses fournisseurs.
- **Maker** : crée son profil professionnel et son portfolio, reçoit des demandes qualifiées, suit sa visibilité, souscrit une offre payante.

Interface en **français, anglais, italien, espagnol et chinois** (détection du navigateur, puis sélecteur dans l'en-tête et le pied de page). Code commenté en français.

> Le projet doit rester **hors du Bureau et de tout dossier iCloud** (ici `~/Projets/SEFIKH`) : iCloud évince des fichiers et casse `node_modules`.

---

## Démarrage rapide

```bash
npm install
cp .env.example .env          # puis générer AUTH_SECRET : openssl rand -hex 32
npx prisma migrate deploy     # crée la base SQLite (prisma/dev.db)
npm run db:seed               # données de démo (10 ateliers, photos, conversations, statistiques)
npm run dev                   # http://localhost:3000
```

Le premier `db:seed` télécharge le modèle CLIP (~150 Mo, dans `.cache/models`).

### Comptes de démo (mot de passe `Sefikh2026!`)

| Rôle | E-mail | Offre |
|---|---|---|
| Créatif | `client@sefikh.demo` | Pro |
| Maker | `pro@sefikh.demo` (Atelier Laiton & Patine) | Visibility |
| Administrateur | `admin@sefikh.demo` | accès à `/admin` |
| Autres makers | `cuir@`, `racine@`, `onyx@`, `velours@`, `azur@`, `lumen@`, `zellige@`, `forma@`, `pierrebois@` + `sefikh.demo` | variées |

### E-mails en développement

Sans `SMTP_HOST`, aucun e-mail ne part : ils sont enregistrés en base et visibles sur **http://localhost:3000/dev/mailbox** (vérification d'adresse, mot de passe oublié, notifications de message, confirmation d'abonnement…). Renseigner les variables `SMTP_*` (Resend, Brevo, Mailtrap, OVH…) pour un envoi réel.

### Traduction automatique

Renseigner `ANTHROPIC_API_KEY` (et éventuellement `AI_MODEL`, `claude-opus-5-5` par défaut).

- **Sans clé** : le bouton de traduction affiche « indisponible ».
- **Coût** : chaque texte n'est traduit qu'une fois par langue (table `Translation`). L'API relit le texte en base et n'accepte jamais de texte libre, avec une limite de 40 traductions par heure et par visiteur.

### Paiements

- **Sans clé Stripe** (dev) : un checkout simulé est proposé (`/checkout/simulate`, carte `4242 4242 4242 4242`, ou `4000 0000 0000 0002` pour un refus).
- **Avec Stripe** (mode test) : renseigner `STRIPE_SECRET_KEY`, puis lancer `npm run stripe:listen` (Stripe CLI) et copier le secret `whsec_…` dans `STRIPE_WEBHOOK_SECRET`. Les produits et prix sont créés automatiquement (lookup keys) : aucune configuration manuelle du dashboard. Activer les « automatic payment methods » dans Stripe pour proposer CB, SEPA, Bancontact, iDEAL… selon le pays du client.

---

## Fonctionnalités

**Authentification** — inscription (choix créatif / maker), connexion, déconnexion, vérification d'e-mail, mot de passe oublié / réinitialisation (jeton à usage unique, 1 h), changement d'e-mail et de mot de passe, liste des sessions et déconnexion des autres appareils, suppression du compte et export RGPD (JSON).

**Accès** — la recherche exige un compte. Sans offre payante : 3 recherches par compte, à vie, tous modes confondus (`freeSearches`), makers anonymes (fiche d'aperçu `/makers/preview/[id]` : métier, ville, savoir-faire, zones, disponibilités, 4 réalisations) et contact impossible. L'anonymisation se fait côté serveur (`src/lib/access.ts`) : nom, slug et identifiant ne sont jamais envoyés au navigateur. Les fiches ne sont donc plus indexables (retirées du sitemap). La messagerie, les notifications et les conversations de projet leur sont aussi fermées.

**Visibilité des makers** — seul un abonnement payant rend une fiche visible (`LISTED_COMPANY` dans `src/lib/access.ts`) : sans offre active, la fiche reste en aperçu pour son propriétaire. Un paiement publie la fiche si elle a une photo ; une résiliation la masque automatiquement.

**Recherche**
- *Describe a project* : analyse du texte (compétences, matériaux, techniques, secteurs, ville/pays avec synonymes FR/EN) + similarité sémantique texte → photos (CLIP) + proximité géographique.
- *Search by image* : la photo déposée est comparée aux photos des portfolios (embeddings CLIP calculés localement, repli sur empreinte couleur). Chaque résultat affiche la photo la plus proche.
- *Skills & materials* : filtres (type de maker, compétences, matériaux, techniques, secteurs, rayon, délai), tri par pertinence ou distance.
- Texte, image et catégories se combinent dans une seule barre. Journalisation pour les statistiques.

**Profils makers** — fiche publique (accordéons de la maquette : zones d'intervention, compétences/matériaux/techniques, secteurs, capacités de production avec calendrier de disponibilité), portfolio avec visionneuse « About the project », coordonnées réservées aux offres Pro, makers visuellement similaires, données structurées JSON-LD.

**Projets (créatifs)** — questionnaire en 7 étapes reprenant les questions de la maquette (champs obligatoires en gras), récapitulatif, pièces jointes, makers correspondants, archivage, modification.

**Messagerie** — conversations par projet, filtres (tous / non lus / archivés), recherche, pièces jointes (images ré-encodées, PDF vérifiés), accusés de lecture, présence en ligne, panneau « Details », onglet « Shared files » (cloud), notifications in-app + e-mail (dédupliquées, uniquement si le destinataire n'est pas en ligne), quota de mises en relation pour l'offre gratuite.

**Tableaux de bord** — créatif : projets actifs/archivés, suggestions personnalisées, bibliothèque fournisseurs, documents cloud (500 Mo). Maker : statistiques, force du profil, dernières demandes, publication, éditeur de profil, gestion du portfolio (upload multiple, légendes, ordre, couverture), analytics (vues, apparitions, sources).

**Abonnements** — clients Free / Pro / Studio, makers Pro / Visibility / Intelligence + Founding Partner (50 places), engagement 12 mois ou sans engagement, Stripe Checkout, changement d'offre au prorata, résiliation (à l'échéance de l'engagement), reprise, portail client Stripe, factures, webhooks idempotents, e-mails de confirmation / d'échec de paiement.

**Trends & Insights** — pages de données de marché générées automatiquement à partir de l'activité réelle (recherches, vues, mises en relation) : KPI, tendances mensuelles, matériaux/techniques/expertises/lieux les plus recherchés, demande émergente, makers les plus découverts, taux de conversion. Sections détaillées réservées aux offres Intelligence (makers) et Studio (créatifs).

**Langues** — catalogues dans `src/i18n/messages/` : la clé est le texte anglais, `tr("Log in")` côté serveur (`getT`) et client (`useT`). Après un ajout de texte, lancer `npm run i18n:check`, qui liste les traductions manquantes et contrôle les variables `{...}`. E-mails et notifications partent dans la langue du destinataire. La langue est mémorisée par cookie (pas de préfixe d'URL : une version par langue pour le SEO demandera des routes `/fr`, `/it`…).

**Traduction automatique** — les professionnels écrivent dans leur langue : bouton « Traduire automatiquement » sur la présentation, les réalisations du portfolio et les messages reçus. Les recherches en italien, espagnol et chinois sont traduites vers l'anglais avant d'être lancées (sans clé d'API, seuls l'anglais et le français sont compris).

**Administration** — `/admin` (rôle `ADMIN`) : indicateurs, utilisateurs (suspension), makers (publication, vérification), demandes de contact.

**Contenus** — Journal (articles), About, Join (makers), Contact (formulaire + accusé de réception), mentions légales (CGU, confidentialité, cookies), newsletter, 404, sitemap, robots, Open Graph.

---

## Architecture

| Couche | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Turbopack), React 19, TypeScript strict |
| UI | Tailwind CSS v4, polices Instrument Serif + Instrument Sans + DM Mono, icônes Lucide, graphiques Recharts |
| Design | Cahier d'architecte : chaux, encre, terre cuite ; angles droits, filets, légendes numérotées (tokens dans `src/app/globals.css`) |
| Base de données | Prisma 6 — SQLite en dev, PostgreSQL en prod (changer `provider` + `DATABASE_URL`) |
| Auth | Sessions en base (cookie httpOnly, jeton haché SHA-256, 30 jours glissants), bcrypt (12 tours) |
| E-mails | Nodemailer (SMTP) + journal `EmailLog` |
| Paiement | Stripe Checkout, Billing Portal, webhooks |
| Images | sharp (validation par décodage, suppression EXIF, WebP, vignettes) |
| IA visuelle | CLIP ViT-B/32 quantifié via `@huggingface/transformers` (local, sans API externe) |

```
src/
  app/
    (site)/        pages publiques (accueil, recherche, makers, tarifs, insights, journal…)
    (auth)/        connexion, inscription, mot de passe, vérification + server actions
    (app)/         espace connecté (dashboard, messages, onboarding, checkout, upgrade)
    api/           routes JSON (messagerie, uploads, recherche image, facturation, webhook Stripe)
    files/         service des fichiers stockés (contrôle d'accès pour les fichiers privés)
  components/      UI, formulaires, recherche, makers, messagerie, tableaux de bord, graphiques
  lib/             auth, db, search, clip, images, storage, billing, mail, stats, geo, plans…
  proxy.ts         garde d'accès, protection CSRF des API, cookie visiteur
prisma/            schéma, migrations, seed + photos de démo
```

### Sécurité
Mots de passe hachés (bcrypt), jetons de session/réinitialisation stockés hachés, cookies `httpOnly` + `SameSite=Lax` (+ `Secure` en prod), vérification d'origine sur les API mutantes (les Server Actions la font nativement), limitation de débit (connexion, inscription, mot de passe oublié, messages, uploads…), réponses identiques que le compte existe ou non, validation Zod côté serveur, fichiers validés par leur contenu (pas leur extension), fichiers privés servis après contrôle d'accès, en-têtes de sécurité, redirections internes uniquement (`next`), webhook Stripe signé et idempotent.

### Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` / `build` / `start` | développement, build, production |
| `npm run lint` / `typecheck` | qualité |
| `npm run db:migrate` | nouvelle migration après modification du schéma |
| `npm run db:seed` / `db:reset` | (ré)initialiser les données de démo |
| `npm run db:studio` | explorer la base |
| `npm run stripe:listen` | relayer les webhooks Stripe en local |

---

## Mise en production — check-list

1. PostgreSQL : `provider = "postgresql"` dans `prisma/schema.prisma`, `DATABASE_URL`, puis `npx prisma migrate dev --name init-postgres` (les migrations SQLite actuelles sont à régénérer).
2. `APP_URL` (domaine final), `AUTH_SECRET` fort, SMTP (avec SPF/DKIM sur le domaine), clés Stripe **live** + endpoint webhook (`/api/stripe/webhook`, événements `checkout.session.completed`, `customer.subscription.updated|deleted`, `invoice.paid|payment_failed`).
3. Stockage : le module `src/lib/storage.ts` écrit sur disque ; sur un hébergement sans disque persistant (Vercel…), le remplacer par S3 / R2 / Vercel Blob (même interface `putFile/getFile/removeFile`).
4. Limiteur de débit : en mémoire (une instance) — passer à Redis/Upstash si plusieurs instances.
5. Recherche par image : CLIP tourne en local (Node, ~400 Mo de RAM). Au-delà de quelques milliers de photos, stocker les embeddings dans pgvector.
6. Faire valider les textes juridiques (CGU, confidentialité, cookies) par un juriste.

## Points à valider avec la cliente

- **Prix** : validés le 04/11/2026 (clients 39/49 € et 79/95 € ; makers 149/179, 299/349, 499/579 € ; Founding Partner 149 €).
- **Nombre de compétences par profil** (question de la maquette) : vocabulaire contrôlé illimité + **15 mots-clés libres** en bulles.
- **Accès multi-utilisateurs** (Studio / Intelligence dans la maquette) : non développé — retiré des listes de fonctionnalités en attendant (comptes d'équipe à prévoir).
- **Paiement à échéance choisie / moyens de paiement par pays** (notes de la maquette) : facturation mensuelle à la date de souscription ; moyens de paiement locaux gérés par Stripe selon le pays.
- **Traductions** : rédigées pour le lancement, à faire relire par des natifs (surtout le chinois). Les textes juridiques traduits doivent être validés par un juriste, comme l'original.
- **Anthropic** ajouté aux sous-traitants dans la politique de confidentialité : à valider (RGPD).

## Choix du visuel (`/visuel/<VISUEL_KEY>`)

Interface privée où la cliente essaie directions, couleurs, polices et détails sur les vraies pages du site, puis valide son choix.

- **Principe :** chaque page s'affiche dans un cadre du même domaine, dans lequel `src/lib/visuel/theme.ts` dépose une feuille de style. Le site lui-même ne change pas tant que le choix n'est pas reporté.
- **Accès :** `VISUEL_KEY` dans l'environnement (`demo` en local). Sans clé, la page renvoie une 404.
- **Résultat :** table `DesignChoice`, à lire sur `/admin/visuel`. La validation la plus récente fait foi ; la page donne les variables à reporter dans `src/app/globals.css`, les polices à charger dans `src/app/layout.tsx`, et un lien pour rouvrir le réglage.
- **Polices :** chargées depuis Google Fonts dans l'interface seulement. Celles retenues passeront par `next/font`.
