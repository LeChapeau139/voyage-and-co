# Voyage & Co — Contexte projet

## Stack technique
- **Next.js 15** App Router, `'use client'` components
- **Supabase** (auth + base de données + storage)
- **Vercel** auto-deploy depuis GitHub `main`
- **Tailwind CSS** (palette terracotta : `#C2714A`, fond `#FAF8F5`, texte `#2C2416`)
- `.npmrc` avec `legacy-peer-deps=true` (pour react-simple-maps)
- Gemini API (classification photo, génération de couverture via Pollinations)
- Nominatim OpenStreetMap (reverse geocoding EXIF GPS)
- `exifr` (lecture EXIF : `exifr.gps()` pour GPS, `exifr.parse()` pour la date)

## Sécurité — règles absolues
- `.env.local` gitignored, **jamais commité**
- `SUPABASE_SERVICE_ROLE_KEY` → server-side uniquement (routes API)
- `GEMINI_API_KEY`, `FOURSQUARE_*` → `.env.local` uniquement

---

## Structure des pages (`src/app/(app)/`)

| Route | Description |
|-------|-------------|
| `/voyages` | Liste des voyages (own + partagés + invitations en attente) |
| `/voyages/[id]` | Détail voyage : timeline, membres, invite, public/privé |
| `/voyages/[id]/activities/[activityId]` | Page détaillée d'un souvenir (galerie + anecdotes) |
| `/activites` | Bibliothèque de lieux + activités planifiées |
| `/autour-de-moi` | Recherche Foursquare de lieux proches |
| `/explorer` | Recherche d'utilisateurs + liste des abonnements |
| `/explorer/[userId]` | Profil public d'un utilisateur |
| `/explorer/[userId]/trips/[tripId]` | Vue lecture seule d'un voyage public |
| `/profil` | Mon profil (avatar photo/emoji, bio, abonnés, abonnements) |

## Composants clés
- `BottomNav.tsx` — Voyages · Activités · [+] · Autour · Explorer
- `ProfileButton.tsx` — bouton fixe top-right, avatar, lien vers /profil
- `FollowListSheet.tsx` — sheet générique liste de profils (abonnés/abonnements)
- `PageFade.tsx` — animation d'entrée de page
- `ToastContext.tsx` — `toast.success()`, `toast.error()`
- `usePullToRefresh.ts` — pull-to-refresh natif iOS/Android

---

## Schéma base de données Supabase

### `profiles`
```
id (uuid, PK = auth.uid)
username (text, UNIQUE)
display_name (text)
avatar_emoji (text)
avatar_url (text)   ← photo uploadée
bio (text)
created_at
```

### `trips`
```
id, user_id, name, description, destination
start_date, end_date, is_active, is_public
cover_url, travel_style (solo/couple/friends/family)
created_at, updated_at
```

### `activities`
```
id, trip_id, user_id, title, description
activity_type (food/culture/transport/hotel/nature/other)
entry_type (memory/planned)
scheduled_at, location_name, location_lat, location_lng
photos (text[])
cost (numeric, nullable)    ← coût en € du souvenir
is_expandable (bool)        ← page détaillée activée
photo_details (jsonb)       ← [{url, caption}] galerie enrichie
created_at, updated_at
```

### `follows`
```
id, follower_id, following_id, created_at
UNIQUE(follower_id, following_id)
```

### `trip_members`
```
id, trip_id, user_id, invited_by
status (pending/accepted/declined)
created_at
```

### `places`
```
id, user_id, title, description, activity_type
location_name, is_favorite, photos (text[])
folder_id, created_at, updated_at
```

### `place_folders`
```
id, user_id, name, emoji, parent_id, created_at
```

---

## Politiques RLS importantes

### `trips`
```sql
-- Mes voyages (CRUD complet)
CREATE POLICY "trips_own" ON trips FOR ALL USING (user_id = auth.uid());
-- Voyages publics (lecture)
CREATE POLICY "trips_public_read" ON trips FOR SELECT USING (is_public = true);
-- Voyages où j'ai été invité (pending ou accepted)
CREATE POLICY "trips_member_read" ON trips FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
      AND trip_members.status IN ('pending', 'accepted'))
);
```

### `trip_members`
```sql
-- Pas de référence à trips (évite la récursion infinie !)
CREATE POLICY "trip_members_own" ON trip_members FOR ALL
USING (user_id = auth.uid() OR invited_by = auth.uid());
```

### `activities`
```sql
CREATE POLICY "activities_select" ON activities FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_id AND trips.is_public = true)
  OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = activities.trip_id
    AND user_id = auth.uid() AND status = 'accepted')
);
CREATE POLICY "activities_insert" ON activities FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = activities.trip_id
      AND user_id = auth.uid() AND status = 'accepted')
  )
);
-- UPDATE et DELETE : propriétaire du voyage OU membre accepté (peut tout modifier)
CREATE POLICY "activities_update" ON activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trips WHERE id = activities.trip_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = activities.trip_id
    AND user_id = auth.uid() AND status = 'accepted')
);
CREATE POLICY "activities_delete" ON activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM trips WHERE id = activities.trip_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = activities.trip_id
    AND user_id = auth.uid() AND status = 'accepted')
);
```

---

## Routes API (`src/app/api/`)

| Route | Description |
|-------|-------------|
| `POST /api/upload-activity-photo` | Upload photo → Supabase Storage, retourne `{url}` |
| `POST /api/generate-cover` | Génère cover voyage via Pollinations.ai |
| `POST /api/classify-activity` | Gemini Vision → détecte le type d'activité depuis une photo |
| `POST /api/nearby` | Recherche Foursquare lieux proches (lat/lng/query) |
| `GET /api/trip-image` | (génération image voyage) |

---

## Fonctionnalités implémentées

### Voyages
- Création avec destination, style, dates, description
- Cover générée automatiquement (Pollinations.ai) en fond
- **Cover manuelle** : bouton 📷 sur le hero (owner), upload remplace cover_url
- Activation d'un voyage actif (badge ✈️)
- Suppression (avec confirmation)
- Public / Privé toggle
- **Budget** : section sous la timeline, total + répartition par catégorie avec barres (visible si ≥1 souvenir avec coût)

### Souvenirs (activities)
- Ajout depuis photo (EXIF auto-fill date + lieu GPS)
- **Auto-détection du type** via Gemini Vision (🍽️/🏛️/🌿/🏨/🚌/📍)
- Champ coût optionnel (€) par souvenir
- Page détaillée optionnelle (`is_expandable`) : galerie illimitée + légendes par photo
- Modification / suppression

### Collaboratif
- Inviter un abonné dans un voyage
- Invitation avec statut pending → accepter/refuser depuis page Voyages
- Membre accepté : CRUD complet sur les activités du voyage
- Propriétaire : retirer un membre ou annuler une invitation (tap sur avatar)
- Badge 👥 sur les voyages partagés

### Social (follows)
- Suivre / ne plus suivre (one-way, style Instagram)
- Compteurs abonnés/abonnements cliquables → sheet de liste
- Explorer : liste des abonnements + recherche par @pseudo
- Vue profil public avec voyages publics

### Profil
- Avatar : photo uploadée OU emoji au choix
- Bio, display_name, username (unique)
- Mes abonnements en horizontal scroll

### Autour de moi
- Géolocalisation + recherche Foursquare
- Ajouter en souvenir maintenant / planifier / bibliothèque

---

## Problèmes connus / résolus

| Problème | Solution |
|----------|----------|
| RLS infinite recursion sur trips | `trip_members_own` n'utilise que `auth.uid()`, pas de ref à `trips` |
| EXIF montrait date du jour | Utiliser `exifr.gps()` séparé + fallbacks `DateTimeOriginal/DateTime/CreateDate` |
| Théo voyait les voyages de Quentin | Ajout `.eq('user_id', user.id)` + nettoyage policies RLS |
| `silentErrors` TypeScript error exifr | Supprimé, `.catch(() => null)` suffit |

---

## À faire (backlog)

- Import en masse de photos : sélection multiple → remplir titre/desc pour chaque (EXIF pré-rempli)
- Carte interactive de l'itinéraire (mise en attente par l'utilisateur)
