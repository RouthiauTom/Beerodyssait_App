# Audit et proposition — Beerodys’Sait

Audit en lecture seule du 12 octobre 2026. Aucune modification du projet Vinodyssait_App. Le dossier de destination contenait uniquement son dépôt Git avant cet audit.

## Éléments vérifiés

- Application React 19, TypeScript, Vite ; moteur pur dans src/game/engine.ts.
- Parcours validé : 60 cases après le départ, arrivée sur la case 60.
- 2 à 10 joueurs sur un appareil partagé, ordre de saisie, dé de 1 à 6.
- Choix entre trois niveaux pour les catégories générales ; questions régionales sans niveau.
- 60 secondes avec échéance absolue : le temps continue après fermeture ou passage en arrière-plan.
- Échelles 4→19 et 27→38 avant la question ; activation uniquement à l’arrêt.
- Bonne réponse : maintien. Échec : retour avant lancer après lecture de la correction.
- Case spéciale 56→33 : réussite au niveau expert évite la descente ; réussite aux autres niveaux entraîne la descente ; échec entraîne le retour avant lancer.
- Arrivée ou dépassement plafonné à la dernière case : une dernière bonne réponse est nécessaire pour gagner.
- QCM/vrai-faux corrigés automatiquement ; réponse orale révélée puis validée par le groupe.
- Pas de répétition tant que le filtre dispose de questions inédites ; répétition autorisée ensuite dans ce même filtre.
- Banque source : 673 questions vin, formats {'qcm': 442, 'true_false': 84, 'open': 147}, traductions FR/EN. Ces questions ne constituent pas une banque bière.
- Sauvegarde IndexedDB, préférences locales, cache PWA et scripts de publication statique présents.
- Écrans regroupés dans src/App.tsx : accueil, joueurs, plateau, niveau, question, correction, fin de tour, victoire, règles et paramètres.
- Ressources : plateau viticole, logo et cartes de menu en PNG ; police Jost locale avec licence OFL. Les visuels du vin doivent être remplacés pour le nouveau thème.
- Tests existants : moteur, sauvegardes, préparation des données, parcours Playwright et PWA. Ils ont été inventoriés, pas exécutés pendant cet audit.

## Proposition de version bière

Conserver le moteur et les transitions, les 60 cases, les deux raccourcis et la case de recul. Concevoir un plateau original, lisible sur téléphone, un univers ambre/crème/vert houblon et une identité Beerodys’Sait.

Catégories proposées : histoire de la bière ; géographie et traditions ; styles, arômes et accords ; ingrédients et brassage ; escales brassicoles. Niveaux proposés : Curieux, Amateur, Maître brasseur.

Les escales remplaceraient les régions viticoles. Deux directions possibles : parcours international des cultures brassicoles, ou parcours français. Les règles resteraient équivalentes ; les coordonnées et décors du nouveau plateau seraient propres au projet bière.

Créer une nouvelle banque documentée, avec sources pour vérifier les réponses et couverture de chaque catégorie/niveau/escale. Ne pas transformer mécaniquement les réponses vin. La banque et les traductions nécessitent une autorisation de création, distincte de la réutilisation des règles.

Isoler les noms de base IndexedDB, clés de préférences, cache PWA et identité de l’application afin que les parties vin et bière restent indépendantes.

## Organisation proposée

- src/game/ : moteur et règles conservés, avec tests adaptés.
- src/components/ et src/App.tsx : interface et plateau bière.
- src/i18n/ : textes FR/EN selon langue retenue.
- src/storage/ : sauvegarde isolée.
- data/ : plateau, règles, nouvelle banque bière.
- public/ : identité graphique et ressources locales.
- tests/ : moteur, banque, parcours navigateur.
- docs/ : décisions, sources des questions et instructions de lancement.

## Étapes et contrôles

1. Valider cet audit et les choix ci-dessous.
2. Copier uniquement les fichiers techniques utiles dans Beerodyssait_App ; exclure .git, .env, secrets, node_modules, dist et archive historique. Conserver le dépôt destination.
3. Adapter identité, plateau et stockage ; construire et vérifier la banque bière.
4. Adapter interface, règles affichées et tests ; exécuter tests unitaires, vérification TypeScript, compilation, parcours navigateur et test PWA si l’environnement le permet.
5. Fournir version locale jouable et documentation ; comparer les empreintes source au manifeste initial. Aucune publication distante n’est comprise dans cette étape.

## Décisions attendues

- Validation du présent audit pour lancer le développement, demandée explicitement par AGENTS.md.
- Banque bière déjà disponible, ou autorisation de créer une banque originale sourcée ?
- Parcours international (proposé) ou français ?
- Français seulement pour la première version, ou français et anglais comme le jeu source ?

Aucun code de jeu créé à ce stade ; aucun test annoncé comme réussi. docs/integrite-source.json enregistre les empreintes initiales des fichiers techniques, ressources et archive de référence.
