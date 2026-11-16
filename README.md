## PikaCube 


C'est quoi ?

PikaCube est un jeu de Rubik's Cube en 3D jouable dans le navigateur, basé sur votre maquette HTML d'origine. C'est une application web complète avec :

- Un cube 3D interactif (Three.js) : on le tourne à la souris ou au tactile, on fait pivoter les faces en glissant dessus, ou avec le clavier (touches U, D, R, L, F, B)
- Un mode de jeu chronométré : le cube se mélange, vous le résolvez, le temps et le nombre de coups sont comptés
- Un classement des meilleurs scores
- Une partie administrateur pour gérer les joueurs
- Un design "maximaliste" façon arcade : couleurs vives, bordures épaisses, animations, confettis à la victoire, mode sombre/clair

Comment ça fonctionne ?

Le projet est organisé en 3 grandes parties :

1. Le moteur 3D du cube (`src/game/cube-engine.ts`)
- Construit le cube en 3D (2×2, 3×3, 4×4…)
- Gère les rotations des faces, le mélange aléatoire, la détection de victoire
- Gère les interactions : glisser sur une face pour la tourner, glisser à côté pour faire tourner la caméra, pincer/molette pour zoomer

2. Les pages (`src/routes/`)
- `/` — page d'accueil avec présentation du jeu
- `/jeu` — la page de jeu (choix de la taille du cube, chrono, boutons annuler/mélanger)
- `/classement` — le tableau des scores et l'espace admin

3. Le stockage (`src/game/store.ts`)
- Les comptes joueurs et les scores sont sauvegardés dans le navigateur (localStorage), comme dans votre maquette
- ⚠️ Conséquence : le classement ne voit que les joueurs du même appareil. Si vous voulez de vrais comptes partagés entre tous les joueurs, il faudra ajouter Lovable Cloud (base de données intégrée) — demandez-moi et je l'ajoute.

Comment le lancer ?

Après avoir extrait le ZIP sur votre machine :

```bash
# 1. Installer les dépendances (une seule fois)
bun install
# ou : npm install

# 2. Lancer le serveur de développement
bun dev
# ou : npm run dev
```

Puis ouvrez http://localhost:8080 dans votre navigateur.

Prérequis : avoir [Node.js](https://nodejs.org) (ou [Bun](https://bun.sh)) installé.
