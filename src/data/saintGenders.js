function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

const MALE_NAMES = [
  'giuse', 'phero', 'phaolo', 'gioan', 'gioan baotixita', 'daminh', 'dominico', 'anton', 'antôn',
  'phanxico', 'phanxico xavie', 'phanxico assisi', 'mac', 'macco', 'matthieu', 'mattheu', 'luca',
  'toma', 'thomas', 'vinhson', 'vincente', 'vicente', 'giacobe', 'simon', 'philipphe', 'philip',
  'barnaba', 'stephano', 'stephanô', 'ly', 'louis', 'luy', 'bonaventura', 'bosco', 'micae', 'michael',
  'raphael', 'rafael', 'gabriel', 'gioakim', 'joakim', 'nicola', 'nicholas', 'andre', 'andrew',
  'benedicto', 'benedict', 'gregorio', 'gregory', 'leo', 'pio', 'clemente', 'clement', 'inhaxio',
  'ignatio', 'ignatius', 'alexis', 'alexu', 'alfonso', 'alphonso', 'alberto', 'albert', 'augustino',
  'augustino', 'fidelis', 'felix', 'hieronimo', 'jerome', 'cyprian', 'cyprianô', 'valentino', 'vito',
  'emmanuel', 'emmanuen', 'tadeo', 'thaddeus', 'bartolomeo', 'bartholomew', 'timothe', 'timothy',
  'tito', 'titus', 'quang', 'khoi',
];

const FEMALE_NAMES = [
  'maria', 'anna', 'teresa', 'têrêsa', 'theresa', 'cecilia', 'cêcilia', 'veronica', 'vêrônica',
  'rosa', 'rose', 'catarina', 'catherine', 'monica', 'mônica', 'elisabeth', 'elizabeth', 'isave',
  'isabel', 'magdalena', 'madalena', 'mađalêna', 'lucia', 'luxia', 'agnes', 'ane', 'anê', 'clara',
  'chiara', 'bernadette', 'benedicta', 'angela', 'angêla', 'martha', 'mácta', 'macta', 'julia',
  'jacinta', 'faustina', 'scholastica', 'celestina', 'cêlestina', 'regina', 'gertrude', 'gertrudê',
  'helena', 'hêlêna', 'perpetua', 'felicity', 'felicitas',
];

const MALE_SET = new Set(MALE_NAMES.map(normalize));
const FEMALE_SET = new Set(FEMALE_NAMES.map(normalize));

// Đoán giới tính theo Tên Thánh (không chắc chắn 100%, chỉ để gợi ý sẵn giá trị
// cho nhanh — người dùng vẫn có thể sửa lại trước khi tạo lớp).
export function guessGenderFromSaintName(tenThanh) {
  const key = normalize(tenThanh);
  if (!key) return '';
  if (MALE_SET.has(key)) return 'NAM';
  if (FEMALE_SET.has(key)) return 'NU';
  return '';
}
