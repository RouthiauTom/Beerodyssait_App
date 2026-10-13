# Banque originale — Beerodys’Sait

Édition initiale : 13 octobre 2026. 100 questions, chacune rédigée en français et en anglais : 200 énoncés au total, correspondant à 100 identifiants de jeu.

## Couverture

| Catégorie | Curieux | Amateur | Maître brasseur |
| --- | ---: | ---: | ---: |
| Histoire | 5 | 5 | 5 |
| Géographie | 5 | 5 | 5 |
| Styles & arômes | 5 | 5 | 5 |
| Ingrédients & brassage | 5 | 5 | 5 |

Les dix escales possèdent chacune quatre questions sans niveau : 40 questions supplémentaires. Le tirage évite les identifiants déjà utilisés, puis autorise les répétitions dans le filtre demandé quand celui-ci est épuisé. Sur une longue partie, les sujets peuvent donc revenir. Plusieurs questions abordent une même tradition sous différents angles.

## Formats et méthode

- 66 questions de type `qcm`.
- 20 questions de type `true_false`.
- 14 questions de type `open`.

Les QCM ont une seule bonne réponse dans cette édition ; le moteur conserve la prise en charge des réponses multiples. Les questions ouvertes indiquent les variantes acceptées lorsque nécessaire. La correction des questions orales appartient au groupe.

Les réponses factuelles ont été confrontées aux sources ci-dessous ; les distracteurs, formulations et traductions ont été rédigés pour ce jeu. Les fiches BJCP sont des descriptions de styles, pas des règles universelles concernant toutes les bières commerciales. Les questions utilisent donc le contexte « traditionnel », « généralement » ou une référence précise lorsque nécessaire. Cette première édition n’a pas fait l’objet d’une relecture indépendante par un professionnel du brassage.

Les faits historiques et sensoriels ont été privilégiés aux chiffres de marché, palmarès et réglementations susceptibles de changer. Une source consultable est associée à chaque question dans `data/questions.json` et affichée sur la correction. Les liens sont facultatifs : le contenu indispensable au jeu est embarqué localement.

## Références consultées

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

Modifier `scripts/create-questions.py`, puis exécuter `npm run prepare:data` et `npm test`. Chaque ajout doit posséder les deux langues, une réponse et une référence ; les identifiants des questions déjà publiées doivent rester stables. Une modification du sens d’une question demande une stratégie de version des sauvegardes.
