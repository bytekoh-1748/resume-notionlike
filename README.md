# Blockfolio Resume Builder

로컬에서 사용하는 블록형 이력서·포트폴리오·자기소개서 편집기입니다.
React 편집기, FastAPI API, PostgreSQL 저장소, Chromium PDF 생성기를
Docker Compose로 함께 실행합니다.

## 포함된 기능

- 1장/2장 이력서, 기술 포트폴리오, 자기소개서 템플릿
- 여러 문서 생성, 복제, 휴지통 삭제·복원
- 프로필 사진과 경력·학력 로고 추가·삭제
- 프로젝트 상세, 코드·PR·이슈 등 증거 링크 허브
- 구조화 블록과 Tiptap 자유 텍스트 블록의 인라인 편집
- 드래그·키보드·위/아래 버튼 이동, 1/2열 배치, undo/redo
- 800ms 자동 저장과 revision 기반 `409` 충돌 방지
- 초안과 공개본 스냅샷 분리, A4 PDF
- 발행본만 포함하는 Cloudflare Pages 정적 산출물

## 시작하기

```bash
cp .env.example .env
docker compose up --build
```

편집기는 `http://localhost:5173`, API 문서는 `http://localhost:8000/docs`에서
확인할 수 있습니다. DB·API·웹 포트는 모두 `127.0.0.1`에만 바인딩되므로
시작 전에 `5432`, `8000`, `5173` 포트가 비어 있어야 합니다.

수동으로 migration만 실행하려면 다음 명령을 사용합니다.

```bash
docker compose run --rm api alembic upgrade head
```

PostgreSQL 데이터는 `resume_pgdata` named volume에 저장되어 컨테이너를
재생성해도 유지됩니다.

## 발행본 만들기

편집기에서 문서를 발행한 다음 아래 명령으로 정적 공개본과 PDF를 생성합니다.

```bash
docker compose --profile publish run --rm publisher
```

결과는 `var/public-dist`에 생성됩니다. Cloudflare Pages에 바로 배포하려면
`.env.cloudflare.example`을 `.env.cloudflare`로 복사해 값을 설정한 뒤 실행합니다.

```bash
docker compose --env-file .env.cloudflare --profile publish run --rm -e DEPLOY=true publisher
```

`DEPLOY=true`를 주지 않으면 Cloudflare에는 업로드하지 않고 로컬 산출물만
갱신합니다. 업로드가 실패해도 기존 Pages 배포는 변경되지 않습니다.

## 로컬 검사

```bash
cd frontend && npm run lint && npm test
cd ../backend && .venv/bin/pytest -q
docker compose config --quiet
```
