import {normalized, initials, contrastColor} from './data.js?v=blue-6';
import {loadTimetable} from './timetable-cache.js?v=footer-1';
const search = document.getElementById('teacher-search');
const list = document.getElementById('teacher-list');
const count = document.getElementById('teacher-count');
const status = document.getElementById('status');
const empty = document.getElementById('no-results');
let teachers = [];

function render() {
  const term = normalized(search.value);
  const filtered = teachers.filter(teacher => normalized(teacher.name).includes(term));
  list.replaceChildren();
  count.textContent = String(filtered.length);
  empty.hidden = filtered.length > 0;
  list.hidden = filtered.length === 0;
  const fragment = document.createDocumentFragment();
  filtered.forEach(teacher => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'teacher directory-entry';
    a.href = `./docente.html?nome=${encodeURIComponent(teacher.name)}`;
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = initials(teacher.name);
    avatar.style.backgroundColor = teacher.color || "#dce8f8";
    avatar.style.color = contrastColor(teacher.color || "#dce8f8");
    avatar.setAttribute('aria-hidden', 'true');
    const title = document.createElement('span');
    title.className = 'name';
    title.textContent = teacher.name;
    const trailing = document.createElement('span');
    trailing.className = 'entry-arrow';
    trailing.textContent = '→';
    trailing.setAttribute('aria-hidden', 'true');
    a.append(avatar, title, trailing);
    li.append(a);
    fragment.append(li);
  });
  list.append(fragment);
}

async function refresh() {
  status.hidden = false;
  status.classList.remove('error');
  status.textContent = 'Caricamento dell’elenco…';
  list.hidden = true;
  empty.hidden = true;
  try {
    const data = await loadTimetable();
    teachers = data.teachers.sort((a,b)=>a.name.localeCompare(b.name,"it"));
    status.hidden = true;
    render();
  } catch (error) {
    count.textContent = '—';
    status.classList.add('error');
    status.textContent = `${error.message}`;
  }
}

search.addEventListener('input', render);
refresh();