/* 무럭무럭 딸기 일기 — data.json(노션 동기화 결과)을 읽어 그린다. */
"use strict";

const RANGES = [
  { key: "7", label: "7일", days: 7 },
  { key: "30", label: "30일", days: 30 },
  { key: "90", label: "90일", days: 90 },
  { key: "all", label: "전체", days: null },
];
const C = {
  berry: "#E85D6C", berryDeep: "#D9445A", leaf: "#6DBE7A", leafDeep: "#3F9A55",
  water: "#7FB7E6", sun: "#F7C948", ink: "#4A2A2E", ink2: "#8C5F66", ink3: "#B08A90",
  grid: "#F6DDE2", line: "#F6CFD6", band: "rgba(109,190,122,.28)",
};
const PLANTER_COLOR = { A: "#E85D6C", B: "#F7A048", C: "#6DBE7A", D: "#7FB7E6" };

// ── 유틸 ────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s) => new Date(`${s}T00:00:00`);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const short = (s) => { const [, m, d] = s.split("-"); return `${Number(m)}/${Number(d)}`; };
const avg = (a) => { const v = a.filter((x) => x !== null && x !== undefined); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const sum = (a) => { const v = a.filter((x) => x !== null && x !== undefined); return v.length ? v.reduce((s, x) => s + x, 0) : null; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const kst = (iso, withDate) => {
  if (!iso) return "";
  const d = new Date(iso);
  const opt = withDate ? { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" } : { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" };
  return d.toLocaleString("ko-KR", opt);
};

function rangeBounds(rangeKey, startDate) {
  const today = new Date();
  const r = RANGES.find((x) => x.key === rangeKey) || RANGES[1];
  let from = r.days ? fmtDate(addDays(today, -(r.days - 1))) : startDate;
  if (from < startDate) from = startDate;
  return [from, fmtDate(today)];
}

// ── 판정 & 마스코트 ─────────────────────────────────────────────
function tempStatus(t) {
  if (t === null || t === undefined) return null;
  if (t < 10) return { tone: "cold", text: "저온 · 생육이 멈출 수 있어요" };
  if (t < 18) return { tone: "cool", text: "서늘 · 꽃눈 만들기엔 좋아요" };
  if (t <= 25) return { tone: "ok", text: "적온 · 딱 좋아요" };
  if (t <= 30) return { tone: "warm", text: `적온보다 ${r1(t - 25)}℃ 높아요 · 환기와 차광` };
  return { tone: "hot", text: "고온 · 생육 정지, 꽃가루 불량 주의" };
}
function humStatus(h) {
  if (h === null || h === undefined) return null;
  if (h < 40) return { tone: "warm", text: "건조 · 응애 주의" };
  if (h <= 70) return { tone: "ok", text: "적정 · 딱 좋아요" };
  return { tone: "hot", text: "다습 · 곰팡이·흰가루병 주의" };
}
const moodOf = (s) => (!s ? "sleepy" : (s.tone === "ok" || s.tone === "cool") ? "happy" : s.tone);
const BUBBLE = {
  sleepy: "오늘 온도랑 습도 알려주세요! 컨디션을 봐드릴게요.",
  happy: "적온이에요! 오늘도 무럭무럭 자라는 중",
  warm: "조금 덥네요~ 바람 통하게 해주시고, 한낮엔 그늘 부탁해요",
  hot: "너무 더워요!! 시원한 곳으로 옮겨주세요",
  cold: "으으 추워요… 실내로 들여주시면 좋겠어요",
};

function berrySVG(mood, size) {
  const mouth = {
    happy: "M22 40 Q30 48 38 40", sleepy: "M25 42 Q30 45 35 42",
    warm: "M23 42 Q30 39 37 42", hot: "M23 43 Q26.5 39 30 43 Q33.5 47 37 43",
    cold: "M24 42 L36 42",
  }[mood] || "M22 40 Q30 48 38 40";
  const seeds = [[18, 24], [30, 20], [42, 24], [13, 36], [47, 36], [16, 48], [44, 48], [24, 55], [36, 55]]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.7" ry="2.4" fill="#FFE9B8"/>`).join("");
  const eyes = mood === "sleepy"
    ? `<path d="M21 35 Q24 38 27 35" stroke="${C.ink}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M33 35 Q36 38 39 35" stroke="${C.ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    : `<circle cx="24" cy="35" r="2.3" fill="${C.ink}"/><circle cx="36" cy="35" r="2.3" fill="${C.ink}"/>`;
  const sweat = (mood === "warm" || mood === "hot") ? `<path d="M49 20 q3.5 5.5 0 8 q-3.5 -2.5 0 -8Z" fill="${C.water}" stroke="${C.ink}" stroke-width="1.2"/>` : "";
  const sweat2 = mood === "hot" ? `<path d="M8 22 q3.5 5.5 0 8 q-3.5 -2.5 0 -8Z" fill="${C.water}" stroke="${C.ink}" stroke-width="1.2"/>` : "";
  const shiver = mood === "cold" ? `<g stroke="${C.water}" stroke-width="2" stroke-linecap="round"><path d="M6 30 l4 -3"/><path d="M5 37 l4 0"/><path d="M54 30 l-4 -3"/><path d="M55 37 l-4 0"/></g>` : "";
  return `<svg viewBox="0 0 60 66" width="${size}" height="${Math.round(size * 66 / 60)}" aria-hidden="true">
    <path d="M30 4 C26 1 19 3 16 10 C23 9 27 10 30 13 C33 10 37 9 44 10 C41 3 34 1 30 4 Z" fill="${C.leaf}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M30 4 L30 12" stroke="${C.leafDeep}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M30 12 C46 12 55 25 51 40 C47 54 37 63 30 63 C23 63 13 54 9 40 C5 25 14 12 30 12 Z" fill="${C.berry}" stroke="${C.ink}" stroke-width="2"/>
    ${seeds}
    <circle cx="19" cy="41" r="3.2" fill="#FF9FB0" opacity=".85"/><circle cx="41" cy="41" r="3.2" fill="#FF9FB0" opacity=".85"/>
    ${eyes}
    <path d="${mouth}" stroke="${C.ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${sweat}${sweat2}${shiver}
  </svg>`;
}

// ── 집계 ────────────────────────────────────────────────────────
function aggregate(records) {
  const m = new Map();
  for (const r of records) { if (!m.has(r.date)) m.set(r.date, []); m.get(r.date).push(r); }
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, rs]) => ({
    date, label: short(date),
    temp: r1(avg(rs.map((x) => x.temp))), hum: r1(avg(rs.map((x) => x.hum))),
    water: sum(rs.map((x) => x.water)),
    leaves: r1(avg(rs.map((x) => x.leaves))), flowers: r1(avg(rs.map((x) => x.flowers))), fruits: r1(avg(rs.map((x) => x.fruits))),
    hg: sum(rs.map((x) => x.hg)), hc: sum(rs.map((x) => x.hc)),
  }));
}
function totalsOf(records) {
  return {
    count: records.length,
    harvestG: sum(records.map((r) => r.hg)) || 0,
    harvestN: sum(records.map((r) => r.hc)) || 0,
    waterSum: sum(records.map((r) => r.water)) || 0,
    waterDays: new Set(records.filter((r) => (r.types || []).includes("관수") || (r.water !== null && r.water !== undefined && r.water > 0)).map((r) => r.date)).size,
  };
}
function planterStats(records) {
  return ["A", "B", "C", "D"].map((p) => {
    const rs = records.filter((r) => (r.planters || []).length === 1 && r.planters[0] === p);
    return { planter: p, n: rs.length, hg: sum(rs.map((r) => r.hg)) || 0 };
  });
}

// ── 렌더 ────────────────────────────────────────────────────────
const state = { data: null, range: "30", charts: {} };
const $ = (id) => document.getElementById(id);
const show = (id, on) => $(id).classList.toggle("hidden", !on);

const bandPlugin = {
  id: "band",
  beforeDatasetsDraw(chart, _args, opts) {
    if (!opts || !opts.axis) return;
    const y = chart.scales[opts.axis]; if (!y) return;
    const { ctx, chartArea: { left, right } } = chart;
    const top = y.getPixelForValue(opts.max), bottom = y.getPixelForValue(opts.min);
    ctx.save(); ctx.fillStyle = opts.color; ctx.fillRect(left, top, right - left, bottom - top); ctx.restore();
  },
};

function baseOptions(extraScales) {
  return {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff", titleColor: C.ink, bodyColor: C.ink2, borderColor: C.line, borderWidth: 2,
        cornerRadius: 12, padding: 10, displayColors: true, boxPadding: 4,
      },
    },
    scales: Object.assign({
      x: { grid: { display: false }, border: { color: C.line, width: 2 }, ticks: { color: C.ink3, font: { weight: 700, size: 11 } } },
    }, extraScales),
  };
}
const yScale = (extra) => Object.assign({ grid: { color: C.grid, borderDash: [3, 3] }, border: { display: false }, ticks: { color: C.ink3, font: { weight: 700, size: 11 } } }, extra || {});
const lineDs = (label, data, color, extra) => Object.assign({
  label, data, borderColor: color, backgroundColor: color, borderWidth: 3, tension: 0.35,
  pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: color, pointBorderColor: "#fff", pointBorderWidth: 2, spanGaps: true,
}, extra || {});
const barDs = (label, data, color, extra) => Object.assign({ label, data, backgroundColor: color, borderRadius: 8, maxBarThickness: 36 }, extra || {});

function chart(id, config) {
  if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; }
  const el = $(id); if (!el || typeof Chart === "undefined") return;
  state.charts[id] = new Chart(el, config);
}

function gaugeHTML(label, value, unit, min, max, band, status) {
  const p = (v) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  return `<div class="sd-gauge">
    <div class="sd-gauge-row"><span class="sd-gauge-label">${label}</span><span class="sd-gauge-value">${value}<small>${unit}</small></span></div>
    <div class="sd-track" aria-hidden="true"><div class="sd-band" style="left:${p(band[0])}%;width:${p(band[1]) - p(band[0])}%"></div><div class="sd-marker" style="left:${p(value)}%"></div></div>
    <div class="sd-gauge-foot"><span>${min}${unit}</span>${status ? `<span class="sd-status sd-${status.tone}">${status.text}</span>` : ""}<span>${max}${unit}</span></div>
  </div>`;
}

function render() {
  const data = state.data; if (!data) return;
  const startDate = data.startDate || "2026-09-05";
  const [from, to] = rangeBounds(state.range, startDate);
  const all = data.records || [];
  const records = all.filter((r) => r.date >= from && r.date <= to);
  const days = aggregate(records);
  const totals = totalsOf(records);
  const dPlus = Math.floor((parseDate(fmtDate(new Date())) - parseDate(startDate)) / 86400000) + 1;
  const rangeLabel = (RANGES.find((r) => r.key === state.range) || RANGES[1]).label;

  // 헤더 / 컨디션 (컨디션은 기간과 무관하게 전체 기록 중 가장 최근 값)
  const variety = (data.plants && data.plants[0] && data.plants[0].variety) || "설향";
  $("sub").textContent = `${variety} ${data.plants ? data.plants.length : 8}주 · A~D 화분 · 식재 D+${dPlus}`;
  const hasEnv = (r) => (r.temp !== null && r.temp !== undefined) || (r.hum !== null && r.hum !== undefined);
  const latestEnv = [...all].filter(hasEnv).sort((a, b) => (a.date === b.date ? (a.created || "") < (b.created || "") ? 1 : -1 : a.date < b.date ? 1 : -1))[0] || null;
  const tS = latestEnv ? tempStatus(latestEnv.temp) : null;
  const hS = latestEnv ? humStatus(latestEnv.hum) : null;
  const mood = moodOf(tS);
  $("mascot-small").innerHTML = berrySVG(mood, 52);
  $("mascot-big").innerHTML = berrySVG(mood, 84);
  $("bubble").textContent = BUBBLE[mood];
  $("hero-date").textContent = latestEnv ? `${latestEnv.date} 기록` : "";
  $("gauges").innerHTML = latestEnv
    ? (latestEnv.temp !== null && latestEnv.temp !== undefined ? gaugeHTML("베란다 온도", latestEnv.temp, "℃", 0, 40, [18, 25], tS) : "")
      + (latestEnv.hum !== null && latestEnv.hum !== undefined ? gaugeHTML("습도", latestEnv.hum, "%", 0, 100, [40, 70], hS) : "")
    : `<div class="sd-empty">초록 띠(18~25℃, 40~70%)가 딸기가 좋아하는 구간이에요.</div>`;

  // 기간 버튼 / 요약 알약
  $("range").innerHTML = RANGES.map((r) => `<button type="button" data-range="${r.key}" aria-pressed="${r.key === state.range}">${r.label}</button>`).join("");
  $("range").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { state.range = b.dataset.range; render(); }));
  $("stats").innerHTML = `<span class="sd-pill">${rangeLabel} 기록 ${totals.count}건</span><span class="sd-pill">물 준 날 ${totals.waterDays}일</span><span class="sd-pill">수확 ${totals.harvestG}g</span>`
    + (data.generatedAt ? `<span class="sd-pill sd-pill-live">노션 동기화 ${kst(data.generatedAt, true)}</span>` : "");

  const labels = days.map((d) => d.label);

  // 온도·습도
  const envHas = days.some((d) => d.temp !== null || d.hum !== null);
  show("env-wrap", envHas); show("env-legend", envHas); show("env-empty", !envHas);
  $("env-meta").textContent = envHas ? "일별 평균 · 초록 띠 = 적온 18~25℃" : "";
  if (envHas) chart("env", {
    type: "line",
    data: { labels, datasets: [
      lineDs("온도 ℃", days.map((d) => d.temp), C.berry, { yAxisID: "yT" }),
      lineDs("습도 %", days.map((d) => d.hum), C.water, { yAxisID: "yH", borderDash: [6, 4] }),
    ] },
    options: Object.assign(baseOptions({
      yT: yScale({ position: "left", min: 0, max: 40 }),
      yH: yScale({ position: "right", min: 0, max: 100, grid: { drawOnChartArea: false } }),
    }), { plugins: Object.assign(baseOptions().plugins, { band: { axis: "yT", min: 18, max: 25, color: C.band } }) }),
    plugins: [bandPlugin],
  });

  // 급수
  const waterHas = days.some((d) => d.water !== null);
  show("water-wrap", waterHas); show("water-empty", !waterHas);
  $("water-meta").textContent = totals.waterDays ? `${totals.waterDays}일 · 합계 ${totals.waterSum} ml` : "";
  $("water-empty").textContent = totals.waterDays
    ? `물 준 날은 ${totals.waterDays}일인데 양(ml)이 없어요. 다음엔 계량컵으로 한 번만 재주세요. 그 값이 기준량이 돼요.`
    : "급수량(ml)을 적으면 물 준 날이 막대로 보여요. 막대가 매일 서 있으면 과습 신호!";
  if (waterHas) chart("water", { type: "bar", data: { labels, datasets: [barDs("급수량 ml", days.map((d) => d.water), C.water)] }, options: baseOptions({ y: yScale({ beginAtZero: true }) }) });

  // 생육
  const growthHas = days.some((d) => d.leaves !== null || d.flowers !== null || d.fruits !== null);
  show("growth-wrap", growthHas); show("growth-legend", growthHas); show("growth-empty", !growthHas);
  $("growth-meta").textContent = growthHas ? "잎·꽃·과실 수, 일별 평균" : "";
  if (growthHas) chart("growth", {
    type: "line",
    data: { labels, datasets: [lineDs("잎", days.map((d) => d.leaves), C.leaf), lineDs("꽃", days.map((d) => d.flowers), C.sun), lineDs("과실", days.map((d) => d.fruits), C.berry)] },
    options: baseOptions({ y: yScale({ beginAtZero: true, ticks: { precision: 0, color: C.ink3, font: { weight: 700, size: 11 } } }) }),
  });

  // 수확
  const harvestHas = totals.harvestG > 0;
  show("harvest-wrap", harvestHas); show("harvest-empty", !harvestHas);
  $("harvest-meta").textContent = harvestHas ? `누적 ${totals.harvestG}g · ${totals.harvestN}개` : "";
  if (harvestHas) {
    const hd = days.filter((d) => d.hg !== null);
    chart("harvest", { type: "bar", data: { labels: hd.map((d) => d.label), datasets: [barDs("수확량 g", hd.map((d) => d.hg), C.berry)] }, options: baseOptions({ y: yScale({ beginAtZero: true }) }) });
  }

  // 화분별
  const ps = planterStats(records);
  const planterHas = ps.some((p) => p.n > 0);
  const metric = ps.some((p) => p.hg > 0) ? "hg" : "n";
  show("planter-wrap", planterHas); show("planter-empty", !planterHas);
  $("planter-meta").textContent = planterHas ? (metric === "hg" ? "수확량 g" : "기록 수 (수확 전)") : "";
  if (planterHas) chart("planter", {
    type: "bar",
    data: { labels: ps.map((p) => p.planter), datasets: [barDs(metric === "hg" ? "수확량 g" : "기록 수", ps.map((p) => p[metric]), ps.map((p) => PLANTER_COLOR[p.planter]))] },
    options: Object.assign(baseOptions({ x: yScale({ beginAtZero: true, ticks: { precision: 0, color: C.ink3, font: { weight: 700, size: 11 } } }), y: { grid: { display: false }, border: { display: false }, ticks: { color: C.ink, font: { weight: 700, size: 13 } } } }), { indexAxis: "y" }),
  });

  // 개체 현황
  const plants = data.plants || [];
  $("plants-meta").textContent = plants.length ? `${plants.length}주` : "";
  $("plants").innerHTML = plants.map((p) => `<div class="sd-plant">
      <div class="sd-plant-name"><i style="background:${PLANTER_COLOR[p.planter] || C.ink3}"></i>${esc(p.name)}</div>
      <div class="sd-chips"><span class="sd-chip soft">${esc(p.stage || "-")}</span><span class="sd-chip ${p.status === "양호" ? "" : "warn"}">${esc(p.status || "-")}</span></div>
      <div class="sd-plant-meta">${p.totalHarvestG ? `수확 ${p.totalHarvestG}g · ${p.totalHarvestN}개` : "수확 전"} · 기록 ${p.logCount || 0}건</div>
    </div>`).join("") || `<div class="sd-empty">노션 「개체 관리」에 개체를 등록하면 여기 나와요.</div>`;

  // 최근 기록
  const recent = [...records].reverse().slice(0, 8);
  const pestEvents = records.filter((r) => (r.pests || []).some((p) => p !== "없음"));
  $("recent-meta").textContent = pestEvents.length ? `병해충 ${pestEvents.length}건` : "";
  show("recent-empty", recent.length === 0);
  $("recent").innerHTML = recent.map((r) => {
    const summary = (r.title || "").split("—").slice(1).join("—").trim();
    const env = [
      r.temp !== null && r.temp !== undefined && `${r.temp}℃`, r.hum !== null && r.hum !== undefined && `${r.hum}%`,
      r.water !== null && r.water !== undefined && `${r.water} ml`, r.hg !== null && r.hg !== undefined && `${r.hg} g`,
      r.brix !== null && r.brix !== undefined && `${r.brix} Brix`, r.photos ? `📷 ${r.photos}` : null,
    ].filter(Boolean).join(" · ");
    const pests = (r.pests || []).filter((p) => p !== "없음");
    const planters = r.planters || [];
    return `<li class="sd-item"><span class="sd-date">${short(r.date)}</span><div>
      ${summary ? `<div class="sd-item-title">${esc(summary)}</div>` : ""}
      <div class="sd-chips">${(r.types || []).map((t) => `<span class="sd-chip${t === "수확" || t === "방제" ? " warn" : ""}">${esc(t)}</span>`).join("")}
        ${planters.length > 0 && planters.length < 4 ? `<span class="sd-chip plant">${esc(planters.join(" "))}</span>` : ""}
        ${pests.map((p) => `<span class="sd-chip warn">${esc(p)}</span>`).join("")}</div>
      <div class="sd-item-env">${env || "환경 수치는 없어요"}</div>
    </div></li>`;
  }).join("");

  $("foot").textContent = `기록은 노션에, 구경은 여기서 🍓 · 노션 「재배 기록」에서 매시간 자동 동기화${data.generatedAt ? ` · 마지막 ${kst(data.generatedAt, true)}` : ""}`;
}

async function init() {
  try {
    const res = await fetch(`./data.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`data.json ${res.status}`);
    state.data = await res.json();
  } catch (e) {
    $("error").textContent = `data.json을 읽지 못했어요 (${e.message}). 깃허브 Actions에서 "Sync Notion" 워크플로가 한 번 성공했는지 확인해주세요.`;
    show("error", true);
    state.data = { records: [], plants: [], startDate: "2026-09-05" };
  }
  render();
}

if (typeof document !== "undefined") init();
if (typeof module !== "undefined") module.exports = { aggregate, totalsOf, planterStats, tempStatus, humStatus, moodOf, rangeBounds, berrySVG, RANGES };
