# TODO Backlog

`x`가 숫자 앞에 붙은 항목은 완료된 작업이다.

## 1. 성능/구조 안정화
- `x1). /daily, /my-pokemon, /teams의 초기 payload 추가 축소`
- `x2). daily / collection / team-builder가 첫 로드에서 broad catalog 데이터를 넘기지 않도록 route별 payload 재구성`
- `x3). 캐싱 전략 재검토`
- `x3-2). 다음 시작점으로는 lightweight verification flow 정리가 가장 자연스럽습니다.`
- `x4). 주요 페이지/API 성능 재측정 체계화`
- `x5). daily/team 마이그레이션 이후 smoke verification 정리`

이유: 지금 문서상 가장 명확한 실제 문제는 전송 payload 크기와 운영 안정성입니다.

## 2. 사용자 체감 큰 UI 수정
- `x6). /my-pokemon 갤러리 중앙 정렬 + 반응형 배치 개선`
- `x7). /daily 메인 포켓몬 배경/연출 개선`
- `x8). 팀빌더 포켓몬 검색 선택 추가`
- `x8-1) 팀 단위 포맷/세대 추가`
- `x8-1-1) npm run db:migrate`
- `x8-1-2) /teams 저장/불러오기 스모크 체크`
- `x8-1-3) 포맷에 default 추가`
- `x8-2) 세대별 허용 기믹만 노출`
- `x8-2-1) default에서는 기믹 UI 비노출`
- `x8-2-2) gen6~gen9에서만 해당 세대 허용 기믹 노출`
- `x8-3) 포켓몬별 가능 기믹만 노출`
- `x8-3-1) 세대 규칙 + 포켓몬 가능 여부를 함께 판단`
- `x8-3-2) 불가능한 기믹은 숨기거나 비활성화`
- `x8-4) 기믹별 최소 UI 부착`
- `x8-4-1) 메가: 최소 토글`
- `x8-4-2) Z기술: 최소 토글`
- `x8-4-3) 다이맥스: 최소 토글`
- `x8-4-4) 테라스탈: 타입 선택`
- `x8-5) 팀빌더 옵션 목록을 세대별로 필터`
- `x9). 성격 선택 시 상승/하락 스탯 표시`
- `x10). 노력치 510 cap 초과 방지 + 초과 피드백 강화`

이유: 사용자 체감이 크고, 범위가 비교적 작고, MVP 범위 안에서 바로 가치가 납니다.

## 3. 명확한 버그 수정
- `x11). 포켓몬 디테일 페이지 성비 한글 깨짐 수정`
- `x12). 포켓몬 디테일 페이지 방어상성 배수 한글 깨짐 수정`

이유: 수정 자체는 작을 가능성이 높지만, 영향 범위가 좁아서 보통 별도 빠른 작업으로 처리하면 됩니다. 다만 전체 제품 임팩트는 위 성능/핵심 UX보다 약간 낮습니다.

## 4. 팀빌더 사용성 개선
- `x13). 팀빌더 종족값/개체값/노력치 영역 정렬 개선`
- `x14). 팀빌더 성격/아이템/특성 영역 정렬 개선`
- `x15). 내 팀 보기를 팀빌더 네비게이션 하위로 이동`
- `x16). 팀 생성 액션 문구 개선`
- `x17). 팀빌더 레벨 설정 가능하게 (레벨 변경 시 실전 능력치 재계산)`
- `x18). 팀빌더 모드 선택 추가 (스토리 / 자유 / 대전 싱글 / 대전 더블)`
- `x18-1). 대전 모드에서 종 중복 경고를 저장 차단 규칙으로 올리기`
- `x18-3). 모드별 기본 레벨/설명 프리셋 확장`

이유: 전부 UX 개선이지만, 핵심 기능 부재를 막는 수준은 아니라서 2단계 다음이 적절합니다.

## 5. 탐색성 확장 후보
- `x19). 특성 드롭다운 도입`
- `x20). 아이템 검색 및 드롭다운 도입`
- `x20-2). 대전 모드 아이템 중복 경고를 아이템 id 비교 기반 저장 차단 검증으로 확장 (현재는 텍스트 기준 경고만 유지)`
- `x21). 배우기 가능한 기술 드롭다운 가능 여부 검토`
- `x21-1). 팀빌더 기술 selector 스모크 체크 (route/API/save flow 확인)`
- `x21-2). 포맷별 기술 후보 1차 점검 및 조정 (필터 확인 + 영문 fallback 기술명 최소 보정)`
- `x21-2-1). 기술 후보 한글 fallback 품질 추가 보정 필요 여부 점검 (잔여 영어명은 low-priority shadow/후기세대 기술 위주라 현 단계 추가 보정 보류)`
- `x21-3). 폼별 learnset 예외 검토 (현재 모델은 nationalDexNumber 기반, 로토무 폼 전용기 누락 확인)`
- `x21-3-1). form-specific learnset이 중요한 포켓몬만 우선 보정할지 검토 (현재 1순위는 로토무 폼, 나머지는 보류)`
- `x21-3-2). 로토무 폼 전용기만 최소 override로 보정할지 결정 (현 단계에서는 보류: 일반 폼 선택 상태가 없음)`
- `x21-3-3). 일반 폼 선택 UX 없이 처리 가능한 form-specific move 예외 전략이 있는지 검토 (현 모델 기준 범용 전략 없음)`
- `x21-3-4). 필요 시 메가 외 일반 폼 선택/저장 모델을 팀빌더에 도입할지 검토 (최소 설계안 정리 완료: formKey + DB + move query + 제한된 1차 지원 대상)`
- `x21-3-5). formKey 기반 일반 폼 선택/저장 모델을 실제로 도입할지 제품 범위 결정 (전면 도입 대신 1차 제한 도입 방향으로 정리)`
- `x21-3-6). formKey 기반 일반 폼 선택/저장 모델 1차 구현 작업 분해`
- `x21-3-6-1). team member에 formKey 추가 타입/DB/migration 설계`
- `x21-3-6-2). 일반 폼 선택 UI 1차 지원 대상 확정`
- `x21-3-6-3). move query를 formKey 대응으로 확장하는 최소 범위 정리`
- `x21-3-6-4). 1차 일반 폼 지원은 로토무 appliance 폼(히트/워시/프로스트/스핀/커트)으로 한정`
- `x21-3-6-5). 1차 제외 일반 폼 후속 확장 backlog 유지`
- `x21-3-6-5-1). 지역 폼 확장 검토 (1차 후보/후순위 범위 정리 완료)`
- `x21-3-6-5-1-1). 지역 폼 1차 구현 대상은 단일 지역 폼 selector로 끝나는 종 위주로 제한 (알로라 라이츄, 알로라 식스테일/나인테일, 히스이 가디/윈디, 팔데아 우파, 히스이 조로아/조로아크)`
- `x21-3-6-5-1-2). move query는 로토무처럼 전면 확장하지 말고, 1차 후보군에서 실제 learnset 차이가 확인된 종만 최소 예외로 추가`
- `x21-3-6-5-1-3). 동일 전국도감 번호에 지역 폼이 2개 이상 붙는 종(나옹 등)은 selector 복잡도 때문에 후순위 유지`
- `x21-3-6-5-1-4). 지역 폼 중에서도 전설/환상 조류(가라르 프리져/썬더/파이어)와 복합 규칙 종(팔데아 켄타로스)은 각 전용 backlog 항목으로 유지`
- `x21-3-6-5-2). 전설/환상 포켓몬 전용 폼 확장 검토 (기라티나/쉐이미/버드렉스 등)`
- `x21-3-6-5-3). 다수 폼/복합 규칙 폼 확장 검토 (켄타로스 팔데아 breed, 지가르데 등)`
- `x21-3-6-5-4). 일반 폼 라벨 한글화 및 selector 카피 보정 필요 대상 정리`
- `x21-4). 기술 selector 실사용 흐름 점검 (현재 route/API/save flow + client sync effect 확인)`
- `x21-4-1). 포켓몬 변경 시 기술 자동 정리 확인 (client sync effect 기준)`
- `x21-4-2). 포맷 변경 시 기술 자동 정리 확인 (client sync effect 기준)`
- `x21-4-3). 같은 슬롯 내 중복 기술 차단 확인`
- `x21-4-4). 저장 성공/실패 메시지 확인`
- `21-4-5). 필요 시 실제 브라우저 클릭 기준 수동 점검 별도 진행`

이유: 기술 selector 기반은 들어갔지만, 지금 다음 우선순위는 실제 브라우저 사용 흐름 기준 점검과 포맷/폼 예외 보정입니다.

`21-3-6-2` 결정 메모:
- 1차 지원 대상은 로토무 appliance 폼만 잡습니다.
- 이유: 현재 backlog와 구현 기록에서 가장 명확하게 확인된 correctness gap이 로토무 폼 전용기 누락이며, `formKey` 도입 직후 `move query` 확장 범위를 가장 작게 유지할 수 있습니다.
- 나머지 일반 폼은 이번 단계에서 제외하지만, 후속 확장 대상으로 backlog에 계속 유지합니다.

`21-3-6-5-1` 결정 메모:
- 지역 폼 후속 확장은 한 번에 알로라/가라르/히스이/팔데아 전체를 여는 방식이 아니라, 단일 selector 옵션만 필요한 종부터 좁게 여는 순서로 갑니다.
- 1차 구현 후보는 `알로라 라이츄`, `알로라 식스테일/나인테일`, `히스이 가디/윈디`, `팔데아 우파`, `히스이 조로아/조로아크`입니다.
- 선정 기준은 `formKey` 하나만으로 식별 가능하고, 같은 종 안에서 지역 selector 분기가 하나뿐이며, 전설/복합 규칙 폼처럼 별도 제품 규칙을 다시 열지 않아도 되는지입니다.
- `21-3-6-5-1-1` 구현 메모:
- 팀빌더 selector와 저장/불러오기 normalization은 위 후보군까지 열었고, 타입/아트워크/특성/스탯 렌더링은 `formKey` 기준으로 반영됩니다.
- `21-3-6-5-1-2` 구현 메모:
- 지역 폼 move query 예외는 `알로라 라이츄 -> 사이코키네시스`, `알로라 식스테일 -> 프리즈드라이`, `알로라 나인테일 -> 오로라베일/문포스`, `히스이 윈디 -> 양날박치기`, `히스이 조로아크 -> Bitter Malice`만 1차 보정합니다.
- `팔데아 우파`, `히스이 가디`, `히스이 조로아`는 현재 로컬 검토 기준 강한 selector correctness gap을 확인하지 못해 이번 예외 대상에서 제외합니다.
- `나옹(알로라/가라르)`처럼 동일 종에 지역 폼이 2개 이상 붙는 케이스는 selector와 저장값 설명 부담이 커서 이번 1차 후보에서 제외합니다.
- `21-3-6-5-1-3` 구현 메모:
- `나옹`은 기존 `formKey` 경로를 그대로 사용해 `알로라`와 `가라르`를 모두 selector에 노출하는 방식으로 최소 범위 지원합니다.
- 별도 same-dex regional-form 모델은 만들지 않고, 저장/불러오기 normalization과 선택 상세 렌더링도 현재 일반 폼 경로를 재사용합니다.
- 현재 단계에서는 `나옹` 전용 move override는 추가하지 않습니다. 실제 learnset correctness gap이 확인된 경우에만 후속으로 좁게 다룹니다.
- `가라르 프리져/썬더/파이어`는 지역 폼이지만 backlog 분류상 전설/환상 전용 폼 확장(`21-3-6-5-2`)에서 다룹니다.
- `팔데아 켄타로스 breed`는 지역 폼이지만 실제로는 다수 폼/복합 규칙 폼이라 `21-3-6-5-3`으로 남깁니다.
- `21-3-6-5-4` 구현 메모:
- 팀빌더 일반 폼 selector는 저장값(`formKey`)을 바꾸지 않고 표시 문자열만 정리합니다.
- 기본 옵션은 `기본 폼`으로 통일하고, 지역 폼은 `알로라 폼`, `가라르 폼`, `히스이 폼`, `팔데아 폼`처럼 한국어 selector 라벨로 노출합니다.
- 로토무 appliance 폼은 `히트로토무`, `워시로토무`, `프로스트로토무`, `스핀로토무`, `커트로토무`처럼 종명까지 포함한 한국어 라벨로 보정합니다.
- selector 보조 카피에는 현재 지원 대상이 로토무 appliance 폼과 일부 지역 폼에 한정된다는 점과, `가라르 프리져/썬더/파이어`·`팔데아 켄타로스` 같은 복합 후보는 별도 backlog로 유지한다고 표시합니다.
- 추가적인 전설/복합 폼 후보(`버드렉스 rider`, `지가르데`, `랜드로스/토네로스/볼트로스`, `후파`, `마기아나 특수 폼`)는 `docs/future-form-expansion.md`로 별도 정리해 두었으니, 향후 실제 검토/구현 때 해당 문서를 참고해 주세요.

## 6. 세션/데이터 모델 강화
- 현재 상태 요약:
- `x22` 완료: 익명 세션 경계는 이제 서버 관리 `httpOnly` 쿠키 기준으로 정리됨
- `x23` 완료: 향후 ownership은 `user_id` 중심으로 전환하되, legacy anonymous 데이터 migration은 비범위로 정의됨
- 다음 시작점은 `24`: migration 적용/서버 재시작/route API smoke check 가이드를 더 명확히 정리하는 작업
- `x22). 브라우저 생성 익명 세션을 더 강한 서버 관리 세션으로 교체`
- `x22-1). 현재 anonymous-session 흐름과 localStorage/sessionId 의존 경로 재확인`
- `x22-2). 서버가 익명 세션을 발급/재사용하는 최소 세션 경계 설계`
- `x22-3). /api/daily/state와 /api/teams/state를 서버 세션 우선 읽기로 전환`
- `x22-4). 클라이언트에서 sessionId 직접 생성/전달하는 경로 제거`
- `x22-5). 기존 localStorage 기반 세션과의 1차 하위 호환 범위 결정 및 정리`
- `x22-6). /daily, /my-pokemon, /teams, /my-teams 세션 전환 smoke check`
- `x22-7). session-guide / architecture / verification-guide에 새 세션 흐름 반영`
- `x23). anonymous-session에서 향후 user_id 기반 ownership으로 이동할 경로 정리`
- `x23-1). 현재 anonymous-session ownership이 붙어 있는 테이블/API 범위 고정`
- `x23-2). 목표 ownership 모델을 user_id 중심으로 정의`
- `x23-3). 로그인 이후 새 데이터만 user_id로 저장하는 단순 전환 방향 정리`
- `x23-4). 운영 중인 앱이 아니라는 전제에서 legacy anonymous 데이터 병합/보존을 비범위로 명시`
- `x23-5). 향후 user_id 도입 시 필요한 DB 컬럼/제약 방향만 초안으로 정리`
- `x23-6). database-plan / architecture에 ownership 전환 원칙 반영`
- `x24). migration 적용/서버 재시작 체크 보강`
- `x24-1). migration 이후 실제 실패 유형을 daily/team/session 기준으로 분류`
- `x24-2). 변경 종류별 필수 명령 순서와 재시작 필요 조건 고정`
- `x24-3). DB schema 변경 / seed 변경 / state API 변경 / catalog 경로 변경별 최소 검증 세트 정의`
- `x24-4). /daily /my-pokemon /teams /my-teams 와 state API의 최소 smoke-check 세트 재정리`
- `x24-5). verification-guide를 쿠키 기반 세션 기준으로 재검토하고 남은 오래된 문구 제거`
- `x24-6). Windows .next/trace 이슈와 dev/start 재시작 조건을 더 명확히 정리`
- `x24-7). failure triage 체크리스트 보강`
- `x24-8). 필요 시 반복 명령 예시나 helper script 후보까지 문서화`

이유: 기능 개발 기준 다음 큰 묶음은 세션/ownership 기반 작업이고, 그 다음이 운영 체크 보강입니다.

## 7. 장기 계획
- `x25). Authentication`
- `x25-1). 현재 anonymous-session 경계와 향후 auth session 공존 규칙 정의`
- `x25-2). auth provider / session strategy / 최소 사용자 모델 결정`
- `x25-3). users / auth_accounts / sessions 등 최소 auth schema 초안 정리`
- `x25-4). 인증 후 어떤 쓰기부터 user_id 기준으로 전환할지 범위 확정`
- `x25-5). 로그인/로그아웃 및 세션 확인용 최소 서버 경계(route or helper) 도입`
- `x25-6). 최소 인증 UI 진입점 추가 (로그인/로그아웃/세션 상태 표시)`
- `x25-7). 인증 성공 후 사용자 세션이 서버에서 읽히는지 smoke check`
- `x25-8). docs/session-guide / architecture / current-product / database-plan 반영`

`25` 방향 메모:
- 처음 단계는 복잡한 멀티 provider보다 최소 auth + 서버 세션 방식이 더 적합합니다.
- 현재 persisted state는 `kxoxxy-auth-session` 기반 authenticated session으로만 읽고 씁니다.
- 운영 중인 앱이 아니므로 legacy anonymous 데이터 merge는 기본 범위에 넣지 않습니다.
- authenticated write 우선순위는 `favorites -> daily/my-pokemon -> teams` 순서를 기본으로 잡습니다.
- 현재 단계의 로그인은 Google provider-backed flow 기준입니다.
- `x26). 서버 기반 사용자 영속화 확장`
- `x26-1). authenticated request에서 user_id를 읽는 공용 ownership resolver 추가`
- `x26-2). favorites를 첫 user_id write/read 대상으로 전환`
- `x26-3). daily / my-pokemon state를 user_id 대응으로 확장`
- `x26-4). teams / my-teams state를 user_id 대응으로 확장`
- `x26-5). anonymous fallback과 authenticated write 우선순위 검증`
- `x26-6). 관련 migration / docs / smoke check 정리`
- `x27). Favorites`
- `x27-1). 즐겨찾기 DB 스키마 설계 및 마이그레이션 (favorite_pokemon 테이블)`
- `x27-2). 즐겨찾기 상태 관리를 위한 서버 repository 로직 추가 (toggle/get)`
- `x27-3). 익명 세션 쿠키 기반의 즐겨찾기 상태 API 구현 (/api/favorites/state)`
- `x27-4). 포켓몬 상세 페이지([slug])에 즐겨찾기 토글 버튼 추가 및 연동`
- `x27-5). 포켓몬 목록(메인 도감) UI에 즐겨찾기 표시 및 토글 버튼 추가`
- `x27-6). 즐겨찾기 전용 모아보기 페이지 구현 (/favorites)`
- `x27-7). 헤더 네비게이션에 즐겨찾기 메뉴 추가`
- `x27-8). 즐겨찾기 기능 후속 안정화`
- `x27-8-1). 잘못 생성된 favorites migration을 incremental repository migration으로 교체`
- `x27-8-2). 쿠키 기반 favorites API/runtime smoke check 복구 및 재검증`
- `x27-8-3). /favorites의 daily-state 결합 유지 여부 판단 및 필요 시 최소 분리`
- `x27-8-4). favorites 후속 안정화 결과를 docs/task log에 최종 반영`
- `x29). 계정 기반 ownership 전환`
- `x29-1). 개발용 auth session과 실제 계정 기반 auth session의 차이/교체 범위 고정`
- `x29-2). real provider-backed auth의 최소 목표 경계 정의 (sign-in / sign-out / current session)`
- `x29-3). 현재 development-only auth route와 header auth panel을 실제 auth 흐름으로 교체할 최소 설계 정리`
- `x29-4). authenticated session 발급/검증/만료 정책을 실제 계정 기준으로 정리`
- `x29-5). current user helper와 ownership resolver가 실제 auth provider/session 경계를 읽도록 전환`
- `x29-6). favorites / daily / teams가 development-only auth 없이도 같은 user_id ownership을 유지하는지 smoke check`
- `x29-7). docs/session-guide / architecture / current-product / database-plan 반영`
- `x29-8). persistence 기능을 로그인 필수 범위로 전환할 제품/런타임 경계 고정`
- `x29-9). favorites read/write를 auth-required로 전환`
- `x29-10). daily / my-pokemon state read/write를 auth-required로 전환`
- `x29-11). teams / my-teams state read/write를 auth-required로 전환`
- `x29-12). anonymous persistence fallback 제거 범위 정리 및 smoke check`

`29` 설계 메모:
- 현재 `resolveAuthenticatedUserSession()`와 ownership resolver는 유지하고, 세션 발급 주체만 development-only route에서 real provider-backed auth 경계로 교체하는 방향이 기본입니다.
- `/api/auth/session`은 current session read 경계로 유지하고, 실제 sign-in / sign-out은 별도 route 또는 provider handler로 분리하는 쪽이 더 자연스럽습니다.
- header auth panel은 삭제보다 교체가 맞습니다. 즉 현재 UI 위치와 세션 상태 표시는 유지하되, `개발용 로그인` 버튼만 실제 sign-in entry로 바꾸는 방향을 우선합니다.
- 첫 real auth 단계는 복잡한 멀티 provider보다 하나의 최소 provider + durable authenticated session 경계만 있으면 충분합니다.
- 현재 구현 상태:
  - `GET /api/auth/session`은 current-session read로 유지
  - `GET /api/auth/sign-in`은 Google OAuth redirect를 시작
  - `GET /api/auth/callback/google`은 state/code를 검증하고 local `users` / `auth_accounts` / `sessions`에 연결
  - `POST /api/auth/sign-out`은 local auth session을 정리
  - 다음 제품 방향은 persistence 기능을 anonymous fallback과 병행하지 않고 로그인 필수로 좁히는 쪽입니다.
  - 즉 browse-only route(`/`, `/pokedex`, `/pokemon/[slug]`)는 계속 열어두되, favorites / daily / my-pokemon / teams / my-teams의 persisted state는 authenticated `user_id` 경계만 사용하도록 정리하는 방향입니다.
  - `29-8` 기준 정책은 아래처럼 고정합니다:
    - 비로그인 사용자는 browse-only route만 정상 사용
    - persisted state API(`/api/favorites/state`, `/api/daily/state`, `/api/teams/state`)는 unauthenticated request에 더 이상 anonymous owner를 발급하지 않음
    - unauthenticated request는 auth-required 응답을 돌리고, 클라이언트는 저장 UI 대신 로그인 CTA를 표시
    - 기존 anonymous persistence와 legacy local-storage/session handoff 제거는 `29-9` ~ `29-12`에서 순차 수행
- `x28). 하이브리드 이후 추가 DB 통합`
- `x28-1). 현재 hybrid catalog/data pipeline에서 runtime이 아직 snapshot 전제를 두는 지점 재확인`
- `x28-2). pokedex / item / move import pipeline 중 DB가 이미 source of truth인 부분과 아직 snapshot-first인 부분 분리`
- `x28-3). runtime route에서 더 이상 필요 없는 snapshot-era fallback/helper 후보 정리`
- `x28-4). catalog import/seed workflow를 현재 DB-first runtime 관점으로 재정리`
- `x28-5). item / move / form 관련 후속 기능이 DB catalog만으로 충분한지 검토`
- `x28-6). 필요 시 DB catalog 테이블/인덱스 보강 후보 정리`
- `x28-7). hybrid 설명 문서(project-overview / architecture / current-product / session-guide) 현재형으로 재정리`

`28` 방향 메모:
- 이 묶음은 auth나 user persistence가 아니라 catalog/data pipeline 정리 작업입니다.
- 지금 runtime은 이미 list/detail/daily/team catalog read에서 PostgreSQL 의존이 크므로, `28`의 핵심은 snapshot 생성 자체를 지우는 것이 아니라 runtime source-of-truth와 import pipeline 책임을 더 명확히 나누는 것입니다.
- `28-3` 기준으로는 local file snapshot runtime helper만 정리 후보이고, `getLatestSnapshotRecord()` / `getLatestMoveSnapshotRecord()`처럼 DB 안에서 최신 imported lineage를 고르는 helper는 아직 active runtime dependency로 남깁니다.
- `28-5` 기준으로는 현재 MVP 범위의 item selector, move selector, saved `formKey`, and bounded form-specific move overrides는 existing DB catalog(`item_catalog`, `move_catalog`, `pokemon_move_catalog`, `pokemon_catalog`)로 계속 감당 가능합니다.
- 대신 broader multi-form learnset normalization이나 wider form-specific move legality는 아직 current DB catalog만으로는 충분하지 않고, 그쪽은 `30` 또는 별도 follow-up schema work로 남깁니다.
- `28-6` 기준으로는 immediate index addition이 필요한 명확한 병목은 아직 없고, 후속 후보만 정리합니다:
  - larger Pokedex search scale이면 `pokemon_catalog(name_ko)` text-search/trigram 계열 검토
  - heavier filtered list usage가 생기면 `pokemon_catalog(snapshot_id, generation_id, national_dex_number)` 계열 composite 검토
  - broader move legality/form work가 커지면 `pokemon_move_catalog(snapshot_id, national_dex_number, move_slug or move_id)` 계열 access-pattern 재검토
- 우선순위는 broad normalization보다 현재 hybrid 책임 경계를 문서와 코드에서 맞추는 쪽입니다.
- 추천 순서는 `28-1 -> 28-2 -> 28-3 -> 28-4 -> 28-5 -> 28-6 -> 28-7` 입니다.
- `x30). 더 깊은 catalog 정규화 재검토`
- `x30-1). 현재 catalog payload 중심 테이블(`pokemon_catalog`, `item_catalog`, `move_catalog`, `pokemon_move_catalog`)에서 정규화 압력이 큰 지점 재분류`
- `x30-2). 포켓몬 detail/list payload에서 lookup column과 full payload가 중복되는 필드를 정리 후보로 분리`
- `x30-3). item / move catalog에서 slug/name/type/category 계층을 별도 reference 테이블로 분리할 실익 검토`
- `x30-4). move learnset를 national-dex 단위에서 form-aware 구조로 넓힐 필요 범위 재평가`
- `x30-5). saved formKey / move legality / wider form family를 함께 다룰 장기 schema 방향 초안 정리`
- `x30-6). current query path가 정규화 이후에도 유지되어야 할 최소 read-model 요구사항 정리`
- `x30-7). normalization을 하더라도 import pipeline / runtime read-model / client contract를 어떻게 분리할지 원칙 정리`
- `x30-8). 실제 normalization migration으로 들어가기 전 비범위와 선행조건 명시`

`30` 방향 메모:
- 이 묶음은 즉시 구현이 아니라 long-term schema review 작업입니다.
- 현재 MVP/runtime은 existing payload-heavy catalog tables로 충분하므로, `30`은 broad rewrite가 아니라 pressure point를 문서로 정리하는 단계부터 시작합니다.
- `30-1` 기준 핵심 pressure point는 세 곳입니다:
  - `pokemon_catalog` / `item_catalog` / `move_catalog`가 lookup column과 full JSON payload를 함께 들고 있는 중복 구조
  - `pokemon_move_catalog`가 move/version/method metadata를 다시 들고 있는 denormalized learnset 구조
  - form-specific legality는 saved `formKey`와 query-time override에 남아 있고 catalog schema 안에는 아직 fully modeled되지 않은 구조
- `30-2` 기준으로는 특히 아래 중복 필드가 정리 후보입니다:
  - `pokemon_catalog`: `slug`, `name_ko`, `generation_id`, `generation_label`, `primary_type`, `secondary_type` vs `payload.slug / payload.name / payload.generation / payload.types`
  - `item_catalog`: `slug`, `name_ko`, `category_*`, `pocket_*` vs `payload.slug / payload.name / payload.category / payload.pocket`
  - `move_catalog`: `slug`, `name_ko`, `generation_*`, `type_name`, `damage_class_*`, `target_*` vs `payload.slug / payload.name / payload.generation / payload.type / payload.damageClass / payload.target`
- `30-3` 기준 판단은 아래처럼 고정합니다:
  - item `category` / `pocket`, move `damageClass` / `target` / `type`를 지금 즉시 reference table로 분리할 실익은 크지 않음
  - 현재 사용 패턴이 mostly read-only label projection이라 join depth만 늘고 체감 이득은 작음
  - 더 강한 실익이 생기는 시점은 shared metadata reuse, admin editing, analytics, or multi-locale reference reuse가 실제 요구될 때
- `30-4` 기준 판단은 아래처럼 고정합니다:
  - 현재 bounded scope에서는 national-dex-level `pokemon_move_catalog` + query-time `formKey` override로 계속 버틸 수 있음
  - broader form-aware learnset schema가 실제로 필요한 trigger는 wide multi-form legality, more ambiguous families, and larger saved-form coverage가 함께 열릴 때
  - 즉 immediate follow-up은 full form-normalized learnset migration이 아니라 trigger condition 문서화입니다
- `30-5` 장기 방향 초안은 아래처럼 둡니다:
  - saved team member의 `formKey`는 장기적으로 form identity의 일부가 되고
  - learnset legality도 national dex만이 아니라 그 form identity 축에 연결되며
  - broader form family는 eventually 별도 form metadata/read-model에서 풀고, current `pokemon_catalog.payload.forms` 단일 의존은 줄이는 방향
- `30-6` 기준으로는 정규화가 오더라도 아래 read-model shape는 유지 대상입니다:
  - list/detail route가 바로 소비하는 `PokemonSummary` 또는 그 축약 projection
  - collection / my-pokemon / team-builder가 쓰는 reduced Pokemon catalog entry
  - searchable item option entry
  - searchable move option entry
  - team-builder form/mega/gimmick availability projection
- `30-7` 원칙은 아래처럼 고정합니다:
  - import pipeline은 upstream snapshot -> DB storage 변환 책임
  - runtime read-model은 normalized storage를 현재 route/API projection으로 재구성하는 서버 책임
  - client contract는 `features/pokedex/types.ts` 기준 payload contract를 유지하는 책임
  - 따라서 normalization은 import/storage/read-model 레이어에서 흡수하고, client는 가능한 한 마지막에만 영향받게 함
- `30-8` 기준 비범위와 선행조건은 아래처럼 고정합니다:
  - 비범위: immediate broad rewrite, client payload contract 변경, full form-aware learnset migration, reference-table wholesale split
  - 선행조건: supported form scope 결정, required legality strictness 결정, target read-model contract 고정, import script backfill 계획, migration 순서와 rollback 전략 정의
- 특히 move learnset / wider form support / reference table 분리는 서로 연결돼 있으므로 따로 보지 않고 같은 normalization 검토 축으로 다룹니다.
- 추천 순서는 `30-1 -> 30-2 -> 30-3 -> 30-4 -> 30-5 -> 30-6 -> 30-7 -> 30-8` 입니다.
- `x31). 마이 페이지 / 계정 허브`
- `x31-1). 현재 로그인 사용자 프로필 카드 (이름 / 이메일 / provider) 노출`
- `x31-2). 내 활동 요약 (즐겨찾기 수 / 포획 수 / 저장 팀 수) 집계`
- `x31-3). 마이 페이지에서 favorites / my-pokemon / my-teams로 이동하는 계정 허브 구성`
- `x31-4). 로그인 필요 기능과 계정 상태를 한곳에서 설명하는 안내 섹션 정리`
- `x31-5). 현재 독립 top-level인 favorites 메뉴를 마이 페이지 또는 계정 허브 하위로 재배치할지 결정`
- `x31-6). 마이 페이지/계정 허브 도입 시 favorites 진입 동선을 현재 독립 메뉴에서 새 계정 정보구조로 이동`
- `x32). 계정 기반 즐겨찾기 UX 확장`
- `x32-1). 마이 페이지 또는 별도 favorites 화면에서 정렬/필터/검색 추가`
- `x32-2). 목록 / 상세 / favorites 화면 사이의 즐겨찾기 상태 반영 UX 정리`
- `x32-3). 즐겨찾기 비어 있음 상태를 로그인 사용자 기준 copy로 재정리`
- `33). 계정 기반 컬렉션 UX 확장`
- `x33-1). my-pokemon에 로그인 사용자 기준 통계/요약 추가`
- `x33-2). my-pokemon 1차 관리 controls 추가 (포획 시각 정렬 + 반짝 여부 필터 + 타입 필터 + 이름 검색)`
- `33-2-1). my-pokemon 세대 필터는 richer catalog payload 또는 별도 projection이 필요할 때 재검토`
- `33-2-2). 포획 시각 외 추가 정렬기준(반짝 우선, 타입 그룹 등) 확장 여부는 실제 사용성 기준으로 재검토`
- `x33-3). daily와 my-pokemon 사이의 계정 기준 진행 상태 설명 강화`
- `x34). 계정 기반 팀 관리 UX 확장`
- `x34-1). my-teams에 최근 수정일 / 포맷 / 모드 기준 정렬 추가`
- `x34-2). 팀 복제 / 이름 변경 / 빠른 편집 진입 같은 계정 기반 관리 작업 검토`
- `x34-3). 팀이 많아졌을 때를 대비한 검색/필터 UX 검토`
- `35). 계정 설정 및 운영성 후속`
- `35-1). 로그아웃 후 UX와 로그인 유도 copy 정리`
- `35-2). 향후 계정 삭제 또는 사용자 데이터 초기화 정책 초안 정리`
- `35-3). 로그인 실패 / provider callback 실패 / 세션 만료 시 에러 UX 정리`
- `35-4). 마이 페이지 및 계정 기능에 대한 최소 smoke-check 시나리오 문서화`
- `36). 인증 방식 확장 (추후)`
- `36-1). Google 외 추가 OAuth provider 확장 여부 정리`
- `36-2). Kakao login 추가를 위한 provider schema / callback / account-link 설계`
- `36-3). header / login CTA / provider 선택 UX를 다중 provider 대응으로 확장`
- `36-4). 동일 이메일 또는 provider account 충돌 시 계정 연결 정책 정리`
- `36-5). Google + Kakao 다중 provider smoke-check 시나리오 문서화`
- `37). 자체 로그인 검토 (추후 / 별도 큰 범위)`
- `37-1). 자체 로그인 필요성 재평가 (외부 provider만으로 충분한지 먼저 판단)`
- `37-2). email/password 도입 시 필요한 schema, hash, reset, verification 범위 정리`
- `37-3). 자체 로그인 보안 요구사항 (비밀번호 정책 / 재설정 / 계정 복구) 초안 정리`
- `37-4). 외부 provider 계정과 자체 로그인 계정의 연결 정책 정리`
- `37-5). 자체 로그인은 provider 확장보다 뒤에 두는 원칙 유지`

`31` 이후 추후 작업 메모:
- Google 로그인 경계가 생기면서 persisted state가 계정 중심으로 정리될 수 있으므로, 이후 사용자 기능은 "저장된 계정 데이터의 탐색과 관리" 관점으로 확장하는 게 자연스럽습니다.
- 우선순위는 보통 `31` 마이 페이지 허브 -> `32` favorites UX -> `33` collection UX -> `34` team management -> `35` settings/운영성 순서가 적절합니다.
- 이 묶음은 `29`의 auth-required persistence 전환이 끝난 뒤 본격 착수하는 것이 안전합니다.
- 현재 `favorites`는 계정 기능 성격이 커져서 임시로 독립 top-level 메뉴에 두지만, `31` 작업이 시작되면 마이 페이지/계정 허브 하위로 이동시키는 것이 더 자연스러운 방향입니다.
- 인증 확장 우선순위는 `Google 안정화 -> Kakao 같은 추가 provider -> 필요 시 자체 로그인 검토`가 더 자연스럽습니다.
- 자체 로그인은 provider 추가보다 훨씬 큰 보안/운영 범위를 여므로, 별도 큰 작업으로 분리해 다루는 편이 안전합니다.

이유:
- 다음 큰 실작업은 이미 들어간 `user_id` persistence를 실제 계정 기반 auth 경계에 연결하는 `29`가 더 자연스럽습니다.
- `28`과 `30`은 여전히 범위가 크고, 현재 제품 단계에서는 `29` 이후가 더 적절합니다.
