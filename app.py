#!/usr/bin/env python3
"""
Flask 웹 서버 - HWP to Markdown 변환 API
"""

from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
import tempfile
import subprocess
from concurrent.futures import ThreadPoolExecutor
import threading

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB 제한

# 스레드 풀 생성 (최대 5개 동시 처리)
executor = ThreadPoolExecutor(max_workers=5)


class HWPToMarkdown:
    """HWP 파일을 Markdown으로 변환하는 클래스"""

    def __init__(self, hwp_file_path):
        self.hwp_file_path = hwp_file_path

    def extract_text_from_hwp(self):
        """HWP 파일에서 텍스트 추출 (pyhwp 사용)"""
        try:
            # hwp5txt 명령어 사용하여 텍스트 추출
            hwp5txt_path = os.path.expanduser('~/Library/Python/3.9/bin/hwp5txt')

            result = subprocess.run(
                [hwp5txt_path, self.hwp_file_path],
                capture_output=True,
                text=True,
                encoding='utf-8'
            )

            if result.returncode != 0:
                raise Exception(f"hwp5txt 실행 실패: {result.stderr}")

            return result.stdout.strip()

        except Exception as e:
            print(f"Error extracting text: {e}")
            raise Exception(f"텍스트 추출 실패: {e}")

    def convert_to_markdown(self):
        """HWP 텍스트를 Markdown 형식으로 변환"""
        text = self.extract_text_from_hwp()

        if not text:
            return "# 변환 오류\n\n텍스트를 추출할 수 없습니다."

        # 기본적인 마크다운 변환
        lines = text.split('\n')
        markdown_lines = []

        for line in lines:
            line = line.strip()
            if not line:
                markdown_lines.append('')
                continue

            # 제목 감지 (간단한 휴리스틱)
            if len(line) < 50 and not line.endswith('.') and not line.endswith(','):
                # 한글 제목 감지 개선
                if len(line.split()) <= 10:
                    markdown_lines.append(f"## {line}")
                    markdown_lines.append('')
                    continue

            markdown_lines.append(line)

        return '\n'.join(markdown_lines)


@app.route('/')
def index():
    """메인 페이지"""
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """정적 파일 제공"""
    return send_from_directory('.', path)


@app.route('/api/convert', methods=['POST'])
def convert():
    """HWP 파일 변환 API"""
    try:
        # 파일 확인
        if 'file' not in request.files:
            return jsonify({'error': '파일이 없습니다.'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': '파일이 선택되지 않았습니다.'}), 400

        if not file.filename.lower().endswith('.hwp'):
            return jsonify({'error': 'HWP 파일만 업로드 가능합니다.'}), 400

        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.hwp') as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name

        try:
            # 변환 수행
            converter = HWPToMarkdown(temp_file_path)
            markdown = converter.convert_to_markdown()

            return jsonify({
                'success': True,
                'markdown': markdown,
                'filename': secure_filename(file.filename).replace('.hwp', '.md')
            })

        finally:
            # 임시 파일 삭제
            try:
                os.unlink(temp_file_path)
            except:
                pass

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/convert-batch', methods=['POST'])
def convert_batch():
    """여러 HWP 파일 병렬 변환 API"""
    try:
        # 파일 확인
        if 'files' not in request.files:
            return jsonify({'error': '파일이 없습니다.'}), 400

        files = request.files.getlist('files')

        if len(files) == 0:
            return jsonify({'error': '파일이 선택되지 않았습니다.'}), 400

        # 병렬 변환 함수
        def convert_single_file(file):
            try:
                if not file.filename.lower().endswith('.hwp'):
                    return {
                        'success': False,
                        'filename': file.filename,
                        'error': 'HWP 파일이 아닙니다.'
                    }

                # 임시 파일로 저장
                with tempfile.NamedTemporaryFile(delete=False, suffix='.hwp') as temp_file:
                    file.save(temp_file.name)
                    temp_file_path = temp_file.name

                try:
                    # 변환 수행
                    converter = HWPToMarkdown(temp_file_path)
                    markdown = converter.convert_to_markdown()

                    return {
                        'success': True,
                        'markdown': markdown,
                        'filename': file.filename
                    }

                finally:
                    # 임시 파일 삭제
                    try:
                        os.unlink(temp_file_path)
                    except:
                        pass

            except Exception as e:
                return {
                    'success': False,
                    'filename': file.filename,
                    'error': str(e)
                }

        # 병렬 처리
        results = list(executor.map(convert_single_file, files))

        return jsonify({
            'success': True,
            'results': results,
            'total': len(files),
            'succeeded': sum(1 for r in results if r.get('success'))
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """파일 크기 초과 에러 처리"""
    return jsonify({'error': '파일 크기가 너무 큽니다. (최대 50MB)'}), 413


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8080))
    print("=" * 50)
    print("HWP to Markdown 변환 서버 시작")
    print("=" * 50)
    print(f"서버 주소: http://localhost:{port}")
    print("브라우저에서 위 주소로 접속하세요.")
    print("=" * 50)
    app.run(debug=False, host='0.0.0.0', port=port)
