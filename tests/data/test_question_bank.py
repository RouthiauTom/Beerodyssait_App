"""Contrôles du CSV éditorial et du compilateur, sans accès au livre local."""
import copy
import csv
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('question_compiler', ROOT / 'scripts/create-questions.py')
compiler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compiler)


class QuestionBankTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with compiler.DEFAULT_CSV.open(encoding='utf-8-sig', newline='') as handle:
            reader = csv.DictReader(handle)
            cls.fields, cls.rows = reader.fieldnames, list(reader)

    def compile_rows(self, rows):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'questions.csv'
            with path.open('w', encoding='utf-8-sig', newline='') as handle:
                writer = csv.DictWriter(handle, fieldnames=self.fields)
                writer.writeheader()
                writer.writerows(rows)
            return compiler.compile_bank(path)

    def test_csv_matches_shipped_json_and_preserves_identifiers(self):
        compiled = compiler.compile_bank(compiler.DEFAULT_CSV)
        actual = json.loads((ROOT / 'data/questions.json').read_text(encoding='utf-8'))
        self.assertEqual(compiled, actual)
        self.assertEqual([q['id'] for q in actual['questions']], list(range(1, 221)))
        # Le préfixe ajouté dans le CSV fourni doit se retrouver dans le jeu.
        self.assertTrue(actual['questions'][3]['translations']['fr']['question'].startswith('Vrai ou Faux ?'))

    def test_all_120_additions_have_bilingual_corrections_and_book_locations(self):
        bank = compiler.compile_bank(compiler.DEFAULT_CSV)
        new = [q for q in bank['questions'] if q['id'] > 100]
        self.assertEqual(len(new), 120)
        for question in new:
            ref = question['provenance']['reference']
            self.assertEqual(ref['isbn'], '9782412080061')
            self.assertTrue(ref['chapter'])
            self.assertTrue(ref['section'])
            self.assertRegex(ref['locator'], r'^OEBPS/chap\d{3}\.xhtml#')
            for language in ['fr', 'en']:
                self.assertGreater(len(question['translations'][language]['expectedAnswer']), 30)
        for category in range(1, 5):
            for level in range(1, 4):
                self.assertEqual(sum(q['categoryId'] == category and q['difficulty'] == level for q in new), 8)

    def test_uppercase_spreadsheet_booleans_are_normalized(self):
        rows = copy.deepcopy(self.rows)
        rows[3]['correctChoiceIds'] = 'TRUE'
        self.assertEqual(self.compile_rows(rows)['questions'][3]['correctChoiceIds'], ['true'])

    def test_duplicate_ids_and_question_texts_are_rejected(self):
        for field in ['id', 'question_fr', 'question_en']:
            with self.subTest(field=field):
                rows = copy.deepcopy(self.rows)
                rows[1][field] = rows[0][field]
                with self.assertRaises(ValueError):
                    self.compile_rows(rows)

    def test_missing_translations_and_invalid_correct_choices_are_rejected(self):
        for field, value in [('question_en', ''), ('expectedAnswer_fr', ''), ('correctChoiceIds', 'Z')]:
            with self.subTest(field=field):
                rows = copy.deepcopy(self.rows)
                rows[0][field] = value
                with self.assertRaises(ValueError):
                    self.compile_rows(rows)

    def test_book_citations_cannot_silently_lose_their_locator(self):
        rows = copy.deepcopy(self.rows)
        rows[100]['source_locator'] = ''
        with self.assertRaisesRegex(ValueError, 'Référence de livre incomplète'):
            self.compile_rows(rows)

    def test_categories_cannot_fall_back_to_unrelated_questions(self):
        rows = copy.deepcopy(self.rows)
        rows[100]['categoryId'] = '5'
        with self.assertRaises(ValueError):
            self.compile_rows(rows)
        with self.assertRaisesRegex(ValueError, 'Filtre vide'):
            self.compile_rows([r for r in self.rows if not (r['categoryId'] == '1' and r['difficulty'] == '1')])

    def test_check_mode_is_read_only(self):
        before = (ROOT / 'data/questions.json').read_bytes()
        result = subprocess.run([sys.executable, '-B', str(ROOT / 'scripts/create-questions.py'), '--check'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((ROOT / 'data/questions.json').read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
