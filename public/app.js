import {loadTimetable} from './js/timetable-cache.js';
const $=s=>document.querySelector(s),days=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì'];
let schedule=null, day=0, following=true, loadError='', lastActive='';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function badgeStyle(color){
 if(typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))return '';
 const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const luminance=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
 const text=luminance>.179?'#000000':'#FFFFFF';
 return ` style="background-color:${color};color:${text};border-color:${color}"`;
}
function mins(v){const [h,m]=v.split(':').map(Number);return h*60+m}
function current(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:schedule?.timeZone || 'Europe/Rome',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));const d=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(p.weekday),m=+p.hour*60+(+p.minute);const h=d<5&&schedule?schedule.bells[d].findIndex(v=>{const [a,b]=v.split('-').map(mins);return m>=a&&m<b}):-1;return {d,h,m}}
const selectedName = new URLSearchParams(location.search).get('nome');
document.querySelector('#teacher-name').textContent = selectedName || '';
function periodRow(hour, range, currentHour) {
 const teacher = schedule.teachers.find(t => t.name === selectedName);
 if (!teacher) return '';
 const slot = teacher.slots[schedule.dayOffsets[day] + hour];
 const enhancement = slot.toUpperCase() === 'P';
 const label = enhancement ? 'Potenziamento' : slot || 'Libera';
 const style = enhancement ? badgeStyle('#FFF1B8') : slot ? badgeStyle(teacher.color) : '';
 const active = currentHour === hour;
 return `<article class="period-row${active ? ' current-period' : ''}">
   <div class="period-time teacher-period">
     <strong>${hour+1}ª ora</strong>
     <span>${esc(range.replace('-','–'))}</span>
     <strong class="teacher-slot${slot ? '' : ' free'}"${style}>${esc(label)}</strong>
   </div>
   ${active ? '<small class="live-period">In corso</small>' : ''}
 </article>`;
}
function render(){
 const now = current();
 lastActive = `${now.d}:${now.h}`;
 $('#days').innerHTML = days.map((name,i)=>`<button data-day="${i}" class="${day===i?'active':''}" aria-pressed="${day===i}">${name.slice(0,3)}</button>`).join('');
 $('#day-title').textContent = days[day] || 'Laboratorio';
 if (!schedule) {
  $('#periods').textContent = loadError || 'Caricamento orario…';
  return;
 }
 if (day < 0) { $('#periods').innerHTML=''; return; }
 const currentHour = day === now.d ? now.h : -1;
 $('#periods').innerHTML = schedule.bells[day].map((range,h)=>periodRow(h,range,currentHour)).join('');
}

function goNow(){
 following = true;
 const weekday = current().d;
 day = weekday < 5 ? weekday : 0;
 render();
}
function selectDay(nextDay){
 if (nextDay < 0 || nextDay > 4) return;
 following = false;
 day = nextDay;
 render();
}
function step(direction){
 selectDay(day < 0 ? (direction > 0 ? 0 : 4) : day + direction);
}
$('#days').onclick = event => {
 const button = event.target.closest('button');
 if (button) selectDay(Number(button.dataset.day));
};
$('#now').onclick = goNow;
$('.schedule').onkeydown = event => {
 if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
  event.preventDefault();step(event.key === 'ArrowLeft' ? -1 : 1);
 }
};
let touch;$('.schedule').addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});$('.schedule').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);touch=null},{passive:true});$('.schedule').addEventListener('touchcancel',()=>touch=null);
let wheelStamp=0;$('.schedule').addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)&&Math.abs(e.deltaX)>15){e.preventDefault();if(Date.now()-wheelStamp>450){step(e.deltaX>0?1:-1);wheelStamp=Date.now()}}},{passive:false});
async function refresh(){
 try {
  const data = await loadTimetable();
  if (!data.teachers.some(t => t.name === selectedName)) throw Error('Docente non trovato.');
  document.title = selectedName + ' · MioOrario';
  schedule = data;
 } catch(error) {
  loadError = error.message;
 }
 following ? goNow() : render();
}
function tick(){
 const now = current();
 if (`${now.d}:${now.h}` !== lastActive) following ? goNow() : render();
}
goNow();refresh();
setInterval(tick,15000);
document.addEventListener('visibilitychange',()=>{if (!document.hidden) tick()});
