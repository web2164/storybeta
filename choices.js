import { apiKey } from './api.js';

let step = 0;
let totalSteps = 0;

// API 호출 함수
async function fetchData(prompt) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('오류 발생:', error);
        alert('오류가 발생했습니다. 다시 시도해 주세요.');
    }
}

// 스토리 및 선택지 업데이트 함수
function updateStoryOutput(story, choices) {
    const storyContent = document.getElementById("story-content");
    const choicesContainer = document.getElementById("choices-container");

    // 새로운 스토리 및 선택지 표시
    storyContent.innerHTML = story;
    choicesContainer.innerHTML = ''; // 이전 선택지 제거

    choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.classList.add("choice-button");
        button.innerText = choice;
        button.addEventListener("click", () => handleChoice(index));
        choicesContainer.appendChild(button);
    });
}

// 선택지 클릭 핸들러
async function handleChoice(choiceIndex) {
    step++;
    
    const storyContent = document.getElementById("story-content");
    const choicesContainer = document.getElementById("choices-container");

    // 선택 후 검정 화면 유지
    storyContent.innerHTML = ''; // 스토리 제거
    choicesContainer.innerHTML = ''; // 선택지 제거

    if (step >= totalSteps) {
        // 마지막 스토리: 엔딩 처리
        const ending = await fetchData("이야기의 결말을 만들어 주세요.");
        document.getElementById("story-content").innerHTML = ending;
        document.getElementById("choices-container").style.display = "none"; // 선택지 숨기기
    } else {
        // 새로운 스토리 가져오기
        const nextStory = await fetchData(`선택지 ${choiceIndex + 1}에 따라 이어지는 스토리를 생성해 주세요.`);
        const choices = await fetchData("다음 스토리 선택지를 4개 생성해 주세요.");
        const choicesList = choices.split('\n').filter(choice => choice);
        updateStoryOutput(nextStory, choicesList); // 스토리 및 선택지 업데이트
    }
}

// 시작 버튼 클릭 시 초기 스토리와 선택지 생성
document.getElementById("start-button").addEventListener("click", async () => {
    const motivation = document.getElementById("motivation").value;
    const conflict = document.getElementById("conflict").value;
    const setting = document.getElementById("setting").value;
    const twist = document.getElementById("twist").value;
    totalSteps = parseInt(document.getElementById("branchCount").value);

    document.getElementById("story-box").style.display = "none"; // 스토리 선택 화면 숨기기
    const storyOutput = document.getElementById("story-output");
    storyOutput.style.display = "block"; // 스토리 출력 화면 보이기

    const intro = await fetchData(`동기: ${motivation}, 갈등: ${conflict}, 배경: ${setting}, 반전: ${twist}의 스토리 인트로를 200자 이내로 생성해 주세요.`);
    const choices = await fetchData("다음 스토리 선택지를 4개 생성해 주세요.");
    const choicesList = choices.split('\n').filter(choice => choice);

    updateStoryOutput(intro, choicesList); // 인트로와 선택지 표시
});