# TODO Backlog

이 문서는 작업을 빠르게 훑어보기 위한 정리본이다.

- 상세 배경, 이유, 설계 메모는 `docs/todo-backlog-memo.md`에 정리한다.
- 완료 작업 기록은 `docs/implemented-tasks.md`를 우선하고, 이 문서에는 미완료 항목만 유지한다.
- 현재 런타임 truth는 `docs/current-product.md`, `docs/architecture.md`, `docs/session-guide.md`를 우선한다.
- 항목이 완료되면 이 문서에서 제거하고 같은 작업에서 `docs/implemented-tasks.md`를 갱신한다.
- 구 번호(괄호 표기)는 `docs/todo-backlog-memo.md` 및 커밋 메시지와의 연결을 위해 유지한다.

---

## P1 — 지금 할 수 있는 것

### 1. CI/CD 자동 배포 파이프라인 (구 50)
- [ ] `1-1). GitHub Actions → 서버 pull/build/restart 자동화 파이프라인 도입`

---

## P2 — 런칭 전 필수 보강

### 3. Soft Launch 필수 준비 (구 40)
- [ ] `3-1). 소규모 공개 전 필요한 최소 서비스화 준비`

### 4. Public Launch 전 운영 품질 보강 (구 43)
- [ ] `4-1). team-builder-page / pokedex-page / repository / utils의 큰 파일 분해 우선순위와 단계별 분리 계획 정리`
- [ ] `4-2). auth session / persisted state / repository 핵심 경계의 자동 테스트 범위를 public launch 기준으로 확장`
- [ ] `4-3). 앱 재시작 / DB restore / deploy rollback 절차를 1인 운영 기준으로 정리`
- [ ] `4-4). production 로그 확인과 failure triage 흐름을 실서비스 기준으로 점검`

---

## P3 — 기능 확장 후보

### 5. 랜덤 팀 슬롯별 타입 지정 옵션 (구 38-13)
- [ ] `5-1). 각 슬롯별 타입 지정 기반 랜덤 배치 옵션 추가 검토`

### 6. 팀 공유 / 분석 확장 (구 41)
- [ ] `6-1). 저장 팀 공유 링크 또는 코드 기반 공유 방식 검토`
- [ ] `6-2). 타입 상성 / 약점 분포 / 역할군 기준 팀 분석 UI 검토`
- [ ] `6-3). 저장 팀 비교 또는 버전 기록 같은 관리 기능 필요성 검토`

### 7. 인증 방식 확장 — Kakao 등 (구 36)
- [ ] `7-1). Google 외 추가 OAuth provider 확장 여부 정리`
- [ ] `7-2). Kakao login 추가를 위한 provider schema / callback / account-link 설계`
- [ ] `7-3). header / login CTA / provider 선택 UX를 다중 provider 대응으로 확장`
- [ ] `7-4). 동일 이메일 또는 provider account 충돌 시 계정 연결 정책 정리`
- [ ] `7-5). Google + Kakao 다중 provider smoke-check 시나리오 문서화`

---

## P4 — 장기 검토

### 8. 자체 로그인 (구 37) — provider 확장 이후
- [ ] `8-1). 자체 로그인 필요성 재평가 (외부 provider만으로 충분한지 먼저 판단)`
- [ ] `8-2). email/password 도입 시 필요한 schema, hash, reset, verification 범위 정리`
- [ ] `8-3). 자체 로그인 보안 요구사항 (비밀번호 정책 / 재설정 / 계정 복구) 초안 정리`
- [ ] `8-4). 외부 provider 계정과 자체 로그인 계정의 연결 정책 정리`
- [ ] `8-5). 자체 로그인은 provider 확장보다 뒤에 두는 원칙 유지`

### 9. 한국어 팬 툴 차별화 / 수익화 (구 42)
- [ ] `9-1). 한국어 입문자용 팀 해설 / 추천 팀 템플릿 / 내 컬렉션 기반 추천 후보 정리`
- [ ] `9-2). 세대별 / 타입별 / 반짝 기준 컬렉션 통계 확장 검토`
- [ ] `9-3). 프리미엄 팀 슬롯 / 고급 팀 분석 / 컬렉션 대시보드 같은 유료 기능 후보 정리`
- [ ] `9-4). 광고보다 계정 기반 프리미엄 기능이 더 적합한지 제품 관점에서 재검토`
