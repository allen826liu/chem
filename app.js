import { elements, byNumber } from './elements.js';
import { selectElements, getPoolIds, gradeSession, restoreSession } from './logic.js?v=compact-20261011';
const $ = id => document.getElementById(id);
const KEY = 'element-room-v1';
let mode = 'first', manual = new Set(), picking = false, toastTimer;
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch {}
let wrongBank = new Set((Array.isArray(saved.wrong) ? saved.wrong : []).filter(z => byNumber.has(z)));
let session = restoreSession(saved.session) || { ids: selectElements('first',20,118), language:'zh',answers:{},graded:false };
if ([...$('pool').options].some(option => option.value === String(saved.pool))) $('pool').value = String(saved.pool);
$('language').value = session.language;
$('count').value = session.ids.length;
function persist() {
  try { localStorage.setItem(KEY,JSON.stringify({ session, wrong:[...wrongBank], pool:$('pool').value })); }
  catch { $('save-status').textContent = '无法保存'; }
  $('wrong-count').textContent = wrongBank.size;
}
function node(tag, className, text) { const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el; }
function notify(message) { clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3500); }
function updateProgress() {
  const complete=session.ids.filter(z=>session.answers[z]?.symbol?.trim() && session.answers[z]?.name?.trim()).length;
  $('progress-label').textContent=picking?`${manual.size} / 118`:`${session.graded?'已批改 ':''}${session.graded?session.ids.length:complete} / ${session.ids.length}`;
  $('progress-fill').style.width=picking?`${manual.size/118*100}%`:`${(session.graded?session.ids.length:complete)/session.ids.length*100}%`;
}
function createInput(e, field, report) {
  const input=node('input', field==='symbol'?'symbol-input':`name-input ${session.language==='en'?'english':''}`);
  input.type='text';input.value=session.answers[e.z]?.[field] || '';
  input.placeholder=field==='symbol'?'符号':session.language==='zh'?'名称':'Name';
  input.setAttribute('aria-label',`第 ${e.z} 号元素${field==='symbol'?'符号':session.language==='zh'?'中文名称':'英文名称'}`);
  if(field==='symbol')input.title='符号区分大小写';
  input.dataset.z=e.z;input.dataset.field=field;input.maxLength=field==='symbol'?8:32;
  input.autocomplete='off';input.spellcheck=false;input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');
  if(field==='symbol' || session.language==='en')input.setAttribute('inputmode','text');
  input.disabled=session.graded;
  if(report){const correct=field==='symbol'?report.symbolCorrect:report.nameCorrect;input.classList.add(correct?'right-field':'wrong-field');input.setAttribute('aria-invalid',String(!correct));}
  input.addEventListener('input',()=>{session.answers[e.z] ||= {};session.answers[e.z][field]=input.value;persist();updateProgress();});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();const inputs=[...$('periodic-table').querySelectorAll('input:not(:disabled)')];inputs[(inputs.indexOf(input)+1)%inputs.length]?.focus();}});
  return input;
}
function renderTable() {
  const table=$('periodic-table');table.replaceChildren();
  for(let col=1;col<=18;col++){const label=node('div','group-label',col);label.style.gridColumn=col+1;label.style.gridRow=1;table.append(label);}
  for(let row=1;row<=7;row++){const label=node('div','period-label',row);label.style.gridColumn=1;label.style.gridRow=row+1;table.append(label);}
  for(const [row,range,title] of [[6,'57–71','镧系'],[7,'89–103','锕系']]){const el=node('div','f-placeholder');el.style.gridColumn=4;el.style.gridRow=row+1;el.append(node('span','',range),node('span','',title));table.append(el);}
  for(const [row,title] of [[9,'镧系'],[10,'锕系']]){const label=node('div','series-label',title);label.style.gridColumn='2 / 5';label.style.gridRow=row+1;table.append(label);}
  const reports=session.graded?new Map(gradeSession(session).details.map(r=>[r.z,r])):new Map();
  for(const e of elements){
    const selected=picking?manual.has(e.z):session.ids.includes(e.z),report=reports.get(e.z);
    const cell=node(picking?'button':'div',`cell ${e.family} ${selected?'active-cell':'inactive'} ${picking?'pick':''} ${picking&&selected?'selected':''} ${report?(report.correct?'correct':'incorrect'):''}`);
    cell.style.gridColumn=e.col+1;cell.style.gridRow=e.row+1;cell.dataset.number=e.z;
    cell.append(node('span','atomic-number',e.z));
    if(picking){cell.type='button';cell.setAttribute('aria-label',`${selected?'取消选择':'选择'}第 ${e.z} 号元素`);cell.setAttribute('aria-pressed',String(selected));cell.append(node('span','pick-label',selected?'✓':'+'));cell.addEventListener('click',()=>{manual.has(e.z)?manual.delete(e.z):manual.add(e.z);renderTable();updateSelection();table.querySelector(`[data-number="${e.z}"]`)?.focus({preventScroll:true});});}
    else if(selected){cell.append(createInput(e,'symbol',report),createInput(e,'name',report));if(report)cell.append(node('span','grade-status',report.correct?'✓':report.caseError?'大小写':report.symbolBlank&&report.nameBlank?'未填':'错误'));}
    table.append(cell);
  }
  updateProgress();
}
function updateSelection(){ $('selection-text').textContent=`已选 ${manual.size} 个`;$('count').value=manual.size;$('start').disabled=manual.size===0; }
function updateSettings() {
  $('count').disabled=picking;$('minus').disabled=picking;$('plus').disabled=picking;$('pool').disabled=picking;
  $('selection-note').hidden=!picking;$('submit').disabled=picking||session.graded;$('reference').disabled=picking;
  if(picking){$('results').hidden=true;$('mistake-details').hidden=true;$('table-heading').textContent='自选';updateSelection();}
  else{$('start').disabled=false;}
}
function countValue(){const n=Number($('count').value),max=getPoolIds($('pool').value).length;return Math.max(1,Math.min(max,Number.isFinite(n)?Math.floor(n):20));}
function syncCount(){const max=getPoolIds($('pool').value).length;$('count').max=max;if(!picking)$('count').value=countValue();$('count-limit').textContent=picking?'自选':`1–${max}`;$('pool-note').hidden=picking||$('pool').value!=='monthly';}
function newSession(ids, title) {
  if(!ids.length){notify('至少选择 1 个元素');return;}
  session={ids:[...ids].sort((a,b)=>a-b),language:$('language').value,answers:{},graded:false};picking=false;
  $('table-heading').textContent=title||'周期表';
  $('results').hidden=true;$('mistake-details').hidden=true;
  $('reference').textContent='答案';$('submit').textContent='批改';
  persist();updateSettings();renderTable();
}
function renderResults(){
  const result=gradeSession(session);const container=$('results');container.replaceChildren();container.hidden=false;
  const score=node('div','result-score',result.percent);score.append(node('span','','%'));container.append(score);
  const message=node('div','result-message');message.append(node('h2','',`正确 ${result.elementsCorrect} / ${session.ids.length} 个`));
  message.append(node('p','',`答对 ${result.fieldsCorrect} / ${result.fieldsTotal} 项${result.blanks?` · 漏填 ${result.blanks} 项`:''}`));container.append(message);
  const actions=node('div','result-actions');if(result.wrong.length){const retry=node('button','primary',`重练错题 (${result.wrong.length})`);retry.addEventListener('click',()=>newSession(result.wrong,'错题'));actions.append(retry);}
  const again=node('button','secondary','重练');again.addEventListener('click',()=>newSession(session.ids,'周期表'));actions.append(again);container.append(actions);
  const list=$('mistake-list');list.replaceChildren();$('mistake-details').hidden=!result.wrong.length;
  for(const r of result.details.filter(r=>!r.correct)){
    const e=byNumber.get(r.z),row=node('div','mistake-row'),text=node('div');row.append(node('div','mistake-symbol',e.symbol));
    text.append(node('small','',`原子序数 ${e.z}`),node('strong','',session.language==='zh'?e.zh:e.en));
    if(!r.symbolCorrect)text.append(node('p','',r.symbolBlank?'符号漏填':r.caseError?`符号：${r.symbol} → ${e.symbol}（注意大小写）`:`符号：${r.symbol} → ${e.symbol}`));
    if(!r.nameCorrect)text.append(node('p','',r.nameBlank?'名称漏填':`名称：${r.name} → ${e[session.language]}`));
    row.append(text);list.append(row);
  }
  $('submit').disabled=true;
  $('reference').textContent='答案';updateProgress();
}
function submit(scroll=true){if(picking||session.graded)return;session.graded=true;const result=gradeSession(session);for(const r of result.details){r.correct?wrongBank.delete(r.z):wrongBank.add(r.z);}persist();renderTable();updateSettings();renderResults();if(scroll)$('results').scrollIntoView({behavior:'smooth',block:'center'});}
for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>{const wasPicking=picking;mode=button.dataset.mode;picking=mode==='manual';for(const b of document.querySelectorAll('[data-mode]')){b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));}if(picking&&!wasPicking)manual=new Set(session.ids);if(!picking){$('count').value=session.ids.length;$('table-heading').textContent='周期表';}syncCount();updateSettings();renderTable();if(!picking&&session.graded)renderResults();});
$('start').addEventListener('click',()=>{const pool=$('pool').value;const ids=selectElements(mode,countValue(),pool,[...manual]);const title=pool==='monthly'&&mode!=='manual'?'月考范围':mode==='manual'?'自选':'周期表';newSession(ids,title);});
$('count').addEventListener('change',syncCount);$('pool').addEventListener('change',()=>{if($('pool').value==='monthly')$('count').value=getPoolIds('monthly').length;syncCount();persist();});
$('minus').addEventListener('click',()=>{$('count').value=countValue()-1;syncCount();});$('plus').addEventListener('click',()=>{$('count').value=countValue()+1;syncCount();});
$('select-all').addEventListener('click',()=>{manual=new Set(elements.map(e=>e.z));renderTable();updateSelection();});$('clear-selection').addEventListener('click',()=>{manual.clear();renderTable();updateSelection();});
$('submit').addEventListener('click',()=>submit());
$('wrong-bank').addEventListener('click',()=>{if(!wrongBank.size){notify('暂无错题');return;}newSession([...wrongBank],'错题');});
$('reference').addEventListener('click',()=>{submit(false);const content=$('reference-content');content.replaceChildren();for(const e of elements){const item=node('div','reference-item');item.append(node('span','symbol',e.symbol));const names=node('div');names.append(node('small','',e.z),node('strong','',e.zh),node('span','english-name',e.en));item.append(names);content.append(item);}$('reference-dialog').showModal();});
$('close-reference').addEventListener('click',()=>$('reference-dialog').close());$('reference-dialog').addEventListener('click',event=>{if(event.target===$('reference-dialog')){const box=$('reference-dialog').getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)$('reference-dialog').close();}});
$('table-heading').textContent=$('pool').value==='monthly'&&session.ids.every(z=>getPoolIds('monthly').includes(z))?'月考范围':'周期表';
syncCount();persist();renderTable();updateSettings();if(session.graded)renderResults();
