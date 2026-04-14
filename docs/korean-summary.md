# 한국어 요약

## 목적
- `docs/` 디렉터리의 핵심 내용을 한국어로 빠르게 파악하기 위한 요약 문서다.
- 현재 런타임 truth, 문서 우선순위, 작업 시 주의점을 짧게 정리한다.
- 세부 구현 판단은 항상 실제 코드와 원문 문서를 다시 확인해야 한다.

## 프로젝트 한 줄 요약
- `KxoxxyDex`는 Next.js 15 + React 19 + TypeScript 기반의 한국어 우선 포켓몬 도감 앱이며, 현재 런타임 조회는 주로 PostgreSQL 기반이고 데이터 생성/갱신 파이프라인은 스냅샷 파일도 함께 쓰는 하이브리드 구조다.

## 현재 런타임 핵심 truth
- `/`, `/pokedex`, `/pokemon/[slug]`는 PostgreSQL 기반 catalog 조회를 사용한다.
- `/favorites`, `/daily`, `/my-pokemon`, `/teams`, `/my-teams`는 로그인된 사용자 기준 `user_id` 소유 persisted state를 사용한다.
- `/teams/random`은 저장 상태와 분리된 browse-only 경량 기능이다.
- 익명 세션 기반 persistence와 local-storage handoff는 현재 활성 런타임 경로가 아니다.
- 인증은 `GET /api/auth/sign-in`을 기준으로 Google provider mode 또는 development fallback이 공존한다.
- 계정 삭제는 soft delete 기준이며, grace period 안에서는 복구 가능하고 이후 최종 삭제는 운영 작업으로 처리한다.

## 하이브리드 구조 의미
- 현재 하이브리드는 “런타임 페이지가 파일을 읽는다”는 뜻이 아니다.
- 현재 의미는 “런타임 조회는 DB-backed, snapshot 생성과 import는 여전히 파일 기반 파이프라인을 거친다”에 가깝다.
- `data/pokedex.json`, `data/item-catalog.json`, `data/move-catalog.json`은 여전히 import와 sync 워크플로우의 입력 또는 결과물이다.

## 문서 읽기 우선순위
1. `docs/session-guide.md`
2. `docs/project-overview.md`
3. `docs/current-product.md`
4. `docs/architecture.md`
5. 필요 시 `docs/database-plan.md`
6. 검증이 필요하면 `docs/verification-guide.md`
7. 성능 측정이 필요하면 `docs/performance-guide.md`

## 문서별 역할
- `docs/session-guide.md`: 새 작업 세션의 시작점. 현재 truth, 읽기 순서, 주의 파일, bootstrap 흐름을 안내한다.
- `docs/project-overview.md`: 제품의 큰 그림과 장기 방향을 설명한다.
- `docs/current-product.md`: 현재 사용자에게 보이는 기능과 정책을 설명한다.
- `docs/architecture.md`: 라우트별 데이터 흐름, 서버/API 경계, catalog pipeline을 설명한다.
- `docs/database-plan.md`: 로컬 PostgreSQL setup, migration/seed 순서, ownership 정책을 설명한다.
- `docs/verification-guide.md`: DB/세션/보호 라우트 변경 후 최소 smoke check 절차를 설명한다.
- `docs/performance-guide.md`: 주요 페이지/API 성능 측정 절차와 기준값을 설명한다.
- `docs/implemented-tasks.md`: 완료 이력 문서다. 현재 truth가 아니라 historical record로 읽어야 한다.
- `docs/todo-backlog.md`: 계획과 작업 메모 문서다. 현재 런타임 판단 기준으로 직접 쓰면 안 된다.
- `docs/future-form-expansion.md`: 현재 MVP 밖의 form 확장 후보를 정리한 문서다.

## 로컬 DB 기본 작업 순서
1. `docker compose up -d`
2. `npm run db:migrate`
3. `npm run db:seed:pokedex`
4. `npm run db:seed:items`
5. `npm run db:seed:moves`
6. `npm run dev` 또는 `npm run start`

## sync 와 seed 차이
- `sync:*`는 upstream 데이터를 다시 받아 로컬 snapshot 파일을 갱신하는 작업이다.
- `db:seed:*`는 현재 로컬 snapshot 파일을 PostgreSQL에 import하는 작업이다.
- 일반적인 로컬 검증이나 런타임 확인은 `sync:*`보다 `db:migrate` + `db:seed:*`가 기본이다.

## 구조 작업 시 고정 원칙
- `app/`은 얇게 유지하고, 제품 로직은 `features/pokedex/`에 둔다.
- 서버 로직은 `features/pokedex/server/`에 둔다.
- 타입 계약은 `features/pokedex/types.ts`를 기준으로 본다.
- 데이터 흐름 변경 전에는 `docs/architecture.md`와 실제 코드를 함께 확인한다.
- 코드와 문서가 충돌하면 코드를 최종 truth로 본다.

## 검증 시 주의점
- DB 스키마, seed, session 관련 변경 뒤에는 최소한 `npm run typecheck` 또는 관련 smoke check를 수행해야 한다.
- persisted route 변경 시 `/favorites`, `/daily`, `/my-pokemon`, `/teams`, `/my-teams`, `/my`와 관련 API를 함께 확인해야 한다.
- Windows 환경에서는 `.next/trace` 잠금 때문에 dev server 재시작이 필요할 수 있다.

## 읽을 때 특히 조심할 점
- 오래된 작업 기록 문서에는 anonymous-session 기반 설명이 남아 있을 수 있다.
- 현재 활성 정책은 로그인 기반 `user_id` ownership이며, anonymous persistence는 active runtime이 아니다.
- 역사 문서는 배경 이해용이고, 현재 동작 판단은 `session-guide`, `current-product`, `architecture`, 실제 코드 순서로 확인하는 편이 안전하다.
