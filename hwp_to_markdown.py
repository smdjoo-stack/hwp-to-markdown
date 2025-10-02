#!/usr/bin/env python3
"""
HWP to Markdown Converter
한글 문서(.hwp)를 Markdown 형식으로 변환하는 도구
"""

import sys
import os
import argparse
from pathlib import Path

try:
    import olefile
except ImportError:
    print("Error: olefile 라이브러리가 필요합니다. 'pip install olefile' 실행하세요.")
    sys.exit(1)


class HWPToMarkdown:
    """HWP 파일을 Markdown으로 변환하는 클래스"""

    def __init__(self, hwp_file_path):
        self.hwp_file_path = hwp_file_path
        self.markdown_content = []

    def extract_text_from_hwp(self):
        """HWP 파일에서 텍스트 추출"""
        if not olefile.isOleFile(self.hwp_file_path):
            raise ValueError("유효한 HWP 파일이 아닙니다.")

        ole = olefile.OleFileIO(self.hwp_file_path)

        try:
            # HWP 파일 구조에서 텍스트 스트림 찾기
            text_content = []

            # BodyText 섹션에서 텍스트 추출
            for entry in ole.listdir():
                if entry[0] == 'BodyText':
                    stream = ole.openstream(entry)
                    data = stream.read()
                    # UTF-16LE로 인코딩된 텍스트 디코딩
                    try:
                        # HWP 5.x 형식 처리
                        text = self._parse_hwp_text(data)
                        if text:
                            text_content.append(text)
                    except Exception as e:
                        print(f"Warning: 텍스트 추출 중 오류 ({entry}): {e}")

            ole.close()
            return '\n\n'.join(text_content)

        except Exception as e:
            ole.close()
            raise Exception(f"HWP 파일 읽기 실패: {e}")

    def _parse_hwp_text(self, data):
        """HWP 바이너리 데이터에서 텍스트 파싱"""
        text_parts = []

        try:
            # 간단한 텍스트 추출 (UTF-16LE)
            # HWP 형식은 복잡하므로 기본적인 텍스트만 추출
            i = 0
            while i < len(data):
                try:
                    # 텍스트 청크 찾기
                    if i + 1 < len(data):
                        char_bytes = data[i:i+2]
                        char = char_bytes.decode('utf-16le', errors='ignore')
                        if char.isprintable() or char in ['\n', '\r', '\t']:
                            text_parts.append(char)
                        i += 2
                    else:
                        i += 1
                except:
                    i += 1

        except Exception as e:
            print(f"Warning: 텍스트 파싱 중 오류: {e}")

        return ''.join(text_parts).strip()

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
            if len(line) < 50 and not line.endswith('.'):
                # 짧고 마침표로 끝나지 않으면 제목일 가능성
                if line.isupper() or (len(line.split()) <= 5):
                    markdown_lines.append(f"## {line}")
                    markdown_lines.append('')
                    continue

            markdown_lines.append(line)

        return '\n'.join(markdown_lines)

    def save_markdown(self, output_path=None):
        """Markdown 파일로 저장"""
        markdown_text = self.convert_to_markdown()

        if output_path is None:
            # 입력 파일명.md로 저장
            hwp_path = Path(self.hwp_file_path)
            output_path = hwp_path.with_suffix('.md')

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown_text)

        return output_path


def main():
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(
        description='HWP 파일을 Markdown으로 변환합니다.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  %(prog)s document.hwp                    # document.md로 변환
  %(prog)s document.hwp -o output.md       # output.md로 저장
  %(prog)s document.hwp --stdout           # 표준출력으로 출력
        """
    )

    parser.add_argument('input', help='입력 HWP 파일 경로')
    parser.add_argument('-o', '--output', help='출력 Markdown 파일 경로')
    parser.add_argument('--stdout', action='store_true', help='표준출력으로 출력')

    args = parser.parse_args()

    # 입력 파일 확인
    if not os.path.exists(args.input):
        print(f"Error: 파일을 찾을 수 없습니다: {args.input}")
        sys.exit(1)

    try:
        converter = HWPToMarkdown(args.input)

        if args.stdout:
            # 표준출력으로 출력
            markdown_text = converter.convert_to_markdown()
            print(markdown_text)
        else:
            # 파일로 저장
            output_path = converter.save_markdown(args.output)
            print(f"✓ 변환 완료: {output_path}")

    except Exception as e:
        print(f"Error: 변환 실패 - {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
