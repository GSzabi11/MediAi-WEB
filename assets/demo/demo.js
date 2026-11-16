(function(){
'use strict';
var D = window.D, U = D.ui;
var LAB_DATES = ['2025-04-08','2025-10-14','2026-02-03','2026-06-11','2026-10-18'];
var LABS = [
  {id:'ntprobnp', unit:'pg/mL', lo:null, hi:125, v:[1850,1420,1980,2650,3420], code:'33762-6'},
  {id:'egfr', unit:'mL/min/1,73m²', lo:60, hi:null, v:[58,55,52,49,46], code:'62238-1'},
  {id:'krea', unit:'µmol/L', lo:45, hi:84, v:[92,97,104,110,118], code:'2160-0'},
  {id:'k', unit:'mmol/L', lo:3.5, hi:5.1, v:[4.6,4.8,5.0,5.3,5.6], code:'2823-3'},
  {id:'na', unit:'mmol/L', lo:136, hi:145, v:[139,138,135,136,138], code:'2951-2'},
  {id:'hba1c', unit:'%', lo:4.0, hi:6.0, v:[7.4,7.1,7.6,7.9,8.1], code:'4548-4'},
  {id:'hgb', unit:'g/L', lo:120, hi:160, v:[131,128,125,122,118], code:'718-7'},
  {id:'glu', unit:'mmol/L', lo:3.9, hi:6.1, v:[7.8,7.2,8.4,8.9,9.3], code:'1558-6'}
];
LABS.forEach(function(t){ t.m = t.v.map(function(v,i){ return {id:'L'+i+'.'+t.id, d:LAB_DATES[i], v:v, doc:'L'+i}; }); });
/* kvalitatív (szöveges) eredmény: csak táblázatban, a referenciától eltérőt ≠ jelzi */
var TXT = [{id:'uprot', unit:null, code:'2888-6', m:D.uprot.vals.map(function(v,i){ return {id:'L'+i+'.uprot', d:LAB_DATES[i], s:v, doc:'L'+i}; })}];
var DOC_ORDER = ['L0','d6','L1','L2','d9','L3','d7','L4','d8'];
var STEP_TAB = {import:'import', status:'status', history:'history', labs:'labs', consult:'transcript', echo:'transcript', care:'care', research:'research', meds:'meds'};
var S = {step:0, tab:'import', imported:false, consult:0, echo:0, research:0, chatDone:{}, stars:{}, excl:{}, relF:'all', saved:false,
  recSub:'consult', statusGen:2, statusTouched:false, statusStale:false, hist:0, epi:0, ed:{}, care:{det:{}, epi:{c12:true}}, epiSrc:false, histTl:true,
  lab:{name:'', abn:false, per:'mind', view:'diagram', detail:null, form:false, rows:null, doc:'', time:'', tried:false}, labTouched:false, mc:0};
var CH = {};
var $ = function(s,r){return (r||document).querySelector(s);};
var $$ = function(s,r){return [].slice.call((r||document).querySelectorAll(s));};
var esc = function(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var sleep = function(ms){return new Promise(function(r){setTimeout(r,ms);});};
var fast = false;
var tpl = function(s,o){ return String(s).replace(/\{(\w+)\}/g,function(m,k){return o[k]!==undefined?o[k]:m;}); };

/* ---------- ikonok (a valós alkalmazás vonalas készlete, currentColor) ---------- */
var P = {
 doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
 spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
 alert:'<path d="M12 3L2 20h20z"/><path d="M12 10v4M12 17.5v.5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 check:'<path d="M5 12l5 5 9-10"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 stetho:'<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
 flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/>',
 trend:'<path d="M3 17l5-5 4 3 8-8"/><path d="M3 21h18"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 chevronDown:'<path d="M6 9l6 6 6-6"/>',
 chevronUp:'<path d="M6 15l6-6 6 6"/>',
 expandLeft:'<path d="M18 6l-6 6 6 6M11 6l-6 6 6 6"/>',
 plusBox:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10M7 12h10"/>',
 pill:'<path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l6-6a4.95 4.95 0 0 1 7 7z"/><path d="M8.5 8.5l7 7"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
 upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
 download:'<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
 history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5"/><path d="M3.5 3.5v5h5M12 8v4l3 2"/>',
 quote:'<path d="M6 17c2-1 3-3 3-6V7H5v4h4M16 17c2-1 3-3 3-6V7h-4v4h4"/>',
 stop:'<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
 star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M19 19v2H6"/>',
 lock:'<path d="M7 11V8a5 5 0 0 1 10 0v3"/><rect x="5" y="11" width="14" height="10" rx="2"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
 monitor:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'
};
function ic(n,s,w){ s=s||16; return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||2.2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">'+P[n]+'</svg>'; }
var IC = {
 doc:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5a606b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
 lab:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5a606b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/></svg>',
 micB:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>',
 spark:'<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/></svg>',
 check:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f7a45" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
 shield:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a606b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
 star:'<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.6 4.3L18.5 21 12 16.8 5.5 21l2.1-7.7L2 9h7z"/></svg>',
 logo:'<svg width="20" height="20" viewBox="0 0 44 44"><path d="M16 5h12v11h11v12H28v11H16V28H5V16h11z" fill="none" stroke="#910029" stroke-width="5.5" stroke-linejoin="round"/><path d="M16 5h12v11h11v12H28v11H16V28H5V16h11z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>'
};
function typeIcon(t){return t==='lab'?IC.lab:IC.doc;}

/* ---------- segédfüggvények ---------- */
function fmtD(d){return d.indexOf('-')<0?d:D.fmt(d.slice(0,10));}
function fmtDT(d){return d.indexOf('T')<0?fmtD(d):fmtD(d)+' '+d.slice(11,16);}
function fmtV(x){return D.num(x);}
function labIdx(id){return parseInt(id.slice(1),10);}
function docInfo(id){
  if(id.charAt(0)==='L'){return {type:'lab', date:LAB_DATES[labIdx(id)], title:D.dtype.lab, inst:U.lab_inst};}
  return D.docs[id];
}
function nameOf(t){return t.name||(t.id==='uprot'?D.uprot.name:D.tests[t.id]);}
function decOf(v){var s=String(v),i=s.indexOf('.');return i<0?0:Math.min(4,s.length-i-1);}
function tdec(t){return Math.max.apply(null,[0].concat(t.m.map(function(m){return decOf(m.v);}),t.lo!==null?[decOf(t.lo)]:[],t.hi!==null?[decOf(t.hi)]:[]));}
function fmtN(v,d){return D.num(Number(v).toFixed(d));}
function dirOf(t,v){ if(t.lo!==null&&v<t.lo) return 'lo'; if(t.hi!==null&&v>t.hi) return 'hi'; return null; }
function stTxt(t,v){ var r=dirOf(t,v); return r==='hi'?U.lab_above:r==='lo'?U.lab_below:null; }
function flagOf(t,v){ var r=dirOf(t,v); return r==='hi'?'↑':r==='lo'?'↓':''; }
function refTxt(t){ var d=tdec(t); if(t.lo===null) return '< '+fmtN(t.hi,d); if(t.hi===null) return '> '+fmtN(t.lo,d); return fmtN(t.lo,d)+'–'+fmtN(t.hi,d); }
function refStr(t){ if(t.lo===null&&t.hi===null) return ''; return U.ref+' '+refTxt(t); }
function txtDiff(s){ return String(s).trim().toLowerCase()!==String(D.uprot.ref).trim().toLowerCase(); }
function monthLbl(d){return '’'+d.slice(2,4)+'.'+d.slice(5,7);}
function srcLabel(code){
  var p=code.split('.'), id=p[0];
  if(id==='u') return U.rec_doc+' · '+p[1].replace('u','#');
  if(id==='v') return U.echo_doc+' · '+p[1].replace('v','#');
  var di=docInfo(id); var lbl=di.title+' · '+fmtD(di.date);
  if(id.charAt(0)==='L' && p[1]) lbl += ' · '+(p[1]==='uprot'?D.uprot.name:D.tests[p[1]]);
  return lbl;
}
function renderCites(str, list){
  return esc(str).replace(/\{\{([a-zA-Z0-9]+\.[a-zA-Z0-9]+)\}\}/g, function(m,c){
    var n; if(list){ n=list.indexOf(c); if(n<0){list.push(c); n=list.length-1;} n=n+1; } else n='↗';
    return '<button class="cit" data-src="'+c+'" title="'+esc(srcLabel(c))+'">'+n+'</button>';
  });
}
function noCites(s){return String(s).replace(/\s*\{\{[^}]+\}\}/g,'');}
function uncHtml(u){ var n=u==='low'?1:u==='mid'?2:3; return '<span class="unc">'+U.unc+' <i class="'+(n>=1?'f':'')+'"></i><i class="'+(n>=2?'f':'')+'"></i><i class="'+(n>=3?'f':'')+'"></i> '+U[u]+'</span>'; }
function toast(t){var e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(function(){e.remove();},2600);}
function scrollIn(el,sel){var c=el&&el.parentNode&&el.parentNode.closest(sel||'.cbody,.tr,.cmsgs,.mb');if(!c)return;c.scrollTop+=el.getBoundingClientRect().top-c.getBoundingClientRect().top-c.clientHeight/3;}
function scrollTopTo(el){var c=$('#cbody'); if(!c||!el) return; c.scrollTop+=el.getBoundingClientRect().top-c.getBoundingClientRect().top-70;}
function wait(ms){return sleep(fast?Math.min(ms,60):ms);}
function seg(name,val,opts){ return '<div class="seg2" role="group" data-seg="'+name+'">'+opts.map(function(o){return '<button type="button" data-v="'+o[0]+'" class="'+(o[0]===val?'on':'')+'" aria-pressed="'+(o[0]===val)+'">'+o[1]+'</button>';}).join('')+'</div>'; }
function stepIdx(k){var r=-1; D.steps.forEach(function(s,i){if(s[0]===k) r=i;}); return r;}

/* ---------- keret ---------- */
function shell(){
  var p=D.patient, langs=[['hu','HU'],['en','EN'],['de','DE']], cur=D.lang;
  var root = document.body.getAttribute('data-root');
  var langLinks = langs.map(function(l){var href=root+(l[0]==='hu'?'':l[0]+'/')+'demo/index.html';return '<a href="'+href+'" class="'+(l[0]===cur?'on':'')+'">'+l[1]+'</a>';}).join('');
  var site = root+(cur==='hu'?'':cur+'/')+'index.html';
  var embed = /[?&]embed=1/.test(location.search) || window.self!==window.top; if(embed) document.body.classList.add('embed');
  var mail='mailto:ekler.peter@vik.bme.hu?subject='+encodeURIComponent(U.mail_subject);
  var dbar = embed ? '' : '<div class="dbar">'+'<div class="in"><a class="logo" href="'+site+'">'+IC.logo+'MediAI <span>Assistant</span></a><span class="pill red">'+U.demo+'</span><span class="pill ghost">'+U.fict+'</span><div class="sp"></div><a class="lnk" href="'+site+'">← '+U.back+'</a><div class="lang">'+langLinks+'</div><a class="btn red" href="'+mail+'">'+U.req+'</a></div></div>';
  document.getElementById('app').innerHTML =
  dbar+
  '<div class="steps"><div class="in"><div class="srow" id="srow"></div><div class="hint"><p id="hint"></p><button class="btn line" id="prev">← '+U.prev+'</button><button class="btn blue" id="next">'+U.next+' →</button></div></div></div>'+
  '<div class="stage"><div class="app">'+
   '<header class="appbar"><span class="appbar__brand">'+IC.logo.replace(/20/g,'24')+'MediAI</span><nav class="appbar__nav"><a>'+U.patients+'</a><a>'+U.profile+'</a></nav>'+
    '<div class="appbar__right"><div class="seg2 seg2--icon" aria-hidden="true"><button class="on" tabindex="-1">'+ic('monitor')+'</button><button tabindex="-1">'+ic('sun')+'</button><button tabindex="-1">'+ic('moon')+'</button></div>'+
    '<span class="alang"><strong>'+cur.toUpperCase()+'</strong></span><span class="appbar__user">'+ic('stetho')+'<strong>'+esc(D.doctor)+'</strong> · '+U.doctor_role+'</span><span class="abtn abtn--sm">'+U.logout+'</span></div></header>'+
   '<section class="pband" aria-label="'+esc(U.active)+'">'+
    '<div class="pband__field"><span class="pband__label">'+U.active+'</span><span class="pband__name">'+esc(p.name)+'</span></div>'+
    '<div class="pband__field"><span class="pband__label">'+p.idl+'</span><span class="pband__taj">'+p.id+'</span></div>'+
    '<div class="pband__field"><span class="pband__label">'+p.bornl+'</span><span>'+p.born+'</span></div>'+
    '<div class="pband__field"><span class="pband__label">'+p.xl+'</span><span>'+p.x+'</span></div>'+
    '<div class="pband__field"><span class="pband__label">'+U.ctx_label+'</span><button type="button" class="ctxchip" id="ctxchip" title="'+esc(U.ctx_title)+'">'+ic('stetho')+esc(U.ctx_chip)+ic('chevronDown',14)+'</button></div>'+
    '<span class="abtn abtn--dark pband__switch">'+U.change+'</span></section>'+
   '<div class="abody"><aside class="rp srcp" aria-label="'+esc(U.sources)+'"><div class="sources__head"><h2 class="h2s">'+U.sources+'</h2><span class="iconbtn iconbtn--ghost iconbtn--sm push-right" aria-hidden="true">'+ic('expandLeft',18)+'</span></div><div class="srcs" id="srcs"></div></aside>'+
   '<section class="rp wpanel"><div class="ptabs" id="tabs" role="tablist"></div><div class="cbody" id="cbody"></div></section>'+
   '<div class="panel chatp" id="chatp"></div></div>'+
  '</div></div>';
  $('#prev').onclick=function(){go(Math.max(0,S.step-1));};
  $('#next').onclick=function(){ if(S.step<D.steps.length-1) go(S.step+1); else toast(U.end); };
  $('#ctxchip').onclick=function(){toast(U.ctx_toast);};
  document.addEventListener('click', function(e){
    var b=e.target.closest('[data-src]'); if(b){ e.preventDefault(); openSrc(b.getAttribute('data-src')); }
  });
  var rt; window.addEventListener('resize',function(){clearTimeout(rt); rt=setTimeout(function(){ if(S.tab==='labs') drawCharts(); },120);});
}
function renderSteps(){
  $('#srow').innerHTML = D.steps.map(function(s,i){
    var done = isDone(s[0]);
    return '<button class="sb '+(i===S.step?'on':'')+(done&&i!==S.step?' done':'')+'" data-step="'+i+'"><i>'+(done&&i!==S.step?'✓':(i+1))+'</i>'+s[1]+'</button>';
  }).join('');
  $$('.sb').forEach(function(b){b.onclick=function(){go(+b.getAttribute('data-step'));};});
  var s=D.steps[S.step];
  $('#hint').innerHTML='<b>'+U.step+' '+(S.step+1)+'/'+D.steps.length+':</b> '+esc(s[2]);
  $('#prev').disabled = S.step===0;
  $('#next').innerHTML = S.step===D.steps.length-1 ? '✓' : U.next+' →';
  var on=document.querySelector('.sb.on'); if(on){var r=$('#srow'); r.scrollLeft=on.offsetLeft-r.clientWidth/2+on.clientWidth/2;}
}
function isDone(k){
  return {import:S.imported, status:S.statusTouched, history:S.hist===2, labs:S.labTouched, consult:S.consult===2, echo:S.echo===2, research:S.research===2, care:S.epi===2, chat:!!Object.keys(S.chatDone).length, meds:S.check!==null&&S.check!==undefined}[k];
}
function go(i){
  S.step=i; var k=D.steps[i][0];
  if(k!=='import' && !S.imported){ instantImport(); }
  if(k==='consult'||k==='echo') S.recSub=k;
  if(k==='chat'){ setTab(S.tab==='import'?'status':S.tab); var c=$('#chatp'); c.classList.add('glow'); var rc=c.getBoundingClientRect(); if(rc.top>window.innerHeight||rc.bottom<0) c.scrollIntoView({behavior:'smooth',block:'start'}); setTimeout(function(){c.classList.remove('glow');},2600); }
  else setTab(STEP_TAB[k]);
  renderSteps();
}
var TABS=[['import','upload'],['status','spark'],['history','doc'],['labs','trend'],['transcript','mic'],['care','stetho'],['meds','pill'],['research','book']];
function setTab(t){
  S.tab=t;
  $('#tabs').innerHTML = TABS.map(function(x){return '<button type="button" role="tab" aria-selected="'+(x[0]===t)+'" class="ptab'+(x[0]===t?' ptab--on':'')+'" data-tab="'+x[0]+'">'+ic(x[1])+U.tabs[x[0]]+'</button>';}).join('');
  $$('.ptab').forEach(function(b){b.onclick=function(){
    var k=b.getAttribute('data-tab'); var si=-1;
    if(k==='transcript') si=stepIdx(S.recSub);
    else D.steps.forEach(function(s,i){if(STEP_TAB[s[0]]===k && si<0) si=i;});
    if(si>=0){ go(si); } else setTab(k);
  };});
  var f={import:vImport,status:vStatus,history:vHistory,labs:vLabs,transcript:vTranscript,care:vCare,meds:vMeds,research:vResearch}[t];
  $('#cbody').scrollTop=0; f();
}

/* ---------- források (bal oldali panel) ---------- */
function renderSources(){
  var el=$('#srcs');
  var docs = DOC_ORDER.slice().reverse().filter(function(id){return id.charAt(0)!=='L';});
  var labs = DOC_ORDER.slice().reverse().filter(function(id){return id.charAt(0)==='L';});
  if(!S.imported){ docs=[]; labs=[]; }
  var recs=[]; if(S.consult===2) recs.push(['u',U.tabs_rec.consult,'#15']); if(S.echo===2) recs.push(['v',U.tabs_rec.echo,'#16']);
  function grp(title,n,icon,items){
    return '<section class="navgroup"><div class="navgroup__head"><span class="label">'+title+'</span><span class="navgroup__count">'+n+'</span><span class="iconbtn iconbtn--ghost iconbtn--sm push-right" aria-hidden="true">'+ic(icon)+'</span></div>'+
      (n?'<div class="navgroup__list">'+items+'</div>':'<span class="navgroup__empty">'+U.src_none+'</span>')+'</section>';
  }
  var h=grp(U.documents,docs.length,'upload',docs.map(function(id){var d=docInfo(id); return '<a class="navitem" data-src="'+id+'">'+ic('doc')+'<span class="navitem__text"><strong>'+esc(d.title)+'</strong><span class="meta">'+fmtD(d.date)+'</span></span></a>';}).join(''));
  h+=grp(U.labs,labs.length,'upload',labs.map(function(id){var d=docInfo(id); return '<a class="navitem" data-src="'+id+'">'+ic('flask')+'<span class="navitem__text"><strong>'+esc(d.title)+'</strong><span class="meta">'+esc(d.inst)+' · '+fmtD(d.date)+'</span></span></a>';}).join(''));
  h+=grp(U.recordings,recs.length,'mic',recs.map(function(r){return '<a class="navitem" data-rec="'+(r[0]==='u'?'consult':'echo')+'">'+ic('mic')+'<span class="navitem__text"><strong>'+r[1]+' <span class="meta">'+r[2]+'</span></strong><span class="meta">'+fmtD('2026-11-12')+' · '+U.done_l+'</span></span></a>';}).join(''));
  el.innerHTML=h;
  $$('[data-rec]',el).forEach(function(a){a.onclick=function(){go(stepIdx(a.getAttribute('data-rec')));};});
}

/* ---------- import ---------- */
function vImport(){
  var c=$('#cbody');
  c.innerHTML='<div class="tabbody imp"><div class="stack-4"><h2 class="h2s">'+U.imp_title+'</h2><p class="meta">'+U.imp_lead+'</p></div>'+
   (S.imported?'':'<div class="drop" id="drop">'+ic('upload',28,1.8)+'<button class="abtn abtn--primary abtn--lg" id="impb">'+U.imp_btn+'</button></div>')+'<div id="irows" class="irows"></div></div>';
  if(S.imported){ var box=$('#irows'); DOC_ORDER.forEach(function(id){box.appendChild(irow(id,true));}); sumLine(box); return; }
  $('#impb').onclick=runImport;
}
function docVals(id){ if(id.charAt(0)==='L') return 9; return {d6:4,d9:2,d7:4,d8:9}[id]||3; }
function irow(id,done){
  var d=docInfo(id), r=document.createElement('div'); r.className='irow';
  r.innerHTML=(done?'<span>'+IC.check+'</span>':'<span class="spin"></span>')+'<div><b>'+esc(d.title)+'</b> <small class="meta">'+fmtD(d.date)+'</small></div><span class="st">'+(done?U.imp_s2+': '+D.dtype[d.type]:U.imp_s1+'…')+'</span><span class="st c4">'+(done?U.imp_s3+': '+docVals(id)+' '+U.imp_vals:'')+'</span><span class="st c5">'+(done?'<span class="stat stat--kesz">'+U.imp_done+'</span>':'')+'</span>';
  return r;
}
function sumLine(box){
  var s=document.createElement('div'); s.className='sumline'; s.innerHTML=ic('check',16,2.6)+'<span>'+esc(U.imp_sum)+'</span>'; box.appendChild(s);
  var b=document.createElement('div'); b.innerHTML='<button class="abtn abtn--primary">'+U.imp_next+' →</button>'; box.appendChild(b);
  b.firstChild.onclick=function(){go(stepIdx('status'));};
}
async function runImport(){
  $('#drop').style.display='none';
  var box=$('#irows');
  for(var i=0;i<DOC_ORDER.length;i++){
    var id=DOC_ORDER[i], d=docInfo(id);
    var r=irow(id,false); box.appendChild(r);
    await wait(230); r.children[2].textContent=U.imp_s2+': '+D.dtype[d.type];
    await wait(230); r.children[3].textContent=U.imp_s3+': '+docVals(id)+' '+U.imp_vals;
    await wait(200); r.children[0].outerHTML='<span>'+IC.check+'</span>'; r.children[4].innerHTML='<span class="stat stat--kesz">'+U.imp_done+'</span>';
    if(!$('#irows')) { instantImport(); return; }
  }
  S.imported=true; renderSources();
  sumLine(box);
  renderSteps();
}
function instantImport(){ S.imported=true; renderSources(); }

/* ---------- Klinikai státusz ---------- */
function vStatus(){
  var st=D.status;
  var h='<div class="tabbody"><article class="klin">'+
   '<div class="klin__head">'+ic('spark',18)+'<h2 class="h2s">'+U.tabs.status+'</h2><span class="klin__badge">'+ic('spark',12)+U.st_badge+'</span>'+
   '<button type="button" class="abtn abtn--sm push-right" id="stb" '+(S.statusGen===1?'disabled':'')+'>'+ic('history',14)+(S.statusGen===1?U.st_making:S.statusGen===2?U.st_refresh:U.st_make)+'</button></div>';
  /* gyógyszer-interakciók: a szabálymotor állításai */
  var inter=activeInter(), fontos=inter.filter(function(x){return x[0]==='crit'||x[0]==='major'||x[0]==='mod';}), tobbi=inter.length-fontos.length;
  if(fontos.length){
    h+='<section class="klin__ddi"><span class="klin__label">'+ic('alert',14,2.4)+U.st_ddi+'</span><ul>'+fontos.map(function(x){return '<li class="ddirow '+tone(x[0])+'"><span class="sevtag">'+U.sev[x[0]]+'</span><span>'+esc(x[1])+'</span></li>';}).join('')+'</ul>'+
     '<a class="klin__ddilink" href="#" data-go="meds">'+(tobbi?tpl(U.st_ddi_more,{n:tobbi})+' · ':'')+U.st_ddi_link+'</a></section>';
  }
  if(S.statusGen===0) h+='<p class="meta">'+U.st_empty+'</p>';
  if(S.statusGen===1) h+='<div class="prog"><p class="meta" role="status">'+U.st_wait+'</p><div class="bar"><i id="stbar"></i></div></div>';
  if(S.statusGen===2){
    h+='<p class="meta">'+U.st_period+' · '+U.st_made+' '+fmtD('2026-11-12')+' 09:14 · <span class="mono">medgemma:27b</span> · '+U.st_inputs+'</p>';
    if(S.statusStale) h+='<p class="warnchip">'+ic('alert',14)+U.st_stale+'</p>';
    h+='<div class="klin__text">'+st.summary.map(function(p){return '<p>'+esc(noCites(p))+'</p>';}).join('')+'</div>';
    h+='<section class="klin__recs"><span class="klin__label klin__label--rec">'+ic('spark',12)+U.st_recs+'</span><ul>'+st.sugg.map(function(s){return '<li><span class="klin__arrow" aria-hidden="true">→</span><span>'+esc(s.text)+'</span></li>';}).join('')+'</ul></section>';
    h+='<p class="meta">'+U.st_disc+'</p>';
  }
  /* Fő eltérések — determinisztikus referencia-szabály */
  var chips=devChips();
  h+='<section class="klin__dev"><span class="klin__label">'+ic('lock',12)+U.st_dev+'</span>'+
   (chips.length?'<div class="klin__chips">'+chips.map(function(c){return '<button type="button" class="devchip" data-meres="'+c.id+'" title="'+esc(c.date)+'">'+esc(c.t)+'</button>';}).join('')+'</div>':'<p class="meta">'+U.st_dev_none+'</p>')+'</section>';
  h+='</article></div>';
  $('#cbody').innerHTML=h;
  $('#stb').onclick=genStatus;
  $$('[data-go]').forEach(function(a){a.onclick=function(e){e.preventDefault();go(stepIdx(a.getAttribute('data-go')));};});
  $$('[data-meres]').forEach(function(b){b.onclick=function(){openMeasure(b.getAttribute('data-meres'));};});
}
async function genStatus(){
  S.statusGen=1; vStatus();
  for(var i=1;i<=24;i++){ await sleep(80); var b=$('#stbar'); if(b) b.style.width=(i*100/24)+'%'; }
  S.statusGen=2; S.statusStale=false; S.statusTouched=true; renderSteps(); if(S.tab==='status') vStatus();
}
function tone(s){return s==='crit'||s==='major'?'sevtone--critical':s==='mod'?'sevtone--warning':s==='ok'?'sevtone--ok':'sevtone--info';}
function latestAll(){ var all=[]; LABS.concat(TXT).forEach(function(t){t.m.forEach(function(m){all.push(m.d);});}); all.sort(); return all[all.length-1]; }
function cutoff(days){ if(!isFinite(days)) return null; var l=new Date(latestAll().slice(0,10)+'T00:00:00'); return new Date(l.getTime()-days*864e5).toISOString().slice(0,10); }
function devChips(){
  var out=[], hat=cutoff(183);
  LABS.forEach(function(t){
    var ms=t.m.filter(function(m){return m.d.slice(0,10)>=hat;}).sort(byD); var m=ms[ms.length-1]; if(!m) return;
    var f=flagOf(t,m.v); if(!f) return;
    out.push({id:m.id, date:fmtDT(m.d), t:nameOf(t)+' '+f+' '+fmtN(m.v,decOf(m.v))+(t.unit?' '+t.unit:'')});
  });
  TXT.forEach(function(t){ var ms=t.m.filter(function(m){return m.d.slice(0,10)>=hat;}).sort(byD); var m=ms[ms.length-1]; if(m&&txtDiff(m.s)) out.push({id:m.id, date:fmtDT(m.d), t:nameOf(t)+': '+m.s}); });
  return out;
}
function byD(a,b){return a.d<b.d?-1:a.d>b.d?1:0;}
function openMeasure(id){ S.statusTouched=true; S.lab.detail=id; S.lab.name=''; S.lab.abn=false; S.lab.per='mind'; go(stepIdx('labs')); }

/* ---------- Labor-idősor ---------- */
function findMeas(id){ var r=null; LABS.concat(TXT).forEach(function(t){t.m.forEach(function(m){if(m.id===id) r={t:t,m:m};});}); return r; }
function vLabs(){
  var L=S.lab, hat=cutoff({'6ho':183,'1ev':366,mind:Infinity}[L.per]);
  var inWin=function(m){return !hat||m.d.slice(0,10)>=hat;};
  var params=LABS.filter(function(t){return !L.name||nameOf(t)===L.name;}).map(function(t){return {t:t, ms:t.m.filter(inWin).sort(byD)};})
    .filter(function(x){ if(!L.abn) return true; var u=x.ms[x.ms.length-1]; return u&&dirOf(x.t,u.v); });
  var txts=TXT.filter(function(t){return !L.name||nameOf(t)===L.name;}).map(function(t){return {t:t, ms:t.m.filter(inWin).sort(byD)};})
    .filter(function(x){return x.ms.length>0;}).filter(function(x){return !L.abn||txtDiff(x.ms[x.ms.length-1].s);});
  var all=params.concat(txts), meres=0, docs={};
  all.forEach(function(x){meres+=x.ms.length; x.ms.forEach(function(m){if(m.doc) docs[m.doc]=1;});});
  var nGraf=params.filter(function(x){return x.ms.length;}).length;
  var names=LABS.concat(TXT).map(nameOf).sort(function(a,b){return a.localeCompare(b,D.lang);});
  var h='<div class="labtrend"><div class="phead"><div class="stack-4"><h2 class="h2s">'+U.lab_title+'</h2><span class="meta row-inline">'+ic('doc')+tpl(U.lab_cnt,{m:meres,l:Object.keys(docs).length,t:nGraf+txts.length})+'</span></div>'+
   '<div class="lctl push-right"><select class="input input--sm" id="lsel" aria-label="'+esc(U.det_test)+'"><option value="">'+U.lab_all+'</option>'+names.map(function(n){return '<option'+(n===L.name?' selected':'')+'>'+esc(n)+'</option>';}).join('')+'</select>'+
   '<label class="row-inline checkline"><input type="checkbox" id="abn" '+(L.abn?'checked':'')+'> '+U.only_abn+'</label>'+
   seg('per',L.per,[['6ho',U.per6],['1ev',U.per1],['mind',U.perAll]])+seg('view',L.view,[['diagram',U.chart],['tablazat',U.table]])+
   (L.form?'':'<button type="button" class="abtn abtn--sm" id="ladd">'+ic('plus',14,2.4)+U.lab_add+'</button>')+'</div></div>';
  if(L.form) h+=labForm();
  if(L.detail) h+=detailBox(L.detail);
  if(!all.length) h+='<p class="empty pad">'+U.no_lab+'</p>';
  else if(L.view==='diagram'){
    h+='<div class="labgrid">'+params.filter(function(x){return x.ms.length;}).map(function(x){return chartCard(x.t,x.ms);}).join('')+'</div>';
    h+='<div class="lablegend"><span class="row-inline"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="var(--c-surface)" stroke="var(--c-ink)" stroke-width="2"/></svg>'+U.lg_in+'</span>'+
      '<span class="row-inline"><svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="5" fill="var(--c-ink)"/><circle cx="9" cy="9" r="7.5" fill="none" stroke="var(--c-ink)" stroke-width="1.5"/></svg>'+U.lg_out+'</span>'+
      '<span class="row-inline"><span class="lablegend__band"></span>'+U.lg_band+'</span><span class="push-right">'+U.lg_hint+'</span></div>';
    if(txts.length) h+='<h3 class="h3 labtrend__subhead">'+U.lab_txt+'</h3>'+labTable([],txts);
  } else h+=labTable(params,txts);
  h+='</div>';
  $('#cbody').innerHTML=h;
  $('#lsel').onchange=function(){L.name=this.value; L.detail=null; S.labTouched=true; vLabs(); renderSteps();};
  $('#abn').onchange=function(){L.abn=this.checked; S.labTouched=true; vLabs(); renderSteps();};
  $$('[data-seg]').forEach(function(g){ $$('button',g).forEach(function(b){b.onclick=function(){ L[g.getAttribute('data-seg')]=b.getAttribute('data-v'); vLabs(); };}); });
  if($('#ladd')) $('#ladd').onclick=function(){L.form=true; L.tried=false; L.rows=[emptyRow()]; L.doc=''; L.time=''; vLabs();};
  $$('[data-det]').forEach(function(b){b.onclick=function(){showDetail(b.getAttribute('data-det'));};});
  if(L.form) bindForm();
  if(L.detail){ var x=$('#dclose'); if(x) x.onclick=function(){L.detail=null; vLabs();}; var o=$('#dopen'); if(o) o.onclick=function(){openSrc(o.getAttribute('data-doc'));}; }
  drawCharts();
  if(L.detail && L.scrollDet){ L.scrollDet=false; scrollTopTo($('.detailbox')); }
}
function showDetail(id){ S.lab.detail=id; S.lab.scrollDet=true; S.labTouched=true; vLabs(); renderSteps(); }
function detailBox(id){
  var f=findMeas(id); if(!f) return '';
  var t=f.t, m=f.m, num=m.v!==undefined, d=num?decOf(m.v):0;
  var ref=t.id==='uprot'?D.uprot.ref:(t.lo===null&&t.hi===null?'—':(t.lo===null?'':fmtN(t.lo,decOf(t.lo)))+'–'+(t.hi===null?'':fmtN(t.hi,decOf(t.hi))));
  return '<section class="detailbox" aria-label="'+esc(U.det_title)+'"><div class="row-baseline"><strong>'+U.det_title+'</strong><button type="button" class="iconbtn iconbtn--ghost iconbtn--sm push-right" id="dclose" aria-label="'+esc(U.close)+'">'+ic('x')+'</button></div>'+
   '<dl class="deflist"><dt>'+U.det_test+'</dt><dd>'+esc(nameOf(t))+'</dd><dt>'+U.det_val+'</dt><dd class="mono">'+(num?fmtN(m.v,d):esc(m.s))+' '+(t.unit||'')+(num&&stTxt(t,m.v)?' <span class="flag flag--sm">'+stTxt(t,m.v)+'</span>':'')+'</dd>'+
   '<dt>'+U.det_ref+'</dt><dd class="mono">'+esc(ref)+'</dd><dt>'+U.det_time+'</dt><dd class="mono">'+fmtDT(m.d)+(m.d.indexOf('T')<0?' 00:00':'')+'</dd><dt>'+U.det_code+'</dt><dd class="mono">'+esc(t.code||'—')+'</dd>'+
   '<dt>'+U.det_doc+'</dt><dd>'+(m.doc?'<button type="button" class="linkbtn" id="dopen" data-doc="'+m.doc+'.'+t.id+'">'+tpl(U.det_open,{n:171+labIdx(m.doc)})+'</button>':'<span class="meta">'+U.det_nodoc+'</span>')+'</dd></dl></section>';
}
function chartCard(t,ms){
  var d=tdec(t), last=ms[ms.length-1], first=ms[0], st=stTxt(t,last.v);
  return '<article class="chart" data-t="'+t.id+'"><div class="row-baseline"><h3 class="h3">'+esc(nameOf(t))+'</h3>'+(t.unit?'<span class="meta">'+t.unit+'</span>':'')+'<span class="meta push-right">'+refStr(t)+'</span></div>'+
   '<div class="row-inline row-gap-10"><span class="big">'+fmtN(last.v,d)+'</span>'+(st?'<span class="flag">'+st+'</span>':'')+'<span class="meta push-right">'+fmtN(first.v,d)+' → '+fmtN(last.v,d)+' · '+ms.length+' '+U.lab_meas+'</span></div><div class="cw"></div></article>';
}
function curMs(t){ var L=S.lab, hat=cutoff({'6ho':183,'1ev':366,mind:Infinity}[L.per]); return t.m.filter(function(m){return !hat||m.d.slice(0,10)>=hat;}).sort(byD); }
function drawCharts(){ $$('.chart[data-t]').forEach(function(c){ var t=LABS.filter(function(x){return x.id===c.getAttribute('data-t');})[0]; if(t) drawChart(c,t); }); }
function drawChart(card,t){
  var wrap=$('.cw',card), W=Math.max(240,Math.round(wrap.clientWidth||440)), ms=curMs(t), d=tdec(t);
  var st=CH[t.id]||(CH[t.id]={hover:null,pin:null}); if(st.pin!==null&&st.pin>=ms.length) st.pin=null; if(st.hover!==null&&st.hover>=ms.length) st.hover=null;
  var H=170,Y0=16,Y1=136,Hh=H+20,X0=60,X1=W-28,L=44,R=W-8,TIP=200;
  var vals=ms.map(function(m){return m.v;}).concat(t.lo!==null?[t.lo]:[],t.hi!==null?[t.hi]:[]);
  var mx=Math.max.apply(null,vals), mn=Math.min.apply(null,vals), span=(mx-mn)||1, lo=mn-span*0.25, hi=mx+span*0.25;
  var y=function(v){return Y1-((v-lo)/(hi-lo))*(Y1-Y0);};
  var t0=new Date(ms[0].d.slice(0,10)).getTime(), t1=new Date(ms[ms.length-1].d.slice(0,10)).getTime();
  var x=function(m){return t1===t0?(X0+X1)/2:X0+((new Date(m.d.slice(0,10)).getTime()-t0)/(t1-t0))*(X1-X0);};
  var bt=y(Math.min(t.hi!==null?t.hi:hi,hi)), bb=y(Math.max(t.lo!==null?t.lo:lo,lo));
  var s='<svg viewBox="0 0 '+W+' '+Hh+'" width="'+W+'" height="'+Hh+'" role="img" aria-label="'+esc(nameOf(t))+'">';
  s+='<rect x="'+L+'" y="'+bt.toFixed(1)+'" width="'+(R-L)+'" height="'+Math.max(0,bb-bt).toFixed(1)+'" fill="var(--c-ref-band)"/>';
  [t.lo,t.hi].filter(function(v){return v!==null;}).forEach(function(v){ s+='<line x1="'+L+'" x2="'+R+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" stroke="var(--c-line)"/><text x="38" y="'+(y(v)+4).toFixed(1)+'" font-size="11" text-anchor="end" fill="var(--c-ink-muted)" font-family="var(--font-mono)">'+fmtN(v,d)+'</text>'; });
  s+='<line x1="'+L+'" x2="'+R+'" y1="'+Y1+'" y2="'+Y1+'" stroke="var(--c-line-input)"/>';
  ms.forEach(function(m){ s+='<text x="'+x(m).toFixed(1)+'" y="'+(Y1+20)+'" font-size="11" text-anchor="middle" fill="var(--c-ink-muted)" font-family="var(--font-mono)">'+monthLbl(m.d)+'</text>'; });
  var ai=st.pin!==null?st.pin:st.hover, hm=ai!==null?ms[ai]:null;
  if(hm) s+='<line x1="'+x(hm).toFixed(1)+'" x2="'+x(hm).toFixed(1)+'" y1="18" y2="'+Y1+'" stroke="var(--c-ink)" stroke-dasharray="3 3"/>';
  s+='<polyline points="'+ms.map(function(m){return x(m).toFixed(1)+','+y(m.v).toFixed(1);}).join(' ')+'" fill="none" stroke="var(--c-ink)" stroke-width="2" stroke-linejoin="round"/>';
  ms.forEach(function(m,i){
    var out=!!dirOf(t,m.v), cx=x(m).toFixed(1), cy=y(m.v).toFixed(1);
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="5.5" fill="'+(out?'var(--c-ink)':'var(--c-surface)')+'" stroke="'+(out?'var(--c-surface)':'var(--c-ink)')+'" stroke-width="2"/>';
    if(out) s+='<circle cx="'+cx+'" cy="'+cy+'" r="7" fill="none" stroke="var(--c-ink)" stroke-width="1.5"/>';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="16" fill="transparent" class="hit" tabindex="0" role="button" data-i="'+i+'" aria-pressed="'+(st.pin===i)+'" aria-label="'+esc(fmtD(m.d)+': '+nameOf(t)+' '+fmtN(m.v,d))+'"/>';
  });
  if(!hm){ var l=ms[ms.length-1]; s+='<text x="'+(x(l)-12).toFixed(1)+'" y="'+(y(l.v)-10).toFixed(1)+'" font-size="13" font-weight="700" text-anchor="end" fill="var(--c-ink)">'+fmtN(l.v,d)+'</text>'; }
  if(hm){
    var tx=x(hm)-TIP-10>=L?x(hm)-TIP-10:Math.min(x(hm)+10,W-TIP-2);
    s+='<foreignObject x="'+tx.toFixed(1)+'" y="10" width="'+TIP+'" height="'+(Hh-14)+'" pointer-events="none"><div xmlns="http://www.w3.org/1999/xhtml" class="charttip'+(st.pin!==null?' charttip--pinned':'')+'"><div class="charttip__meta">'+fmtD(hm.d)+' · '+(hm.doc?U.tip_lab:U.tip_manual)+'</div>'+
      '<div class="charttip__title">'+esc(nameOf(t))+' '+fmtN(hm.v,d)+' '+(stTxt(t,hm.v)||'')+'</div><button type="button" class="charttip__more" data-more="'+hm.id+'">'+U.tip_more+'</button></div></foreignObject>';
  }
  s+='</svg>';
  wrap.innerHTML=s;
  var svg=$('svg',wrap);
  svg.onmouseleave=function(){ if(st.hover!==null){ st.hover=null; drawChart(card,t);} };
  $$('.hit',wrap).forEach(function(c){
    var i=+c.getAttribute('data-i');
    c.onmouseenter=function(){ if(st.hover!==i){ st.hover=i; drawChart(card,t);} };
    c.onclick=function(){ st.pin=st.pin===i?null:i; S.labTouched=true; drawChart(card,t); renderSteps(); };
    c.onkeydown=function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault(); st.pin=st.pin===i?null:i; drawChart(card,t); var n=$('.hit[data-i="'+i+'"]',card); if(n) n.focus();} else if(e.key==='Escape'){st.pin=null; drawChart(card,t);} };
  });
  var mb=$('[data-more]',wrap); if(mb) mb.onclick=function(){ showDetail(mb.getAttribute('data-more')); };
}
function labTable(params,txts){
  var dates={}; params.concat(txts).forEach(function(x){x.ms.forEach(function(m){dates[m.d]=1;});}); dates=Object.keys(dates).sort();
  var h='<div class="labtable-wrap"><table class="labtable"><thead><tr><th>'+U.param+'</th><th>'+U.range+'</th>'+dates.map(function(d){return '<th class="mono">'+fmtD(d)+'</th>';}).join('')+'</tr></thead><tbody>';
  params.forEach(function(x){ var t=x.t, dd=tdec(t);
    h+='<tr><th scope="row">'+esc(nameOf(t))+' <span class="meta">'+(t.unit||'')+'</span></th><td class="meta">'+refStr(t)+'</td>'+dates.map(function(d){var m=x.ms.filter(function(q){return q.d===d;})[0]; if(!m) return '<td>—</td>'; var s=stTxt(t,m.v); return '<td class="mono'+(s?' labtable__out':'')+'"><button type="button" class="linkbtn mono" data-det="'+m.id+'">'+fmtN(m.v,dd)+(s?' <span aria-label="'+esc(s)+'">'+s.charAt(0)+'</span>':'')+'</button></td>';}).join('')+'</tr>'; });
  txts.forEach(function(x){ var t=x.t;
    h+='<tr><th scope="row">'+esc(nameOf(t))+'</th><td class="meta">'+U.ref+' '+esc(D.uprot.ref)+'</td>'+dates.map(function(d){var m=x.ms.filter(function(q){return q.d===d;})[0]; if(!m) return '<td>—</td>'; var e=txtDiff(m.s); return '<td class="'+(e?'labtable__out':'')+'"><button type="button" class="linkbtn" data-det="'+m.id+'">'+esc(m.s)+(e?' <span aria-label="'+esc(U.ne)+'">≠</span>':'')+'</button></td>';}).join('')+'</tr>'; });
  return h+'</tbody></table></div>';
}
/* Labor-panel rögzítése: egy panel = egy mentés; hibás sornál egyik sem kerül be */
function emptyRow(){return {nev:'',ertek:'',egyseg:'',also:'',felso:'',csoport:'',kod:''};}
function pnum(s){ s=String(s).trim().replace(',','.'); if(!/^-?\d+(\.\d{1,4})?$/.test(s)) return null; return parseFloat(s); }
function rowErr(r){
  if(!r.nev.trim()) return U.e_name;
  if(pnum(r.ertek)===null) return U.e_val;
  if((r.also.trim()&&pnum(r.also)===null)||(r.felso.trim()&&pnum(r.felso)===null)) return U.e_ref;
  if(r.also.trim()&&r.felso.trim()&&pnum(r.also)>pnum(r.felso)) return U.e_order;
  return null;
}
function labForm(){
  var L=S.lab, errs=L.rows.map(rowErr), timeErr=!L.doc&&!L.time;
  var keys=['nev','ertek','egyseg','also','felso','csoport','kod'];
  var h='<form class="tabform" id="lform" novalidate><div class="row-baseline"><h2 class="h2s">'+U.f_title+'</h2><span class="meta">'+U.f_note+'</span></div>'+
   '<div class="row-end"><div class="field grow"><label for="fdoc">'+U.f_doc+' <span class="meta">'+U.f_opt+'</span></label><select class="input" id="fdoc"><option value="">'+U.f_nodoc+'</option>'+
   [4,3,2,1,0].map(function(i){return '<option value="L'+i+'"'+(L.doc==='L'+i?' selected':'')+'>'+D.dtype.lab+' · '+fmtD(LAB_DATES[i])+'</option>';}).join('')+'</select></div>'+
   '<div class="field"><label for="ftime">'+U.f_time+(L.doc?' <span class="meta">'+U.f_time_hint+'</span>':'')+'</label><input type="datetime-local" class="input mono" id="ftime" value="'+esc(L.time)+'"'+(L.tried&&timeErr?' aria-invalid="true"':'')+'></div></div>'+
   (L.tried&&timeErr?'<p class="form-error">'+U.e_time+'</p>':'')+
   '<datalist id="tnames">'+LABS.map(function(t){return '<option value="'+esc(nameOf(t))+'">';}).join('')+'</datalist>'+
   '<div class="labtable-wrap labtable-wrap--form"><table class="labtable labtable--form"><thead><tr>'+U.f_cols.map(function(c){return '<th>'+c+'</th>';}).join('')+'<th></th></tr></thead><tbody>'+
   L.rows.map(function(r,i){return '<tr>'+keys.map(function(k){return '<td><input class="input input--sm'+(k==='nev'||k==='csoport'?'':' mono')+'" data-r="'+i+'" data-k="'+k+'" value="'+esc(r[k])+'"'+(k==='nev'?' list="tnames"':'')+(L.tried&&errs[i]?' aria-invalid="true"':'')+'></td>';}).join('')+
     '<td><button type="button" class="iconbtn iconbtn--ghost iconbtn--sm" data-del="'+i+'"'+(L.rows.length===1?' disabled':'')+'>'+ic('x')+'</button></td></tr>';}).join('')+'</tbody></table></div>'+
   (L.tried?errs.map(function(e,i){return e?'<p class="form-error">'+tpl(U.f_row_n,{i:i+1})+e+'</p>':'';}).join(''):'')+
   '<div class="actions"><button type="button" class="abtn abtn--sm" id="frow">'+ic('plus',14,2.4)+U.f_row+'</button><button type="submit" class="abtn abtn--primary">'+ic('check',16,2.6)+tpl(U.f_save,{n:L.rows.length})+'</button><button type="button" class="abtn" id="fcancel">'+U.f_cancel+'</button></div></form>';
  return h;
}
function bindForm(){
  var L=S.lab;
  $$('#lform [data-r]').forEach(function(inp){inp.oninput=function(){L.rows[+inp.getAttribute('data-r')][inp.getAttribute('data-k')]=inp.value;};});
  $('#fdoc').onchange=function(){L.doc=this.value; vLabs();};
  $('#ftime').oninput=function(){L.time=this.value;};
  $('#frow').onclick=function(){L.rows.push(emptyRow()); vLabs();};
  $$('#lform [data-del]').forEach(function(b){b.onclick=function(){L.rows.splice(+b.getAttribute('data-del'),1); vLabs();};});
  $('#fcancel').onclick=function(){L.form=false; vLabs();};
  $('#lform').onsubmit=function(e){
    e.preventDefault(); L.tried=true;
    if(L.rows.some(rowErr)||(!L.doc&&!L.time)){ vLabs(); return; }
    var date=L.time?L.time.slice(0,16):LAB_DATES[labIdx(L.doc)];
    L.rows.forEach(function(r){
      var nm=r.nev.trim(), t=LABS.filter(function(x){return nameOf(x).toLowerCase()===nm.toLowerCase();})[0];
      if(!t){ t={id:'x'+(++S.mc), name:nm, unit:r.egyseg.trim()||null, lo:r.also.trim()?pnum(r.also):null, hi:r.felso.trim()?pnum(r.felso):null, code:r.kod.trim()||null, m:[]}; LABS.push(t); }
      t.m.push({id:'M'+(++S.mc), d:date, v:pnum(r.ertek), doc:L.doc||null});
    });
    toast(tpl(U.f_saved,{n:L.rows.length}));
    L.form=false; S.labTouched=true; if(S.statusGen===2) S.statusStale=true; vLabs(); renderSteps();
  };
}

/* ---------- Medical history ---------- */
function vHistory(){
  var h='<div class="tabbody"><header class="khead"><span class="khead__icon">'+ic('doc',22)+'</span><div class="khead__title"><h2 class="h2">'+U.h_title+'</h2><p class="meta">'+U.h_sub+'</p></div>'+
   '<div class="khead__actions"><button type="button" class="abtn" id="hgen" '+(S.hist===1?'disabled':'')+'>'+ic('history')+(S.hist===1?U.h_making:S.hist===2?U.h_regen:U.h_make)+'</button>'+
   (S.hist===2?'<button type="button" class="abtn abtn--primary" id="hexp">'+ic('download')+U.dg_export+'</button>':'')+'</div></header>';
  if(S.hist===0) h+='<p class="meta">'+U.h_empty+'</p>';
  if(S.hist===1) h+='<div class="prog" role="status"><p class="meta" id="hpm"></p><div class="bar"><i id="hpb"></i></div><p class="meta" id="hps"></p></div>';
  if(S.hist===2){
    var G=D.gen.hist, tl=G.secs.filter(function(s){return s.tl;})[0].tl, flags=tl.filter(function(t){return t[3]==='num';});
    h+='<p class="meta">'+U.st_made+' '+fmtD('2026-11-12')+' 09:31 · <span class="mono">medgemma:27b</span> · '+U.h_inputs+(S.ed.hist&&S.ed.hist.saved?' · '+U.rte_edited+': '+fmtD('2026-11-12')+' 09:40':'')+'</p>';
    if(flags.length) h+='<details class="kwarn"><summary>'+ic('alert',14)+U.dg_check+' ('+flags.length+')</summary><ul>'+flags.map(function(t){return '<li>'+fmtD(t[0])+' · '+esc(t[1])+': '+U.dg_check_why+'</li>';}).join('')+'</ul></details>';
    h+=rte('hist',U.h_doc_lbl,histHtml(),'');
    h+='<section class="kcard"><button type="button" class="ktl" id="htl" aria-expanded="'+S.histTl+'">'+ic('clock',18)+'<span class="ktl__title">'+U.h_tl+'</span><span class="kcount">'+tl.length+'</span><span class="push-right">'+ic(S.histTl?'chevronUp':'chevronDown')+'</span></button>'+
      (S.histTl?'<ol class="timeline">'+tl.slice().reverse().map(function(t){var fl=t[3]==='num'; return '<li class="timeline__item'+(fl?' timeline__item--flag':'')+'"><span class="timeline__dot"></span><span class="timeline__date">'+fmtD(t[0])+'</span><span class="timeline__title">'+esc(t[1])+'</span>'+
        (fl?'<span class="warnchip">'+ic('alert',12)+U.dg_check+': '+U.dg_check_why+'</span>':'')+'<a class="timeline__src" href="#" data-src="'+t[2]+'">'+ic('quote',12)+U.h_src+'</a></li>';}).join('')+'</ol>':'')+'</section>';
    h+='<p class="meta">'+U.h_disc+'</p>';
  }
  h+='</div>';
  $('#cbody').innerHTML=h;
  $('#hgen').onclick=genHistory;
  if(S.hist===2){
    $('#htl').onclick=function(){S.histTl=!S.histTl; vHistory();};
    $('#hexp').onclick=function(){ exportDoc(D.gen.hist.title, edHtml('hist',histHtml())+'<h2>'+esc(U.h_tl)+'</h2>'+'<ul>'+D.gen.hist.secs.filter(function(s){return s.tl;})[0].tl.map(function(t){return '<li><b>'+fmtD(t[0])+'</b> · '+esc(t[1])+'</li>';}).join('')+'</ul>'); };
    bindRte('hist',vHistory);
  }
}
function histHtml(){
  var G=D.gen.hist, out='';
  G.secs.forEach(function(s){ if(s.tl) return; out+='<h2>'+esc(s.h)+'</h2>'; if(s.p) s.p.forEach(function(p){out+='<p>'+esc(noCites(p))+'</p>';}); if(s.li) out+='<ul>'+s.li.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'; });
  return out;
}
async function genHistory(){
  S.hist=1; vHistory(); var n=9;
  for(var i=1;i<=n+1;i++){
    var pm=$('#hpm'), pb=$('#hpb'), ps=$('#hps');
    if(pm) pm.textContent=(i<=n?tpl(U.h_prog,{i:i,n:n})+' · '+srcLabel(DOC_ORDER[i-1]):U.h_prog2)+' · '+U.h_started;
    if(pb) pb.style.width=((i-1)*100/(n+1))+'%';
    if(ps) ps.textContent=(i-1)+' / '+(n+1)+' '+U.h_steps+' · medgemma:27b';
    await sleep(i<=n?260:600);
  }
  S.hist=2; S.ed.hist=null; renderSteps(); if(S.tab==='history') vHistory();
}

/* ---------- egyszerű szerkesztő (AI eredeti + orvosi szerkesztés) ---------- */
function edHtml(k,ai){ var e=S.ed[k]; return e&&e.saved?e.html:ai; }
function rte(k,label,ai,head){
  var e=S.ed[k]||(S.ed[k]={html:null,saved:false,dirty:false,orig:false,ro:false});
  return '<section class="rte" data-rte="'+k+'"><div class="rte__bar"><span class="label rte__lbl">'+esc(label)+(e.saved?' · <span class="accent">'+U.rte_edited+'</span>':'')+'</span>'+
   '<button type="button" class="rte__btn rte__b" data-cmd="bold">B</button><button type="button" class="rte__btn rte__i" data-cmd="italic">I</button><button type="button" class="rte__btn rte__u" data-cmd="underline">U</button><button type="button" class="rte__btn" data-cmd="insertUnorderedList">• ≡</button>'+
   '<span class="push-right row-inline">'+(e.saved?'<button type="button" class="abtn abtn--sm" data-orig="1">'+ic(e.orig?'chevronUp':'chevronDown',14)+U.rte_orig+'</button>':'')+
   '<button type="button" class="abtn abtn--sm abtn--primary" data-save="1" '+(e.dirty?'':'disabled')+'>'+ic('check',14,2.6)+(e.dirty?U.rte_save:U.rte_saved)+'</button></span></div>'+
   head+'<div class="rte__body kdoc" contenteditable="true" spellcheck="false">'+edHtml(k,ai)+'</div>'+
   (e.saved&&e.orig?'<div class="korig"><span class="label">'+U.rte_orig+'</span><div class="kdoc">'+ai+'</div></div>':'')+'</section>';
}
function bindRte(k,rerender){
  var box=$('[data-rte="'+k+'"]'); if(!box) return; var e=S.ed[k], body=$('.rte__body',box), sv=$('[data-save]',box);
  $$('[data-cmd]',box).forEach(function(b){b.onmousedown=function(ev){ev.preventDefault(); document.execCommand(b.getAttribute('data-cmd')); body.oninput();};});
  body.oninput=function(){ if(!e.dirty){ e.dirty=true; sv.disabled=false; sv.innerHTML=ic('check',14,2.6)+U.rte_save; } };
  sv.onclick=function(){ e.html=body.innerHTML; e.saved=true; e.dirty=false; toast(U.rte_saved); rerender(); };
  var o=$('[data-orig]',box); if(o) o.onclick=function(){ if(e.dirty) e.html=body.innerHTML; e.orig=!e.orig; rerender(); };
}

/* ---------- Átirat (Konzultáció + Echo) ---------- */
function vTranscript(){
  $('#cbody').innerHTML='<div class="tabbar"><button type="button" class="abtn abtn--sm" id="tnew">'+ic('mic',14)+U.t_new+'</button>'+
   seg('rec',S.recSub,[['consult',U.tabs_rec.consult+' · #15'],['echo',U.tabs_rec.echo+' · #16']])+'</div><div class="tsub" id="tbody"></div>';
  $$('[data-seg="rec"] button').forEach(function(b){b.onclick=function(){go(stepIdx(b.getAttribute('data-v')));};});
  $('#tnew').onclick=function(){ var k=S.recSub; if(S[k]===1) return; S[k]=0; recView(k); };
  recView(S.recSub);
}
function utHtml(l,lab){ return '<div class="ut '+l[1]+'" id="'+l[0]+'"><span class="who">'+(l[1]==='dr'?U.dr:U.pt)+' '+l[0].replace(/[uv]/,'#')+' · '+l[2]+'</span><div class="bub">'+esc(l[3])+'</div></div>'; }
function recView(kind){
  var st=S[kind], c=$('#tbody'), isE=kind==='echo';
  if(!c) return;
  if(st===0){
    c.innerHTML='<div class="card recbox"><div class="mic" style="color:#910029">'+IC.micB+'</div><div class="ct" style="justify-content:center">'+(isE?U.echo_new:U.rec_new)+'</div><div class="meta">'+(isE?U.echo_mode:U.rec_mode)+'</div><button class="btn red big" id="recb">● '+(isE?U.echo_start:U.rec_start)+'</button></div>';
    $('#recb').onclick=function(){runRec(kind);}; return;
  }
  if(st===1){ c.innerHTML='<p class="meta pad">'+U.proc+'…</p>'; return; }
  isE?echoResult():consultResult();
}
async function runRec(kind){
  var isE=kind==='echo', data=isE?D.echo:D.consult, c=$('#tbody'); S[kind]=1; fast=false;
  c.innerHTML='<div class="card"><div class="recbox" style="padding:16px"><div class="mic live" style="color:#fff">'+IC.micB+'</div><div class="wave">'+Array(14).join('<i></i>')+'<i></i></div><div class="timer" id="tm">0:00</div><button class="btn line" id="fst">'+U.rec_fast+' »</button></div><div class="lbl">'+U.rec_live+'</div><div class="tr" id="tr"></div></div>';
  $$('.wave i',c).forEach(function(w,i){w.style.animationDelay=(i*0.07)+'s';});
  $('#fst').onclick=function(){fast=true;};
  var tr=$('#tr',c);
  for(var i=0;i<data.lines.length;i++){
    var l=data.lines[i]; var tm=$('#tm',c); if(tm) tm.textContent=l[2];
    var d=document.createElement('div'); d.innerHTML=utHtml(l); var node=d.firstChild; var bub=node.querySelector('.bub'); var full=l[3]; bub.textContent='';
    tr.appendChild(node); tr.scrollTop=tr.scrollHeight;
    for(var k=0;k<full.length;k+=3){ bub.textContent=full.slice(0,k+3); if(!fast) await sleep(14); }
    tr.scrollTop=tr.scrollHeight;
    await wait(420);
  }
  var steps=U.proc_steps.slice(0, isE?4:5);
  var box=c.querySelector('.card'); box.innerHTML='<div class="ct">'+U.proc+'…</div><div class="procl" id="pl">'+steps.map(function(s){return '<div><span class="spin"></span>'+s+'</div>';}).join('')+'</div>';
  var rows=box.querySelectorAll('#pl div');
  for(var j=0;j<rows.length;j++){ await wait(520); rows[j].className='dn'; rows[j].firstChild.outerHTML='<span>'+IC.check+'</span>'; }
  await wait(300);
  S[kind]=2; renderSources(); renderSteps();
  if(S.tab==='transcript' && S.recSub===kind) recView(kind);
}
function consultResult(){
  var C=D.consult;
  var h='<div class="card"><div class="ct">'+U.rec_title+' #15 <span class="stat stat--kesz">'+U.imp_done+'</span></div><div class="mono" style="margin-bottom:10px">'+U.rec_meta+' · ASR: large-v3 · '+U.tabs_rec.consult+'</div>';
  h+='<div class="lbl">'+U.summary+' <span class="chip">'+U.check+'</span></div>';
  C.summary.forEach(function(s){h+='<div class="sumli">'+esc(s[0])+' '+s[1].map(function(r){return '<button class="cit" data-ut="'+r+'">#'+r.slice(1)+'</button>';}).join('')+'</div>';});
  h+='<div class="kw">'+C.keywords.map(function(k){return '<span>'+esc(k)+'</span>';}).join('')+'</div></div>';
  h+='<div class="card"><div class="lbl" style="margin-top:0">'+U.groups+' <span class="chip">'+U.check+'</span></div><div class="ggrid">';
  Object.keys(U.gt).forEach(function(g){
    h+='<div class="gb"><h4>'+U.gt[g]+'</h4>'+(C.groups[g]||[]).map(function(it){
      var inf=it[2]==='infer';
      return '<div class="gi"><span class="ai">AI</span><span>'+esc(it[0])+'</span>'+it[1].map(function(r){return '<button class="cit" data-ut="'+r+'">#'+r.slice(1)+'</button>';}).join('')+(inf?'<span class="chip warn" title="'+esc(C.diag_note)+'">'+U.dg_check+'</span>':'')+'</div>';}).join('')+'</div>';
  });
  h+='</div><div class="disc">'+esc(C.diag_note)+'</div><div style="margin-top:12px"><button class="abtn abtn--primary" id="sv">'+(S.saved?'✓ '+U.saved:U.save_doc)+'</button></div></div>';
  h+='<div class="card"><div class="lbl" style="margin-top:0">'+U.transcript+'</div><div class="tr" id="trr">'+C.lines.map(function(l){return utHtml(l);}).join('')+'</div></div>';
  $('#tbody').innerHTML=h;
  bindUt();
  $('#sv').onclick=function(){S.saved=true;this.innerHTML='✓ '+U.saved;toast(U.saved);};
}
function bindUt(){
  $$('[data-ut]').forEach(function(b){b.onclick=function(){
    var id=b.getAttribute('data-ut'); var el=document.getElementById(id); if(!el) return;
    $$('.ut.hl').forEach(function(x){x.classList.remove('hl');});
    el.classList.add('hl'); var tr=el.closest('.tr'); scrollIn(el,'.tr'); if(tr) scrollIn(tr,'.cbody');
  };});
}
function echoResult(){
  var E=D.echo, L=[];
  var h='<div class="card"><div class="ct">'+U.echo_res+' <span class="stat stat--kesz">'+U.imp_done+'</span></div><div class="mono" style="margin-bottom:10px">'+U.echo_mode+' · 2026.11.12. · 0:41</div>';
  h+='<div style="overflow:auto"><table class="et"><tr><th></th><th>'+U.echo_val+'</th><th>'+U.echo_ref+'</th><th>'+U.echo_src+'</th></tr>';
  E.fields.forEach(function(f){
    var cls=f[3]==='warn'?'warn':'';
    var val=f[3]==='high'||f[3]==='low'?'<span class="up">'+esc(f[1])+' '+(f[3]==='high'?'↑':'↓')+'</span>':f[3]==='warn'?'<b>'+esc(f[1])+'</b> <span class="chip warn">'+U.echo_warn+'</span>':esc(f[1]);
    h+='<tr class="'+cls+'"><td>'+esc(f[0])+'</td><td>'+val+'</td><td class="meta">'+esc(f[2])+'</td><td><button class="cit" data-ut="'+f[4]+'">#'+f[4].slice(1)+'</button></td></tr>';
  });
  h+='</table></div><div class="ddirow sevtone--warning" style="margin-top:12px"><span class="sevtag">'+U.echo_warn+'</span><div>'+esc(E.warn)+' <b>'+U.number_guard+'</b></div></div></div>';
  h+='<div class="card"><div class="lbl" style="margin-top:0">'+U.echo_cmp+'</div><p>'+renderCites(E.cmp,L)+'</p><div class="lbl">'+U.echo_rep+' <span class="chip">'+U.check+'</span></div><p>'+esc(E.report)+'</p></div>';
  h+='<div class="card"><div class="lbl" style="margin-top:0">'+U.transcript+'</div><div class="tr">'+E.lines.map(function(l){return utHtml(l);}).join('')+'</div></div>';
  $('#tbody').innerHTML=h; bindUt();
}

/* ---------- Ellátások + Epikrízis ---------- */
var CARES=[
  {id:12, type:'amb', start:'2026-11-12T09:02', end:null, by:null, active:true},
  {id:9, type:'sbo', start:'2026-06-10T08:41', end:'2026-06-10T15:20', by:'Dr. Kovács Péter', active:false}
];
function vCare(){
  var h='<div class="tabbody"><div class="row-baseline"><h2 class="h2s">'+U.c_title+'</h2><span class="meta">'+U.c_note+'</span></div><ul class="itemlist">';
  CARES.forEach(function(c){
    var open=!c.end, k='c'+c.id;
    h+='<li class="item'+(open?' item--open':'')+'"><div class="item__row"><span class="stat '+(open?'stat--nyitott':'stat--kesz')+'">'+(open?U.c_open:U.c_closed)+'</span><strong>#'+c.id+' · '+U['c_'+c.type]+'</strong>'+(c.active?'<span class="tag">'+U.c_active+'</span>':'')+
     '<span class="meta">'+fmtDT(c.start)+(c.end?' – '+fmtDT(c.end):'')+' · '+esc(c.by||D.doctor)+'</span><div class="actions push-right">'+
     '<button type="button" class="abtn abtn--sm" data-cdet="'+k+'" aria-expanded="'+!!S.care.det[k]+'">'+U.c_det+'</button>'+
     '<button type="button" class="abtn abtn--sm" data-cepi="'+k+'" aria-expanded="'+!!S.care.epi[k]+'">'+ic('doc',14)+U.c_epi+'</button>'+
     (open?'<button type="button" class="abtn abtn--sm" data-cclose="1">'+ic('stop',14)+U.c_close+'</button>':'')+'</div></div>';
    if(S.care.det[k]) h+='<dl class="deflist"><dt>'+U.c_id+'</dt><dd class="mono">#'+c.id+'</dd><dt>'+U.c_type+'</dt><dd>'+U['c_'+c.type]+'</dd><dt>'+U.c_start+'</dt><dd class="mono">'+fmtDT(c.start)+'</dd><dt>'+U.c_end+'</dt><dd class="mono">'+(c.end?fmtDT(c.end):U.c_openv)+'</dd><dt>'+U.c_by+'</dt><dd>'+esc(c.by||D.doctor)+'</dd></dl>';
    if(S.care.epi[k]) h+=c.active?epiPanel():'<div class="item__sub epi"><div class="row-baseline"><h3 class="h2s">'+U.e_title+'</h3><div class="actions push-right"><button type="button" class="abtn abtn--sm" disabled title="'+esc(U.e_na)+'">'+ic('doc',14)+U.e_make+'</button></div></div><p class="meta">'+U.e_none+'</p><p class="meta">'+ic('lock',12)+' '+U.e_na+'</p></div>';
    var recs=[]; if(c.active){ if(S.consult===2) recs.push(['consult','15']); if(S.echo===2) recs.push(['echo','16']); }
    if(recs.length) h+='<div class="item__sub"><span class="meta">'+U.c_recs+'</span>'+recs.map(function(r){return '<a href="#" class="srcchip" data-gorec="'+r[0]+'">'+ic('mic',12)+U.c_rec+' #'+r[1]+'</a>';}).join('')+'</div>';
    h+='</li>';
  });
  h+='</ul></div>';
  $('#cbody').innerHTML=h;
  $$('[data-cdet]').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-cdet'); S.care.det[k]=!S.care.det[k]; vCare();};});
  $$('[data-cepi]').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-cepi'); S.care.epi[k]=!S.care.epi[k]; vCare();};});
  $$('[data-cclose]').forEach(function(b){b.onclick=function(){toast(U.c_close_demo);};});
  $$('[data-gorec]').forEach(function(a){a.onclick=function(e){e.preventDefault(); go(stepIdx(a.getAttribute('data-gorec')));};});
  if($('#egen')) $('#egen').onclick=genEpi;
  if(S.epi===2){
    $('#eexp').onclick=function(){ exportDoc(D.gen.epi.title, epiHead()+edHtml('epi',epiHtml())); };
    $('#esrc').onclick=function(){S.epiSrc=!S.epiSrc; vCare();};
    bindRte('epi',vCare);
  }
}
function epiHead(){ return '<div class="kdoc efej"><p>'+U.e_patient+': '+esc(D.patient.name)+'</p><p>'+D.patient.idl+': '+D.patient.id+'</p><p>'+U.e_date+': '+fmtD('2026-11-12')+'</p></div>'; }
function epiHtml(){
  var out='';
  D.gen.epi.secs.forEach(function(s){ out+='<h2>'+esc(s.h)+'</h2>'; if(s.li) out+='<ul>'+s.li.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'; if(s.cl) out+='<ul>'+s.cl.map(function(x){return '<li>'+esc(x[0])+'</li>';}).join('')+'</ul>'; });
  return out;
}
function epiPanel(){
  var G=D.gen.epi, h='<div class="item__sub epi"><div class="row-baseline"><h3 class="h2s">'+U.e_title+'</h3><div class="actions push-right">'+
   '<button type="button" class="abtn abtn--sm" id="egen" '+(S.epi===1?'disabled':'')+'>'+ic('doc',14)+(S.epi===1?U.e_making:S.epi===2?U.e_regen:U.e_make)+'</button>'+
   (S.epi===2?'<button type="button" class="abtn abtn--sm abtn--primary" id="eexp">'+ic('download',14)+U.dg_export+'</button>':'')+'</div></div>';
  h+='<p class="meta">'+U.e_from+'</p>';
  if(S.epi===0) h+='<p class="meta">'+U.e_none+'</p>';
  if(S.epi===1) h+='<div class="prog" role="status"><p class="meta" id="epm">'+U.e_prog[0]+'</p><div class="bar"><i id="epb"></i></div></div>';
  if(S.epi===2){
    var cl=G.secs.filter(function(s){return s.cl;})[0].cl, diag=G.secs.filter(function(s){return s.li;})[0].li, flags=cl.filter(function(x){return x[2]==='nosrc';});
    h+='<p class="meta">'+U.st_made+' '+fmtD('2026-11-12')+' 10:05 · <span class="mono">medgemma:27b</span> · '+U.e_inputs+'</p>';
    if(flags.length) h+='<details class="kwarn"><summary>'+ic('alert',14)+U.dg_check+' ('+flags.length+')</summary><ul>'+flags.map(function(x){return '<li>'+esc(x[0])+' — '+U.dg_nosrc+'</li>';}).join('')+'</ul></details>';
    h+=rte('epi',U.e_title,epiHtml(),epiHead());
    h+='<section class="kcard"><button type="button" class="ktl" id="esrc" aria-expanded="'+S.epiSrc+'">'+ic('quote',18)+'<span class="ktl__title">'+U.e_src+'</span><span class="kcount">'+(cl.length+diag.length)+'</span><span class="push-right">'+ic(S.epiSrc?'chevronUp':'chevronDown')+'</span></button>'+
      (S.epiSrc?'<ol class="timeline">'+cl.map(function(x){var fl=x[2]==='nosrc'; return '<li class="timeline__item'+(fl?' timeline__item--flag':'')+'"><span class="timeline__dot"></span><span class="timeline__title">'+U.e_crit+'</span><span class="timeline__text">'+esc(x[0])+'</span>'+
        (fl?'<span class="warnchip">'+ic('alert',12)+U.dg_check+': '+U.dg_nosrc+'</span><span class="meta">'+U.e_nosrc+'</span>':srcLink(x[1]))+'</li>';}).join('')+
       diag.map(function(x,i){return '<li class="timeline__item"><span class="timeline__dot"></span><span class="timeline__title">'+U.e_diag+'</span><span class="timeline__text">'+esc(x)+'</span>'+srcLink(['d7.z3','d9.g1','d8.k2'][i]||'d8.k2')+'</li>';}).join('')+'</ol>':'')+'</section>';
    h+='<p class="meta">'+U.e_disc+'</p>';
  }
  return h+'</div>';
}
function srcLink(code){ var rec=code.charAt(0)==='u'; return '<a class="timeline__src" href="#" data-src="'+code+'">'+ic(rec?'mic':'quote',12)+(rec?U.e_srcrec:U.e_srcdoc)+'</a>'; }
async function genEpi(){
  S.epi=1; vCare();
  for(var i=0;i<U.e_prog.length;i++){ var pm=$('#epm'), pb=$('#epb'); if(pm) pm.textContent=U.e_prog[i]+' · '+(i+1)+'/'+U.e_prog.length+' · medgemma:27b'; if(pb) pb.style.width=(i*100/U.e_prog.length)+'%'; await sleep(900); }
  S.epi=2; S.ed.epi=null; renderSteps(); if(S.tab==='care') vCare();
}

/* ---------- Szakirodalom ---------- */
function vResearch(){
  var R=D.research, c=$('#cbody');
  var h='<div class="tabbody"><div class="card"><div class="ct" style="font-size:15px">'+U.rs_title+' <span class="chip">'+IC.spark+' '+U.rs_ai+'</span></div><div class="ctxbox">'+esc(R.ctx)+'</div><div class="note" style="margin-top:5px">'+U.rs_ctx_note+'</div>'+
   '<div class="lbl">'+U.rs_query+'</div><div class="qbox">'+esc(R.query)+'</div><div class="terms">'+R.terms.map(function(t,i){return (i?'<em>AND</em>':'')+'<span>'+esc(t)+'</span>';}).join('')+'</div>'+
   '<div class="note">'+IC.shield+'<span>'+U.rs_out+'</span></div>'+
   '<div class="srcrow"><b style="font-size:13px">'+U.rs_src+':</b>'+R.counts.map(function(x){return '<label class="chk"><input type="checkbox" checked disabled> '+x[0]+'</label>';}).join('')+'<div style="flex:1"></div>'+(S.research===0?'<button class="abtn abtn--primary" id="rsb">'+U.rs_btn+'</button>':'')+'</div></div><div id="rres"></div></div>';
  c.innerHTML=h;
  if(S.research===0) $('#rsb').onclick=runResearch; else if(S.research===2) researchResults();
}
async function runResearch(){
  S.research=1; var R=D.research; $('#rsb').remove();
  var box=$('#rres');
  box.innerHTML='<div class="card"><div class="ct" style="font-size:14px"><span class="spin"></span> '+U.rs_running+'</div><div class="cnt">'+R.counts.map(function(x,i){return '<div><b id="cn'+i+'">0</b><small>'+x[0]+' · '+U.rs_found+'</small></div>';}).join('')+'</div><div class="lbl" id="evl">'+U.rs_rank+'</div><div class="bar"><i id="evb"></i></div><div class="meta" id="evn">0/'+R.evaluated+' '+U.rs_eval+'</div></div>';
  for(var s=1;s<=20;s++){ R.counts.forEach(function(x,i){var e=$('#cn'+i); if(e) e.textContent=Math.round(x[1]*s/20).toLocaleString(D.lang);}); await sleep(55); }
  for(var e=1;e<=R.evaluated;e++){ var b=$('#evb'), n=$('#evn'); if(b) b.style.width=(e*100/R.evaluated)+'%'; if(n) n.textContent=e+'/'+R.evaluated+' '+U.rs_eval; await sleep(38); }
  S.research=2; renderSteps(); if(S.tab==='research') vResearch();
}
function researchResults(){
  var R=D.research, box=$('#rres'); if(!box) return;
  var tot=R.counts.map(function(x){return x[0]+': '+x[1].toLocaleString(D.lang);}).join(' · ');
  var h='<div class="meta" style="margin:4px 2px 10px">'+tot+' · '+R.evaluated+' '+U.rs_eval+'</div><div class="ltool">'+seg('rel',S.relF,[['all',U.rs_all],['high',U.rs_high],['part',U.rs_part]])+'</div>';
  var list=R.papers.filter(function(p){return S.relF==='all'||p.rel===S.relF;});
  list.forEach(function(p){
    var id='p'+R.papers.indexOf(p); var ex=S.excl[id];
    h+='<div class="paper '+(p.top?'topp':'')+'" style="'+(ex?'opacity:.45':'')+'">'+(p.top?'<div class="topnote">'+IC.spark+' '+U.rs_top+' · '+p.top+'.</div>':'')+
     '<div class="pacts"><button class="'+(S.stars[id]?'on':'')+'" data-star="'+id+'">'+IC.star+' '+U.rs_star+'</button><button data-ex="'+id+'">'+U.rs_excl+'</button></div>'+
     '<a class="pt" href="https://doi.org/'+p.doi+'" target="_blank" rel="noopener">'+esc(p.t)+'</a><div class="pm">'+esc(p.a)+' · '+esc(p.j)+' · '+p.y+' · <b>'+esc(p.k)+'</b> · DOI <a href="https://doi.org/'+p.doi+'" target="_blank" rel="noopener">'+p.doi+'</a></div>'+
     '<div class="ai"><div style="margin-bottom:6px"><span class="chip">'+U.rs_unverified+'</span> <span class="rel '+p.rel+'">'+(p.rel==='high'?U.rs_high:U.rs_part)+'</span></div><p>'+esc(p.s)+'</p><p><b>'+U.rs_why+'</b> '+esc(p.w)+'</p></div></div>';
  });
  h+='<div class="note">'+IC.shield+'<span>'+U.rs_meta+'</span></div>';
  box.innerHTML=h;
  $$('[data-seg="rel"] button',box).forEach(function(b){b.onclick=function(){S.relF=b.getAttribute('data-v');researchResults();};});
  $$('[data-star]',box).forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-star');S.stars[k]=!S.stars[k];researchResults();};});
  $$('[data-ex]',box).forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-ex');S.excl[k]=!S.excl[k];researchResults();};});
}

/* ---------- Word-export ---------- */
function exportDoc(title,html){
  var clean=html.replace(/<button[^>]*>(.*?)<\/button>/g,'').replace(/<svg[\s\S]*?<\/svg>/g,'');
  var doc='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{text-align:center;font-size:15pt}h2{color:#084a94;font-size:12pt;border-bottom:1px solid #ccc}</style></head><body><h1>'+esc(title)+'</h1>'+clean+'<p style="color:#888;font-size:9pt">MediAI Assistant demo · '+esc(U.fict)+'</p></body></html>';
  var blob=new Blob(['﻿',doc],{type:'application/msword'}); var a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='MediAI_demo_'+title.replace(/[^\wÀ-ž]+/g,'_').slice(0,40)+'.doc'; document.body.appendChild(a); a.click(); setTimeout(function(){a.remove();URL.revokeObjectURL(a.href);},1500);
  toast('⤓ '+a.download);
}

/* ---------- Gyógyszer és allergia (a valós GyogyszerAllergiaPanel + GyogyszerInterakcio szerint) ---------- */
var SEV3={crit:'critical',major:'critical',mod:'warning',minor:'info',info:'info',ok:'info'};
function sevTag(s){return '<span class="sevtag">'+U.sev2[SEV3[s]]+'</span>';}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();}
var MD=null;
function mdInit(){
  if(MD) return MD;
  MD={meds:D.meds.list.map(function(m,i){var dose=m[1].split(' '); return {id:41+i, name:m[0], ing:m[0].toLowerCase(), dose:dose[0], unit:dose[1]||'', route:'per os · '+m[2], active:[0,4,6].indexOf(i)<0, stmt:118+i, auto:true};}),
      alls:[{id:7, name:D.patient.allergy, stmt:117, auto:true}], only:false, det:{}, adhoc:{list:[], input:'', res:null, err:null}, af:{name:'',src:'',err:null}, mf:{name:'',ing:'',dose:'',unit:'',route:'',src:'',err:null,tried:false}, nid:60};
  return MD;
}
/* interakció-pár: mindkét gyógyszer szedett-e (leállítás után a szabálymotor újraszámol) */
function pairOf(t){ var p=String(t).split(':')[0].split(' + '); return p.length===2?p:null; }
function isActive(name){ mdInit(); return MD.meds.some(function(m){return m.active&&norm(m.name)===norm(name);}); }
function activeInter(){ return D.meds.inter.filter(function(x){var p=pairOf(x[1]); return !p||(isActive(p[0])&&isActive(p[1]));}); }
function srcMark(o){
  if(!o.stmt) return '<span class="meta">'+U.md_manual+'</span>';
  if(o.auto) return '<span class="warnchip" title="'+esc(U.md_unver_t)+'">'+ic('alert',14)+tpl(U.md_unver2,{n:o.stmt})+'</span>';
  return '<span class="meta">'+tpl(U.md_srcref,{n:o.stmt})+'</span>';
}
function srcSelect(id,val){
  return '<div class="field grow"><label for="'+id+'">'+U.md_src+' <span class="meta">'+U.md_src_opt+'</span></label><select class="input" id="'+id+'"><option value="">'+U.md_src_none+'</option>'+
   [[121,U.md_src_a],[122,U.md_src_b]].map(function(o){return '<option value="'+o[0]+'"'+(String(val)===String(o[0])?' selected':'')+'>#'+o[0]+' · '+esc(o[1])+'</option>';}).join('')+'</select></div>';
}
function interItem(x,sub){
  var s=SEV3[x[0]];
  return '<li class="item sevtone--'+s+'"><div class="item__row">'+ic(s==='info'?'pill':'alert',16,2.4)+sevTag(x[0])+'<span>'+esc(x[1])+'</span></div><div class="item__sub"><span class="meta">'+sub+'</span></div></li>';
}
function infoFold(items,sub){
  var f=items.filter(function(x){return SEV3[x[0]]!=='info';}), inf=items.filter(function(x){return SEV3[x[0]]==='info';});
  return (f.length?'<ul class="itemlist">'+f.map(function(x){return interItem(x,sub);}).join('')+'</ul>':'<p class="meta">'+U.md_none_imp+'</p>')+
   (inf.length?'<details class="mdfold"><summary class="meta">'+tpl(U.md_more,{n:inf.length})+'</summary><ul class="itemlist">'+inf.map(function(x){return interItem(x,sub);}).join('')+'</ul></details>':'');
}
var BRANDS={ibuprofen:['nurofen','advil','algoflex'],klaritromicin:['klacid','fromilid','clarithromycin','clarithromycine'],kalium:['kalium-r','kalinor','potassium','kalium-chlorid','kaliumchlorid'],dapagliflozin:['forxiga']};
function resolveDrug(txt){
  var t=norm(txt), r=null;
  D.meds.opts.forEach(function(o,i){ var base=norm(o.n.split(' ')[0]).replace(/-.*/,''); var al=BRANDS[base]||[];
    if(t.indexOf(base)>=0||base.indexOf(t)===0||al.some(function(a){return t.indexOf(a)>=0||a.indexOf(t)===0;})) r={o:o,i:i,ing:base}; });
  return r;
}
function vMeds(){
  mdInit();
  var A=MD.af, F=MD.mf, X=MD.adhoc;
  /* allergiák */
  var h='<div class="tabbody"><section class="stack-12" aria-label="'+esc(U.md_allergy)+'"><h2 class="h2s">'+U.md_allergy+'</h2><ul class="itemlist">'+MD.alls.map(function(a){
    return '<li class="item item--critical"><div class="item__row">'+ic('alert',16,2.4)+'<strong>'+esc(a.name)+'</strong>'+srcMark(a)+'<button type="button" class="abtn abtn--sm push-right" data-mdet="a'+a.id+'">'+U.c_det+'</button></div>'+
     (MD.det['a'+a.id]?'<dl class="deflist"><dt>'+U.c_id+'</dt><dd class="mono">#'+a.id+'</dd><dt>'+U.md_subst+'</dt><dd>'+esc(a.name)+'</dd><dt>'+U.md_srcl+'</dt><dd>'+(a.stmt?tpl(U.md_srcref,{n:a.stmt})+(a.stmt===117?' '+renderCites('{{d8.k3}}'):''):U.md_manual)+'</dd></dl>':'')+'</li>';}).join('')+'</ul>'+
   '<form class="row-end" id="aform" novalidate><div class="field grow"><label for="asub">'+U.md_subst+'</label><input class="input" id="asub" maxlength="255" placeholder="'+esc(U.md_subst_ph)+'" value="'+esc(A.name)+'"></div>'+srcSelect('asrc',A.src)+
   '<button type="submit" class="abtn abtn--primary" id="asave"'+(A.name.trim()?'':' disabled')+'>'+ic('plus',16,2.4)+U.md_add_all+'</button></form>'+(A.err?'<p class="form-error">'+A.err+'</p>':'')+'</section>';
  /* gyógyszerek */
  var list=MD.meds.filter(function(m){return !MD.only||m.active;});
  h+='<section class="stack-12" aria-label="'+esc(U.md_meds)+'"><div class="row-baseline"><h2 class="h2s">'+U.md_meds+'</h2><label class="row-inline checkline push-right"><input type="checkbox" id="monly"'+(MD.only?' checked':'')+'> '+U.md_only+'</label></div>'+
   (list.length?'':'<p class="meta">'+(MD.only?U.md_none_act:U.md_none)+'</p>')+'<ul class="itemlist">'+list.map(function(m){
    return '<li class="item'+(m.active?'':' item--off')+'"><div class="item__row">'+ic('pill')+'<strong>'+esc(m.name)+'</strong><span class="mono">'+(m.dose?esc(m.dose+' '+m.unit):'')+'</span><span class="meta">'+esc([m.ing,m.route].filter(Boolean).join(' · '))+'</span>'+(m.active?'':'<span class="stat stat--kesz">'+U.md_stopped+'</span>')+
     '<div class="actions push-right"><button type="button" class="abtn abtn--sm" data-mdet="m'+m.id+'">'+U.c_det+'</button>'+(m.active?'<button type="button" class="abtn abtn--sm" data-mstop="'+m.id+'">'+ic('stop',14)+U.md_stop+'</button>':'')+'</div></div>'+
     '<div class="item__sub">'+srcMark(m)+'</div>'+
     (MD.det['m'+m.id]?'<dl class="deflist"><dt>'+U.c_id+'</dt><dd class="mono">#'+m.id+'</dd><dt>'+U.md_fname+'</dt><dd>'+esc(m.name)+'</dd><dt>'+U.md_fing+'</dt><dd>'+esc(m.ing||'—')+'</dd><dt>'+U.md_fdose+'</dt><dd class="mono">'+(m.dose?esc(m.dose+' '+m.unit):'—')+'</dd><dt>'+U.md_froute+'</dt><dd>'+esc(m.route||'—')+'</dd><dt>'+U.md_state+'</dt><dd>'+(m.active?U.md_taken:U.md_stopped.toLowerCase())+'</dd><dt>'+U.md_srcl+'</dt><dd>'+(m.stmt?tpl(U.md_srcref,{n:m.stmt})+(m.auto?' '+renderCites('{{d8.k4}}'):''):U.md_manual)+'</dd></dl>':'')+'</li>';}).join('')+'</ul>'+
   '<form class="tabform tabform--inset" id="mform" novalidate><strong>'+U.md_add_med+'</strong><div class="formgrid">'+
   [['mname','name',U.md_fname,''],['ming','ing',U.md_fing,''],['mdose','dose',U.md_fdose,''],['munit','unit',U.md_funit,'mg'],['mroute','route',U.md_froute,'per os']].map(function(f){return '<div class="field"><label for="'+f[0]+'">'+f[2]+'</label><input class="input'+(f[1]==='dose'?' mono':'')+'" id="'+f[0]+'" data-mf="'+f[1]+'" placeholder="'+f[3]+'" value="'+esc(F[f[1]])+'"></div>';}).join('')+
   srcSelect('msrc',F.src)+'</div>'+(F.tried&&F.err?'<p class="form-error">'+F.err+'</p>':'')+'<div class="actions"><button type="submit" class="abtn abtn--primary">'+ic('plus',16,2.4)+U.md_add_med+'</button></div></form></section>';
  /* interakciók */
  h+='<section class="stack-12" aria-label="'+esc(U.md_inter)+'"><div class="row-baseline"><h2 class="h2s">'+U.md_inter+'</h2><span class="meta">'+U.md_inter_src+'</span></div>'+
   '<div class="item__sub"><span class="meta">'+U.md_db+'</span><button type="button" class="abtn abtn--sm" id="mdb">'+U.md_db_btn+'</button></div>';
  var ai=activeInter();
  h+=ai.length?infoFold(ai,U.md_rule):'<p class="meta">'+U.md_noint_cur+'</p>';
  /* ad hoc ellenőrzés */
  h+='<form class="tabform tabform--inset" id="xform"><strong>'+U.md_new+'</strong><span class="meta">'+U.md_new_d+'</span><div class="row-end"><div class="field grow"><label for="xin">'+U.md_drug+'</label><input class="input" id="xin" list="xlist" maxlength="255" placeholder="'+esc(U.md_drug_ph)+'" value="'+esc(X.input)+'">'+
   '<datalist id="xlist">'+D.meds.opts.map(function(o){var b=norm(o.n.split(' ')[0]); return '<option value="'+esc(o.n.split(' ')[0])+'">'+(BRANDS[b]||[]).slice(0,1).map(function(x){return '<option value="'+esc(x.charAt(0).toUpperCase()+x.slice(1))+'">';}).join('');}).join('')+'</datalist></div>'+
   '<button type="button" class="abtn" id="xadd"'+(X.input.trim()&&X.list.length<5?'':' disabled')+'>'+ic('plus',16,2.4)+U.md_add+'</button><button type="submit" class="abtn abtn--primary" id="xchk"'+(X.list.length||X.input.trim()?'':' disabled')+'>'+U.md_check+'</button></div>'+
   (X.list.length?'<div class="mdchips">'+X.list.map(function(s,i){return '<span class="mdchip">'+esc(s)+'<button type="button" data-xdel="'+i+'" aria-label="'+esc(s)+'">'+ic('x',12)+'</button></span>';}).join('')+'</div>':'')+
   '<div id="xres">'+(X.res||'')+'</div></form></section></div>';
  $('#cbody').innerHTML=h;
  bindMeds();
}
function bindMeds(){
  var A=MD.af, F=MD.mf, X=MD.adhoc;
  $$('[data-mdet]').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-mdet'); MD.det[k]=!MD.det[k]; vMeds();};});
  $('#asub').oninput=function(){A.name=this.value; $('#asave').disabled=!A.name.trim();};
  $('#asrc').onchange=function(){A.src=this.value;};
  $('#aform').onsubmit=function(e){ e.preventDefault(); var n=A.name.trim(); if(!n) return;
    if(MD.alls.some(function(a){return norm(a.name)===norm(n);})){ A.err=U.md_dup; vMeds(); return; }
    MD.alls.push({id:++MD.nid, name:n, stmt:A.src?+A.src:null, auto:false}); A.name=''; A.src=''; A.err=null; toast(U.md_saved_a); vMeds(); };
  $('#monly').onchange=function(){MD.only=this.checked; vMeds();};
  $$('[data-mstop]').forEach(function(b){b.onclick=function(){ var m=MD.meds.filter(function(x){return x.id===+b.getAttribute('data-mstop');})[0]; m.active=false; S.statusStale=S.statusGen===2; toast(tpl(U.md_stopped_t,{n:m.name})); vMeds(); };});
  $$('[data-mf]').forEach(function(i){i.oninput=function(){F[i.getAttribute('data-mf')]=i.value;};});
  $('#msrc').onchange=function(){F.src=this.value;};
  $('#mform').onsubmit=function(e){ e.preventDefault(); F.tried=true;
    var d=F.dose.trim().replace(',','.'), dn=d?(/^\d+(\.\d{1,3})?$/.test(d)?parseFloat(d):null):null;
    F.err=!F.name.trim()?U.md_e_name:(d&&(dn===null||dn<=0||dn>=1e7))?U.md_e_dose:(dn!==null&&!F.unit.trim())?U.md_e_unit:null;
    if(F.err){ vMeds(); return; }
    MD.meds.push({id:++MD.nid, name:F.name.trim(), ing:F.ing.trim(), dose:dn!==null?D.num(dn):'', unit:F.unit.trim(), route:F.route.trim(), active:true, stmt:F.src?+F.src:null, auto:false});
    toast(tpl(U.md_saved_m,{n:F.name.trim()})); MD.mf={name:'',ing:'',dose:'',unit:'',route:'',src:'',err:null,tried:false}; S.statusStale=S.statusGen===2; vMeds(); };
  $('#mdb').onclick=function(){toast(U.md_db_toast);};
  var xin=$('#xin');
  xin.oninput=function(){X.input=xin.value; $('#xadd').disabled=!(X.input.trim()&&X.list.length<5); $('#xchk').disabled=!(X.list.length||X.input.trim());};
  function add(){ var v=X.input.trim(); if(!v||X.list.length>=5||X.list.some(function(s){return norm(s)===norm(v);})) return; X.list.push(v); X.input=''; X.res=null; vMeds(); var n=$('#xin'); if(n) n.focus(); }
  xin.onkeydown=function(e){ if(e.key==='Enter'&&X.input.trim()){ e.preventDefault(); add(); } };
  $('#xadd').onclick=add;
  $$('[data-xdel]').forEach(function(b){b.onclick=function(){X.list.splice(+b.getAttribute('data-xdel'),1); X.res=null; vMeds();};});
  $('#xform').onsubmit=async function(e){ e.preventDefault();
    if(X.input.trim()&&X.list.length<5&&!X.list.some(function(s){return norm(s)===norm(X.input);})) X.list.push(X.input.trim());
    X.input=''; if(!X.list.length) return; vMeds();
    var r=$('#xres'); r.innerHTML='<p class="meta"><span class="spin"></span> '+U.md_checking+'</p>'; await sleep(650);
    var lines=[], finds=[], unres=[], L=[];
    X.list.forEach(function(s){ var m=resolveDrug(s);
      if(!m){ lines.push('<li><strong>'+esc(s)+'</strong> → '+U.md_notfound+'</li>'); unres.push('<li><strong>'+esc(s)+'</strong>: '+U.md_notfound+'</li>'); return; }
      lines.push('<li><strong>'+esc(s)+'</strong> → '+esc(m.ing)+' ('+U.md_eg+' '+esc(m.o.n)+')</li>');
      m.o.r.forEach(function(x){ var p=pairOf(x[1]); if(!p||isActive(p[1])) finds.push(x); });
      if(m.o.note) L.push(m.o.note); });
    var h='<div aria-live="polite"><ul class="meta mdres">'+lines.join('')+'</ul>';
    h+=finds.length?infoFold(finds,U.md_with):'<p class="meta">'+ic('check',14)+' '+U.md_noint+'</p>';
    h+=L.map(function(n){return '<p class="note">'+renderCites(n,[])+'</p>';}).join('');
    h+='<p class="meta">'+U.md_foot+'</p>';
    if(unres.length) h+='<div class="item__sub" role="note"><span class="warnchip">'+ic('alert',14)+U.md_unres+'</span><ul class="meta">'+unres.join('')+'</ul></div>';
    X.res=h+'</div>'; S.check=1; renderSteps(); vMeds(); var cb=$('#cbody'); cb.scrollTop=cb.scrollHeight; };
}

/* ---------- chat ---------- */
function renderChat(){
  var el=$('#chatp');
  el.innerHTML='<div class="ph">'+U.ch_title+' <span class="chip">'+IC.spark+' AI</span></div><div class="chat"><div class="cctx">'+IC.check+'<span>'+U.ch_ctx+': <b>'+esc(D.patient.name)+'</b> · '+D.patient.idl+' '+D.patient.id+' · '+U.ch_ctx2+'</span></div><div class="cmsgs" id="cmsgs"><div class="meta" style="font-size:13px">'+U.ch_hello+'</div></div><div class="quick"><div class="qh">'+IC.spark+' '+U.ch_quick+' <small>'+U.ch_quick2+'</small></div>'+D.chat.map(function(c,i){return '<button class="qb" data-q="'+i+'">'+esc(c.q)+'</button>';}).join('')+'</div><div class="cin">'+U.ch_input+'</div></div>';
  [].forEach.call(el.querySelectorAll('.qb'),function(b){b.onclick=function(){ask(+b.getAttribute('data-q'));};});
}
var asking=false;
async function ask(i){
  if(asking) return; asking=true; if(!S.imported) instantImport();
  var c=D.chat[i], box=$('#cmsgs');
  [].forEach.call(document.querySelectorAll('.qb'),function(b){b.disabled=true;});
  box.insertAdjacentHTML('beforeend','<div class="cm u"><div>'+esc(c.q)+'</div></div>');
  var th=document.createElement('div'); th.className='cm a'; th.innerHTML='<div class="thinking"><b>'+U.ch_think+'…</b></div>'; box.appendChild(th); box.scrollTop=box.scrollHeight;
  var tdiv=th.firstChild;
  for(var s=0;s<c.steps.length;s++){ tdiv.insertAdjacentHTML('beforeend','<div><span class="spin"></span>'+esc(c.steps[s])+'</div>'); box.scrollTop=box.scrollHeight; await sleep(650); tdiv.lastChild.firstChild.outerHTML='<span>'+IC.check+'</span>'; }
  await sleep(250);
  var L=[]; var full=renderCites(c.a,L);
  th.innerHTML='<div class="box"><div class="bh"><span class="chip">'+IC.spark+' AI</span>'+uncHtml(c.unc)+'</div><div class="bb"><span id="strm"></span></div><div class="bf">'+U.ch_disc+' · qwen3.5:9b</div></div>';
  var strm=th.querySelector('#strm'); strm.removeAttribute('id');
  var plain=c.a.replace(/\s*\{\{[^}]+\}\}/g,'');
  for(var k=0;k<plain.length;k+=4){ strm.textContent=plain.slice(0,k+4); box.scrollTop=box.scrollHeight; await sleep(12); }
  strm.innerHTML=full;
  var srcl='<div class="srcl">'+L.map(function(code,n){return '<button data-src="'+code+'"><b>'+(n+1)+'</b> '+IC.doc+esc(srcLabel(code))+'</button>';}).join('')+'</div>';
  strm.insertAdjacentHTML('afterend',srcl);
  box.scrollTop=box.scrollHeight;
  S.chatDone[i]=true; asking=false; renderSteps();
  [].forEach.call(document.querySelectorAll('.qb'),function(b){b.disabled=false; if(S.chatDone[b.getAttribute('data-q')]) b.style.opacity='.6';});
}

/* ---------- forrás-ablak ---------- */
function openSrc(code){
  var p=code.split('.'), id=p[0], key=p[1], body='', title='', sub='';
  if(id==='u'||id==='v'){
    var data=id==='u'?D.consult:D.echo; title=id==='u'?U.rec_doc:U.echo_doc; sub=fmtD('2026-11-12');
    body='<div class="tr" style="max-height:none">'+data.lines.map(function(l){return utHtml(l).replace('class="ut '+l[1]+'"','class="ut '+l[1]+(l[0]===key?' hl':'')+'"');}).join('')+'</div>';
  } else if(id.charAt(0)==='L'){
    var di=labIdx(id); title=U.lab_doc; sub=fmtD(LAB_DATES[di])+' · '+U.lab_inst;
    var rows=LABS.filter(function(t){return !t.name;}).map(function(t){var v=t.v[di],f=flagOf(t,v);return '<tr class="'+(t.id===key?'hlx':'')+'" id="'+(t.id===key?'hlt':'')+'"><td>'+D.tests[t.id]+'</td><td><b>'+fmtV(v)+'</b></td><td>'+t.unit+'</td><td>'+refTxt(t)+'</td><td style="color:#a3142c;font-weight:700">'+f+'</td></tr>';}).join('');
    var tm=TXT[0].m[di]; rows+='<tr class="'+(key==='uprot'?'hlx':'')+'" id="'+(key==='uprot'?'hlt':'')+'"><td>'+esc(D.uprot.name)+'</td><td><b>'+esc(tm.s)+'</b></td><td></td><td>'+esc(D.uprot.ref)+'</td><td style="color:#a3142c;font-weight:700">'+(txtDiff(tm.s)?'≠':'')+'</td></tr>';
    body='<div class="docp"><div class="dh"><b>'+U.lab_doc+'</b><span>'+esc(D.patient.name)+' · '+D.patient.idl+' '+D.patient.id+'<br>'+fmtD(LAB_DATES[di])+'</span></div><table class="dt"><tr>'+U.lab_cols.map(function(c){return '<th>'+c+'</th>';}).join('')+'</tr>'+rows+'</table></div>';
  } else {
    var d=D.docs[id]; if(!d) return; title=d.title; sub=fmtD(d.date)+' · '+d.inst;
    body='<div class="docp"><div class="dh"><b>'+esc(d.title)+'</b><span>'+esc(D.patient.name)+' · '+D.patient.idl+' '+D.patient.id+'<br>'+esc(d.inst)+' · '+fmtD(d.date)+'</span></div>'+
     d.body.map(function(par){return '<p>'+esc(par).replace(/\[\[([a-z0-9]+)\|(.*?)\]\]/g,function(m,sid,txt){return '<span class="'+(sid===key?'hlx':'')+'" id="'+(sid===key?'hlt':'')+'">'+txt+'</span>';})+'</p>';}).join('')+'</div>';
  }
  var m=document.createElement('div'); m.className='modal';
  m.innerHTML='<div class="mbox"><div class="mh">'+typeIcon(id.charAt(0)==='L'?'lab':'doc')+'<div><b>'+esc(title)+'</b><div class="meta" style="margin:0">'+esc(sub)+' · '+U.extracted+'</div></div><button class="x">'+U.close+' ✕</button></div><div class="mb">'+body+'</div></div>';
  document.body.appendChild(m);
  m.onclick=function(e){if(e.target===m||e.target.closest('.x')) m.remove();};
  document.addEventListener('keydown',function k(e){if(e.key==='Escape'){m.remove();document.removeEventListener('keydown',k);}});
  setTimeout(function(){var h=m.querySelector('#hlt')||m.querySelector('.ut.hl'); if(h) scrollIn(h,'.mb');},120);
}

/* ---------- indulás ---------- */
shell(); renderSources(); renderChat(); go(0);
})();
