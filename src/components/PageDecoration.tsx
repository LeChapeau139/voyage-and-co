'use client'

export type DecorPage = 'voyages' | 'bibliotheque' | 'autour' | 'profil'

function VoyagesDecor() {
  return (
    <>
      <div className="fixed top-0 right-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
        <svg width="115" height="210" viewBox="0 0 115 210" fill="none">
          <path d="M 100 210 C 95 165 85 120 75 85" stroke="#5C3A1E" strokeWidth="5" strokeLinecap="round"/>
          <path d="M 80 95 C 55 82 28 88 10 105 C 32 82 60 78 80 95" fill="#5CAD63" stroke="#2E6B2E" strokeWidth="1.5"/>
          <path d="M 82 72 C 60 52 35 50 18 60 C 40 46 66 47 82 72" fill="#7BC47F" stroke="#2E6B2E" strokeWidth="1.5"/>
          <path d="M 78 115 C 58 115 38 125 22 140 C 42 118 62 112 78 115" fill="#4CAF50" stroke="#2E6B2E" strokeWidth="1.5"/>
          <path d="M 84 50 C 96 30 108 12 115 0 C 112 14 100 33 84 50" fill="#81C784" stroke="#2E6B2E" strokeWidth="1"/>
          <path d="M 86 140 C 98 128 108 115 112 102 C 108 115 98 130 86 140" fill="#A8D97A" stroke="#2E6B2E" strokeWidth="1"/>
          <circle cx="78" cy="82" r="7" fill="#7B4F2E" stroke="#5C3A1E" strokeWidth="1"/>
          <circle cx="70" cy="88" r="5" fill="#6B4020" stroke="#5C3A1E" strokeWidth="1"/>
          <g transform="translate(108, 20)">
            <ellipse cx="0" cy="-10" rx="6" ry="11" fill="#FF5B7A" stroke="#C0395A" strokeWidth="1"/>
            <ellipse cx="0" cy="-10" rx="6" ry="11" fill="#FF7A93" stroke="#C0395A" strokeWidth="1" transform="rotate(72)"/>
            <ellipse cx="0" cy="-10" rx="6" ry="11" fill="#FF5B7A" stroke="#C0395A" strokeWidth="1" transform="rotate(144)"/>
            <ellipse cx="0" cy="-10" rx="6" ry="11" fill="#FF7A93" stroke="#C0395A" strokeWidth="1" transform="rotate(216)"/>
            <ellipse cx="0" cy="-10" rx="6" ry="11" fill="#FF5B7A" stroke="#C0395A" strokeWidth="1" transform="rotate(288)"/>
            <circle cx="0" cy="0" r="4" fill="#FFE066"/>
          </g>
        </svg>
      </div>
      <div className="fixed bottom-0 left-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
        <svg width="115" height="195" viewBox="0 0 115 195" fill="none">
          <path d="M 12 195 C 18 158 30 118 55 82" stroke="#3D6B35" strokeWidth="4" strokeLinecap="round"/>
          <path d="M 8 192 C -5 138 18 88 58 52 C 82 32 105 38 108 58 C 82 63 42 105 8 192" fill="#4CAF50" stroke="#2E6B2E" strokeWidth="2"/>
          <path d="M 8 192 C 28 142 52 102 84 65" stroke="#A8D97A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 25 185 C 5 145 0 105 20 75 C 34 55 60 68 25 185" fill="#5CAD63" stroke="#2E6B2E" strokeWidth="1"/>
          <g transform="translate(102, 60)">
            <ellipse cx="0" cy="-9" rx="5" ry="10" fill="#FF9B4E" stroke="#C2714A" strokeWidth="1"/>
            <ellipse cx="0" cy="-9" rx="5" ry="10" fill="#FFB74D" stroke="#C2714A" strokeWidth="1" transform="rotate(60)"/>
            <ellipse cx="0" cy="-9" rx="5" ry="10" fill="#FF9B4E" stroke="#C2714A" strokeWidth="1" transform="rotate(120)"/>
            <ellipse cx="0" cy="-9" rx="5" ry="10" fill="#FFB74D" stroke="#C2714A" strokeWidth="1" transform="rotate(180)"/>
            <ellipse cx="0" cy="-9" rx="5" ry="10" fill="#FF9B4E" stroke="#C2714A" strokeWidth="1" transform="rotate(240)"/>
            <ellipse cx="0" cy="-9" rx="5" ry="10" fill="#FFB74D" stroke="#C2714A" strokeWidth="1" transform="rotate(300)"/>
            <circle cx="0" cy="0" r="5" fill="#FFE066"/>
          </g>
          <circle cx="75" cy="82" r="5" fill="#E53935" stroke="#B71C1C" strokeWidth="1"/>
          <circle cx="67" cy="90" r="4" fill="#E53935" stroke="#B71C1C" strokeWidth="1"/>
          <circle cx="82" cy="90" r="3" fill="#EF5350"/>
        </svg>
      </div>
    </>
  )
}

function BibliothequeDecor() {
  const daisyAngles = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <>
      <div className="fixed top-0 right-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
        <svg width="115" height="215" viewBox="0 0 115 215" fill="none">
          <path d="M 108 215 C 98 165 88 115 78 65 C 70 30 62 10 58 0" stroke="#4A7F55" strokeWidth="3" strokeLinecap="round"/>
          {[
            { x: 93, y: 128, len: 55, side: -1 },
            { x: 88, y: 105, len: 50, side: -1 },
            { x: 83, y: 82, len: 46, side: -1 },
            { x: 78, y: 60, len: 40, side: -1 },
          ].map((l, i) => (
            <path key={i}
              d={`M ${l.x} ${l.y} C ${l.x + l.side * 20} ${l.y - 12} ${l.x + l.side * l.len + 5} ${l.y - 10} ${l.x + l.side * l.len} ${l.y}`}
              fill={i % 2 === 0 ? '#6BAE75' : '#81C784'} stroke="#4A7F55" strokeWidth="1"
            />
          ))}
          {[
            { x: 96, y: 138 }, { x: 90, y: 112 }, { x: 85, y: 88 },
          ].map((l, i) => (
            <path key={i}
              d={`M ${l.x} ${l.y} C ${l.x + 18} ${l.y - 12} ${l.x + 38} ${l.y - 8} ${l.x + 42} ${l.y + 2}`}
              fill={i % 2 === 0 ? '#7BC47F' : '#A5D6A7'} stroke="#4A7F55" strokeWidth="1"
            />
          ))}
          <g transform="translate(62, 10)">
            <circle cx="0" cy="0" r="5" fill="#9B72C8" stroke="#7B52A8" strokeWidth="1"/>
            <circle cx="-4" cy="-7" r="4" fill="#B39DDB" stroke="#7B52A8" strokeWidth="1"/>
            <circle cx="4" cy="-7" r="4" fill="#CE93D8" stroke="#7B52A8" strokeWidth="1"/>
            <circle cx="0" cy="-12" r="4" fill="#9B72C8" stroke="#7B52A8" strokeWidth="1"/>
          </g>
          <g transform="translate(48, 28)">
            <circle cx="0" cy="0" r="4" fill="#CE93D8" stroke="#7B52A8" strokeWidth="1"/>
            <circle cx="-3" cy="-6" r="3" fill="#B39DDB" stroke="#7B52A8" strokeWidth="1"/>
            <circle cx="3" cy="-6" r="3" fill="#9B72C8" stroke="#7B52A8" strokeWidth="1"/>
            <circle cx="0" cy="-10" r="3" fill="#CE93D8" stroke="#7B52A8" strokeWidth="1"/>
          </g>
          <path d="M 100 175 C 108 166 112 158 110 150 C 108 143 102 143 100 150 C 98 157 102 161 106 159" stroke="#4A7F55" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="fixed bottom-0 left-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
        <svg width="120" height="200" viewBox="0 0 120 200" fill="none">
          <ellipse cx="42" cy="158" rx="38" ry="28" fill="#5CAD63" stroke="#3D6B35" strokeWidth="2"/>
          <ellipse cx="30" cy="150" rx="22" ry="17" fill="#7BC47F" stroke="#3D6B35" strokeWidth="1"/>
          <ellipse cx="54" cy="147" rx="20" ry="15" fill="#6BAE75" stroke="#3D6B35" strokeWidth="1"/>
          <ellipse cx="40" cy="142" rx="16" ry="12" fill="#A5D6A7" stroke="#3D6B35" strokeWidth="1"/>
          {[5, 12, 22, 35, 50, 65, 78].map((x, i) => (
            <path key={i} d={`M ${x} 200 C ${x - 2} ${185 - i * 2} ${x + 1} ${172 - i} ${x + 4} ${162 - i * 2}`} stroke={i % 2 === 0 ? '#4A7F55' : '#5CAD63'} strokeWidth="2" strokeLinecap="round"/>
          ))}
          <g transform="translate(22, 132)">
            {daisyAngles.map((a, i) => (
              <ellipse key={i} cx="0" cy="-9" rx="4" ry="9" fill="white" stroke="#E0E0E0" strokeWidth="0.5" transform={`rotate(${a})`}/>
            ))}
            <circle cx="0" cy="0" r="5" fill="#FFE066" stroke="#F9A825" strokeWidth="1"/>
          </g>
          <path d="M 22 132 L 22 158" stroke="#4A7F55" strokeWidth="1.5" strokeLinecap="round"/>
          <g transform="translate(62, 122)">
            {daisyAngles.map((a, i) => (
              <ellipse key={i} cx="0" cy="-8" rx="3.5" ry="8" fill="white" stroke="#E0E0E0" strokeWidth="0.5" transform={`rotate(${a})`}/>
            ))}
            <circle cx="0" cy="0" r="4" fill="#FFE066" stroke="#F9A825" strokeWidth="1"/>
          </g>
          <path d="M 62 122 L 64 145" stroke="#4A7F55" strokeWidth="1.5" strokeLinecap="round"/>
          <g transform="translate(44, 112)">
            {[0, 60, 120, 180, 240, 300].map((a, i) => (
              <ellipse key={i} cx="0" cy="-7" rx="4" ry="8" fill="#FFAB91" stroke="#FF7043" strokeWidth="0.5" transform={`rotate(${a})`}/>
            ))}
            <circle cx="0" cy="0" r="3" fill="#FFE066"/>
          </g>
        </svg>
      </div>
    </>
  )
}

function AutourDecor() {
  const daisyAngles = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <>
      <div className="fixed top-0 right-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
        <svg width="130" height="215" viewBox="0 0 130 215" fill="none">
          <path d="M 20 130 L 60 58 L 100 130 Z" fill="#9BB5C8" stroke="#7A9DB5" strokeWidth="1"/>
          <path d="M 52 130 L 92 48 L 132 130 Z" fill="#B0C9D8" stroke="#8AAFC0" strokeWidth="1"/>
          <path d="M 60 58 L 50 82 L 70 82 Z" fill="white" opacity="0.85"/>
          <path d="M 92 48 L 80 75 L 104 75 Z" fill="white" opacity="0.85"/>
          <path d="M 78 215 C 75 195 73 175 71 160" stroke="#3E2A1E" strokeWidth="4" strokeLinecap="round"/>
          <path d="M 71 164 C 52 150 36 150 26 160 C 40 145 60 145 71 164" fill="#2E7D32" stroke="#1B5E20" strokeWidth="1"/>
          <path d="M 70 143 C 52 129 38 129 30 138 C 43 123 60 124 70 143" fill="#388E3C" stroke="#1B5E20" strokeWidth="1"/>
          <path d="M 68 122 C 52 109 40 109 33 118 C 45 103 59 104 68 122" fill="#43A047" stroke="#1B5E20" strokeWidth="1"/>
          <path d="M 66 103 C 53 91 42 91 36 100 C 46 86 58 87 66 103" fill="#4CAF50" stroke="#1B5E20" strokeWidth="1"/>
          <path d="M 65 87 C 54 75 45 75 40 84 C 48 70 58 71 65 87" fill="#66BB6A" stroke="#1B5E20" strokeWidth="1"/>
          <path d="M 108 215 C 106 205 105 195 104 187" stroke="#3E2A1E" strokeWidth="3" strokeLinecap="round"/>
          <path d="M 104 191 C 90 180 80 180 74 188 C 82 174 95 175 104 191" fill="#2E7D32" stroke="#1B5E20" strokeWidth="1"/>
          <path d="M 103 173 C 91 163 82 163 77 171 C 84 157 95 158 103 173" fill="#388E3C" stroke="#1B5E20" strokeWidth="1"/>
          <path d="M 102 157 C 91 148 84 148 80 155 C 86 142 94 143 102 157" fill="#4CAF50" stroke="#1B5E20" strokeWidth="1"/>
          <circle cx="30" cy="22" r="2" fill="#FFE066"/>
          <circle cx="45" cy="10" r="1.5" fill="#FFE066"/>
          <circle cx="15" cy="35" r="1.5" fill="#FFE066"/>
          <circle cx="55" cy="20" r="1" fill="#FFE066"/>
        </svg>
      </div>
      <div className="fixed bottom-0 left-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
        <svg width="130" height="200" viewBox="0 0 130 200" fill="none">
          {[0, 8, 20, 35, 50, 65, 80].map((x, i) => (
            <path key={i} d={`M ${x} 200 C ${x - 2} ${178 - i} ${x + 2} ${162 - i * 2} ${x + 5 + i} ${148 - i * 3}`} stroke={i % 2 === 0 ? '#4CAF50' : '#66BB6A'} strokeWidth="2.5" strokeLinecap="round"/>
          ))}
          <path d="M 16 148 C 14 128 13 112 15 96" stroke="#3D6B35" strokeWidth="2" strokeLinecap="round"/>
          <g transform="translate(15, 96)">
            <ellipse cx="0" cy="-12" rx="10" ry="13" fill="#F44336" stroke="#C62828" strokeWidth="1"/>
            <ellipse cx="0" cy="-12" rx="10" ry="13" fill="#EF5350" stroke="#C62828" strokeWidth="1" transform="rotate(90)"/>
            <circle cx="0" cy="0" r="6" fill="#1B5E20"/>
          </g>
          <path d="M 50 148 C 48 126 46 108 45 94" stroke="#3D6B35" strokeWidth="2" strokeLinecap="round"/>
          <g transform="translate(45, 94)">
            {daisyAngles.map((a, i) => (
              <ellipse key={i} cx="0" cy="-10" rx="4" ry="11" fill="white" stroke="#BDBDBD" strokeWidth="0.5" transform={`rotate(${a})`}/>
            ))}
            <circle cx="0" cy="0" r="6" fill="#FFE066" stroke="#F9A825" strokeWidth="1"/>
          </g>
          <path d="M 78 142 C 76 120 74 102 72 90" stroke="#3D6B35" strokeWidth="2" strokeLinecap="round"/>
          <g transform="translate(72, 90)">
            {[0, 60, 120, 180, 240, 300].map((a, i) => (
              <ellipse key={i} cx="0" cy="-8" rx="5" ry="9" fill="#5C8DB5" stroke="#3A6A90" strokeWidth="1" transform={`rotate(${a})`}/>
            ))}
            <circle cx="0" cy="0" r="4" fill="#FFE066"/>
          </g>
          <g transform="translate(98, 118)">
            <path d="M 0 0 C -8 -10 -18 -8 -15 0 C -12 8 -3 5 0 0" fill="#FF9B4E" opacity="0.9"/>
            <path d="M 0 0 C 8 -10 18 -8 15 0 C 12 8 3 5 0 0" fill="#FF9B4E" opacity="0.9"/>
            <path d="M 0 0 C -6 5 -12 5 -10 10 C -8 15 -2 12 0 0" fill="#FFB74D" opacity="0.9"/>
            <path d="M 0 0 C 6 5 12 5 10 10 C 8 15 2 12 0 0" fill="#FFB74D" opacity="0.9"/>
            <path d="M 0 -5 L 0 12" stroke="#5C3A1E" strokeWidth="1" strokeLinecap="round"/>
          </g>
        </svg>
      </div>
    </>
  )
}

function ProfilDecor() {
  return (
    <>
      <div className="fixed top-0 right-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
        <svg width="130" height="215" viewBox="0 0 130 215" fill="none">
          <path d="M 95 215 C 90 178 82 142 68 108 C 60 82 54 60 57 38" stroke="#4A7F55" strokeWidth="4" strokeLinecap="round"/>
          <path d="M 80 158 C 58 150 42 160 36 172 C 50 156 67 148 80 158" fill="#5CAD63" stroke="#3D6B35" strokeWidth="1.5"/>
          <path d="M 74 122 C 94 110 105 96 108 82 C 97 92 85 108 74 122" fill="#6BAE75" stroke="#3D6B35" strokeWidth="1.5"/>
          <g transform="translate(60, 40)">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
              <ellipse key={i} cx="0" cy="-19" rx="7" ry="14" fill={i % 2 === 0 ? '#FFD600' : '#FFEA00'} stroke="#F9A825" strokeWidth="1" transform={`rotate(${a})`}/>
            ))}
            <circle cx="0" cy="0" r="16" fill="#5C3A1E" stroke="#3E2723" strokeWidth="1"/>
            <circle cx="0" cy="0" r="12" fill="#6D4C41"/>
            <circle cx="0" cy="-5" r="2" fill="#4E342E"/>
            <circle cx="4" cy="-3" r="2" fill="#4E342E"/>
            <circle cx="4" cy="3" r="2" fill="#4E342E"/>
            <circle cx="0" cy="5" r="2" fill="#4E342E"/>
            <circle cx="-4" cy="3" r="2" fill="#4E342E"/>
            <circle cx="-4" cy="-3" r="2" fill="#4E342E"/>
          </g>
          <g transform="translate(112, 18)">
            <circle cx="0" cy="0" r="10" fill="#FFD600" stroke="#F9A825" strokeWidth="1"/>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
              <line key={i} x1="0" y1="-13" x2="0" y2="-18" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a})`}/>
            ))}
          </g>
          <circle cx="104" cy="88" r="5" fill="#E53935" stroke="#B71C1C" strokeWidth="1"/>
          <circle cx="112" cy="96" r="4" fill="#E53935" stroke="#B71C1C" strokeWidth="1"/>
          <circle cx="98" cy="97" r="3" fill="#EF5350"/>
        </svg>
      </div>
      <div className="fixed bottom-0 left-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
        <svg width="130" height="200" viewBox="0 0 130 200" fill="none">
          <path d="M 6 200 C 12 168 22 138 38 112 C 54 86 68 70 82 58" stroke="#4A7F55" strokeWidth="3" strokeLinecap="round"/>
          <path d="M 38 112 C 54 104 68 108 76 118" stroke="#4A7F55" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 58 90 C 68 78 80 74 90 80" stroke="#4A7F55" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 76 118 C 82 114 86 108 84 102 C 82 96 76 96 74 102 C 72 108 76 112 78 110" stroke="#4A7F55" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 28 140 C 8 130 -2 115 8 105 C 18 95 38 108 28 140" fill="#5CAD63" stroke="#3D6B35" strokeWidth="1"/>
          <path d="M 52 100 C 32 88 26 70 36 60 C 46 50 66 66 52 100" fill="#66BB6A" stroke="#3D6B35" strokeWidth="1"/>
          <path d="M 72 70 C 56 55 54 36 64 28 C 74 20 88 38 72 70" fill="#5CAD63" stroke="#3D6B35" strokeWidth="1"/>
          <g transform="translate(74, 118)">
            <path d="M 0 -15 C -8 -12 -12 -5 -10 0 C -8 5 -3 8 0 8 C 3 8 8 5 10 0 C 12 -5 8 -12 0 -15" fill="#E87B9A" stroke="#C2185B" strokeWidth="1"/>
            <path d="M 0 -15 C 4 -12 8 -5 8 0" stroke="white" strokeWidth="1" fill="none"/>
            <path d="M 0 -15 C -4 -12 -8 -5 -8 0" stroke="white" strokeWidth="1" fill="none"/>
            <circle cx="0" cy="2" r="3" fill="white"/>
          </g>
          <g transform="translate(90, 80)">
            <path d="M 0 -13 C -7 -10 -10 -4 -9 0 C -7 4 -3 7 0 7 C 3 7 7 4 9 0 C 10 -4 7 -10 0 -13" fill="#9C27B0" stroke="#6A1B9A" strokeWidth="1"/>
            <path d="M 0 -13 C 3.5 -10 7 -4 7 0" stroke="white" strokeWidth="0.8" fill="none"/>
            <path d="M 0 -13 C -3.5 -10 -7 -4 -7 0" stroke="white" strokeWidth="0.8" fill="none"/>
            <circle cx="0" cy="1" r="2.5" fill="white"/>
          </g>
          <g transform="translate(52, 100)">
            <path d="M 0 -11 C -6 -9 -9 -3 -8 0 C -6 4 -2 6 0 6 C 2 6 6 4 8 0 C 9 -3 6 -9 0 -11" fill="#F48FB1" stroke="#C2185B" strokeWidth="1"/>
            <circle cx="0" cy="1" r="2" fill="white"/>
          </g>
          <g transform="translate(102, 56)">
            <path d="M 0 0 C -6 -8 -14 -6 -12 0 C -10 6 -3 4 0 0" fill="#CE93D8" opacity="0.9"/>
            <path d="M 0 0 C 6 -8 14 -6 12 0 C 10 6 3 4 0 0" fill="#CE93D8" opacity="0.9"/>
            <path d="M 0 0 C -4 4 -9 4 -7 8 C -5 12 -1 10 0 0" fill="#B39DDB" opacity="0.9"/>
            <path d="M 0 0 C 4 4 9 4 7 8 C 5 12 1 10 0 0" fill="#B39DDB" opacity="0.9"/>
            <path d="M 0 -3 L 0 8" stroke="#5C3A1E" strokeWidth="0.8" strokeLinecap="round"/>
          </g>
        </svg>
      </div>
    </>
  )
}

export default function PageDecoration({ page }: { page: DecorPage }) {
  switch (page) {
    case 'voyages':      return <VoyagesDecor />
    case 'bibliotheque': return <BibliothequeDecor />
    case 'autour':       return <AutourDecor />
    case 'profil':       return <ProfilDecor />
    default:             return null
  }
}
