# AGENTS.md — KxoxxyDex 에이전트 진입점 가이드

## 프로젝트 정체성
KxoxxyDex: 한국어 우선 하이브리드 포켓덱스 (Next.js 15 + React 19 + PostgreSQL 16, kxoxxy-dex.com)

## 첫 번째 규칙
CLAUDE.md를 항상 먼저 읽어라. 이 파일은 지도이지 매뉴얼이 아니다.

---

## 소스 오브 트루스

| 파일 | 역할 |
|------|------|
| `features/pokedex/server/repository.ts` | 런타임 카탈로그 읽기 진입점 |
| `features/pokedex/types.ts` | 스키마 계약 (PokemonSummary 등) |
| `features/pokedex/server/auth-session.ts` | 세션 경계 |
| `data/pokedex.json` | 로컬 스냅샷 (DB import용) |
| `docs/session-guide.md` | 세션 시작 라우팅 |

---

## 라우트 지도

| 경로 | 동작 | 인증 |
|------|------|------|
| `/`, `/pokedex`, `/pokemon/[slug]` | DB 카탈로그 읽기 | public |
| `/favorites`, `/daily`, `/my-pokemon` | user_id 기반 지속 상태 | 필요 |
| `/teams`, `/my-teams` | user_id 기반 지속 상태 | 필요 |
| `/teams/random` | browse-only, 저장 없음 | public |
| `/my` | 계정 허브, 서버사이드 세션 | 선택 |

보호 라우트 auth gate: middleware.ts 없음. 각 서버 컴포넌트에서 직접 쿠키 체크 후 `SignInPrompt` 즉시 렌더링.

---

## 태스크 → 문서 라우팅

| 태스크 유형 | 먼저 읽을 문서 |
|------------|--------------|
| UI / 라우트 범위 변경 | `docs/current-product.md` |
| 데이터 흐름 / 서버-클라이언트 경계 | `docs/architecture.md` |
| DB 스키마 / 마이그레이션 / 시드 | `docs/database-plan.md` |
| 배포 / 운영 환경 | `docs/deployment-guide.md` |
| 라우트 스모크 체크 / 장애 대응 | `docs/verification-guide.md` |
| 완료 이력 확인 | `docs/implemented-tasks.md` |
| 미완 작업 확인 | `docs/todo-backlog.md` |

---

## 절대 원칙

- MVP 범위 변경 금지 (명시적 지시 없이)
- 서버 데이터 접근 → `features/pokedex/server/`만
- 코드 > 문서 (충돌 시 코드 우선)
- DB 가용성 가정 금지
- 한국어 우선 유지
- `app/`은 라우팅 + 데이터 페치만 (thin)

---

## 에이전트 협업 원칙

- **단일 에이전트**: 범위가 명확하고 파일이 알려진 대부분의 태스크
- **멀티 에이전트**: 탐색(코드베이스 이해) + 계획(설계)이 독립적으로 병행 가능할 때
- 멀티 에이전트 작업 시 → `orchestration.md` 참조
- 전문 워크플로 필요 시 → `SKILL.md` 참조
