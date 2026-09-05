// 노션 「재배 기록」·「개체 관리」 → docs/data.json
// Node 20+ (내장 fetch). 의존성 없음. 환경변수 NOTION_TOKEN 필요.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LOG = { ds: "7dab8288-1639-4791-b3e2-b9670fd1fe68", db: "1eeeb659549e40e28383ba5a0462a8c4" };   // 재배 기록
const PLANTS = { ds: "eeb28b2c-d03e-4ec1-9213-82dc27715a75", db: "b545c6b140c143bc8c2e1226b621d0a0" }; // 개체 관리
const START_DATE = "2026-09-05";
const OUT = new URL("../docs/data.json", import.meta.url);

// ── Notion API ──────────────────────────────────────────────────
async function notion(path, body, version, token) {
  const res = await fetch(`https://api.notion.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": version,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${path}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function paginate(path, version, token) {
  const pages = [];
  let cursor;
  do {
    const data = await notion(path, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }, version, token);
    pages.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

// 새 API(데이터 소스)로 먼저 시도, 실패하면 구 API(데이터베이스)로.
async function queryAll({ ds, db }, token) {
  try {
    return await paginate(`/v1/data_sources/${ds}/query`, "2025-09-03", token);
  } catch (e) {
    console.warn(`data_sources 조회 실패(${e.message.slice(0, 80)}) → databases 로 재시도`);
    return await paginate(`/v1/databases/${db}/query`, "2022-06-28", token);
  }
}

// ── 속성 읽기 ───────────────────────────────────────────────────
const P = {
  title: (p) => (p && p.title ? p.title.map((t) => t.plain_text).join("") : ""),
  text: (p) => (p && p.rich_text ? p.rich_text.map((t) => t.plain_text).join("") : ""),
  num: (p) => (p && typeof p.number === "number" ? p.number : null),
  sel: (p) => (p && p.select ? p.select.name : null),
  msel: (p) => (p && p.multi_select ? p.multi_select.map((o) => o.name) : []),
  date: (p) => (p && p.date && p.date.start ? String(p.date.start).slice(0, 10) : null),
  rel: (p) => (p && p.relation ? p.relation.map((r) => r.id) : []),
  files: (p) => (p && p.files ? p.files.length : 0),
  rollup: (p) => (p && p.rollup && p.rollup.type === "number" ? (p.rollup.number ?? 0) : null),
};

// ── 변환 (테스트 가능하도록 분리) ────────────────────────────────
export function transform(logPages, plantPages) {
  const plants = plantPages.map((pg) => {
    const q = pg.properties || {};
    return {
      id: pg.id,
      name: P.title(q["개체"]),
      planter: P.sel(q["화분"]),
      variety: P.sel(q["품종"]),
      planted: P.date(q["식재일"]),
      stage: P.sel(q["생육 단계"]),
      status: P.sel(q["상태"]),
      location: P.text(q["위치"]),
      totalHarvestG: P.rollup(q["총 수확량(g)"]) ?? 0,
      totalHarvestN: P.rollup(q["총 수확 개수"]) ?? 0,
      logCount: P.rollup(q["기록 수"]) ?? 0,
    };
  }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const nameById = Object.fromEntries(plants.map((p) => [p.id, p.name]));

  const records = logPages.map((pg) => {
    const q = pg.properties || {};
    return {
      date: P.date(q["날짜"]),
      title: P.title(q["제목"]),
      types: P.msel(q["유형"]),
      planters: P.msel(q["화분"]),
      plants: P.rel(q["개체"]).map((id) => nameById[id]).filter(Boolean),
      temp: P.num(q["온도(℃)"]),
      hum: P.num(q["습도(%)"]),
      water: P.num(q["급수량(ml)"]),
      fert: P.sel(q["비료"]),
      fertMemo: P.text(q["비료 메모"]),
      leaves: P.num(q["잎 수"]),
      runners: P.num(q["런너 수"]),
      flowers: P.num(q["꽃 수"]),
      fruits: P.num(q["과실 수"]),
      hc: P.num(q["수확 개수"]),
      hg: P.num(q["수확량(g)"]),
      brix: P.num(q["당도(Brix)"]),
      pests: P.msel(q["병해충"]),
      weather: P.sel(q["날씨"]),
      photos: P.files(q["사진"]),
      memo: P.text(q["메모"]),
      created: pg.created_time || null,
    };
  })
    .filter((r) => r.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || "") < (b.created || "") ? -1 : 1));

  return { generatedAt: new Date().toISOString(), startDate: START_DATE, records, plants: plants.map(({ id, ...p }) => p) };
}

// ── 실행 ────────────────────────────────────────────────────────
async function main() {
  const token = process.env.NOTION_TOKEN;
  if (!token) { console.error("NOTION_TOKEN 환경변수가 없습니다. GitHub → Settings → Secrets → Actions 에 등록하세요."); process.exit(1); }
  const [logPages, plantPages] = await Promise.all([queryAll(LOG, token), queryAll(PLANTS, token)]);
  const data = transform(logPages, plantPages);
  writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
  console.log(`기록 ${data.records.length}건, 개체 ${data.plants.length}주 → docs/data.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
