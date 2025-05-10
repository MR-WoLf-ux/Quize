let questions = [];
let loadedQuestions = [];
let userAnswers = {};
let currentQuestionIndex = 0;
let currentTimer = null;

// Theme Toggle Functionality
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

function toggleQuestionForm() {
    const questionType = document.getElementById("question-type").value;
    const questionForm = document.getElementById("question-form");
    questionForm.innerHTML = "";

    if (questionType === "multiple-choice") {
        questionForm.innerHTML = `
                    <div class="question-block">
                        <textarea id="question-text" placeholder="متن سوال را وارد کنید"></textarea>
                        <input type="number" id="option-count" min="2" max="10" placeholder="تعداد گزینه‌ها" onchange="updateOptionInputs()">
                        <input type="number" id="timer-input" min="0" placeholder="زمان (ثانیه، 0 برای بدون زمان)">
                        <div id="options-container"></div>
                        <input type="text" id="correct-answer" placeholder="شماره گزینه صحیح">
                    </div>
                `;
        updateOptionInputs();
    } else if (questionType === "matching") {
        questionForm.innerHTML = `
                    <div class="question-block">
                        <textarea id="question-text" placeholder="متن سوال را وارد کنید (مثال: موارد را جور کنید)"></textarea>
                        <input type="number" id="pair-count" min="2" max="10" placeholder="تعداد جفت‌ها" onchange="updatePairInputs()">
                        <input type="number" id="timer-input" min="0" placeholder="زمان (ثانیه، 0 برای بدون زمان)">
                        <div id="pairs-container"></div>
                    </div>
                `;
        updatePairInputs();
    } else if (questionType === "true-false") {
        questionForm.innerHTML = `
                    <div class="question-block">
                        <textarea id="question-text" placeholder="متن سوال را وارد کنید"></textarea>
                        <input type="number" id="timer-input" min="0" placeholder="زمان (ثانیه، 0 برای بدون زمان)">
                        <select id="correct-answer">
                            <option value="true">درست</option>
                            <option value="false">غلط</option>
                        </select>
                    </div>
                `;
    } else if (questionType === "fill-in-the-blank") {
        questionForm.innerHTML = `
                    <div class="question-block">
                        <textarea id="question-text" placeholder="متن سوال را وارد کنید (جای خالی را با __ مشخص کنید)"></textarea>
                        <input type="text" id="correct-answer" placeholder="پاسخ صحیح برای جای خالی">
                        <input type="number" id="timer-input" min="0" placeholder="زمان (ثانیه، 0 برای بدون زمان)">
                    </div>
                `;
    }
}

function updateOptionInputs() {
    const optionCount =
        parseInt(document.getElementById("option-count").value) || 2;
    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    for (let i = 1; i <= Math.min(optionCount, 10); i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "option-input";
        input.placeholder = `گزینه ${i}`;
        optionsContainer.appendChild(input);
    }
}

function updatePairInputs() {
    const pairCount =
        parseInt(document.getElementById("pair-count").value) || 2;
    const pairsContainer = document.getElementById("pairs-container");
    pairsContainer.innerHTML = "";

    for (let i = 1; i <= Math.min(pairCount, 10); i++) {
        const pairDiv = document.createElement("div");
        pairDiv.className = "pair";
        pairDiv.innerHTML = `
                    <input type="text" class="left-pair" placeholder="مورد سمت چپ ${i}">
                    <input type="text" class="right-pair" placeholder="مورد سمت راست ${i}">
                `;
        pairsContainer.appendChild(pairDiv);
    }
}

function addQuestion() {
    const questionType = document.getElementById("question-type").value;
    const questionText = document.getElementById("question-text").value.trim();
    const timerInput = document.getElementById("timer-input")
        ? parseInt(document.getElementById("timer-input").value) || 0
        : 0;

    if (!questionText) {
        alert("لطفا متن سوال را وارد کنید!");
        return;
    }

    let question;

    if (questionType === "multiple-choice") {
        const correctAnswer = document.getElementById("correct-answer").value;
        const options = Array.from(
            document.getElementsByClassName("option-input")
        ).map((input) => input.value);
        const optionCount =
            parseInt(document.getElementById("option-count").value) || 2;

        if (
            options.some((opt) => !opt) ||
            !correctAnswer ||
            isNaN(correctAnswer) ||
            correctAnswer < 1 ||
            correctAnswer > optionCount
        ) {
            alert(
                "لطفا تمام فیلدها را به درستی پر کنید و شماره گزینه صحیح معتبر باشد!"
            );
            return;
        }

        question = {
            type: "multiple-choice",
            text: questionText,
            options: options,
            correctAnswer: parseInt(correctAnswer),
            timer: timerInput,
        };
    } else if (questionType === "matching") {
        const leftPairs = Array.from(
            document.getElementsByClassName("left-pair")
        ).map((input) => input.value);
        const rightPairs = Array.from(
            document.getElementsByClassName("right-pair")
        ).map((input) => input.value);

        if (
            leftPairs.some((pair) => !pair) ||
            rightPairs.some((pair) => !pair)
        ) {
            alert("لطفا تمام جفت‌ها را پر کنید!");
            return;
        }

        question = {
            type: "matching",
            text: questionText,
            pairs: leftPairs.map((left, i) => ({ left, right: rightPairs[i] })),
            timer: timerInput,
        };
    } else if (questionType === "true-false") {
        const correctAnswer = document.getElementById("correct-answer").value;

        question = {
            type: "true-false",
            text: questionText,
            correctAnswer: correctAnswer === "true",
            timer: timerInput,
        };
    } else if (questionType === "fill-in-the-blank") {
        const correctAnswer = document
            .getElementById("correct-answer")
            .value.trim();

        if (!correctAnswer || !questionText.includes("__")) {
            alert(
                "لطفا پاسخ صحیح را وارد کنید و جای خالی را با __ در متن سوال مشخص کنید!"
            );
            return;
        }

        question = {
            type: "fill-in-the-blank",
            text: questionText,
            correctAnswer: correctAnswer,
            timer: timerInput,
        };
    }

    questions.push(question);
    displayQuestions();

    toggleQuestionForm();
}

function displayQuestions() {
    const questionsList = document.getElementById("questions-list");
    questionsList.innerHTML = "";

    questions.forEach((question, index) => {
        const questionDiv = document.createElement("div");
        let timerText =
            question.timer > 0 ? `(زمان: ${question.timer} ثانیه)` : "";

        if (question.type === "multiple-choice") {
            questionDiv.innerHTML = `
                        <h3>سوال ${
                            index + 1
                        } (چند گزینه‌ای) ${timerText}: ${question.text.replace(
                /\n/g,
                "<br>"
            )}</h3>
                        ${question.options
                            .map(
                                (option, i) => `
                            <div class="option">${i + 1}. ${option} ${
                                    i + 1 === question.correctAnswer
                                        ? "(صحیح)"
                                        : ""
                                }</div>
                        `
                            )
                            .join("")}
                    `;
        } else if (question.type === "matching") {
            questionDiv.innerHTML = `
                        <h3>سوال ${
                            index + 1
                        } (وصل کردن) ${timerText}: ${question.text.replace(
                /\n/g,
                "<br>"
            )}</h3>
                        ${question.pairs
                            .map(
                                (pair, i) => `
                            <div class="pair">${i + 1}. ${pair.left} ↔ ${
                                    pair.right
                                }</div>
                        `
                            )
                            .join("")}
                    `;
        } else if (question.type === "true-false") {
            questionDiv.innerHTML = `
                        <h3>سوال ${
                            index + 1
                        } (درست/غلط) ${timerText}: ${question.text.replace(
                /\n/g,
                "<br>"
            )}</h3>
                        <div class="option">پاسخ صحیح: ${
                            question.correctAnswer ? "درست" : "غلط"
                        }</div>
                    `;
        } else if (question.type === "fill-in-the-blank") {
            questionDiv.innerHTML = `
                        <h3>سوال ${
                            index + 1
                        } (جای خالی) ${timerText}: ${question.text.replace(
                /\n/g,
                "<br>"
            )}</h3>
                        <div class="option">پاسخ صحیح: ${
                            question.correctAnswer
                        }</div>
                    `;
        }
        questionsList.appendChild(questionDiv);
    });
}

function saveQuiz() {
    if (questions.length === 0) {
        alert("هیچ سوالی اضافه نشده است!");
        return;
    }

    const quizData = JSON.stringify(questions);
    const blob = new Blob([quizData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz.json";
    a.click();
    URL.revokeObjectURL(url);
}

function loadQuiz() {
    const fileInput = document.getElementById("quiz-file");
    if (!fileInput.files.length) {
        alert("لطفا یک فایل کوییز انتخاب کنید!");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            loadedQuestions = JSON.parse(e.target.result);
            userAnswers = {};
            currentQuestionIndex = 0;
            displayQuizPlayer();
            document.getElementById("submit-quiz").style.display = "block";
        } catch (err) {
            alert("فایل کوییز نامعتبر است!");
        }
    };
    reader.readAsText(file);
}

function displayQuizPlayer() {
    const quizPlayerContent = document.getElementById("quiz-player-content");
    quizPlayerContent.innerHTML = "";

    loadedQuestions.forEach((question, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.className = `question-container ${
            index !== currentQuestionIndex ? "disabled" : ""
        }`;
        questionDiv.id = `question-${index}`;
        let timerHtml =
            question.timer > 0
                ? `
                    <div class="timer-container">
                        <div class="timer" id="timer-${index}">${
                      index === currentQuestionIndex
                          ? `زمان باقی‌مانده: ${question.timer} ثانیه`
                          : "در انتظار"
                  }</div>
                        <div class="progress-bar" id="progress-bar-${index}">
                            <div class="progress-bar-fill" style="width: 100%;"></div>
                        </div>
                    </div>
                `
                : "";

        if (question.type === "multiple-choice") {
            questionDiv.innerHTML = `
                        <h3>سوال ${index + 1}: ${question.text.replace(
                /\n/g,
                "<br>"
            )}</h3>
                        ${timerHtml}
                        ${question.options
                            .map(
                                (option, i) => `
                            <div class="option">
                                <label><input type="radio" name="q${index}" value="${
                                    i + 1
                                }" ${
                                    index !== currentQuestionIndex
                                        ? "disabled"
                                        : ""
                                }> ${i + 1}. ${option}</label>
                            </div>
                        `
                            )
                            .join("")}
                        <button class="submit-answer-btn" onclick="submitAnswer(${index})" ${
                index !== currentQuestionIndex ? "disabled" : ""
            }>پاسخ دادم</button>
                    `;
        } else if (question.type === "matching") {
            const rightOptions = question.pairs
                .map((p) => p.right)
                .sort(() => Math.random() - 0.5);
            questionDiv.innerHTML = `
                        <h3>سوال ${index + 1}: ${question.text.replace(
                /\n/g,
                "<br>"
            )}</h3>
                        ${timerHtml}
                        <div class="drag-container" id="drag-container-${index}">
                            ${rightOptions
                                .map(
                                    (opt) => `
                                <div class="drag-item" draggable="true" data-value="${opt}" ondragstart="dragStart(event)" ondragend="dragEnd(event)">${opt}</div>
                            `
                                )
                                .join("")}
                        </div>
                        ${question.pairs
                            .map(
                                (pair, i) => `
                            <div class="pair">
                                <span class="pair-label">${pair.left}</span>
                                <div class="drop-zone" data-index="${i}" ondragover="dragOver(event)" ondrop="drop(event, ${index})" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" id="drop-zone-${index}-${i}"></div>
                            </div>
                        `
                            )
                            .join("")}
                        <button class="submit-answer-btn" onclick="submitAnswer(${index})" ${
                index !== currentQuestionIndex ? "disabled" : ""
            }>پاسخ دادم</button>
                        <button class="reset-btn" onclick="resetMatching(${index})" ${
                index !== currentQuestionIndex ? "disabled" : ""
            }>بازگشت به حالت اولیه</button>
                    `;
        } else if (question.type === "true-false") {
            questionDiv.innerHTML = `
                        <h3>سوال ${index + 1}: ${question.text.replace(
                /\n/g,
                "<br>"
            )}</h3>
                        ${timerHtml}
                        <div class="option">
                            <label><input type="radio" name="q${index}" value="true" ${
                index !== currentQuestionIndex ? "disabled" : ""
            }> درست</label>
                            <label><input type="radio" name="q${index}" value="false" ${
                index !== currentQuestionIndex ? "disabled" : ""
            }> غلط</label>
                        </div>
                        <button class="submit-answer-btn" onclick="submitAnswer(${index})" ${
                index !== currentQuestionIndex ? "disabled" : ""
            }>پاسخ دادم</button>
                    `;
        } else if (question.type === "fill-in-the-blank") {
            questionDiv.innerHTML = `
                        <h3>سوال ${index + 1}: ${question.text
                .replace("__", "__")
                .replace(/\n/g, "<br>")}</h3>
                        ${timerHtml}
                        <input type="text" name="q${index}" class="fill-blank-input" ${
                index !== currentQuestionIndex ? "disabled" : ""
            } placeholder="پاسخ خود را وارد کنید">
                        <button class="submit-answer-btn" onclick="submitAnswer(${index})" ${
                index !== currentQuestionIndex ? "disabled" : ""
            }>پاسخ دادم</button>
                    `;
        }

        quizPlayerContent.appendChild(questionDiv);
    });

    if (loadedQuestions[currentQuestionIndex].timer > 0) {
        startTimer(
            currentQuestionIndex,
            loadedQuestions[currentQuestionIndex].timer
        );
    }
}

// Drag and Drop Functions
let draggedItem = null;

function dragStart(event) {
    draggedItem = event.target;
    event.dataTransfer.setData(
        "text/plain",
        event.target.getAttribute("data-value")
    );
    setTimeout(() => {
        event.target.style.opacity = "0.5";
    }, 0);
}

function dragEnd(event) {
    event.target.style.opacity = "1";
    // Remove highlight from all drop zones
    document
        .querySelectorAll(".drop-zone")
        .forEach((zone) => zone.classList.remove("highlight"));
    draggedItem = null;
}

function dragOver(event) {
    event.preventDefault();
}

function dragEnter(event) {
    const dropZone = event.target.closest(".drop-zone");
    if (dropZone && !dropZone.classList.contains("filled")) {
        dropZone.classList.add("highlight");
    }
}

function dragLeave(event) {
    const dropZone = event.target.closest(".drop-zone");
    if (dropZone) {
        dropZone.classList.remove("highlight");
    }
}

function drop(event, questionIndex) {
    event.preventDefault();
    if (questionIndex !== currentQuestionIndex) return;

    const value = event.dataTransfer.getData("text/plain");
    const dropZone = event.target.closest(".drop-zone");
    if (!dropZone) return;

    dropZone.classList.remove("highlight");
    const dragContainer = document.getElementById(
        `drag-container-${questionIndex}`
    );

    // Handle existing item in drop zone
    const existingItem = dropZone.querySelector(".drag-item");
    if (existingItem) {
        const existingValue = existingItem.getAttribute("data-value");
        existingItem.classList.add("removed");
        setTimeout(() => {
            // Add existing item back to drag container
            const newDragItem = document.createElement("div");
            newDragItem.className = "drag-item";
            newDragItem.setAttribute("draggable", true);
            newDragItem.setAttribute("data-value", existingValue);
            newDragItem.textContent = existingValue;
            newDragItem.addEventListener("dragstart", dragStart);
            newDragItem.addEventListener("dragend", dragEnd);
            dragContainer.appendChild(newDragItem);
            existingItem.remove();
        }, 300);
    }

    // Add new item to drop zone
    const newItem = document.createElement("div");
    newItem.className = "drag-item dropped";
    newItem.setAttribute("draggable", true);
    newItem.setAttribute("data-value", value);
    newItem.textContent = value;
    newItem.addEventListener("dragstart", dragStart);
    newItem.addEventListener("dragend", dragEnd);
    dropZone.appendChild(newItem);
    dropZone.classList.add("filled");

    // Remove dragged item from drag container
    const draggedElement = dragContainer.querySelector(
        `[data-value="${value}"]`
    );
    if (draggedElement) {
        draggedElement.classList.add("removed");
        setTimeout(() => draggedElement.remove(), 300);
    }
}

function resetMatching(questionIndex) {
    if (questionIndex !== currentQuestionIndex) return;

    const dragContainer = document.getElementById(
        `drag-container-${questionIndex}`
    );
    const question = loadedQuestions[questionIndex];
    const rightOptions = question.pairs
        .map((p) => p.right)
        .sort(() => Math.random() - 0.5);

    // Clear all drop zones and return items to drag container
    question.pairs.forEach((_, i) => {
        const dropZone = document.getElementById(
            `drop-zone-${questionIndex}-${i}`
        );
        const existingItem = dropZone.querySelector(".drag-item");
        if (existingItem) {
            existingItem.classList.add("removed");
            setTimeout(() => {
                existingItem.remove();
                dropZone.classList.remove("filled");
            }, 300);
        }
    });

    // Repopulate drag container with original items
    setTimeout(() => {
        dragContainer.innerHTML = rightOptions
            .map(
                (opt) => `
                    <div class="drag-item dropped" draggable="true" data-value="${opt}" ondragstart="dragStart(event)" ondragend="dragEnd(event)">${opt}</div>
                `
            )
            .join("");
    }, 300);
}

function startTimer(questionIndex, duration) {
    let timeLeft = duration;
    const timerElement = document.getElementById(`timer-${questionIndex}`);
    const progressBarFill = document
        .getElementById(`progress-bar-${questionIndex}`)
        .querySelector(".progress-bar-fill");
    currentTimer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `زمان باقی‌مانده: ${timeLeft} ثانیه`;
        const progress = (timeLeft / duration) * 100;
        progressBarFill.style.width = `${progress}%`;

        // Change progress bar color and add blink effect when critical
        if (timeLeft <= 5) {
            progressBarFill.classList.add("critical");
            timerElement.classList.add("critical");
        } else {
            progressBarFill.classList.remove("critical");
            timerElement.classList.remove("critical");
        }

        if (timeLeft <= 0) {
            clearInterval(currentTimer);
            timerElement.textContent = "زمان تمام شد!";
            progressBarFill.style.width = "0%";
            disableQuestion(questionIndex);
            submitAnswer(questionIndex);
        }
    }, 1000);
}

function disableQuestion(questionIndex) {
    const questionDiv = document.getElementById(`question-${questionIndex}`);
    questionDiv.className = `question-container disabled`;
    const inputs = questionDiv.querySelectorAll(
        "input, select, button, .drag-item, .drop-zone"
    );
    inputs.forEach((input) => {
        input.disabled = true;
        input.setAttribute("draggable", false);
        input.style.pointerEvents = "none";
    });
}

function submitAnswer(questionIndex) {
    if (questionIndex !== currentQuestionIndex) return;

    if (currentTimer) {
        clearInterval(currentTimer);
    }

    const question = loadedQuestions[questionIndex];
    if (question.type === "multiple-choice" || question.type === "true-false") {
        const selected = document.querySelector(
            `input[name="q${questionIndex}"]:checked`
        );
        userAnswers[questionIndex] = selected ? selected.value : null;
    } else if (question.type === "matching") {
        userAnswers[questionIndex] = [];
        question.pairs.forEach((_, i) => {
            const dropZone = document.getElementById(
                `drop-zone-${questionIndex}-${i}`
            );
            const droppedItem = dropZone.querySelector(".drag-item");
            userAnswers[questionIndex].push(
                droppedItem ? droppedItem.getAttribute("data-value") : null
            );
        });
    } else if (question.type === "fill-in-the-blank") {
        const input = document.querySelector(`input[name="q${questionIndex}"]`);
        userAnswers[questionIndex] = input ? input.value.trim() : null;
    }

    disableQuestion(questionIndex);
    proceedToNextQuestion();
}

function proceedToNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= loadedQuestions.length) {
        document.getElementById("submit-quiz").style.display = "block";
        return;
    }

    const nextQuestionDiv = document.getElementById(
        `question-${currentQuestionIndex}`
    );
    nextQuestionDiv.classList.remove("disabled");
    const inputs = nextQuestionDiv.querySelectorAll(
        "input, select, button, .drag-item, .drop-zone"
    );
    inputs.forEach((input) => {
        input.disabled = false;
        if (input.classList.contains("drag-item")) {
            input.setAttribute("draggable", true);
            input.style.pointerEvents = "auto";
        }
        if (input.classList.contains("drop-zone")) {
            input.style.pointerEvents = "auto";
        }
    });

    const question = loadedQuestions[currentQuestionIndex];
    if (question.timer > 0) {
        const timerElement = document.getElementById(
            `timer-${currentQuestionIndex}`
        );
        timerElement.textContent = `زمان باقی‌مانده: ${question.timer} ثانیه`;
        startTimer(currentQuestionIndex, question.timer);
    }
}

function resetQuiz() {
    const quizPlayerContent = document.getElementById("quiz-player-content");
    // Apply fade-out animation
    quizPlayerContent.classList.add("fading-out");
    setTimeout(() => {
        loadedQuestions = [];
        userAnswers = {};
        currentQuestionIndex = 0;
        if (currentTimer) {
            clearInterval(currentTimer);
        }
        quizPlayerContent.innerHTML = "";
        quizPlayerContent.classList.remove("fading-out");
        document.getElementById("submit-quiz").style.display = "none";
        document.getElementById("quiz-file").value = ""; // Reset file input
    }, 300); // Match animation duration
}

function submitQuiz() {
    if (currentTimer) {
        clearInterval(currentTimer);
    }

    let score = 0;
    const quizPlayerContent = document.getElementById("quiz-player-content");
    quizPlayerContent.innerHTML =
        '<div class="result-header">نتایج کوییز شما</div>';

    loadedQuestions.forEach((question, index) => {
        let isCorrect = false;
        let correctAnswerText = "";
        let userAnswerText = userAnswers[index] || "پاسخ داده نشده";

        if (question.type === "multiple-choice") {
            isCorrect =
                userAnswers[index] &&
                parseInt(userAnswers[index]) === question.correctAnswer;
            correctAnswerText = `${question.correctAnswer}. ${
                question.options[question.correctAnswer - 1]
            }`;
            if (userAnswers[index]) {
                userAnswerText = `${userAnswers[index]}. ${
                    question.options[parseInt(userAnswers[index]) - 1]
                }`;
            }
        } else if (question.type === "true-false") {
            isCorrect =
                userAnswers[index] &&
                (userAnswers[index] === "true") === question.correctAnswer;
            correctAnswerText = question.correctAnswer ? "درست" : "غلط";
        } else if (question.type === "matching") {
            isCorrect =
                userAnswers[index] &&
                question.pairs.every(
                    (pair, i) => userAnswers[index][i] === pair.right
                );
            correctAnswerText = question.pairs
                .map((pair, i) => `${pair.left} ↔ ${pair.right}`)
                .join("<br>");
            if (userAnswers[index]) {
                userAnswerText = question.pairs
                    .map(
                        (pair, i) =>
                            `${pair.left} ↔ ${userAnswers[index][i] || "هیچ"}`
                    )
                    .join("<br>");
            }
        } else if (question.type === "fill-in-the-blank") {
            isCorrect =
                userAnswers[index] &&
                userAnswers[index].toLowerCase() ===
                    question.correctAnswer.toLowerCase();
            correctAnswerText = question.correctAnswer;
            userAnswerText = userAnswers[index] || "پاسخ داده نشده";
        }

        if (isCorrect) score++;

        const questionDiv = document.createElement("div");
        questionDiv.className = `question-container ${
            isCorrect ? "correct" : "incorrect"
        }`;
        questionDiv.id = `question-${index}`;

        let resultHtml = `<h3>سوال ${index + 1}: ${question.text.replace(
            /\n/g,
            "<br>"
        )}</h3>`;
        resultHtml += `<div>وضعیت: ${isCorrect ? "درست" : "غلط"}</div>`;
        resultHtml += `<div>پاسخ شما: ${userAnswerText}</div>`;

        if (!isCorrect) {
            resultHtml += `<div class="correct-answer">پاسخ صحیح: ${correctAnswerText}</div>`;
        }

        if (question.type === "multiple-choice") {
            resultHtml += question.options
                .map(
                    (option, i) => `
                        <div class="option">${i + 1}. ${option}</div>
                    `
                )
                .join("");
        } else if (question.type === "matching") {
            resultHtml += question.pairs
                .map(
                    (pair, i) => `
                        <div class="pair">${pair.left} ↔ ${pair.right}</div>
                    `
                )
                .join("");
        } else if (question.type === "true-false") {
            resultHtml += `
                        <div class="option">درست</div>
                        <div class="option">غلط</div>
                    `;
        } else if (question.type === "fill-in-the-blank") {
            resultHtml += `<div class="option">پاسخ: ${question.correctAnswer}</div>`;
        }

        questionDiv.innerHTML = resultHtml;
        quizPlayerContent.appendChild(questionDiv);

        // Add reset button after the last question
        if (index === loadedQuestions.length - 1) {
            const resetButton = document.createElement("button");
            resetButton.className = "reset-quiz-btn";
            resetButton.textContent = "ریست کوییز";
            resetButton.onclick = resetQuiz;
            quizPlayerContent.appendChild(resetButton);
        }
    });

    const scoreDiv = document.createElement("div");
    scoreDiv.className = "result-header";
    scoreDiv.id = "result-score";
    scoreDiv.textContent = `امتیاز شما: ${score} از ${loadedQuestions.length}`;
    quizPlayerContent.insertBefore(scoreDiv, quizPlayerContent.firstChild);

    document.getElementById("submit-quiz").style.display = "none";

    // Scroll to the result header
    const resultHeader = document.getElementById("result-score");
    if (resultHeader) {
        resultHeader.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

toggleQuestionForm();
