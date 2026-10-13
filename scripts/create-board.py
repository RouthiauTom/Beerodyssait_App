from pathlib import Path
import json
p=Path('data/board.json'); old=json.loads(p.read_text())
regions=[{'id':i+1,'fr':fr,'en':en,'code':code} for i,(fr,en,code) in enumerate([('Belgique','Belgium','BE'),('Allemagne','Germany','DE'),('Tchéquie','Czechia','CZ'),('Angleterre','England','EN'),('Irlande','Ireland','IE'),('France','France','FR'),('États-Unis','United States','US'),('Écosse','Scotland','SC'),('Pologne','Poland','PL'),('Finlande','Finland','FI')])]
spaces=[]
for s in old['spaces']:
 n=s['id']-1; row=n//10; col=n%10 if row%2==0 else 9-n%10
 spaces.append({'id':s['id'],'order':s['id'],'categoryId':s['categoryId'],'regionId':s['regionId'],'x':round((95+col*90)/1000,3),'y':round((235+row*115)/1000,3)})
board={'schemaVersion':1,'status':'beer_adaptation_of_validated_rules','spaceCount':60,'startSpaceId':0,'finishSpaceId':60,'start':{'id':0,'x':.095,'y':.15},'spaces':spaces,'effects':old['effects']}
p.write_text(json.dumps(board,ensure_ascii=False,indent=2)+'\n')
Path('data/regions.json').write_text(json.dumps(regions,ensure_ascii=False,indent=2)+'\n')
colors={1:'#4f718d',2:'#416851',3:'#956731',4:'#a7503c',5:'#173e32'}
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><defs><pattern id="grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#dfd4bc" stroke-width=".5"/></pattern><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#ad761e"/></marker></defs><rect width="1000" height="1000" fill="#f4edda"/><rect width="1000" height="1000" fill="url(#grid)"/><g fill="#e8dfc7"><path d="M130 120l60-25 80 10 25 35-40 25 15 55-45 35-40-15-15-60-50-20zM230 290l60 15 30 50-20 90-40 60-30-60-10-90zM445 120l55-20 40 25 50-10 25 20-25 40-60-10-10 50-35 25-35-40zM520 245l75-20 35 60-20 100-45 40-35-70zM615 130l80-25 135 30 40 55-65 40-65-30-40 55-50-10-20-65zM780 350l70-20 50 40-20 35-70-5z"/></g><text x="50" y="60" fill="#173e32" font-family="Georgia,serif" font-size="36" font-weight="bold">L’ODYSSÉE BRASSICOLE / THE BEER ODYSSEY</text><text x="50" y="94" fill="#73634b" font-family="sans-serif" font-size="15" letter-spacing="3">10 ESCALES · 60 CASES · UN TOUR DU MONDE / A WORLD TOUR</text>']
points=[(95,150)]+[(round(s['x']*1000),round(s['y']*1000)) for s in spaces]
svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in points)+'" fill="none" stroke="#d7c7a0" stroke-width="8" stroke-linejoin="round"/>')
for effect in board['effects']:
 a=spaces[effect['fromSpaceId']-1];b=spaces[effect['toSpaceId']-1];x,y=a['x']*1000,a['y']*1000;xx,yy=b['x']*1000,b['y']*1000
 svg.append(f'<path d="M{x} {y}Q{(x+xx)/2+35} {(y+yy)/2} {xx} {yy}" fill="none" stroke="#ad761e" stroke-width="4" stroke-dasharray="7 5" marker-end="url(#arrow)"/>')
svg.append('<circle cx="95" cy="150" r="26" fill="#fffaf0" stroke="#173e32" stroke-width="2"/><text x="95" y="156" text-anchor="middle" fill="#173e32" font-family="sans-serif" font-size="14">GO</text><text x="135" y="155" fill="#73634b" font-family="sans-serif" font-size="13">DÉPART / START</text>')
for s in spaces:
 x,y=s['x']*1000,s['y']*1000; c=colors[s['categoryId']];r=27 if s['regionId'] else 20
 svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" stroke="#fffaf0" stroke-width="3"/><text x="{x}" y="{y+5}" text-anchor="middle" fill="#fffaf0" font-family="sans-serif" font-size="15" font-weight="bold">{s["id"]}</text>')
 if s['regionId']:
  reg=regions[s['regionId']-1]
  svg.append(f'<rect x="{x-43}" y="{y+30}" width="86" height="22" rx="11" fill="#fffaf0"/><text x="{x}" y="{y+45}" text-anchor="middle" fill="#173e32" font-family="sans-serif" font-size="11" font-weight="bold">{reg["code"]} · {reg["fr"]}</text>')
 if s['id'] in [4,27,56]:
  svg.append(f'<text x="{x}" y="{y-29}" text-anchor="middle" fill="#90621c" font-family="sans-serif" font-size="13" font-weight="bold">{("↗" if s["id"]!=56 else "↘")}</text>')
svg.append('<text x="50" y="905" fill="#173e32" font-family="Georgia,serif" font-size="24">Suivez votre curiosité. / Follow your curiosity.</text>')
for i,(fr,en) in enumerate([('Histoire','History'),('Géographie','Geography'),('Styles &amp; arômes','Styles &amp; aromas'),('Brassage','Brewing'),('Escales','Stops')]):
 x=50+i*185;svg.append(f'<circle cx="{x+8}" cy="946" r="8" fill="{colors[i+1]}"/><text x="{x+24}" y="950" fill="#73634b" font-family="sans-serif" font-size="12">{fr} / {en}</text>')
svg.append('</svg>');Path('public/assets/plateau.svg').write_text(''.join(svg))
# Versions localisées : le tracé et les coordonnées sont identiques.
original=''.join(svg)
for language in ['fr','en']:
 localized=original.replace('L’ODYSSÉE BRASSICOLE / THE BEER ODYSSEY','L’ODYSSÉE BRASSICOLE' if language=='fr' else 'THE BEER ODYSSEY')
 localized=localized.replace('10 ESCALES · 60 CASES · UN TOUR DU MONDE / A WORLD TOUR','10 ESCALES · 60 CASES · UN TOUR DU MONDE' if language=='fr' else '10 STOPS · 60 SPACES · A WORLD TOUR')
 localized=localized.replace('DÉPART / START','DÉPART' if language=='fr' else 'START').replace('Suivez votre curiosité. / Follow your curiosity.','Suivez votre curiosité.' if language=='fr' else 'Follow your curiosity.')
 for reg in regions:localized=localized.replace(reg['code']+' · '+reg['fr'],reg['code']+' · '+reg[language])
 for fr,en in [('Histoire','History'),('Géographie','Geography'),('Styles &amp; arômes','Styles &amp; aromas'),('Brassage','Brewing'),('Escales','Stops')]:localized=localized.replace(fr+' / '+en,fr if language=='fr' else en)
 Path(f'public/assets/plateau-{language}.svg').write_text(localized)
logo='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 130"><g transform="translate(12 15)" fill="none" stroke="#b47b22" stroke-width="4"><path d="M42 10C0 15 0 70 42 100C84 70 84 15 42 10Z" fill="#e8bc61"/><path d="M42 13V95M10 40L42 60L74 40M16 64L42 80L68 64M20 22L42 40L64 22" stroke="#173e32"/></g><text x="108" y="78" fill="#173e32" font-family="Georgia,serif" font-weight="bold" font-size="57">Beerodys’Sait</text><text x="112" y="109" fill="#73634b" font-family="sans-serif" font-size="13" letter-spacing="5">LE MONDE AU BOUT DU HOUBLON</text></svg>'''
Path('public/assets/logo.svg').write_text(logo)
icon='''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#173e32"/><g transform="translate(90 52) scale(4)" stroke="#173e32" stroke-width="3" fill="#e8bc61"><path d="M42 10C0 15 0 70 42 100C84 70 84 15 42 10Z"/><path d="M42 13V95M10 40L42 60L74 40M16 64L42 80L68 64M20 22L42 40L64 22" fill="none"/></g></svg>'''
Path('public/icons/icon.svg').write_text(icon)
print('Plateau et identité SVG créés ; 10 escales.')
