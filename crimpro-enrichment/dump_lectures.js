const s=require('fs').readFileSync('crimpro.html','utf8');const m=s.match(/const REAL_LECTURES = \[[\s\S]*?\n\];/);const L=new Function(m[0]+';return REAL_LECTURES')();
require('fs').writeFileSync(process.env.SPW+'/real_lectures.json',JSON.stringify(L.map(l=>({n:l.n,title:l.title,text:l.text||''}))))
