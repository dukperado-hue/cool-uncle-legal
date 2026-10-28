/* Bowtie Together v1.1 - transactional collaboration client with durable pending changes. */
(function(root){
'use strict';
const $=id=>document.getElementById(id),{clone,diffProject,applyOps}=root.BowtieMerge;
const MAP_KEY='bowtie-together-room-map-v1',PENDING_PREFIX='bowtie-together-pending-v2:',CLIENT_KEY='bowtie-together-tab-id-v1',NAME_KEY='bowtie-together-display-name-v1';
const CODE_RE=/^[A-HJ-NP-Z2-9]{16}$/;
const randomId=()=>root.crypto?.randomUUID?.()||('btt-'+Date.now()+'-'+Math.random().toString(36).slice(2));
let CLIENT_ID;try{CLIENT_ID=sessionStorage.getItem(CLIENT_KEY)||randomId();sessionStorage.setItem(CLIENT_KEY,CLIENT_ID);}catch{CLIENT_ID=randomId();}
const i18n={en:{
 title:'Collaborate on this BowTie',sub:'Share an invitation code and edit the same analysis with your team.',join:'Join room',create:'Create live room',code:'Room access code',codeHint:'16 characters · keep private',paste:'Enter invitation code',connected:'Live · Connected',connecting:'Connecting…',offline:'Offline · Changes queued',local:'Private · On this device',conflict:'Edit conflict · Review required',people:'online',link:'Copy invitation link',copyCode:'Copy code',copied:'Copied',leave:'Leave live room',leaveConfirm:'Leave this shared room on this device? Unsynchronised edits must be resolved first.',close:'Close',error:'Unable to connect. Check the server URL or code.',createFailed:'Could not create a live room.',codeError:'Enter the complete 16-character code.',share:'Collaborate',room:'Room',security:'Anyone with the code can view and edit. Do not use for confidential data without additional access controls.',localCopy:'Save private copy',localCopyDone:'Private copy created',you:'Your display name',review:'A teammate edited the same field. Choose which changes to keep; nothing has been overwritten on the server.',keepMine:'Keep my changes',keepTeam:'Use team changes',unsaved:'Unsynchronised changes',saved:'All team changes saved',leavePending:'Resolve or synchronise pending changes before leaving.',retry:'Retry pending changes',rejected:'Server rejected this edit. Save a private JSON copy if you need to preserve it.'},
 th:{title:'ร่วมวิเคราะห์ BowTie',sub:'แชร์รหัสห้องเพื่อแก้ไขการวิเคราะห์ร่วมกันแบบเรียลไทม์',join:'เข้าร่วมห้อง',create:'สร้างห้องร่วมงาน',code:'รหัสเข้าถึงห้อง',codeHint:'16 ตัวอักษร · กรุณาเก็บเป็นความลับ',paste:'ใส่รหัสเชิญ',connected:'เชื่อมต่อ · เรียลไทม์',connecting:'กำลังเชื่อมต่อ…',offline:'ออฟไลน์ · รอซิงก์',local:'ส่วนตัว · บันทึกในเครื่อง',conflict:'ข้อมูลขัดแย้ง · กรุณาตรวจสอบ',people:'ออนไลน์',link:'คัดลอกลิงก์เชิญ',copyCode:'คัดลอกรหัส',copied:'คัดลอกแล้ว',leave:'ออกจากห้อง',leaveConfirm:'ออกจากห้องบนอุปกรณ์นี้หรือไม่? ต้องจัดการข้อมูลที่ยังไม่ซิงก์ก่อน',close:'ปิด',error:'เชื่อมต่อไม่ได้ ตรวจสอบเซิร์ฟเวอร์หรือรหัสห้อง',createFailed:'สร้างห้องไม่สำเร็จ',codeError:'กรอกรหัส 16 ตัวอักษร',share:'ทำงานร่วมกัน',room:'ห้อง',security:'ผู้มีรหัสสามารถดูและแก้ไขได้ อย่าใช้กับข้อมูลลับจนกว่าจะมีระบบสิทธิ์ผู้ใช้',localCopy:'สร้างสำเนาส่วนตัว',localCopyDone:'สร้างสำเนาส่วนตัวแล้ว',you:'ชื่อที่แสดง',review:'เพื่อนร่วมงานแก้ไขช่องเดียวกัน เลือกการแก้ไขที่ต้องการเก็บ ข้อมูลบนเซิร์ฟเวอร์ยังไม่ถูกเขียนทับ',keepMine:'เก็บการแก้ไขของฉัน',keepTeam:'ใช้ข้อมูลจากทีม',unsaved:'มีการแก้ไขที่ยังไม่ซิงก์',saved:'ซิงก์ข้อมูลทั้งหมดแล้ว',leavePending:'กรุณาซิงก์หรือแก้ไขข้อมูลขัดแย้งก่อนออก',retry:'ลองซิงก์อีกครั้ง',rejected:'เซิร์ฟเวอร์ไม่ยอมรับการแก้ไขนี้ โปรดเก็บสำเนา JSON ส่วนตัวหากต้องการสำรองข้อมูล'}};
function makeClient(api){
 let code=null,roomProjectId=null,source=null,server=null,queue=[],running=false,localBase=null,presence=0,members=[],status='local',startup=false,conflict=null,generation=0,retryTimer=null;
 const mapping=(()=>{try{return JSON.parse(localStorage.getItem(MAP_KEY))||{};}catch{return {};}})();
 const base=String(root.BOWTIE_TOGETHER_API||'').replace(/\/$/,'');
 let displayName=(()=>{try{return localStorage.getItem(NAME_KEY)||'Guest '+CLIENT_ID.slice(0,4);}catch{return 'Guest '+CLIENT_ID.slice(0,4);}})();
 const tx=x=>i18n[api.lang()==='th'?'th':'en'][x]||x;
 const persistMap=()=>{try{localStorage.setItem(MAP_KEY,JSON.stringify(mapping));}catch{}};
 const pendingKey=roomCode=>PENDING_PREFIX+roomCode+':'+CLIENT_ID;
 function savePending(){if(!code)return;try{if(queue.length)localStorage.setItem(pendingKey(code),JSON.stringify(queue));else localStorage.removeItem(pendingKey(code));}catch(e){console.warn('Unable to save pending changes locally',e);}}
 function loadPending(roomCode){try{const parsed=JSON.parse(localStorage.getItem(pendingKey(roomCode))||'[]');return Array.isArray(parsed)?parsed.filter(q=>q&&typeof q.id==='string'&&Array.isArray(q.ops)).slice(0,300):[];}catch{return [];}}
 const notify=s=>{status=s;syncStatus();};
 function renderMembers(){const box=$('liveMembers');if(!box)return;box.replaceChildren();box.hidden=!code||!members.length;
   for(const member of members.slice(0,6)){
    const chip=document.createElement('span');chip.className='live-member'+(member.id===CLIENT_ID?' is-you':'');chip.title=member.name+(member.id===CLIENT_ID?' (you)':'');chip.setAttribute('aria-label',chip.title);
    chip.textContent=(member.name||'?').trim().charAt(0).toUpperCase();box.append(chip);
   }
   if(members.length>6){const extra=document.createElement('span');extra.className='live-member extra';extra.textContent='+'+(members.length-6);box.append(extra);}
 }
 function syncStatus(){const b=$('liveStatus'),share=$('liveShareButton');if(!b)return;
  const suffix=queue.length?` · ${queue.length} ${tx('unsaved').toLowerCase()}`:'';
  b.textContent=status==='local'?tx('local'):status==='connected'?`${tx('connected')} · ${presence} ${tx('people')}${suffix}`:tx(status)+suffix;
  b.dataset.status=status;if(share)share.textContent=code?`◉ ${tx('room')}: ${code.slice(0,4)}…`:`✣ ${tx('share')}`;
  const badge=$('liveRoomBadge');if(badge){badge.hidden=!code;badge.textContent=code||'';}
  const meta=document.querySelector('[data-i18n="projectWorkspace"]');if(meta)meta.textContent=code?(api.lang()==='th'?'พื้นที่ทำงานร่วมกัน':'Shared workspace'):(api.lang()==='th'?'พื้นที่ทำงานส่วนตัว':'Private workspace');
  const caption=document.querySelector('[data-i18n="projectAutoSave"]');if(caption)caption.textContent=code?(queue.length?tx('unsaved'):(api.lang()==='th'?'ซิงก์กับทีมผ่านเซิร์ฟเวอร์':'Changes synchronised with your team')):(api.lang()==='th'?'บันทึกบนอุปกรณ์นี้':'Changes saved on this device');
  const indicator=$('saveIndicator')?.querySelector('span:last-child');if(indicator&&code)indicator.textContent=queue.length?tx('unsaved'):tx('saved');
  const bar=$('liveConflictBar');if(bar){bar.hidden=!conflict;$('liveConflictMessage').textContent=conflict?.rejected?tx('rejected'):tx('review');$('liveKeepMine').hidden=!!conflict?.rejected;$('liveKeepMine').textContent=tx('keepMine');$('liveKeepTeam').textContent=tx('keepTeam');}
  renderMembers();const modal=$('liveModal');if(modal?.classList.contains('show'))fillModal();
 }
 function saveSnapshot(){api.saveLocal();api.render();syncStatus();}
 function resetConnection(){generation++;clearTimeout(retryTimer);if(source){source.close();source=null;}code=null;roomProjectId=null;server=null;queue=[];localBase=null;running=false;presence=0;members=[];conflict=null;notify('local');}
 function optimistic(){if(!server)return null;let p=clone(server.project);for(const q of queue){try{p=applyOps(p,q.ops,{force:true});}catch(e){console.warn('Queued operation needs review',e);}}
  return p;}
 // Capture a local edit before applying a remote snapshot, even if a DOM event was delayed.
 function captureLocal(){if(!code||!localBase||api.getProject()?.id!==roomProjectId)return;
  const current=api.getProject(),ops=diffProject(localBase,current);if(!ops.length)return;
  localBase=clone(current);queue.push({ops,id:randomId()});savePending();syncStatus();}
 function incoming(data){if(!code||!data?.project||data.project.id!==roomProjectId)return;
  if(server&&data.revision<server.revision)return;
  captureLocal();server={revision:data.revision,project:clone(data.project)};
  const project=optimistic();if(!project)return;
  if(api.getProject()?.id===roomProjectId){if(JSON.stringify(api.getProject())!==JSON.stringify(project)){api.replaceProject(project);localBase=clone(project);saveSnapshot();}else localBase=clone(project);}
  if(!conflict&&queue.length)pump();syncStatus();
 }
 async function request(route,options={}){
  const res=await fetch(base+route,{cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  let data;try{data=await res.json();}catch{data={error:`HTTP ${res.status}`};}
  if(!res.ok){const err=Error(data.error||`HTTP ${res.status}`);err.status=res.status;err.payload=data;throw err;}return data;
 }
 function connection(roomCode,project,revision){resetConnection();code=roomCode;roomProjectId=project.id;server={project:clone(project),revision};localBase=clone(project);queue=loadPending(code);notify('connecting');
  const token=generation;const params=new URLSearchParams({client:CLIENT_ID,name:displayName});
  source=new EventSource(base+`/api/rooms/${encodeURIComponent(code)}/events?`+params.toString());
  source.addEventListener('snapshot',event=>{if(token!==generation)return;try{incoming(JSON.parse(event.data));notify(conflict?'conflict':'connected');}catch(e){console.error('Bad server snapshot',e);}});
  source.addEventListener('presence',event=>{if(token!==generation)return;try{const data=JSON.parse(event.data);presence=data.count||0;members=data.members||[];syncStatus();}catch{}});
  source.onopen=()=>{if(token===generation){notify(conflict?'conflict':'connected');pump();}};
  source.onerror=()=>{if(token===generation&&!conflict)notify('offline');};
  incoming({revision,project});
 }
 async function openExisting(roomCode,remember=true){const data=await request('/api/rooms/'+roomCode);
  api.upsertProject(clone(data.project));if(remember){mapping[data.project.id]=roomCode;persistMap();}
  connection(roomCode,data.project,data.revision);api.render();syncStatus();return data;
 }
 async function createRoom(){const btn=$('liveCreate');btn.disabled=true;try{const p=api.getProject(),data=await request('/api/rooms',{method:'POST',body:JSON.stringify({project:p})});
  mapping[p.id]=data.code;persistMap();connection(data.code,data.project,data.revision);hideModal();showModal();
 }catch(e){alert(tx('createFailed')+'\n'+e.message);}finally{btn.disabled=false;}}
 async function joinRoom(roomCode){roomCode=String(roomCode||'').toUpperCase().replace(/[\s-]/g,'');if(!CODE_RE.test(roomCode)){alert(tx('codeError'));return;}
  const btn=$('liveJoin');btn.disabled=true;try{await openExisting(roomCode);hideModal();showModal();}catch(e){alert(tx('error')+'\n'+e.message);}finally{btn.disabled=false;}}
 function onLocalChange(){captureLocal();pump();}
 async function pump(){if(running||!queue.length||!code||conflict)return;running=true;const activeCode=code,token=generation;
  try{while(queue.length&&code===activeCode&&token===generation&&!conflict){const change=queue[0];
   const data=await request(`/api/rooms/${activeCode}/changes`,{method:'POST',body:JSON.stringify({clientId:CLIENT_ID,changeId:change.id,ops:change.ops})});
   if(code!==activeCode||token!==generation)return;
   queue.shift();savePending();incoming(data);notify('connected');
  }}catch(e){if(code!==activeCode||token!==generation)return;
   if(e.status===409&&Array.isArray(e.payload?.conflicts)){
    conflict={details:e.payload.conflicts};incoming(e.payload);notify('conflict');
   }else if(e.status&&e.status>=400&&e.status<500&&e.status!==429){conflict={details:[],rejected:true};notify('conflict');console.error('Change was rejected:',e);}
   else{notify('offline');console.warn('Pending changes will retry:',e);retryTimer=setTimeout(()=>{if(token===generation)pump();},3000);}
  }finally{if(token===generation)running=false;}
 }
 function resolveConflict(keepMine){if(!conflict||!server||keepMine&&conflict.rejected)return;
  const current=server.project;
  if(keepMine){let preview=clone(current);
   try{for(const q of queue)preview=applyOps(preview,q.ops,{force:true});}catch(e){alert(e.message);return;}
   const ops=diffProject(current,preview);queue=ops.length?[{id:randomId(),ops}]:[];
  }else{
   if(queue.length){const indices=new Set(conflict.details.map(c=>c.index));
    if(indices.size){queue[0].ops=queue[0].ops.filter((_,i)=>!indices.has(i));queue=queue.filter(q=>q.ops.length);}
    else queue.shift();
   }
  }
  conflict=null;savePending();incoming({revision:server.revision,project:server.project});notify('connecting');pump();
 }
 async function onRender(){syncStatus();const p=api.getProject();if(!p)return;
  const target=mapping[p.id];if(code&&roomProjectId!==p.id){if(queue.length)savePending();resetConnection();}
  if(target&&(!code||code!==target)&&!startup){startup=true;try{await openExisting(target,false);}catch{notify('offline');}finally{startup=false;}}
 }
 async function fromHash(){const match=(location.hash||'').match(/(?:^#|&)room=([A-Z2-9-]+)/i);if(!match)return;
  const value=match[1].toUpperCase().replace(/-/g,'');history.replaceState(null,'',location.pathname+location.search);await joinRoom(value);
 }
 async function copy(text){try{await navigator.clipboard.writeText(text);}catch{const input=document.createElement('textarea');input.value=text;document.body.append(input);input.select();document.execCommand('copy');input.remove();}$('copyFeedback').textContent=tx('copied');}
 function fillModal(){const hasRoom=!!code;
  $('liveHeading').textContent=tx('title');$('liveSubtitle').textContent=tx('sub');$('liveRoomPanel').hidden=!hasRoom;$('liveJoinPanel').hidden=hasRoom;
  for(const [id,key] of [['liveCreate','create'],['liveJoin','join'],['liveCodeLabel','code'],['liveCodeHint','codeHint'],['liveCopyLink','link'],['liveCopyCode','copyCode'],['liveExit','leave'],['liveCopyLocal','localCopy'],['liveSecurity','security'],['liveCancel','close'],['liveNameLabel','you']])$(id).textContent=tx(key);
  $('liveAccessInput').placeholder=tx('paste');$('liveRoomCode').textContent=code||'';$('liveYourName').value=displayName;
 }
 function showModal(){fillModal();$('liveModal').classList.add('show');$('liveModal').setAttribute('aria-hidden','false');}
 function hideModal(){$('liveModal').classList.remove('show');$('liveModal').setAttribute('aria-hidden','true');}
 function leaveRoom(){if(!code)return;if(queue.length||conflict){alert(tx('leavePending'));return;}if(!confirm(tx('leaveConfirm')))return;
  delete mapping[roomProjectId];persistMap();resetConnection();saveSnapshot();hideModal();}
 function privateCopy(){const p=api.getProject(),copy=clone(p);copy.id=randomId();copy.title=p.title+' ('+(api.lang()==='th'?'ส่วนตัว':'Private copy')+')';api.upsertProject(copy);hideModal();alert(tx('localCopyDone'));}
 function setName(value){const next=value.replace(/[<>\x00-\x1f]/g,'').trim().slice(0,40)||'Guest';if(next===displayName||conflict)return;displayName=next;try{localStorage.setItem(NAME_KEY,displayName);}catch{}
  if(code&&server){const oldCode=code,oldProject=clone(server.project),rev=server.revision,pending=[...queue];savePending();connection(oldCode,oldProject,rev);queue=pending;savePending();incoming({revision:rev,project:oldProject});}}
 function init(){ $('liveShareButton').addEventListener('click',showModal);
  $('liveCancel').addEventListener('click',hideModal);$('liveBackdrop').addEventListener('click',hideModal);$('liveCreate').addEventListener('click',createRoom);
  $('liveJoin').addEventListener('click',()=>joinRoom($('liveAccessInput').value));$('liveAccessInput').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom(e.target.value);});
  $('liveCopyLink').addEventListener('click',()=>copy(location.origin+location.pathname+'#room='+code));$('liveCopyCode').addEventListener('click',()=>copy(code));
  $('liveExit').addEventListener('click',leaveRoom);$('liveCopyLocal').addEventListener('click',privateCopy);
  $('liveYourName').addEventListener('change',e=>setName(e.target.value));
  $('liveKeepMine').addEventListener('click',()=>resolveConflict(true));$('liveKeepTeam').addEventListener('click',()=>resolveConflict(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideModal();});
  root.addEventListener('online',()=>{if(code&&!conflict)pump();});
  root.addEventListener('beforeunload',e=>{if(queue.length){e.preventDefault();e.returnValue='';}});
  syncStatus();setTimeout(fromHash,0);
 }
 return {init,onRender,onLocalChange,syncStatus};
}
root.BowtieTogether=makeClient;
})(window);
