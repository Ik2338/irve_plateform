# 🔌 IRVE Platform

Plateforme de mise en relation entre clients (particuliers, entreprises, copropriétés) et installateurs IRVE certifiés.

## Stack technique

| Couche       | Technologie                         |
|--------------|-------------------------------------|
| Frontend     | Next.js 14, TypeScript, Tailwind CSS |
| Backend      | NestJS, Swagger (docs auto)         |
| Base de données | PostgreSQL 15 + PostGIS (géoloc) |
| Cache/sessions | Redis 7                          |
| ORM          | Prisma                              |
| Géocodage    | API Adresse data.gouv.fr            |
| Emails       | Resend                              |
| Reverse proxy | Nginx                              |

## Lancement rapide

```bash
# 1. Cloner et se placer dans le dossier
git clone <repo> && cd irve-platform

# 2. Configurer l'environnement
cp .env.example .env

# 3. Lancer tout le projet
make up

# 4. Attendre ~30s que les migrations s'appliquent
```

## URLs

| Service            | URL                           |
|--------------------|-------------------------------|
| Frontend           | http://localhost:3000         |
| API Backend        | http://localhost:3001         |
| Swagger (API docs) | http://localhost:3001/docs    |
| Nginx (point d'entrée) | http://localhost:80       |
| Adminer (DB UI)    | http://localhost:8080 *(make dev-tools)* |

## Comptes de test (seed)

| Rôle         | Email                        | Mot de passe  |
|--------------|------------------------------|---------------|
| Admin        | admin@irve-platform.fr       | Admin1234!    |
| Client       | client@test.fr               | Client1234!   |
| Installateur | installateur@test.fr         | Install1234!  |

## Commandes utiles

```bash
make up          # Démarrer tous les services
make down        # Arrêter
make logs        # Voir les logs en temps réel
make reset       # Reset complet (supprime les volumes)
make seed        # Relancer le seed manuellement
make studio      # Prisma Studio (UI BDD)
make dev-tools   # Démarrer Adminer
```

## Architecture des modules NestJS

```
src/
├── auth/          → JWT, login, register, RBAC
├── users/         → Profils utilisateurs
├── installers/    → Profils installateurs + recherche PostGIS
├── requests/      → Demandes d'installation
├── matching/      → Algorithme de scoring géographique
├── quotes/        → Devis + workflow acceptation
├── admin/         → Dashboard admin, validation installateurs
└── common/        → Prisma, guards, decorators partagés
```

## Workflow complet

1. **Client** crée un compte → dépose une demande (type, puissance, adresse)
2. **Matching** PostGIS → trouve les installateurs dans le rayon, calcule un score
3. **Installateur** voit le lead dans son dashboard → envoie un devis
4. **Client** reçoit le devis → accepte ou refuse
5. **Admin** valide les certifications IRVE des installateurs
