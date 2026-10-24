# Banque bilingue — Beerodys’Sait

Édition enrichie du 24 octobre 2026 : **265 questions**, chacune en français et en anglais, soit 530 énoncés. Les identifiants 1–220 sont conservés ; la nouvelle sélection CSV occupe les identifiants 221–265. Les préfixes « Vrai ou Faux ? » ajoutés dans le CSV fourni sont repris dans le jeu.

## Fichiers et synchronisation

Le fichier éditorial de référence est `data/Beerodys'Sait - Banque de questions Bières v1 - Untitled.csv`. Son nom est conservé pour faciliter le suivi du fichier fourni. `data/questions.json` est généré depuis ce CSV : ne pas modifier uniquement le JSON, car une compilation des données écraserait ces changements.

```sh
npm run prepare:data
npm run check:data
npm run test:data
npm test
```

Le compilateur conserve les textes et identifiants du CSV. Il normalise les réponses de tableur `TRUE`/`FALSE` vers les valeurs utilisées par le moteur, sans modifier la correction. Il refuse les identifiants ou énoncés dupliqués, les traductions manquantes, les réponses incohérentes et les filtres de jeu vides. Le workflow GitHub Pages vérifie la synchronisation CSV/JSON avant publication.

## Couverture des thèmes et niveaux

| Catégorie | Curieux | Amateur | Maître brasseur | Total |
| --- | ---: | ---: | ---: | ---: |
| Histoire | 14 | 13 | 14 | 41 |
| Géographie | 13 | 13 | 13 | 39 |
| Styles, arômes et accords | 13 | 14 | 15 | 42 |
| Ingrédients et brassage | 13 | 13 | 17 | 43 |

L’enrichissement initial a ajouté huit questions à chacun des douze filtres généraux. La sélection CSV ajoute neuf questions générales supplémentaires. Les questions Curieux portent sur des notions accessibles ; Amateur demande du vocabulaire ou des connaissances plus précises ; Maître brasseur porte notamment sur des dates, des procédés et des distinctions techniques. Cette graduation est éditoriale, pas encore étalonnée auprès de joueurs.

Les escales comportent 100 questions communes sans sélection de niveau :

| Escale | Questions |
| --- | ---: |
| Belgique | 9 |
| Allemagne | 12 |
| Tchéquie | 11 |
| Angleterre | 10 |
| Irlande | 10 |
| France | 12 |
| États-Unis | 12 |
| Écosse | 10 |
| Pologne | 6 |
| Finlande | 8 |

La sélection CSV enrichit également les escales polonaise et finlandaise avec des sujets distincts du grodziskie et du sahti. La tradition finlandaise du sahti est, elle, abordée dans le passage consacré à la Norvège et ses voisins. Le plateau et les règles ne changent pas.

## Formats

- 190 questions de type `qcm`.
- 53 questions de type `true_false`.
- 22 questions de type `open`.

Les QCM de cette édition ont une bonne réponse parmi trois choix ; le moteur garde la prise en charge de choix multiples. Les questions ouvertes sont révélées puis évaluées par le groupe. Les corrections des nouveaux énoncés précisent le fait attendu et apportent une explication courte.

La sélection évite de répéter un identifiant tant que le filtre contient des questions inédites. Elle autorise ensuite les répétitions dans le même filtre, comme auparavant. Les questions régionales peuvent recouper des notions générales : la détection automatique garantit l’absence de doublons d’énoncé, pas l’absence de tout recoupement de concepts.

## Enrichissement à partir du livre fourni

Référence : **La Bière pour les Nuls**, Marty Nachel selon les métadonnées de l’édition fournie, First, 2022, ISBN **9782412080061**. L’EPUB local a été lu pour rédiger 120 questions nouvelles en français, leurs traductions anglaises, leurs distracteurs et leurs explications. Les questions sont une rédaction originale à partir des notions du texte ; elles ne reproduisent pas un questionnaire ou des passages entiers du livre.

La sélection utilise principalement les chapitres sur les ingrédients, le brassage, les familles de bières, la Real Ale, le vieillissement en fût, les bières monastiques, la dégustation, les accords, le tourisme brassicole et l’histoire. Les statistiques de marché, recommandations d’adresses, affirmations médicales et règles contemporaines susceptibles d’avoir changé n’ont pas été reprises. Pour les faits historiques, les questions précisent le contexte lorsque nécessaire. Aucune validation indépendante par un professionnel du brassage n’est revendiquée.

Chaque ajout contient une référence bibliographique dans `sources` et une référence structurée dans `provenance.reference` : livre, ISBN, année, chapitre ou annexe, section et localisation dans l’EPUB. Les quatre colonnes `source_book`, `source_chapter`, `source_section`, `source_locator` du CSV conservent cette traçabilité. Les identifiants de sections et chapitres correspondent à l’édition fournie ; ils ne prétendent pas donner une pagination universelle pour toutes les éditions.

Les questions et les corrections sont autonomes : elles ne demandent pas d’avoir lu un ouvrage et ne mentionnent ni le livre ni ses chapitres. Aucune source web ou bibliographique n’est affichée aux joueurs, après une réponse orale comme après une correction automatique. Les références restent uniquement dans les données éditoriales pour permettre les vérifications et la maintenance. Aucun lien vers le fichier EPUB n’est exposé. Le livre, son texte extrait et les scripts de lecture temporaires restent locaux et exclus de Git et de `dist/`. Les seuls éléments bibliographiques additionnels publiables sont les métadonnées de `data/book-reference.json` et les références des questions.

## Références web de la banque initiale

97 références avaient été déformées dans l’export CSV (tirets remplaçant des séparateurs d’URL, notamment). Les URLs exactes ont été récupérées depuis les questions correspondantes dans le JSON existant, sans changer le sens des questions. Le détail est consigné dans `docs/CORRECTIONS_REFERENCES_CSV.json`.

- [BJCP 2021 — pils](https://styles.bjcp.org/bjcp-2021-beer/3/3b-czech-premium-pale-lager)
- [BJCP 2021 — wheat](https://styles.bjcp.org/bjcp-2021-beer/10/10a-weissbier)
- [BJCP 2021 — porter](https://styles.bjcp.org/bjcp-2021-beer/13/13c-english-porter)
- [BJCP 2021 — stout](https://styles.bjcp.org/bjcp-2021-beer/15/15b-irish-stout)
- [BJCP 2021 — ipa](https://styles.bjcp.org/bjcp-2021-beer/21/21a-american-ipa)
- [BJCP 2021 — wit](https://styles.bjcp.org/bjcp-2021-beer/24/24a-witbier)
- [BJCP 2021 — saison](https://styles.bjcp.org/bjcp-2021-beer/25/25b-saison)
- [BJCP 2021 — lambic](https://styles.bjcp.org/bjcp-2021-beer/23/23d-lambic)
- [BJCP 2021 — gueuze](https://styles.bjcp.org/bjcp-2021-beer/23/23e-gueuze)
- [BJCP 2021 — garde](https://styles.bjcp.org/bjcp-2021-beer/24/24c-biere-de-garde)
- [BJCP 2021 — golden](https://styles.bjcp.org/bjcp-2021-beer/12/12a-british-golden-ale)
- [BJCP 2021 — bitter](https://styles.bjcp.org/bjcp-2021-beer/11/11a-ordinary-bitter)
- [BJCP 2021 — kolsch](https://styles.bjcp.org/bjcp-2021-beer/5/5b-kolsch)
- [BJCP 2021 — fest](https://styles.bjcp.org/bjcp-2021-beer/4/4b-festbier)
- [BJCP 2021 — scot](https://styles.bjcp.org/bjcp-2021-beer/14/14a-scottish-light)
- [BJCP 2021 — light](https://styles.bjcp.org/bjcp-2021-beer/1/1a-american-light-lager)
- [BJCP 2015 — Sahti](https://www.bjcp.org/style/2015/27/27A/historical-beer-sahti/)
- [BJCP 2015 — Piwo Grodziskie](https://www.bjcp.org/style/2015/27/27A/historical-beer-piwo-grodziskie/)
- [UNESCO — Culture de la bière en Belgique](https://ich.unesco.org/en/RL/beer-culture-in-belgium-01062)
- [Brewers Association — Ingrédients](https://www.brewersassociation.org/online-courses/beer-ingredients/)
- [American Homebrewers Association — Ingrédients et procédé](https://www.homebrewersassociation.org/wp-content/uploads/Ingredient-Signs.pdf)

## Maintenance

Modifier le CSV, puis lancer les quatre commandes de vérification ci-dessus. Un nouvel énoncé doit disposer des deux langues, d’une correction et d’une source vérifiable. Un ajout fondé sur ce livre doit également renseigner les quatre colonnes bibliographiques. Ne pas réutiliser un identifiant publié pour une autre question : les sauvegardes mémorisent ces identifiants.

L’EPUB n’est pas requis pour compiler et tester le jeu après l’enrichissement. Il faut cependant relire la source lors de toute nouvelle rédaction ou correction de fait. Les contrôles automatiques vérifient la structure et la cohérence du jeu ; ils ne prouvent pas la vérité de chaque réponse.

## Présentation aux joueurs

34 énoncés et 51 corrections ont été reformulés en français et en anglais pour retirer les renvois au livre, aux chapitres ou aux passages. Les 220 identifiants, catégories, niveaux et réponses correctes sont conservés. Un contrôle des textes affichables interdit les mentions du livre et les liens de sources dans les questions et corrections.

## Sélection du CSV de 300 propositions — 24 octobre 2026

45 questions ont été retenues et relues dans les deux langues : neuf générales et 36 régionales. Elles sont ajoutées aux CSV et JSON éditoriaux, sous les identifiants 221–265. Les 220 questions antérieures conservent leur contenu et leurs identifiants. Le fichier de propositions GEMINI est conservé sans modification et n’est pas chargé par le jeu.

Le [relevé de sélection](REVUE_IMPORT_GEMINI.csv) contient les 300 identifiants d’origine, le statut de sélection, l’identifiant attribué, le niveau initial et la référence de vérification des ajouts. « Non intégrée » ne signifie pas forcément erronée : ces propositions comprennent des doublons thématiques et des sujets qui nécessitent encore une reformulation ou une vérification. Elles ne constituent pas une réserve validée.

Les vérifications s’appuient notamment sur les producteurs concernés, le BJCP, les instituts techniques et les organismes touristiques officiels. Les affirmations variables (classements, seuils légaux, records commerciaux) n’ont pas été retenues. La pinte est présentée comme une valeur approximative ; le Šnyt ne reprend pas le ratio moitié bière/moitié mousse ; le widget est un dispositif libérant de l’azote ; Jim Koch est présenté comme cofondateur. Les questions sont autonomes et les références restent invisibles aux joueurs.

Les catégories importées sont rattachées aux thèmes existants. « Culture-bar » rejoint la dégustation ; les pays sont convertis vers les dix escales et perdent leur difficulté, conformément aux règles du jeu. Les choix et bonnes réponses FR/EN restent alignés et les positions des bonnes réponses QCM sont réparties entre A, B et C.

## Corrections pédagogiques — 24 octobre 2026

Les 265 corrections FR/EN comportent un texte explicatif court dans `expectedAnswer`, affiché après la réponse, correcte ou incorrecte, et lors de la révélation des questions ouvertes. Les 145 corrections initiales ou importées ont reçu un complément ; 34 corrections répétitives de l’enrichissement précédent ont été réécrites. Les autres disposaient déjà d’une explication utile.

Les textes apportent une définition, une distinction, une raison ou un repère historique ou géographique. Ils restent autonomes et sans sources affichées. Les identifiants, énoncés, choix, bonnes réponses, catégories et niveaux ne changent pas. Pour maintenir cette qualité, les tests refusent une correction réduite à un choix ou à la simple répétition d’un énoncé vrai/faux.
