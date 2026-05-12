
const $ = id => document.getElementById(id);
let charts = {};
const fmt = v => '$' + Math.round(v).toLocaleString();
const fmtD = v => '$' + parseFloat(v||0).toFixed(2);
const CGRID = 'rgba(255,255,255,0.04)';
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'DM Sans';
function dc(k){if(charts[k]){charts[k].destroy();delete charts[k];}}
function syncR(id,lid,sfx){$(lid).textContent=$(id).value+sfx;}
function pmt(P,r,n){if(r===0)return P/n;return P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);}

function switchTab(name,btn){
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  $('tab-'+name).classList.add('active');btn.classList.add('active');
  if(name==='investment')calcInvestment();
  if(name==='mortgage')calcMortgage();
  if(name==='fha')calcFHA();
  if(name==='affordability')calcAffordability();
  if(name==='rentvbuy')calcRvB();
  if(name==='hacking')calcHacking();
  if(name==='closing'){calcClosing();calcROI();}
}

function calcInvestment(){
  const price=parseFloat($('inv-price').value)||300000;
  const downPct=parseFloat($('inv-down').value)/100;
  const rate=parseFloat($('inv-rate').value)/100/12;
  const term=parseInt($('inv-term').value)*12;
  const rent=parseFloat($('inv-rent').value)||2000;
  const taxRate=parseFloat($('inv-tax').value)/100;
  const insurance=parseFloat($('inv-insurance').value)||1800;
  const vacancy=parseFloat($('inv-vacancy').value)/100;
  const loan=price*(1-downPct);
  const mortgage=pmt(loan,rate,term);
  const propTax=price*taxRate/12;
  const ins=insurance/12;
  const effRent=rent*(1-vacancy);
  const noi=(rent*12)-price*taxRate-insurance-rent*12*vacancy;
  const capRate=noi/price*100;
  const cashFlow=effRent-mortgage-propTax-ins;
  const coc=cashFlow*12/(price*downPct)*100;
  const grm=price/(rent*12);
  const ber=(mortgage+propTax+ins)/(1-vacancy);
  const cfColor=cashFlow>=0?'var(--accent)':'var(--red)';
  $('inv-cashflow').textContent=fmt(cashFlow);
  $('inv-cashflow').style.color=cfColor;
  $('inv-cap').textContent=capRate.toFixed(2)+'%';
  $('inv-mortgage').textContent=fmt(mortgage);
  $('inv-coc').textContent=coc.toFixed(2)+'%';
  $('inv-coc').style.color=coc>=0?'var(--accent)':'var(--red)';
  $('inv-noi').textContent=fmt(noi);
  $('inv-grm').textContent=grm.toFixed(1)+'x';
  const pct1=rent/price*100;
  $('inv-1pct').innerHTML=pct1.toFixed(2)+'% <span style="font-size:.65rem;font-weight:600;padding:.1rem .4rem;border-radius:4px;background:'+(pct1>=1?'var(--green-dim)':'var(--amber-dim)')+';color:'+(pct1>=1?'var(--accent)':'var(--amber)')+';">'+(pct1>=1?'Passes':'Below 1%')+'</span>';
  $('inv-ber').textContent=fmt(ber);
  $('inv-fire-cf').textContent=fmt(Math.max(0,cashFlow))+'/mo';
  $('inv-fire-pct').textContent=(Math.max(0,cashFlow)*12/40000*100).toFixed(1)+'%';
  // Chart
  dc('invChart');
  const years=10;const appRate=0.03;
  const labels=Array.from({length:years+1},(_,i)=>'Yr '+i);
  const propVals=labels.map((_,i)=>price*Math.pow(1+appRate,i));
  const equity=labels.map((_,i)=>{
    let remaining=loan;for(let m=0;m<i*12;m++){remaining=remaining*(1+rate)-pmt(loan,rate,term);}
    return price*Math.pow(1+appRate,i)-Math.max(0,remaining);
  });
  charts.invChart=new Chart($('inv-chart'),{
    type:'line',
    data:{labels,datasets:[
      {label:'Property Value',data:propVals,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.06)',fill:true,tension:.4,pointRadius:4,borderWidth:2},
      {label:'Equity',data:equity,borderColor:'#34d399',backgroundColor:'transparent',tension:.4,pointRadius:4,borderWidth:2,borderDash:[5,5]},
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{boxWidth:8,padding:14,font:{size:11}}},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{grid:{color:CGRID},ticks:{font:{size:10}}},y:{grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:10}}}}}
  });
}

function calcMortgage(){
  const price=parseFloat($('mo-price').value)||350000;
  const down=parseFloat($('mo-down').value)||70000;
  const rate=parseFloat($('mo-rate').value)/100/12;
  const term=parseInt($('mo-term').value)*12;
  const taxYr=parseFloat($('mo-tax').value)||3500;
  const insYr=parseFloat($('mo-insurance').value)||1800;
  const pmiMo=parseFloat($('mo-pmi').value)||0;
  const loan=price-down;
  const pi=pmt(loan,rate,term);
  const totalMonthly=pi+taxYr/12+insYr/12+pmiMo;
  const totalInterest=pi*term-loan;
  $('mo-pi').textContent=fmt(pi);
  $('mo-total').textContent=fmt(totalMonthly);
  $('mo-total-interest').textContent=fmt(totalInterest);
  $('mo-total-cost').textContent=fmt(pi*term+down);
  $('mo-fire-interest').textContent=fmt(totalInterest);
  const extra200=pmt(loan,rate,term);
  $('mo-fire-extra').textContent=fmt(totalInterest*0.2);
  $('mo-breakdown').innerHTML=[
    {label:'Principal & Interest',val:pi},
    {label:'Property Tax',val:taxYr/12},
    {label:'Insurance',val:insYr/12},
    ...(pmiMo>0?[{label:'PMI',val:pmiMo}]:[]),
  ].map(r=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid var(--border2)"><span style="font-size:.8rem;color:var(--text2)">${r.label}</span><span style="font-family:var(--mono);font-weight:600">${fmt(r.val)}</span></div>`).join('');
  dc('moChart');
  const yrs=parseInt($('mo-term').value);
  const piData=[],intData=[];
  for(let y=1;y<=yrs;y++){
    let bal=loan,totPi=0,totInt=0;
    for(let m=0;m<(y-1)*12;m++){const interest=bal*rate;bal=bal-( pi-interest);}
    const yearPi=pi*12;const yearInt=bal*rate*12;
    piData.push(yearPi-yearInt);intData.push(yearInt);
  }
  charts.moChart=new Chart($('mo-chart'),{
    type:'bar',
    data:{labels:Array.from({length:yrs},(_,i)=>'Yr '+(i+1)),datasets:[
      {label:'Principal',data:piData,backgroundColor:'rgba(16,185,129,.7)',borderRadius:2},
      {label:'Interest',data:intData,backgroundColor:'rgba(239,68,68,.5)',borderRadius:2},
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{boxWidth:8,padding:12,font:{size:10}}},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{stacked:true,grid:{display:false},ticks:{maxTicksLimit:10,font:{size:9}}},y:{stacked:true,grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:9}}}}}
  });
}

function calcFHA(){
  const price=parseFloat($('fha-price').value)||300000;
  const downPct=parseFloat($('fha-credit').value)/100;
  const rate=parseFloat($('fha-rate').value)/100/12;
  const term=parseInt($('fha-term').value)*12;
  const down=price*downPct;
  const down10=price*0.10;
  const upfrontMIP=price*0.9825*0.0175;
  const loanAmt=price-down+upfrontMIP;
  const annualMIP=loanAmt*0.0055;
  const monthlyMIP=annualMIP/12;
  const pi=pmt(loanAmt,rate,term);
  $('fha-dp35').textContent=fmt(price*0.035);
  $('fha-dp10').textContent=fmt(down10);
  $('fha-umip').textContent=fmt(upfrontMIP);
  $('fha-amip').textContent=fmt(annualMIP)+'/yr';
  $('fha-mmip').textContent=fmt(monthlyMIP)+'/mo';
  $('fha-fire-inv').textContent=fmt((down10-price*0.035)*Math.pow(1.07,10));
  $('fha-breakdown').innerHTML=[
    {label:'Principal & Interest (on '+fmt(loanAmt)+' loan)',val:pi},
    {label:'Mortgage Insurance Premium (MIP)',val:monthlyMIP},
    {label:'Estimated Tax & Insurance',val:400},
    {label:'Total Est. Monthly Payment',val:pi+monthlyMIP+400,bold:true,accent:true},
  ].map(r=>`<div style="display:flex;justify-content:space-between;padding:.55rem 0;border-bottom:1px solid var(--border2);${r.bold?'border-top:1px solid var(--accent-border);margin-top:.25rem':''}"><span style="font-size:.8rem;color:${r.bold?'var(--text)':'var(--text2)'};font-weight:${r.bold?700:400}">${r.label}</span><span style="font-family:var(--mono);font-weight:${r.bold?800:600};color:${r.accent?'var(--accent)':''}">${fmt(r.val)}</span></div>`).join('');
}

function calcAffordability(){
  const income=parseFloat($('aff-income').value)||120000;
  const debt=parseFloat($('aff-debt').value)||500;
  const down=parseFloat($('aff-down').value)||60000;
  const rate=parseFloat($('aff-rate').value)/100/12;
  const other=parseFloat($('aff-other').value)||400;
  const dtiLim=parseFloat($('aff-dti').value)/100;
  const maxPI=income/12*dtiLim-debt-other;
  const maxLoan=maxPI>0?maxPI*(1-Math.pow(1+rate,-360))/rate:0;
  const maxPrice=maxLoan+down;
  const actualDTI=(maxPI+debt+other)/(income/12)*100;
  $('aff-max-price').textContent=fmt(maxPrice);
  $('aff-max-loan').textContent=fmt(maxLoan);
  $('aff-max-payment').textContent=fmt(maxPI);
  $('aff-dti-actual').textContent=actualDTI.toFixed(1)+'%';
  $('aff-fire-target').textContent=fmt(income/12*0.25);
  dc('affChart');
  charts.affChart=new Chart($('aff-chart'),{
    type:'doughnut',
    data:{labels:['Housing','Debt','Other/Savings'],datasets:[{data:[maxPI+other,debt,income/12-maxPI-debt-other],backgroundColor:['rgba(16,185,129,.7)','rgba(239,68,68,.6)','rgba(99,102,241,.6)'],borderWidth:0,borderRadius:2}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:8,padding:10,font:{size:10}}},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}}}
  });
}

function calcRvB(){
  const price=parseFloat($('rvb-price').value)||350000;
  const down=parseFloat($('rvb-down').value)||70000;
  const rate=parseFloat($('rvb-rate').value)/100/12;
  const appRate=parseFloat($('rvb-app').value)/100;
  const rent=parseFloat($('rvb-rent').value)||2200;
  const rinc=parseFloat($('rvb-rinc').value)/100;
  const inv=parseFloat($('rvb-inv').value)/100;
  const years=parseFloat($('rvb-years').value)||10;
  const loan=price-down;
  const pi=pmt(loan,rate,360);
  let buyCost=0,rentCost=0,curRent=rent;
  const buyData=[0],rentData=[0];
  for(let y=1;y<=years;y++){
    buyCost+=pi*12+price*0.013;
    buyCost-=price*Math.pow(1+appRate,y)*0.03;
    rentCost+=curRent*12;
    curRent*=(1+rinc);
    buyData.push(buyCost);rentData.push(rentCost);
  }
  const equity=price*Math.pow(1+appRate,years)-loan*(1-years/30);
  const netBuy=buyCost-equity+down;
  const investedDown=down*Math.pow(1+inv,years);
  const netRent=rentCost-(investedDown-down);
  $('rvb-buy-total').textContent=fmt(netBuy);
  $('rvb-rent-total').textContent=fmt(netRent);
  const buyWins=netBuy<netRent;
  $('rvb-verdict').textContent=buyWins?'Buying is better':'Renting is better';
  $('rvb-verdict').style.color=buyWins?'var(--accent)':'var(--amber)';
  $('rvb-verdict-sub').textContent=`Over ${years} years, ${buyWins?'buying':'renting'} saves ${fmt(Math.abs(netBuy-netRent))}`;
  const be=Math.round(years*(netBuy/(netBuy-netRent+0.001)));
  $('rvb-breakeven').textContent=`Break-even at approximately year ${Math.max(1,be)}`;
  $('rvb-fire-note').innerHTML=buyWins?`Buying builds <strong>${fmt(equity)}</strong> in equity over ${years} years — a direct FIRE asset. The down payment creates leverage that accelerates net worth growth.`:`Renting and investing the difference grows to <strong>${fmt(investedDown)}</strong> over ${years} years at ${$('rvb-inv').value}% — powerful FIRE fuel.`;
  dc('rvbChart');
  const labels=Array.from({length:years+1},(_,i)=>'Yr '+i);
  charts.rvbChart=new Chart($('rvb-chart'),{
    type:'line',
    data:{labels,datasets:[
      {label:'Buying Cost',data:buyData,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.06)',fill:true,tension:.4,pointRadius:0,borderWidth:2},
      {label:'Renting Cost',data:rentData,borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,.06)',fill:true,tension:.4,pointRadius:0,borderWidth:2},
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{boxWidth:8,padding:12,font:{size:10}}},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{grid:{color:CGRID},ticks:{font:{size:10}}},y:{grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:10}}}}}
  });
}

function calcHacking(){
  const price=parseFloat($('hh-price').value)||400000;
  const downPct=parseFloat($('hh-down').value)/100;
  const rate=parseFloat($('hh-rate').value)/100/12;
  const units=parseFloat($('hh-units').value)||2;
  const rent=parseFloat($('hh-rent').value)||800;
  const costs=parseFloat($('hh-costs').value)||400;
  const loan=price*(1-downPct);
  const mortgage=pmt(loan,rate,360);
  const rentalIncome=units*rent;
  const effectiveCost=mortgage+costs-rentalIncome;
  const savings=Math.max(0,mortgage-effectiveCost);
  $('hh-full-payment').textContent=fmt(mortgage);
  $('hh-eff-rent').textContent=fmt(Math.max(0,effectiveCost));
  $('hh-savings').textContent=fmt(savings);
  $('hh-annual-boost').textContent=fmt(savings*12);
  $('hh-fire-savings').textContent=fmt(savings);
  $('hh-fire-10yr').textContent=fmt(savings*((Math.pow(1+0.07/12,120)-1)/(0.07/12)));
  dc('hhChart');
  const yrs=20;const labels=Array.from({length:yrs+1},(_,i)=>'Yr '+i);
  const invested=labels.map((_,i)=>savings*12*(Math.pow(1+0.07,i)-1)/0.07);
  charts.hhChart=new Chart($('hh-chart'),{
    type:'line',
    data:{labels,datasets:[{label:'Invested Savings',data:invested,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.08)',fill:true,tension:.4,pointRadius:0,borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},scales:{x:{grid:{color:CGRID},ticks:{font:{size:10}}},y:{grid:{color:CGRID},ticks:{callback:v=>fmt(v),font:{size:10}}}}}
  });
}

function calcClosing(){
  const price=parseFloat($('cl-price').value)||300000;
  const loan=parseFloat($('cl-loan').value)||240000;
  const items=[
    {label:'Loan Origination (1%)',val:loan*0.01},
    {label:'Title Insurance',val:1500},
    {label:'Appraisal',val:500},
    {label:'Home Inspection',val:400},
    {label:'Recording Fees',val:200},
    {label:'Attorney Fees',val:500},
    {label:'Prepaid Interest (15 days)',val:loan*0.065/12*0.5},
    {label:'Escrow Setup',val:600},
  ];
  const total=items.reduce((a,i)=>a+i.val,0);
  $('cl-total').textContent=fmt(total);
  $('cl-fire-cost').textContent=fmt(total);
  $('cl-items').innerHTML=items.map(i=>`<div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border2)"><span style="font-size:.82rem;color:var(--text2)">${i.label}</span><span style="font-family:var(--mono);font-weight:600">${fmt(i.val)}</span></div>`).join('');
}

function calcROI(){
  const noi=parseFloat($('roi-noi').value)||14700;
  const invest=parseFloat($('roi-invest').value)||300000;
  const rent=invest*0.01;
  const pct1=rent/invest*100;
  $('roi-annual').textContent=fmt(noi);
  $('roi-grm').textContent=(invest/(rent*12)).toFixed(1)+'x';
  $('roi-1pct').innerHTML=pct1.toFixed(2)+'% <span style="font-size:.65rem;background:'+(pct1>=1?'var(--accent-dim)':'var(--amber-dim)')+';color:'+(pct1>=1?'var(--accent)':'var(--amber)')+';padding:.1rem .35rem;border-radius:4px">'+(pct1>=1?'Passes':'Below 1%')+'</span>';
}

document.addEventListener('DOMContentLoaded',()=>{
  calcInvestment();calcMortgage();calcFHA();calcAffordability();calcRvB();calcHacking();calcClosing();calcROI();
});
