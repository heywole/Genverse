'use client'

import { useState, useRef, useEffect } from 'react'

export const ALL_COUNTRIES: [string, string, string][] = [
  ['AF','Afghanistan','🇦🇫'],['AL','Albania','🇦🇱'],['DZ','Algeria','🇩🇿'],['AD','Andorra','🇦🇩'],['AO','Angola','🇦🇴'],
  ['AG','Antigua and Barbuda','🇦🇬'],['AR','Argentina','🇦🇷'],['AM','Armenia','🇦🇲'],['AU','Australia','🇦🇺'],['AT','Austria','🇦🇹'],
  ['AZ','Azerbaijan','🇦🇿'],['BS','Bahamas','🇧🇸'],['BH','Bahrain','🇧🇭'],['BD','Bangladesh','🇧🇩'],['BB','Barbados','🇧🇧'],
  ['BY','Belarus','🇧🇾'],['BE','Belgium','🇧🇪'],['BZ','Belize','🇧🇿'],['BJ','Benin','🇧🇯'],['BT','Bhutan','🇧🇹'],
  ['BO','Bolivia','🇧🇴'],['BA','Bosnia and Herzegovina','🇧🇦'],['BW','Botswana','🇧🇼'],['BR','Brazil','🇧🇷'],['BN','Brunei','🇧🇳'],
  ['BG','Bulgaria','🇧🇬'],['BF','Burkina Faso','🇧🇫'],['BI','Burundi','🇧🇮'],['CV','Cape Verde','🇨🇻'],['KH','Cambodia','🇰🇭'],
  ['CM','Cameroon','🇨🇲'],['CA','Canada','🇨🇦'],['CF','Central African Republic','🇨🇫'],['TD','Chad','🇹🇩'],['CL','Chile','🇨🇱'],
  ['CN','China','🇨🇳'],['CO','Colombia','🇨🇴'],['KM','Comoros','🇰🇲'],['CG','Congo','🇨🇬'],['CD','Congo DRC','🇨🇩'],
  ['CR','Costa Rica','🇨🇷'],['HR','Croatia','🇭🇷'],['CU','Cuba','🇨🇺'],['CY','Cyprus','🇨🇾'],['CZ','Czech Republic','🇨🇿'],
  ['DK','Denmark','🇩🇰'],['DJ','Djibouti','🇩🇯'],['DM','Dominica','🇩🇲'],['DO','Dominican Republic','🇩🇴'],['EC','Ecuador','🇪🇨'],
  ['EG','Egypt','🇪🇬'],['SV','El Salvador','🇸🇻'],['GQ','Equatorial Guinea','🇬🇶'],['ER','Eritrea','🇪🇷'],['EE','Estonia','🇪🇪'],
  ['SZ','Eswatini','🇸🇿'],['ET','Ethiopia','🇪🇹'],['FJ','Fiji','🇫🇯'],['FI','Finland','🇫🇮'],['FR','France','🇫🇷'],
  ['GA','Gabon','🇬🇦'],['GM','Gambia','🇬🇲'],['GE','Georgia','🇬🇪'],['DE','Germany','🇩🇪'],['GH','Ghana','🇬🇭'],
  ['GR','Greece','🇬🇷'],['GD','Grenada','🇬🇩'],['GT','Guatemala','🇬🇹'],['GN','Guinea','🇬🇳'],['GW','Guinea-Bissau','🇬🇼'],
  ['GY','Guyana','🇬🇾'],['HT','Haiti','🇭🇹'],['HN','Honduras','🇭🇳'],['HU','Hungary','🇭🇺'],['IS','Iceland','🇮🇸'],
  ['IN','India','🇮🇳'],['ID','Indonesia','🇮🇩'],['IR','Iran','🇮🇷'],['IQ','Iraq','🇮🇶'],['IE','Ireland','🇮🇪'],
  ['IL','Israel','🇮🇱'],['IT','Italy','🇮🇹'],['JM','Jamaica','🇯🇲'],['JP','Japan','🇯🇵'],['JO','Jordan','🇯🇴'],
  ['KZ','Kazakhstan','🇰🇿'],['KE','Kenya','🇰🇪'],['KI','Kiribati','🇰🇮'],['KW','Kuwait','🇰🇼'],['KG','Kyrgyzstan','🇰🇬'],
  ['LA','Laos','🇱🇦'],['LV','Latvia','🇱🇻'],['LB','Lebanon','🇱🇧'],['LS','Lesotho','🇱🇸'],['LR','Liberia','🇱🇷'],
  ['LY','Libya','🇱🇾'],['LI','Liechtenstein','🇱🇮'],['LT','Lithuania','🇱🇹'],['LU','Luxembourg','🇱🇺'],['MG','Madagascar','🇲🇬'],
  ['MW','Malawi','🇲🇼'],['MY','Malaysia','🇲🇾'],['MV','Maldives','🇲🇻'],['ML','Mali','🇲🇱'],['MT','Malta','🇲🇹'],
  ['MH','Marshall Islands','🇲🇭'],['MR','Mauritania','🇲🇷'],['MU','Mauritius','🇲🇺'],['MX','Mexico','🇲🇽'],['FM','Micronesia','🇫🇲'],
  ['MD','Moldova','🇲🇩'],['MC','Monaco','🇲🇨'],['MN','Mongolia','🇲🇳'],['ME','Montenegro','🇲🇪'],['MA','Morocco','🇲🇦'],
  ['MZ','Mozambique','🇲🇿'],['MM','Myanmar','🇲🇲'],['NA','Namibia','🇳🇦'],['NR','Nauru','🇳🇷'],['NP','Nepal','🇳🇵'],
  ['NL','Netherlands','🇳🇱'],['NZ','New Zealand','🇳🇿'],['NI','Nicaragua','🇳🇮'],['NE','Niger','🇳🇪'],['NG','Nigeria','🇳🇬'],
  ['MK','North Macedonia','🇲🇰'],['NO','Norway','🇳🇴'],['OM','Oman','🇴🇲'],['PK','Pakistan','🇵🇰'],['PW','Palau','🇵🇼'],
  ['PA','Panama','🇵🇦'],['PG','Papua New Guinea','🇵🇬'],['PY','Paraguay','🇵🇾'],['PE','Peru','🇵🇪'],['PH','Philippines','🇵🇭'],
  ['PL','Poland','🇵🇱'],['PT','Portugal','🇵🇹'],['QA','Qatar','🇶🇦'],['RO','Romania','🇷🇴'],['RU','Russia','🇷🇺'],
  ['RW','Rwanda','🇷🇼'],['KN','Saint Kitts and Nevis','🇰🇳'],['LC','Saint Lucia','🇱🇨'],['VC','Saint Vincent','🇻🇨'],
  ['WS','Samoa','🇼🇸'],['SM','San Marino','🇸🇲'],['ST','Sao Tome and Principe','🇸🇹'],['SA','Saudi Arabia','🇸🇦'],
  ['SN','Senegal','🇸🇳'],['RS','Serbia','🇷🇸'],['SC','Seychelles','🇸🇨'],['SL','Sierra Leone','🇸🇱'],['SG','Singapore','🇸🇬'],
  ['SK','Slovakia','🇸🇰'],['SI','Slovenia','🇸🇮'],['SB','Solomon Islands','🇸🇧'],['SO','Somalia','🇸🇴'],['ZA','South Africa','🇿🇦'],
  ['SS','South Sudan','🇸🇸'],['ES','Spain','🇪🇸'],['LK','Sri Lanka','🇱🇰'],['SD','Sudan','🇸🇩'],['SR','Suriname','🇸🇷'],
  ['SE','Sweden','🇸🇪'],['CH','Switzerland','🇨🇭'],['SY','Syria','🇸🇾'],['TW','Taiwan','🇹🇼'],['TJ','Tajikistan','🇹🇯'],
  ['TZ','Tanzania','🇹🇿'],['TH','Thailand','🇹🇭'],['TL','Timor-Leste','🇹🇱'],['TG','Togo','🇹🇬'],['TO','Tonga','🇹🇴'],
  ['TT','Trinidad and Tobago','🇹🇹'],['TN','Tunisia','🇹🇳'],['TR','Turkey','🇹🇷'],['TM','Turkmenistan','🇹🇲'],
  ['TV','Tuvalu','🇹🇻'],['UG','Uganda','🇺🇬'],['UA','Ukraine','🇺🇦'],['AE','United Arab Emirates','🇦🇪'],
  ['GB','United Kingdom','🇬🇧'],['US','United States','🇺🇸'],['UY','Uruguay','🇺🇾'],['UZ','Uzbekistan','🇺🇿'],
  ['VU','Vanuatu','🇻🇺'],['VE','Venezuela','🇻🇪'],['VN','Vietnam','🇻🇳'],['YE','Yemen','🇾🇪'],
  ['ZM','Zambia','🇿🇲'],['ZW','Zimbabwe','🇿🇼'],
]

export const COUNTRY_FLAG: Record<string, string> = Object.fromEntries(
  ALL_COUNTRIES.map(([code, , flag]) => [code, flag])
)

interface Props {
  value: string
  onChange: (code: string) => void
  style?: React.CSSProperties
}

export function CountrySelector({ value, onChange, style }: Props) {
  const [search, setSearch]   = useState('')
  const [open,   setOpen]     = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)

  const selected = ALL_COUNTRIES.find(([c]) => c === value)
  const filtered = search
    ? ALL_COUNTRIES.filter(([, name]) => name.toLowerCase().includes(search.toLowerCase()))
    : ALL_COUNTRIES

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-hi)',
          borderRadius: 8, color: value ? 'var(--text-1)' : 'var(--text-3)',
          fontSize: 13.5, fontFamily: 'var(--font-sans)',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8, textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selected ? (
            <>{selected[2]} {selected[1]}</>
          ) : 'Select country...'}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border-hi)',
          borderRadius: 10, zIndex: 200, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          {/* Search */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px 7px 30px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 6, fontSize: 13, color: 'var(--text-1)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>No results</div>
            ) : filtered.map(([code, name, flag]) => (
              <button
                key={code}
                type="button"
                onClick={() => { onChange(code); setOpen(false); setSearch('') }}
                style={{
                  width: '100%', padding: '9px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: value === code ? 'var(--brand-bg)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: 13,
                  color: value === code ? 'var(--brand)' : 'var(--text-1)',
                  textAlign: 'left', fontWeight: value === code ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{flag}</span>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
