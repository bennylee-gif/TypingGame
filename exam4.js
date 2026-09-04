let score = 0; // 게임의 현재 점수를 저장하는 변수 (기본값 0)
let timeLeft = 20; // 게임의 제한 시간을 저장하는 변수 (기본값 20초)
let gameInterval = null; // 1초마다 타이머를 감소시키는 setInterval 식별자 저장 변수
let countdownInterval = null; // 게임 시작 전 3, 2, 1 카운트다운을 제어하는 setInterval 식별자 저장 변수
let isGameRunning = false; // 현재 게임이 진행 중인지 여부를 나타내는 플래그 변수

// DOM 요소 변수 선언 (HTML 요소를 자바스크립트 변수로 접근하기 위해 선언)
let targetSlot, targetCharElement, scoreSpan, timerSpan, startButton, resetButton, mobileInput;

// HTML 문서(DOM) 로드가 완료된 후 요소들을 변수에 연결
document.addEventListener('DOMContentLoaded', () => {
    targetSlot = document.querySelector('.target-slot'); // 타겟 글자 외곽 영역 요소 가져오기
    targetCharElement = document.getElementById('targetChar'); // 실제 타겟 글자가 표시될 요소 가져오기
    scoreSpan = document.querySelector('#score span span'); // 점수 숫자가 표시되는 <span> 요소 가져오기
    timerSpan = document.querySelector('#timer span span'); // 타이머 숫자가 표시되는 <span> 요소 가져오기
    startButton = document.getElementById('startButton'); // GAME START 버튼 가져오기
    resetButton = document.getElementById('resetButton'); // RESET 버튼 가져오기
    mobileInput = document.getElementById('mobileInput'); // 모바일 키보드용 숨김 input 요소 가져오기

    if (startButton) startButton.addEventListener('click', startGame); // 시작 버튼 클릭 시 startGame 함수 실행
    if (resetButton) resetButton.addEventListener('click', resetGame); // 리셋 버튼 클릭 시 resetGame 함수 실행
});

// 웹 오디오 엔진 설정 (Web Audio API 사용)
const AudioContext = window.AudioContext || window.webkitAudioContext; // 브라우저 호환성을 고려한 AudioContext 생성자 설정
let audioCtx = null; // 오디오 컨텍스트 객체를 저장할 변수 초기화

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext(); // 오디오 객체가 없으면 새로 생성
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume(); // 브라우저 정책으로 인해 일시 정지된 오디오 활성화
    }
}

// 전달받은 타입(type)에 따라 오디오 신호를 직접 합성하여 효과음을 재생하는 함수
function playMcSound(type) {
    if (!audioCtx) return; // 오디오 컨텍스트가 없으면 종료
    try {
        const osc = audioCtx.createOscillator(); // 파형을 생성하는 오실레이터(발신기) 객체 생성
        const gain = audioCtx.createGain(); // 음량을 조절하는 게인(볼륨) 노드 생성
        osc.connect(gain); // 오실레이터를 볼륨 노드에 연결
        gain.connect(audioCtx.destination); // 볼륨 노드를 스피커(최종 출력)에 연결
        const now = audioCtx.currentTime; // 현재 오디오 재생 타임스탬프 가져오기

        if (type === 'correct') { // 정답을 맞췄을 때의 효과음 설정
            osc.type = 'sine'; // 부드러운 사인파 파형 선택
            osc.frequency.setValueAtTime(800 + (score * 5), now); // 현재 점수가 높을수록 더 높은 주파수(음고) 설정
            osc.frequency.exponentialRampToValueAtTime(1200 + (score * 5), now + 0.08); // 0.08초 동안 음높이를 기하급수적으로 올려 경쾌한 피치 형성
            gain.gain.setValueAtTime(0.3, now); // 시작 볼륨 0.3 지정
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08); // 0.08초 동안 볼륨을 줄여 여운 없이 끊음
            osc.start(now); // 소리 재생 시작
            osc.stop(now + 0.08); // 0.08초 후 소리 정지
        } else if (type === 'wrong') { // 틀렸을 때의 효과음 설정
            osc.type = 'sawtooth'; // 거친 톱니바퀴파 파형 선택
            osc.frequency.setValueAtTime(150, now); // 시작 주파수를 낮은 150Hz로 지정
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12); // 0.12초 동안 40Hz까지 주파수를 떨어뜨려 오답음 연출
            gain.gain.setValueAtTime(0.4, now); // 시작 볼륨 0.4 지정
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12); // 0.12초 동안 볼륨 줄이기
            osc.start(now); // 소리 재생 시작
            osc.stop(now + 0.12); // 0.12초 후 소리 정지
        } else if (type === 'win') { // 게임 클리어(승리) 시 효과음 설정
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => { // 도-미-솔-도 4개 음계 주파수를 순회
                const winOsc = audioCtx.createOscillator(); // 음마다 개별 오실레이터 생성
                const winGain = audioCtx.createGain(); // 음마다 개별 볼륨 노드 생성
                winOsc.connect(winGain); // 오실레이터와 볼륨 노드 연결
                winGain.connect(audioCtx.destination); // 스피커 연결
                winOsc.type = 'square'; // 픽셀 게임 스타일의 사각형파 파형 선택
                winOsc.frequency.value = freq; // 각 순서에 맞는 주파수 할당
                winGain.gain.setValueAtTime(0.2, now + idx * 0.1); // 0.1초 간격으로 순차적으로 볼륨 설정
                winGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.2); // 각 음마다 0.2초간 울린 후 감쇄
                winOsc.start(now + idx * 0.1); // 차례대로 재생 시작
                winOsc.stop(now + idx * 0.1 + 0.2); // 각 음 재생 종료
            });
        } else if (type === 'click') { // 버튼 클릭 시 효과음 설정
            osc.type = 'triangle'; // 삼각파 파형 선택
            osc.frequency.setValueAtTime(400, now); // 주파수를 400Hz로 지정
            gain.gain.setValueAtTime(0.2, now); // 시작 볼륨 0.2 지정
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04); // 0.04초 동안 매우 짧게 감소
            osc.start(now); // 소리 재생 시작
            osc.stop(now + 0.04); // 0.04초 후 소리 정지
        }
    } catch (e) {
        console.error("Audio play error:", e); // 예외 발생 시 콘솔에 에러 출력
    }
}

// 알파벳 대소문자 및 숫자 중에서 무작위 캐릭터 1개를 생성하는 함수
function getRandomChar() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // 후보 문자열
    return chars[Math.floor(Math.random() * chars.length)]; // 무작위 인덱스의 문자 1개 반환
}

// 화면의 타겟 글자를 무작위 문자로 새로 세팅하는 함수
function setNewTargetChar() {
    if (targetCharElement) targetCharElement.innerText = getRandomChar(); // 무작위 글자 적용
}

// 정답/오답 입력 시 시각적 애니메이션 및 소리 피드백을 발생시키는 함수
function triggerFeedback(isCorrect) {
    if (!targetSlot) return; // 요소가 없으면 종료
    const className = isCorrect ? 'correct' : 'wrong'; // 정답 여부에 따라 CSS 클래스명 선택
    targetSlot.classList.add(className); // 테두리 색상 등을 바꿀 CSS 클래스 추가
    playMcSound(isCorrect ? 'correct' : 'wrong'); // 결과에 맞는 효과음 재생
    
    setTimeout(() => {
        targetSlot.classList.remove(className); // 0.15초 후 피드백 CSS 클래스 제거 (반응 효과)
    }, 150);
}

// 사용자의 키보드 입력을 검사하고 점수를 계산하는 함수
function checkInput(event) {
    if (!isGameRunning || event.isComposing) return; // 게임 중이 아니거나 한글 조합 중이면 무시

    const ignoredKeys = [ // 입력으로 인정하지 않을 제어키 목록 배열
        ' ', 'Enter', 'Tab', 'Escape', 
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Backspace', 'Process'
    ];
    
    if (ignoredKeys.includes(event.key)) { // 입력된 키가 무시 목록에 있으면
        event.preventDefault(); // 브라우저 기본 동작 방지
        return; // 판정 없이 함수 종료
    }

    if (event.key.length !== 1) return; // 특수 조합키 등 1글자가 아닌 입력은 제외

    const inputChar = event.key; // 사용자가 실제 누른 문자 저장
    const targetChar = targetCharElement ? targetCharElement.innerText : ''; // 현재 타겟 문자 저장

    if (inputChar === targetChar) { // 입력문자와 타겟문자가 완벽히 일치하면 (대소문자 구별)
        score += 10; // 점수 10점 추가
        triggerFeedback(true); // 정답 피드백 실행
    } else { // 불일치할 경우
        score -= 5; // 점수 5점 감점
        triggerFeedback(false); // 오답 피드백 실행
    }

    score = Math.max(0, Math.min(100, score)); // 점수가 0점 밑으로 내려가지 않고 100점을 넘지 않도록 보정
    if (scoreSpan) scoreSpan.innerText = score; // 화면의 점수 텍스트 갱신

    if (score >= 100) { // 목표 점수인 100점에 도달하면
        endGame(true); // 승리 모드로 게임 종료
    } else { // 100점 미만이면
        setNewTargetChar(); // 다음 타겟 글자 세팅
    }
}

// 1초마다 남은 제한시간을 1초씩 줄이는 함수
function updateTimer() {
    timeLeft--; // 시간 1 감소
    if (timerSpan) timerSpan.innerText = timeLeft; // 화면의 타이머 텍스트 갱신

    if (timeLeft <= 0) { // 남은 시간이 0 이하가 되면
        endGame(false); // 패배 모드로 게임 종료
    }
}

// 게임을 정지시키고 결과 화면 및 안내창을 출력하는 함수
function endGame(isWin) {
    clearInterval(gameInterval); // 진행 중인 타이머 타이머 정지
    clearInterval(countdownInterval); // 카운트다운 타이머 정지
    isGameRunning = false; // 게임 진행 상태를 false로 변경
    document.removeEventListener('keydown', checkInput); // 키보드 입력 감지 이벤트 해제
    if (startButton) startButton.disabled = false; // 게임 시작 버튼 다시 활성화

    if (isWin) { // 승리했을 경우
        if (targetCharElement) targetCharElement.innerText = 'CLEAR!'; // 타겟 영역에 CLEAR! 출력
        playMcSound('win'); // 승리 효과음 재생
        setTimeout(() => alert('🎉 Game Clear!'), 50); // 0.05초 후 성공 알림창 팝업
    } else { // 패배(시간초과)했을 경우
        if (targetCharElement) targetCharElement.innerText = 'END'; // 타겟 영역에 END 출력
        setTimeout(() => alert(`⏰ Time Out! Score: ${score}`), 50); // 0.05초 후 최종 점수 알림창 팝업
    }
}

// 1. START 버튼 클릭 시 3·2·1 GO! 카운트다운을 구동하는 함수
function startGame() {
    initAudio(); // 오디오 객체 초기화
    playMcSound('click'); // 클릭 효과음 재생

    if (isGameRunning || countdownInterval) return; // 이미 게임 또는 카운트다운 진행 중이면 중복 실행 막음

    if (startButton) {
        startButton.blur(); // 시작 버튼의 포커스를 제거하여 엔터키 재입력 시 클릭되는 것 방지
        startButton.disabled = true; // 시작 버튼 비활성화 (중복 클릭 방지)
    }

    let count = 3; // 카운트다운 초기값 3으로 설정
    if (targetCharElement) targetCharElement.innerText = count; // 화면 타겟 영역에 숫자 3 표시

    countdownInterval = setInterval(() => { // 1초 간격 반복 실행
        count--; // 카운트 1 감소
        if (count > 0) {
            if (targetCharElement) targetCharElement.innerText = count; // 카운트 숫자(2, 1) 표시
        } else if (count === 0) {
            if (targetCharElement) targetCharElement.innerText = 'GO!'; // 0이 되면 GO! 표시
        } else {
            clearInterval(countdownInterval); // 카운트다운 인터벌 종료
            countdownInterval = null; // 카운트다운 변수 리셋
            runActualGame(); // 카운트다운 종료 후 본 게임 시작 함수 호출
        }
    }, 1000); // 1000ms (1초) 마다 반복
}

// 2. 카운트다운 완료 후 실질적인 게임 로직을 시작시키는 함수
function runActualGame() {
    isGameRunning = true; // 게임 상태를 진행 중(true)으로 변경
    score = 0; // 점수 0점으로 리셋
    timeLeft = 20; // 제한시간 20초로 리셋

    if (scoreSpan) scoreSpan.innerText = score; // 화면 점수 표시를 0으로 갱신
    if (timerSpan) timerSpan.innerText = timeLeft; // 화면 타이머 표시를 20으로 갱신

    setNewTargetChar(); // 첫 번째 입력 타겟 문자 무작위 할당
    gameInterval = setInterval(updateTimer, 1000); // 1초마다 updateTimer 실행하는 메인 타이머 시작
    
    document.addEventListener('keydown', checkInput); // 키보드 누름 감지 리스너 등록
    if (mobileInput) mobileInput.focus(); // 모바일 환경을 위해 숨김 input에 가상 키보드 포커스 지정
}

// 3. RESET 버튼 클릭 시 진행 상황을 초기 상태로 되돌리는 함수
function resetGame() {
    initAudio(); // 오디오 객체 초기화
    playMcSound('click'); // 클릭 효과음 재생
    if (resetButton) resetButton.blur(); // 리셋 버튼 포커스 해제

    clearInterval(gameInterval); // 타이머 타이머 정지
    clearInterval(countdownInterval); // 진행 중이던 카운트다운 정지
    countdownInterval = null; // 카운트다운 변수 초기화
    
    isGameRunning = false; // 게임 진행 상태를 false로 지정
    score = 0; // 점수 초기화
    timeLeft = 20; // 제한시간 초기화

    if (scoreSpan) scoreSpan.innerText = '0'; // 화면 점수표시 '0'으로 초기화
    if (timerSpan) timerSpan.innerText = '20'; // 화면 타이머표시 '20'으로 초기화
    if (targetCharElement) targetCharElement.innerText = '?'; // 타겟 글자 표시 '?'로 초기화
    if (startButton) startButton.disabled = false; // 시작 버튼 다시 클릭 가능하도록 설정

    document.removeEventListener('keydown', checkInput); // 등록해둔 키보드 입력 이벤트 제거
}