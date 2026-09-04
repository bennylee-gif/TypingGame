let score = 0;
let timeLeft = 20;
let gameInterval = null;
let isGameRunning = false;
let highScore = Number(localStorage.getItem('typingGameHighScore')) || 0;

// DOM 요소 변수 선언
let targetSlot, targetCharElement, targetTypeElement, scoreSpan, timerSpan, highScoreSpan, scoreNotification, startButton, resetButton, mobileInput;

// HTML 로드가 완료된 후 DOM 요소 연결
document.addEventListener('DOMContentLoaded', () => {
    targetSlot = document.querySelector('.target-slot');
    targetCharElement = document.getElementById('targetChar');
    targetTypeElement = document.getElementById('targetType');
    scoreSpan = document.querySelector('#score span span');
    timerSpan = document.querySelector('#timer span span');
    highScoreSpan = document.querySelector('#highScore span span');
    scoreNotification = document.getElementById('scoreNotification');
    startButton = document.getElementById('startButton');
    resetButton = document.getElementById('resetButton');
    mobileInput = document.getElementById('mobileInput');

    if (startButton) startButton.addEventListener('click', startGame);
    if (resetButton) resetButton.addEventListener('click', resetGame);
    updateHighScore();
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
    const newChar = getRandomChar();
    if (targetCharElement) targetCharElement.innerText = newChar;
    if (targetTypeElement) {
        targetTypeElement.innerText = /[A-Z]/.test(newChar) ? '대문자 (A-Z)' : /[a-z]/.test(newChar) ? '소문자 (a-z)' : '숫자 (0-9)';
    }
}

function updateHighScore() {
    if (highScoreSpan) highScoreSpan.innerText = highScore;
}

function showScoreNotification(points) {
    if (!scoreNotification) return;
    scoreNotification.innerText = `${points > 0 ? '+' : ''}${points}점`;
    scoreNotification.className = `score-notification ${points > 0 ? 'positive' : points < 0 ? 'negative' : 'neutral'}`;
    clearTimeout(showScoreNotification.timeoutId);
    showScoreNotification.timeoutId = setTimeout(() => {
        scoreNotification.className = 'score-notification';
    }, 900);
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

    // 예외 처리할 제어키 및 특수키 리스트
    const ignoredKeys = [
        ' ', 'Enter', 'Tab', 'Escape', 
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Backspace', 'Process'
    ];
    
    if (ignoredKeys.includes(event.key)) {
        event.preventDefault();
        return;
    }

    // 길이가 1이 아닌 입력(기능키 등) 무시
    if (event.key.length !== 1) return;

    const inputChar = event.key;
    const targetChar = targetCharElement ? targetCharElement.innerText : '';

    let points;
    if (inputChar === targetChar) {
        points = 10;
        triggerFeedback(true);
    } else if (/[A-Za-z]/.test(targetChar) && inputChar.toLowerCase() === targetChar.toLowerCase()) {
        points = 0;
        triggerFeedback(false);
    } else {
        points = -10;
        triggerFeedback(false);
    }

    score = Math.max(0, score + points);
    if (scoreSpan) scoreSpan.innerText = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('typingGameHighScore', highScore);
        updateHighScore();
    }
    showScoreNotification(points);
    setNewTargetChar();
}

function updateTimer() {
    timeLeft--;
    if (timerSpan) timerSpan.innerText = timeLeft;

    if (timeLeft <= 0) {
        endGame(false);
    }
}

function endGame() {
    clearInterval(gameInterval);
    isGameRunning = false;
    document.removeEventListener('keydown', checkInput);
    if (startButton) startButton.disabled = false;

    if (targetCharElement) targetCharElement.innerText = 'END';
    setTimeout(() => alert(`⏰ Time Out! Score: ${score}`), 50);
}

function startGame() {
    initAudio();
    playMcSound('click');

    if (isGameRunning) return;

    if (startButton) startButton.blur();

    isGameRunning = true;
    score = 0;
    timeLeft = 20;

    if (scoreSpan) scoreSpan.innerText = score;
    if (timerSpan) timerSpan.innerText = timeLeft;
    if (startButton) startButton.disabled = true;

    setNewTargetChar();
    gameInterval = setInterval(updateTimer, 1000);
    
    document.addEventListener('keydown', checkInput);
    if (mobileInput) mobileInput.focus();
}

function resetGame() {
    initAudio();
    playMcSound('click');
    if (resetButton) resetButton.blur();

    clearInterval(gameInterval);
    isGameRunning = false;
    score = 0;
    timeLeft = 20;

    if (scoreSpan) scoreSpan.innerText = '0';
    if (timerSpan) timerSpan.innerText = '20';
    if (targetCharElement) targetCharElement.innerText = '?';
    if (targetTypeElement) targetTypeElement.innerText = '문자를 확인하세요';
    if (startButton) startButton.disabled = false;

    document.removeEventListener('keydown', checkInput);
}