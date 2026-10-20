# Mode bar — prototype sans base distante

Une partie est vendue séparément au comptoir. Le personnel encaisse puis remet un ticket imprimé. Le client ouvre le jeu, saisit son code, choisit 2 à 10 joueurs et commence la partie sur un téléphone partagé. Aucun paiement en ligne ni compte client n’est ajouté.

## Ce que cette première version garantit

- Reconnaissance des codes suivant la règle et détection de nombreuses erreurs de saisie.
- Vérification de l’établissement configuré et de la date limite, selon l’horloge de l’appareil.
- Un code ne lance qu’une nouvelle partie dans le même stockage de navigateur.
- La simple validation du ticket ne le consomme pas : il est utilisé au clic « Commencer la partie » après saisie des joueurs.
- L’enregistrement de la partie et du ticket utilisé est atomique : si l’enregistrement échoue, le ticket reste disponible. Deux onglets ne peuvent pas utiliser le même code simultanément dans ce navigateur.
- Fermer et reprendre une partie ne demande aucun autre ticket. L’expiration ultérieure du ticket n’interrompt pas une partie démarrée.
- Remplacer une partie demande un nouveau code. Annuler la préparation du remplacement préserve l’ancienne partie.
- Effacer la partie via les paramètres conserve le registre des tickets utilisés. Les sauvegardes d’avant le mode bar restent reprenables.

## Limite essentielle pour les ventes

**La clé de contrôle est publique et n’est pas une signature ni une preuve d’achat.** Quelqu’un qui connaît la règle peut fabriquer un code accepté. Le même ticket peut être utilisé sur un autre appareil, dans un autre navigateur, après effacement des données du site ou en navigation privée. La date dépend également de l’horloge locale. Aucun registre de ventes, de consommation ou de révocation n’est partagé entre les téléphones.

Il s’agit d’un prototype pour tester le parcours avec un bar, pas d’un système garantissant un accès payé à usage unique. Ne pas présenter le contrôle local comme une protection commerciale. Pour garantir l’usage unique entre appareils, la prochaine étape devra vérifier et consommer les tickets dans un service partagé ; la base pourra être légère, mais il faudra un état de référence partagé. Des codes signés permettraient de renforcer l’authenticité sans base, tout en laissant ouverte la réutilisation entre appareils.

Aucun secret n’est inclus dans l’application. Les interfaces `checkTicket` et `startTicketGame` isolent le contrôle de l’interface et pourront être remplacées par des appels serveur.

## Configurer le bar

Modifier `data/bar-access.json` :

```json
{
  "bars": [{"id": "BEER", "name": "Le nom de votre bar"}],
  "gameUrl": "https://routhiautom.github.io/Beerodyssait_App/"
}
```

L’identifiant comporte exactement quatre caractères de l’alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`. Les lettres I, L, O et U sont exclues. Plusieurs établissements peuvent être ajoutés ; seuls les identifiants de ce fichier sont acceptés par cette édition du jeu. Après changement de configuration, reconstruire et republier le site.

## Générer les tickets

Depuis Beerodyssait_App :

```sh
./scripts/tickets.sh --bar BEER --expires 2026-12-31 --count 20
```

Avec Node 22.12+ directement accessible :

```sh
npm run tickets -- --bar BEER --expires 2026-12-31 --count 20
```

Le script crée un nouveau dossier dans `.tickets/` avec :

- `codes.csv` : les identifiants d’établissement, dates et codes pour le personnel.
- `tickets.html` : les tickets à ouvrir dans un navigateur puis à imprimer.

Chaque ticket porte le nom du bar, le code, l’adresse du jeu et sa date limite. Le fichier HTML reste un document local ; ne pas l’héberger avec le jeu. Le navigateur peut ajouter un en-tête/pied de page d’impression : les désactiver si souhaité. `--out .tickets/nom-du-lot` permet de choisir le dossier ; un lot existant n’est pas écrasé. Les lots sont exclus de Git et ne sont pas copiés dans `dist/`. Utiliser `.tickets/` pour conserver cette exclusion.

Un lot local de dix tickets de test valables jusqu’au 31 décembre 2026 inclus a été créé dans `.tickets/pilote-19-octobre/`. Ce lot sert aux essais et n’a pas été publié. Il ne faut pas remettre deux copies du même ticket à deux tables.

## Règle de code B1

Format : `B1-BBBB-DDDD-NNNN-NNNN-CCCC`.

- `B1` : version du format.
- `BBBB` : établissement.
- `DDDD` : nombre de jours depuis le 1er janvier 1970, en base 32.
- `NNNN-NNNN` : numéro aléatoire de 40 bits, généré avec `node:crypto` ; les doublons sont évités à l’intérieur d’un lot. L’unicité entre lots reste probabiliste.
- `CCCC` : contrôle public de 20 bits dérivé de FNV-1a sur le corps préfixé par `BEERODYS-B1:`. **Ce n’est pas un mécanisme cryptographique.**

Les espaces, tirets et différences majuscules/minuscules sont tolérés. La date limite est inclusive jusqu’à 23:59:59.999 UTC ; il n’y a pas de durée maximale de partie liée à cette date. Les fonctions de référence se trouvent dans `src/access/codes.ts` ; le générateur utilise ces mêmes fonctions.

## Tester au comptoir

1. Lancer `./scripts/preview.sh` ou publier sur GitHub Pages après les contrôles.
2. Ouvrir le jeu, choisir « Nouvelle partie », saisir un ticket et choisir les joueurs.
3. Annuler avant le démarrage et vérifier que ce même ticket peut encore être saisi.
4. Démarrer, fermer et reprendre la partie sans nouveau code.
5. Essayer ce ticket pour une deuxième partie : refus dans le même navigateur.
6. Après un premier chargement complet, vérifier le parcours en mode avion.
7. Sur un deuxième téléphone, constater la limite : le ticket reste utilisable, faute de registre partagé.

Le registre est local au navigateur et à l’origine du site : un code utilisé sur localhost sera encore disponible sur GitHub Pages. Les données locales sont stockées dans l’IndexedDB existante ; aucune base distante n’a été introduite.

## Vérifications de cette version

- 55 tests unitaires réussis, dont format, dates limites et altérations des codes.
- 12 parcours navigateur réussis : règles existantes, parties à 2 et 10 joueurs, saisie FR/EN, refus des tickets invalides/expirés/d’un autre bar, annulation avant consommation, refus d’une réutilisation après effacement de la partie, deux onglets concurrents, expiration pendant la préparation et échec d’écriture sans perte du ticket.
- Compilation TypeScript/Vite et cache PWA réussis.
- Activation d’un nouveau ticket hors ligne après installation, reprise et mises à jour PWA vérifiées sous un sous-chemin.
- Lot CSV/HTML effectivement généré ; exclusion Git des lots vérifiée.
- Écran de saisie vérifié à 390 × 844 pixels en français et en anglais ; captures `docs/mode-bar-mobile.png` et `docs/mode-bar-mobile-en.png`.
- 50 empreintes du projet Vinodyssait_App inchangées, archive comprise.

Le mode bar n’a pas encore été validé sur des téléphones physiques ni publié à distance.
