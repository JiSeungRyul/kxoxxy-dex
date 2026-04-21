# TODO Backlog

이 문서는 작업을 빠르게 훑어보기 위한 정리본이다.

- 상세 배경, 이유, 설계 메모는 `docs/todo-backlog-memo.md`에 정리한다.
- 완료 작업 기록은 `docs/implemented-tasks.md`를 우선하고, 이 문서에는 미완료 항목만 유지한다.
- 현재 런타임 truth는 `docs/current-product.md`, `docs/architecture.md`, `docs/session-guide.md`를 우선한다.
- 항목이 완료되면 이 문서에서 제거하고 같은 작업에서 `docs/implemented-tasks.md`를 갱신한다.

## 바로 할 일

### 38. 랜덤 팀 후속
- 현재 남은 후속만 유지한다. 완료 이력은 `docs/implemented-tasks.md`를 본다.
- [ ] `38-15). 각 슬롯별 랜덤 포켓몬 선택 기능 추가`

## 추후 할 일

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
