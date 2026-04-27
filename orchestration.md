# orchestration.md — KxoxxyDex 에이전트 조율

멀티 에이전트 또는 복잡한 세션에서 에이전트들이 충돌 없이 안전한 경계 내에서 동작하도록 규칙을 정의한다.

---

## 에이전트 역할 정의

| 역할 | 담당 | 허용 도구 |
|------|------|----------|
| 탐색 에이전트 | 코드베이스 이해, 파일/패턴 검색 | Read, Bash(readonly), grep |
| 계획 에이전트 | 구현 전략 설계, 변경 범위 분석 | Read, Bash(readonly), 플랜 파일 작성 |
| 구현 에이전트 | 실제 코드 수정, 파일 생성 | 모든 도구 |
| 검증 에이전트 | typecheck / build / 스모크 체크 | Bash(빌드·테스트 명령) |

---

## 권한 체계

### 항상 허용 (확인 불필요)
- 파일 읽기 (Read)
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git status` / `git diff` / `git log`
- grep, find

### 확인 후 허용
- 파일 수정 또는 신규 생성
- `npm run db:migrate`
- `npm run db:seed:*`
- `docs/` 업데이트

### 반드시 사용자 확인 필요
- `git add` / `git commit` / `git push`
- `npm run sync:*` (upstream 데이터 덮어씀)
- 서버 재시작 또는 프로덕션 변경
- 파일 삭제 또는 DB 행 삭제

---

## 안전 경계 (절대 금지)

- `git push --force` — 원격 이력 파괴
- `DROP TABLE` 또는 직접 DB 조작 — 마이그레이션만 사용
- `.env` 또는 시크릿 파일 수정
- `anonymous_session_id` 관련 코드 부활 — `29-12`에서 완전 제거됨
- MVP 범위 변경 (명시적 지시 없이)
- `--no-verify` 또는 git hook 우회

---

## 에스컬레이션 흐름

1. **태스크 범위 불명확** → `docs/session-guide.md` 참조 → 사용자에게 확인
2. **DB 변경 필요** → `docs/database-plan.md` 읽기 → 마이그레이션 계획 제시 후 승인 대기
3. **배포 / 운영 변경** → `docs/deployment-guide.md` 읽기 → 단계별 사용자 확인
4. **예상치 못한 파일/변경 감지** → 작업 중단 → 현재 상태 보고 후 지시 대기

---

## 충돌 방지 규칙

- 세션 시작 시 `git status` 확인 — 사용자 미저장 변경 있으면 먼저 보고
- 파일 수정 전 항상 최신 내용 읽기 (Edit 전 Read 필수)
- 멀티 에이전트 병렬 실행 시 같은 파일을 동시에 수정하지 않는다
- 에이전트 간 handoff 시 수정된 파일 목록을 명시적으로 전달
- partial 변경 상태로 세션을 끝내지 않는다 — 반드시 완료 또는 rollback 후 종료
