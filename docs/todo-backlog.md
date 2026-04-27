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

### 2. 즐겨찾기 접근성 개선 (구 47)
- [ ] `2-1). 즐겨찾기를 /my 페이지 외 헤더/네비게이션 등 다른 경로에서도 접근 가능하도록 개선`

### 3. 닉네임 설정 플로우 (구 44)
- [ ] `3-1). 최초 로그인 시 닉네임 설정 플로우 추가 (현재는 Google 계정 이름이 그대로 표시됨)`
- [ ] `3-2). 닉네임 변경 UI를 /my 페이지에 추가`

### 4. 모바일 UI 대응 (구 46)
- [ ] `4-1). 모바일 접속 시 레이아웃/UI 깨짐 전체 수정 (수정 대상 리스트 전달 후 착수)`

---

## P2 — 런칭 전 필수 보강

### 5. Soft Launch 필수 준비 (구 40)
- [ ] `5-1). 소규모 공개 전 필요한 최소 서비스화 준비`

### 6. Public Launch 전 운영 품질 보강 (구 43)
- [ ] `6-1). team-builder-page / pokedex-page / repository / utils의 큰 파일 분해 우선순위와 단계별 분리 계획 정리`
- [ ] `6-2). auth session / persisted state / repository 핵심 경계의 자동 테스트 범위를 public launch 기준으로 확장`
- [ ] `6-3). 앱 재시작 / DB restore / deploy rollback 절차를 1인 운영 기준으로 정리`
- [ ] `6-4). production 로그 확인과 failure triage 흐름을 실서비스 기준으로 점검`

---

## P3 — 기능 확장 후보

### 7. 랜덤 팀 슬롯별 타입 지정 옵션 (구 38-13)
- [ ] `7-1). 각 슬롯별 타입 지정 기반 랜덤 배치 옵션 추가 검토`

### 8. 팀 공유 / 분석 확장 (구 41)
- [ ] `8-1). 저장 팀 공유 링크 또는 코드 기반 공유 방식 검토`
- [ ] `8-2). 타입 상성 / 약점 분포 / 역할군 기준 팀 분석 UI 검토`
- [ ] `8-3). 저장 팀 비교 또는 버전 기록 같은 관리 기능 필요성 검토`

### 9. 인증 방식 확장 — Kakao 등 (구 36)
- [ ] `9-1). Google 외 추가 OAuth provider 확장 여부 정리`
- [ ] `9-2). Kakao login 추가를 위한 provider schema / callback / account-link 설계`
- [ ] `9-3). header / login CTA / provider 선택 UX를 다중 provider 대응으로 확장`
- [ ] `9-4). 동일 이메일 또는 provider account 충돌 시 계정 연결 정책 정리`
- [ ] `9-5). Google + Kakao 다중 provider smoke-check 시나리오 문서화`

---

## P4 — 장기 검토

### 10. 자체 로그인 (구 37) — provider 확장 이후
- [ ] `10-1). 자체 로그인 필요성 재평가 (외부 provider만으로 충분한지 먼저 판단)`
- [ ] `10-2). email/password 도입 시 필요한 schema, hash, reset, verification 범위 정리`
- [ ] `10-3). 자체 로그인 보안 요구사항 (비밀번호 정책 / 재설정 / 계정 복구) 초안 정리`
- [ ] `10-4). 외부 provider 계정과 자체 로그인 계정의 연결 정책 정리`
- [ ] `10-5). 자체 로그인은 provider 확장보다 뒤에 두는 원칙 유지`

### 11. 한국어 팬 툴 차별화 / 수익화 (구 42)
- [ ] `11-1). 한국어 입문자용 팀 해설 / 추천 팀 템플릿 / 내 컬렉션 기반 추천 후보 정리`
- [ ] `11-2). 세대별 / 타입별 / 반짝 기준 컬렉션 통계 확장 검토`
- [ ] `11-3). 프리미엄 팀 슬롯 / 고급 팀 분석 / 컬렉션 대시보드 같은 유료 기능 후보 정리`
- [ ] `11-4). 광고보다 계정 기반 프리미엄 기능이 더 적합한지 제품 관점에서 재검토`
