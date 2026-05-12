
const $ = id => document.getElementById(id);
let charts = {};
const fmt = v => '$' + Math.round(v).toLocaleString();
const fmtD = v => '$' + parseFloat(v).toFixed(2);
const CGRID = 'rgba(255,255,255,0.04)';
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'DM Sans';

function dc(k){if(charts[k]){charts[k].destroy();delete charts[k];}}
function syncR(id,lid,sfx){$(lid).textContent=$(id).value+sfx;}

function switchTab(name,btn){
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  $('tab-'+name).classList.add('active');
  btn.classList.add('active');
  if(name==='expected')calcEM();
  if(name==='greeks')calcGreeks();
  if(name==='exit')calcExit();
  if(name==='montecarlo')runMC();
  if(name==='journal')renderJournalChart();
  if(name==='income')renderIncomeChart();
}

// ── POSITION SIZING ──
function calcPosition(){
  const account=parseFloat($('ps-account').value)||10000;
  const riskPct=parseFloat($('ps-risk').value)/100;
  const entry=parseFloat($('ps-entry').value)||292.68;
  const stop=parseFloat($('ps-stop').value)||283.90;
  const conf=parseFloat($('ps-conf').value)/10;
  const riskAmt=account*riskPct;
  const riskPerShare=Math.abs(entry-stop);
  const baseShares=riskPerShare>0?Math.floor(riskAmt/riskPerShare):0;
  const adjShares=Math.floor(baseShares*conf);
  const totalCost=adjShares*entry;
  const maxLoss=adjShares*riskPerShare;
  $('ps-risk-amt').textContent=fmt(riskAmt);
  $('ps-risk-share').textContent=fmtD(riskPerShare);
  $('ps-base-shares').textContent=baseShares;
  $('ps-adj-shares').textContent=adjShares;
  $('ps-total-cost').textContent=fmt(totalCost);
  $('ps-max-loss').textContent=fmtD(maxLoss);
  $('ps-t1').textContent=fmtD(entry+riskPerShare);
  $('ps-t2').textContent=fmtD(entry+2*riskPerShare);
  $('ps-t3').textContent=fmtD(entry+3*riskPerShare);
  // FIRE callout
  const annualFIRE=40000; const dailyFIRE=annualFIRE/365;
  const fireDays=(maxLoss/dailyFIRE).toFixed(1);
  $('ps-fire-days').textContent=fireDays+' days';
  // Chart
  dc('psChart');
  const prices=[stop,stop+(entry-stop)/2,entry,entry+riskPerShare,entry+2*riskPerShare,entry+3*riskPerShare];
  const pnl=prices.map(p=>(p-entry)*adjShares);
  charts.psChart=new Chart($('ps-chart'),{
    type:'bar',
    data:{labels:prices.map(p=>'$'+p.toFixed(0)),datasets:[{data:pnl,backgroundColor:pnl.map(v=>v>=0?'rgba(16,185,129,.6)':'rgba(239,68,68,.6)'),borderColor:pnl.map(v=>v>=0?'#10b981':'#ef4444'),borderWidth:1,borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:9}}}}}
  });
}

// ── EXPECTED MOVE ──
function calcEM(){
  const price=parseFloat($('em-price').value)||292.68;
  const iv=parseFloat($('em-iv').value)/100;
  const dte=parseFloat($('em-dte').value)||30;
  const move=price*iv*Math.sqrt(dte/365);
  const up=price+move;const down=price-move;
  $('em-range').textContent=fmtD(down)+' – '+fmtD(up);
  $('em-move').textContent='±'+fmtD(move);
  $('em-up').textContent=fmtD(up);$('em-down').textContent=fmtD(down);
  $('em-1sd').textContent='±'+fmtD(move);
  $('em-2sd').textContent='±'+fmtD(move*2);
  $('em-3sd').textContent='±'+fmtD(move*3);
  $('em-iv-disp').textContent=(iv*100).toFixed(0)+'%';
  $('em-pct-disp').textContent=(move/price*100).toFixed(1)+'%';
  $('em-dte-disp').textContent=dte;
  // Bell curve
  dc('emChart');
  const pts=60;const labels=[];const data=[];
  for(let i=0;i<pts;i++){const x=price-move*2.5+(i/pts)*move*5;const z=(x-price)/move;const y=Math.exp(-0.5*z*z)/(Math.sqrt(2*Math.PI));labels.push('$'+x.toFixed(0));data.push(y);}
  charts.emChart=new Chart($('em-chart'),{
    type:'line',
    data:{labels,datasets:[{data,borderColor:'#f97316',backgroundColor:'rgba(249,115,22,.12)',fill:true,tension:.4,pointRadius:0,borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:CGRID},ticks:{maxTicksLimit:6,font:{size:9}}},y:{display:false}}}
  });
}

// ── GREEKS (Black-Scholes approximation) ──
function norm(x){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const sign=x<0?-1:1;x=Math.abs(x);const t=1/(1+p*x);const y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);return 0.5*(1+sign*y);}
function calcGreeks(){
  const S=parseFloat($('gr-stock').value)||292.68;
  const K=parseFloat($('gr-strike').value)||295;
  const T=parseFloat($('gr-dte').value)/365;
  const r=parseFloat($('gr-rfr').value)/100;
  const sigma=parseFloat($('gr-iv').value)/100;
  const type=$('gr-type').value;
  const d1=(Math.log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
  const d2=d1-sigma*Math.sqrt(T);
  const Nd1=norm(d1),Nd2=norm(d2),nNd1=norm(-d1),nNd2=norm(-d2);
  const phi=Math.exp(-0.5*d1*d1)/Math.sqrt(2*Math.PI);
  let price,delta,theta;
  if(type==='call'){
    price=S*Nd1-K*Math.exp(-r*T)*Nd2;
    delta=Nd1;
    theta=(-S*phi*sigma/(2*Math.sqrt(T))-r*K*Math.exp(-r*T)*Nd2)/365;
  } else {
    price=K*Math.exp(-r*T)*nNd2-S*nNd1;
    delta=Nd1-1;
    theta=(-S*phi*sigma/(2*Math.sqrt(T))+r*K*Math.exp(-r*T)*nNd2)/365;
  }
  const gamma=phi/(S*sigma*Math.sqrt(T));
  const vega=S*phi*Math.sqrt(T)/100;
  const be=type==='call'?K+price:K-price;
  $('gr-delta').textContent=delta.toFixed(4);
  $('gr-gamma').textContent=gamma.toFixed(4);
  $('gr-theta').textContent=fmtD(theta);
  $('gr-vega').textContent=fmtD(vega);
  $('gr-price').textContent=fmtD(price);
  $('gr-be').textContent=fmtD(be);
  $('gr-theta-note').textContent=fmtD(theta);
  // P&L chart
  dc('grPnl');
  const strikes=Array.from({length:40},(_,i)=>K-20+i);
  const pnl=type==='call'?strikes.map(p=>Math.max(0,p-K)-price):strikes.map(p=>Math.max(0,K-p)-price);
  charts.grPnl=new Chart($('gr-pnl-chart'),{
    type:'line',
    data:{labels:strikes.map(s=>'$'+s),datasets:[{data:pnl,borderColor:'#f97316',backgroundColor:'transparent',tension:0,pointRadius:0,borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:CGRID},ticks:{maxTicksLimit:8,font:{size:9}}},y:{grid:{color:CGRID},ticks:{callback:v=>fmtD(v),font:{size:9}}}}}
  });
}

// ── EXIT STRATEGY ──
function calcExit(){
  const entry=parseFloat($('ex-entry').value)||292.68;
  const stop=parseFloat($('ex-stop').value)||283.90;
  const shares=parseFloat($('ex-shares').value)||15;
  const rMult=parseFloat($('ex-r').value)||2;
  const risk=Math.abs(entry-stop);
  const maxLoss=-shares*risk;
  const t1=entry+risk;const t2=entry+2*risk;const t3=entry+3*risk;
  $('ex-max-loss').textContent=fmt(maxLoss);
  $('ex-1r').textContent=fmt(shares*risk);
  $('ex-2r').textContent=fmt(shares*2*risk);
  $('ex-3r').textContent=fmt(shares*3*risk);
  $('ex-levels').innerHTML=[
    {price:stop,label:'Stop Loss',color:'var(--red)',pnl:maxLoss},
    {price:entry,label:'Entry',color:'var(--text2)',pnl:0},
    {price:t1,label:'1R Target (25% exit)',color:'var(--text)',pnl:shares*risk},
    {price:t2,label:'2R Target (50% exit)',color:'var(--accent)',pnl:shares*2*risk},
    {price:t3,label:'3R Target (full exit)',color:'var(--green)',pnl:shares*3*risk},
  ].map(l=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem .9rem;background:var(--surface2);border-radius:6px;border-left:3px solid ${l.color}">
    <div><div style="font-size:.75rem;font-weight:600;color:${l.color}">${l.label}</div><div style="font-family:var(--mono);font-size:.82rem">${fmtD(l.price)}</div></div>
    <div style="font-family:var(--mono);font-weight:700;color:${l.pnl>=0?'var(--green)':'var(--red)'}">${l.pnl>=0?'+':''}${fmt(l.pnl)}</div>
  </div>`).join('');
  dc('exChart');
  const prices=[stop-1,stop,entry,t1,t2,t3,t3+1];
  const pnls=prices.map(p=>(p-entry)*shares);
  charts.exChart=new Chart($('ex-chart'),{
    type:'line',
    data:{labels:prices.map(p=>'$'+p.toFixed(0)),datasets:[{data:pnls,borderColor:'#f97316',backgroundColor:ctx=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,300);g.addColorStop(0,'rgba(16,185,129,.2)');g.addColorStop(0.5,'transparent');g.addColorStop(1,'rgba(239,68,68,.2)');return g;},fill:true,tension:.3,pointRadius:[3,5,5,5,5,5,3],pointBackgroundColor:['#ef4444','#ef4444','#94a3b8','#94a3b8','#f97316','#10b981','#10b981'],borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{grid:{color:CGRID},ticks:{font:{size:10}}},y:{grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:10}}}}}
  });
}

// ── MONTE CARLO ──
function runMC(){
  const winRate=parseFloat($('mc-win').value)/100;
  const avgWin=parseFloat($('mc-avg-win').value)||400;
  const avgLoss=parseFloat($('mc-avg-loss').value)||200;
  const capital=parseFloat($('mc-capital').value)||10000;
  const trades=parseFloat($('mc-trades').value)||100;
  const ev=(winRate*avgWin-(1-winRate)*avgLoss).toFixed(2);
  const pf=(winRate*avgWin)/((1-winRate)*avgLoss);
  $('mc-ev').textContent='$'+ev;
  $('mc-pf').textContent=pf.toFixed(2);
  $('mc-annual-note').textContent=fmt(parseFloat(ev)*trades*(52/10));
  const runs=100;let ruinCount=0;const medians=[];const datasets=[];
  for(let r=0;r<runs;r++){
    let bal=capital;const curve=[bal];let ruined=false;
    for(let t=0;t<trades;t++){if(Math.random()<winRate)bal+=avgWin;else bal-=avgLoss;if(bal<=0){ruined=true;bal=0;}curve.push(bal);}
    if(ruined)ruinCount++;medians.push(bal);
    if(r<20)datasets.push({data:curve,borderColor:`rgba(249,115,22,${r<5?0.8:0.2})`,backgroundColor:'transparent',tension:.3,pointRadius:0,borderWidth:r<5?2:1});
  }
  medians.sort((a,b)=>a-b);
  $('mc-median').textContent=fmt(medians[Math.floor(medians.length/2)]);
  $('mc-ruin').textContent=(ruinCount/runs*100).toFixed(1)+'%';
  dc('mcChart');
  charts.mcChart=new Chart($('mc-chart'),{
    type:'line',
    data:{labels:Array.from({length:trades+1},(_,i)=>'T'+i),datasets},
    options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:CGRID},ticks:{maxTicksLimit:10,font:{size:9}}},y:{grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:9}}}}}
  });
}

// ── JOURNAL ──
let journal=[];
function addJournalEntry(){
  const sym=$('jn-symbol').value.trim().toUpperCase();
  const entry=parseFloat($('jn-entry').value)||0;
  const exit=parseFloat($('jn-exit').value)||0;
  const size=parseFloat($('jn-size').value)||0;
  if(!sym||!entry||!exit)return;
  const pnl=(exit-entry)*size;
  journal.push({sym,type:$('jn-type').value,entry,exit,size,pnl,date:$('jn-date').value,notes:$('jn-notes').value});
  $('jn-symbol').value='';$('jn-entry').value='';$('jn-exit').value='';$('jn-notes').value='';
  renderJournal();renderJournalChart();
}
function renderJournal(){
  const wins=journal.filter(j=>j.pnl>0).length;
  const total=journal.reduce((a,j)=>a+j.pnl,0);
  $('jn-total-pnl').textContent=fmt(total);
  $('jn-win-rate').textContent=journal.length?(wins/journal.length*100).toFixed(0)+'%':'0%';
  $('jn-total-trades').textContent=journal.length;
  $('journal-entries').innerHTML=journal.length?[...journal].reverse().map(j=>`
    <div class="journal-entry ${j.pnl>0?'win':'loss'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><span style="font-family:var(--mono);font-weight:700">${j.sym}</span> <span style="font-size:.72rem;color:var(--text3)">${j.type}</span> · <span style="font-size:.72rem;color:var(--text3)">${j.date}</span></div>
        <span style="font-family:var(--mono);font-weight:700;color:${j.pnl>0?'var(--green)':'var(--red)'}">${j.pnl>0?'+':''}${fmt(j.pnl)}</span>
      </div>
      ${j.notes?`<div style="font-size:.75rem;color:var(--text2);margin-top:.35rem">${j.notes}</div>`:''}
    </div>`).join(''):'<div style="text-align:center;color:var(--text3);padding:2rem;font-size:.85rem">No trades logged yet.</div>';
}
function renderJournalChart(){
  let running=0;const data=journal.map(j=>{running+=j.pnl;return running;});
  dc('jnChart');
  if(!data.length){data.push(0);}
  charts.jnChart=new Chart($('jn-chart'),{
    type:'line',
    data:{labels:data.map((_,i)=>'T'+(i+1)),datasets:[{data,borderColor:'#f97316',backgroundColor:'rgba(249,115,22,.08)',fill:true,tension:.4,pointRadius:3,borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:CGRID}},y:{grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:10}}}}}
  });
}

// ── INCOME TRACKER ──
let incomeLog=[];
function addIncomeEntry(){
  const sym=$('inc-symbol').value.trim().toUpperCase()||'—';
  const premium=parseFloat($('inc-premium').value)||0;
  if(!premium)return;
  incomeLog.push({sym,strat:$('inc-strat').value,premium,date:$('inc-date').value});
  $('inc-symbol').value='';$('inc-premium').value='';
  updateIncomeStats();renderIncomeChart();renderIncomeLog();
}
function updateIncomeTarget(){
  const t=parseFloat($('inc-target-input').value)||500;
  $('inc-target').textContent=fmt(t);
  updateIncomeStats();
}
function updateIncomeStats(){
  const now=new Date();const curMonth=now.getMonth();const curYear=now.getFullYear();
  const mtd=incomeLog.filter(e=>{const d=new Date(e.date);return d.getMonth()===curMonth&&d.getFullYear()===curYear;}).reduce((a,e)=>a+e.premium,0);
  const ytd=incomeLog.reduce((a,e)=>a+e.premium,0);
  const t=parseFloat($('inc-target-input').value)||500;
  const pct=Math.min(100,mtd/t*100);
  $('inc-mtd').textContent=fmt(mtd);
  $('inc-ytd').textContent=fmt(ytd);
  $('inc-pct').textContent=pct.toFixed(1)+'%';
  $('inc-bar').style.width=pct+'%';
  const annProj=ytd>0?ytd/(now.getMonth()+1)*12:0;
  $('inc-annual-proj').textContent=fmt(annProj);
  $('inc-fire-pct').textContent=(annProj/40000*100).toFixed(1)+'%';
}
function renderIncomeLog(){
  $('income-entries').innerHTML=[...incomeLog].reverse().map(e=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:.65rem .9rem;background:var(--surface2);border-radius:6px;margin-bottom:.4rem">
      <div><span style="font-family:var(--mono);font-weight:700">${e.sym}</span> <span style="font-size:.72rem;color:var(--text3)">${e.strat}</span></div>
      <div style="display:flex;align-items:center;gap:1rem"><span style="font-size:.72rem;color:var(--text3)">${e.date}</span><span style="font-family:var(--mono);font-weight:700;color:var(--green)">+${fmt(e.premium)}</span></div>
    </div>`).join('') || '<div style="text-align:center;color:var(--text3);padding:2rem;font-size:.85rem">No income entries yet.</div>';
}
function renderIncomeChart(){
  dc('incChart');
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const byMonth=Array(12).fill(0);
  incomeLog.forEach(e=>{if(e.date){const m=new Date(e.date).getMonth();byMonth[m]+=e.premium;}});
  charts.incChart=new Chart($('inc-chart'),{
    type:'bar',
    data:{labels:months,datasets:[{data:byMonth,backgroundColor:'rgba(249,115,22,.6)',borderColor:'#f97316',borderWidth:1,borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:10}}}}}
  });
}

// TRADING RULES
let rules=[];
function addRule(){
  const text=$('new-rule-input').value.trim();
  if(!text)return;
  rules.push({text,done:false});
  $('new-rule-input').value='';
  renderRules();
}
function renderRules(){
  $('rules-list').innerHTML=rules.map((r,i)=>`
    <div style="display:flex;align-items:center;gap:.75rem;padding:.65rem .9rem;background:var(--surface2);border-radius:6px;border-left:3px solid var(--accent)">
      <input type="checkbox" ${r.done?'checked':''} onchange="rules[${i}].done=this.checked;renderRules()" style="accent-color:var(--accent)">
      <span style="flex:1;font-size:.85rem;${r.done?'text-decoration:line-through;color:var(--text3)':''}">${r.text}</span>
      <button onclick="rules.splice(${i},1);renderRules()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.8rem">✕</button>
    </div>`).join('');
}

// INIT
document.addEventListener('DOMContentLoaded',()=>{
  calcPosition();calcEM();calcGreeks();calcExit();runMC();
  renderJournalChart();renderIncomeChart();
  $('jn-date').valueAsDate=new Date();
  $('inc-date').valueAsDate=new Date();
});
