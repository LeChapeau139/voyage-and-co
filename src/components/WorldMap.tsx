'use client'

import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ISO 3166-1 numeric codes — French + English names, lowercase
const NAME_TO_CODE: Record<string, string> = {
  // Europe
  'france': '250',
  'espagne': '724', 'spain': '724',
  'italie': '380', 'italy': '380',
  'allemagne': '276', 'germany': '276',
  'portugal': '620',
  'grèce': '300', 'grece': '300', 'greece': '300',
  'pays-bas': '528', 'netherlands': '528', 'hollande': '528',
  'belgique': '56', 'belgium': '56',
  'suisse': '756', 'switzerland': '756',
  'autriche': '40', 'austria': '40',
  'royaume-uni': '826', 'united kingdom': '826', 'uk': '826', 'angleterre': '826', 'england': '826',
  'irlande': '372', 'ireland': '372',
  'ecosse': '826', 'écosse': '826', 'scotland': '826',
  'suede': '752', 'suède': '752', 'sweden': '752',
  'norvege': '578', 'norvège': '578', 'norway': '578',
  'danemark': '208', 'denmark': '208',
  'finlande': '246', 'finland': '246',
  'pologne': '616', 'poland': '616',
  'republique tcheque': '203', 'république tchèque': '203', 'czech republic': '203', 'czechia': '203',
  'hongrie': '348', 'hungary': '348',
  'roumanie': '642', 'romania': '642',
  'bulgarie': '100', 'bulgaria': '100',
  'croatie': '191', 'croatia': '191',
  'serbie': '688', 'serbia': '688',
  'slovenie': '705', 'slovénie': '705', 'slovenia': '705',
  'slovaquie': '703', 'slovakia': '703',
  'albanie': '8', 'albania': '8',
  'montenegro': '499', 'monténégro': '499',
  'bosnie-herzegovine': '70', 'bosnie': '70', 'bosnia': '70',
  'macedoine': '807', 'macédoine': '807', 'north macedonia': '807',
  'russie': '643', 'russia': '643',
  'ukraine': '804',
  'turquie': '792', 'turkey': '792', 'türkiye': '792',
  'islande': '352', 'iceland': '352',
  'luxembourg': '442',
  'malte': '470', 'malta': '470',
  'chypre': '196', 'cyprus': '196',
  'estonie': '233', 'estonia': '233',
  'lettonie': '428', 'latvia': '428',
  'lituanie': '440', 'lithuania': '440',
  'bielorussie': '112', 'biélorussie': '112', 'belarus': '112',
  'moldavie': '498', 'moldova': '498',
  'georgie': '268', 'géorgie': '268', 'georgia': '268',
  'armenie': '51', 'arménie': '51', 'armenia': '51',
  'azerbaidjan': '31', 'azerbaïdjan': '31', 'azerbaijan': '31',
  // Afrique du Nord
  'maroc': '504', 'morocco': '504',
  'algerie': '12', 'algérie': '12', 'algeria': '12',
  'tunisie': '788', 'tunisia': '788',
  'libye': '434', 'libya': '434',
  'egypte': '818', 'égypte': '818', 'egypt': '818',
  'soudan': '729', 'sudan': '729',
  // Afrique subsaharienne
  'senegal': '686', 'sénégal': '686',
  "cote d'ivoire": '384', "côte d'ivoire": '384', 'ivory coast': '384',
  'ghana': '288',
  'mali': '466',
  'niger': '562',
  'nigeria': '566',
  'cameroun': '120', 'cameroon': '120',
  'tchad': '140', 'chad': '140',
  'ethiopie': '231', 'éthiopie': '231', 'ethiopia': '231',
  'kenya': '404',
  'tanzanie': '834', 'tanzania': '834',
  'ouganda': '800', 'uganda': '800',
  'rwanda': '646',
  'mozambique': '508',
  'zimbabwe': '716',
  'zambie': '894', 'zambia': '894',
  'afrique du sud': '710', 'south africa': '710',
  'namibie': '516', 'namibia': '516',
  'botswana': '72',
  'madagascar': '450',
  'angola': '24',
  'congo': '180', 'rdc': '180', 'democratic republic of the congo': '180',
  'burkina faso': '854',
  'togo': '768',
  'benin': '204', 'bénin': '204',
  'gabon': '266',
  'ile maurice': '480', 'île maurice': '480', 'mauritius': '480',
  'liberia': '430',
  'sierra leone': '694',
  'guinee': '324', 'guinée': '324', 'guinea': '324',
  // Moyen-Orient
  'israel': '376', 'israël': '376',
  'jordanie': '400', 'jordan': '400',
  'liban': '422', 'lebanon': '422',
  'syrie': '760', 'syria': '760',
  'irak': '368', 'iraq': '368',
  'iran': '364',
  'arabie saoudite': '682', 'saudi arabia': '682',
  'emirats arabes unis': '784', 'émirats arabes unis': '784', 'uae': '784', 'emirats': '784', 'émirats': '784',
  'qatar': '634',
  'koweit': '414', 'koweït': '414', 'kuwait': '414',
  'oman': '512',
  'yemen': '887', 'yémen': '887',
  'bahrein': '48', 'bahreïn': '48', 'bahrain': '48',
  // Asie du Sud
  'inde': '356', 'india': '356',
  'pakistan': '586',
  'bangladesh': '50',
  'sri lanka': '144',
  'nepal': '524', 'népal': '524',
  'bhoutan': '64', 'bhutan': '64',
  'maldives': '462',
  'afghanistan': '4',
  // Asie centrale
  'ouzbekistan': '860', 'ouzbékistan': '860', 'uzbekistan': '860',
  'kazakhstan': '398',
  'kirghizstan': '417', 'kyrgyzstan': '417',
  'tadjikistan': '762', 'tajikistan': '762',
  'turkmenistan': '795', 'turkménistan': '795',
  // Asie de l'Est
  'chine': '156', 'china': '156',
  'japon': '392', 'japan': '392',
  'coree du sud': '410', 'corée du sud': '410', 'south korea': '410',
  'taiwan': '158',
  'mongolie': '496', 'mongolia': '496',
  // Asie du Sud-Est
  'thailande': '764', 'thaïlande': '764', 'thailand': '764',
  'vietnam': '704', 'viet nam': '704',
  'cambodge': '116', 'cambodia': '116',
  'laos': '418',
  'myanmar': '104', 'birmanie': '104', 'burma': '104',
  'indonesie': '360', 'indonésie': '360', 'indonesia': '360',
  'malaisie': '458', 'malaysia': '458',
  'philippines': '608',
  'singapour': '702', 'singapore': '702',
  'timor oriental': '626', 'east timor': '626',
  'brunei': '96',
  // Amérique du Nord
  'etats-unis': '840', 'états-unis': '840', 'usa': '840', 'united states': '840', 'amerique': '840',
  'canada': '124',
  'mexique': '484', 'mexico': '484',
  // Amérique centrale & Caraïbes
  'cuba': '192',
  'republique dominicaine': '214', 'république dominicaine': '214', 'dominican republic': '214',
  'haiti': '332', 'haïti': '332',
  'jamaique': '388', 'jamaïque': '388', 'jamaica': '388',
  'porto rico': '630', 'puerto rico': '630',
  'costa rica': '188',
  'guatemala': '320',
  'belize': '84',
  'honduras': '340',
  'salvador': '222', 'el salvador': '222',
  'nicaragua': '558',
  'panama': '591',
  // Amérique du Sud
  'colombie': '170', 'colombia': '170',
  'venezuela': '862',
  'perou': '604', 'pérou': '604', 'peru': '604',
  'bolivie': '68', 'bolivia': '68',
  'chili': '152', 'chile': '152',
  'argentine': '32', 'argentina': '32',
  'uruguay': '858',
  'paraguay': '600',
  'bresil': '76', 'brésil': '76', 'brazil': '76',
  'equateur': '218', 'équateur': '218', 'ecuador': '218',
  'guyana': '328',
  'suriname': '740',
  // Océanie
  'australie': '36', 'australia': '36',
  'nouvelle-zelande': '554', 'nouvelle-zélande': '554', 'new zealand': '554',
  'papouasie-nouvelle-guinee': '598', 'papua new guinea': '598',
  'fidji': '242', 'fiji': '242',
}

function resolveCode(name: string): string | undefined {
  return NAME_TO_CODE[name.toLowerCase().trim()]
}

interface Props {
  visitedCountryNames: string[]
}

export default function WorldMap({ visitedCountryNames }: Props) {
  const visitedCodes = new Set(
    visitedCountryNames.map(resolveCode).filter((c): c is string => Boolean(c))
  )

  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: '#D5EAF5' }}>
      <ComposableMap
        projectionConfig={{ scale: 260, center: [10, 15] }}
        style={{ width: '100%', height: '200px', display: 'block' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const isVisited = visitedCodes.has(String(geo.id))
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isVisited ? '#C2714A' : '#D6CABC'}
                  stroke="#FFFFFF"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', fill: isVisited ? '#A85C38' : '#D4C8B8' },
                    pressed: { outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}
