# 🍓 무럭무럭 딸기 일기 — 노션 자동 동기화 대시보드

노션 「재배 기록」·「개체 관리」 DB를 **매시간 자동으로 읽어** 깃허브 페이지에 대시보드를 새로 굽습니다.
기록은 노션에만 하면 되고, 대시보드는 홈 화면 아이콘으로 열면 됩니다.

```
노션 DB ──(매시간, GitHub Actions)──▶ docs/data.json ──▶ GitHub Pages(docs/) ──▶ 홈 화면 아이콘
```

## 설정 (PC에서 15분, 한 번만)

### 1. 노션 연동 토큰 만들기
1. https://www.notion.so/profile/integrations → **새 API 통합** (또는 "새 통합 만들기")
2. 이름 `딸기 대시보드`, 유형 **내부**, 워크스페이스 선택, 권한은 **콘텐츠 읽기**만
3. 저장 후 **내부 통합 시크릿**(`ntn_…`) 복사 — 이 값이 `NOTION_TOKEN`

### 2. 노션 페이지에 통합 연결
1. 노션에서 **「딸기 재배 마스터」** 페이지를 열고 오른쪽 위 `···` → **연결** → `딸기 대시보드` 선택
2. 상위 페이지에 연결하면 그 안의 「개체 관리」·「재배 기록」 DB까지 함께 읽힙니다

### 3. 깃허브 저장소 만들기
1. https://github.com/new → 이름 `strawberry-diary`, **Public** (Pages 무료 조건), Create
2. 이 폴더의 파일을 그대로 업로드 (또는 `git push`). `.github/`, `scripts/`, `docs/` 세 폴더가 다 들어가야 합니다

### 4. 시크릿 등록
Settings → **Secrets and variables → Actions** → **New repository secret**
- Name: `NOTION_TOKEN`
- Secret: 1번에서 복사한 `ntn_…`

### 5. GitHub Pages 켜기
Settings → **Pages** → Build and deployment
- Source: **Deploy from a branch**
- Branch: **main** / 폴더 **/docs** → Save

### 6. 첫 동기화
Actions 탭 → **Sync Notion → Dashboard** → **Run workflow**. 초록 체크가 뜨면 1~2분 뒤
`https://<깃허브아이디>.github.io/strawberry-diary/` 에서 대시보드가 열립니다.

### 7. 홈 화면 아이콘
- 아이폰: 사파리로 열고 공유 → **홈 화면에 추가**
- 안드로이드: 크롬 ⋮ → **홈 화면에 추가** (또는 "앱 설치")

딸기 아이콘의 진짜 앱처럼 열립니다.

## 이후 운영
- 노션에 기록하면 **최대 1시간 안에** 대시보드에 반영됩니다 (더 빨리 보려면 Actions → Run workflow)
- `docs/data.json`이 커밋으로 쌓이므로 데이터 이력이 깃 히스토리에 남습니다
- 60일 넘게 저장소에 커밋이 없으면 깃허브가 예약 실행을 멈출 수 있습니다. 기록이 있으면 data.json이 바뀌어 커밋되니 자연히 유지됩니다

## 파일 구성
| 파일 | 역할 |
| --- | --- |
| `.github/workflows/sync.yml` | 매시간 실행. 노션 읽기 → data.json 변경 시 커밋 |
| `scripts/sync.mjs` | 노션 API 호출·변환 (의존성 없음, Node 20) |
| `docs/index.html`, `docs/app.js` | 대시보드 (Chart.js) |
| `docs/data.json` | 동기화 결과. 처음엔 9/5 초기 저장본이 들어 있음 |
| `docs/manifest.webmanifest`, `icon-*.png` | 홈 화면 앱 아이콘 |

## 노션 DB를 바꿨다면
`scripts/sync.mjs` 상단의 `LOG`·`PLANTS` ID와 속성 이름(한국어 그대로)을 맞춰주세요.
속성 이름이 다르면 그 값만 `null`로 들어오고 나머지는 정상 동작합니다.

## 문제가 생기면
- Actions 로그가 `401` → 토큰 오타 또는 시크릿 이름이 `NOTION_TOKEN`이 아님
- `404 object_not_found` → 2번(노션 페이지에 통합 연결)을 안 했거나 다른 워크스페이스
- 대시보드에 "data.json을 읽지 못했어요" → Pages 설정이 `/docs`가 아니거나 첫 동기화 전
