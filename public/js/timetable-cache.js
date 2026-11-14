import {decodeCSV} from './timetable.js';
const configURL=new URL('../config.json',import.meta.url);
const CACHE_KEY='mioorario:static:v1:'+configURL.href;
function mins(v){const [h,m]=v.split(':').map(Number);return h*60+m}
export async function loadTimetable(){
 if(performance.getEntriesByType('navigation')[0]?.type!=='reload'){
  try{const cached=JSON.parse(sessionStorage.getItem(CACHE_KEY));if(cached?.teachers?.length&&cached.bells)return cached;}catch{}
 }
  const configResponse = await fetch(configURL,{cache:'no-store'});
  if (!configResponse.ok) throw Error('Impossibile leggere config.json.');
  const config = await configResponse.json();
  if (typeof config.csvFile !== 'string' || !config.csvFile.trim() || typeof config.csvHasHeader !== 'boolean') throw Error('config.json: controlla csvFile e csvHasHeader.');
  const zone = config.timeZone || 'Europe/Rome';
  new Intl.DateTimeFormat('it',{timeZone:zone}).format(new Date());
  const csvURL = new URL(config.csvFile, configURL);
  if (csvURL.origin !== location.origin) throw Error('csvFile deve indicare un file locale al sito.');
  const csvResponse = await fetch(csvURL,{cache:'no-store'});
  if (!csvResponse.ok) throw Error('Impossibile leggere '+config.csvFile+'.');
  const csv = await csvResponse.text();
  if (/<!doctype html|<html/i.test(csv)) throw Error('Il file CSV contiene una pagina HTML.');
  const data = decodeCSV(csv,config.csvHasHeader);
  data.bells = ['lun','mar','mer','gio','ven'].map((key,d)=>{
   const entry=config.days?.[key];
   if (!entry || !Array.isArray(entry.starts) || ![6,7].includes(entry.starts.length)) throw Error(key+': configura 6 o 7 inizi in config.json.');
   const times=[...entry.starts,entry.end];
   if (times.some(t=>typeof t!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) || times.some((t,i)=>i&&mins(t)<=mins(times[i-1]))) throw Error(key+': gli orari devono essere HH:MM e in ordine crescente.');
   if (entry.starts.length<data.hourCounts[d]) throw Error(key+': il CSV contiene 7 ore; aggiungi il settimo inizio e aggiorna end in config.json.');
   return entry.starts.slice(0,data.hourCounts[d]).map((start,i)=>start+'-'+times[i+1]);
  });

 data.timeZone=zone;
 try{sessionStorage.setItem(CACHE_KEY,JSON.stringify(data));}catch{}
 return data;
}
