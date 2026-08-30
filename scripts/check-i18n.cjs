/**
 * Every `t('...')` in the app resolves to a real string.
 *
 * A missing key is the one class of copy bug nothing else catches: i18next
 * renders the key itself, so the screen looks fine to a type checker, passes
 * lint, and ships reading "s.invites.title". This walks the source for every
 * quoted `s.` / `core.` / `shared.` string, resolves each against the merged
 * English deck, and understands both plural suffixes and the dynamic
 * `t(`s.plan.bill.${x}`)` form.
 *
 *   node scripts/check-i18n.cjs          report live vs dead keys per group
 *   node scripts/check-i18n.cjs verify   exit non-zero if any key is missing
 */
const fs=require('fs'),path=require('path');
function loadNs(file,name){let s=fs.readFileSync(file,'utf8').replace(/^import .*$/gm,'').replace(/export const /g,'const ').replace(/ as const/g,'');
  s+=`\nmodule.exports.__x=${name};`;const m={exports:{}};new Function('module','exports',s)(m,m.exports);return m.exports.__x;}
const L='src/i18n/locales/';
const en=Object.assign({},loadNs(L+'screens.ts','screensEn'),loadNs(L+'core-screens.ts','coreScreensEn'),loadNs(L+'shared.ts','sharedEn'));
const leaves=[];(function w(o,p){for(const k of Object.keys(o)){const v=o[k],q=p?p+'.'+k:k;
  if(v&&typeof v==='object')w(v,q);else leaves.push(q);}})(en,'');
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);
  if(e.isDirectory())walk(f,out);else if(/\.tsx?$/.test(e.name))out.push(f);}return out;}
const srcFiles=walk('src').filter(f=>!f.includes(path.join('i18n','locales')));
const text=srcFiles.map(f=>fs.readFileSync(f,'utf8')).join('\n');
// Any quoted string anywhere that looks like a key: catches t(), i18n.t(),
// translated(), ternaries and variables alike. Deliberately over-broad.
const referenced=new Set([...text.matchAll(/'((?:s|core|shared)\.[A-Za-z0-9_.]+)'/g)].map(m=>m[1]));
const prefixes=[...text.matchAll(/`((?:s|core|shared)\.[A-Za-z0-9_.]*)\$\{/g)].map(m=>m[1].replace(/\.$/,''));
const isLive=k=>{const b=k.replace(/_(one|other|zero|two|few|many)$/,'');
  return referenced.has(b)||referenced.has(k)||prefixes.some(p=>p&&b.startsWith(p+'.'));};
const dead=leaves.filter(k=>!isLive(k));
const mode=process.argv[2];
if(mode==='verify'){const missing=[...referenced].filter(k=>{
    const get=(o,q)=>q.split('.').reduce((a,c)=>a&&typeof a==='object'?a[c]:undefined,o);
    return get(en,k)===undefined && !leaves.some(l=>l.replace(/_(one|other)$/,'')===k);});
  console.log(missing.length?'MISSING KEYS:\n'+missing.join('\n'):'every referenced key resolves ('+referenced.size+' static + '+prefixes.length+' dynamic prefixes)');
  process.exit(missing.length?1:0);}
const tops=new Map();
for(const k of leaves){const g=k.split('.').slice(0,2).join('.');
  const e=tops.get(g)||{live:0,dead:0};isLive(k)?e.live++:e.dead++;tops.set(g,e);}
console.log('leaves',leaves.length,'dead',dead.length,'\n');
[...tops.entries()].sort().forEach(([g,e])=>console.log(`${e.live===0?'DEAD ':'keep '} ${g}  live=${e.live} dead=${e.dead}`));
