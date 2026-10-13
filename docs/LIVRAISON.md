# Livraison locale — 13 octobre 2026

Version jouable de Beerodys’Sait construite exclusivement dans `Beerodyssait_App`. La validation du plan par le propriétaire autorise la banque originale, le parcours international et les langues français/anglais.

## Réalisé

- Identité originale ambre/crème/vert houblon : logo, icône et plateau SVG localisés FR/EN.
- Parcours de 60 cases, dix escales internationales, deux raccourcis et cuve renversée ; règles et moteur conservés.
- 100 questions originales avec réponses, traductions et liens de référence (60 générales et 40 d’escales).
- Interface mobile, zoom/déplacement du plateau, pions numérotés, paramètres sonores, règles et victoire.
- Sauvegarde et préférences indépendantes de Vinodys’Sait : IndexedDB `beerodyssait`, clé `beerodyssait.preferences`, cache PWA `beerodyssait` limité au chemin de l’application.
- Version statique compilée dans `dist/`, installable et utilisable hors ligne après un chargement complet.
- Scripts de lancement utilisables avec le runtime Node local, documentation de la banque et vérification d’intégrité source.

## Vérifications exécutées et réussies

| Contrôle | Résultat |
| --- | --- |
| Vitest | 39 tests réussis |
| TypeScript et compilation Vite | Réussis via `npm run build` |
| Playwright Chromium | 5 parcours réussis |
| Parties complètes dans l’interface | 2 et 10 joueurs |
| Mobile 390 × 844 | Configuration, zoom, sauvegarde/reprise, paramètres |
| Langue anglaise | Interface, question, plateau anglais et reprise |
| Réponse incorrecte | Correction avant recul puis joueur suivant |
| Couverture de la banque | Chaque case/niveau/langue possède une question compatible |
| PWA sous un sous-chemin | Rechargement hors ligne, ressources, sauvegarde et police |
| Mise à jour PWA | Activation différée ; partie conservée |
| Délai après fermeture | Expiration et pénalité vérifiées hors ligne |
| Téléchargement incomplet | Nouvelle installation rejetée ; ancien cache utilisable |
| Intégrité source | 50 empreintes identiques, archive historique comprise |

Les captures de l’accueil sont dans `docs/accueil-desktop.png`, `docs/accueil-mobile.png` et `docs/accueil-mobile-en.png`. `docs/interface-mobile.png` montre une question en cours de partie.

## Limites et prochaines vérifications

La version n’a pas encore été essayée sur des appareils iPhone/Android réels ni publiée sur un hébergement distant. La banque comporte cinq questions par catégorie/niveau et quatre par escale ; les filtres épuisés autorisent les répétitions selon la règle existante. Une relecture brassicole indépendante et l’enrichissement de la banque permettront d’améliorer la variété.

Le plateau réinterprète le parcours d’origine ; la dynamique est conservée, tandis que le décor et les positions graphiques sont nouveaux. Le jeu couvre dix traditions, principalement européennes, avec une escale américaine : il ne prétend pas représenter toutes les cultures brassicoles mondiales.

## Lancer

`./scripts/dev.sh` pour développer ; `./scripts/preview.sh` pour compiler et essayer le mode hors ligne. Le serveur d’aperçu lancé pendant la livraison écoute sur `http://127.0.0.1:4173/` tant que son processus reste actif.
