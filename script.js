const wordsBox = document.getElementById("words");
const wordCount = document.getElementById("wordCount");

const speed = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");

const gap = document.getElementById("gap");
const gapValue = document.getElementById("gapValue");

const repeat = document.getElementById("repeat");
const random = document.getElementById("random");

const voiceSelect = document.getElementById("voice");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resumeBtn = document.getElementById("resume");
const stopBtn = document.getElementById("stop");

const currentWord = document.getElementById("currentWord");
const progress = document.getElementById("progress");
const progressFill = document.getElementById("progressFill");
const status = document.getElementById("status");

let words = [];
let index = 0;
let running = false;
let paused = false;
let gapTimer = null;
let voices = [];

function readWords() {
    return wordsBox.value
        .split(/[\n,]+/)
        .map(x => x.trim())
        .filter(x => x.length > 0);
}

function updateWordCount() {
    const list = readWords();
    wordCount.textContent =
        list.length +
        (list.length === 1 ? " word" : " words");
}

wordsBox.addEventListener("input", updateWordCount);

function updateSpeed() {
    const value = Number(speed.value);
    speedValue.textContent =
        value.toFixed(2) + "×";
}

speed.addEventListener("input", updateSpeed);

function updateGap() {
    const value = Number(gap.value);
    gapValue.textContent =
        value.toFixed(1) + " sec";
}

gap.addEventListener("input", updateGap);

function shuffle(list) {
    const result = [...list];

    for (let i = result.length - 1; i > 0; i--) {
        const j =
            Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] =
            [result[j], result[i]];
    }

    return result;
}

function loadVoices() {
    voices = speechSynthesis.getVoices();

    voiceSelect.innerHTML = "";

    if (voices.length === 0) {
        const option =
            document.createElement("option");

        option.textContent =
            "Browser default voice";

        option.value = "";

        voiceSelect.appendChild(option);

        return;
    }

    voices.forEach((voice, i) => {
        const option =
            document.createElement("option");

        option.value = i;

        option.textContent =
            voice.name + " — " + voice.lang;

        voiceSelect.appendChild(option);
    });

    const indian =
        voices.findIndex(
            voice =>
                voice.lang
                    .toLowerCase()
                    .startsWith("en-in")
        );

    if (indian !== -1) {
        voiceSelect.value = indian;
    }
}

speechSynthesis.onvoiceschanged =
    loadVoices;

loadVoices();

function updateDisplay() {
    const total = words.length;

    if (total > 0 && index < total) {
        currentWord.textContent =
            words[index];

        progress.textContent =
            `${index + 1} / ${total}`;

        progressFill.style.width =
            `${((index + 1) / total) * 100}%`;
    }
}

function speakWord() {
    if (!running || paused) {
        return;
    }

    if (index >= words.length) {

        if (!repeat.checked) {
            running = false;

            currentWord.textContent =
                "Finished ✓";

            status.textContent =
                "Practice complete.";

            progressFill.style.width =
                "100%";

            return;
        }

        index = 0;

        if (random.checked) {
            words = shuffle(words);
        }
    }

    const word = words[index];

    updateDisplay();

    status.textContent =
        "Speaking";

    const utterance =
        new SpeechSynthesisUtterance(word);

    let rate =
        Number(speed.value);

    if (rate < 0.10) {
        rate = 0.10;
    }

    if (rate > 2.50) {
        rate = 2.50;
    }

    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "en-IN";

    const selected =
        voices[
            Number(voiceSelect.value)
        ];

    if (selected) {
        utterance.voice =
            selected;
    }

    utterance.onend =
        function () {

            if (!running || paused) {
                return;
            }

            index++;

            const milliseconds =
                Number(gap.value) * 1000;

            status.textContent =
                `Waiting ${Number(gap.value).toFixed(1)} sec`;

            gapTimer =
                setTimeout(
                    function () {

                        if (running && !paused) {
                            speakWord();
                        }

                    },
                    milliseconds
                );
        };

    utterance.onerror =
        function (event) {

            if (event.error !== "canceled") {

                status.textContent =
                    "Voice error: " +
                    event.error;
            }
        };

    speechSynthesis.cancel();

    speechSynthesis.speak(
        utterance
    );
}

startBtn.addEventListener(
    "click",
    function () {

        speechSynthesis.cancel();

        clearTimeout(gapTimer);

        const input =
            readWords();

        if (input.length === 0) {

            status.textContent =
                "Enter words first.";

            return;
        }

        words = [...input];

        index = 0;

        running = true;

        paused = false;

        if (random.checked) {
            words = shuffle(words);
        }

        currentWord.textContent =
            words[0];

        progress.textContent =
            `1 / ${words.length}`;

        progressFill.style.width =
            `${100 / words.length}%`;

        status.textContent =
            "Starting";

        setTimeout(
            function () {
                speakWord();
            },
            200
        );
    }
);

pauseBtn.addEventListener(
    "click",
    function () {

        if (!running) return;

        paused = true;

        speechSynthesis.pause();

        clearTimeout(gapTimer);

        status.textContent =
            "Paused";
    }
);

resumeBtn.addEventListener(
    "click",
    function () {

        if (!running) return;

        if (!paused) return;

        paused = false;

        if (speechSynthesis.paused) {

            speechSynthesis.resume();

            status.textContent =
                "Speaking";

            return;
        }

        speakWord();
    }
);

stopBtn.addEventListener(
    "click",
    function () {

        running = false;

        paused = false;

        speechSynthesis.cancel();

        clearTimeout(gapTimer);

        index = 0;

        currentWord.textContent =
            "Ready";

        progress.textContent =
            "0 / " + words.length;

        progressFill.style.width =
            "0%";

        status.textContent =
            "Stopped.";
    }
);

updateWordCount();
updateSpeed();
updateGap();
