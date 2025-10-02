// 전역 변수
let selectedFiles = [];
let convertedResults = [];

// DOM 요소
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const markdownPreview = document.getElementById('markdownPreview');
const toast = document.getElementById('toast');

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 파일 선택
    fileInput.addEventListener('change', handleFileSelect);

    // 드래그 앤 드롭
    uploadBox.addEventListener('click', () => fileInput.click());
    uploadBox.addEventListener('dragover', handleDragOver);
    uploadBox.addEventListener('dragleave', handleDragLeave);
    uploadBox.addEventListener('drop', handleDrop);
});

// 파일 선택 핸들러
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
        validateAndProcessFiles(files);
    }
}

// 드래그 오버 핸들러
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadBox.classList.add('drag-over');
}

// 드래그 떠남 핸들러
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadBox.classList.remove('drag-over');
}

// 드롭 핸들러
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadBox.classList.remove('drag-over');

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
        validateAndProcessFiles(files);
    }
}

// 여러 파일 유효성 검사 및 처리
function validateAndProcessFiles(files) {
    const validFiles = [];

    for (const file of files) {
        // HWP 파일 확인
        if (!file.name.toLowerCase().endsWith('.hwp')) {
            showToast(`${file.name}은(는) HWP 파일이 아닙니다.`, 'error');
            continue;
        }

        // 파일 크기 확인 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
            showToast(`${file.name}은(는) 10MB를 초과합니다.`, 'error');
            continue;
        }

        validFiles.push(file);
    }

    if (validFiles.length === 0) {
        showToast('유효한 HWP 파일이 없습니다.', 'error');
        return;
    }

    selectedFiles = validFiles;
    displayFileInfo(validFiles);
    convertFiles(validFiles);
}

// 파일 정보 표시
function displayFileInfo(files) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    fileName.textContent = files.length === 1 ? files[0].name : `${files.length}개 파일`;
    fileSize.textContent = formatFileSize(totalSize);

    uploadBox.style.display = 'none';
    fileInfo.style.display = 'flex';
}

// 파일 크기 포맷
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 여러 파일 병렬 변환
async function convertFiles(files) {
    // 로딩 표시
    fileInfo.style.display = 'none';
    loading.style.display = 'block';
    resultSection.style.display = 'none';

    convertedResults = [];

    try {
        const total = files.length;
        const loadingText = document.querySelector('.loading p');

        if (files.length === 1) {
            // 단일 파일 - 기존 API 사용
            const formData = new FormData();
            formData.append('file', files[0]);

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('변환에 실패했습니다.');
            }

            const data = await response.json();
            convertedResults = [{
                filename: files[0].name,
                markdown: data.markdown,
                success: true
            }];

        } else {
            // 여러 파일 - 병렬 API 사용
            if (loadingText) {
                loadingText.textContent = `병렬 변환 중... (${total}개 파일)`;
            }

            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/api/convert-batch', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('변환에 실패했습니다.');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || '변환에 실패했습니다.');
            }

            convertedResults = data.results;
        }

        // 결과 표시
        displayResults(convertedResults);

        const successCount = convertedResults.filter(r => r.success).length;
        showToast(`${successCount}/${total}개 파일 변환 완료!`, 'success');

    } catch (error) {
        console.error('Error:', error);
        showToast('변환 중 오류가 발생했습니다: ' + error.message, 'error');
        resetUpload();
    } finally {
        loading.style.display = 'none';
        const loadingText = document.querySelector('.loading p');
        if (loadingText) {
            loadingText.textContent = '변환 중...';
        }
    }
}

// 결과 표시
function displayResults(results) {
    resultSection.style.display = 'block';

    if (results.length === 1) {
        // 단일 파일 - 기존 방식
        const result = results[0];
        if (result.success) {
            markdownPreview.textContent = result.markdown;
        } else {
            markdownPreview.textContent = `# 변환 실패\n\n${result.error}`;
        }
    } else {
        // 여러 파일 - 구분자로 표시
        const combined = results.map(result => {
            if (result.success) {
                return `# 📄 ${result.filename}\n\n${result.markdown}`;
            } else {
                return `# ❌ ${result.filename}\n\n변환 실패: ${result.error}`;
            }
        }).join('\n\n---\n\n');

        markdownPreview.textContent = combined;
    }
}

// 업로드 초기화
function resetUpload() {
    selectedFiles = [];
    convertedResults = [];
    fileInput.value = '';

    uploadBox.style.display = 'block';
    fileInfo.style.display = 'none';
    loading.style.display = 'none';
    resultSection.style.display = 'none';
}

// 마크다운 다운로드
function downloadMarkdown() {
    if (convertedResults.length === 0) return;

    if (convertedResults.length === 1) {
        // 단일 파일 다운로드
        const result = convertedResults[0];
        if (!result.success) return;

        const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const newName = result.filename.replace(/\.hwp$/i, '.md');

        link.href = url;
        link.download = newName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('파일이 다운로드되었습니다.', 'success');
    } else {
        // 여러 파일 - 각각 다운로드
        convertedResults.forEach(result => {
            if (!result.success) return;

            const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const newName = result.filename.replace(/\.hwp$/i, '.md');

            link.href = url;
            link.download = newName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });

        showToast(`${convertedResults.filter(r => r.success).length}개 파일이 다운로드되었습니다.`, 'success');
    }
}

// 클립보드에 복사
async function copyToClipboard() {
    if (convertedResults.length === 0) return;

    try {
        const combined = convertedResults.map(result => {
            if (result.success) {
                if (convertedResults.length === 1) {
                    return result.markdown;
                } else {
                    return `# 📄 ${result.filename}\n\n${result.markdown}`;
                }
            }
        }).filter(Boolean).join('\n\n---\n\n');

        await navigator.clipboard.writeText(combined);
        showToast('클립보드에 복사되었습니다!', 'success');
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('복사에 실패했습니다.', 'error');
    }
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast show';

    if (type === 'error') {
        toast.style.background = '#EF4444';
    } else if (type === 'success') {
        toast.style.background = '#10B981';
    } else {
        toast.style.background = '#111827';
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
