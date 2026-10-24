"""Compile la banque CSV éditoriale FR/EN ; le livre local n’est pas requis."""
import argparse
import csv
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = ROOT / "data/Beerodys'Sait - Banque de questions Bières v1 - Untitled.csv"


def compile_bank(path):
    book = json.loads((ROOT / 'data/book-reference.json').read_text(encoding='utf-8'))
    with path.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        required = {'id', 'categoryId', 'regionId', 'difficulty', 'type', 'correctChoiceIds',
                    'sources', 'provenance_status', 'provenance_checkedOn'}
        for language in ['fr', 'en']:
            required.update(f'{name}_{language}' for name in ['question', 'expectedAnswer', 'choiceA', 'choiceB', 'choiceC'])
        if not required.issubset(reader.fieldnames or []):
            raise ValueError('Colonnes manquantes : ' + ', '.join(sorted(required - set(reader.fieldnames or []))))
        rows = list(reader)
    questions, ids, texts = [], set(), {'fr': set(), 'en': set()}
    for line, row in enumerate(rows, 2):
        try:
            ident, category = int(row['id']), int(row['categoryId'])
            region = int(row['regionId']) if row['regionId'] else None
            difficulty = int(row['difficulty']) if row['difficulty'] else None
            kind = row['type']
            if ident < 1 or ident in ids:
                raise ValueError('Identifiant invalide ou dupliqué')
            if category == 5:
                if region not in range(1, 11) or difficulty is not None:
                    raise ValueError('Une escale exige une région 1–10 et aucun niveau')
            elif category not in range(1, 5) or difficulty not in [1, 2, 3] or region is not None:
                raise ValueError('Catégorie générale ou niveau invalide')
            if kind not in ['qcm', 'true_false', 'open']:
                raise ValueError('Format inconnu')
            correct = [value.strip() for value in re.split(r'[;,]', row['correctChoiceIds']) if value.strip()]
            if kind == 'true_false':
                correct = [value.lower() for value in correct]
            if len(correct) != len(set(correct)):
                raise ValueError('Réponses correctes dupliquées')
            if kind == 'open' and correct:
                raise ValueError('Une question ouverte ne contient pas de choix correct')
            if kind == 'true_false' and (len(correct) != 1 or correct[0] not in ['true', 'false']):
                raise ValueError('Réponse vrai/faux invalide')
            translations = {}
            for language in ['fr', 'en']:
                text, answer = row[f'question_{language}'], row[f'expectedAnswer_{language}']
                if not text.strip() or not answer.strip() or text.strip().casefold() in texts[language]:
                    raise ValueError(f'Texte {language} manquant ou question dupliquée')
                choices = [{'id': key, 'text': row[f'choice{key}_{language}']} for key in 'ABC' if row[f'choice{key}_{language}'].strip()]
                if kind == 'qcm':
                    if len(choices) < 2 or not correct or not set(correct).issubset(c['id'] for c in choices):
                        raise ValueError(f'Choix ou correction {language} invalides')
                    if len({c['text'].strip().casefold() for c in choices}) != len(choices):
                        raise ValueError(f'Choix {language} dupliqués')
                elif choices:
                    raise ValueError('Choix superflus pour une question ouverte ou vrai/faux')
                texts[language].add(text.strip().casefold())
                translations[language] = {'question': text, 'expectedAnswer': answer, 'choices': choices}
            if [c['id'] for c in translations['fr']['choices']] != [c['id'] for c in translations['en']['choices']]:
                raise ValueError('Les identifiants de choix FR/EN diffèrent')
            sources = [value.strip() for value in row['sources'].splitlines() if value.strip()]
            if not sources or not row['provenance_status'] or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', row['provenance_checkedOn']):
                raise ValueError('Source ou provenance manquante')
            provenance = {'status': row['provenance_status'], 'checkedOn': row['provenance_checkedOn']}
            if row.get('source_book'):
                if row['source_book'] != book['id'] or not all(row.get(key) for key in ['source_chapter', 'source_section', 'source_locator']):
                    raise ValueError('Référence de livre incomplète')
                if not re.fullmatch(r'OEBPS/chap\d{3}\.xhtml#[\w-]+', row['source_locator']):
                    raise ValueError('Localisation EPUB invalide')
                provenance['reference'] = {'bookId': book['id'], 'title': book['title'], 'isbn': book['isbn'],
                                           'year': book['year'], 'chapter': row['source_chapter'],
                                           'section': row['source_section'], 'locator': row['source_locator']}
            elif any(not source.startswith('https://') for source in sources):
                raise ValueError('Référence web invalide ; utiliser une URL HTTPS ou une référence bibliographique')
            questions.append({'id': ident, 'categoryId': category, 'regionId': region, 'difficulty': difficulty,
                              'type': kind, 'correctChoiceIds': correct, 'translations': translations,
                              'sources': sources, 'provenance': provenance})
            ids.add(ident)
        except (ValueError, TypeError, KeyError, AttributeError) as error:
            raise ValueError(f'Ligne {line}, question {row.get("id", "?")} : {error}') from error
    if not questions:
        raise ValueError('Banque vide')
    # Le moteur ne doit jamais manquer de question pour une case ou un niveau.
    for category in range(1, 5):
        for level in range(1, 4):
            if not any(q['categoryId'] == category and q['difficulty'] == level for q in questions):
                raise ValueError(f'Filtre vide : catégorie {category}, niveau {level}')
    for region in range(1, 11):
        if not any(q['categoryId'] == 5 and q['regionId'] == region for q in questions):
            raise ValueError(f'EscaIe sans question : {region}')
    return {'schemaVersion': 1, 'edition': 'Beerodys’Sait — banque bilingue enrichie v2',
            'questions': sorted(questions, key=lambda question: question['id'])}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--csv', type=Path, default=DEFAULT_CSV)
    parser.add_argument('--check', action='store_true', help='Vérifie la synchronisation sans écrire')
    args = parser.parse_args()
    try:
        bank = compile_bank(args.csv)
        output = json.dumps(bank, ensure_ascii=False, indent=2) + '\n'
        target = ROOT / 'data/questions.json'
        if args.check:
            if not target.exists() or target.read_text(encoding='utf-8') != output:
                raise ValueError('CSV et JSON désynchronisés : exécuter npm run prepare:data')
            print(f'PASS : CSV et JSON synchronisés, {len(bank["questions"])} questions bilingues.')
        else:
            target.write_text(output, encoding='utf-8')
            print(f'{len(bank["questions"])} questions bilingues compilées depuis le CSV.')
    except (ValueError, OSError, csv.Error) as error:
        print(f'ERREUR : {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
