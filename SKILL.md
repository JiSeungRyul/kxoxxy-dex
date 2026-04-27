# SKILL.md — KxoxxyDex 스킬 모듈

이 파일은 필요할 때만 컨텍스트에 로드한다.
슬래시 명령(`/skill-name`) 또는 해당 조건이 충족될 때 참조한다.

---

## /sync-seed — 데이터 파이프라인 스킬

**트리거**: 카탈로그 데이터를 업스트림에서 갱신하거나 로컬 DB를 처음부터 부트스트랩할 때

### 전체 로컬 부트스트랩

```bash
docker compose up -d
npm run db:migrate
npm run db:seed:pokedex
npm run db:seed:items
npm run db:seed:moves   # PokeAPI 직접 호출 — 인터넷 연결 필요
npm run dev
```

또는 헬퍼 스크립트 사용:
```bash
sh scripts/setup-local-db.sh          # 전체 (compose 포함)
sh scripts/setup-local-db.sh --skip-compose  # migrate + seed만
```

### 업스트림 갱신 (의도적 refresh만)

```bash
npm run sync:pokedex   # data/pokedex.json 덮어씀
npm run sync:items     # data/item-catalog.json 덮어씀
npm run sync:moves     # data/move-catalog.json 덮어씀
```

> **경고**: `sync:*`는 체크인된 스냅샷을 덮어쓴다. 업스트림 데이터 갱신이 명시적으로 요청된 경우에만 실행.

---

## /db-migrate — DB 마이그레이션 스킬

**트리거**: `db/schema/` 변경이 필요한 경우

### 순서

1. `db/schema/pokemon-catalog.ts` 수정
2. `npm run db:generate` — Drizzle 마이그레이션 파일 생성
3. `npm run db:migrate` — 마이그레이션 적용
4. Windows: dev server 재시작 (`.next/trace` 락 주의)
5. `npm run typecheck` + `npm run build` — 검증
6. `docs/database-plan.md` 업데이트
7. 데이터 흐름 변경 시 `docs/architecture.md` 업데이트

> **경고**: 마이그레이션 전 `docs/database-plan.md`를 먼저 읽어라. 현재 스키마를 반드시 확인한 후 진행.

---

## /deploy — 프로덕션 배포 스킬

**트리거**: kxoxxy-dex.com 배포 시

### 배포 순서

```bash
git pull
npm ci
npm run build
npm run db:migrate   # 스키마 변경이 있을 때만
pm2 restart kxoxxy-dex
```

### 배포 후 스모크 체크 (10분 내 완료)

1. `/` → 포켓몬 목록 렌더링 확인
2. `/pokedex` → 필터/페이지네이션 동작 확인
3. `/pokemon/pikachu` → 상세 페이지 확인
4. `GET /api/auth/session` → 응답 확인
5. Google 로그인 (`GET /api/auth/sign-in`) → callback 흐름 완료
6. 로그인 후 `/favorites` → `/daily` → `/teams` → `/my` 진입 확인
7. 저장 동작 1회 후 새로고침 → 상태 유지 확인

### 서버 정보

- 서버: Hetzner CAX11 Helsinki / PM2 + Caddy + PostgreSQL 16
- app 재시작: `pm2 restart kxoxxy-dex`
- 에러 로그: `/root/.pm2/logs/kxoxxy-dex-error.log`
- proxy 로그: `journalctl -u caddy`
- DB 로그: `/var/log/postgresql/postgresql-16-main.log`

---

## /verify — 라우트 스모크 체크 스킬

**트리거**: 데이터 흐름 또는 auth 경계 변경 후 검증

### Public 라우트

```
GET /               → 포켓몬 목록 렌더링
GET /pokedex        → 필터/페이지네이션 동작
GET /pokemon/pikachu → 상세 페이지 렌더링
GET /teams/random   → 랜덤 팀 화면
```

### Auth 경계

```
GET /api/auth/session   → { user: null } 또는 { user: {...}, authMode: "google"|"dev" }
GET /api/auth/sign-in   → Google OAuth redirect (production)
```

보호 라우트 비로그인 접근 → `SignInPrompt` 즉시 렌더링 (클라이언트 flash 없음)

### Persisted State

- `/favorites`, `/daily`, `/teams` → 로그인 후 상태 유지 확인
- 저장 후 새로고침 → 데이터 유지

### 실패 triage 순서

1. `GET /api/auth/session`
2. 실패한 route 또는 persisted API
3. `npm run db:migrate` / 필요한 `db:seed:*`
4. app log (`pm2 logs`)
5. reverse proxy log (`journalctl -u caddy`)
6. PostgreSQL log

---

## /new-feature — 새 기능 추가 스킬

**트리거**: 새 기능 구현 요청 시

### 체크리스트

1. `docs/current-product.md` 확인 — MVP 범위 내인지
2. `docs/architecture.md` 확인 — 데이터 흐름 변경 여부
3. 서버 로직 → `features/pokedex/server/` (절대 원칙)
4. 클라이언트 로직 → `features/pokedex/components/` 또는 `features/site/`
5. `app/` 수정 최소화 — 라우팅 + 데이터 페치만
6. 한국어 UI 카피 유지
7. `npm run typecheck` + `npm run build`
8. `docs/` 업데이트 후 커밋 (pre-commit 필수)
