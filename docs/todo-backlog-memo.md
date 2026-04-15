# 투두백로그 메모

이 문서는 `docs/todo-backlog.md`의 상세 배경, 이유, 설계 메모를 보존한다.

- 현재 실제 남은 작업 목록은 `docs/todo-backlog.md`를 본다.
- 완료 이력은 `docs/implemented-tasks.md`를 본다.
- 현재 런타임 truth는 `docs/current-product.md`, `docs/architecture.md`, `docs/session-guide.md`를 우선한다.

## 1. 성능/구조 안정화

이유: 지금 문서상 가장 명확한 실제 문제는 전송 payload 크기와 운영 안정성입니다.

## 2. 사용자 체감 큰 UI 수정

이유: 사용자 체감이 크고, 범위가 비교적 작고, MVP 범위 안에서 바로 가치가 납니다.

## 3. 명확한 버그 수정

이유: 수정 자체는 작을 가능성이 높지만, 영향 범위가 좁아서 보통 별도 빠른 작업으로 처리하면 됩니다. 다만 전체 제품 임팩트는 위 성능/핵심 UX보다 약간 낮습니다.

## 4. 팀빌더 사용성 개선

이유: 전부 UX 개선이지만, 핵심 기능 부재를 막는 수준은 아니라서 2단계 다음이 적절합니다.

## 5. 탐색성 확장 후보

이유: 기술 selector 기반은 들어갔지만, 지금 다음 우선순위는 실제 브라우저 사용 흐름 기준 점검과 포맷/폼 예외 보정입니다.

`21-3-6-2` 결정 메모:
- 1차 지원 대상은 로토무 appliance 폼만 잡습니다.
- 이유: 현재 backlog와 구현 기록에서 가장 명확하게 확인된 correctness gap이 로토무 폼 전용기 누락이며, `formKey` 도입 직후 `move query` 확장 범위를 가장 작게 유지할 수 있습니다.
- 나머지 일반 폼은 이번 단계에서 제외하지만, 후속 확장 대상으로 backlog에 계속 유지합니다.

`21-3-6-5-1` 결정 메모:
- 지역 폼 후속 확장은 한 번에 알로라/가라르/히스이/팔데아 전체를 여는 방식이 아니라, 단일 selector 옵션만 필요한 종부터 좁게 여는 순서로 갑니다.
- 1차 구현 후보는 `알로라 라이츄`, `알로라 식스테일/나인테일`, `히스이 가디/윈디`, `팔데아 우파`, `히스이 조로아/조로아크`입니다.
- 선정 기준은 `formKey` 하나만으로 식별 가능하고, 같은 종 안에서 지역 selector 분기가 하나뿐이며, 전설/복합 규칙 폼처럼 별도 제품 규칙을 다시 열지 않아도 되는지입니다.

`21-3-6-5-1-1` 구현 메모:
- 팀빌더 selector와 저장/불러오기 normalization은 위 후보군까지 열었고, 타입/아트워크/특성/스탯 렌더링은 `formKey` 기준으로 반영됩니다.

`21-3-6-5-1-2` 구현 메모:
- 지역 폼 move query 예외는 `알로라 라이츄 -> 사이코키네시스`, `알로라 식스테일 -> 프리즈드라이`, `알로라 나인테일 -> 오로라베일/문포스`, `히스이 윈디 -> 양날박치기`, `히스이 조로아크 -> Bitter Malice`만 1차 보정합니다.
- `팔데아 우파`, `히스이 가디`, `히스이 조로아`는 현재 로컬 검토 기준 강한 selector correctness gap을 확인하지 못해 이번 예외 대상에서 제외합니다.
- `나옹(알로라/가라르)`처럼 동일 종에 지역 폼이 2개 이상 붙는 케이스는 selector와 저장값 설명 부담이 커서 이번 1차 후보에서 제외합니다.

`21-3-6-5-1-3` 구현 메모:
- `나옹`은 기존 `formKey` 경로를 그대로 사용해 `알로라`와 `가라르`를 모두 selector에 노출하는 방식으로 최소 범위 지원합니다.
- 별도 same-dex regional-form 모델은 만들지 않고, 저장/불러오기 normalization과 선택 상세 렌더링도 현재 일반 폼 경로를 재사용합니다.
- 현재 단계에서는 `나옹` 전용 move override는 추가하지 않습니다. 실제 learnset correctness gap이 확인된 경우에만 후속으로 좁게 다룹니다.
- `가라르 프리져/썬더/파이어`는 지역 폼이지만 backlog 분류상 전설/환상 전용 폼 확장(`21-3-6-5-2`)에서 다룹니다.
- `팔데아 켄타로스 breed`는 지역 폼이지만 실제로는 다수 폼/복합 규칙 폼이라 `21-3-6-5-3`으로 남깁니다.

`21-3-6-5-4` 구현 메모:
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

이유: 기능 개발 기준 다음 큰 묶음은 세션/ownership 기반 작업이고, 그 다음이 운영 체크 보강입니다.

## 7. 장기 계획

`25` 방향 메모:
- 처음 단계는 복잡한 멀티 provider보다 최소 auth + 서버 세션 방식이 더 적합합니다.
- 현재 persisted state는 `kxoxxy-auth-session` 기반 authenticated session으로만 읽고 씁니다.
- 운영 중인 앱이 아니므로 legacy anonymous 데이터 merge는 기본 범위에 넣지 않습니다.
- authenticated write 우선순위는 `favorites -> daily/my-pokemon -> teams` 순서를 기본으로 잡습니다.
- 현재 단계의 로그인은 Google provider-backed flow 기준입니다.

`29` 설계 메모:
이 메모는 당시 설계 결정을 보존하는 historical design note다. 현재 활성 auth/runtime truth는 `docs/current-product.md`, `docs/architecture.md`, `docs/session-guide.md`를 우선한다.
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

## 8. 서비스화 준비 / 차별화 / 수익화 메모

- 현재 점수 상승은 새 기능 추가보다 `테스트`, `큰 파일 분해`, `auth 운영 경계 정리`, `에러/로그/운영 대응`에서 더 크게 나옵니다.
- 그래서 backlog는 서비스 시작 시점 기준으로 아래 순서로 재구성합니다:
  - `40`번대 -> soft launch 전 필수
  - `43`번대 -> public launch 전 권장
  - 공유/분석/수익화 -> launch 이후 확장 후보
- 가장 현실적인 차별화 방향은 아래 세 축입니다:
  - 한국어 우선 팬 툴
  - 도감 / 컬렉션 / 팀빌딩의 연결 경험
  - 초보~중급 유저 친화적인 설명과 추천
- 수익화는 현 단계에서 광고보다 계정 기반 프리미엄 기능이 더 잘 맞습니다.
- 다만 실제 전환율이나 시장성은 운영 데이터 없이 확정할 수 없으므로, 현재 backlog에서는 `검토`와 `후보 정리` 수준으로만 다룹니다.
- 런칭 시점 판단도 같은 기준을 따릅니다:
  - 기능 수보다 로그인/저장/배포/복구가 안정적인지가 먼저
  - soft launch 기준을 넘긴 뒤 public launch를 보는 순서가 더 안전합니다.
- 현재 backlog 재구성 의도:
  - 랜덤 팀 후속이나 확장 기능보다 런칭 필수 항목을 먼저 보이게 한다
  - 외부 공개 전 품질 보강과, 공개 후 차별화 기능을 분리해서 본다
