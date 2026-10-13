"""Compare les références source en lecture seule au manifeste de l’audit."""
from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parent.parent
source=root.parent/'Vinodyssait_App'
manifest=json.loads((root/'docs/integrite-source.json').read_text())
changed=[name for name,expected in manifest.items() if not (source/name).is_file() or hashlib.sha256((source/name).read_bytes()).hexdigest()!=expected]
if changed:
 print('Empreintes différentes : '+', '.join(changed));sys.exit(1)
print(f'PASS : {len(manifest)} fichiers source inchangés, archive comprise.')
