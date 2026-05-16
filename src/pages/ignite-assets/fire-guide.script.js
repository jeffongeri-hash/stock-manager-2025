// 
// GLOBALS
// 
const $ = id => document.getElementById(id);

// Safe DOM helpers — prevent null reference errors
function safeHTML(id, val) { const el = $(id); if(el) el.innerHTML = val; }
function safeTXT(id, val)  { const el = $(id); if(el) el.textContent = val; }
function safeStyle(id, prop, val) { const el = $(id); if(el) el.style[prop] = val; }

const fmt = v => '$' + Math.round(v).toLocaleString();
const fmtK = v => v >= 1e6 ? '$' + (v/1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v/1e3).toFixed(0) + 'K' : fmt(v);
let charts = {};
function dc(k) { if(charts[k]) { charts[k].destroy(); delete charts[k]; } }
Chart.defaults.color = '#7a9e80';
Chart.defaults.font.family = 'DM Sans';
const CGRID = 'rgba(255,255,255,0.035)';

// STATE
const state = {
 status: 'single', housing: 'own_paid', kids: 'no', health: 'aca_individual',
 lifestyle: 'regular', college: 'none', swr: 0.04, returnRate: 0.07, inflation: 0.03
};

// 
// EXPENSE CATEGORIES (in today's dollars)
// 
const EXPENSE_CATS = [
 { id:'housing', icon:'', name:'Housing', sub:'Rent/mortgage, property tax, insurance, maintenance', items:[
 { id:'rent_mortgage', label:'Rent / Mortgage Payment', base:1500, note:'Adjust for your target city' },
 { id:'property_tax', label:'Property Tax', base:250, note:'~1.2% of home value/yr avg' },
 { id:'home_insurance', label:'Home/Renters Insurance', base:100, note:'$1,200/yr avg homeowner' },
 { id:'maintenance', label:'Maintenance & Repairs', base:200, note:'Budget 1% of home value/yr' },
 { id:'utilities', label:'Utilities (electric, gas, water)', base:180, note:'National avg 2024' },
 { id:'internet', label:'Internet & Phone', base:120, note:'Broadband + cell plan' },
 ]},
 { id:'food', icon:'', name:'Food & Dining', sub:'Groceries, restaurants, coffee', items:[
 { id:'groceries', label:'Groceries', base:400, note:'$400-600/mo per adult avg' },
 { id:'dining', label:'Dining Out & Takeout', base:200, note:'Adjust to your lifestyle' },
 { id:'coffee', label:'Coffee & Beverages', base:50, note:'Daily coffee habit = $600/yr' },
 ]},
 { id:'transport', icon:'', name:'Transportation', sub:'Car, insurance, gas, or transit', items:[
 { id:'car_payment', label:'Car Payment / Lease', base:0, note:'$0 if paid off by retirement' },
 { id:'car_insurance', label:'Auto Insurance', base:150, note:'National avg $1,771/yr' },
 { id:'gas_maintenance', label:'Gas & Maintenance', base:200, note:'Based on 12,000 miles/yr' },
 { id:'transit', label:'Transit / Rideshare', base:50, note:'If no car or supplement' },
 ]},
 { id:'health', icon:'', name:'Healthcare', sub:'Insurance, prescriptions, dental, vision', items:[
 { id:'health_insurance', label:'Health Insurance Premium', base:584, note:'ACA individual avg 2024' },
 { id:'out_of_pocket', label:'Out-of-Pocket / Copays', base:150, note:'Prescriptions, copays, dental' },
 { id:'dental_vision', label:'Dental & Vision', base:80, note:'If not included in plan' },
 { id:'gym_wellness', label:'Gym / Wellness', base:50, note:'Physical and mental health' },
 ]},
 { id:'lifestyle', icon:'', name:'Lifestyle & Fun', sub:'Travel, hobbies, entertainment, subscriptions', items:[
 { id:'travel', label:'Travel & Vacations', base:300, note:'$3,600/yr for modest travel' },
 { id:'entertainment', label:'Entertainment & Hobbies', base:150, note:'Events, sports, hobbies' },
 { id:'subscriptions', label:'Subscriptions (streaming, etc.)', base:80, note:'Netflix, Spotify, apps' },
 { id:'clothing', label:'Clothing & Personal Care', base:100, note:'Lower in retirement usually' },
 { id:'gifts', label:'Gifts & Holidays', base:100, note:'Family gifts, holidays' },
 ]},
 { id:'financial', icon:'', name:'Financial & Taxes', sub:'Taxes on withdrawals, misc expenses', items:[
 { id:'taxes', label:'Income Taxes on Withdrawals', base:300, note:'Roth withdrawals can be $0' },
 { id:'misc', label:'Miscellaneous / Buffer', base:200, note:'Unexpected expenses, 5% buffer' },
 ]},
];

const expenseValues = {};

// 
// RENDER EXPENSE BUILDER
// 
function renderExpenseBuilder() {
 const builder = $('expense-builder');
 builder.innerHTML = '';  EXPENSE_CATS.forEach(cat => {
 const catDiv = document.createElement('div');
 catDiv.className = 'expense-category';
 catDiv.innerHTML = `
 <div class="expense-cat-header" onclick="toggleExpenseCat('${cat.id}')">
 <div class="expense-cat-left">
 <div class="expense-cat-icon">${cat.icon}</div>
 <div><div class="expense-cat-name">${cat.name}</div><div class="expense-cat-sub">${cat.sub}</div></div>
 </div>
 <div style="display:flex;align-items:center;gap:.75rem">
 <div class="expense-cat-total" id="cat-total-${cat.id}">$0/mo</div>
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="cat-arrow-${cat.id}"><polyline points="6 9 12 15 18 9"/></svg>
 </div>
 </div>
 <div class="expense-items" id="cat-items-${cat.id}" style="display:none">
 ${cat.items.map(item => {
 if (!expenseValues[item.id]) expenseValues[item.id] = item.base;
 return `<div class="expense-item">
 <div><div class="expense-item-label">${item.label}</div><div class="expense-item-note">${item.note}</div></div>
 <input class="expense-item-input" type="number" id="exp-${item.id}" value="${item.base}" oninput="expenseValues['${item.id}']=parseFloat(this.value)||0;updateAll()">
 <div class="expense-item-inflation" id="exp-inf-${item.id}">$${item.base}/mo</div>
 </div>`;
 }).join('')}
 </div>`;
 builder.appendChild(catDiv);
 });
 // Open first category by default
 toggleExpenseCat('housing');
}

function toggleExpenseCat(id) {
 const items = $('cat-items-' + id);
 const arrow = $('cat-arrow-' + id);
 const open = items.style.display !== 'none';
 items.style.display = open ? 'none' : 'flex';
 if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
}

// 
// TOGGLE HELPERS
// 
function setToggle(group, val, btn) {
 state[group] = val;
 btn.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 // Side effects
 if (group === 'status') {
 $('partner-income-row').style.display = val === 'partnered' ? '' : 'none';
 }
 if (group === 'health') {
 const costs = { aca_individual:584, aca_family:1437, hsd_plan:300, geo_abroad:120 };
 $('health-cost').value = costs[val] || 584;
 }
 updateAll();
}

function toggleKids(show) {
 $('kids-section').style.display = show ? '' : 'none';
 updateAll();
}

function setLifestyle(val, btn) {
 state.lifestyle = val;
 btn.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 updateAll();
}

function setSWR(val, btn) {
 state.swr = val;
 btn.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 updateAll();
}

function syncInflation() {
 const v = parseFloat($('inflation').value);
 state.inflation = v / 100;
 $('inflation-val').textContent = v.toFixed(1) + '%';
}

function syncReturn() {
 const v = parseFloat($('return-rate').value);
 state.returnRate = v / 100;
 $('return-val').textContent = v.toFixed(1) + '%';
}

// 
// CORE CALCULATIONS
// 
function calcExpenses() {
 // Sum all expense categories
 let total = 0;
 EXPENSE_CATS.forEach(cat => {
 let catTotal = 0;
 cat.items.forEach(item => {
 const v = parseFloat($('exp-' + item.id)?.value) || expenseValues[item.id] || 0;
 expenseValues[item.id] = v;
 catTotal += v;
 });
 total += catTotal;
 const catEl = $('cat-total-' + cat.id);
 if (catEl) catEl.textContent = fmt(catTotal) + '/mo';
 });  // Add health cost if using the standalone health input
 const healthExtra = parseFloat($('health-cost').value) || 0;
 // (health is already in the expense items, this adjusts it)  // Add housing cost
 const housingExtra = parseFloat($('housing-cost')?.value) || 0;  // Kids cost — only during child-rearing years, prorated
 let kidsAnnual = 0;
 if (state.kids !== 'no') {
 const numKids = parseInt($('num-kids')?.value) || 0;
 const kidCost = parseFloat($('kid-cost')?.value) || 18000;
 kidsAnnual = numKids * kidCost / 12; // monthly
 }  return { monthly: total, annual: total * 12, kidsMonthly: kidsAnnual };
}

function calcInflatedExpenses(annualToday) {
 const years = parseFloat($('fire-age').value || 50) - parseFloat($('age').value || 25);
 const inflated = annualToday * Math.pow(1 + state.inflation, Math.max(0, years));
 return { inflated, years };
}

function calcFIRENumber(annualInflated) {
 return annualInflated / state.swr;
}

function fvAnnuity(pmt, r, n) {
 if (r === 0) return pmt * n;
 return pmt * ((Math.pow(1 + r, n) - 1) / r);
}

// 
// MAIN UPDATE
// 
function updateAll() {
 const age = parseInt($('age').value) || 25;
 const fireAge = parseInt($('fire-age').value) || 50;
 const income = parseFloat($('income').value) || 65000;
 const saved = parseFloat($('saved').value) || 0;
 const partnerIncome = state.status === 'partnered' ? (parseFloat($('partner-income')?.value) || 0) : 0;
 const totalIncome = income + partnerIncome;
 const yearsToFire = Math.max(0, fireAge - age);
 const inflation = state.inflation;
 const rMo = state.returnRate / 12;  // Age notes
 $('age-note').textContent = `You have ~${65 - age} years until traditional retirement age`;
 $('years-note').textContent = `${yearsToFire} years to build your portfolio`;  // Housing inflated note
 const housingBase = parseFloat($('housing-cost')?.value) || 1500;
 const housingInflated = housingBase * Math.pow(1 + inflation, yearsToFire);
 if ($('housing-inflated-note')) if($('housing-inflated-note')) $('housing-inflated-note').textContent =
 `In ${yearsToFire} years, this will be ~${fmt(housingInflated)}/mo at ${(inflation*100).toFixed(1)}% inflation`;  // Health inflated note
 const healthBase = parseFloat($('health-cost')?.value) || 584;
 const healthInflated = healthBase * Math.pow(1 + inflation, yearsToFire);
 if ($('health-inflated-note')) if($('health-inflated-note')) $('health-inflated-note').textContent =
 `In ${yearsToFire} years, this will be ~${fmt(healthInflated)}/mo — plan for this in your FIRE budget`;  // Kids note
 if (state.kids !== 'no') {
 const numKids = parseInt($('num-kids')?.value) || 0;
 const kidCost = parseFloat($('kid-cost')?.value) || 18000;
 const kidYears = parseInt($('kid-years')?.value) || 18;
 const totalKidCost = numKids * kidCost * kidYears;
 if ($('kids-cost-note')) $('kids-cost-note').textContent =
 `${numKids} child${numKids>1?'ren':''} × $${kidCost.toLocaleString()}/yr × ${kidYears} years = $${totalKidCost.toLocaleString()} total child-rearing cost. This is added to your expenses during child-rearing years and removed afterward.`;
 }  // Inflation note
 const inf = parseFloat($('inflation').value) || 3;
 $('inflation-note').textContent = `At ${inf}% inflation, $60,000 today becomes ${fmt(60000 * Math.pow(1 + inf/100, yearsToFire))} in ${yearsToFire} years`;  // Expense calculation
 const expenses = calcExpenses();
 const annualToday = expenses.annual;  // Update inflation display on each expense item
 EXPENSE_CATS.forEach(cat => {
 cat.items.forEach(item => {
 const v = expenseValues[item.id] || 0;
 const inflated = v * Math.pow(1 + inflation, yearsToFire);
 const el = $('exp-inf-' + item.id);
 if (el) el.textContent = fmt(inflated) + '/mo';
 });
 });  // Totals
 $('total-today').textContent = fmtK(annualToday) + '/yr';
 const { inflated: annualInflated } = calcInflatedExpenses(annualToday);
 $('total-inflated').textContent = fmtK(annualInflated) + '/yr';
 $('total-inflated-note').textContent = `in ${new Date().getFullYear() + yearsToFire} dollars`;  // FIRE numbers
 const fireNum = calcFIRENumber(annualInflated);
 const leanNum = (30000 / state.swr);
 const regularNum = fireNum;
 const fatNum = (150000 / state.swr) / Math.pow(1 + inflation, -yearsToFire);
 const baristaNum = Math.max(0, (annualInflated - 20000)) / state.swr;  $('fire-num-display').textContent = fmtK(fireNum);
 if($('lean-fire-num')) $('lean-fire-num').textContent = fmtK(leanNum);
 if($('regular-fire-num')) $('regular-fire-num').textContent = fmtK(regularNum);
 if($('fat-fire-num')) $('fat-fire-num').textContent = fmtK(fatNum);
 if($('barista-fire-num')) $('barista-fire-num').textContent = fmtK(baristaNum);  // Monthly savings needed
 const remaining = Math.max(0, fireNum - saved * Math.pow(1 + state.returnRate, yearsToFire));
 let monthlyNeeded = 0;
 if (yearsToFire > 0 && rMo > 0) {
 monthlyNeeded = remaining * rMo / (Math.pow(1 + rMo, yearsToFire*12) - 1);
 }
 const savingsRate = totalIncome > 0 ? monthlyNeeded * 12 / totalIncome * 100 : 0;
 $('monthly-needed').textContent = fmtK(monthlyNeeded);
 $('savings-pct-note').textContent = `${savingsRate.toFixed(1)}% of your ${fmtK(totalIncome)}/yr income`;  // Savings sensitivity
 const sensRates = [0.10, 0.20, 0.30, 0.40, 0.50];
 if($('savings-sensitivity')) $('savings-sensitivity').innerHTML = sensRates.map(r => {
 const monthlySaved = totalIncome * r / 12;
 const fvSaved = saved * Math.pow(1 + state.returnRate, yearsToFire) + fvAnnuity(monthlySaved, rMo, yearsToFire * 12);
 const pct = Math.min(100, fvSaved / fireNum * 100);
 return `<div style="display:flex;align-items:center;gap:.6rem;">
 <div style="font-family:var(--mono);font-size:.68rem;color:var(--text3);width:30px">${(r*100).toFixed(0)}%</div>
 <div style="flex:1;height:5px;background:var(--surface3);border-radius:3px;overflow:hidden"></div>
 <div style="font-family:var(--mono);font-size:.68rem;color:${pct>=100?'var(--green)':'var(--text3)'};width:36px;text-align:right">${pct.toFixed(0)}%</div>
 </div>`;
 }).join('');  // Return breakdown
 if($('return-breakdown')) $('return-breakdown').innerHTML = [
 { r:0.04, label:'4% (conservative)' },
 { r:0.06, label:'6% (moderate)' },
 { r:0.07, label:'7% (historical real)' },
 { r:0.10, label:'10% (historical nominal)' },
 ].map(row => {
 const fv = saved * Math.pow(1+row.r, yearsToFire) + fvAnnuity(totalIncome/12*0.2, row.r/12, yearsToFire*12);
 return `<div style="display:flex;justify-content:space-between;font-size:.72rem;padding:.3rem 0;border-bottom:1px solid var(--border2)">
 <span style="color:var(--text2)">${row.label}</span>
 <span style="font-family:var(--mono);font-weight:700;color:${row.r===state.returnRate?'var(--ember)':'var(--text2)'}">${fmtK(fv)} projected</span>
 </div>`;
 }).join('');  // Sidebar
 $('sb-fire-num').textContent = fmtK(fireNum);
 $('sb-expenses').textContent = fmtK(annualToday);
 $('sb-expenses-inflated').textContent = fmtK(annualInflated);
 $('sb-years').textContent = yearsToFire + ' years';
 $('sb-fire-age').textContent = 'Age ' + fireAge;
 $('sb-monthly').textContent = fmtK(monthlyNeeded);
 const progress = Math.min(100, saved / fireNum * 100);
 $('sb-progress').textContent = progress.toFixed(1) + '%';
 if($('sb-fi-bar')) $('sb-fi-bar').style.width = progress + '%';  // Charts
 renderGrowthChart(saved, monthlyNeeded, fireNum, yearsToFire);
 renderSidebarChart(saved, monthlyNeeded, yearsToFire);
 renderExpenseChart(annualToday);
 renderMilestones(age, fireAge, totalIncome, saved, monthlyNeeded, fireNum);
 renderNextSteps(age, totalIncome, saved, monthlyNeeded, savingsRate);
 renderAccountPriority(totalIncome);
 // Sync coast inputs with main inputs
 if ($('coast-age')) $('coast-age').value = age;
 if ($('coast-target')) $('coast-target').value = Math.round(fireNum);
 renderVariantCharts();
 calcContrib();
 calcCoast();
}

// 
// CHARTS
// 
function renderGrowthChart(current, monthly, target, years) {
 const labels = [], data = [], targetLine = [];
 let bal = current;
 const rMo = state.returnRate / 12;
 for (let y = 0; y <= years; y++) {
 labels.push('Age ' + (parseInt($('age').value || 25) + y));
 data.push(+bal.toFixed(0));
 targetLine.push(+target.toFixed(0));
 for (let m = 0; m < 12; m++) { bal = bal * (1 + rMo) + monthly; }
 }
 dc('growthChart');
 charts.growthChart = new Chart($('growth-chart'), {
 type: 'line',
 data: {
 labels,
 datasets: [
 { label: 'Portfolio Value', data, borderColor: '#1db954', backgroundColor: 'rgba(29,185,84,.08)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5, pointHoverRadius: 6, pointHoverBackgroundColor: '#1db954' },
 { label: 'FIRE Target', data: targetLine, borderColor: '#5fcf80', backgroundColor: 'transparent', borderDash: [6,4], pointRadius: 0, borderWidth: 1.5 },
 ]
 },
 options: {
 responsive: true, maintainAspectRatio: false,
 interaction: { mode: 'index', intersect: false },
 plugins: {
 legend: { display: true, labels: { boxWidth: 8, padding: 14, font: { size: 11 } } },
 tooltip: {
 backgroundColor: 'rgba(10,18,12,.97)', borderColor: 'rgba(232,101,26,.3)', borderWidth: 1, padding: 12,
 titleFont: { family: 'JetBrains Mono', size: 11, weight: 700 },
 bodyFont: { family: 'JetBrains Mono', size: 12 },
 callbacks: {
 title: ctx => ctx[0].label,
 label: ctx => ` ${ctx.dataset.label}: ${fmtK(ctx.raw)}`,
 afterBody: ctx => {
 if (ctx.length >= 2) {
 const pct = (ctx[0].raw / ctx[1].raw * 100).toFixed(1);
 return [` Progress: ${pct}% of FIRE target`];
 }
 return [];
 }
 }
 }
 },
 scales: {
 x: { grid: { color: CGRID }, ticks: { font: { size: 10 }, maxTicksLimit: 8 } },
 y: { grid: { color: CGRID }, ticks: { callback: v => fmtK(v), font: { size: 10 } } }
 }
 }
 });
}

function renderSidebarChart(current, monthly, years) {
 const labels = [], data = [];
 let bal = current;
 const rMo = state.returnRate / 12;
 for (let y = 0; y <= Math.min(years, 20); y++) {
 labels.push('Yr ' + y);
 data.push(+bal.toFixed(0));
 for (let m = 0; m < 12; m++) { bal = bal * (1 + rMo) + monthly; }
 }
 dc('sidebarChart');
 charts.sidebarChart = new Chart($('sidebar-chart'), {
 type: 'line',
 data: { labels, datasets: [{ data, borderColor: '#1db954', backgroundColor: 'rgba(29,185,84,.1)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2 }] },
 options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,18,12,.97)', borderColor: 'rgba(232,101,26,.3)', borderWidth: 1, callbacks: { label: ctx => ' ' + fmtK(ctx.raw) } } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 400 } }
 });
}

function renderExpenseChart(annualToday) {
 const catData = EXPENSE_CATS.map(cat => ({
 label: cat.icon + ' ' + cat.name,
 val: cat.items.reduce((a,item) => a + (expenseValues[item.id]||0) * 12, 0)
 })).filter(c => c.val > 0);
 const colors = ['#1db954','#5fcf80','#1db954','#4ab8a0','#8b7fcc','#e05050'];
 dc('expenseChart');
 charts.expenseChart = new Chart(($('expense-chart') && $('expense-chart')), {
 type: 'doughnut',
 data: {
 labels: catData.map(c => c.label),
 datasets: [{ data: catData.map(c => c.val), backgroundColor: colors.slice(0, catData.length).map(c => c + 'cc'), borderWidth: 0, borderRadius: 3 }]
 },
 options: {
 responsive: true, maintainAspectRatio: false, cutout: '55%',
 plugins: {
 legend: { display: true, position: 'bottom', labels: { boxWidth: 8, padding: 12, font: { size: 10 } } },
 tooltip: {
 backgroundColor: 'rgba(10,18,12,.97)', borderColor: 'rgba(232,101,26,.3)', borderWidth: 1, padding: 12,
 bodyFont: { family: 'JetBrains Mono', size: 12, weight: 700 },
 callbacks: { label: ctx => ` ${ctx.label}: ${fmtK(ctx.raw)}/yr (${(ctx.raw/(annualToday||1)*100).toFixed(1)}%)` }
 }
 }
 }
 });
}

// 
// MILESTONES
// 
function renderMilestones(age, fireAge, income, saved, monthly, fireTarget) {
 const milestones = [];
 const y = new Date().getFullYear();
 const rMo = state.returnRate / 12;  // 1x salary
 let bal = saved;
 for (let m = 0; m < 600; m++) {
 bal = bal*(1+rMo)+monthly;
 if (bal >= income && milestones.findIndex(m=>m.id==='1x')<0) {
 const yr = Math.ceil(m/12);
 milestones.push({ id:'1x', age: age+yr, year: y+yr, title:'1× Salary Saved', desc:`$${income.toLocaleString()} invested. Fidelity calls this the first major milestone — you now have compounding working meaningfully in your favor.`, color:'var(--gold)' });
 }
 if (bal >= income*3 && milestones.findIndex(m=>m.id==='3x')<0) {
 const yr = Math.ceil(m/12);
 milestones.push({ id:'3x', age: age+yr, year: y+yr, title:'3× Salary Saved', desc:'Financial momentum is real. Your investment returns are now adding more than small monthly contributions in good market years.', color:'var(--gold)' });
 }
 if (bal >= fireTarget*0.25 && milestones.findIndex(m=>m.id==='25pct')<0) {
 const yr = Math.ceil(m/12);
 milestones.push({ id:'25pct', age: age+yr, year: y+yr, title:'25% of FIRE Number', desc:`${fmtK(fireTarget*0.25)} — one quarter of the way. At this point, your portfolio will double twice more by FIRE day even without additional contributions.`, color:'var(--ember)' });
 }
 if (bal >= fireTarget*0.50 && milestones.findIndex(m=>m.id==='50pct')<0) {
 const yr = Math.ceil(m/12);
 milestones.push({ id:'50pct', age: age+yr, year: y+yr, title:'50% of FIRE Number — Halfway!', desc:'Halfway to financial independence. Compounding is now your biggest monthly contributor. The second half takes less time than the first.', color:'var(--ember)' });
 }
 if (bal >= fireTarget*0.75 && milestones.findIndex(m=>m.id==='75pct')<0) {
 const yr = Math.ceil(m/12);
 milestones.push({ id:'75pct', age: age+yr, year: y+yr, title:'75% of FIRE Number', desc:'Three quarters there. You could now coast to FIRE — stop contributing and your portfolio would still likely reach the target.', color:'var(--green)' });
 }
 if (bal >= fireTarget && milestones.findIndex(m=>m.id==='fire')<0) {
 const yr = Math.ceil(m/12);
 milestones.push({ id:'fire', age: age+yr, year: y+yr, title:' FIRE Achieved!', desc:`${fmtK(fireTarget)} portfolio. You are financially independent. Work is now optional — forever.`, color:'var(--green)' });
 break;
 }
 }  if($('fire-milestones')) $('fire-milestones').innerHTML = milestones.slice(0,6).map(m => `
 <div class="milestone-row">
 
 <div>
 <div class="milestone-age">${m.year} · Age ${m.age}</div>
 <div class="milestone-title">${m.title}</div>
 <div class="milestone-desc">${m.desc}</div>
 </div>
 </div>`).join('');
}

// 
// NEXT STEPS
// 
function renderNextSteps(age, income, saved, monthly, savingsRate) {
 const steps = [
 {
 title: 'Open or max your 401(k) / 403(b)',
 body: `Contribute at least enough to capture your employer match — that's an immediate 50-100% return. 2024 limit: $23,000 ($30,500 if 50+). Pre-tax contributions reduce your taxable income ${income > 60000 ? 'by as much as $23,000' : 'now'}.`
 },
 {
 title: 'Open a Roth IRA',
 body: `Max your Roth IRA every year ($7,000 in 2024; $8,000 if 50+). This money grows tax-free for life and withdrawals in retirement are $0 in taxes. At ${age}, compound growth on $7K/yr becomes ${fmtK(7000*((Math.pow(1+state.returnRate, Math.max(0,50-age))-1)/state.returnRate))} by age 50 at 7%.`
 },
 {
 title: 'Build a 3–6 month emergency fund',
 body: `Before aggressive investing, keep 3-6 months of expenses in a high-yield savings account (4-5% APY currently). This prevents you from selling investments during market downturns. Target: ${fmtK((income/12)*4)}.`
 },
 {
 title: `Increase your savings rate to ${Math.max(20, Math.ceil(savingsRate)).toFixed(0)}%`,
 body: `Your current numbers require saving ${savingsRate.toFixed(1)}% of your income. Every 5% increase in savings rate removes ~3 years from your FIRE timeline. Track spending, cut biggest expenses first (housing, car, food), and automate transfers on payday.`
 },
 {
 title: 'Invest in total market index funds',
 body: `VTI (Vanguard Total Market), FZROX (Fidelity Zero fee), or SPY/VOO (S&P 500) — low-cost, diversified, and they outperform 90%+ of actively managed funds over 20 years. Target expense ratio under 0.1%. Avoid financial advisors charging 1%+ AUM fees.`
 },
 {
 title: 'Track your FI Ratio monthly',
 body: `FI Ratio = Passive Income ÷ Monthly Expenses × 100. At 25% you have serious momentum. At 50% you could coast. At 100% you're free. Watching this number grow each month is the most motivating part of the FIRE journey.`
 },
 ];  if($('next-steps')) $('next-steps').innerHTML = steps.map((s, i) => `
 <div class="step-card">
 <div class="step-num">${i+1}</div>
 <div><div class="step-title">${s.title}</div><div class="step-body">${s.body}</div></div>
 </div>`).join('');
}

// 
// ACCOUNT PRIORITY
// 
function renderAccountPriority(income) {
 const accounts = [
 { num:'1', name:'401(k) to employer match', limit:'Free money — 50-100% instant return', color:'var(--green)', tag:'Do this first — always' },
 { num:'2', name:'HSA (if HDHP eligible)', limit:'$4,150 individual / $8,300 family (2024)', color:'var(--gold)', tag:'Triple tax-free' },
 { num:'3', name:'Roth IRA', limit:'$7,000/yr ($8,000 if 50+) — 2024', color:'var(--ember)', tag:'Tax-free growth for life' },
 { num:'4', name:'401(k) to annual maximum', limit:'$23,000/yr ($30,500 if 50+) — 2024', color:'var(--ember)', tag:'Pre-tax, lowers taxable income' },
 { num:'5', name:'Taxable Brokerage', limit:'No limit — use for early retirement access', color:'var(--sky)', tag:'FIRE bridge before 59½' },
 ];  if($('account-priority')) $('account-priority').innerHTML = accounts.map(a => `
 <div style="display:flex;align-items:flex-start;gap:1rem;padding:.85rem 1rem;background:var(--surface);border:1px solid var(--border2);border-radius:var(--r-sm);border-left:3px solid ${a.color};transition:border-color .15s">
 <div style="width:24px;height:24px;border-radius:50%;background:${a.color}22;border:1px solid ${a.color}44;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:.7rem;font-weight:700;color:${a.color};flex-shrink:0">${a.num}</div>
 <div style="flex:1">
 <div style="font-weight:700;font-size:.85rem;margin-bottom:.15rem">${a.name}</div>
 <div style="font-size:.72rem;color:var(--text3)">${a.limit}</div>
 </div>
 <div class="badge badge-ember" style="font-size:.6rem;white-space:nowrap">${a.tag}</div>
 </div>`).join('');
}

// 
// LEARN CARDS
// 
const LEARN_ITEMS = [
 {
 emoji:'', title:'What is FIRE?',
 short:'FIRE stands for Financial Independence, Retire Early. The goal is to save and invest aggressively so your money generates enough passive income to cover all your expenses — making work optional.',
 long:`The FIRE movement grew out of books like "Your Money or Your Life" (Vicki Robin, 1992) and "Early Retirement Extreme" (Jacob Lund Fisker, 2010). It gained mainstream attention through the blog Mr. Money Mustache starting in 2011.\n\nThe core insight: most people spend 40+ years working not because they need to, but because they never intentionally designed a path to stop. FIRE is about making that path explicit and working toward it systematically.`
 },
 {
 emoji:'', title:'The 4% Rule Explained',
 short:'The 4% Rule says you can safely withdraw 4% of your portfolio per year without running out of money over a 30-year retirement.',
 long:`The Trinity Study (1998) analyzed every historical 30-year period and found that a 4% withdrawal rate from a 60/40 stock-bond portfolio had a ~96% survival rate.\n\nFor early retirement (40-50 years), many FIRE practitioners use 3.5% or 3% to be safer. At 3.5%: multiply annual expenses by 28.6. At 3%: multiply by 33.\n\nImportant caveat: the 4% rule assumes broad index fund investing, not cash savings. It assumes you'll adjust spending in bad markets, and doesn't account for Social Security income.`
 },
 {
 emoji:'', title:'Why Savings Rate Matters More Than Income',
 short:`The key insight: your savings rate — not your income — determines how fast you reach FIRE. Someone earning $50K and saving 50% reaches FIRE at the same time as someone earning $200K and saving 50%.`,
 long:`This is counterintuitive but mathematically true. Here's why:\n\n• Savings rate determines both how fast you accumulate AND how little you need (lower expenses = lower FIRE number).\n• A 10% savings rate requires ~43 years of work. A 50% savings rate requires ~17 years. An 80% rate requires just 5-7 years.\n• Income increases without lifestyle inflation ("lifestyle creep") are the fastest path to FIRE — every raise invested, not spent.`
 },
 {
 emoji:'', title:'Tax-Advantaged Accounts',
 short:'Using the right accounts in the right order saves tens of thousands in taxes over your lifetime — potentially adding years to your FIRE timeline.',
 long:`Three types of tax treatment:\n\n• PRE-TAX (Traditional 401k, IRA): You invest before paying taxes. You pay taxes when you withdraw. Best if you expect lower income in retirement.\n\n• ROTH (Roth 401k, Roth IRA): You invest after-tax dollars. Growth and withdrawals are tax-FREE. Best for young investors who expect higher future income.\n\n• HSA: Triple tax-free — deductible contributions, tax-free growth, tax-free withdrawals for medical. The "stealth IRA."\n\nRoth Conversion Ladder: A key FIRE strategy — convert Traditional IRA money to Roth over 5+ years, then access it penalty-free before 59½.`
 },
 {
 emoji:'', title:'FIRE With a Family',
 short:`Having children doesn't end the FIRE dream — it changes the numbers. Families reach FIRE too, often by sharing expenses and making intentional choices about education costs.`,
 long:`Key family FIRE strategies:\n\n• Dual income significantly accelerates the timeline — a household earning $140K combined and saving 40% reaches FIRE faster than a $100K single-income household.\n\n• Housing is the largest lever: house hacking (renting rooms), choosing a lower cost-of-living area, or living in a paid-off home dramatically changes the FIRE number.\n\n• Education costs: 529 plans grow tax-free for education. Community college + transfer saves $80,000+. Many FIRE families explicitly don't fund private universities.\n\n• Healthcare: The biggest family FIRE challenge. ACA subsidies can be engineered by keeping taxable income low through Roth conversions and capital gains harvesting.`
 },
 {
 emoji:'', title:'Geographic Arbitrage',
 short:'One of the most powerful FIRE accelerators: move to a lower cost-of-living area — domestic or international — and your same portfolio covers far more.',
 long:`A $1.5M portfolio at 4% SWR generates $60,000/year. That's a tight budget in San Francisco but a very comfortable life in:\n\n• Portugal / Spain: $2,500-3,500/mo including rent\n• Mexico / Colombia: $1,500-2,500/mo with excellent healthcare\n• Southeast Asia (Thailand, Vietnam): $1,200-2,000/mo\n• Lower cost US cities (Midwest, rural Southeast): $3,000-4,000/mo\n\nMany FIRE practitioners "coast" — retire abroad for 5-10 years while the portfolio grows, then return home. Remote work + geo-arbitrage is possibly the most efficient path to FIRE in 2024.`
 },
 {
 emoji:'', title:'Sequence of Returns Risk',
 short:`The biggest threat to early retirement isn't average returns — it's bad returns in the first 5-10 years. A market crash at the start of retirement can permanently derail a portfolio that would otherwise last forever.`,
 long:`Why the sequence matters: if you withdraw $60,000/year and markets drop 40% in year 1, you sell shares at the bottom to fund living expenses. Those shares can never compound back — even if markets fully recover.\n\nSolutions used by FIRE practitioners:\n\n• Cash buffer: Keep 1-2 years of expenses in cash. Don't sell equities in down markets.\n• Bond tent: Hold more bonds (40-50%) in the 5 years before and after retirement, then gradually shift back to equities.\n• Flexible spending: Reduce spending 10-20% in bad market years. Eat out less, postpone travel.\n• Part-time income: Even $15,000/year from a passion project halves the sequence risk.`
 },
 {
 emoji:'', title:'Coast FIRE Explained',
 short:'Coast FIRE means you have enough invested that without adding another dollar, your portfolio will compound to your full FIRE number by traditional retirement age.',
 long:`Example: If you need $1.5M at age 65 and you're 35 with $187,000 invested, you've hit Coast FIRE (at 7% real return: $187K × 1.07^30 ≈ $1.5M).\n\nAt Coast FIRE, you only need to earn enough to cover current expenses — no more aggressive saving required. Many people use this as a stepping stone: reach Coast FIRE, then shift to a lower-stress job, work part-time, or pursue passion projects.\n\nCoast FIRE gives you financial security TODAY, even if you're not ready to fully retire. The psychological benefit of knowing you're guaranteed to be wealthy at 65 is enormous.`
 },
];

function renderLearnCards() {
 const grid = $('learn-cards');
 grid.innerHTML = LEARN_ITEMS.map((item, i) => `
 <div class="learn-card" onclick="toggleLearnCard(${i})">
 <div class="learn-card-emoji">${item.emoji}</div>
 <div class="learn-card-title">${item.title}</div>
 <div class="learn-card-body" id="learn-short-${i}">${item.short}</div>
 <div class="learn-card-body" id="learn-long-${i}" style="display:none;margin-top:.5rem;color:var(--text2);font-size:.75rem;white-space:pre-line">${item.long}</div>
 <div class="learn-card-toggle" id="learn-toggle-${i}">Read more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div>
 </div>`).join('');
}

function toggleLearnCard(i) {
 const long = $('learn-long-' + i);
 const tog = $('learn-toggle-' + i);
 const open = long.style.display !== 'none';
 long.style.display = open ? 'none' : 'block';
 tog.innerHTML = open
 ? 'Read more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>'
 : 'Show less <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>';
}

// 
// PROGRESS STEPS
// 
function scrollToSection(id) {
 const el = $(id);
 if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const SECTIONS = ['sec-you','sec-life','sec-expenses','sec-fire','sec-contrib','sec-coast','sec-path','sec-learn'];
const sectionObserver = new IntersectionObserver(entries => {
 entries.forEach(e => {
 if (e.isIntersecting) {
 const idx = SECTIONS.indexOf(e.target.id);
 if (idx >= 0) {
 SECTIONS.forEach((_, i) => {
 const ps = $('ps-' + (i+1));
 const pc = $('pc-' + (i+1));
 if (i < idx) { ps?.classList.add('done'); ps?.classList.remove('active'); if(pc) pc.classList.add('done'); }
 else if (i === idx) { ps?.classList.add('active'); ps?.classList.remove('done'); }
 else { ps?.classList.remove('active','done'); if(pc) pc.classList.remove('done'); }
 });
 }
 }
 });
}, { threshold: 0.3 });

// REVEAL
const revealObserver = new IntersectionObserver(entries => {
 entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.08 });  // 
// FIRE VARIANT SWITCHER
// 
let activeVariant = 'regular';

function switchVariant(name, btn) {
 activeVariant = name;
 document.querySelectorAll('.variant-tab').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 document.querySelectorAll('.variant-panel').forEach(p => p.classList.remove('active'));
 const panel = document.getElementById('vp-' + name);
 if (panel) panel.classList.add('active');
 renderVariantCharts();
}

function renderVariantCharts() {
 const age = parseInt($('age')?.value) || 25;
 const saved = parseFloat($('saved')?.value) || 0;
 const income = parseFloat($('income')?.value) || 65000;
 const rMo = state.returnRate / 12;
 const monthly = parseFloat($('contrib-monthly')?.value) || 1000;  // LEAN FIRE
 const leanAnnual = 30000;
 const leanNum = leanAnnual / state.swr;
 const leanYrs = yearsToTarget(saved, monthly, leanNum, rMo);
 if ($('lean-num-big')) $('lean-num-big').textContent = fmtK(leanNum);
 if ($('lean-annual-disp')) $('lean-annual-disp').textContent = fmtK(leanAnnual);
 if ($('lean-years-disp')) $('lean-years-disp').textContent = leanYrs < 999 ? Math.ceil(leanYrs) + ' yrs' : '99+ yrs';
 if ($('lean-d-num')) $('lean-d-num').textContent = fmtK(leanNum);
 if ($('lean-d-monthly')) $('lean-d-monthly').textContent = fmtK(leanAnnual / 12) + '/mo';
 if ($('lean-d-years')) $('lean-d-years').textContent = leanYrs < 999 ? Math.ceil(leanYrs) + ' yrs' : '99+';
 if ($('lean-chart-label')) $('lean-chart-label').textContent = fmtK(leanNum);
 renderVariantMiniChart('chart-lean', saved, monthly, leanNum, '#1db954', age);  // REGULAR FIRE (uses live expenses)
 const { fireNum: regularNum, annualInflated } = getFireNumbers();
 const regularYrs = yearsToTarget(saved, monthly, regularNum, rMo);
 if ($('regular-num-big')) $('regular-num-big').textContent = fmtK(regularNum);
 if ($('regular-annual-disp'))$('regular-annual-disp').textContent= fmtK(annualInflated);
 if ($('regular-years-disp')) $('regular-years-disp').textContent = regularYrs < 999 ? Math.ceil(regularYrs) + ' yrs' : '99+ yrs';
 if ($('regular-d-num')) $('regular-d-num').textContent = fmtK(regularNum);
 if ($('regular-d-monthly')) $('regular-d-monthly').textContent = fmtK(annualInflated / 12) + '/mo';
 if ($('regular-d-years')) $('regular-d-years').textContent = regularYrs < 999 ? Math.ceil(regularYrs) + ' yrs' : '99+';
 if ($('regular-chart-label'))$('regular-chart-label').textContent= fmtK(regularNum);
 renderVariantMiniChart('chart-regular', saved, monthly, regularNum, '#1db954', age);  // FAT FIRE
 const fatAnnual = 120000;
 const fatNum = fatAnnual / state.swr;
 const fatYrs = yearsToTarget(saved, monthly, fatNum, rMo);
 if ($('fat-num-big')) $('fat-num-big').textContent = fmtK(fatNum);
 if ($('fat-annual-disp')) $('fat-annual-disp').textContent = fmtK(fatAnnual);
 if ($('fat-years-disp')) $('fat-years-disp').textContent = fatYrs < 999 ? Math.ceil(fatYrs) + ' yrs' : '99+ yrs';
 if ($('fat-d-num')) $('fat-d-num').textContent = fmtK(fatNum);
 if ($('fat-d-monthly')) $('fat-d-monthly').textContent = '$10,000/mo';
 if ($('fat-d-years')) $('fat-d-years').textContent = fatYrs < 999 ? Math.ceil(fatYrs) + ' yrs' : '99+';
 if ($('fat-chart-label')) $('fat-chart-label').textContent = fmtK(fatNum);
 renderVariantMiniChart('chart-fat', saved, monthly, fatNum, '#5fcf80', age);  // BARISTA FIRE
 const baristaIncome = parseFloat($('barista-income')?.value) || 20000;
 const gap = Math.max(0, annualInflated - baristaIncome);
 const baristaNum = gap / state.swr;
 const baristaYrs = yearsToTarget(saved, monthly, baristaNum, rMo);
 const fullYrs = regularYrs;
 const savedYrs = Math.max(0, fullYrs - baristaYrs);
 if ($('barista-num-big')) $('barista-num-big').textContent = fmtK(baristaNum);
 if ($('barista-d-num')) $('barista-d-num').textContent = fmtK(baristaNum);
 if ($('barista-d-gap')) $('barista-d-gap').textContent = fmtK(gap) + '/yr';
 if ($('barista-d-saved')) $('barista-d-saved').textContent = savedYrs < 999 ? Math.ceil(savedYrs) + ' yrs earlier' : '—';
 renderBaristaChart(saved, monthly, baristaNum, regularNum, age);  // COAST FIRE (variant panel quick view)
 updateCoastVariantDisplay();
}

function updateCoastVariantDisplay() {
 const age = parseInt($('coast-to-age')?.value) || 65;
 const coastNum = calcCoastNumber();
 const current = parseFloat($('saved')?.value) || 0;
 if ($('coast-num-big')) $('coast-num-big').textContent = fmtK(coastNum);
 if ($('coast-fire-age-inline')) $('coast-fire-age-inline').textContent = age;
 if ($('coast-d-num')) $('coast-d-num').textContent = fmtK(coastNum);
 if ($('coast-d-have')) $('coast-d-have').textContent = fmtK(current);
 const hit = current >= coastNum;
 if ($('coast-d-status')) $('coast-d-status').textContent = hit ? ' Reached!' : `${fmtK(coastNum - current)} to go`;
 renderCoastMiniChart();
}

function yearsToTarget(current, monthly, target, rMo) {
 if (current >= target) return 0;
 let bal = current, mo = 0;
 while (bal < target && mo < 1200) { bal = bal * (1 + rMo) + monthly; mo++; }
 return mo < 1200 ? mo / 12 : 999;
}

function getFireNumbers() {
 // Re-calc from expense state
 const expenses = calcExpenses();
 const annualToday = expenses.annual;
 const age = parseInt($('age')?.value) || 25;
 const fireAge = parseInt($('fire-age')?.value) || 50;
 const yearsToFire = Math.max(0, fireAge - age);
 const annualInflated = annualToday * Math.pow(1 + state.inflation, yearsToFire);
 const fireNum = annualInflated / state.swr;
 return { fireNum, annualInflated, annualToday };
}

// VARIANT MINI CHARTS 
function renderVariantMiniChart(canvasId, current, monthly, target, color, startAge) {
 const rMo = state.returnRate / 12;
 const maxYrs = Math.min(50, Math.ceil(yearsToTarget(current, monthly, target, rMo)) + 3);
 const labels = [], data = [], targetLine = [];
 let bal = current;
 for (let y = 0; y <= maxYrs; y++) {
 labels.push('Age ' + (startAge + y));
 data.push(+bal.toFixed(0));
 targetLine.push(+target.toFixed(0));
 for (let m = 0; m < 12; m++) bal = bal * (1 + rMo) + monthly;
 }
 dc(canvasId);
 const canvas = $(canvasId);
 if (!canvas) return;
 charts[canvasId] = new Chart(canvas, {
 type: 'line',
 data: {
 labels,
 datasets: [
 { label: 'Portfolio', data, borderColor: color, backgroundColor: color + '18', fill: true, tension: .4, pointRadius: 0, borderWidth: 2, pointHoverRadius: 5 },
 { label: 'Target', data: targetLine, borderColor: color + '80', borderDash: [5,4], pointRadius: 0, borderWidth: 1.5 },
 ]
 },
 options: {
 responsive: true, maintainAspectRatio: false,
 interaction: { mode: 'index', intersect: false },
 plugins: {
 legend: { display: false },
 tooltip: { backgroundColor: 'rgba(10,18,12,.97)', borderColor: color + '50', borderWidth: 1, padding: 10,
 callbacks: { title: ctx => ctx[0].label, label: ctx => ` ${ctx.dataset.label}: ${fmtK(ctx.raw)}` } }
 },
 scales: {
 x: { grid: { color: CGRID }, ticks: { font: { size: 9 }, maxTicksLimit: 6 } },
 y: { grid: { color: CGRID }, ticks: { callback: v => fmtK(v), font: { size: 9 } } }
 }
 }
 });
}

function renderBaristaChart(current, monthly, baristaTarget, fullTarget, startAge) {
 const rMo = state.returnRate / 12;
 const maxYrs = Math.min(50, Math.ceil(yearsToTarget(current, monthly, fullTarget, rMo)) + 3);
 const labels = [], fullData = [], baristaData = [];
 let bal = current;
 for (let y = 0; y <= maxYrs; y++) {
 labels.push('Age ' + (startAge + y));
 fullData.push(+bal.toFixed(0));
 baristaData.push(+Math.min(bal, baristaTarget * 1.2).toFixed(0));
 for (let m = 0; m < 12; m++) bal = bal * (1 + rMo) + monthly;
 }
 dc('chart-barista');
 if (!$('chart-barista')) return;
 charts['chart-barista'] = new Chart($('chart-barista'), {
 type: 'line',
 data: {
 labels,
 datasets: [
 { label: 'Portfolio', data: fullData, borderColor: '#4ab8a0', backgroundColor: 'rgba(74,184,160,.1)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2 },
 { label: 'Full FIRE Target', data: Array(maxYrs+1).fill(fullTarget), borderColor: '#1db95480', borderDash: [5,4], pointRadius: 0, borderWidth: 1.5 },
 { label: 'Barista Target', data: Array(maxYrs+1).fill(baristaTarget), borderColor: '#4ab8a080', borderDash: [4,4], pointRadius: 0, borderWidth: 1.5 },
 ]
 },
 options: {
 responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
 plugins: {
 legend: { display: true, labels: { boxWidth: 8, padding: 10, font: { size: 9 } } },
 tooltip: { backgroundColor: 'rgba(10,18,12,.97)', borderColor: '#4ab8a050', borderWidth: 1, padding: 10,
 callbacks: { title: ctx => ctx[0].label, label: ctx => ` ${ctx.dataset.label}: ${fmtK(ctx.raw)}` } }
 },
 scales: { x: { grid: { color: CGRID }, ticks: { font: { size: 9 }, maxTicksLimit: 6 } }, y: { grid: { color: CGRID }, ticks: { callback: v => fmtK(v), font: { size: 9 } } } }
 }
 });
}

// 
// CONTRIBUTION SIMULATOR
// 
let contribMode = 'fixed';

function setContribMode(mode, btn) {
 contribMode = mode;
 btn.closest('.contrib-mode-row').querySelectorAll('.contrib-mode-btn').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 const notes = {
 fixed: 'Enter a fixed monthly dollar amount you plan to invest consistently.',
 pct: 'Enter a percentage of your gross income. The calculator converts this to a monthly dollar amount.',
 maxima: 'Maxing 401k ($23K/yr) + Roth IRA ($7K/yr) = $2,500/mo. This assumes you hit every tax-advantaged limit.'
 };
 if($('contrib-mode-note')) $('contrib-mode-note').textContent = notes[mode];
 if (mode === 'maxima') { $('contrib-monthly').value = 2500; }
 calcContrib();
}

function calcContrib() {
 const age = parseInt($('age')?.value) || 25;
 const saved = parseFloat($('saved')?.value) || 0;
 const income = parseFloat($('income')?.value) || 65000;
 const { fireNum } = getFireNumbers();
 const raise = parseFloat($('contrib-raise')?.value) / 100 || 0.03;
 const rMo = state.returnRate / 12;  let baseMonthly = parseFloat($('contrib-monthly')?.value) || 1000;
 if (contribMode === 'pct') baseMonthly = income / 12 * baseMonthly / 100;
 if (contribMode === 'maxima') baseMonthly = 2500;  // Scenarios: 50%, 75%, 100%, 150%, 200% of entered amount
 const multiples = [0.5, 0.75, 1.0, 1.5, 2.0];
 const colors = ['#3d5c42', '#7a9e80', '#1db954', '#5fcf80', '#1db954'];  if($('contrib-scenarios')) $('contrib-scenarios').innerHTML = multiples.map((mult, i) => {
 const mo = Math.round(baseMonthly * mult);
 const yrs = yearsToTarget(saved, mo, fireNum, rMo);
 const fireYear = age + (yrs < 999 ? Math.ceil(yrs) : 99);
 const isCurrent = mult === 1.0;
 return `<div class="contrib-scenario-card" style="${isCurrent ? 'border-color:var(--ember-brd)' : ''}">
 <div class="contrib-scenario-header">
 <div style="display:flex;align-items:center;gap:.75rem">
 
 <div>
 <div style="font-weight:700;font-size:.85rem">${fmtK(mo)}/month ${isCurrent ? '<span style="font-size:.65rem;color:var(--ember);font-family:var(--mono)">&larr; Your current plan</span>' : ''}</div>
 <div style="font-size:.68rem;color:var(--text3)">${(mo * 12 / income * 100).toFixed(0)}% savings rate</div>
 </div>
 </div>
 <div style="text-align:right">
 <div style="font-family:var(--mono);font-weight:700;color:${colors[i]}">${yrs < 999 ? Math.ceil(yrs) + ' yrs' : '99+ yrs'}</div>
 <div style="font-size:.68rem;color:var(--text3)">FIRE at age ${fireYear < 120 ? fireYear : '99+'}</div>
 </div>
 </div>
 </div>`;
 }).join('');  // Contribution comparison chart
 const maxYrs = 40;
 const labels = Array.from({ length: maxYrs + 1 }, (_, i) => 'Age ' + (age + i));
 dc('contribChart');
 if ($('contrib-chart')) {
 charts.contribChart = new Chart($('contrib-chart'), {
 type: 'line',
 data: {
 labels,
 datasets: [
 ...multiples.map((mult, i) => {
 const mo = Math.round(baseMonthly * mult);
 let bal = saved;
 const data = labels.map(() => { const v = +bal.toFixed(0); bal = bal*(1+rMo)+mo; return v; });
 return { label: fmtK(mo)+'/mo', data, borderColor: colors[i], backgroundColor: 'transparent', tension: .4, pointRadius: 0, borderWidth: i === 2 ? 2.5 : 1.5, borderDash: i === 2 ? [] : i < 2 ? [4,4] : [] };
 }),
 { label: 'FIRE Target', data: Array(maxYrs+1).fill(fireNum), borderColor: '#3d5c42', borderDash: [6,4], pointRadius: 0, borderWidth: 1, backgroundColor: 'transparent' }
 ]
 },
 options: {
 responsive: true, maintainAspectRatio: false,
 interaction: { mode: 'index', intersect: false },
 plugins: {
 legend: { display: true, labels: { boxWidth: 8, padding: 12, font: { size: 10 } } },
 tooltip: {
 backgroundColor: 'rgba(10,18,12,.97)', borderColor: 'rgba(232,101,26,.3)', borderWidth: 1, padding: 12,
 titleFont: { family: 'JetBrains Mono', size: 11, weight: 700 },
 callbacks: {
 title: ctx => ctx[0].label,
 label: ctx => ` ${ctx.dataset.label}: ${fmtK(ctx.raw)}`,
 afterBody: ctx => {
 const portfolio = ctx.find(c => c.datasetIndex === 2)?.raw || 0;
 const target = fireNum;
 if (portfolio && target) return [` Progress: ${Math.min(100,(portfolio/target*100)).toFixed(1)}% of FIRE target`];
 return [];
 }
 }
 }
 },
 scales: {
 x: { grid: { color: CGRID }, ticks: { font: { size: 10 }, maxTicksLimit: 8 } },
 y: { grid: { color: CGRID }, ticks: { callback: v => fmtK(v), font: { size: 10 } } }
 }
 }
 });
 }  // Table
 const tableAmounts = [250, 500, 1000, 1500, 2000, 2500, 3000, 5000];
 if($('contrib-table-body')) $('contrib-table-body').innerHTML = tableAmounts.map(mo => {
 const yrs = yearsToTarget(saved, mo, fireNum, rMo);
 const fireAge2 = age + (yrs < 999 ? Math.ceil(yrs) : 99);
 const pct = (mo * 12 / income * 100).toFixed(0);
 const isCurrent = Math.abs(mo - baseMonthly) < 200;
 let bal = saved;
 for (let m = 0; m < (yrs < 999 ? Math.ceil(yrs) * 12 : 600); m++) bal = bal*(1+rMo)+mo;
 return `<tr style="${isCurrent ? 'background:var(--ember-dim)' : ''}">
 <td style="padding:.65rem 1rem;border-bottom:1px solid var(--border2);font-family:var(--mono);font-weight:${isCurrent?700:400};color:${isCurrent?'var(--ember)':''}">
 ${fmtK(mo)}/mo${isCurrent ? ' ←' : ''}
 </td>
 <td style="padding:.65rem 1rem;border-bottom:1px solid var(--border2);color:var(--text2)">${pct}%</td>
 <td style="padding:.65rem 1rem;border-bottom:1px solid var(--border2);font-family:var(--mono);font-weight:700;color:${yrs<999&&Math.ceil(yrs)<=20?'var(--green)':yrs<999&&Math.ceil(yrs)<=35?'var(--ember)':'var(--text2)'}">${yrs < 999 ? Math.ceil(yrs) + ' yrs' : '99+'}</td>
 <td style="padding:.65rem 1rem;border-bottom:1px solid var(--border2);font-family:var(--mono)">${fireAge2 < 120 ? fireAge2 : '99+'}</td>
 <td style="padding:.65rem 1rem;border-bottom:1px solid var(--border2);font-family:var(--mono);color:var(--text2)">${fmtK(Math.min(bal, fireNum * 2))}</td>
 </tr>`;
 }).join('');
}

// 
// COAST FIRE DEEP DIVE
// 
function calcCoastNumber() {
 const coastAge = parseInt($('coast-target-age')?.value || $('coast-to-age')?.value || '65');
 const currentAge = parseInt($('coast-age')?.value || $('age')?.value || '30');
 const target = parseFloat($('coast-target')?.value) || 1500000;
 const returnRate = parseFloat($('coast-return')?.value) / 100 || 0.07;
 const yearsToGrow = Math.max(0, coastAge - currentAge);
 return target / Math.pow(1 + returnRate, yearsToGrow);
}

function calcCoast() {
 const current = parseFloat($('coast-current')?.value) || 0;
 const target = parseFloat($('coast-target')?.value) || 1500000;
 const currentAge = parseInt($('coast-age')?.value) || 30;
 const coastAge = parseInt($('coast-target-age')?.value) || 65;
 const returnRate = parseFloat($('coast-return')?.value) / 100 || 0.07;
 const coastNum = calcCoastNumber();
 const yearsToGrow = coastAge - currentAge;
 const gap = Math.max(0, coastNum - current);
 const rMo = returnRate / 12;
 const monthly = parseFloat($('contrib-monthly')?.value) || 1000;  // Years to reach coast number with current contributions
 const yrsToCoast = yearsToTarget(current, monthly, coastNum, rMo);  if ($('coast-result-num')) $('coast-result-num').textContent = fmtK(coastNum);
 if ($('coast-result-sub')) $('coast-result-sub').textContent =
 `Invest ${fmtK(coastNum)} today, then never contribute another dollar — your portfolio reaches ${fmtK(target)} by age ${coastAge}`;  if ($('coast-dd-num')) $('coast-dd-num').textContent = fmtK(coastNum);
 if ($('coast-dd-have')) $('coast-dd-have').textContent = fmtK(current);
 if ($('coast-dd-gap')) $('coast-dd-gap').textContent = gap > 0 ? fmtK(gap) : '$0 — Already coasting!';
 if ($('coast-dd-gap')) $('coast-dd-gap').style.color = gap > 0 ? 'var(--ember)' : 'var(--green)';
 if ($('coast-dd-years')) $('coast-dd-years').textContent = yrsToCoast < 999 ? Math.ceil(yrsToCoast) + ' yrs' : '99+';  const alreadyCoasting = current >= coastNum;  if ($('coast-status-box')) {
 if($('coast-status-box')) $('coast-status-box').innerHTML = alreadyCoasting
 ? `<div class="info-box green"><strong> You've already hit Coast FIRE!</strong> Your current ${fmtK(current)} portfolio will compound to ${fmtK(target)} by age ${coastAge} without another dollar of savings. You are financially free to reduce income, change careers, or work only as much as you enjoy.</div>`
 : `<div class="info-box ember"><strong>You need ${fmtK(gap)} more to hit Coast FIRE.</strong> At your current savings rate, you'll reach Coast FIRE in approximately ${yrsToCoast < 999 ? Math.ceil(yrsToCoast) + ' years' : '99+ years'} (age ${Math.round(currentAge + (yrsToCoast < 999 ? yrsToCoast : 99))}). After that, stop contributing — your portfolio does the rest.</div>`;
 }  if ($('coast-phase1-desc')) $('coast-phase1-desc').textContent =
 `Invest as much as possible until you reach your Coast number of ${fmtK(coastNum)}. With ${fmtK(monthly)}/mo contributions, you'll hit Coast FIRE in ${yrsToCoast < 999 ? Math.ceil(yrsToCoast) + ' years' : '99+ years'} (age ${Math.round(currentAge + yrsToCoast)}).`;  if ($('coast-phase3-desc')) $('coast-phase3-desc').textContent =
 `At age ${coastAge}, your portfolio has grown to ${fmtK(target)}. Withdrawing at ${(state.swr * 100).toFixed(1)}% SWR generates ${fmtK(target * state.swr)}/year — covering your retirement expenses indefinitely.`;  // Update target label in age table
 if ($('coast-table-target')) $('coast-table-target').textContent = fmtK(target);  // Coast FIRE by age table
 const ages = [25, 30, 35, 40, 45, 50, 55, 60];
 if ($('coast-age-table')) {
 if($('coast-age-table')) $('coast-age-table').innerHTML = ages.map(a => {
 const yrs = coastAge - a;
 if (yrs <= 0) return '';
 const coastN = target / Math.pow(1 + returnRate, yrs);
 const isCurrent = a === currentAge;
 return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem .9rem;border-radius:6px;background:${isCurrent ? 'var(--ember-dim)' : 'var(--surface2)'};border:1px solid ${isCurrent ? 'var(--ember-brd)' : 'transparent'};margin-bottom:.35rem">
 <div style="font-size:.82rem;font-weight:${isCurrent?700:400}">Age ${a}${isCurrent ? ' ← You' : ''}</div>
 <div style="font-family:var(--mono);font-weight:700;color:${isCurrent?'var(--ember)':'var(--text2)'};">${fmtK(coastN)}</div>
 <div style="font-size:.7rem;color:var(--text3)">${yrs} years to compound</div>
 </div>`;
 }).join('');
 }  renderCoastMainChart(current, coastal = coastNum, target, currentAge, coastAge, returnRate, monthly);
 renderCoastMiniChart();
}

function renderCoastMiniChart() {
 const coastNum = calcCoastNumber();
 const current = parseFloat($('coast-current')?.value || $('saved')?.value) || 0;
 const currentAge = parseInt($('coast-age')?.value || $('age')?.value) || 30;
 const coastAge = parseInt($('coast-target-age')?.value || $('coast-to-age')?.value) || 65;
 const returnRate = parseFloat($('coast-return')?.value) / 100 || 0.07;
 const target = parseFloat($('coast-target')?.value) || 1500000;  const labels = [], coasting = [], targeting = [];
 const startVal = Math.max(current, coastNum);
 for (let age = currentAge; age <= coastAge; age++) {
 const yearsFromCoast = age - currentAge;
 labels.push('Age ' + age);
 coasting.push(+(startVal * Math.pow(1 + returnRate, yearsFromCoast)).toFixed(0));
 targeting.push(+target.toFixed(0));
 }  dc('chart-coast');
 if (!$('chart-coast')) return;
 charts['chart-coast'] = new Chart($('chart-coast'), {
 type: 'line',
 data: {
 labels,
 datasets: [
 { label: 'Coast Portfolio', data: coasting, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,.1)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2 },
 { label: 'FIRE Target', data: targeting, borderColor: 'rgba(139,92,246,.4)', borderDash: [5,4], pointRadius: 0, borderWidth: 1.5 },
 ]
 },
 options: {
 responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
 plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,18,12,.97)', borderColor: '#8b5cf650', borderWidth: 1, padding: 10, callbacks: { title: ctx => ctx[0].label, label: ctx => ` ${ctx.dataset.label}: ${fmtK(ctx.raw)}` } } },
 scales: { x: { grid: { color: CGRID }, ticks: { font: { size: 9 }, maxTicksLimit: 6 } }, y: { grid: { color: CGRID }, ticks: { callback: v => fmtK(v), font: { size: 9 } } } }
 }
 });
}

function renderCoastMainChart(current, coastNum, target, currentAge, coastAge, returnRate, monthly) {
 const rMo = returnRate / 12;
 const yrsToCoast = yearsToTarget(current, monthly, coastNum, rMo);
 const coastStartAge = Math.min(currentAge + Math.ceil(yrsToCoast), coastAge - 1);
 const coastStartVal = Math.max(current, coastNum);  const labels = [], phase1 = [], phase2 = [], targetLine = [];
 let bal = current;  for (let age = currentAge; age <= coastAge; age++) {
 labels.push('Age ' + age);
 targetLine.push(+target.toFixed(0));  if (age <= coastStartAge) {
 phase1.push(+bal.toFixed(0));
 phase2.push(null);
 for (let m = 0; m < 12; m++) bal = bal * (1 + rMo) + monthly;
 } else {
 phase1.push(null);
 const yearsCoasting = age - coastStartAge;
 phase2.push(+(coastStartVal * Math.pow(1 + returnRate, yearsCoasting)).toFixed(0));
 }
 }  dc('coast-main-chart');
 if (!$('coast-main-chart')) return;
 charts['coast-main-chart'] = new Chart($('coast-main-chart'), {
 type: 'line',
 data: {
 labels,
 datasets: [
 { label: 'Accumulation (saving)', data: phase1, borderColor: '#1db954', backgroundColor: 'rgba(29,185,84,.08)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5, spanGaps: false },
 { label: 'Coasting (no savings)', data: phase2, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,.08)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5, spanGaps: false },
 { label: 'FIRE Target', data: targetLine, borderColor: 'rgba(76,175,125,.5)', borderDash: [6,4], pointRadius: 0, borderWidth: 1.5 },
 ]
 },
 options: {
 responsive: true, maintainAspectRatio: false,
 interaction: { mode: 'index', intersect: false },
 plugins: {
 legend: { display: true, labels: { boxWidth: 8, padding: 14, font: { size: 11 } } },
 tooltip: {
 backgroundColor: 'rgba(10,18,12,.97)', borderColor: '#8b5cf650', borderWidth: 1, padding: 12,
 titleFont: { family: 'JetBrains Mono', size: 11, weight: 700 },
 callbacks: {
 title: ctx => ctx[0].label,
 label: ctx => ctx.raw !== null ? ` ${ctx.dataset.label}: ${fmtK(ctx.raw)}` : null,
 afterBody: ctx => {
 const val = ctx.find(c => c.raw !== null && c.datasetIndex < 2)?.raw;
 const t = target;
 if (val && t) return [` ${(val/t*100).toFixed(1)}% of FIRE target`];
 return [];
 }
 }
 }
 },
 scales: {
 x: { grid: { color: CGRID }, ticks: { font: { size: 10 }, maxTicksLimit: 8 } },
 y: { grid: { color: CGRID }, ticks: { callback: v => fmtK(v), font: { size: 10 } } }
 }
 }
 });
}

// 
// INIT
// 
document.addEventListener('DOMContentLoaded', () => {
 renderExpenseBuilder();
 renderLearnCards();
 syncInflation();
 syncReturn();
 // Contrib mode default note
 setContribMode('fixed', document.querySelector('.contrib-mode-btn.active'));
 updateAll();  SECTIONS.forEach(id => {
 const el = $(id);
 if (el) sectionObserver.observe(el);
 });
 document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
