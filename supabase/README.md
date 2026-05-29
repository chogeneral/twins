# Supabase — 회원가입 · 아이디 찾기 · 비밀번호 찾기(이메일)

이 디렉터리는 DB 마이그레이션·이메일 템플릿 예시·Auth 관련 설정 안내를 담습니다. 저장소에는 `supabase/config.toml`(CLI 초기화)과 `supabase/migrations/*.sql`(스키마)이 포함되어 있습니다.

---

## 1. 프런트 ↔ Supabase API 연결 (`.env`)

1. Dashboard → 해당 **프로젝트** → **Project Settings** → **API** 에서 아래 두 값을 복사합니다.
   - **Project URL** → `VITE_SUPABASE_URL`
   - **`anon` `public` 키** → `VITE_SUPABASE_ANON_KEY`
2. 프로젝트 루트에서 `.env.example` 을 참고해 **`.env`** 파일을 만들고 값을 채웁니다. (`.env`는 git에 안 올라갑니다.)
3. 개발 서버를 **재시작**합니다 (`npm run dev`).

코드에서는 `src/lib/supabaseClient.js` 가 위 변수로 클라이언트를 만듭니다.

---

## 2. 원격 Postgres에 SQL 마이그레이션 적용 (택 1)

### A. 대시보드 SQL Editor (가장 단순)

아래 「SQL 적用」 섹션처럼 마이그레이션 파일을 **파일 순서대로** SQL Editor 에 붙여넣어 실행합니다.

### B. Supabase CLI 로 프로젝트에 연결 후 `db push` (추천·재실행 용이)

1. [Supabase CLI](https://supabase.com/docs/guides/cli) 설치 후 터미널에서:

   ```bash
   npx supabase login
   ```

2. 저장소 루트에서 원격 프로젝트와 **링크**(프로젝트 ref 는 Dashboard URL 의 `project/xxxx` 또는 Settings → General):

   ```bash
   npm run db:link
   # 또는: npx supabase link --project-ref YOUR_PROJECT_REF
   ```

   링크가 끝나면 루트에 `.supabase` 등 로컬 링크 정보가 생성됩니다(민감할 수 있으니 `.gitignore`에 포함하는 경우가 많습니다).

3. `supabase/migrations` 에 있는 변경을 원격 DB에 반영합니다.

   ```bash
   npm run db:push
   ```

적용 여부 확인: `npm run db:status` 로 마이그레이션 목록을 볼 수 있습니다.

**직접 SQL 클라이언트로 접속**(psql 등): Dashboard → **Project Settings** → **Database** → **Connection string** 의 URI/password 를 사용합니다. 마이그레이션 재현은 위 `db push` 또는 SQL 파일 수동 실행과 동일한 결과를 목표로 합니다.

---

## SQL 적용

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 프로젝트를 연 뒤 **SQL Editor**로 이동합니다.
2. 마이그레이션별로 순서와 파일명을 참고하여 실행합니다.
   - **한 번에 적용(권장·SQL Editor):** `20260221130000_signup_and_find_id.sql` 하나만 실행해도 됩니다 — 회원 메타·아이디 찾기 RPC·**가입인사 게시판** DDL 이 모두 포함됩니다.
   - **CLI `db push`:** 위 파일과 시간순 다음 파일인 `20260520120000_signup_welcome_posts.sql` 이 차례로 적용되며, 가입인사 정의가 통합 파일과 중복돼 있어도 `if not exists` 등으로 재실행해도 안전합니다.

Supabase CLI로 연결했다면 저장소 루트에서 `supabase db push` 로도 동일 마이그레이션을 반영할 수 있습니다.

---

## 이 저장소가 다루는 기능

| 기능 | 위치·방식 | 설명 |
|------|-----------|------|
| 회원가입 | `public.member_accounts` + 트리거 | `auth.signUp()` 시 `user_metadata`(닉네임·휴대폰)를 동기화 |
| 아이디 찾기 | RPC `find_login_identifier` | 닉네임·휴대폰으로 가입 이메일을 마스킹해 조회 |
| 비밀번호 찾기 | Supabase Auth 기본 | 프런트에서 `resetPasswordForEmail` 로 재설정 링크 발송 |
| 가입인사 한줄 게시판 | `public.signup_welcome_posts` + RLS · 트리거 | 로그인 사용자 작성·목록 공유(`/qna` 페이지) |

### Row Level Security (RLS)

- `member_accounts`: 로그인한 사용자는 **자신의 행**만 읽을 수 있습니다.
- `signup_welcome_posts`: **로그인한 사용자 모두 읽기**, **본인만 INSERT**(가입 인사 페이지).

## Authentication — URL·프로바이더·메일 템플릿

비밀번호 재설정은 프런트에서 **`redirectTo` 로 `현재 origin + /login`** 을 넘기도록 두었습니다. Supabase와 일치시켜야 링크가 열립니다.

1. **Authentication → URL Configuration**
   - **Site URL**: 실제 서비스·스테이징 도메인(로컬이면 예: `http://localhost:5173`)
   - **Redirect URLs**: `https://배포도메인/login`, 개발 시 `http://localhost:5173/login` 등 필요한 주소를 모두 등록
2. **Authentication → Providers** 에서 **Email** 로그인을 사용합니다.
3. **Authentication → 이메일**(또는 **Email Templates**) → **Reset Password**(Recover) 에서 제목·본문을 수정합니다.

### 재설정 메일 문구·HTML

- **Subject** 예: `유광 잠바 비밀번호 재설정`
- **Body**는 HTML로 작성하고, 사용자가 반드시 눌러야 하는 링크에는 아래 변수를 넣습니다.
  - **`{{ .ConfirmationURL }}`** — 재설정 전체 URL (생략 불가)
- 그 밖 변수(`{{ .Email }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}` 등)는 [Auth 이메일 템플릿 문서](https://supabase.com/docs/guides/auth/auth-email-templates)를 참고합니다.

한글 레이아웃 예시: `supabase/email-templates/reset-password-ko.html` (복사 후 대시보드 본문에 맞게 조정하면 됩니다).

---

## 커스텀 SMTP로 발신인(이름·주소) 바꾸기

### 왜 필요한가

- **메일 제목·HTML 본문**은 위의 **템플릿**에서 바꿉니다.
- 받은 편지함에 보이는 **「보낸 사람 표시 이름 + 이메일 주소」** 는 Supabase 기본 발송 경로만으로는 브랜드에 맞추기 어렵거나 제한적인 경우가 많습니다.
- **커스텀 SMTP**를 켜면 `유광 잠바 <no-reply@검증한도메인.com>` 같이 설정할 수 있고, 가입 확인·이메일 변경·비밀번호 재설정 등 **Auth가 보내는 메일 전부**가 같은 SMTP로 나갑니다.

공식 절차: [Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

### A. 메일 제공자에서 먼저 할 일

1. Resend, SendGrid, Mailgun, Amazon SES 등 **SMTP를 주는 서비스** 하나에 가입합니다.
2. 실제 발신 주소로 쓸 **`something@내도메인.com`** 이 해당 서비스에서 **도메인/발신 주소 검증**을 마친 상태여야 합니다. (미검증이면 거절되거나 스팸함으로 갑니다.)
3. 제공자 문서대로 **SPF**, **DKIM**(필요 시 **DMARC**) DNS 레코드를 맞춥니다.

### B. SMTP 접속 정보 정리하기

제공자마다 이름이 조금 다르지만, 결국 다음 네 가지와 **발신 표시 정보** 두 가지가 필요합니다.

| 준비할 값 | 설명 |
|-----------|------|
| SMTP 호스트 | 예: Resend는 `smtp.resend.com`, SendGrid는 `smtp.sendgrid.net` |
| 포트 | 보통 **465**(SSL) 또는 **587**(STARTTLS). 제공자가 권장하는 쪽 사용 |
| 사용자명·비밀번호 | 제공자 계정 또는 **API 키를 SMTP 비밀번호로 쓰는 패턴**(문서 확인) |
| 발신 이메일 | `no-reply@검증한도메인.com` 등 From 주소 |
| 발신 표시 이름 | 받은 편지함에 보이는 이름, 예: `유광 잠바` |

**Resend + Supabase** 조합 예(자세함은 제공자 문서 기준):

- 호스트: `smtp.resend.com`
- 포트: `465`
- 사용자명: `resend`
- 비밀번호: Resend 대시보드에서 발급한 **API 키**

설명 페이지: [Send emails using Supabase with SMTP (Resend)](https://resend.com/docs/send-with-supabase-smtp)

### C. Supabase 대시보드에서 넣기

**헷깔리기 쉬운 점:** 왼쪽 **Authentication → Sign In / Providers → Email** 을 펼치면 나오는 화면(이메일 켜기, 비밀번호 정책, **Email OTP 만료·자릿수** 등)까지가 끝인 경우가 많습니다. **`Custom SMTP` 는 이 모달 안에 없습니다.** 아래 다른 경로로 이동합니다.

UI는 업데이트마다 이름이 조금 다를 수 있지만, 통상 다음 중 하나입니다.

1. [Dashboard](https://supabase.com/dashboard) → 해당 **프로젝트**
2. 왼쪽 **Authentication** 에서 아래쪽 **`NOTIFICATIONS` → `Emails`** 로 들어가 **SMTP**(또는 **SMTP Settings**) 탭·섹션을 연다.
3. 안 보이면 **왼쪽 맨 아래 톱니바퀴 → Project settings → Authentication** 안에서 **이메일 / SMTP** 를 찾는다.
4. 주소줄 사용: 브라우저에서 현재 프로젝트 주소가 `.../dashboard/project/`**`내프로젝트ref`**`/...` 이면, 아래처럼 직접 열어볼 수 있다(공식 도큐에 나오는 패턴과 동일).  
   `https://supabase.com/dashboard/project/`**`내프로젝트ref`**`/auth/smtp`  
   ([SMTP 가이드](https://supabase.com/docs/guides/auth/auth-smtp) 의 대시보드 링크와 같은 계열)
5. **커스텀 SMTP 활성화** 후 A·B 단계에서 정리한 값을 입력하고, **Sender email**, **Sender name** 등을 넣은 뒤 **저장**한다.

### D. 동작 확인

1. 비밀번호 찾기나 이메일 가입처럼 **Auth 메일이 한 통** 나가는 기능을 실행합니다.
2. 수신 클라이언트에서 보낸 줄이 **`설정한 표시 이름 <설정한 메일 주소>`** 인지 확인합니다.
3. 실패하면: 제공자 발송 로그·반려 사유, 스팸함, Supabase 프로젝트 로그를 순서대로 확인합니다.

### E. 시간당 발송 한도(Rate Limits)

커스텀 SMTP를 쓰기 시작하면 Supabase에서 **메일 시간당 한도**가 기본값으로 낮게 잡혀 있는 경우가 있습니다. 트래픽에 맞게 **Authentication → Rate Limits**(또는 문서상 안내 경로)에서 조정해야 연속 테스트나 실사용 중 `429`에 덜 걸립니다.

### F. Management API로 같은 값 넣기

대시보드 대신 조직 배포 규칙으로 관리할 때는 [위 SMTP 가이드](https://supabase.com/docs/guides/auth/auth-smtp)의 `PATCH .../config/auth` 예시처럼 `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_admin_email`, **`smtp_sender_name`** 등을 JSON으로 넣을 수 있습니다.

### 문제 해결 빠른 표

| 증상 | 점검 |
|------|------|
| 연결 실패·인증 실패 | 호스트 오타, 포트(587/465 혼동), TLS 방식이 제공자와 맞는지 |
| 보냈다고 나오는데 안 옴 | 도메인·발신 주소 미검증, 스팸함, 제공자 차단 로그 |
| 스팸함만 감 | SPF/DKIM/DMARC, 새 도메인 평판, 본문·제목 과도한 홍보 문구 |
| 429 Too Many Requests | 같은 동작 반복 테스트, Supabase Rate Limits |

---

### Supabase 기본 발신만 쓸 때

`noreply@mail.app.supabase.io` 같은 **내장 발신만** 사용하면 받은 편지함 표시 이름을 서비스명으로 고정하기 어렵습니다. 브랜드 발신이 필요하면 위 **커스텀 SMTP**를 권장합니다.

---

이 저장소에서는 비밀번호 찾기 **SMS·관련 Edge Function** 은 제거된 상태입니다. 예전에 DB에 SMS용 테이블을 두었다면 운영 정책에 따라 Dashboard SQL 로 정리하면 됩니다.
