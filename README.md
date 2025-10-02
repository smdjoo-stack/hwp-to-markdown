# HWP to Markdown Converter

한글 문서(.hwp)를 마크다운(.md) 형식으로 변환하는 웹 애플리케이션입니다.

![HWP to Markdown](https://img.shields.io/badge/HWP-to-Markdown-blue)
![Python](https://img.shields.io/badge/Python-3.9+-green)
![Flask](https://img.shields.io/badge/Flask-2.3+-orange)

## 주요 기능

- ⚡ **빠른 변환**: 병렬 처리로 여러 파일 동시 변환 (최대 5개)
- 📄 **다중 파일 지원**: 여러 HWP 파일을 한번에 업로드
- 🎨 **모던한 UI**: 드래그 앤 드롭, 반응형 디자인
- 🔒 **안전한 처리**: 파일은 서버에 저장되지 않고 즉시 처리 후 삭제
- 💾 **간편한 저장**: 변환된 파일을 바로 다운로드하거나 클립보드에 복사
- 🌐 **완전 로컬**: 외부 API 없이 로컬에서 처리

## 스크린샷

### 메인 화면
![Main Screen](screenshot-main.png)

### 변환 결과
![Result Screen](screenshot-result.png)

## 설치 및 실행

### 1. 필수 요구사항

- Python 3.9 이상
- pip (Python 패키지 관리자)

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

또는

```bash
pip install flask pyhwp
```

### 3. 서버 실행

```bash
python3 app.py
```

서버가 시작되면 브라우저에서 다음 주소로 접속:

```
http://localhost:8080
```

## 사용 방법

1. **파일 업로드**
   - HWP 파일을 드래그 앤 드롭하거나
   - "파일 선택" 버튼을 클릭하여 업로드
   - 여러 파일을 동시에 선택 가능

2. **자동 변환**
   - 업로드된 파일이 자동으로 마크다운으로 변환됩니다
   - 여러 파일은 병렬로 처리되어 빠르게 완료

3. **결과 저장**
   - "다운로드" 버튼: 변환된 .md 파일 저장
   - "복사" 버튼: 마크다운 텍스트를 클립보드에 복사

## 기술 스택

### Backend
- **Flask**: Python 웹 프레임워크
- **pyhwp**: HWP 파일 파싱 라이브러리
- **ThreadPoolExecutor**: 병렬 처리

### Frontend
- **HTML5/CSS3**: 모던 UI
- **JavaScript (ES6+)**: 파일 업로드 및 API 통신
- **Fetch API**: 비동기 HTTP 요청

## 프로젝트 구조

```
.
├── app.py              # Flask 백엔드 서버
├── hwp_to_markdown.py  # CLI 버전 (독립 실행 가능)
├── index.html          # 메인 페이지
├── style.css           # 스타일시트
├── script.js           # 프론트엔드 로직
├── requirements.txt    # Python 의존성
└── README.md          # 프로젝트 문서
```

## 제한 사항

- **파일 크기**: 개별 파일 최대 10MB, 총 요청 최대 50MB
- **동시 처리**: 최대 5개 파일 병렬 처리
- **지원 형식**: HWP 5.x 형식
- **추출 제한**: 기본 텍스트 추출 (이미지, 표, 복잡한 서식 제한적)

## CLI 버전 사용법

웹 인터페이스 없이 커맨드라인에서도 사용 가능:

```bash
# 기본 사용
python hwp_to_markdown.py document.hwp

# 출력 파일 지정
python hwp_to_markdown.py document.hwp -o output.md

# 표준출력으로 출력
python hwp_to_markdown.py document.hwp --stdout
```

## 개발

### 로컬 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/yourusername/hwp-to-markdown.git
cd hwp-to-markdown

# 가상환경 생성 (선택사항)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
python3 app.py
```

### 프로덕션 배포

프로덕션 환경에서는 Gunicorn 또는 uWSGI 사용 권장:

```bash
# Gunicorn 설치
pip install gunicorn

# 서버 실행
gunicorn -w 4 -b 0.0.0.0:8080 app:app
```

## 문제 해결

### HWP 파일이 변환되지 않을 때

1. HWP 5.x 형식인지 확인
2. 파일이 손상되지 않았는지 확인
3. 파일 크기가 제한을 초과하지 않는지 확인

### 한글이 깨질 때

- `pyhwp` 라이브러리가 제대로 설치되었는지 확인
- Python 3.9 이상 버전 사용 권장

## 라이선스

MIT License

## 기여

기여는 언제나 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 작성자

Created with Claude Code

## 변경 이력

### v1.0.0 (2025-10-02)
- 초기 릴리스
- 웹 인터페이스 구현
- 병렬 처리 지원
- CLI 도구 포함
