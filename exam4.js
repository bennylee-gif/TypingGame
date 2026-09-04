let score = 0;
let timeLeft = 20;
let gameInterval = null;
let isGameRunning = false;

// DOM 요소
const targetSlot = document.querySelector('.target-slot');
const targetCharElement = document.getElementById('targetChar');
const scoreSpan = document.querySelector('#score span span');
const timerSpan = document.querySelector('#timer span span');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const mobileInput = document.getElementById('mobileInput');

// 오디오 엔진
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume(); // 오디오 차단 정책 해제
    }
}

function playMcSound(type) {
    if (!audioCtx) return;
    
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
}

function getRandomChar() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return chars[Math.floor(Math.random() * chars.length)];
}

function setNewTargetChar() {
    targetCharElement.innerText = getRandomChar();
}

function triggerFeedback(isCorrect) {
    const className = isCorrect ? 'correct' : 'wrong';
    targetSlot.classList.add(className);
    playMcSound(isCorrect ? 'correct' : 'wrong');
    
    setTimeout(() => {
        targetSlot.classList.remove(className);
    }, 150);
}

function checkInput(event) {
    if (!isGameRunning || event.key.length !== 1) return;

    const inputChar = event.key;
    const targetChar = targetCharElement.innerText;

    if (inputChar === targetChar) {
        score += 10;
        triggerFeedback(true);
    } else {
        score -= 5;
        triggerFeedback(false);
    }

    score = Math.max(0, Math.min(100, score));
    scoreSpan.innerText = score;

    if (score >= 100) {
        endGame(true);
    } else {
        setNewTargetChar();
    }
}

function updateTimer() {
    timeLeft--;
    timerSpan.innerText = timeLeft;

    if (timeLeft <= 0) {
        endGame(false);
    }
}

function endGame(isWin) {
    clearInterval(gameInterval);
    isGameRunning = false;
    document.removeEventListener('keydown', checkInput);
    startButton.disabled = false;

    if (isWin) {
        targetCharElement.innerText = 'CLEAR!';
        playMcSound('win');
        setTimeout(() => alert('🎉 Game Clear!'), 50);
    } else {
        targetCharElement.innerText = 'END';
        setTimeout(() => alert(`⏰ Time Out! Score: ${score}`), 50);
    }
}

function startGame() {
    initAudio();
    playMcSound('click');

    if (isGameRunning) return;

    // 포커스 제거 (Space/Enter 입력 시 버튼 중복 실행 방지)
    startButton.blur();

    isGameRunning = true;
    score = 0;
    timeLeft = 20;

    scoreSpan.innerText = score;
    timerSpan.innerText = timeLeft;
    startButton.disabled = true;

    setNewTargetChar();
    gameInterval = setInterval(updateTimer, 1000);
    
    document.addEventListener('keydown', checkInput);
    if (mobileInput) mobileInput.focus(); // 모바일 가상 키보드 대응
}

function resetGame() {
    initAudio();
    playMcSound('click');
    resetButton.blur();

    clearInterval(gameInterval);
    isGameRunning = false;
    score = 0;
    timeLeft = 20;

    scoreSpan.innerText = '0';
    timerSpan.innerText = '20';
    targetCharElement.innerText = '?';
    startButton.disabled = false;

    document.removeEventListener('keydown', checkInput);
}

startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);