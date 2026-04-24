# 소프트 런치 체크리스트

## 목적
- 현재 런칭 준비 기준을 실제 실행 가능한 체크리스트로 정리한다.
- 목표는 정식 대규모 공개가 아니라, 소규모 공개가 가능한 안정적인 소프트 런치 상태에 도달하는 것이다.

## 목표
- 지인, 포트폴리오 방문자, 작은 커뮤니티에 보여줄 수 있는 수준의 소프트 런치 준비도를 만든다.
- 새 기능 추가보다 운영 안정성을 우선한다.
- 이 문서는 다음 문서 작성이 아니라 실제 운영 환경 증명을 순서대로 수행하기 위한 실행 체크리스트다.

## 런칭 가능 기준
- 실제 서버와 실제 도메인에서 앱이 열린다.
- 실제 도메인에서 Google 로그인이 동작한다.
- 로그인 후 보호 라우트가 열리고 저장 데이터가 유지된다.
- 운영 서버에서 DB bootstrap 절차를 반복할 수 있다.
- 백업 작업이 존재하고 실제 백업 파일을 만든다.
- 최소 1개의 복구 경로가 문서화되어 있고 restore 테스트 1회가 끝났다.
- 배포 후 스모크 체크가 존재하고 최소 1회 통과했으며 app restart 후 세션/저장 상태 재확인까지 끝났다.
- 장애 대응 시 기본적인 운영 로그를 확인할 수 있다.

## 1. 런칭 가능
이 섹션이 끝나면 소프트 런치 가능으로 본다.

### A. 운영 서버 준비
- [x] Linux VPS 1대 준비 (Hetzner CAX11 / Helsinki)
- [x] Node.js LTS 설치 (v24)
- [x] PostgreSQL 16 설치
- [x] Caddy 또는 Nginx 설치 및 설정
- [x] 운영 도메인을 서버에 연결 (kxoxxy-dex.com)
- [x] HTTPS 적용 (Caddy 자동 인증서)
- [x] 운영 환경변수 설정
- [x] 아래 필수 env가 실제 운영 값으로 들어가 있는지 확인
  - [x] `DATABASE_URL`
  - [x] `AUTH_PROVIDER=google`
  - [x] `AUTH_URL`
  - [x] `AUTH_SECRET`
  - [x] `GOOGLE_CLIENT_ID`
  - [x] `GOOGLE_CLIENT_SECRET`
- [x] 서버에서 `DATABASE_URL`이 유효한지 확인
- [x] `npm ci` 실행
- [x] `npm run build` 실행
- [x] `npm run start` 또는 선택한 프로세스 매니저로 앱 기동 (PM2)

### B. 운영 DB 초기화
- [x] `npm run db:migrate` 실행
- [x] `npm run db:seed:pokedex` 실행
- [x] `npm run db:seed:items` 실행
- [x] `npm run db:seed:moves` 실행
- [x] `/pokedex` 접속 후 카탈로그 데이터 로딩 확인
- [x] `/pokemon/pikachu` 같은 상세 라우트 1개 확인
- [x] `/teams`, `/daily` 접속 후 DB 오류 없이 기본 화면이 열리는지 확인

### C. 실도메인 로그인 검증
- [x] 운영 도메인 기준 Google OAuth redirect URI 설정
- [x] 실제 도메인에서 `GET /api/auth/sign-in` 실행
- [x] Google callback 흐름 정상 완료
- [x] 로그인 후 `GET /api/auth/session` 응답 확인
- [x] 로그인 후 `/favorites`, `/daily`, `/teams`, `/my` 진입 확인
- [x] 로그아웃 확인
- [x] 로그인 실패 또는 세션 만료 시 설명 없는 `500` 반복으로 무너지지 않는지 확인

### D. 배포 후 스모크 체크
- [x] "배포 후 10분 내 확인 순서"를 아래 순서로 고정
  - [x] `/`
  - [x] `/pokedex`
  - [x] `/pokemon/pikachu`
  - [x] `/api/auth/session`
  - [x] 실제 도메인에서 `GET /api/auth/sign-in`
  - [x] 로그인 후 `/favorites`
  - [x] 로그인 후 `/daily`
  - [x] 로그인 후 `/teams`
  - [x] 로그인 후 `/my`
  - [x] 저장 동작 1회 후 새로고침 유지 확인
- [x] 실제 재배포 1회 수행 (callback 버그 수정 배포)
- [x] 재배포 후 스모크 체크 통과

### E. DB 백업과 복구 proof
- [x] `pg_dump` 기반 백업 스크립트 또는 명령 순서 작성 (/usr/local/bin/kxoxxy-dex-backup.sh)
- [x] 하루 1회 백업 실행 예약 (postgres crontab, 매일 03:00)
- [x] 백업 파일 저장 경로 고정 (/var/backups/kxoxxy-dex/)
- [x] 최소 7일 보관 규칙 정의 (스크립트 내 find -mtime +7 -delete)
- [x] 백업 파일이 실제 생성되는지 확인 (kxoxxy_dex_2026-04-23.sql.gz, 15MB)
- [x] 복구 명령 또는 복구 절차 문서화
- [x] 안전한 환경에서 복구 테스트 1회 수행 (kxoxxy_dex_restore_test DB 복구 후 삭제)

### F. 로그와 장애 대응
- [x] Next.js 앱 로그 확인 위치 고정 (pm2 logs / /root/.pm2/logs/kxoxxy-dex-error.log)
- [x] reverse proxy 로그 확인 위치 고정 (journalctl -u caddy)
- [x] PostgreSQL 로그 확인 위치 고정 (/var/log/postgresql/postgresql-16-main.log)
- [x] 아래 상황의 1차 확인 절차 문서화:
  - [x] 로그인 실패
  - [x] DB 연결 실패
  - [x] 반복적인 `500` 응답
- [x] first triage 순서를 아래와 같이 고정
  - [x] `GET /api/auth/session`
  - [x] 실패한 route 또는 persisted API
  - [x] `npm run db:migrate` / 필요한 `db:seed:*`
  - [x] app log
  - [x] reverse proxy log
  - [x] PostgreSQL log
- [x] 앱 재시작 명령 고정 (pm2 restart kxoxxy-dex)
- [x] 배포 실패 시 롤백 또는 임시 복구 순서 문서화

### G. 최소 품질 가드레일
- [x] `npm run typecheck` 실행
- [x] `npm run build` 실행
- [x] auth/session 경계에 대한 최소 자동 검증 1개 이상 추가 또는 확인 (tests/auth-session.test.mjs)
- [x] persisted-state API에 대한 최소 자동 검증 1개 이상 추가 또는 확인 (tests/favorites-route, daily-route, teams-route)
- [x] 핵심 repository read path에 대한 최소 자동 검증 1개 이상 추가 또는 확인 (tests/repository.test.mjs)

## 2. 런칭 직후 바로 할 것
- [x] 운영 로그를 다시 점검하고 first triage 순서대로 즉시 대응 가능한지 확인
- [x] 재배포 또는 앱 재시작 1회를 실제로 더 반복해 세션/저장 상태가 계속 유지되는지 확인
- [ ] 백업 파일 생성이 하루 주기로 실제 누적되는지 확인 (cron 첫 실행: 내일 03:00)
- [x] restore proof에서 사용한 절차를 운영 메모나 실행 기록으로 남겨 다음 복구 때 바로 재사용 가능하게 정리 (docs/deployment-guide.md)

## 3. 런칭 후 개선
- [ ] `docs/todo-backlog.md`의 `43-1` 큰 파일 분해 계획 정리
- [ ] `docs/todo-backlog.md`의 `43-2` 자동 테스트 범위 확장
- [ ] `docs/todo-backlog.md`의 `43-3` 앱 재시작 / DB restore / deploy rollback 절차 강화
- [ ] `docs/todo-backlog.md`의 `43-4` production 로그와 failure triage 흐름 점검

## 소프트 런치 종료 조건
- [x] 실제 도메인에서 앱이 열린다.
- [x] 실제 도메인에서 Google 로그인이 동작한다.
- [x] 로그인 사용자가 최소 1개 이상의 저장 기능을 저장 후 다시 불러올 수 있다.
- [x] 재배포가 1회 이상 성공했다.
- [x] 백업 작업이 존재하고 실제 파일을 생성한다.
- [x] 복구 경로가 문서화되어 있고 1회 테스트됐다.
- [x] app restart 후 `GET /api/auth/session`과 보호 라우트 1개가 다시 정상 동작한다.
- [x] 장애 대응 중 운영 로그를 확인할 수 있다.
- [x] 배포 후 스모크 체크가 최소 1회 통과했다.

## 이 체크리스트 동안 범위 확장 금지
- [ ] 추가 OAuth provider 구현 금지
- [ ] 자체 이메일/비밀번호 로그인 구현 금지
- [ ] 프리미엄 결제 구현 금지
- [ ] 런칭 안정성보다 고급 팀 분석 구현을 우선하지 않기
- [ ] 배포/로그인/백업 작업보다 랜덤 팀 후속 확장을 우선하지 않기
