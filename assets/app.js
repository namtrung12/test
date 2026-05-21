(function () {
    const DATA_URL = 'data/question-bank.json';
    const STORAGE_KEY = 'vdtl-mcq-quiz-state-v2';

    const state = {
        sourceBank: null,
        bank: null,
        quiz: [],
        answers: {},
        submitted: false,
        result: null,
    };

    const elements = {
        progressText: document.getElementById('progress-text'),
        progressMeta: document.getElementById('progress-meta'),
        progressBar: document.getElementById('progress-bar'),
        heroMeta: document.getElementById('hero-meta'),
        heroNote: document.getElementById('hero-note'),
        quizPanel: document.getElementById('quiz-panel'),
        quizSummary: document.getElementById('quiz-summary'),
        restartTop: document.getElementById('restart-top'),
        quizForm: document.getElementById('quiz-form'),
        quizQuestions: document.getElementById('quiz-questions'),
        submitQuiz: document.getElementById('submit-quiz'),
        resultPanel: document.getElementById('result-panel'),
        resultSubtitle: document.getElementById('result-subtitle'),
        restartBottom: document.getElementById('restart-bottom'),
        scoreValue: document.getElementById('score-value'),
        scorePercent: document.getElementById('score-percent'),
        scoreNote: document.getElementById('score-note'),
        correctCount: document.getElementById('correct-count'),
        wrongCount: document.getElementById('wrong-count'),
        blankCount: document.getElementById('blank-count'),
        explanationList: document.getElementById('explanation-list'),
    };

    bindEvents();
    loadBank();

    function bindEvents() {
        elements.restartTop.addEventListener('click', restartQuiz);
        elements.restartBottom.addEventListener('click', restartQuiz);
        elements.quizForm.addEventListener('change', handleAnswerChange);
        elements.quizForm.addEventListener('submit', handleSubmit);
    }

    async function loadBank() {
        setLoadingState();

        try {
            const response = await fetch(DATA_URL, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const bank = await response.json();

            if (!bank || !Array.isArray(bank.questions) || !bank.questions.length) {
                throw new Error('Dữ liệu câu hỏi rỗng hoặc sai định dạng.');
            }

            state.sourceBank = bank;
            state.bank = normalizeBank(bank);

            renderHeroMeta();

            if (!restoreSession()) {
                buildFreshQuiz();
            } else {
                renderHeroNote();
                renderQuizSummary();
                renderQuiz();

                if (state.result) {
                    renderResult();
                    elements.resultPanel.classList.remove('hidden');
                } else {
                    resetResultPanel();
                }

                updateProgress();
            }
        } catch (error) {
            renderLoadError(error);
        }
    }

    function normalizeBank(bank) {
        const questions = [];

        bank.questions.forEach(function (question) {
            if (question.type === 'match') {
                expandMatchQuestion(question, bank.lessons).forEach(function (item) {
                    questions.push(item);
                });
                return;
            }

            questions.push(normalizeChoiceQuestion(question, bank.lessons));
        });

        return {
            title: bank.title,
            source: bank.source,
            lessons: bank.lessons,
            questions: questions,
        };
    }

    function normalizeChoiceQuestion(question, lessons) {
        const lessonKey = String(question.lesson);

        return {
            id: question.id,
            lesson: question.lesson,
            lessonTitle: lessons && lessons[lessonKey] ? lessons[lessonKey] : 'Không rõ tiêu đề bài',
            sourceType: question.type,
            question: question.question,
            explanation: question.explanation,
            correctValue: question.answer,
            optionPool: Object.entries(question.options).map(function (entry) {
                return {
                    value: entry[0],
                    text: entry[1],
                };
            }),
        };
    }

    function expandMatchQuestion(question, lessons) {
        const lessonKey = String(question.lesson);
        const lessonTitle = lessons && lessons[lessonKey] ? lessons[lessonKey] : 'Không rõ tiêu đề bài';
        const rightOptions = question.pairs.map(function (pair) {
            return pair.right;
        });

        return question.pairs.map(function (pair, index) {
            return {
                id: question.id + '-mcq-' + (index + 1),
                lesson: question.lesson,
                lessonTitle: lessonTitle,
                sourceType: 'match',
                question: pair.left + ' ghép đúng với nội dung nào?',
                explanation: question.explanation + ' Với ý "' + pair.left + '", đáp án đúng là "' + pair.right + '".',
                correctValue: pair.right,
                optionPool: rightOptions.map(function (option) {
                    return {
                        value: option,
                        text: option,
                    };
                }),
            };
        });
    }

    function setLoadingState() {
        elements.progressText.textContent = 'Đang tải bộ đề...';
        elements.progressMeta.textContent = 'Đọc dữ liệu JSON và chuẩn bị bộ câu hỏi.';
        elements.progressBar.style.width = '16%';
        elements.heroNote.textContent = 'Đang khởi tạo bộ đề trắc nghiệm.';
        elements.quizSummary.textContent = 'Đang nạp dữ liệu câu hỏi.';
        elements.quizQuestions.innerHTML = [
            '<article class="question-card loading-card">',
            '<h3>Đang tải bộ đề trắc nghiệm</h3>',
            '<p>Dữ liệu được đọc từ file <code>data/question-bank.json</code>.</p>',
            '</article>',
        ].join('');
    }

    function renderLoadError(error) {
        const message = error && error.message ? error.message : 'Không xác định';
        elements.progressText.textContent = 'Không tải được bộ đề';
        elements.progressMeta.textContent = 'Kiểm tra lại file JSON đã được deploy cùng site hay chưa.';
        elements.progressBar.style.width = '100%';
        elements.progressBar.classList.add('is-error');
        elements.heroNote.textContent = 'Web này cần file JSON tĩnh để chạy trên GitHub Pages.';
        elements.quizSummary.textContent = 'Tải dữ liệu thất bại.';
        elements.quizQuestions.innerHTML = [
            '<article class="question-card incorrect">',
            '<h3>Lỗi tải dữ liệu</h3>',
            '<p>Không đọc được <code>' + escapeHtml(DATA_URL) + '</code>.</p>',
            '<p><strong>Chi tiết:</strong> ' + escapeHtml(message) + '</p>',
            '</article>',
        ].join('');
        elements.submitQuiz.disabled = true;
    }

    function buildFreshQuiz() {
        state.quiz = shuffleArray(state.bank.questions.map(createQuestionInstance));
        state.answers = {};
        state.submitted = false;
        state.result = null;

        renderHeroMeta();
        renderHeroNote();
        renderQuizSummary();
        renderQuiz();
        resetResultPanel();
        updateProgress();
        saveSession();
    }

    function createQuestionInstance(question) {
        const optionEntries = shuffleArray(question.optionPool.map(function (option) {
            return {
                value: option.value,
                text: option.text,
            };
        })).map(function (option, index) {
            return {
                value: option.value,
                text: option.text,
                displayLabel: getAlphabetLabel(index),
            };
        });

        return {
            id: question.id,
            lesson: question.lesson,
            lessonTitle: question.lessonTitle,
            sourceType: question.sourceType,
            question: question.question,
            explanation: question.explanation,
            correctValue: question.correctValue,
            optionEntries: optionEntries,
        };
    }

    function renderHeroMeta() {
        if (!state.bank) {
            return;
        }

        const totalQuestions = state.bank.questions.length;
        const lessonCount = Object.keys(state.bank.lessons || {}).length;

        elements.heroMeta.innerHTML = [
            renderMetaChip(lessonCount + ' bài'),
            renderMetaChip(totalQuestions + ' câu trắc nghiệm'),
            renderMetaChip('Trộn câu hỏi'),
            renderMetaChip('Trộn đáp án'),
            renderMetaChip('Dữ liệu local JSON'),
        ].join('');
    }

    function renderHeroNote() {
        elements.heroNote.textContent = 'Reload trang không đổi đề đang làm. Chỉ khi bấm Trộn bộ mới hoặc Làm lại đề thì web mới sinh bộ khác.';
    }

    function renderMetaChip(text) {
        return '<span class="meta-chip">' + escapeHtml(text) + '</span>';
    }

    function renderQuizSummary() {
        elements.quizSummary.textContent = 'Bộ đề này có ' + state.quiz.length + ' câu trắc nghiệm. Nộp bài xong web sẽ chấm ngay và chuyển xuống phần giải thích.';
    }

    function renderQuiz() {
        elements.quizQuestions.innerHTML = state.quiz.map(function (question, index) {
            const status = getQuestionDisplayStatus(question);
            const detail = state.result && state.result.byId ? state.result.byId[question.id] : null;
            const cardClasses = ['question-card', status.cardClass];

            if (state.submitted && detail) {
                if (detail.isCorrect) {
                    cardClasses.push('correct');
                } else if (detail.isBlank) {
                    cardClasses.push('blank');
                } else {
                    cardClasses.push('incorrect');
                }
            }

            return [
                '<article class="' + cardClasses.join(' ') + '" data-question-id="' + escapeHtml(question.id) + '">',
                '<div class="question-head">',
                '<div class="question-badges">',
                '<span class="badge badge-index">Câu ' + (index + 1) + '</span>',
                '<span class="badge">Bài ' + escapeHtml(String(question.lesson)) + '</span>',
                '<span class="badge">Trắc nghiệm</span>',
                '</div>',
                '<span class="answer-state ' + escapeHtml(status.stateClass) + '">' + escapeHtml(status.text) + '</span>',
                '</div>',
                '<h3 class="question-title">' + escapeHtml(question.question) + '</h3>',
                '<p class="question-lesson">' + escapeHtml(question.lessonTitle) + '</p>',
                renderChoiceQuestion(question),
                '</article>',
            ].join('');
        }).join('');

        elements.submitQuiz.disabled = state.submitted;
        elements.submitQuiz.textContent = state.submitted ? 'Đã nộp bài' : 'Nộp bài';
    }

    function renderChoiceQuestion(question) {
        const selectedValue = state.answers[question.id] || '';

        return [
            '<div class="option-list">',
            question.optionEntries.map(function (option) {
                const optionClasses = ['option'];

                if (selectedValue === option.value) {
                    optionClasses.push('selected');
                }

                return [
                    '<label class="' + optionClasses.join(' ') + '">',
                    '<input type="radio" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option.value) + '"' +
                        (selectedValue === option.value ? ' checked' : '') +
                        (state.submitted ? ' disabled' : '') +
                        '>',
                    '<span class="option-label">' + escapeHtml(option.displayLabel) + '</span>',
                    '<span class="option-copy">' + escapeHtml(option.text) + '</span>',
                    '</label>',
                ].join('');
            }).join(''),
            '</div>',
        ].join('');
    }

    function handleAnswerChange(event) {
        if (!state.bank || state.submitted) {
            return;
        }

        const target = event.target;

        if (!target.matches('input[type="radio"]')) {
            return;
        }

        state.answers[target.name] = target.value;
        updateProgress();
        saveSession();
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!state.bank || state.submitted) {
            return;
        }

        const blankQuestions = state.quiz.filter(function (question) {
            return !state.answers[question.id];
        });

        if (blankQuestions.length) {
            const proceed = window.confirm('Bạn còn ' + blankQuestions.length + ' câu chưa chọn đáp án. Vẫn nộp bài chứ?');

            if (!proceed) {
                return;
            }
        }

        state.result = gradeQuiz();
        state.submitted = true;

        renderQuiz();
        renderResult();
        updateProgress();
        saveSession();

        elements.resultPanel.classList.remove('hidden');
        elements.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function gradeQuiz() {
        const details = state.quiz.map(function (question, index) {
            const selectedValue = state.answers[question.id] || '';

            return {
                index: index + 1,
                question: question,
                selectedValue: selectedValue,
                isCorrect: selectedValue === question.correctValue,
                isBlank: !selectedValue,
            };
        });

        const summary = details.reduce(function (accumulator, detail) {
            if (detail.isCorrect) {
                accumulator.correct += 1;
            } else if (detail.isBlank) {
                accumulator.blank += 1;
            } else {
                accumulator.wrong += 1;
            }

            accumulator.byId[detail.question.id] = detail;
            return accumulator;
        }, {
            correct: 0,
            wrong: 0,
            blank: 0,
            byId: {},
        });

        summary.total = state.quiz.length;
        summary.percent = summary.total ? (summary.correct / summary.total) * 100 : 0;
        summary.score10 = summary.percent / 10;
        summary.completedAt = new Date().toLocaleString('vi-VN');
        summary.details = details;

        return summary;
    }

    function renderResult() {
        const result = state.result;

        if (!result) {
            return;
        }

        elements.scoreValue.textContent = result.correct + '/' + result.total;
        elements.scorePercent.textContent = formatNumber(result.percent) + '%';
        elements.scoreNote.textContent = getScoreNote(result);
        elements.correctCount.textContent = result.correct + ' câu đúng';
        elements.wrongCount.textContent = result.wrong + ' câu sai';
        elements.blankCount.textContent = result.blank + ' câu bỏ trống';
        elements.resultSubtitle.textContent = 'Chấm lúc ' + result.completedAt + ' • Điểm quy đổi: ' + formatNumber(result.score10) + '/10';
        elements.explanationList.innerHTML = result.details.map(renderExplanationCard).join('');
    }

    function renderExplanationCard(detail) {
        const question = detail.question;
        const selectedLabel = detail.selectedValue
            ? formatChoiceLabel(question, detail.selectedValue)
            : 'Chưa chọn đáp án';
        const correctLabel = formatChoiceLabel(question, question.correctValue);
        const wrongOptions = question.optionEntries.filter(function (option) {
            return option.value !== question.correctValue;
        });
        const statusText = detail.isCorrect ? 'Đúng' : detail.isBlank ? 'Bỏ trống' : 'Sai';
        const statusClass = detail.isCorrect ? 'good' : detail.isBlank ? 'blank' : 'bad';

        return [
            '<article class="explanation-card">',
            '<div class="explanation-head">',
            '<div>',
            '<span class="badge badge-index">Câu ' + detail.index + '</span>',
            '<span class="badge">Bài ' + escapeHtml(String(question.lesson)) + '</span>',
            '</div>',
            '<span class="explanation-status ' + statusClass + '">' + statusText + '</span>',
            '</div>',
            '<h3>' + escapeHtml(question.question) + '</h3>',
            '<p class="explanation-meta">' + escapeHtml(question.lessonTitle) + '</p>',
            '<p class="review-line"><strong>Bạn chọn:</strong> ' + escapeHtml(selectedLabel) + '</p>',
            '<p class="review-line"><strong>Đáp án đúng:</strong> ' + escapeHtml(correctLabel) + '</p>',
            '<p class="review-line"><strong>Vì sao đúng:</strong> ' + escapeHtml(question.explanation) + '</p>',
            '<div class="review-line"><strong>Vì sao các đáp án còn lại sai:</strong></div>',
            '<ul class="review-list">',
            wrongOptions.map(function (option) {
                const itemClass = detail.selectedValue === option.value ? 'review-item bad' : 'review-item';
                return '<li class="' + itemClass + '"><strong>' + escapeHtml(option.displayLabel + '. ' + option.text) + ':</strong> ' + escapeHtml(buildWrongChoiceReason(question, option, detail.selectedValue)) + '</li>';
            }).join(''),
            '</ul>',
            '</article>',
        ].join('');
    }

    function buildWrongChoiceReason(question, option, selectedValue) {
        if (question.sourceType === 'true_false') {
            if (question.correctValue === 'A') {
                return option.value === selectedValue
                    ? 'Đây là lựa chọn bạn chọn nhưng mệnh đề trong câu thực ra là đúng theo giáo trình.'
                    : 'Sai vì mệnh đề trong câu là đúng theo giáo trình, nên không thể chọn phương án này.';
            }

            return option.value === selectedValue
                ? 'Đây là lựa chọn bạn chọn nhưng mệnh đề trong câu trái với nội dung giáo trình.'
                : 'Sai vì mệnh đề trong câu trái với nội dung giáo trình, nên không thể chọn phương án này.';
        }

        const correctLabel = formatChoiceLabel(question, question.correctValue);
        const prefix = option.value === selectedValue ? 'Đây là lựa chọn bạn chọn nhưng' : 'Sai vì';

        return prefix + ' đáp án này không khớp với ý chính của câu hỏi. Nội dung đúng theo giáo trình là ' + correctLabel + '.';
    }

    function formatChoiceLabel(question, value) {
        const option = question.optionEntries.find(function (entry) {
            return entry.value === value;
        });

        if (!option) {
            return value;
        }

        return option.displayLabel + '. ' + option.text;
    }

    function restartQuiz() {
        if (!state.bank) {
            return;
        }

        if (!confirmDiscardProgress()) {
            return;
        }

        buildFreshQuiz();
        elements.quizPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function confirmDiscardProgress() {
        if (state.submitted) {
            return true;
        }

        if (!hasAnyAnswer()) {
            return true;
        }

        return window.confirm('Bạn đang làm dở bộ đề này. Trộn bộ mới sẽ mất các đáp án đã chọn. Tiếp tục chứ?');
    }

    function hasAnyAnswer() {
        return state.quiz.some(function (question) {
            return Boolean(state.answers[question.id]);
        });
    }

    function resetResultPanel() {
        elements.resultPanel.classList.add('hidden');
        elements.scoreValue.textContent = '0/0';
        elements.scorePercent.textContent = '0%';
        elements.scoreNote.textContent = '';
        elements.correctCount.textContent = '0 câu đúng';
        elements.wrongCount.textContent = '0 câu sai';
        elements.blankCount.textContent = '0 câu bỏ trống';
        elements.resultSubtitle.textContent = '';
        elements.explanationList.innerHTML = '';
    }

    function updateProgress() {
        if (!state.quiz.length) {
            return;
        }

        if (state.submitted && state.result) {
            elements.progressText.textContent = 'Đã nộp bài';
            elements.progressMeta.textContent = state.result.correct + ' đúng • ' + state.result.wrong + ' sai • ' + state.result.blank + ' bỏ trống';
            elements.progressBar.style.width = '100%';
            updateQuestionStateDom();
            return;
        }

        const answered = state.quiz.filter(function (question) {
            return Boolean(state.answers[question.id]);
        }).length;
        const percent = state.quiz.length ? (answered / state.quiz.length) * 100 : 0;

        elements.progressText.textContent = 'Đã làm ' + answered + '/' + state.quiz.length + ' câu';
        elements.progressMeta.textContent = 'Câu đã chọn sẽ tự đổi màu.';
        elements.progressBar.style.width = percent + '%';
        updateQuestionStateDom();
    }

    function updateQuestionStateDom() {
        state.quiz.forEach(function (question) {
            const status = getQuestionDisplayStatus(question);
            const card = elements.quizQuestions.querySelector('[data-question-id="' + cssEscape(question.id) + '"]');

            if (!card) {
                return;
            }

            card.classList.remove('answered', 'unanswered');
            card.classList.add(status.cardClass);

            const badge = card.querySelector('.answer-state');

            if (badge) {
                badge.className = 'answer-state ' + status.stateClass;
                badge.textContent = status.text;
            }
        });
    }

    function getQuestionDisplayStatus(question) {
        if (state.answers[question.id]) {
            return {
                cardClass: 'answered',
                stateClass: 'done',
                text: 'Đã chọn',
            };
        }

        return {
            cardClass: 'unanswered',
            stateClass: 'pending',
            text: 'Chưa chọn',
        };
    }

    function saveSession() {
        try {
            const payload = {
                signature: getBankSignature(),
                quiz: state.quiz,
                answers: state.answers,
                submitted: state.submitted,
                result: state.result,
            };

            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            // Ignore storage errors.
        }
    }

    function restoreSession() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return false;
            }

            const saved = JSON.parse(raw);

            if (!saved || saved.signature !== getBankSignature()) {
                window.localStorage.removeItem(STORAGE_KEY);
                return false;
            }

            if (!Array.isArray(saved.quiz) || !saved.quiz.length) {
                window.localStorage.removeItem(STORAGE_KEY);
                return false;
            }

            state.quiz = saved.quiz;
            state.answers = saved.answers && typeof saved.answers === 'object' ? saved.answers : {};
            state.submitted = Boolean(saved.submitted);
            state.result = saved.result && typeof saved.result === 'object' ? saved.result : null;

            return true;
        } catch (error) {
            try {
                window.localStorage.removeItem(STORAGE_KEY);
            } catch (removeError) {
                // Ignore cleanup errors.
            }

            return false;
        }
    }

    function getBankSignature() {
        if (!state.bank) {
            return '';
        }

        return [
            state.bank.title || '',
            state.bank.source || '',
            Array.isArray(state.bank.questions) ? state.bank.questions.length : 0,
        ].join('|');
    }

    function getScoreNote(result) {
        if (result.percent >= 90) {
            return 'Nắm bài khá chắc. Có thể làm lại một bộ trộn mới để rà thêm độ ổn định.';
        }

        if (result.percent >= 75) {
            return 'Mức làm bài ổn. Xem kỹ phần giải thích ở dưới để khóa lại các ý sai.';
        }

        if (result.percent >= 50) {
            return 'Đã có nền tảng nhưng còn hổng nhiều ý. Nên xem lại phần giải thích rồi làm lại đề mới.';
        }

        return 'Cần ôn lại giáo trình. Xem lần lượt phần giải thích bên dưới rồi làm lại một bộ khác.';
    }

    function getAlphabetLabel(index) {
        return String.fromCharCode(65 + index);
    }

    function formatNumber(value) {
        return Number(value).toFixed(1).replace(/\.0$/, '');
    }

    function shuffleArray(items) {
        const array = items.slice();

        for (let index = array.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temporary = array[index];
            array[index] = array[swapIndex];
            array[swapIndex] = temporary;
        }

        return array;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(value);
        }

        return String(value).replace(/"/g, '\\"');
    }
})();
