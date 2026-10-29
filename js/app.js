(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem('gim_'+k))??d}catch{return d}},SV=(k,v)=>localStorage.setItem('gim_'+k,JSON.stringify(v));
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D={endpoint:'',model:'',system:'You are Corvus, a calm, precise assistant with a faint spectral flair. Be accurate and useful.',w:50,motion:true,video:true,fs:16,hc:false,sb:false};
const S={...D,...LS('set',{})},save=()=>SV('set',S);
let sessions=LS('sess',[]),cur=null,busy=false,ctrl=null,timer=null;
const ST={reach:'Checking',models:[],lat:null,err:'',gens:0,reqs:0,dur:null,ver:''};
const base=()=>S.endpoint.replace(/\/$/,'');
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2800)};
const IC={seance:'<circle cx="12" cy="12" r="9"/><path d="M8 14c1 2 7 2 8 0M9 10h.01M15 10h.01"/>',add:'<path d="M12 5v14M5 12h14"/>',vault:'<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="12" cy="12" r="3"/>',archive:'<path d="M4 6h16v4H4zM6 10v8h12v-8M10 14h4"/>',summon:'<path d="M12 3l2 6 6 .5-4.5 4 1.5 6.5-5-3.5-5 3.5 1.5-6.5L4 9.5 10 9z"/>',studio:'<path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3"/>',diag:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',about:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',open:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7-2"/>',power:'<path d="M12 3v9M6.5 6.5a8 8 0 1 0 11 0"/>',flower:'<circle cx="12" cy="12" r="2"/><path d="M12 10c-2-4 0-7 0-7s2 3 0 7m0 4c2 4 0 7 0 7s-2-3 0-7m-2-2c-4 2-7 0-7 0s3-2 7 0m4 0c4-2 7 0 7 0s-3 2-7 0"/>'};
const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;

/* media slots */
const get=p=>p.split('.').reduce((o,k)=>o?.[k],MEDIA);
function applyMedia(root=document){root.querySelectorAll('[data-media]').forEach(el=>{const s=get(el.dataset.media);if(!s){el.hidden=true;return}el.hidden=false;if(el.getAttribute('src')!==s)el.src=s;el.onerror=()=>{el.hidden=true};if(el.tagName==='VIDEO')el.play?.().catch(()=>{})});
 const l=$('.brand img');$('.brand svg').style.display=l&&!l.hidden?'none':''}
function gallery(id,arr,label){const n=Math.max(4,arr.length);$(id).innerHTML=Array.from({length:n},(_,i)=>{const s=arr[i];return s?(/\.(mp4|webm)$/i.test(s)?`<video src="${esc(s)}" muted loop autoplay playsinline></video>`:`<img src="${esc(s)}" alt="${label} ${i+1}" loading="lazy">`):`<div class="slot">Media slot<br>${label}[${i}]</div>`}).join('')}
const FEAT=[['lock','Private conversations','Prompts go to your own Ollama runtime. Archives stay in your browser.'],['open','Open-weight intelligence','Run Gemma or any compatible model you have installed.'],['vault','Personal archive','Search, rename, reopen and export every session.'],['settings','Customisable behaviour','Edit the system prompt and generation options per task.'],['power','Offline-capable','Works without internet once Ollama and a model are installed.'],['flower','Living atmosphere','Slide between Halloween shadow and marigold warmth.']];
$('#fgrid').innerHTML=FEAT.map((f,i)=>`<article class="card"><img data-media="featureCards.${i}" alt="${f[1]}">${ic(f[0])}<h3>${f[1]}</h3><p>${f[2]}</p></article>`).join('');
gallery('#g1',MEDIA.halloweenGallery,'halloweenGallery');gallery('#g2',MEDIA.diaDeLosMuertosGallery,'diaDeLosMuertosGallery');

/* sidebar */
const NAV=[['seance','The Séance','seance'],['new','New Session','add'],['vault','Memory Vault','vault'],['archive','The Archive','archive'],['summon','Summoning Chamber','summon'],['studio','Whisper Studio','studio'],['diag','System Diagnostics','diag'],['settings','Settings','settings'],['about','About the Machine','about']];
$('#snav').innerHTML=NAV.map(n=>`<a href="#/${n[0]==='new'?'seance':n[0]}" data-r="${n[0]}" title="${n[1]}">${ic(n[2])}<span>${n[1]}</span></a>`).join('');

/* modal */
const modal=(t,h,ok='Confirm')=>new Promise(r=>{const d=$('#dlg');$('#dt').textContent=t;$('#db').innerHTML=h;$('#dok').textContent=ok;d.onclose=()=>r(d.returnValue==='ok');d.showModal()});
const dl=(name,txt,type='application/json')=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};

/* ollama */
async function errText(r){let t=await r.text();try{t=JSON.parse(t).error||t}catch{}return t||r.statusText}
async function stream(body,onTok,signal){
 ST.reqs++;const r=await fetch(base()+'/api/chat',{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,stream:true})});
 if(!r.ok)throw new Error(await errText(r));
 const rd=r.body.getReader(),dec=new TextDecoder();let buf='';
 const line=l=>{if(!l.trim())return;const j=JSON.parse(l);if(j.error)throw new Error(j.error);if(j.message?.content)onTok(j.message.content)};
 for(;;){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});const p=buf.split('\n');buf=p.pop();p.forEach(line)}
 line(buf)}
async function refresh(){
 ST.reach='Checking';paint();const t=performance.now();
 try{const r=await fetch(base()+'/api/tags');if(!r.ok)throw new Error(await errText(r));const j=await r.json();ST.lat=Math.round(performance.now()-t);ST.models=j.models||[];ST.reach='Connected';ST.err='';
  try{ST.ver=(await(await fetch(base()+'/api/version')).json()).version||''}catch{}
  const n=ST.models.map(m=>m.name);if(!n.includes(S.model)){S.model=n.find(x=>/gemma/i.test(x))||n[0]||'';save()}
 }catch(e){ST.reach='Disconnected';ST.models=[];ST.err=e.message==='Failed to fetch'?'Network error — is the launcher running and Ollama started? (CORS if using a direct endpoint)':e.message}
 paint()}
const ready=()=>ST.reach==='Connected'&&ST.models.some(m=>m.name===S.model);
function state(){return ST.reach==='Connected'&&!ready()?'Model unavailable':ST.reach}
const bd=(id,txt,cls)=>{const e=$(id);e.textContent=txt;e.className='badge '+cls};
function paint(){
 const s=state();bd('#b-oll','Ollama: '+s,s==='Connected'?'ok':s==='Checking'?'wait':'bad');
 bd('#b-mod','Model: '+(S.model||'none selected'),S.model?'ok':'wait');
 bd('#b-inf','Local inference: '+(ready()?'Ready':'Not ready'),ready()?'ok':'bad');
 const loc=!S.endpoint||/\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(S.endpoint);
 bd('#b-prv',loc?'Privacy: prompts stay on this machine':'Privacy: remote endpoint set',loc?'ok':'bad');
 bd('#b-net','Network: '+(navigator.onLine?'online':'offline')+' (not required for inference)','wait');
 const ms=$('#msel');ms.innerHTML=ST.models.length?ST.models.map(m=>`<option ${m.name===S.model?'selected':''}>${esc(m.name)}</option>`).join(''):'<option value="">No models</option>';
 $('#sinfo').innerHTML=`Endpoint: <code>${esc(S.endpoint||'this server → Ollama proxy')}</code> · Status: <b>${s}</b>${ST.ver?' · Ollama '+esc(ST.ver):''}${ST.err?`<br><span class="err">${esc(ST.err)}</span>`:''}`;
 $('#slist').innerHTML=ST.models.map(m=>`<div class="card row ${m.name===S.model?'sel':''}"><div><b>${esc(m.name)}</b><small>${m.size?(m.size/1e9).toFixed(1)+' GB':''}</small></div><button data-pick="${esc(m.name)}">${m.name===S.model?'Selected':'Use'}</button></div>`).join('');
 const R=[['Ollama reachable',s],['Selected model',S.model||'—'],['Model installed',ready()?'Yes':'No'],['Tags latency',ST.lat!=null?ST.lat+' ms':'—'],['App assets (service worker)',navigator.serviceWorker?.controller?'Cached':'Not cached yet'],['Requests / completed generations',ST.reqs+' / '+ST.gens],['Last generation time',ST.dur!=null?(ST.dur/1000).toFixed(1)+' s':'—'],['Last error',ST.err||'None']];
 $('#dtab').innerHTML=R.map(r=>`<tr><td>${r[0]}</td><td>${esc(r[1])}</td></tr>`).join('')}

/* markdown (escape first, so model output can't inject HTML) */
function md(t){const b=[];t=t.replace(/```(\w*)\n?([\s\S]*?)(```|$)/g,(_,l,c)=>{b.push(`<div class="code"><div class="ch"><span>${esc(l||'code')}</span><button data-copy>Copy code</button></div><pre><code>${esc(c)}</code></pre></div>`);return`\u0000${b.length-1}\u0000`});
 return esc(t).replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/^#{1,3} (.+)$/gm,'<h4>$1</h4>').replace(/^[-*] (.+)$/gm,'<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g,m=>`<ul>${m.replace(/\n/g,'')}</ul>`).replace(/\n/g,'<br>').replace(/\u0000(\d+)\u0000/g,(_,i)=>b[i])}

/* chat */
const think='<span class="think"><i></i><i></i><i></i><img data-media="loadingAnimation" class="la" alt=""></span>';
const EMPTY=`<div class="empty"><img data-media="chatEmpty" alt="">${ic('seance')}<h3>The line is open</h3><p>Ask anything. Replies stream from <b id="em"></b> on your machine.</p></div>`;
function bubble(m,i){const last=i===cur.msgs.length-1;return`<article class="m ${m.role}" data-i="${i}"><div class="mh">${m.role==='user'?'You':'Corvus'} · ${new Date(m.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div><div class="mb">${m.role==='user'?esc(m.content).replace(/\n/g,'<br>'):md(m.content)||(m.error?'':think)}</div>${m.error?`<div class="err">${esc(m.error)} <button data-regen>Retry</button></div>`:''}${m.role==='assistant'&&m.content?`<div class="ma"><button data-cpm>Copy</button>${last&&!busy?'<button data-regen>Regenerate</button>':''}</div>`:''}</article>`}
function renderMsgs(){const el=$('#msgs');el.innerHTML=cur&&cur.msgs.length?cur.msgs.map(bubble).join(''):EMPTY;if(!cur||!cur.msgs.length)$('#em').textContent=S.model||'a local model';applyMedia(el);el.scrollTop=el.scrollHeight;$('#ctitle').textContent=cur?.title||'New séance'}
function upd(){const el=$('#msgs'),n=el.querySelector('.m:last-child .mb');if(!n)return;const near=el.scrollHeight-el.scrollTop-el.clientHeight<120;n.innerHTML=md(cur.msgs.at(-1).content)||think;if(near)el.scrollTop=el.scrollHeight}
function ui(){$('#send').hidden=busy;$('#stop').hidden=!busy;$('#inp').disabled=busy;$('#msel').disabled=busy;clearInterval(timer);if(busy){const t0=Date.now();timer=setInterval(()=>$('#tm').textContent=((Date.now()-t0)/1000).toFixed(1)+' s',200)}else if(ST.dur!=null)$('#tm').textContent='last: '+(ST.dur/1000).toFixed(1)+' s'}
function persist(){if(cur&&cur.msgs.length){if(!sessions.includes(cur))sessions.unshift(cur);SV('sess',sessions)}}
function newSession(){if(busy)return toast('Wait for the reply, or press Stop.');cur={id:crypto.randomUUID(),title:'New séance',created:Date.now(),msgs:[]};renderMsgs();ui()}
async function send(text,re){
 if(busy)return;if(!S.model){toast('Pick a model in the Summoning Chamber first.');location.hash='#/summon';return}
 if(!cur)newSession();
 if(!re){text=(text||'').trim();if(!text)return;cur.msgs.push({role:'user',content:text,t:Date.now()});if(cur.msgs.length===1)cur.title=text.slice(0,48)}
 const a={role:'assistant',content:'',t:Date.now()};cur.msgs.push(a);busy=true;ctrl=new AbortController();ui();renderMsgs();
 const t0=performance.now(),hist=cur.msgs.slice(0,-1).map(({role,content})=>({role,content}));
 try{await stream({model:S.model,messages:[{role:'system',content:S.system},...hist]},c=>{a.content+=c;upd()},ctrl.signal);ST.gens++;ST.dur=Math.round(performance.now()-t0);ST.err=''}
 catch(e){if(e.name!=='AbortError'){a.error=e.message==='Failed to fetch'?'Could not reach Ollama.':e.message;ST.err=a.error;refresh()}}
 if(!a.content&&!a.error)cur.msgs.pop();
 busy=false;ctrl=null;persist();ui();renderMsgs();paint()}
function regen(){if(busy)return;if(cur.msgs.at(-1)?.role==='assistant')cur.msgs.pop();if(cur.msgs.at(-1)?.role==='user')send(null,true)}
const mdExport=s=>`# ${s.title}\n\n`+s.msgs.map(m=>`**${m.role==='user'?'You':'Corvus'}** (${new Date(m.t).toLocaleString()}):\n\n${m.content}\n`).join('\n');
$('#comp').onsubmit=e=>{e.preventDefault();const v=$('#inp').value;if(!v.trim()||busy)return;$('#inp').value='';$('#inp').style.height='';send(v)};
$('#inp').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!matchMedia('(pointer:coarse)').matches){e.preventDefault();$('#comp').requestSubmit()}};
$('#inp').oninput=e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,180)+'px'};
$('#stop').onclick=()=>ctrl?.abort();
$('#msel').onchange=e=>{S.model=e.target.value;save();paint()};
$('#msgs').onclick=e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.copy)navigator.clipboard.writeText(b.closest('.code').querySelector('code').textContent).then(()=>toast('Code copied'));
 if('cpm' in b.dataset)navigator.clipboard.writeText(cur.msgs[b.closest('.m').dataset.i].content).then(()=>toast('Copied'));
 if('regen' in b.dataset)regen()};
$('#bsys').onclick=async()=>{if(await modal('System prompt',`<textarea id="sp"></textarea>`,'Save')){S.system=$('#sp').value;save();toast('System prompt saved')}};
$('#bexp').onclick=()=>{if(!cur?.msgs.length)return toast('Nothing to export yet.');const j=confirm('OK = Markdown, Cancel = JSON');j?dl(cur.title+'.md',mdExport(cur),'text/markdown'):dl(cur.title+'.json',JSON.stringify(cur,null,2))};
$('#bclr').onclick=async()=>{if(!cur?.msgs.length||busy)return;if(await modal('Clear conversation?','<p>This removes the messages from this session and its saved copy.</p>','Clear')){sessions=sessions.filter(s=>s!==cur);SV('sess',sessions);newSession()}};
$('#bsys').addEventListener('click',()=>setTimeout(()=>{const t=$('#sp');if(t)t.value=S.system},0));

/* vault */
function vault(){const q=$('#vq').value.toLowerCase(),l=sessions.filter(s=>!q||(s.title+' '+s.msgs.map(m=>m.content).join(' ')).toLowerCase().includes(q));
 $('#vlist').innerHTML=l.length?l.map(s=>`<div class="card row" data-id="${s.id}"><div><b>${esc(s.title)}</b><small>${new Date(s.created).toLocaleString()} · ${s.msgs.length} messages</small></div><div class="row"><button data-o>Open</button><button data-n>Rename</button><button data-x>Export</button><button data-d>Delete</button></div></div>`).join(''):'<p class="note">Nothing here yet. Talk in the Séance and sessions appear here automatically.</p>'}
$('#vq').oninput=vault;
$('#vlist').onclick=async e=>{const b=e.target.closest('button'),c=e.target.closest('[data-id]');if(!b)return;const s=sessions.find(x=>x.id===c.dataset.id);
 if('o' in b.dataset){if(busy)return toast('Wait for the reply, or press Stop.');cur=s;location.hash='#/seance'}
 if('n' in b.dataset&&await modal('Rename session',`<input id="rn" value="${esc(s.title)}">`,'Rename')){s.title=($('#rn').value.trim()||s.title).slice(0,80);SV('sess',sessions);vault()}
 if('x' in b.dataset)dl(s.title+'.md',mdExport(s),'text/markdown');
 if('d' in b.dataset&&await modal('Delete session?',`<p>"${esc(s.title)}" will be removed from this browser.</p>`,'Delete')){sessions=sessions.filter(x=>x!==s);if(cur===s)cur=null;SV('sess',sessions);vault()}};

/* summon / diag */
$('#slist').onclick=e=>{const b=e.target.closest('[data-pick]');if(b){S.model=b.dataset.pick;save();paint();toast('Model: '+S.model)}};
$('#sref').onclick=()=>refresh();$('#stest').onclick=async()=>{await refresh();toast(state())};$('#dtest').onclick=$('#stest').onclick;

/* studio */
let yc=null,saved=LS('studio',[]);
function ysaved(){$('#ysaved').innerHTML=saved.map((s,i)=>`<div class="card"><small>${esc(s.model)} · temp ${s.temp} · ${new Date(s.t).toLocaleString()}</small><p><b>${esc(s.prompt.slice(0,80))}</b></p><pre class="out">${esc(s.out)}</pre><button data-yd="${i}">Delete</button></div>`).join('')||'<p class="note">Saved generations appear here side by side.</p>'}
$('#yt').oninput=e=>$('#ot').textContent=e.target.value;
$('#yrun').onclick=async()=>{if(!S.model)return toast('Pick a model first.');const p=$('#yp').value.trim();if(!p||yc)return;yc=new AbortController();$('#yrun').hidden=true;$('#ystop').hidden=false;const o=$('#yout');o.textContent='';
 try{await stream({model:S.model,messages:[{role:'system',content:$('#ysys').value},{role:'user',content:p}],options:{temperature:+$('#yt').value,num_predict:+$('#yn').value}},c=>o.textContent+=c,yc.signal)}catch(e){if(e.name!=='AbortError')o.textContent+='\n[Error] '+e.message}
 yc=null;$('#yrun').hidden=false;$('#ystop').hidden=true};
$('#ystop').onclick=()=>yc?.abort();
$('#ysave').onclick=()=>{const out=$('#yout').textContent;if(!out)return toast('Generate something first.');saved.unshift({t:Date.now(),model:S.model,temp:$('#yt').value,prompt:$('#yp').value,out});SV('studio',saved.slice(0,12));saved=saved.slice(0,12);ysaved()};
$('#ysaved').onclick=e=>{const b=e.target.closest('[data-yd]');if(b){saved.splice(+b.dataset.yd,1);SV('studio',saved);ysaved()}};

/* settings */
function apply(){const r=document.documentElement;r.style.setProperty('--w',S.w+'%');r.style.fontSize=S.fs+'px';document.body.classList.toggle('hc',S.hc);document.body.classList.toggle('calm',!S.motion||matchMedia('(prefers-reduced-motion:reduce)').matches);document.body.classList.toggle('sbc',S.sb);
 $$('video[data-media]').forEach(v=>{const ok=S.video&&!document.body.classList.contains('calm')&&!v.hidden;v.style.display=S.video?'':'none';ok?v.play().catch(()=>{}):v.pause()})}
const B=[['#s-hc','hc','checked'],['#s-mo','motion','checked'],['#s-vi','video','checked'],['#s-sb','sb','checked'],['#s-w','w','value'],['#s-fs','fs','value'],['#s-ep','endpoint','value']];
B.forEach(([id,k,p])=>{const e=$(id);e[p]=S[k];e.onchange=()=>{S[k]=p==='checked'?e.checked:(k==='endpoint'?e.value.trim():+e.value);save();apply();if(k==='endpoint')refresh()};if(e.type==='range')e.oninput=e.onchange});
$('#s-exp').onclick=()=>dl('corvus-data.json',JSON.stringify({settings:S,sessions,studio:saved},null,2));
$('#s-clr').onclick=async()=>{if(await modal('Delete all local data?','<p>Sessions, saved outputs and settings in this browser will be erased. Export first if you want a backup.</p>','Delete everything')){Object.keys(localStorage).filter(k=>k.startsWith('gim_')).forEach(k=>localStorage.removeItem(k));location.reload()}};

/* router */
const APP=new Set(['seance','vault','archive','summon','studio','diag','settings','about']);
function route(){const h=location.hash.replace(/^#\/?/,''),app=APP.has(h);$('#pub').hidden=app;$('.app').hidden=!app;document.body.classList.toggle('inapp',app);
 $$('.view').forEach(v=>v.classList.remove('on'));$('#v-'+(app?(h==='archive'?'vault':h):h==='install'?'install':'home')).classList.add('on');
 $$('#tnav a,#snav a').forEach(a=>a.removeAttribute('aria-current'));
 $$('#tnav a').forEach(a=>{if(a.getAttribute('href')==='#/'+h||(!h&&a.getAttribute('href')==='#/'))a.setAttribute('aria-current','page')});
 const sa=$(`#snav a[data-r="${h}"]`);sa?.setAttribute('aria-current','page');
 $('#tnav').classList.remove('open');$('#side').classList.remove('open');
 if(h==='features')$('#features').scrollIntoView();else if(!app)scrollTo(0,0);
 if(h==='seance'){if(!cur)newSession();renderMsgs();$('#inp').focus()}
 if(h==='vault'||h==='archive'){$('#vh').textContent=h==='archive'?'The Archive':'Memory Vault';vault();if(h==='archive')$('#vq').focus()}
 if(h==='summon'||h==='diag')refresh();
 applyMedia();apply()}
$('#snav').onclick=e=>{const a=e.target.closest('a');if(a?.dataset.r==='new'){e.preventDefault();newSession();if(location.hash!=='#/seance')location.hash='#/seance';$('#side').classList.remove('open')}};
$('#menu').onclick=()=>(document.body.classList.contains('inapp')?$('#side'):$('#tnav')).classList.toggle('open');
addEventListener('hashchange',route);addEventListener('online',paint);addEventListener('offline',paint);

/* petals */
for(let i=0;i<14;i++){const p=document.createElement('i');p.className='petal';p.style.cssText=`left:${Math.random()*100}%;animation-duration:${10+Math.random()*10}s;animation-delay:${-Math.random()*15}s;--s:${.6+Math.random()*.8}`;$('#petals').appendChild(p)}
if(MEDIA.chatBackground)$('.chat').style.backgroundImage=`linear-gradient(rgba(8,7,13,.86),rgba(8,7,13,.92)),url("${MEDIA.chatBackground}")`;
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
ysaved();paint();route();refresh();
})();
