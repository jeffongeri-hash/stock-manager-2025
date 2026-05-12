
// ════════════════════════════════════════════
// GLOBALS & HELPERS
// ════════════════════════════════════════════
const $ = id => document.getElementById(id);
let charts = {};
const fmt  = v  => '$' + Math.round(v).toLocaleString();
const fmtD = v  => '$' + parseFloat(v||0).toFixed(2);
const fmtK = v  => v >= 1e6 ? '$' + (v/1e6).toFixed(2)+'M' : v >= 1e3 ? '$' + (v/1e3).toFixed(1)+'K' : fmt(v);
function dc(k){if(charts[k]){charts[k].destroy();delete charts[k];}}
function syncR(id,lid,sfx){$(lid).textContent = $(id).value + sfx;}
function pmt(P,r,n){ if(r===0) return P/n; return P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1); }

// ── SHARED CHART OPTIONS ──
// Every chart gets: interaction mode index, crosshair-style tooltip
const CGRID = 'rgba(255,255,255,0.04)';
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'DM Sans';

function baseOpts(xLabel, yLabel, isCurrency=true) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, labels: { boxWidth: 8, padding: 14, font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.97)',
        borderColor: 'rgba(74,158,255,0.3)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont:  { family: 'JetBrains Mono', size: 12, weight: 700 },
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${isCurrency ? fmtK(ctx.raw) : ctx.raw + '%'}`
        }
      }
    },
    scales: {
      x: { grid: { color: CGRID }, ticks: { font: { size: 10 } }, title: { display: !!xLabel, text: xLabel, font: { size: 10 }, color: '#475569' } },
      y: { grid: { color: CGRID }, ticks: { callback: v => isCurrency ? fmtK(v) : v+'%', font: { size: 10 } }, title: { display: !!yLabel, text: yLabel, font: { size: 10 }, color: '#475569' } }
    }
  };
}

// ════════════════════════════════════════════
// VEHICLE DATABASE  (msrp, mpgCity, mpgHwy, depRate, type, ins)
// ════════════════════════════════════════════
const VEHICLES = {
  toyota_camry:    { msrp:28400, city:28, hwy:39, dep:0.15, type:'Sedan',     ins:'$110-170/mo' },
  honda_accord:    { msrp:27895, city:29, hwy:37, dep:0.14, type:'Sedan',     ins:'$115-175/mo' },
  tesla_model3:    { msrp:38990, city:null,hwy:null,dep:0.10,type:'EV',       ins:'$160-240/mo', ev:true, equiv:130 },
  honda_civic:     { msrp:23750, city:31, hwy:40, dep:0.14, type:'Sedan',     ins:'$105-155/mo' },
  toyota_corolla:  { msrp:22000, city:30, hwy:38, dep:0.14, type:'Sedan',     ins:'$100-150/mo' },
  nissan_altima:   { msrp:25080, city:27, hwy:38, dep:0.16, type:'Sedan',     ins:'$110-165/mo' },
  hyundai_sonata:  { msrp:27100, city:28, hwy:38, dep:0.15, type:'Sedan',     ins:'$108-160/mo' },
  kia_k5:          { msrp:26090, city:27, hwy:37, dep:0.15, type:'Sedan',     ins:'$105-158/mo' },
  volkswagen_jetta:{ msrp:22970, city:28, hwy:36, dep:0.16, type:'Sedan',     ins:'$105-155/mo' },
  mazda6:          { msrp:23900, city:26, hwy:35, dep:0.14, type:'Sedan',     ins:'$108-162/mo' },
  toyota_rav4:     { msrp:29345, city:27, hwy:35, dep:0.12, type:'SUV',       ins:'$115-175/mo' },
  honda_crv:       { msrp:31895, city:28, hwy:34, dep:0.12, type:'SUV',       ins:'$120-180/mo' },
  ford_escape:     { msrp:28975, city:27, hwy:33, dep:0.14, type:'SUV',       ins:'$115-170/mo' },
  chevrolet_equinox:{msrp:27995, city:26, hwy:31, dep:0.14, type:'SUV',       ins:'$112-168/mo' },
  nissan_rogue:    { msrp:29055, city:27, hwy:35, dep:0.13, type:'SUV',       ins:'$118-172/mo' },
  hyundai_tucson:  { msrp:28175, city:26, hwy:33, dep:0.13, type:'SUV',       ins:'$110-168/mo' },
  kia_sportage:    { msrp:27090, city:25, hwy:32, dep:0.13, type:'SUV',       ins:'$108-165/mo' },
  subaru_forester: { msrp:28495, city:26, hwy:33, dep:0.12, type:'SUV',       ins:'$112-168/mo' },
  mazda_cx5:       { msrp:29295, city:25, hwy:31, dep:0.11, type:'SUV',       ins:'$110-165/mo' },
  volkswagen_tiguan:{ msrp:31995,city:23, hwy:30, dep:0.15, type:'SUV',       ins:'$115-175/mo' },
  jeep_cherokee:   { msrp:33890, city:22, hwy:30, dep:0.16, type:'SUV',       ins:'$120-180/mo' },
  gmc_terrain:     { msrp:34395, city:26, hwy:30, dep:0.14, type:'SUV',       ins:'$115-175/mo' },
  ford_f150:       { msrp:34585, city:20, hwy:26, dep:0.12, type:'Truck',     ins:'$120-185/mo' },
  chevrolet_silverado:{msrp:37400,city:18,hwy:24, dep:0.12, type:'Truck',     ins:'$120-185/mo' },
  ram_1500:        { msrp:38095, city:17, hwy:25, dep:0.12, type:'Truck',     ins:'$118-180/mo' },
  toyota_tacoma:   { msrp:32615, city:19, hwy:24, dep:0.10, type:'Truck',     ins:'$115-175/mo' },
  gmc_sierra:      { msrp:38095, city:17, hwy:24, dep:0.12, type:'Truck',     ins:'$120-185/mo' },
  ford_maverick:   { msrp:23695, city:42, hwy:33, dep:0.13, type:'Truck',     ins:'$108-160/mo' },
  hyundai_santa_cruz:{msrp:25100,city:19,hwy:26, dep:0.13, type:'Truck',      ins:'$110-165/mo' },
  bmw_3series:     { msrp:44900, city:26, hwy:36, dep:0.18, type:'Luxury',    ins:'$165-250/mo' },
  mercedes_c300:   { msrp:46250, city:23, hwy:32, dep:0.19, type:'Luxury',    ins:'$170-265/mo' },
  audi_a4:         { msrp:40900, city:24, hwy:32, dep:0.18, type:'Luxury',    ins:'$160-245/mo' },
  lexus_es350:     { msrp:42300, city:22, hwy:33, dep:0.16, type:'Luxury',    ins:'$155-235/mo' },
  genesis_g80:     { msrp:51195, city:20, hwy:30, dep:0.17, type:'Luxury',    ins:'$165-250/mo' },
  cadillac_ct5:    { msrp:39890, city:22, hwy:32, dep:0.18, type:'Luxury',    ins:'$158-240/mo' },
  volvo_s60:       { msrp:41895, city:22, hwy:32, dep:0.17, type:'Luxury',    ins:'$158-240/mo' },
  bmw_x5:          { msrp:65400, city:21, hwy:26, dep:0.18, type:'Luxury SUV',ins:'$195-290/mo' },
  mercedes_gle:    { msrp:60050, city:19, hwy:26, dep:0.19, type:'Luxury SUV',ins:'$195-295/mo' },
  audi_q7:         { msrp:59995, city:19, hwy:26, dep:0.18, type:'Luxury SUV',ins:'$188-285/mo' },
  lexus_rx350:     { msrp:48150, city:20, hwy:27, dep:0.16, type:'Luxury SUV',ins:'$175-265/mo' },
  acura_mdx:       { msrp:50450, city:19, hwy:27, dep:0.16, type:'Luxury SUV',ins:'$175-265/mo' },
  volvo_xc90:      { msrp:57295, city:20, hwy:27, dep:0.17, type:'Luxury SUV',ins:'$180-275/mo' },
  genesis_gv80:    { msrp:56095, city:19, hwy:25, dep:0.17, type:'Luxury SUV',ins:'$180-275/mo' },
  tesla_modelY:    { msrp:43990, city:null,hwy:null,dep:0.10,type:'EV',       ins:'$170-260/mo', ev:true, equiv:132 },
  tesla_model3lr:  { msrp:45990, city:null,hwy:null,dep:0.10,type:'EV',       ins:'$175-265/mo', ev:true, equiv:134 },
  ford_mache:      { msrp:42995, city:null,hwy:null,dep:0.12,type:'EV',       ins:'$155-240/mo', ev:true, equiv:100 },
  chevrolet_bolt:  { msrp:26500, city:null,hwy:null,dep:0.12,type:'EV',       ins:'$130-195/mo', ev:true, equiv:119 },
  rivian_r1t:      { msrp:69900, city:null,hwy:null,dep:0.13,type:'EV',       ins:'$210-320/mo', ev:true, equiv:70  },
  hyundai_ioniq6:  { msrp:38615, city:null,hwy:null,dep:0.10,type:'EV',       ins:'$150-230/mo', ev:true, equiv:140 },
  kia_ev6:         { msrp:42600, city:null,hwy:null,dep:0.11,type:'EV',       ins:'$155-235/mo', ev:true, equiv:134 },
  volkswagen_id4:  { msrp:38995, city:null,hwy:null,dep:0.12,type:'EV',       ins:'$148-228/mo', ev:true, equiv:107 },
  bmw_i4:          { msrp:52200, city:null,hwy:null,dep:0.14,type:'EV',       ins:'$185-275/mo', ev:true, equiv:102 },
  polestar2:       { msrp:47495, city:null,hwy:null,dep:0.13,type:'EV',       ins:'$175-265/mo', ev:true, equiv:107 },
  ford_mustang:    { msrp:30920, city:21, hwy:32, dep:0.20, type:'Sports',    ins:'$140-215/mo' },
  chevrolet_camaro:{ msrp:30095, city:20, hwy:28, dep:0.20, type:'Sports',    ins:'$138-212/mo' },
  dodge_challenger:{ msrp:32090, city:19, hwy:30, dep:0.19, type:'Sports',    ins:'$135-210/mo' },
  subaru_brz:      { msrp:29715, city:21, hwy:30, dep:0.16, type:'Sports',    ins:'$132-200/mo' },
  toyota_gr86:     { msrp:28700, city:20, hwy:28, dep:0.16, type:'Sports',    ins:'$130-198/mo' },
  mazda_mx5:       { msrp:27250, city:26, hwy:35, dep:0.14, type:'Sports',    ins:'$120-185/mo' },
  toyota_sienna:   { msrp:37265, city:36, hwy:36, dep:0.13, type:'Minivan',   ins:'$118-178/mo' },
  honda_odyssey:   { msrp:37590, city:19, hwy:28, dep:0.13, type:'Minivan',   ins:'$118-178/mo' },
  chrysler_pacifica:{msrp:37295, city:19, hwy:28, dep:0.15, type:'Minivan',   ins:'$115-175/mo' },
  kia_carnival:    { msrp:34005, city:19, hwy:27, dep:0.14, type:'Minivan',   ins:'$112-170/mo' },
  custom:          { msrp:30000, city:28, hwy:36, dep:0.15, type:'Custom',    ins:'$120-180/mo' },
};

// ════════════════════════════════════════════
// APPLY VEHICLE FROM DROPDOWN
// ════════════════════════════════════════════
function applyVehicle() {
  const key = $('vehicle-dropdown').value;
  const v   = VEHICLES[key] || VEHICLES.custom;

  // Update info pills
  $('vip-msrp').textContent = fmt(v.msrp);
  if (v.ev) {
    $('vip-mpg').textContent = v.equiv + ' MPGe';
  } else {
    $('vip-mpg').textContent = (v.city||'—') + ' / ' + (v.hwy||'—');
  }
  $('vip-dep').textContent = (v.dep*100).toFixed(0) + '%/yr';
  $('vip-type').textContent = v.type;

  // Pre-fill all relevant inputs
  const setVal = (id, val) => { const el = $(id); if(el) el.value = val; };
  setVal('cp-price', v.msrp);
  setVal('dep-price', v.msrp);
  setVal('lvb-price', v.msrp);
  setVal('oc-total', Math.round(v.msrp * 1.08));

  // Set dep type selector to closest match
  const depMap = { 0.10:'0.10', 0.11:'0.10', 0.12:'0.12', 0.13:'0.12', 0.14:'0.15', 0.15:'0.15', 0.16:'0.15', 0.17:'0.18', 0.18:'0.18', 0.19:'0.18', 0.20:'0.20', 0.22:'0.22' };
  const dKey   = depMap[(v.dep).toFixed(2)] || '0.15';
  if ($('dep-type')) $('dep-type').value = dKey;

  // Update insurance note on true costs
  if ($('tc-ins-note')) $('tc-ins-note').textContent = `Based on ${v.type} — ${key.replace(/_/g,' ')}`;

  // Refresh all active tab
  calcPayment();
  calcDep();
  calcLVB();
  calcTrueCosts(v);
  calcOC();
}

// ════════════════════════════════════════════
// TAB SWITCHING
// ════════════════════════════════════════════
function switchTab(name, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $('tab-'+name).classList.add('active');
  btn.classList.add('active');
  // Lazy render active tab charts
  if (name === 'payment')     calcPayment();
  if (name === 'depreciation') calcDep();
  if (name === 'leasevbuy')   calcLVB();
  if (name === 'truecosts')   calcTrueCosts();
  if (name === 'opportunity') calcOC();
}

// ════════════════════════════════════════════
// PAYMENT TAB
// ════════════════════════════════════════════
function calcPayment() {
  const price  = parseFloat($('cp-price').value)  || 0;
  const down   = parseFloat($('cp-down').value)   || 0;
  const trade  = parseFloat($('cp-trade').value)  || 0;
  const rate   = parseFloat($('cp-rate').value)   / 100 / 12;
  const term   = parseInt($('cp-term').value)     || 60;
  const tax    = parseFloat($('cp-tax').value)    / 100;
  const fees   = parseFloat($('cp-fees').value)   || 0;
  const taxAmt = price * tax;
  const financed = Math.max(0, price + taxAmt + fees - down - trade);
  const monthly  = pmt(financed, rate, term);
  const totalInt = monthly * term - financed;
  const totalCost = monthly * term + down;
  $('cp-monthly').textContent    = fmt(monthly);
  $('cp-financed').textContent   = fmt(financed);
  $('cp-total-int').textContent  = fmt(totalInt);
  $('cp-total-cost').textContent = fmt(totalCost);

  // FIRE callout
  const yrs = term / 12;
  const retRate = 0.07 / 12;
  const invested = monthly * ((Math.pow(1+retRate, term) - 1) / retRate);
  const fireDelay = Math.ceil(totalCost / (50000 / 365));
  $('cp-fire-total').textContent    = fmt(totalCost);
  $('cp-fire-invested').textContent = fmtK(invested);
  $('cp-fire-delay').textContent    = fireDelay + ' days';

  // ── Balance vs Paid chart ──
  const labels = [], balData = [], paidData = [];
  let bal = financed, totalPaid = down;
  for (let m = 0; m <= term; m++) {
    labels.push(m === 0 ? 'Mo 0' : m % 6 === 0 ? 'Mo ' + m : '');
    balData.push(+bal.toFixed(2));
    paidData.push(+totalPaid.toFixed(2));
    if (m < term) {
      const interest = bal * rate;
      const principal = monthly - interest;
      bal = Math.max(0, bal - principal);
      totalPaid += monthly;
    }
  }
  dc('cpChart');
  charts.cpChart = new Chart($('cp-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Remaining Balance', data: balData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.08)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2 },
        { label: 'Total Paid',        data: paidData, borderColor: '#4a9eff', backgroundColor: 'rgba(74,158,255,.06)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2 },
      ]
    },
    options: { ...baseOpts('Month', 'Amount'), plugins: { ...baseOpts().plugins, legend: { display: true, labels: { boxWidth: 8, padding: 12, font: { size: 11 } } } } }
  });

  // ── Payment donut ──
  dc('cpDonut');
  charts.cpDonut = new Chart($('cp-donut'), {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Interest', 'Tax & Fees'],
      datasets: [{ data: [financed, Math.max(0,totalInt), taxAmt+fees], backgroundColor: ['#4a9eff','#ef4444','#f59e0b'], borderWidth: 0, borderRadius: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 8, padding: 12, font: { size: 10 } } },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,.97)', borderColor: 'rgba(74,158,255,.3)', borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.label}: ${fmtK(ctx.raw)}` }
        }
      }
    }
  });
}

// ════════════════════════════════════════════
// DEPRECIATION TAB
// ════════════════════════════════════════════
function calcDep() {
  const price   = parseFloat($('dep-price').value)  || 28400;
  const annRate = parseFloat($('dep-type').value)   || 0.15;
  const years   = parseInt($('dep-years').value)    || 10;
  const labels  = Array.from({ length: years+1 }, (_, i) => 'Year ' + i);
  const vals    = labels.map((_, i) => +(price * Math.pow(1-annRate, i)).toFixed(2));
  const lostVals = vals.map(v => +(price - v).toFixed(2));

  // Snapshots
  const snaps = [1, 2, 3, 5, Math.min(years, 10)].filter(y => y <= years);
  $('dep-snapshots').innerHTML = snaps.map(y => {
    const v = price * Math.pow(1-annRate, y);
    const lost = price - v;
    return `<div class="row-item">
      <span class="ri-label">Year ${y} Value</span>
      <span class="ri-val" style="display:flex;gap:.75rem;align-items:center">
        <span style="color:var(--accent)">${fmt(v)}</span>
        <span style="font-size:.68rem;color:var(--red)">−${fmt(lost)} lost</span>
      </span>
    </div>`;
  }).join('');

  // FIRE callout values
  const val3yr = price * Math.pow(1-annRate, 3);
  const save3yr = price - val3yr;
  $('dep-fire-save').textContent   = fmt(save3yr);
  $('dep-fire-invested').textContent = fmtK(save3yr * Math.pow(1.07, 10));

  dc('depChart');
  charts.depChart = new Chart($('dep-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Vehicle Value', data: vals,     borderColor: '#4a9eff', backgroundColor: 'rgba(74,158,255,.08)', fill: true, tension: .4, pointRadius: 5, borderWidth: 2, pointBackgroundColor: '#4a9eff', pointHoverRadius: 8 },
        { label: 'Total Loss',    data: lostVals,  borderColor: '#ef4444', backgroundColor: 'transparent', tension: .4, pointRadius: 3, borderWidth: 1.5, borderDash: [5,4], pointHoverRadius: 6 },
      ]
    },
    options: { ...baseOpts('Year', 'Amount'),
      plugins: { ...baseOpts().plugins,
        tooltip: {
          backgroundColor: 'rgba(17,24,39,.97)', borderColor: 'rgba(74,158,255,.3)', borderWidth: 1, padding: 12,
          titleFont: { family: 'JetBrains Mono', size: 11 }, bodyFont: { family: 'JetBrains Mono', size: 12, weight: 700 },
          callbacks: {
            title: ctx => ctx[0].label,
            label: ctx => ` ${ctx.dataset.label}: ${fmtK(ctx.raw)}`,
            afterBody: ctx => {
              const yr = ctx[0].dataIndex;
              const remainPct = ((vals[yr] / price) * 100).toFixed(1);
              return [`  Retained: ${remainPct}% of original value`];
            }
          }
        }
      }
    }
  });
}

// ════════════════════════════════════════════
// LEASE VS BUY TAB
// ════════════════════════════════════════════
function calcLVB() {
  const leasePmt  = parseFloat($('lvb-lease-pmt').value) || 0;
  const leaseTerm = parseInt($('lvb-lease-term').value)  || 36;
  const signing   = parseFloat($('lvb-signing').value)   || 0;
  const disp      = parseFloat($('lvb-disp').value)      || 0;
  const price     = parseFloat($('lvb-price').value)     || 0;
  const down      = parseFloat($('lvb-down').value)      || 0;
  const rate      = parseFloat($('lvb-rate').value) / 100 / 12;
  const buyTerm   = parseInt($('lvb-buy-term').value)    || 60;
  const residual  = parseFloat($('lvb-residual').value)  || 0;

  const totalLease = leasePmt * leaseTerm + signing + disp;
  const buyPmt     = pmt(price - down, rate, buyTerm);
  const totalBuyPaid = buyPmt * buyTerm + down;
  const netBuy     = totalBuyPaid - residual;

  $('lvb-total-lease').textContent = fmt(totalLease);
  $('lvb-net-buy').textContent     = fmt(netBuy);

  const leaseWins = totalLease < netBuy;
  $('lvb-verdict').textContent     = leaseWins ? '✓ Leasing is cheaper in this scenario' : '✓ Buying is cheaper in this scenario';
  $('lvb-verdict').style.color     = leaseWins ? 'var(--accent)' : 'var(--green)';
  $('lvb-verdict-sub').textContent = `${leaseWins ? 'Leasing' : 'Buying'} saves ${fmt(Math.abs(totalLease - netBuy))} over the comparison period`;

  $('lvb-breakdown').innerHTML = [
    { label: 'Total Lease Payments', val: fmt(leasePmt * leaseTerm) },
    { label: 'Due at Signing',       val: fmt(signing) },
    { label: 'Disposition Fee',      val: fmt(disp) },
    { label: 'Total Buy Payments',   val: fmt(buyPmt * buyTerm) },
    { label: 'Down Payment',         val: fmt(down) },
    { label: 'Residual Value',       val: '−' + fmt(residual) },
  ].map(r => `<div class="row-item"><span class="ri-label">${r.label}</span><span class="ri-val">${r.val}</span></div>`).join('');

  $('lvb-fire-note').innerHTML = leaseWins
    ? `Short-term, leasing wins. But leasing builds <strong>zero equity</strong>. A bought-and-paid-off car permanently eliminates the payment, freeing <strong>${fmt(buyPmt)}/mo</strong> for FIRE investing after loan payoff.`
    : `Buying saves <strong>${fmt(Math.abs(totalLease - netBuy))}</strong> and retains <strong>${fmt(residual)}</strong> in vehicle equity. After payoff, redirect ${fmt(buyPmt)}/mo to investments for powerful FIRE acceleration.`;

  // ── Cumulative cost chart ──
  const maxMo = Math.max(leaseTerm, buyTerm);
  const moLabels = Array.from({ length: maxMo + 1 }, (_, i) => 'Mo ' + i);
  const leaseCumul = moLabels.map((_, i) => {
    if (i === 0) return signing;
    if (i <= leaseTerm) return signing + leasePmt * i;
    return signing + leasePmt * leaseTerm + disp; // lease ended
  });
  const buyCumul = moLabels.map((_, i) => {
    const paid = i <= buyTerm ? buyPmt * i + down : buyPmt * buyTerm + down;
    return paid;
  });

  dc('lvbChart');
  charts.lvbChart = new Chart($('lvb-chart'), {
    type: 'line',
    data: {
      labels: moLabels,
      datasets: [
        { label: 'Lease Cumulative Cost', data: leaseCumul, borderColor: '#4a9eff', backgroundColor: 'rgba(74,158,255,.07)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5, pointHoverRadius: 6 },
        { label: 'Buy Cumulative Cost',   data: buyCumul,  borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.07)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2.5, pointHoverRadius: 6 },
      ]
    },
    options: { ...baseOpts('Month', 'Cumulative Cost'),
      plugins: {
        legend: { display: true, labels: { boxWidth: 8, padding: 14, font: { size: 11 } } },
        tooltip: {
          mode: 'index', intersect: false,
          backgroundColor: 'rgba(17,24,39,.97)', borderColor: 'rgba(74,158,255,.3)', borderWidth: 1, padding: 14,
          titleFont: { family: 'JetBrains Mono', size: 11, weight: 700 }, bodyFont: { family: 'JetBrains Mono', size: 12 },
          callbacks: {
            title: ctx => 'Month ' + ctx[0].dataIndex,
            label: ctx => ` ${ctx.dataset.label}: ${fmtK(ctx.raw)}`,
            afterBody: ctx => {
              if (ctx.length >= 2) {
                const diff = ctx[0].raw - ctx[1].raw;
                return [`  Difference: ${diff >= 0 ? '+' : ''}${fmtK(diff)}`];
              }
              return [];
            }
          }
        }
      }
    }
  });
}

// ════════════════════════════════════════════
// TRUE COSTS TAB
// ════════════════════════════════════════════
function calcTrueCosts(vData) {
  const key  = $('vehicle-dropdown').value;
  const v    = vData || VEHICLES[key] || VEHICLES.custom;
  const miles = parseFloat($('tc-miles').value) || 12000;
  const gas   = parseFloat($('tc-gas').value)   || 3.50;

  // Fuel rows
  const fuelRows = v.ev
    ? [
        { label: 'Electric @ $0.13/kWh (est.)', val: (miles / (v.equiv||100)) * 33.7 * 0.13 },
        { label: 'Compare: 30 MPG gas car',     val: miles / 30 * gas },
        { label: 'Compare: 25 MPG gas car',     val: miles / 25 * gas },
      ]
    : [
        { label: `${v.city||25} MPG City @ $${gas}/gal`,  val: miles / (v.city||25) * gas },
        { label: `${v.hwy||35} MPG Hwy @ $${gas}/gal`,   val: miles / (v.hwy||35) * gas },
        { label: '30 MPG Blended estimate',                val: miles / 30 * gas },
        { label: 'Electric equiv. ($0.13/kWh)',            val: miles / 100 * 33.7 * 0.13 },
      ];

  $('tc-fuel-list').innerHTML = fuelRows.map((r, i) => `
    <div class="row-item" style="${i===0?'font-weight:700;color:var(--accent)':''}">
      <span class="ri-label" style="color:${i===0?'var(--text)':'var(--text2)'}">${r.label}${i===0?' ← This Vehicle':''}</span>
      <span class="ri-val" style="color:${i===0?'var(--accent)':r.label.includes('Electric')&&!v.ev?'var(--green)':''}">${fmt(r.val)}/yr</span>
    </div>`).join('');

  $('tc-ins-list').innerHTML = [
    { label: 'Liability Only',   val: v.ins?.split('-')[0] + '/mo' },
    { label: 'Full Coverage',    val: v.ins || '$120-180/mo' },
    { label: 'Premium Coverage', val: v.ins?.replace(/\d+/, s => Math.round(parseInt(s)*1.4)) },
  ].map(r => `<div class="row-item"><span class="ri-label">${r.label}</span><span class="ri-val">${r.val}</span></div>`).join('');

  $('tc-maint-list').innerHTML = [
    { label: v.ev ? 'Software updates / service' : 'Oil Changes (3× per year)', val: v.ev ? '$100-200' : '$150-300' },
    { label: 'Tires (amortized annually)',   val: '$300-600' },
    { label: 'Brakes (amortized annually)',  val: v.ev ? '$80-150' : '$150-300' },
    { label: 'Registration & Fees',          val: '$100-400' },
    { label: v.ev ? 'Battery / 12V checks'  : 'Filters, belts, fluids', val: v.ev ? '$50-150' : '$100-250' },
  ].map(r => `<div class="row-item"><span class="ri-label">${r.label}</span><span class="ri-val">${r.val}</span></div>`).join('');

  const baseFuel = fuelRows[0].val;
  const annualTotal = baseFuel + 1800 + 750 + 200;
  $('tc-total-annual').textContent = '$' + Math.round(annualTotal).toLocaleString() + '/yr est.';
  $('tc-fire-annual').textContent  = fmt(annualTotal);
  $('tc-fire-5yr').textContent     = fmt(annualTotal * 5);

  // ── 5-Year fuel comparison chart ──
  const fuelLabels = fuelRows.map(r => r.label.split('(')[0].trim());
  dc('tcFuelChart');
  charts.tcFuelChart = new Chart($('tc-fuel-chart'), {
    type: 'bar',
    data: {
      labels: fuelLabels,
      datasets: [{ label: '5-Year Fuel Cost', data: fuelRows.map(r => r.val * 5), backgroundColor: fuelRows.map((r,i) => i===0?'rgba(74,158,255,.8)':r.label.includes('Electric')?'rgba(16,185,129,.6)':'rgba(74,158,255,.3)'), borderRadius: 4, borderColor: fuelRows.map((r,i)=>i===0?'#4a9eff':r.label.includes('Electric')?'#10b981':'transparent'), borderWidth: 1 }]
    },
    options: { ...baseOpts('', '5-Year Cost'),
      plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(17,24,39,.97)', borderColor: 'rgba(74,158,255,.3)', borderWidth:1, padding:12, bodyFont:{family:'JetBrains Mono',size:12,weight:700}, callbacks: { label: ctx => ` 5-Year: ${fmtK(ctx.raw)}`, afterLabel: ctx => ` Annual: ${fmtK(ctx.raw/5)}` } } }
    }
  });

  // ── TCO stacked area chart (5 years monthly) ──
  const tcMonths = Array.from({length:61}, (_,i) => 'Mo '+i);
  const fuelMo = baseFuel / 12;
  const insMo  = 150;
  const maintMo = 750 / 12;
  const cpMonthly = parseFloat($('cp-monthly').textContent?.replace(/[$,]/g,'')) || pmt(Math.max(0,parseFloat($('cp-price').value||28400)*1.06-5000), 0.065/12, 60);
  const tcoData = tcMonths.map((_,i) => [cpMonthly*i, fuelMo*i, insMo*i, maintMo*i]);

  dc('tcTcoChart');
  charts.tcTcoChart = new Chart($('tc-tco-chart'), {
    type: 'line',
    data: {
      labels: tcMonths,
      datasets: [
        { label: 'Loan Payments',  data: tcoData.map(d=>d[0]), borderColor:'#4a9eff', backgroundColor:'rgba(74,158,255,.12)', fill:true, tension:.4, pointRadius:0, borderWidth:2 },
        { label: 'Fuel',           data: tcoData.map((_,i)=>fuelMo*