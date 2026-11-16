(() => {
 const url=new URL('./',document.baseURI).href;
 document.querySelector('#share-link').value=url;
 const qr=qrcode(0,'M');qr.addData(url);qr.make();document.querySelector('#share-qr').innerHTML=qr.createSvgTag({cellSize:6,margin:24,scalable:true});
 const install=document.querySelector('#install-app'), share=document.querySelector('#share-app');
 const menu=document.querySelector('.account-menu');
 const installDialog=document.querySelector('#install-dialog'), shareDialog=document.querySelector('#share-dialog');
 const status=document.querySelector('#share-status');
 const standalone=window.matchMedia('(display-mode: standalone)');
 let promptEvent=null, installed=false;
 const update=()=>{install.hidden=installed||standalone.matches||navigator.standalone===true;};
 update();standalone.addEventListener('change',update);
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;update();});
 window.addEventListener('appinstalled',()=>{installed=true;promptEvent=null;update();});
 const open=dialog=>{menu.open=false;dialog.showModal();};
 install.addEventListener('click',async()=>{
  menu.open=false;
  if(promptEvent){
   const event=promptEvent;promptEvent=null;
   try {await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted'){installed=true;update();}}
   catch {open(installDialog);}
  }else open(installDialog);
 });
 share.addEventListener('click',()=>{status.textContent='';open(shareDialog);});
 for(const dialog of [installDialog,shareDialog]){
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>menu.querySelector('summary').focus());
 }
 const nativeShare=document.querySelector('#native-share');
 nativeShare.hidden=typeof navigator.share!=='function';
 nativeShare.addEventListener('click',async()=>{
  try {await navigator.share({title:'MioOrario',text:'Orario personale dei docenti',url});}
  catch(error){if(error.name!=='AbortError')status.textContent='Condivisione non disponibile: puoi copiare il link.';}
 });
 document.querySelector('#copy-link').addEventListener('click',async()=>{
  try {await navigator.clipboard.writeText(url);status.textContent='Link copiato.';}
  catch {const input=document.querySelector('#share-link');input.focus();input.select();status.textContent='Seleziona Copia per copiare il link evidenziato.';}
 });

 document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
 menu.querySelector('a').addEventListener('click',()=>{
  try{for(const key of Object.keys(sessionStorage))if(key.startsWith('mioorario:'))sessionStorage.removeItem(key);}catch{}
 });
})();
