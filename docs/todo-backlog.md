# TODO Backlog

이 문서는 작업을 빠르게 훑어보기 위한 정리본이다.

- 상세 배경, 이유, 설계 메모는 `docs/todo-backlog-memo.md`에 정리한다.
- 완료 작업의 세부 구현 기록은 `docs/implemented-tasks.md`를 우선한다.
- 현재 런타임 truth는 `docs/current-product.md`, `docs/architecture.md`, `docs/session-guide.md`를 우선한다.

## 바로 할 일

### 38. 랜덤 팀 후속
- [ ] `38-8-1). 첫 진입 시 결과 영역은 카드 그리드 빈칸 placeholder 상태로 두고, 뽑기 전 안내 문구는 별도로 더 자연스럽게 정리`
- [ ] `38-9). 랜덤 팀 뽑기 조건 옵션은 최종진화만 / 특정 세대만 / 전설·환상 제외 / 중복 타입 제한 / 전국도감 중복 종 금지 범위까지 우선 검토`
- [ ] `38-10). 전설 제외 옵션에 환상 제외를 함께 묶어 legendary / mythical exclusion 규칙으로 정리`
- [ ] `38-11). 랜덤 팀 후보군을 기본 종만이 아니라 현재 지원 가능한 일반 폼 전부 포함 기준으로 확장할지 검토`
- [ ] `38-12). 팀 전체에 특정 타입 최소 1마리 포함 옵션 추가 검토`
- [ ] `38-13). 각 슬롯별 타입 지정 기반 랜덤 배치 옵션 추가 검토`
- [ ] `38-14). 준전설 포함, 전설/환상 일부 허용 등 배틀 플랫폼 기준 후보군 모드 추가 검토`

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

## 완료된 작업

### 1. 성능/구조 안정화
- [x] `1). /daily, /my-pokemon, /teams의 초기 payload 추가 축소`
- [x] `2). daily / collection / team-builder가 첫 로드에서 broad catalog 데이터를 넘기지 않도록 route별 payload 재구성`
- [x] `3). 캐싱 전략 재검토`
- [x] `3-2). 다음 시작점으로는 lightweight verification flow 정리가 가장 자연스럽습니다.`
- [x] `4). 주요 페이지/API 성능 재측정 체계화`
- [x] `5). daily/team 마이그레이션 이후 smoke verification 정리`

### 2. 사용자 체감 큰 UI 수정
- [x] `6). /my-pokemon 갤러리 중앙 정렬 + 반응형 배치 개선`
- [x] `7). /daily 메인 포켓몬 배경/연출 개선`
- [x] `8). 팀빌더 포켓몬 검색 선택 추가`
- [x] `8-1). 팀 단위 포맷/세대 추가`
- [x] `8-1-1). npm run db:migrate`
- [x] `8-1-2). /teams 저장/불러오기 스모크 체크`
- [x] `8-1-3). 포맷에 default 추가`
- [x] `8-2). 세대별 허용 기믹만 노출`
- [x] `8-2-1). default에서는 기믹 UI 비노출`
- [x] `8-2-2). gen6~gen9에서만 해당 세대 허용 기믹 노출`
- [x] `8-3). 포켓몬별 가능 기믹만 노출`
- [x] `8-3-1). 세대 규칙 + 포켓몬 가능 여부를 함께 판단`
- [x] `8-3-2). 불가능한 기믹은 숨기거나 비활성화`
- [x] `8-4). 기믹별 최소 UI 부착`
- [x] `8-4-1). 메가: 최소 토글`
- [x] `8-4-2). Z기술: 최소 토글`
- [x] `8-4-3). 다이맥스: 최소 토글`
- [x] `8-4-4). 테라스탈: 타입 선택`
- [x] `8-5). 팀빌더 옵션 목록을 세대별로 필터`
- [x] `9). 성격 선택 시 상승/하락 스탯 표시`
- [x] `10). 노력치 510 cap 초과 방지 + 초과 피드백 강화`

### 3. 명확한 버그 수정
- [x] `11). 포켓몬 디테일 페이지 성비 한글 깨짐 수정`
- [x] `12). 포켓몬 디테일 페이지 방어상성 배수 한글 깨짐 수정`

### 4. 팀빌더 사용성 개선
- [x] `13). 팀빌더 종족값/개체값/노력치 영역 정렬 개선`
- [x] `14). 팀빌더 성격/아이템/특성 영역 정렬 개선`
- [x] `15). 내 팀 보기를 팀빌더 네비게이션 하위로 이동`
- [x] `16). 팀 생성 액션 문구 개선`
- [x] `17). 팀빌더 레벨 설정 가능하게 (레벨 변경 시 실전 능력치 재계산)`
- [x] `18). 팀빌더 모드 선택 추가 (스토리 / 자유 / 대전 싱글 / 대전 더블)`
- [x] `18-1). 대전 모드에서 종 중복 경고를 저장 차단 규칙으로 올리기`
- [x] `18-3). 모드별 기본 레벨/설명 프리셋 확장`
- [x] `38-1). 버튼 한 번으로 6개 엔트리에 랜덤 포켓몬 배치`
- [x] `38-2). 초기 범위는 포켓몬 종만 랜덤 배치하고 아이템 / 특성 / 성격 / 기술 / 능력치 / 테라스탈 등 세부 설정은 제외`
- [x] `38-3). 랜덤 팀 결과는 원형 카드 UI로 노출하고, 각 엔트리에 포켓몬 이미지 / 도감번호 / 이름 / 타입만 표시`
- [x] `38-4). 팀빌딩 네비게이터 아래에 별도 진입점으로 배치하고, 저장 팀 편집 흐름과는 분리된 가벼운 체험 기능으로 유지`
- [x] `38-5). 랜덤 팀 설명 / 버튼 / 결과 영역을 한 덩어리의 일관된 구성으로 재정리하고 상단 설명 블록과 결과 블록의 분리감을 줄일지 검토`
- [x] `38-6). 결과 제목 카피는 "이번 랜덤 팀" 대신 "랜덤 팀"으로 단순화하고, 상단 영어 라벨은 "Result" 대신 "Random Team"으로 통일`
- [x] `38-7). 랜덤 팀 뽑기 실행 중 포켓볼 모션과 짧은 지연을 넣어 "뽑는 중" 상태를 더 시각적으로 보여줄지 검토`
- [x] `38-8). 모션 길이는 고정 3초로 박지 말고 체감 기준으로 1~3초 범위에서 가장 덜 답답한 값으로 조정 검토`

### 5. 탐색성 확장 후보
- [x] `19). 특성 드롭다운 도입`
- [x] `20). 아이템 검색 및 드롭다운 도입`
- [x] `20-2). 대전 모드 아이템 중복 경고를 아이템 id 비교 기반 저장 차단 검증으로 확장 (현재는 텍스트 기준 경고만 유지)`
- [x] `21). 배우기 가능한 기술 드롭다운 가능 여부 검토`
- [x] `21-1). 팀빌더 기술 selector 스모크 체크 (route/API/save flow 확인)`
- [x] `21-2). 포맷별 기술 후보 1차 점검 및 조정 (필터 확인 + 영문 fallback 기술명 최소 보정)`
- [x] `21-2-1). 기술 후보 한글 fallback 품질 추가 보정 필요 여부 점검 (잔여 영어명은 low-priority shadow/후기세대 기술 위주라 현 단계 추가 보정 보류)`
- [x] `21-3). 폼별 learnset 예외 검토 (현재 모델은 nationalDexNumber 기반, 로토무 폼 전용기 누락 확인)`
- [x] `21-3-1). form-specific learnset이 중요한 포켓몬만 우선 보정할지 검토 (현재 1순위는 로토무 폼, 나머지는 보류)`
- [x] `21-3-2). 로토무 폼 전용기만 최소 override로 보정할지 결정 (현 단계에서는 보류: 일반 폼 선택 상태가 없음)`
- [x] `21-3-3). 일반 폼 선택 UX 없이 처리 가능한 form-specific move 예외 전략이 있는지 검토 (현 모델 기준 범용 전략 없음)`
- [x] `21-3-4). 필요 시 메가 외 일반 폼 선택/저장 모델을 팀빌더에 도입할지 검토 (최소 설계안 정리 완료: formKey + DB + move query + 제한된 1차 지원 대상)`
- [x] `21-3-5). formKey 기반 일반 폼 선택/저장 모델을 실제로 도입할지 제품 범위 결정 (전면 도입 대신 1차 제한 도입 방향으로 정리)`
- [x] `21-3-6). formKey 기반 일반 폼 선택/저장 모델 1차 구현 작업 분해`
- [x] `21-3-6-1). team member에 formKey 추가 타입/DB/migration 설계`
- [x] `21-3-6-2). 일반 폼 선택 UI 1차 지원 대상 확정`
- [x] `21-3-6-3). move query를 formKey 대응으로 확장하는 최소 범위 정리`
- [x] `21-3-6-4). 1차 일반 폼 지원은 로토무 appliance 폼(히트/워시/프로스트/스핀/커트)으로 한정`
- [x] `21-3-6-5). 1차 제외 일반 폼 후속 확장 backlog 유지`
- [x] `21-3-6-5-1). 지역 폼 확장 검토 (1차 후보/후순위 범위 정리 완료)`
- [x] `21-3-6-5-1-1). 지역 폼 1차 구현 대상은 단일 지역 폼 selector로 끝나는 종 위주로 제한 (알로라 라이츄, 알로라 식스테일/나인테일, 히스이 가디/윈디, 팔데아 우파, 히스이 조로아/조로아크)`
- [x] `21-3-6-5-1-2). move query는 로토무처럼 전면 확장하지 말고, 1차 후보군에서 실제 learnset 차이가 확인된 종만 최소 예외로 추가`
- [x] `21-3-6-5-1-3). 동일 전국도감 번호에 지역 폼이 2개 이상 붙는 종(나옹 등)은 selector 복잡도 때문에 후순위 유지`
- [x] `21-3-6-5-1-4). 지역 폼 중에서도 전설/환상 조류(가라르 프리져/썬더/파이어)와 복합 규칙 종(팔데아 켄타로스)은 각 전용 backlog 항목으로 유지`
- [x] `21-3-6-5-2). 전설/환상 포켓몬 전용 폼 확장 검토 (기라티나/쉐이미/버드렉스 등)`
- [x] `21-3-6-5-3). 다수 폼/복합 규칙 폼 확장 검토 (켄타로스 팔데아 breed, 지가르데 등)`
- [x] `21-3-6-5-4). 일반 폼 라벨 한글화 및 selector 카피 보정 필요 대상 정리`
- [x] `21-4). 기술 selector 실사용 흐름 점검 (현재 route/API/save flow + client sync effect 확인)`
- [x] `21-4-1). 포켓몬 변경 시 기술 자동 정리 확인 (client sync effect 기준)`
- [x] `21-4-2). 포맷 변경 시 기술 자동 정리 확인 (client sync effect 기준)`
- [x] `21-4-3). 같은 슬롯 내 중복 기술 차단 확인`
- [x] `21-4-4). 저장 성공/실패 메시지 확인`
- [x] `21-4-5). 필요 시 실제 브라우저 클릭 기준 수동 점검 별도 진행`

### 6. 세션/데이터 모델 강화
- [x] `22). 브라우저 생성 익명 세션을 더 강한 서버 관리 세션으로 교체`
- [x] `22-1). 현재 anonymous-session 흐름과 localStorage/sessionId 의존 경로 재확인`
- [x] `22-2). 서버가 익명 세션을 발급/재사용하는 최소 세션 경계 설계`
- [x] `22-3). /api/daily/state와 /api/teams/state를 서버 세션 우선 읽기로 전환`
- [x] `22-4). 클라이언트에서 sessionId 직접 생성/전달하는 경로 제거`
- [x] `22-5). 기존 localStorage 기반 세션과의 1차 하위 호환 범위 결정 및 정리`
- [x] `22-6). /daily, /my-pokemon, /teams, /my-teams 세션 전환 smoke check`
- [x] `22-7). session-guide / architecture / verification-guide에 새 세션 흐름 반영`
- [x] `23). anonymous-session에서 향후 user_id 기반 ownership으로 이동할 경로 정리`
- [x] `23-1). 현재 anonymous-session ownership이 붙어 있는 테이블/API 범위 고정`
- [x] `23-2). 목표 ownership 모델을 user_id 중심으로 정의`
- [x] `23-3). 로그인 이후 새 데이터만 user_id로 저장하는 단순 전환 방향 정리`
- [x] `23-4). 운영 중인 앱이 아니라는 전제에서 legacy anonymous 데이터 병합/보존을 비범위로 명시`
- [x] `23-5). 향후 user_id 도입 시 필요한 DB 컬럼/제약 방향만 초안으로 정리`
- [x] `23-6). database-plan / architecture에 ownership 전환 원칙 반영`
- [x] `24). migration 적용/서버 재시작 체크 보강`
- [x] `24-1). migration 이후 실제 실패 유형을 daily/team/session 기준으로 분류`
- [x] `24-2). 변경 종류별 필수 명령 순서와 재시작 필요 조건 고정`
- [x] `24-3). DB schema 변경 / seed 변경 / state API 변경 / catalog 경로 변경별 최소 검증 세트 정의`
- [x] `24-4). /daily /my-pokemon /teams /my-teams 와 state API의 최소 smoke-check 세트 재정리`
- [x] `24-5). verification-guide를 쿠키 기반 세션 기준으로 재검토하고 남은 오래된 문구 제거`
- [x] `24-6). Windows .next/trace 이슈와 dev/start 재시작 조건을 더 명확히 정리`
- [x] `24-7). failure triage 체크리스트 보강`
- [x] `24-8). 필요 시 반복 명령 예시나 helper script 후보까지 문서화`

### 7. 계정/인증 기반 전환과 후속
- [x] `25). Authentication`
- [x] `25-1). 현재 anonymous-session 경계와 향후 auth session 공존 규칙 정의`
- [x] `25-2). auth provider / session strategy / 최소 사용자 모델 결정`
- [x] `25-3). users / auth_accounts / sessions 등 최소 auth schema 초안 정리`
- [x] `25-4). 인증 후 어떤 쓰기부터 user_id 기준으로 전환할지 범위 확정`
- [x] `25-5). 로그인/로그아웃 및 세션 확인용 최소 서버 경계(route or helper) 도입`
- [x] `25-6). 최소 인증 UI 진입점 추가 (로그인/로그아웃/세션 상태 표시)`
- [x] `25-7). 인증 성공 후 사용자 세션이 서버에서 읽히는지 smoke check`
- [x] `25-8). docs/session-guide / architecture / current-product / database-plan 반영`
- [x] `26). 서버 기반 사용자 영속화 확장`
- [x] `26-1). authenticated request에서 user_id를 읽는 공용 ownership resolver 추가`
- [x] `26-2). favorites를 첫 user_id write/read 대상으로 전환`
- [x] `26-3). daily / my-pokemon state를 user_id 대응으로 확장`
- [x] `26-4). teams / my-teams state를 user_id 대응으로 확장`
- [x] `26-5). anonymous fallback과 authenticated write 우선순위 검증`
- [x] `26-6). 관련 migration / docs / smoke check 정리`
- [x] `27). Favorites`
- [x] `27-1). 즐겨찾기 DB 스키마 설계 및 마이그레이션 (favorite_pokemon 테이블)`
- [x] `27-2). 즐겨찾기 상태 관리를 위한 서버 repository 로직 추가 (toggle/get)`
- [x] `27-3). 익명 세션 쿠키 기반의 즐겨찾기 상태 API 구현 (/api/favorites/state)`
- [x] `27-4). 포켓몬 상세 페이지([slug])에 즐겨찾기 토글 버튼 추가 및 연동`
- [x] `27-5). 포켓몬 목록(메인 도감) UI에 즐겨찾기 표시 및 토글 버튼 추가`
- [x] `27-6). 즐겨찾기 전용 모아보기 페이지 구현 (/favorites)`
- [x] `27-7). 헤더 네비게이션에 즐겨찾기 메뉴 추가`
- [x] `27-8). 즐겨찾기 기능 후속 안정화`
- [x] `27-8-1). 잘못 생성된 favorites migration을 incremental repository migration으로 교체`
- [x] `27-8-2). 쿠키 기반 favorites API/runtime smoke check 복구 및 재검증`
- [x] `27-8-3). /favorites의 daily-state 결합 유지 여부 판단 및 필요 시 최소 분리`
- [x] `27-8-4). favorites 후속 안정화 결과를 docs/task log에 최종 반영`
- [x] `28). 하이브리드 이후 추가 DB 통합`
- [x] `28-1). 현재 hybrid catalog/data pipeline에서 runtime이 아직 snapshot 전제를 두는 지점 재확인`
- [x] `28-2). pokedex / item / move import pipeline 중 DB가 이미 source of truth인 부분과 아직 snapshot-first인 부분 분리`
- [x] `28-3). runtime route에서 더 이상 필요 없는 snapshot-era fallback/helper 후보 정리`
- [x] `28-4). catalog import/seed workflow를 현재 DB-first runtime 관점으로 재정리`
- [x] `28-5). item / move / form 관련 후속 기능이 DB catalog만으로 충분한지 검토`
- [x] `28-6). 필요 시 DB catalog 테이블/인덱스 보강 후보 정리`
- [x] `28-7). hybrid 설명 문서(project-overview / architecture / current-product / session-guide) 현재형으로 재정리`
- [x] `29). 계정 기반 ownership 전환`
- [x] `29-1). 개발용 auth session과 실제 계정 기반 auth session의 차이/교체 범위 고정`
- [x] `29-2). real provider-backed auth의 최소 목표 경계 정의 (sign-in / sign-out / current session)`
- [x] `29-3). 현재 development-only auth route와 header auth panel을 실제 auth 흐름으로 교체할 최소 설계 정리`
- [x] `29-4). authenticated session 발급/검증/만료 정책을 실제 계정 기준으로 정리`
- [x] `29-5). current user helper와 ownership resolver가 실제 auth provider/session 경계를 읽도록 전환`
- [x] `29-6). favorites / daily / teams가 development-only auth 없이도 같은 user_id ownership을 유지하는지 smoke check`
- [x] `29-7). docs/session-guide / architecture / current-product / database-plan 반영`
- [x] `29-8). persistence 기능을 로그인 필수 범위로 전환할 제품/런타임 경계 고정`
- [x] `29-9). favorites read/write를 auth-required로 전환`
- [x] `29-10). daily / my-pokemon state read/write를 auth-required로 전환`
- [x] `29-11). teams / my-teams state read/write를 auth-required로 전환`
- [x] `29-12). anonymous persistence fallback 제거 범위 정리 및 smoke check`
- [x] `30). 더 깊은 catalog 정규화 재검토`
- [x] `30-1). 현재 catalog payload 중심 테이블(`pokemon_catalog`, `item_catalog`, `move_catalog`, `pokemon_move_catalog`)에서 정규화 압력이 큰 지점 재분류`
- [x] `30-2). 포켓몬 detail/list payload에서 lookup column과 full payload가 중복되는 필드를 정리 후보로 분리`
- [x] `30-3). item / move catalog에서 slug/name/type/category 계층을 별도 reference 테이블로 분리할 실익 검토`
- [x] `30-4). move learnset를 national-dex 단위에서 form-aware 구조로 넓힐 필요 범위 재평가`
- [x] `30-5). saved formKey / move legality / wider form family를 함께 다룰 장기 schema 방향 초안 정리`
- [x] `30-6). current query path가 정규화 이후에도 유지되어야 할 최소 read-model 요구사항 정리`
- [x] `30-7). normalization을 하더라도 import pipeline / runtime read-model / client contract를 어떻게 분리할지 원칙 정리`
- [x] `30-8). 실제 normalization migration으로 들어가기 전 비범위와 선행조건 명시`
- [x] `31). 마이 페이지 / 계정 허브`
- [x] `31-1). 현재 로그인 사용자 프로필 카드 (이름 / 이메일 / provider) 노출`
- [x] `31-2). 내 활동 요약 (즐겨찾기 수 / 포획 수 / 저장 팀 수) 집계`
- [x] `31-3). 마이 페이지에서 favorites / my-pokemon / my-teams로 이동하는 계정 허브 구성`
- [x] `31-4). 로그인 필요 기능과 계정 상태를 한곳에서 설명하는 안내 섹션 정리`
- [x] `31-5). 현재 독립 top-level인 favorites 메뉴를 마이 페이지 또는 계정 허브 하위로 재배치할지 결정`
- [x] `31-6). 마이 페이지/계정 허브 도입 시 favorites 진입 동선을 현재 독립 메뉴에서 새 계정 정보구조로 이동`
- [x] `32). 계정 기반 즐겨찾기 UX 확장`
- [x] `32-1). 마이 페이지 또는 별도 favorites 화면에서 정렬/필터/검색 추가`
- [x] `32-2). 목록 / 상세 / favorites 화면 사이의 즐겨찾기 상태 반영 UX 정리`
- [x] `32-3). 즐겨찾기 비어 있음 상태를 로그인 사용자 기준 copy로 재정리`
- [x] `33). 계정 기반 컬렉션 UX 확장`
- [x] `33-1). my-pokemon에 로그인 사용자 기준 통계/요약 추가`
- [x] `33-2). my-pokemon 1차 관리 controls 추가 (포획 시각 정렬 + 반짝 여부 필터 + 타입 필터 + 이름 검색)`
- [x] `33-2-1). my-pokemon 세대 필터는 richer catalog payload 또는 별도 projection이 필요할 때 재검토`
- [x] `33-2-2). 포획 시각 외 추가 정렬기준(반짝 우선, 타입 그룹 등) 확장 여부는 실제 사용성 기준으로 재검토`
- [x] `33-3). daily와 my-pokemon 사이의 계정 기준 진행 상태 설명 강화`
- [x] `34). 계정 기반 팀 관리 UX 확장`
- [x] `34-1). my-teams에 최근 수정일 / 포맷 / 모드 기준 정렬 추가`
- [x] `34-2). 팀 복제 / 이름 변경 / 빠른 편집 진입 같은 계정 기반 관리 작업 검토`
- [x] `34-3). 팀이 많아졌을 때를 대비한 검색/필터 UX 검토`
- [x] `35-1). 로그아웃 후 UX 및 로그인 유도 copy 정리 (Audit 및 스타일 통일 포함)`
- [x] `35-2). 향후 계정 삭제 또는 사용자 데이터 초기화 정책 초안 정리`
- [x] `35-2-1). Soft Delete 계정 비활성 사용자 세션 차단 및 보호 라우트 처리`
- [x] `35-2-2). 계정 삭제 요청 route / UI 진입점 추가`
- [x] `35-2-3). 계정 삭제 후 grace period 동안 복구 가능 여부와 재활성화 흐름 정리`
- [x] `35-2-4). grace period 만료 후 favorites / daily / teams 실제 purge 정책 및 작업 방식 정리`
- [x] `35-2-5). 사용자 데이터 초기화 범위(즐겨찾기 / 내 포켓몬 / 팀)와 실행 순서 정의`
- [x] `35-3). 로그인 실패 / provider callback 실패 / 세션 만료 시 에러 UX 정리`
- [x] `35-3-1). 로그인 시작 실패 UX 정리 (/api/auth/sign-in 실패, provider 미설정, inactive account 포함)`
- [x] `35-3-2). provider callback 실패 UX 정리 (invalid-state / missing-code / callback-failed / account-inactive)`
- [x] `35-3-3). 보호 화면의 세션 만료 UX 정리 (401 응답 시 재로그인 안내와 상태 복구 기준 정리)`
- [x] `35-3-4). auth 관련 사용자 메시지/copy 표준화`
- [x] `35-3-5). 실패 케이스 최소 검증 포인트를 verification 문서 반영 전 단계로 정리`
- [x] `35-4). 마이 페이지 및 계정 기능에 대한 최소 smoke-check 시나리오 문서화`

### 8. 마이 페이지 정보구조 정리
- [x] `39). 마이 페이지 네비게이션 분할`
- [x] `39-1). 마이 페이지 내부 진입 링크를 컬렉션 / 팀 / 계정 설정 성격으로 재구성할지 검토`
- [x] `39-2). 현재 단일 카드형 링크 묶음을 섹션형 네비게이션으로 분리할 최소 UI 방향 정리`
