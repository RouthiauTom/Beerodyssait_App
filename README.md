# Beerodys’Sait

Jeu culturel autour de la bière pour **2 à 10 joueurs sur un appareil partagé**, en français et en anglais. Version internationale de Vinodys’Sait, développée uniquement dans `Beerodyssait_App`.

Le parcours comprend 60 cases et dix escales : Belgique, Allemagne, Tchéquie, Angleterre, Irlande, France, États-Unis, Écosse, Pologne et Finlande. Les 220 questions bilingues couvrent histoire, géographie, styles/arômes, ingrédients/brassage et destinations. Trois niveaux : Curieux, Amateur et Maître brasseur. Aucun compte ni serveur de données requis.

## Mode bar : une partie par ticket

Une nouvelle partie demande désormais un code remis après encaissement au comptoir. Le ticket est utilisé au démarrage, puis la partie peut être reprise sans autre code. L’interface est disponible en français et en anglais.

Pour créer des tickets imprimables :

```sh
./scripts/tickets.sh --bar BEER --expires 2026-12-31 --count 20
```

Le dossier `.tickets/` contient les lots locaux et reste exclu de Git. Un lot de dix tickets de test est disponible dans `.tickets/pilote-19-octobre/`.

**Prototype sans serveur : la règle des codes est publique, et leur réutilisation est bloquée uniquement dans le même navigateur.** Un autre appareil ou l’effacement des données permet une réutilisation. Voir [le guide du mode bar](docs/MODE_BAR.md) pour la configuration, l’impression, le format et les limites avant un essai commercial.

## Jouer en local

```sh
./scripts/dev.sh
```

Ouvrir l’adresse affichée dans le terminal. Le script utilise le Node local du projet s’il est présent, sinon le Node installé sur la machine. Sur une nouvelle machine, installer Node 22.12+ et exécuter `npm ci` dans ce dossier.

Pour tester la version compilée avec sauvegarde et cache hors ligne :

```sh
./scripts/preview.sh
```

Attendre le message **« Prêt à jouer hors ligne sur cet appareil. »** avant de couper la connexion. Le serveur de développement ne prépare pas le cache hors ligne. La partie et les préférences restent sur le navigateur et l’appareil utilisés. Le chronomètre de 60 secondes continue après fermeture de l’application.

L’installation sur téléphone nécessite un hébergement HTTPS. Safari sur iPhone : Partager → Sur l’écran d’accueil. Android : option d’installation du navigateur. La validation réalisée ici utilise Chromium ; une vérification de cette nouvelle version sur vos téléphones reste à faire.

## Règles conservées

- Dé de 1 à 6 ; ordre des joueurs selon leur saisie.
- Raccourcis 4→19 et 27→38 déclenchés à l’arrêt, avant la question.
- Bonne réponse : maintien ; mauvaise réponse ou expiration : retour avant lancer après lecture de la correction.
- Cuve renversée 56→33 : seule une bonne réponse Maître brasseur évite le recul ; une mauvaise réponse revient à la position avant lancer.
- Questions orales : révéler la réponse, puis le groupe valide.
- Arrivée en Finlande, même en cas de dépassement : réussir la dernière question pour gagner.
- Passage au joueur suivant par bouton ; sauvegarde automatique locale.

## Vérifier

Avec Node dans le PATH :

```sh
npm test
npm run build
PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/browsers" npm run test:e2e
PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/browsers" npm run test:pwa
npm run test:integrity
```

Le runtime local est dans `.tools/node-v22.23.3-darwin-arm64/bin/`. Les tests navigateur nécessitent Chromium Playwright ; avec Node installé, `PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/browsers" npx playwright install chromium` installe ce navigateur uniquement dans ce projet.

## Modifier la banque et le plateau

La banque éditoriale est le CSV `data/Beerodys'Sait - Banque de questions Bières v1 - Untitled.csv`. `npm run prepare:data` reconstruit `data/questions.json` ; `npm run check:data` vérifie leur synchronisation et `npm run test:data` contrôle l’import. Les identifiants existants doivent conserver leur sens pour les parties sauvegardées. Les sources sont documentées dans [docs/BANQUE_QUESTIONS.md](docs/BANQUE_QUESTIONS.md), avec les liens web ou références bibliographiques affichés après chaque correction. La banque comprend 120 ajouts rédigés à partir du livre fourni La Bière pour les Nuls, dans les thèmes et niveaux existants.

`npm run prepare:board` reconstruit le plateau SVG FR/EN et les données de positions. Les graphismes sont originaux, réalisés en SVG ; la police Jost conserve sa licence OFL. Les questions et traductions sont une rédaction originale, pas une copie de la banque vin ni une reproduction des fiches de référence.

`dist/` contient la version statique prête à héberger. Les chemins relatifs permettent un hébergement sous un sous-chemin. Aucun déploiement distant n’a été effectué.

Voir [docs/LIVRAISON.md](docs/LIVRAISON.md) pour les contrôles et limites de cette version.
