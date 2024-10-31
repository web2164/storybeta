// api.js
async function fetchData(prompt) {
    if (!prompt) {
        alert('입력값이 필요합니다.'); // prompt가 비어 있을 경우
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }) // 프롬프트를 JSON 형식으로 전달
        });

        // 응답 상태 코드 체크
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data.result; // API에서 받은 결과 반환
    } catch (error) {
        console.error('오류 발생:', error);
        alert('오류가 발생했습니다. 다시 시도해 주세요.');
    }
}

export { fetchData }; // 다른 파일에서 사용할 수 있도록 fetchData 함수 내보내기
