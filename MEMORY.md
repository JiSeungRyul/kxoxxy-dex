# MEMORY.md — KxoxxyDex 프로젝트 장기 기억

세션을 넘어 유지해야 할 핵심 컨텍스트를 기록한다.
Claude Code가 작업 중 발견한 패턴이나 결정을 여기에 추가한다.

---

## 핵심 결정 이력

| 결정 | 내용 | 시점 |
|------|------|------|
| 하이브리드 런타임 | 런타임 읽기 = DB, 생성/import = 스냅샷 파이프라인 유지 | 초기 설계 |
| Google OAuth 전환 | production에서 dev fallback 완전 차단 (503) | 2026-04 |
| anonymous → user_id | anonymous session 완전 제거, user_id 단일 소유자 | 2026-03 |
| 미들웨어 없는 auth gate | middleware.ts 대신 서버 컴포넌트에서 쿠키 직접 체크 | 2026-04 |
| soft delete 정책 | 즉시 삭제 없음, 30일 grace period → ops 수동 purge | 2026-04 |
| 소프트 런치 완료 | kxoxxy-dex.com 라이브, 체크리스트 A~G 전부 완료 | 2026-04-24 |

---

## 알려진 함정

- **Windows `.next/trace` 락**: DB 관련 변경 후 dev server를 반드시 재시작해야 함
- **`repository.ts` 레거시 헬퍼**: 구 스냅샷 파일 읽기 헬퍼가 잔존 — 런타임은 DB-backed이므로 참조 금지
- **`npm run db:seed:moves`**: PokeAPI를 직접 호출함 — 인터넷 연결 필요, 시간이 걸림
- **production auth**: `AUTH_PROVIDER`, `AUTH_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 5개 env 모두 필요
- **`anonymous_session_id`**: `29-12` 이후 완전 제거됨 — 관련 코드 부활 금지

---

## 사용자 작업 패턴

- **한국어 우선**: UI 카피는 반드시 한국어, 영어 fallback 사용 금지
- **최소 변경**: 넓은 리팩터보다 태스크에 필요한 파일만 수정
- **docs 먼저**: `docs/session-guide.md` → 태스크 관련 docs → 구현 순서
- **코드 > 문서**: 충돌 시 항상 코드를 우선 신뢰
- **pre-commit 필수**: 구현 완료 → `docs/` 업데이트 → 커밋 순서 엄수
- **DB 가용성 가정 금지**: 환경 확인 없이 DB가 켜져 있다고 가정하지 않음

---

## 운영 메모

- **서버**: Hetzner CAX11 Helsinki / Ubuntu / PM2 + Caddy + PostgreSQL 16
- **도메인**: kxoxxy-dex.com (Cloudflare DNS)
- **백업 스크립트**: `/usr/local/bin/kxoxxy-dex-backup.sh`
- **백업 cron**: 매일 UTC 18:00 (KST 03:00), 7일 보관
- **백업 경로**: `/var/backups/kxoxxy-dex/`
- **복구 테스트**: 완료 (2026-04-23, `kxoxxy_dex_restore_test` DB)
- **app 재시작**: `pm2 restart kxoxxy-dex`
- **에러 로그**: `/root/.pm2/logs/kxoxxy-dex-error.log`
