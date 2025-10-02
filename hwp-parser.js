/**
 * Client-side HWP Parser
 * HWP 파일을 브라우저에서 직접 파싱
 */

class HWPParser {
    constructor(file) {
        this.file = file;
    }

    async parse() {
        try {
            const arrayBuffer = await this.file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // HWP 파일은 OLE 복합 문서 형식
            // 간단한 텍스트 추출 시도
            const text = this.extractText(uint8Array);
            return text;
        } catch (error) {
            throw new Error(`파일 읽기 실패: ${error.message}`);
        }
    }

    extractText(data) {
        const textParts = [];
        const decoder = new TextDecoder('utf-16le', { fatal: false });

        // HWP 파일에서 텍스트 블록 찾기
        let consecutiveValidChars = 0;
        let tempBuffer = [];

        for (let i = 0; i < data.length - 1; i += 2) {
            try {
                const char = String.fromCharCode(data[i] | (data[i + 1] << 8));

                if (this.isPrintableChar(char) || char === '\n' || char === '\r' || char === ' ') {
                    tempBuffer.push(char);
                    consecutiveValidChars++;

                    // 연속된 유효 문자가 3개 이상이면 텍스트로 인정
                    if (consecutiveValidChars >= 3) {
                        textParts.push(...tempBuffer);
                        tempBuffer = [];
                    }
                } else {
                    // 유효하지 않은 문자를 만나면 버퍼 초기화
                    if (consecutiveValidChars >= 3) {
                        // 이미 추가된 텍스트는 유지
                        consecutiveValidChars = 0;
                    } else {
                        // 짧은 버퍼는 버림
                        tempBuffer = [];
                        consecutiveValidChars = 0;
                    }
                }
            } catch (e) {
                tempBuffer = [];
                consecutiveValidChars = 0;
            }
        }

        // 남은 버퍼 처리
        if (consecutiveValidChars >= 3) {
            textParts.push(...tempBuffer);
        }

        const rawText = textParts.join('');
        return this.cleanText(rawText);
    }

    isPrintableChar(char) {
        const code = char.charCodeAt(0);

        // 한글 완성형 (가-힣)
        if (code >= 0xAC00 && code <= 0xD7A3) return true;

        // 한글 자모 (ㄱ-ㅎ, ㅏ-ㅣ)
        if (code >= 0x3131 && code <= 0x318E) return true;

        // 한글 호환 자모
        if (code >= 0x3200 && code <= 0x321E) return true;
        if (code >= 0x3260 && code <= 0x327F) return true;

        // 영문 대소문자, 숫자
        if ((code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A)) return true;
        if (code >= 0x30 && code <= 0x39) return true;

        // 기본 문장부호 및 특수문자
        if (code >= 0x20 && code <= 0x2F) return true; // 공백, !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /
        if (code >= 0x3A && code <= 0x40) return true; // :, ;, <, =, >, ?, @
        if (code >= 0x5B && code <= 0x60) return true; // [, \, ], ^, _, `
        if (code >= 0x7B && code <= 0x7E) return true; // {, |, }, ~

        // 한글 문장부호
        if (code === 0x3001 || code === 0x3002) return true; // 、 。
        if (code >= 0x3008 && code <= 0x3011) return true; // 「」『』【】
        if (code === 0x00B7) return true; // ·

        // 전각 문자
        if (code >= 0xFF01 && code <= 0xFF5E) return true;

        return false;
    }

    cleanText(text) {
        // 중복 공백 및 특수문자 제거
        let cleaned = text
            .replace(/\0/g, '')  // NULL 문자 제거
            .replace(/[\x01-\x1F]/g, '') // 제어 문자 제거 (개행 제외)
            .replace(/\r\n/g, '\n')  // Windows 개행 통일
            .replace(/\r/g, '\n')    // Mac 개행 통일
            .replace(/\n{3,}/g, '\n\n')  // 3개 이상 개행을 2개로
            .replace(/[ \t]+/g, ' ')  // 연속 공백을 하나로
            .trim();

        return cleaned;
    }

    toMarkdown(text) {
        if (!text) {
            return '# 변환 오류\n\n텍스트를 추출할 수 없습니다.';
        }

        const lines = text.split('\n');
        const markdownLines = [];

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed) {
                markdownLines.push('');
                continue;
            }

            // 제목 감지 (짧고 마침표로 끝나지 않는 줄)
            if (trimmed.length < 50 &&
                !trimmed.endsWith('.') &&
                !trimmed.endsWith(',') &&
                !trimmed.endsWith('다') &&
                trimmed.split(' ').length <= 10) {

                markdownLines.push(`## ${trimmed}`);
                markdownLines.push('');
            } else {
                markdownLines.push(trimmed);
            }
        }

        return markdownLines.join('\n');
    }

    async convertToMarkdown() {
        const text = await this.parse();
        return this.toMarkdown(text);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HWPParser;
}
