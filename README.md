# 백약산 — 4인 멀티플레이 (GitHub Pages + Render)

GitHub Pages는 HTML/CSS/JS 정적 호스팅만 가능하고 WebSocket Node.js 서버는 실행할 수 없습니다. 따라서 **GitHub Pages(웹페이지) + Render(공유 게임 서버)** 두 주소를 연결해야 합니다.

## 배포

1. GitHub에 이 폴더의 `index.html`, `server.js`, `package.json`, `render.yaml`을 업로드합니다.
2. GitHub 저장소 **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**를 선택합니다.
3. Render 대시보드에서 **New → Blueprint**를 선택하고 **같은 GitHub 저장소**를 연결하여 `render.yaml`로 서버를 배포합니다. Render에서 생성된 서버 주소를 확인합니다. 예: `https://baekyaksan-game.onrender.com`.
4. Render 주소 끝에 `/health`를 붙여 `"ok":true`가 표시되는지 확인합니다.
5. GitHub Pages 게임에 접속해 **멀티플레이 서버 설정** 또는 게임 속 **서버 설정**을 누르고 **Render 주소(https://...)**를 입력합니다. 방문자마다 설정을 반복하지 않게 하려면 `index.html`의 `DEPLOYED_SERVER_URL=''` 값을 Render 주소로 수정한 후 GitHub에 커밋하세요.
6. 서로 다른 브라우저 또는 기기에서 GitHub Pages 주소를 열어 게임에 들어갑니다. 인원 표시가 `2/4명`으로 바뀌는지 확인합니다.

**공유 링크 편의 기능:** `https://사용자.github.io/저장소/?server=https%3A%2F%2F서버.onrender.com` 처럼 `server` 쿼리 파라미터를 붙이면 서버 주소 설정 없이 접속할 수 있습니다.

## 시간과 날씨

- 시간: **실제 한국 표준시(KST, UTC+9)**를 1:1로 사용합니다. 한국 오후 10시에 게임 속도 오후 10시이며 밤 화면이 표시됩니다. 게임 서버가 꺼져도 시간은 진행합니다.
- 날씨: **게임 전용 가상 날씨**, KST 기준 30분 단위의 고정 일정으로 모든 플레이어가 동일합니다. 실제 한국 기상청 날씨를 가져오는 것은 아닙니다.
- 시간과 날씨는 공유 서버에서 전송되며 클라이언트도 한국 표준시에 맞추어 계산합니다.

## 연결 문제

- `서버 주소 필요`: GitHub Pages에서 Render 주소를 설정하지 않은 상태.
- `연결 끊김`: Render 서버가 꺼졌거나 잠든 상태, 잘못된 URL, 네트워크 차단 등. 자동으로 재접속합니다.
- `정원 4명`: 이미 4명이 접속한 상태. 브라우저 탭을 닫으면 인원이 감소합니다.
- 무료 서버는 유휴 시 잠들 수 있어 첫 접속이 지연될 수 있습니다. 안정적인 상시 접속은 Render 유료 인스턴스 또는 다른 상시 호스팅을 사용하세요.
- **실제 멀티플레이 검증은 두 개 이상의 기기로 배포 서버에 접속해 확인**해야 합니다.
- 서버를 여러 인스턴스로 확장하면 방이 분리될 수 있으므로 단일 인스턴스로 운영하세요. 한 인스턴스 최대 4명입니다.

## 로컬 테스트

```bash
npm install
npm start
```

`http://localhost:3000`으로 접속하면 별도 서버 주소 입력 없이 동일 서버의 `/ws`에 연결합니다.
