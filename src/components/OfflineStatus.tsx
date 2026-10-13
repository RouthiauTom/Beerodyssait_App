import {useEffect,useState} from 'react';
export default function OfflineStatus({language}:{language:'fr'|'en'}){
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 const [update,setUpdate]=useState(false);
 useEffect(()=>{
  if(!import.meta.env.PROD)return;
  if(!('serviceWorker' in navigator)){setStatus('error');return;}
  let alive=true;const cleanups:(()=>void)[]=[];
  const ready=()=>{if(alive&&navigator.serviceWorker.controller)setStatus('ready');};
  navigator.serviceWorker.addEventListener('controllerchange',ready);
  cleanups.push(()=>navigator.serviceWorker.removeEventListener('controllerchange',ready));
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{updateViaCache:'none'}).then(reg=>{
   if(!alive)return;
   ready();if(reg.waiting)setUpdate(true);
   const track=()=>{const worker=reg.installing;if(!worker)return;const changed=()=>{
    if(!alive)return;
    if(worker.state==='installed'&&navigator.serviceWorker.controller)setUpdate(true);
    if(worker.state==='redundant'&&!navigator.serviceWorker.controller)setStatus('error');
   };worker.addEventListener('statechange',changed);cleanups.push(()=>worker.removeEventListener('statechange',changed));};
   track();reg.addEventListener('updatefound',track);cleanups.push(()=>reg.removeEventListener('updatefound',track));
  }).catch(()=>{if(alive)setStatus(navigator.serviceWorker.controller?'ready':'error');});
  return()=>{alive=false;cleanups.forEach(fn=>fn());};
 },[]);
 if(!import.meta.env.PROD)return null;
 const fr=language==='fr';
 return <div className="offline-status" role="status" data-offline-ready={status==='ready'}>
  {status==='ready'?(fr?'Prêt à jouer hors ligne sur cet appareil.':'Ready to play offline on this device.'):status==='error'?(fr?'Le mode hors ligne est indisponible. Réessaie avec une connexion.':'Offline mode is unavailable. Try again with a connection.'):(fr?'Préparation du jeu hors ligne…':'Preparing offline play…')}
  {update&&<p>{fr?'Une mise à jour est prête. Elle sera appliquée après fermeture de tous les onglets du jeu. Ta partie reste sauvegardée.':'An update is ready. It will apply after closing all game tabs. Your game stays saved.'}</p>}
 </div>;
}
