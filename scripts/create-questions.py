"""Compile la banque originale FR/EN ; chaque ligne éditoriale porte sa référence."""
from pathlib import Path
import json
BASE='https://styles.bjcp.org/bjcp-2021-beer/'
S={
 'pils':BASE+'3/3b-czech-premium-pale-lager','wheat':BASE+'10/10a-weissbier',
 'porter':BASE+'13/13c-english-porter','stout':BASE+'15/15b-irish-stout',
 'ipa':BASE+'21/21a-american-ipa','wit':BASE+'24/24a-witbier',
 'saison':BASE+'25/25b-saison','lambic':BASE+'23/23d-lambic',
 'gueuze':BASE+'23/23e-gueuze','garde':BASE+'24/24c-biere-de-garde',
 'golden':BASE+'12/12a-british-golden-ale','bitter':BASE+'11/11a-ordinary-bitter',
 'kolsch':BASE+'5/5b-kolsch','fest':BASE+'4/4b-festbier','scot':BASE+'14/14a-scottish-light',
 'light':BASE+'1/1a-american-light-lager',
 'sahti':'https://www.bjcp.org/style/2015/27/27A/historical-beer-sahti/',
 'grod':'https://www.bjcp.org/style/2015/27/27A/historical-beer-piwo-grodziskie/',
 'unesco':'https://ich.unesco.org/en/RL/beer-culture-in-belgium-01062',
 'ingredients':'https://www.brewersassociation.org/online-courses/beer-ingredients/',
 'process':'https://www.homebrewersassociation.org/wp-content/uploads/Ingredient-Signs.pdf',
}
# catégorie | niveau (ou escale si catégorie 5) | source | format | question fr | question en | réponse fr | réponse en | distracteurs fr | distracteurs en
ROWS='''
1|1|pils|qcm|Dans quelle ville est née la Pilsner Urquell ?|In which city was Pilsner Urquell first brewed?|Plzeň|Plzeň|Dublin;Lille|Dublin;Lille
1|1|porter|qcm|Quel style sombre apparaît à Londres au début du XVIIIe siècle ?|Which dark style emerged in London in the early 18th century?|Le porter|Porter|La witbier;La saison|Witbier;Saison
1|1|unesco|qcm|Quel pays a vu sa culture de la bière inscrite à l’UNESCO en 2016 ?|Which country's beer culture was inscribed by UNESCO in 2016?|La Belgique|Belgium|Le Canada;Le Portugal|Canada;Portugal
1|1|garde|tf|La bière de garde possède des racines dans le nord de la France.|Bière de garde has roots in northern France.|true|true||
1|1|scot|qcm|Les appellations brassicoles en « shillings » appartiennent à quelle tradition ?|Beer names expressed in “shillings” belong to which tradition?|Écossaise|Scottish|Japonaise;Mexicaine|Japanese;Mexican
1|2|pils|qcm|En quelle année la Pilsner Urquell a-t-elle été brassée pour la première fois ?|In which year was Pilsner Urquell first brewed?|1842|1842|1742;1942|1742;1942
1|2|wheat|qcm|Qui détenait autrefois un monopole sur la bière de blé en Bavière ?|Who once held a monopoly on wheat beer in Bavaria?|La royauté bavaroise|Bavarian royalty|La royauté irlandaise;La royauté suédoise|Irish royalty;Swedish royalty
1|2|ipa|qcm|Quelle bière de 1975 est souvent citée dans l’histoire de l’IPA américaine moderne ?|Which 1975 beer is often cited in the history of modern American IPA?|Anchor Liberty Ale|Anchor Liberty Ale|Saison Dupont;Pilsner Urquell|Saison Dupont;Pilsner Urquell
1|2|garde|open|Pourquoi brassait-on historiquement la bière de garde au début du printemps ?|Why was bière de garde historically brewed in early spring?|Pour la conserver en cave froide jusqu’aux mois plus chauds.|To keep it in cold cellars for the warmer months.||
1|2|porter|tf|Les stouts étaient à l’origine appelés « stout porters ».|Stouts were originally called “stout porters”.|true|true||
1|3|pils|qcm|Quel brasseur est associé au premier brassin de Pilsner Urquell ?|Which brewer is credited with the first Pilsner Urquell brew?|Josef Groll|Josef Groll|Louis Pasteur;Arthur Guinness|Louis Pasteur;Arthur Guinness
1|3|porter|qcm|Quelle innovation de 1817 a influencé l’évolution du porter ?|Which 1817 innovation influenced the evolution of porter?|Le malt noir|Black malt|La canette en aluminium;Le houblon Cascade|The aluminium can;Cascade hops
1|3|wheat|qcm|Quelle maison commence à produire sa weissbier ambrée en 1872 ?|Which producer began making its amber weissbier in 1872?|Schneider|Schneider|Anchor;Dupont|Anchor;Dupont
1|3|scot|tf|Les styles écossais modernes en shillings ont pris forme surtout après la Seconde Guerre mondiale.|Modern Scottish shilling styles took shape mainly after World War II.|true|true||
1|3|light|qcm|Quel brasseur a produit une version moderne de light lager en 1967 selon le BJCP ?|Which brewer produced a modern light lager in 1967 according to the BJCP?|Rheingold|Rheingold|Cantillon;Schneider|Cantillon;Schneider
2|1|wit|qcm|À quel pays associe-t-on la witbier ?|Which country is associated with witbier?|La Belgique|Belgium|Le Pérou;La Finlande|Peru;Finland
2|1|wheat|qcm|La weissbier est une tradition de quel pays ?|Weissbier is a tradition from which country?|L’Allemagne|Germany|L’Argentine;L’Irlande|Argentina;Ireland
2|1|stout|qcm|Quel pays donne son nom à l’Irish stout ?|Which country gives Irish stout its name?|L’Irlande|Ireland|L’Islande;L’Italie|Iceland;Italy
2|1|grod|qcm|Le piwo grodziskie est originaire de quel pays ?|Which country is piwo grodziskie from?|La Pologne|Poland|La Grèce;Le Japon|Greece;Japan
2|1|sahti|qcm|De quel pays vient le sahti ?|Which country is sahti from?|La Finlande|Finland|Le Brésil;L’Espagne|Brazil;Spain
2|2|saison|qcm|Quelle région belge est le berceau de la saison ?|Which Belgian region is the home of saison?|La Wallonie|Wallonia|La Bavière;La Toscane|Bavaria;Tuscany
2|2|kolsch|qcm|À quelle ville allemande la Kölsch est-elle liée ?|Which German city is linked to Kölsch?|Cologne|Cologne|Berlin;Hambourg|Berlin;Hamburg
2|2|lambic|qcm|Le lambic traditionnel est lié aux environs de quelle ville ?|Traditional lambic is linked to the area around which city?|Bruxelles|Brussels|Madrid;Oslo|Madrid;Oslo
2|2|garde|qcm|Quelle ville française se trouve dans la région d’origine de la bière de garde ?|Which French city lies in the original region of bière de garde?|Lille|Lille|Nice;Marseille|Nice;Marseille
2|2|pils|tf|La ville de Plzeň se situe en Tchéquie.|The city of Plzeň is in Czechia.|true|true||
2|3|grod|qcm|Quel nom allemand désigne aussi le grodziskie ?|Which German name also refers to grodziskie?|Grätzer|Grätzer|Doppelbock;Kölsch|Doppelbock;Kölsch
2|3|sahti|qcm|Quel pays voisin possède une tradition similaire au sahti, appelée koduolu ?|Which neighbouring country has a sahti-like tradition called koduolu?|L’Estonie|Estonia|La Suisse;La Belgique|Switzerland;Belgium
2|3|fest|qcm|Quel festival munichois est associé à la Festbier moderne ?|Which Munich festival is associated with modern Festbier?|L’Oktoberfest|Oktoberfest|La Saint-Patrick;Le carnaval de Venise|St Patrick’s Day;Venice Carnival
2|3|bitter|tf|L’Ordinary Bitter appartient aux traditions brassicoles britanniques.|Ordinary Bitter belongs to British brewing traditions.|true|true||
2|3|scot|open|Cite le pays d’origine des Scottish ales et leur orientation gustative dominante.|Name the home of Scottish ales and their main flavour emphasis.|L’Écosse ; le malt, plutôt que le houblon.|Scotland; malt rather than hops.||
3|1|stout|qcm|Quel arôme évoque souvent un Irish stout ?|Which aroma is often associated with Irish stout?|Le café torréfié|Roasted coffee|Le concombre;La pêche au sirop|Cucumber;Peach syrup
3|1|wheat|qcm|Quel duo aromatique est classique dans une weissbier ?|Which aroma pair is classic in weissbier?|Banane et clou de girofle|Banana and clove|Menthe et chocolat;Pomme et cannelle|Mint and chocolate;Apple and cinnamon
3|1|ipa|qcm|Quel ingrédient est au premier plan dans une American IPA ?|Which ingredient takes centre stage in American IPA?|Le houblon|Hops|Le café;Le lait|Coffee;Milk
3|1|wit|tf|Une witbier est généralement pâle et trouble.|Witbier is generally pale and hazy.|true|true||
3|1|porter|qcm|Quelle couleur correspond habituellement à un English porter ?|What colour is typical of English porter?|Brun à brun foncé|Brown to dark brown|Rose vif;Jaune très pâle|Bright pink;Very pale yellow
3|2|gueuze|qcm|Par rapport au lambic traditionnel non pétillant, la gueuze est généralement…|Compared with traditional still lambic, gueuze is generally…|Très pétillante|Highly carbonated|Sans bulles;Crémeuse comme du lait|Still;Creamy like milk
3|2|saison|qcm|Comment décrit-on la finale d’une saison classique ?|How is the finish of a classic saison described?|Très sèche|Very dry|Sirupeuse;Salée|Syrupy;Salty
3|2|scot|tf|Un goût de fumée de tourbe est caractéristique de la Scottish Light traditionnelle.|Peat smoke is characteristic of traditional Scottish Light.|false|false||
3|2|garde|qcm|Quel équilibre domine une bière de garde ?|Which balance dominates bière de garde?|Le malt|Malt|Une acidité vinaigrée;Une amertume extrême|Vinegary acidity;Extreme bitterness
3|2|light|qcm|Quel corps est typique d’une American Light Lager ?|What body is typical of American Light Lager?|Très léger|Very light|Très épais;Visqueux|Very thick;Viscous
3|3|wheat|qcm|Que désigne une version « Kristall » de weissbier ?|What does a “Kristall” weissbier version mean?|Une version filtrée et limpide|A filtered, clear version|Une version glacée;Une version au sel|A frozen version;A salted version
3|3|gueuze|qcm|Quelle mention indique une gueuze de tradition ancienne ?|Which wording indicates a traditional gueuze?|Oude ou vieille|Oude or vieille|Imperial only;Milk only|Imperial only;Milk only
3|3|grod|tf|Le grodziskie traditionnel doit présenter une acidité prononcée.|Traditional grodziskie should have pronounced sourness.|false|false||
3|3|stout|open|Pourquoi un stout servi à l’azote peut-il paraître plus crémeux que sa version en bouteille ?|Why can a nitrogen-served stout seem creamier than its bottled version?|Le service avec un mélange gazeux à l’azote donne une mousse serrée et une texture crémeuse.|Nitrogen mixed-gas dispense creates a tight head and creamy texture.||
3|3|pils|qcm|Comparée à une German Pils, une Czech Premium Pale Lager est généralement…|Compared with German Pils, Czech Premium Pale Lager is generally…|Plus riche en malt et en corps|Richer in malt and body|Dénuée de malt;Toujours noire|Devoid of malt;Always black
4|1|ingredients|qcm|Quelle céréale maltée est un ingrédient classique de la bière ?|Which malted cereal is a classic beer ingredient?|L’orge|Barley|Le quinoa uniquement;Le riz uniquement|Only quinoa;Only rice
4|1|process|qcm|Quel ingrédient transforme les sucres en alcool et en gaz carbonique ?|Which ingredient converts sugars into alcohol and carbon dioxide?|La levure|Yeast|Le houblon;Le sel|Hops;Salt
4|1|process|qcm|Quel ingrédient apporte notamment de l’amertume ?|Which ingredient notably adds bitterness?|Le houblon|Hops|L’eau pure;La levure uniquement|Pure water;Yeast alone
4|1|ingredients|open|Nomme les quatre ingrédients classiques de la bière.|Name the four classic beer ingredients.|Eau, malt d’orge, houblon et levure.|Water, barley malt, hops and yeast.||
4|1|process|tf|Des fruits ou des épices peuvent entrer dans une recette de bière.|Fruit or spices can be included in a beer recipe.|true|true||
4|2|process|qcm|Quel est le nom du liquide sucré obtenu lors du brassage, avant fermentation ?|What is the sweet brewing liquid called before fermentation?|Le moût|Wort|Le petit-lait;Le vinaigre|Whey;Vinegar
4|2|process|qcm|Lors de l’empâtage, on mélange le malt concassé avec…|During mashing, crushed malt is mixed with…|De l’eau chaude|Hot water|De l’huile;Du gaz carbonique|Oil;Carbon dioxide
4|2|wit|qcm|Quelle épice est fréquemment utilisée dans la witbier ?|Which spice is frequently used in witbier?|La coriandre|Coriander|Le paprika fumé;Le safran uniquement|Smoked paprika;Only saffron
4|2|grod|qcm|Quel malt caractérise le grodziskie traditionnel ?|Which malt defines traditional grodziskie?|Du blé fumé au chêne|Oak-smoked wheat|De l’orge tourbée;Du riz grillé|Peat-smoked barley;Toasted rice
4|2|lambic|qcm|Quel type de fermentation est associé au lambic traditionnel ?|What fermentation type is associated with traditional lambic?|Spontanée|Spontaneous|Sans microorganismes;Uniquement lactée|Without microorganisms;Only milk fermentation
4|3|gueuze|qcm|Quels âges de lambics sont traditionnellement assemblés pour une gueuze ?|Which lambic ages are traditionally blended for gueuze?|Un, deux et trois ans|One, two and three years|Dix, vingt et trente ans;Une, deux et trois heures|Ten, twenty and thirty years;One, two and three hours
4|3|wheat|qcm|Quelle proportion minimale de blé malté indique le BJCP pour une weissbier ?|What minimum malted wheat proportion does BJCP give for weissbier?|La moitié du mélange de grains|Half of the grain bill|Un centième;Aucun blé|One hundredth;No wheat
4|3|sahti|qcm|Quelle plante peut servir de lit de filtration dans le sahti traditionnel ?|Which plant may form the filter bed in traditional sahti?|Le genévrier|Juniper|La lavande;Le bambou|Lavender;Bamboo
4|3|garde|tf|La bière de garde peut employer une levure de lager ou d’ale, puis une longue garde au froid.|Bière de garde may use lager or ale yeast, followed by long cold conditioning.|true|true||
4|3|pils|qcm|Une eau pauvre en sulfates et carbonates contribue à quel profil dans une lager tchèque ?|Low-sulfate, low-carbonate water contributes to which profile in Czech lager?|Une amertume douce et arrondie|Soft, rounded bitterness|Une acidité vinaigrée;Un goût de fumée|Vinegary acidity;Smoky flavour
5|1|unesco|qcm|Lors de cette escale belge, quel organisme a reconnu la culture brassicole en 2016 ?|At this Belgian stop, which organisation recognised beer culture in 2016?|L’UNESCO|UNESCO|La NASA;La FIFA|NASA;FIFA
5|1|lambic|qcm|À Bruxelles, quelle famille de bières est associée à la fermentation spontanée ?|In Brussels, which beer family is associated with spontaneous fermentation?|Le lambic|Lambic|Le porter anglais;La light lager|English porter;Light lager
5|1|wit|open|Cite une épice et un agrume classiques de la witbier belge.|Name a classic spice and citrus ingredient in Belgian witbier.|Coriandre et écorce d’orange.|Coriander and orange peel.||
5|1|saison|tf|La saison belge possède des racines rurales en Wallonie.|Belgian saison has rural roots in Wallonia.|true|true||
5|2|wheat|qcm|En Allemagne, que signifie la famille « Weissbier » dans le contexte brassicole ?|In Germany, what beer family does “Weissbier” refer to?|La bière de blé|Wheat beer|La bière de riz;Le cidre|Rice beer;Cider
5|2|kolsch|qcm|Quelle bière locale trouve-t-on à Cologne ?|Which local beer is associated with Cologne?|La Kölsch|Kölsch|Le sahti;Le lambic|Sahti;Lambic
5|2|fest|tf|La Festbier moderne est typiquement une lager blonde de l’Oktoberfest.|Modern Festbier is typically a pale Oktoberfest lager.|true|true||
5|2|wheat|open|En Bavière, quels deux arômes de levure évoquent une hefeweizen ?|In Bavaria, which two yeast aromas suggest a hefeweizen?|Banane et clou de girofle.|Banana and clove.||
5|3|pils|qcm|En Tchéquie, quel nom de ville a donné « pilsner » ?|In Czechia, which city name gave us “pilsner”?|Plzeň|Plzeň|Brno;Ostrava|Brno;Ostrava
5|3|pils|tf|Pilsner Urquell a été brassée pour la première fois en 1842.|Pilsner Urquell was first brewed in 1842.|true|true||
5|3|pils|open|Nomme le brasseur bavarois lié à la naissance de Pilsner Urquell.|Name the Bavarian brewer linked to the birth of Pilsner Urquell.|Josef Groll.|Josef Groll.||
5|3|pils|qcm|Dans la tradition tchèque, « kvasnicové » désigne une bière…|In Czech brewing, “kvasnicové” refers to a beer…|Avec un ajout de levure ou de moût en fermentation|With added yeast or fermenting wort|Exclusivement sans alcool;Toujours noire|Exclusively alcohol-free;Always black
5|4|porter|qcm|À Londres, quel style est l’ancêtre des stouts ?|In London, which style is the ancestor of stouts?|Le porter|Porter|La witbier;La saison|Witbier;Saison
5|4|bitter|tf|Une Ordinary Bitter est une ale britannique.|Ordinary Bitter is a British ale.|true|true||
5|4|golden|qcm|Quelle teinte caractérise la British Golden Ale ?|What colour characterises British Golden Ale?|Dorée|Golden|Noire opaque;Violette|Opaque black;Purple
5|4|porter|open|Donne un arôme de malt classique du porter anglais.|Name a classic malt aroma in English porter.|Chocolat, biscuit, pain grillé ou caramel sont acceptés.|Chocolate, biscuit, toast or caramel are acceptable.||
5|5|stout|qcm|À Dublin, quel style sombre est emblématique ?|In Dublin, which dark style is emblematic?|L’Irish stout|Irish stout|La Kölsch;La witbier|Kölsch;Witbier
5|5|stout|tf|Un Irish stout peut évoquer le café sans contenir de café ajouté.|Irish stout can suggest coffee without added coffee.|true|true||
5|5|stout|open|Quel grain torréfié est caractéristique des stouts de Dublin ?|Which roasted grain is characteristic of Dublin stouts?|L’orge torréfiée.|Roasted barley.||
5|5|stout|qcm|Le service à quel gaz contribue à la texture crémeuse des stouts pression ?|Dispense with which gas contributes to creamy draught stout texture?|L’azote|Nitrogen|L’oxygène pur;L’hydrogène|Pure oxygen;Hydrogen
5|6|garde|qcm|Quelle famille brassicole est associée au nord de la France ?|Which beer family is associated with northern France?|La bière de garde|Bière de garde|Le sahti;La Kölsch|Sahti;Kölsch
5|6|garde|tf|La bière de garde existe en versions blonde, ambrée et brune.|Bière de garde comes in blond, amber and brown versions.|true|true||
5|6|garde|open|Quel est le sens du nom « bière de garde » ?|What does the name “bière de garde” mean?|Une bière destinée à être conservée.|A beer intended for keeping.||
5|6|garde|qcm|Laquelle est une référence française de bière de garde ambrée ?|Which is a French example of amber bière de garde?|Jenlain Ambrée|Jenlain Ambrée|Pilsner Urquell;Anchor Liberty Ale|Pilsner Urquell;Anchor Liberty Ale
5|7|ipa|qcm|Aux États-Unis, quelle variété de houblon est liée à Anchor Liberty Ale de 1975 ?|In the United States, which hop variety is linked to the 1975 Anchor Liberty Ale?|Cascade|Cascade|Saaz uniquement;Fuggle uniquement|Only Saaz;Only Fuggle
5|7|ipa|tf|Une American IPA met généralement le houblon au premier plan.|American IPA generally puts hops in the foreground.|true|true||
5|7|light|qcm|Quel ajout de céréale peut entrer dans une American Light Lager ?|Which cereal adjunct can be used in American Light Lager?|Le riz ou le maïs|Rice or corn|Le café uniquement;Le cacao uniquement|Only coffee;Only cocoa
5|7|ipa|open|Cite deux familles d’arômes de houblon possibles dans une American IPA.|Name two possible hop aroma families in American IPA.|Agrumes, pin, résine, fruits tropicaux, fleurs ou épices : deux suffisent.|Citrus, pine, resin, tropical fruit, flowers or spice: any two.||
5|8|scot|qcm|Quel ingrédient domine généralement l’équilibre d’une Scottish Light ?|Which ingredient generally dominates Scottish Light's balance?|Le malt|Malt|Le citron;Le houblon très intense|Lemon;Very intense hops
5|8|scot|tf|Le malt fumé à la tourbe est obligatoire dans une Scottish Light.|Peat-smoked malt is mandatory in Scottish Light.|false|false||
5|8|scot|open|Cite deux notes gustatives typiques d’une Scottish Light.|Name two typical Scottish Light flavour notes.|Caramel, toffee, pain grillé ou fruits : deux suffisent.|Caramel, toffee, toast or fruit: any two.||
5|8|scot|qcm|La Scottish Light appartient à quelle famille de fermentation ?|Scottish Light belongs to which fermentation family?|Les ales|Ales|Les lambics;Les cidres|Lambics;Ciders
5|9|grod|qcm|Quelle céréale est au cœur du grodziskie polonais traditionnel ?|Which cereal is central to traditional Polish grodziskie?|Le blé|Wheat|Le riz;Le sorgho|Rice;Sorghum
5|9|grod|tf|Le malt du grodziskie traditionnel est fumé au bois de chêne.|Traditional grodziskie malt is smoked over oak.|true|true||
5|9|grod|open|Quel nom allemand est aussi donné au piwo grodziskie ?|What German name is also used for piwo grodziskie?|Grätzer.|Grätzer.||
5|9|grod|qcm|Comment décrit-on la carbonatation du grodziskie traditionnel ?|How is traditional grodziskie's carbonation described?|Élevée|High|Absente;Toujours très faible|Absent;Always very low
5|10|sahti|qcm|Quelle plante marque le sahti finlandais traditionnel ?|Which plant marks traditional Finnish sahti?|Le genévrier|Juniper|Le houblon seul;La menthe|Hops alone;Mint
5|10|sahti|tf|Le sahti traditionnel est souvent peu gazéifié.|Traditional sahti often has low carbonation.|true|true||
5|10|sahti|open|Cite une céréale autre que l’orge souvent utilisée dans le sahti.|Name a cereal other than barley often used in sahti.|Le seigle.|Rye.||
5|10|sahti|qcm|Quelle levure peut être utilisée dans le sahti traditionnel ?|Which yeast may be used in traditional sahti?|La levure de boulanger|Baker’s yeast|Aucune levure;Uniquement des bactéries lactiques|No yeast;Only lactic acid bacteria
'''
questions=[]
for line in ROWS.strip().splitlines():
 cat,level,source,kind,fr,en,afr,aen,df,de=line.split('|')
 cat,level=int(cat),int(level);id=len(questions)+1
 q={'id':id,'categoryId':cat,'regionId':level if cat==5 else None,'difficulty':None if cat==5 else level,'type':{'tf':'true_false'}.get(kind,kind),'correctChoiceIds':[], 'translations':{},'sources':[S[source]],'provenance':{'status':'original_bilingual_source_checked','checkedOn':'2026-10-13'}}
 if kind=='tf': q['correctChoiceIds']=[afr]
 if kind=='qcm':q['correctChoiceIds']=['ABC'[(id-1)%3]]
 for lang,text,ans,distractors in [('fr',fr,afr,df),('en',en,aen,de)]:
  choices=[]
  if kind=='qcm':
   options=distractors.split(';');options.insert((id-1)%3,ans);choices=[{'id':'ABC'[i],'text':v} for i,v in enumerate(options)]
  expected=({'fr':{'true':'Vrai.','false':'Faux.'},'en':{'true':'True.','false':'False.'}}[lang][ans] if kind=='tf' else ans)
  q['translations'][lang]={'question':text,'expectedAnswer':expected,'choices':choices}
 questions.append(q)
EXPLANATIONS={
38:('La Scottish Light est maltée ; la fumée de tourbe ne fait pas partie du profil traditionnel.','Scottish Light is malt-led; peat smoke is outside its traditional profile.'),
43:('Le grodziskie traditionnel est fumé, sec et non acide.','Traditional grodziskie is smoky, dry and not sour.'),
90:('Le malt fumé à la tourbe ne fait pas partie de la Scottish Light traditionnelle.','Peat-smoked malt is not part of traditional Scottish Light.')}
for q in questions:
 if q['type']=='true_false':
  for lang in ['fr','en']:
   explanation=EXPLANATIONS.get(q['id'])
   text=explanation[0 if lang=='fr' else 1] if explanation else q['translations'][lang]['question']
   q['translations'][lang]['expectedAnswer']+=' '+text
Path('data/questions.json').write_text(json.dumps({'schemaVersion':1,'edition':'Beerodys’Sait — banque originale v1','questions':questions},ensure_ascii=False,indent=2)+'\n')
Path('data/question-sources.json').write_text(json.dumps(S,ensure_ascii=False,indent=2)+'\n')
print(f'{len(questions)} questions originales bilingues compilées.')
