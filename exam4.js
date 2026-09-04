let score = 0;
let timeLeft = 20;
let gameInterval = null;
let countdownInterval = null; // 카운트다운 타이머 변수 추가
let isGameRunning = false;

// DOM 요소 변수 선언
let targetSlot, targetCharElement, scoreSpan, timerSpan, startButton, resetButton, mobileInput;

// HTML 로드가 완료된 후 DOM 요소 연결
document.addEventListener('DOMContentLoaded', () => {
    targetSlot = document.querySelector('.target-slot');
    targetCharElement = document.getElementById('targetChar');
    scoreSpan = document.querySelector('#score span span');
    timerSpan = document.querySelector('#timer span span');
    startButton = document.getElementById('startButton');
    resetButton = document.getElementById('resetButton');
    mobileInput = document.getElementById('mobileInput');

    if (startButton) startButton.addEventListener('click', startGame);
    if (resetButton) resetButton.addEventListener('click', resetGame);
});

// 오디오 엔진
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playMcSound(type) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800 + (score * 5), now);
            osc.frequency.exponentialRampToValueAtTime(1200 + (score * 5), now + 0.08);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'win') {
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const winOsc = audioCtx.createOscillator();
                const winGain = audioCtx.createGain();
                winOsc.connect(winGain);
                winGain.connect(audioCtx.destination);
                winOsc.type = 'square';
                winOsc.frequency.value = freq;
                winGain.gain.setValueAtTime(0.2, now + idx * 0.1);
                winGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.2);
                winOsc.start(now + idx * 0.1);
                winOsc.stop(now + idx * 0.1 + 0.2);
            });
        } else if (type === 'click') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        }
    } catch (e) {
        console.error("Audio play error:", e);
    }
}

function getRandomChar() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return chars[Math.floor(Math.random() * chars.length)];
}

function setNewTargetChar() {
    if (targetCharElement) targetCharElement.innerText = getRandomChar();
}

function triggerFeedback(isCorrect) {
    if (!targetSlot) return;
    const className = isCorrect ? 'correct' : 'wrong';
    targetSlot.classList.add(className);
    playMcSound(isCorrect ? 'correct' : 'wrong');
    
    setTimeout(() => {
        targetSlot.classList.remove(className);
    }, 150);
}

function checkInput(event) {
    if (!isGameRunning || event.isComposing) return;

    const ignoredKeys = [
        ' ', 'Enter', 'Tab', 'Escape', 
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Backspace', 'Process'
    ];
    
    if (ignoredKeys.includes(event.key)) {
        event.preventDefault();
        return;
    }

    if (event.key.length !== 1) return;

    const inputChar = event.key;
    const targetChar = targetCharElement ? targetCharElement.innerText : '';

    if (inputChar === targetChar) {
        score += 10;
        triggerFeedback(true);
    } else {
        score -= 5;
        triggerFeedback(false);
    }

    score = Math.max(0, Math.min(100, score));
    if (scoreSpan) scoreSpan.innerText = score;

    if (score >= 100) {
        endGame(true);
    } else {
        setNewTargetChar();
    }
}

function updateTimer() {
    timeLeft--;
    if (timerSpan) timerSpan.innerText = timeLeft;

    if (timeLeft <= 0) {
        endGame(false);
    }
}

function endGame(isWin) {
    clearInterval(gameInterval);
    clearInterval(countdownInterval);
    isGameRunning = false;
    document.removeEventListener('keydown', checkInput);
    if (startButton) startButton.disabled = false;

    if (isWin) {
        if (targetCharElement) targetCharElement.innerText = 'CLEAR!';
        playMcSound('win');
        setTimeout(() => alert('🎉 Game Clear!'), 50);
    } else {
        if (targetCharElement) targetCharElement.innerText = 'END';
        setTimeout(() => alert(`⏰ Time Out! Score: ${score}`), 50);
    }
}

// 1. START 버튼 클릭 시 3·2·1 GO! 카운트다운 실행
function startGame() {
    initAudio();
    playMcSound('click');

    if (isGameRunning || countdownInterval) return;

    if (startButton) {
        startButton.blur();
        startButton.disabled = true;
    }

    let count = 3;
    if (targetCharElement) targetCharElement.innerText = count;

    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            if (targetCharElement) targetCharElement.innerText = count;
        } else if (count === 0) {
            if (targetCharElement) targetCharElement.innerText = 'GO!';
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            runActualGame(); // 카운트다운 종료 후 본 게임 시작
        }
    }, 1000);
}

// 2. 카운트다운 완료 후 호출되는 실제 게임 실행 함수
function runActualGame() {
    isGameRunning = true;
    score = 0;
    timeLeft = 20;

    if (scoreSpan) scoreSpan.innerText = score;
    if (timerSpan) timerSpan.innerText = timeLeft;

    setNewTargetChar();
    gameInterval = setInterval(updateTimer, 1000);
    
    document.addEventListener('keydown', checkInput);
    if (mobileInput) mobileInput.focus();
}

// 3. 리셋 버튼 클릭 시 진행 중인 카운트다운도 함께 초기화
function resetGame() {
    initAudio();
    playMcSound('click');
    if (resetButton) resetButton.blur();

    clearInterval(gameInterval);
    clearInterval(countdownInterval);
    countdownInterval = null;
    
    isGameRunning = false;
    score = 0;
    timeLeft = 20;

    if (scoreSpan) scoreSpan.innerText = '0';
    if (timerSpan) timerSpan.innerText = '20';
    if (targetCharElement) targetCharElement.innerText = '?';
    if (startButton) startButton.disabled = false;

    document.removeEventListener('keydown', checkInput);
}