const FALLBACK_COLOR='#286a81';
function normalized(value) {
  return String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it');
}
export { normalized };

export function validColor(value) {
  const color = String(value ?? '').trim();
  if (/^#?[a-f0-9]{3}$/i.test(color) || /^#?[a-f0-9]{6}$/i.test(color)) return color.startsWith('#') ? color : '#' + color;
  return FALLBACK_COLOR;
}

export function contrastColor(hex) {
  hex = validColor(hex).slice(1);
  if (hex.length === 3) hex = [...hex].map(x => x + x).join('');
  const rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = rgb.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  const luminance = .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  return luminance > .18 ? '#10273c' : '#ffffff';
}

export function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : name.slice(0, 2)).toLocaleUpperCase('it');
}
