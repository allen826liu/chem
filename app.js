import { elements, byNumber } from './elements.js';
import { selectElements, getPoolIds, gradeSession, restoreSession } from './logic.js';
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
  catch { $('save-status').textContent = '浏览器未允许保存；关闭页面前请完成本轮练习'; }
  $('wrong-count').textContent = wrongBank.size;
}
function node(tag, className, text) { const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el; }
function notify(message) { clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3500); }
function updateProgress() {
  const complete=session.ids.filter(z=>session.answers[z]?.symbol?.trim() && session.answers[z]?.name?.trim()).length;
  $('progress-label').textContent=picking?`已选 ${manual.size} 个`:`${session.graded?'已批改':'已填'} ${session.graded?session.ids.length:complete} / ${session.ids.length}`;
  $('progress-fill').style.width=picking?`${manual.size/118*100}%`:`${(session.graded?session.ids.length:complete)/session.ids.length*100}%`;
}
function createInput(e, field, report) {
  const input=node('input', field==='symbol'?'symbol-input':`name-input ${session.language==='en'?'english':''}`);
  input.type='text';input.value=session.answers[e.z]?.[field] || '';
  input.placeholder=field==='symbol'?'符号':session.language==='zh'?'名称':'Name';
  input.setAttribute('aria-label',`第 ${e.z} 号元素${field==='symbol'?'符号':session.language==='zh'?'中文名称':'英文名称'}`);
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
  const message=node('div','table-message');message.append(node('div','message-icon','✎'));
  const copy=node('div');copy.append(node('strong','',picking?'你来决定，这轮记哪些。':session.graded?'记住的每一个，都算进步。':'留白，是为了想起来。'));
  copy.append(node('p','',picking?'点选任意格子，再点击「开始默写」。原子序数和位置会保留，答案不会提前出现。':session.graded?'绿色表示两项都正确，红色表示有错或漏填。下方可以查看逐项反馈，也可以只重练错题。':'上面一空写元素符号，下面一空写元素名称。保留原子序数和位置，让记忆有迹可循。'));message.append(copy);table.append(message);
  for(const [row,range,title] of [[6,'57–71','镧系'],[7,'89–103','锕系']]){const el=node('div','f-placeholder');el.style.gridColumn=4;el.style.gridRow=row+1;el.append(node('span','',range),node('span','',title));table.append(el);}
  for(const [row,title] of [[9,'镧系'],[10,'锕系']]){const label=node('div','series-label',title);label.style.gridColumn='2 / 5';label.style.gridRow=row+1;table.append(label);}
  const reports=session.graded?new Map(gradeSession(session).details.map(r=>[r.z,r])):new Map();
  for(const e of elements){
    const selected=picking?manual.has(e.z):session.ids.includes(e.z),report=reports.get(e.z);
    const cell=node(picking?'button':'div',`cell ${e.family} ${selected?'active-cell':'inactive'} ${picking?'pick':''} ${picking&&selected?'selected':''} ${report?(report.correct?'correct':'incorrect'):''}`);
    cell.style.gridColumn=e.col+1;cell.style.gridRow=e.row+1;cell.dataset.number=e.z;
    cell.append(node('span','atomic-number',e.z));
    if(picking){cell.type='button';cell.setAttribute('aria-label',`${selected?'取消选择':'选择'}第 ${e.z} 号元素`);cell.setAttribute('aria-pressed',String(selected));cell.append(node('span','pick-label',selected?'✓ 已选':'选择'));cell.addEventListener('click',()=>{manual.has(e.z)?manual.delete(e.z):manual.add(e.z);renderTable();updateSelection();table.querySelector(`[data-number="${e.z}"]`)?.focus({preventScroll:true});});}
    else if(selected){cell.append(createInput(e,'symbol',report),createInput(e,'name',report));if(report)cell.append(node('span','grade-status',report.correct?'✓ 全对':report.caseError?'大小写有误':report.symbolBlank&&report.nameBlank?'未填写':'需复习'));}
    table.append(cell);
  }
  updateProgress();
}
function updateSelection(){ $('selection-text').textContent=`点选格子，已选择 ${manual.size} 个元素；点击「开始默写」进入练习。`;$('count').value=manual.size;$('start').disabled=manual.size===0; }
function updateSettings() {
  $('count').disabled=picking;$('minus').disabled=picking;$('plus').disabled=picking;$('pool').disabled=picking;
  $('selection-note').hidden=!picking;$('submit').disabled=picking||session.graded;$('reference').disabled=picking;
  if(picking){$('results').hidden=true;$('mistake-details').hidden=true;$('table-heading').textContent='自己选 · 点击格子选择元素';$('instructions').textContent='已选格子显示勾号；符号和名称在开始后填写。';updateSelection();}
  else{$('start').disabled=false;$('instructions').textContent=session.graded?'本轮已批改。红色输入框是错项，绿色输入框是正确项。':'在亮起的格子里填写；灰色格子本轮不用默写。';}
}
function countValue(){const n=Number($('count').value),max=getPoolIds($('pool').value).length;return Math.max(1,Math.min(max,Number.isFinite(n)?Math.floor(n):20));}
function syncCount(){const max=getPoolIds($('pool').value).length;$('count').max=max;if(!picking)$('count').value=countValue();$('count-limit').textContent=picking?'点选下方格子':`可选 1–${max} 个`;$('pool-note').hidden=picking||$('pool').value!=='monthly';}
function newSession(ids, title) {
  if(!ids.length){notify('先选至少一个元素。');return;}
  session={ids:[...ids].sort((a,b)=>a-b),language:$('language').value,answers:{},graded:false};picking=false;
  $('table-heading').textContent=title||`这一轮 · ${ids.length} 个元素`;
  $('results').hidden=true;$('mistake-details').hidden=true;
  $('action-title').textContent='每一个空格，都是一次记忆练习。';
  $('action-tip').textContent=session.language==='zh'?'符号区分大小写，例如 He；中文名只填元素名。':'符号区分大小写；英文名称不区分大小写，兼容常见英美拼写。';
  $('reference').textContent='查看完整答案表';$('submit').innerHTML='交卷并批改 <span aria-hidden="true">✓</span>';
  persist();updateSettings();renderTable();
}
function renderResults(){
  const result=gradeSession(session);const container=$('results');container.replaceChildren();container.hidden=false;
  const score=node('div','result-score',result.percent);score.append(node('span','','%'));container.append(score);
  const message=node('div','result-message');message.append(node('h2','',result.wrong.length===0?'全部记住了，做得好！':result.percent>=70?'大部分都记住了，再巩固一下。':'找到薄弱处，下一轮会更熟悉。'));
  message.append(node('p','',`符号与名称共答对 ${result.fieldsCorrect} / ${result.fieldsTotal} 项 · ${result.elementsCorrect} / ${session.ids.length} 个元素全对${result.blanks?` · 漏填 ${result.blanks} 项`:''}。`));container.append(message);
  const actions=node('div','result-actions');if(result.wrong.length){const retry=node('button','primary',`重练本轮错题 (${result.wrong.length})`);retry.addEventListener('click',()=>newSession(result.wrong,'错题重练 · '+result.wrong.length+' 个元素'));actions.append(retry);}
  const again=node('button','secondary','再默同一组');again.addEventListener('click',()=>newSession(session.ids,'再默一轮 · '+session.ids.length+' 个元素'));actions.append(again);container.append(actions);
  const list=$('mistake-list');list.replaceChildren();$('mistake-details').hidden=!result.wrong.length;
  for(const r of result.details.filter(r=>!r.correct)){
    const e=byNumber.get(r.z),row=node('div','mistake-row'),text=node('div');row.append(node('div','mistake-symbol',e.symbol));
    text.append(node('small','',`原子序数 ${e.z}`),node('strong','',session.language==='zh'?e.zh:e.en));
    if(!r.symbolCorrect)text.append(node('p','',r.symbolBlank?'符号漏填':r.caseError?`符号：${r.symbol} → ${e.symbol}（注意大小写）`:`符号：${r.symbol} → ${e.symbol}`));
    if(!r.nameCorrect)text.append(node('p','',r.nameBlank?'名称漏填':`名称：${r.name} → ${e[session.language]}`));
    row.append(text);list.append(row);
  }
  $('action-title').textContent=`本轮已批改：${result.elementsCorrect} 个元素全对，${result.wrong.length} 个待复习。`;
  $('action-tip').textContent='可以查看完整答案表，或点击「重练本轮错题」继续。';$('submit').disabled=true;
  $('reference').textContent='查看完整答案表';updateProgress();
}
function submit(scroll=true){if(picking||session.graded)return;session.graded=true;const result=gradeSession(session);for(const r of result.details){r.correct?wrongBank.delete(r.z):wrongBank.add(r.z);}persist();renderTable();updateSettings();renderResults();if(scroll)$('results').scrollIntoView({behavior:'smooth',block:'center'});}
for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>{const wasPicking=picking;mode=button.dataset.mode;picking=mode==='manual';for(const b of document.querySelectorAll('[data-mode]')){b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));}if(picking&&!wasPicking)manual=new Set(session.ids);if(!picking){$('count').value=session.ids.length;$('table-heading').textContent=`这一轮 · ${session.ids.length} 个元素`;}syncCount();updateSettings();renderTable();if(!picking&&session.graded)renderResults();});
$('start').addEventListener('click',()=>{const pool=$('pool').value;const ids=selectElements(mode,countValue(),pool,[...manual]);const title=pool==='monthly'&&mode!=='manual'?`月考范围 · ${mode==='random'?'随机抽':'按顺序'} ${ids.length} / 54 个`:mode==='first'?`这一轮 · 前 ${ids.length} 个元素`:mode==='random'?`随机默写 · ${ids.length} 个元素`:`自选默写 · ${ids.length} 个元素`;newSession(ids,title);notify(`准备好了，这轮默 ${ids.length} 个。`);});
$('count').addEventListener('change',syncCount);$('pool').addEventListener('change',()=>{if($('pool').value==='monthly')$('count').value=getPoolIds('monthly').length;syncCount();persist();});
$('minus').addEventListener('click',()=>{$('count').value=countValue()-1;syncCount();});$('plus').addEventListener('click',()=>{$('count').value=countValue()+1;syncCount();});
$('select-all').addEventListener('click',()=>{manual=new Set(elements.map(e=>e.z));renderTable();updateSelection();});$('clear-selection').addEventListener('click',()=>{manual.clear();renderTable();updateSelection();});
$('submit').addEventListener('click',()=>submit());
$('wrong-bank').addEventListener('click',()=>{if(!wrongBank.size){notify('还没有错题。完成一轮批改后，错题会自动收在这里。');return;}newSession([...wrongBank],`错题本 · ${wrongBank.size} 个元素`);notify('已开始错题本练习，答对的元素会自动移出。');});
$('reference').addEventListener('click',()=>{submit(false);const content=$('reference-content');content.replaceChildren();for(const e of elements){const item=node('div','reference-item');item.append(node('span','symbol',e.symbol));const names=node('div');names.append(node('small','',e.z),node('strong','',e.zh),node('span','english-name',e.en));item.append(names);content.append(item);}$('reference-dialog').showModal();});
$('close-reference').addEventListener('click',()=>$('reference-dialog').close());$('reference-dialog').addEventListener('click',event=>{if(event.target===$('reference-dialog')){const box=$('reference-dialog').getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)$('reference-dialog').close();}});
$('table-heading').textContent=`${saved.session?'已恢复这一轮':'这一轮'}${$('pool').value==='monthly'&&session.ids.every(z=>getPoolIds('monthly').includes(z))?' · 月考范围':''} · ${session.ids.length} 个元素`;
$('action-tip').textContent=session.language==='zh'?'符号区分大小写，例如 He；中文名只填元素名。':'符号区分大小写；英文名称不区分大小写，兼容常见英美拼写。';
syncCount();persist();renderTable();updateSettings();if(session.graded)renderResults();
