// 요소 선택 데이터
const storyElementsData = [
    { label: '동기', id: 'motivation', options: ['복수', '자유', '권력', '사랑', '생존'] },
    { label: '갈등', id: 'conflict', options: ['배신', '음모', '희생', '비극', '권력 투쟁'] },
    { label: '배경', id: 'setting', options: ['미래 도시', '중세 왕국', '사막', '우주선', '해저'] },
    { label: '반전', id: 'twist', options: ['숨겨진 배신자', '사실은 가짜', '시간여행', '숨겨진 능력', '미리 계획된 일'] },
    { label: '분기 수', id: 'branchCount', options: ['3', '4', '5'] }
];

// 요소 선택 생성 함수
function createStoryElements() {
    const storyElementsContainer = document.getElementById("story-elements");

    // 요소 데이터 기반으로 셀렉트 박스 생성
    storyElementsData.forEach(({ label, id, options }) => {
        const selectElement = document.createElement('div');
        selectElement.className = 'element-select';

        const optionsHTML = options.map(option => `<option value="${option}">${option}</option>`).join('');
        selectElement.innerHTML = `
            <label for="${id}">${label}:</label>
            <select id="${id}">${optionsHTML}</select>
        `;
        storyElementsContainer.appendChild(selectElement);
    });
}

// 페이지 로드 시 스토리 요소 생성
document.addEventListener("DOMContentLoaded", createStoryElements);

// 시작 버튼 클릭 시 처리 함수
function startButtonClickHandler() {
    const storyOutput = document.getElementById("story-output");

    // 스토리 출력 화면을 보이도록 처리
    storyOutput.style.visibility = "visible";
    storyOutput.classList.add("active");

    // 스토리 선택 화면 숨기기
    document.getElementById("story-box").style.display = "none";

    // 스토리 시작
    startStory();
}

// 스토리 및 선택지 초기화 및 시작
function startStory() {
    const storyContent = document.getElementById("story-content");
    const choicesContainer = document.getElementById("choices-container");

    // 첫 스토리와 선택지 초기화
    storyContent.innerHTML = "스토리가 시작됩니다..."; 
    choicesContainer.innerHTML = '';

    // 예시 선택지 추가
    const exampleChoices = ["선택지 1", "선택지 2", "선택지 3", "선택지 4"];
    exampleChoices.forEach((choice, index) => {
        const button = createChoiceButton(choice, index);
        choicesContainer.appendChild(button);
    });
}

// 선택지 버튼 생성 함수
function createChoiceButton(choiceText, index) {
    const button = document.createElement("button");
    button.classList.add("choice-button");
    button.innerText = choiceText;
    button.addEventListener("click", () => handleChoice(index));
    return button;
}

// 선택지 클릭 시 처리 함수
function handleChoice(choiceIndex) {
    const storyContent = document.getElementById("story-content");

    // 선택지 선택 후 새로운 스토리 출력
    storyContent.innerHTML = `선택지 ${choiceIndex + 1}을 선택하셨습니다. 다음 스토리를 불러옵니다...`;

    // 로딩 중 상태를 유지하기 위해 잠시 선택지 제거 (필요시 추가 처리 가능)
    const choicesContainer = document.getElementById("choices-container");
    choicesContainer.innerHTML = ''; // 선택지 숨기기
}

// 시작 버튼 클릭 이벤트 리스너 등록
document.getElementById("start-button").addEventListener("click", startButtonClickHandler);