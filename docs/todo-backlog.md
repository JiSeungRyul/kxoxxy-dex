# TODO Backlog

이 문서는 작업을 빠르게 훑어보기 위한 정리본이다.

- 상세 배경, 이유, 설계 메모는 `docs/todo-backlog-memo.md`에 정리한다.
- 완료 작업 기록은 `docs/implemented-tasks.md`를 우선하고, 이 문서에는 미완료 항목만 유지한다.
- 현재 런타임 truth는 `docs/current-product.md`, `docs/architecture.md`, `docs/session-guide.md`를 우선한다.
- 항목이 완료되면 이 문서에서 제거하고 같은 작업에서 `docs/implemented-tasks.md`를 갱신한다.
- 현재 `40`의 남은 일은 문서 정리가 아니라 실제 운영 환경에서 soft-launch proof를 수행하는 것이다.

## 바로 할 일

### 40. Soft Launch 전 필수
- [ ] `40). 소규모 공개 전 필요한 최소 서비스화 준비`

### 43. Public Launch 전 권장
- [ ] `43). 외부 커뮤니티 공개 전 필요한 운영/품질 보강`
- [ ] `43-1). team-builder-page / pokedex-page / repository / utils의 큰 파일 분해 우선순위와 단계별 분리 계획 정리`
- [ ] `43-2). auth session / persisted state / repository 핵심 경계의 자동 테스트 범위를 public launch 기준으로 확장`
- [ ] `43-3). 앱 재시작 / DB restore / deploy rollback 절차를 1인 운영 기준으로 정리`
- [ ] `43-4). production 로그 확인과 failure triage 흐름을 실서비스 기준으로 점검`

## 추후 할 일

### 38. 랜덤 팀 후속
- 현재 남은 후속만 유지한다. 완료 이력은 `docs/implemented-tasks.md`를 본다.
- [ ] `38-13). 각 슬롯별 타입 지정 기반 랜덤 배치 옵션 추가 검토`

### 36. 인증 방식 확장
- [ ] `36). 인증 방식 확장 (추후)`
- [ ] `36-1). Google 외 추가 OAuth provider 확장 여부 정리`
- [ ] `36-2). Kakao login 추가를 위한 provider schema / callback / account-link 설계`
- [ ] `36-3). header / login CTA / provider 선택 UX를 다중 provider 대응으로 확장`
- [ ] `36-4). 동일 이메일 또는 provider account 충돌 시 계정 연결 정책 정리`
- [ ] `36-5). Google + Kakao 다중 provider smoke-check 시나리오 문서화`

### 37. 자체 로그인 검토
- [ ] `37). 자체 로그인 검토 (추후 / 별도 큰 범위)`
- [ ] `37-1). 자체 로그인 필요성 재평가 (외부 provider만으로 충분한지 먼저 판단)`
- [ ] `37-2). email/password 도입 시 필요한 schema, hash, reset, verification 범위 정리`
- [ ] `37-3). 자체 로그인 보안 요구사항 (비밀번호 정책 / 재설정 / 계정 복구) 초안 정리`
- [ ] `37-4). 외부 provider 계정과 자체 로그인 계정의 연결 정책 정리`
- [ ] `37-5). 자체 로그인은 provider 확장보다 뒤에 두는 원칙 유지`

### 41. 팀 공유/분석 확장
- [ ] `41). 저장 팀의 재방문성과 공유성을 높이는 후속 기능 검토`
- [ ] `41-1). 저장 팀 공유 링크 또는 코드 기반 공유 방식 검토`
- [ ] `41-2). 타입 상성 / 약점 분포 / 역할군 기준 팀 분석 UI 검토`
- [ ] `41-3). 저장 팀 비교 또는 버전 기록 같은 관리 기능 필요성 검토`

### 42. 한국어 팬 툴 차별화와 수익화 검토
- [ ] `42). 한국어 팬 툴로서의 차별화와 수익화 방향 정리`
- [ ] `42-1). 한국어 입문자용 팀 해설 / 추천 팀 템플릿 / 내 컬렉션 기반 추천 후보 정리`
- [ ] `42-2). 세대별 / 타입별 / 반짝 기준 컬렉션 통계 확장 검토`
- [ ] `42-3). 프리미엄 팀 슬롯 / 고급 팀 분석 / 컬렉션 대시보드 같은 유료 기능 후보 정리`
- [ ] `42-4). 광고보다 계정 기반 프리미엄 기능이 더 적합한지 제품 관점에서 재검토`
