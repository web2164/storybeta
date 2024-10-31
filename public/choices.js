let step = 0;
let totalSteps = 0;
let fullStory = ""; // 전체 스토리를 저장할 변수
let ending = ""; // 결말을 저장할 변수

// 대기 함수
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// API 호출 함수
async function fetchData(prompt) {
    const maxRetries = 5; // 최대 재시도 횟수
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('429 Too Many Requests - 잠시 대기 후 재시도합니다.');
                    await delay(2000); // 2초 대기 후 재시도
                    continue; // 다음 시도로 넘어감
                }
                throw new Error('서버 오류가 발생했습니다.');
            }

            const data = await response.json();

            if (!data || !data.result) {
                throw new Error('유효하지 않은 데이터 형식입니다.');
            }

            return data.result;
        } catch (error) {
            console.error('오류 발생:', error);
            if (attempt === maxRetries - 1) {
                alert('오류가 발생했습니다. 다시 시도해 주세요.');
                return null;
            }
        }
    }
}

// 스토리 및 선택지 업데이트 함수
function updateStoryOutput(story, choices) {
    const storyContent = document.getElementById("story-content");
    const choicesContainer = document.getElementById("choices-container");

    storyContent.innerHTML = story;
    choicesContainer.innerHTML = ''; // 이전 선택지 제거

    if (Array.isArray(choices)) {
        choices.forEach((choice, index) => {
            const button = document.createElement("button");
            button.classList.add("choice-button");
            button.innerText = choice;
            button.addEventListener("click", () => handleChoice(index));
            choicesContainer.appendChild(button);
        });
    } else {
        console.error("유효하지 않은 선택지 데이터입니다:", choices);
    }
}

// 선택지 클릭 핸들러
async function handleChoice(choiceIndex) {
    step++;

    const storyContent = document.getElementById("story-content");
    const choicesContainer = document.getElementById("choices-container");

    storyContent.innerHTML = ''; 
    choicesContainer.innerHTML = ''; 

    if (step >= totalSteps) {
        ending = await fetchData("이야기의 결말을 만들어 주세요.");
        document.getElementById("story-content").innerHTML = ending || '엔딩을 불러올 수 없습니다.';
        document.getElementById("choices-container").style.display = "none";

        // 결말을 전체 스토리에 추가하고 출력 버튼을 생성
        fullStory += ending + "<br>"; 
        addStoryOutputButton();
    } else {
        await delay(1000);
        
        const nextStory = await fetchData(`선택지 ${choiceIndex + 1}에 따라 이어지는 스토리를 100자 이하로 생성해 주세요.`);
        fullStory += nextStory + "<br>"; // 전체 스토리에 이어진 스토리 추가

        await delay(1000);
        
        const choices = await fetchData("다음 스토리 선택지를 20자 이하로 4개 생성해 주세요.");
        const choicesList = choices ? choices.split('\n').filter(choice => choice) : ['다시 시도해주세요.'];

        updateStoryOutput(nextStory, choicesList);
    }
}

// 스토리 출력 버튼 추가 함수
function addStoryOutputButton() {
    const outputButton = document.createElement("button");
    outputButton.innerText = "스토리 출력";
    outputButton.classList.add("choice-button");
    outputButton.addEventListener("click", () => {
        document.getElementById("story-output").innerHTML = fullStory; // 전체 스토리 출력

        // "처음으로" 버튼 추가
        const restartButton = document.createElement("button");
        restartButton.innerText = "처음으로";
        restartButton.classList.add("choice-button");
        restartButton.style.position = 'absolute'; 
        restartButton.style.top = '10px';
        restartButton.style.right = '10px';
        restartButton.addEventListener("click", () => {
            location.reload(); 
        });
        document.body.appendChild(restartButton);
    });
    document.getElementById("story-content").appendChild(outputButton);
}

// 시작 버튼 클릭 시 초기 스토리와 선택지 생성
document.getElementById("start-button").addEventListener("click", async () => {
    const motivation = document.getElementById("motivation").value;
    const conflict = document.getElementById("conflict").value;
    const setting = document.getElementById("setting").value;
    const twist = document.getElementById("twist").value;

    if (!motivation || !conflict || !setting || !twist) {
        alert('모든 필드를 입력해 주세요.');
        return;
    }

    totalSteps = parseInt(document.getElementById("branchCount").value, 10);
    
    if (isNaN(totalSteps) || totalSteps <= 0) {
        alert('올바른 단계 수를 입력해 주세요.');
        return;
    }

    document.getElementById("story-box").style.display = "none"; 
    const storyOutput = document.getElementById("story-output");
    storyOutput.style.display = "block";

    const intro = await fetchData(`동기: ${motivation}, 갈등: ${conflict}, 배경: ${setting}, 반전: ${twist}의 스토리 인트로를 100자 이내로 생성해 주세요.`);
    
    if (!intro) {
        document.getElementById("story-content").innerHTML = '인트로를 불러올 수 없습니다.';
        return;
    }

    fullStory += intro + "<br>"; // 전체 스토리에 인트로 추가

    await delay(1000);
    
    const choices = await fetchData("다음 스토리 선택지를 20자 이하로 4개 생성해 주세요.");
    const choicesList = choices ? choices.split('\n').filter(choice => choice) : ['다시 시도해주세요.'];

    updateStoryOutput(intro, choicesList);
});
