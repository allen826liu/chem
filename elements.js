const raw = `H 氢 Hydrogen
He 氦 Helium
Li 锂 Lithium
Be 铍 Beryllium
B 硼 Boron
C 碳 Carbon
N 氮 Nitrogen
O 氧 Oxygen
F 氟 Fluorine
Ne 氖 Neon
Na 钠 Sodium
Mg 镁 Magnesium
Al 铝 Aluminium
Si 硅 Silicon
P 磷 Phosphorus
S 硫 Sulfur
Cl 氯 Chlorine
Ar 氩 Argon
K 钾 Potassium
Ca 钙 Calcium
Sc 钪 Scandium
Ti 钛 Titanium
V 钒 Vanadium
Cr 铬 Chromium
Mn 锰 Manganese
Fe 铁 Iron
Co 钴 Cobalt
Ni 镍 Nickel
Cu 铜 Copper
Zn 锌 Zinc
Ga 镓 Gallium
Ge 锗 Germanium
As 砷 Arsenic
Se 硒 Selenium
Br 溴 Bromine
Kr 氪 Krypton
Rb 铷 Rubidium
Sr 锶 Strontium
Y 钇 Yttrium
Zr 锆 Zirconium
Nb 铌 Niobium
Mo 钼 Molybdenum
Tc 锝 Technetium
Ru 钌 Ruthenium
Rh 铑 Rhodium
Pd 钯 Palladium
Ag 银 Silver
Cd 镉 Cadmium
In 铟 Indium
Sn 锡 Tin
Sb 锑 Antimony
Te 碲 Tellurium
I 碘 Iodine
Xe 氙 Xenon
Cs 铯 Caesium
Ba 钡 Barium
La 镧 Lanthanum
Ce 铈 Cerium
Pr 镨 Praseodymium
Nd 钕 Neodymium
Pm 钷 Promethium
Sm 钐 Samarium
Eu 铕 Europium
Gd 钆 Gadolinium
Tb 铽 Terbium
Dy 镝 Dysprosium
Ho 钬 Holmium
Er 铒 Erbium
Tm 铥 Thulium
Yb 镱 Ytterbium
Lu 镥 Lutetium
Hf 铪 Hafnium
Ta 钽 Tantalum
W 钨 Tungsten
Re 铼 Rhenium
Os 锇 Osmium
Ir 铱 Iridium
Pt 铂 Platinum
Au 金 Gold
Hg 汞 Mercury
Tl 铊 Thallium
Pb 铅 Lead
Bi 铋 Bismuth
Po 钋 Polonium
At 砹 Astatine
Rn 氡 Radon
Fr 钫 Francium
Ra 镭 Radium
Ac 锕 Actinium
Th 钍 Thorium
Pa 镤 Protactinium
U 铀 Uranium
Np 镎 Neptunium
Pu 钚 Plutonium
Am 镅 Americium
Cm 锔 Curium
Bk 锫 Berkelium
Cf 锎 Californium
Es 锿 Einsteinium
Fm 镄 Fermium
Md 钔 Mendelevium
No 锘 Nobelium
Lr 铹 Lawrencium
Rf 𬬻 Rutherfordium
Db 𬭊 Dubnium
Sg 𬭳 Seaborgium
Bh 𬭛 Bohrium
Hs 𬭶 Hassium
Mt 鿏 Meitnerium
Ds 𫟼 Darmstadtium
Rg 𬬭 Roentgenium
Cn 鿔 Copernicium
Nh 鿭 Nihonium
Fl 𫓧 Flerovium
Mc 镆 Moscovium
Lv 𫟷 Livermorium
Ts 鿬 Tennessine
Og 鿫 Oganesson`;

export const elements = raw.split('\n').map((line, i) => {
  const [symbol, zh, en] = line.split(' ');
  const z = i + 1;
  let row, col;
  if (z <= 2) { row = 1; col = z === 1 ? 1 : 18; }
  else if (z <= 10) { row = 2; col = z <= 4 ? z - 2 : z + 8; }
  else if (z <= 18) { row = 3; col = z <= 12 ? z - 10 : z; }
  else if (z <= 36) { row = 4; col = z - 18; }
  else if (z <= 54) { row = 5; col = z - 36; }
  else if (z <= 56) { row = 6; col = z - 54; }
  else if (z <= 71) { row = 9; col = z - 53; }
  else if (z <= 86) { row = 6; col = z - 68; }
  else if (z <= 88) { row = 7; col = z - 86; }
  else if (z <= 103) { row = 10; col = z - 85; }
  else { row = 7; col = z - 100; }
  const family = row >= 9 ? 'inner' : col === 18 ? 'noble' : col === 17 ? 'halogen' : (col >= 3 && col <= 12) ? 'transition' : col <= 2 && z !== 1 ? 'metal' : 'main';
  return { z, symbol, zh, en, row, col, family };
});
export const byNumber = new Map(elements.map(e => [e.z, e]));
