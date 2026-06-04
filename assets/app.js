(function () {
    const DATA_URL = 'data/question-bank.json';
    const STORAGE_KEY = 'vdtl-mcq-quiz-state-v3';

    const state = {
        sourceBank: null,
        bank: null,
        quiz: [],
        answers: {},
        activeMode: 'quiz',
        answerLessonFilter: 'all',
        answerSearch: '',
        result: null,
    };

    const elements = {
        progressText: document.getElementById('progress-text'),
        progressMeta: document.getElementById('progress-meta'),
        progressBar: document.getElementById('progress-bar'),
        heroMeta: document.getElementById('hero-meta'),
        heroNote: document.getElementById('hero-note'),
        modeQuiz: document.getElementById('mode-quiz'),
        modeAnswers: document.getElementById('mode-answers'),
        quizPanel: document.getElementById('quiz-panel'),
        quizSummary: document.getElementById('quiz-summary'),
        restartTop: document.getElementById('restart-top'),
        quizForm: document.getElementById('quiz-form'),
        quizQuestions: document.getElementById('quiz-questions'),
        answerSummary: document.getElementById('answer-summary'),
        answerLessonFilter: document.getElementById('answer-lesson-filter'),
        answerSearch: document.getElementById('answer-search'),
        answerLibrary: document.getElementById('answer-library'),
        resultPanel: document.getElementById('result-panel'),
        resultSubtitle: document.getElementById('result-subtitle'),
        restartBottom: document.getElementById('restart-bottom'),
        scoreValue: document.getElementById('score-value'),
        scorePercent: document.getElementById('score-percent'),
        scoreNote: document.getElementById('score-note'),
        correctCount: document.getElementById('correct-count'),
        wrongCount: document.getElementById('wrong-count'),
        blankCount: document.getElementById('blank-count'),
    };

    bindEvents();
    loadBank();

    function bindEvents() {
        elements.restartTop.addEventListener('click', restartQuiz);
        elements.restartBottom.addEventListener('click', restartQuiz);
        elements.quizForm.addEventListener('change', handleAnswerChange);
        elements.modeQuiz.addEventListener('click', function () {
            setActiveMode('quiz');
        });
        elements.modeAnswers.addEventListener('click', function () {
            setActiveMode('answers');
        });
        elements.answerLessonFilter.addEventListener('change', handleAnswerFilterChange);
        elements.answerSearch.addEventListener('input', handleAnswerSearchInput);
    }

    async function loadBank() {
        setLoadingState();

        try {
            const response = await fetch(DATA_URL, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const bank = await response.json();

            if (!bank || !Array.isArray(bank.questions)) {
                throw new Error('Dữ liệu câu hỏi sai định dạng.');
            }

            state.sourceBank = bank;
            state.bank = normalizeBank(bank);

            renderHeroMeta();
            renderAnswerTools();
            renderAnswerLibrary();
            updateModePanels();

            if (!restoreSession()) {
                buildFreshQuiz();
            } else {
                syncDerivedState();
                renderHeroNote();
                renderQuizSummary();
                renderQuiz();
                updateProgress();
                updateResultPanel();
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
        elements.progressMeta.textContent = 'Chuẩn bị câu hỏi và đáp án.';
        elements.progressBar.style.width = '12%';
        elements.heroNote.textContent = 'Đang khởi tạo bộ đề.';
        elements.quizSummary.textContent = 'Đang nạp dữ liệu câu hỏi.';
        updateModePanels();
        elements.answerSummary.textContent = 'Đang nạp đáp án.';
        elements.answerLibrary.innerHTML = [
            '<article class="answer-card loading-card">',
            '<h3>Đang tải đáp án</h3>',
            '<p>Đáp án được đọc cùng ngân hàng câu hỏi.</p>',
            '</article>',
        ].join('');
        elements.quizQuestions.innerHTML = [
            '<article class="question-card loading-card">',
            '<h3>Đang tải bộ đề trắc nghiệm</h3>',
            '<p>Dữ liệu được đọc từ file <code>data/question-bank.json</code>.</p>',
            '</article>',
        ].join('');
    }

    function setActiveMode(mode) {
        state.activeMode = mode;
        updateModePanels();

        const targetPanel = mode === 'answers' ? document.getElementById('answer-panel') : elements.quizPanel;
        targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateModePanels() {
        const isQuizMode = state.activeMode === 'quiz';

        elements.modeQuiz.classList.toggle('active', isQuizMode);
        elements.modeAnswers.classList.toggle('active', !isQuizMode);
        elements.modeQuiz.setAttribute('aria-pressed', isQuizMode ? 'true' : 'false');
        elements.modeAnswers.setAttribute('aria-pressed', isQuizMode ? 'false' : 'true');
        elements.quizPanel.classList.toggle('hidden', !isQuizMode);

        document.getElementById('answer-panel').classList.toggle('hidden', isQuizMode);

        if (isQuizMode) {
            updateResultPanel();
        } else {
            elements.resultPanel.classList.add('hidden');
        }
    }

    function renderLoadError(error) {
        const message = error && error.message ? error.message : 'Không xác định';
        elements.progressText.textContent = 'Không tải được bộ đề';
        elements.progressMeta.textContent = 'Kiểm tra lại file JSON đã được deploy cùng site hay chưa.';
        elements.progressBar.style.width = '100%';
        elements.progressBar.classList.add('is-error');
        elements.heroNote.textContent = 'Web này cần file JSON tĩnh để chạy trên GitHub Pages.';
        elements.quizSummary.textContent = 'Tải dữ liệu thất bại.';
        elements.answerSummary.textContent = 'Không tải được đáp án.';
        elements.answerLibrary.innerHTML = [
            '<article class="answer-card blank">',
            '<h3>Không có đáp án để hiển thị</h3>',
            '<p>Cần tải được <code>' + escapeHtml(DATA_URL) + '</code> trước.</p>',
            '</article>',
        ].join('');
        elements.quizQuestions.innerHTML = [
            '<article class="question-card incorrect">',
            '<h3>Lỗi tải dữ liệu</h3>',
            '<p>Không đọc được <code>' + escapeHtml(DATA_URL) + '</code>.</p>',
            '<p><strong>Chi tiết:</strong> ' + escapeHtml(message) + '</p>',
            '</article>',
        ].join('');
    }

    function buildFreshQuiz() {
        state.quiz = shuffleArray(state.bank.questions.map(createQuestionInstance));
        state.answers = {};
        syncDerivedState();

        renderHeroMeta();
        renderHeroNote();
        renderQuizSummary();
        renderQuiz();
        updateProgress();
        updateResultPanel();
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

    function syncDerivedState() {
        state.result = buildResult();
    }

    function renderHeroMeta() {
        if (!state.bank) {
            return;
        }

        const totalQuestions = state.bank.questions.length;
        const lessonCount = Object.keys(state.bank.lessons || {}).length;

        elements.heroMeta.innerHTML = [
            renderMetaChip(lessonCount + ' bài'),
            renderMetaChip(totalQuestions + ' câu'),
            renderMetaChip('Chạm là chấm'),
            renderMetaChip('Trộn câu + đáp án'),
        ].join('');
    }

    function renderHeroNote() {
        if (!state.bank.questions.length) {
            elements.heroNote.textContent = 'Bộ đề hiện chưa có câu hỏi.';
            return;
        }

        elements.heroNote.textContent = 'Mỗi câu chỉ chọn một lần. Chạm vào đáp án là web báo đúng hoặc sai ngay. Reload trang không làm đổi đề.';
    }

    function renderMetaChip(text) {
        return '<span class="meta-chip">' + escapeHtml(text) + '</span>';
    }

    function renderQuizSummary() {
        if (!state.quiz.length) {
            elements.quizSummary.textContent = 'Bộ đề hiện chưa có câu hỏi.';
            return;
        }

        elements.quizSummary.textContent = 'Bộ đề có ' + state.quiz.length + ' câu. Chạm đáp án để xem kết quả ngay trên từng câu.';
    }

    function renderAnswerTools() {
        const lessons = state.bank && state.bank.lessons ? state.bank.lessons : {};
        const lessonOptions = Object.keys(lessons).sort(function (left, right) {
            return Number(left) - Number(right);
        }).map(function (lessonKey) {
            return [
                '<option value="' + escapeHtml(lessonKey) + '">',
                escapeHtml(lessons[lessonKey]),
                '</option>',
            ].join('');
        });

        elements.answerLessonFilter.innerHTML = [
            '<option value="all">Tất cả bài</option>',
            lessonOptions.join(''),
        ].join('');
    }

    function renderAnswerLibrary() {
        if (!state.bank || !state.bank.questions.length) {
            elements.answerSummary.textContent = 'Ngân hàng câu hỏi đang để trống.';
            elements.answerLibrary.innerHTML = [
                '<article class="answer-card blank">',
                '<h3>Chưa có đáp án</h3>',
                '<p>Thêm câu hỏi vào ngân hàng để mục này tự hiển thị đáp án.</p>',
                '</article>',
            ].join('');
            return;
        }

        const filteredQuestions = getFilteredAnswerQuestions();

        elements.answerSummary.textContent = 'Đang hiển thị ' + filteredQuestions.length + '/' + state.bank.questions.length + ' câu có đáp án đúng và giải thích.';

        if (!filteredQuestions.length) {
            elements.answerLibrary.innerHTML = [
                '<article class="answer-card blank">',
                '<h3>Không tìm thấy câu phù hợp</h3>',
                '<p>Thử đổi bài hoặc nhập từ khóa ngắn hơn.</p>',
                '</article>',
            ].join('');
            return;
        }

        elements.answerLibrary.innerHTML = filteredQuestions.map(function (question, index) {
            return renderAnswerCard(question, index);
        }).join('');
    }

    function getFilteredAnswerQuestions() {
        const searchNeedle = normalizeSearchText(state.answerSearch);

        return state.bank.questions.filter(function (question) {
            if (state.answerLessonFilter !== 'all' && String(question.lesson) !== state.answerLessonFilter) {
                return false;
            }

            if (!searchNeedle) {
                return true;
            }

            return normalizeSearchText([
                question.question,
                question.lessonTitle,
                question.explanation,
                question.optionPool.map(function (option) {
                    return option.text;
                }).join(' '),
            ].join(' ')).indexOf(searchNeedle) !== -1;
        });
    }

    function renderAnswerCard(question, index) {
        const correctOption = question.optionPool.find(function (option) {
            return option.value === question.correctValue;
        });
        const correctText = correctOption ? correctOption.text : question.correctValue;

        return [
            '<article class="answer-card">',
            '<div class="question-head">',
            '<div class="question-badges">',
            '<span class="badge badge-index">Đáp án ' + (index + 1) + '</span>',
            '<span class="badge">Bài ' + escapeHtml(String(question.lesson)) + '</span>',
            '</div>',
            '<span class="answer-state good">Có đáp án</span>',
            '</div>',
            '<h3 class="question-title">' + escapeHtml(question.question) + '</h3>',
            '<p class="question-lesson">' + escapeHtml(question.lessonTitle) + '</p>',
            '<div class="answer-correct">',
            '<strong>Đáp án đúng:</strong> ' + escapeHtml(correctText),
            '</div>',
            renderAnswerOptions(question),
            '<p class="answer-explanation"><strong>Giải thích:</strong> ' + escapeHtml(question.explanation) + '</p>',
            '</article>',
        ].join('');
    }

    function renderAnswerOptions(question) {
        return [
            '<div class="answer-options">',
            question.optionPool.map(function (option) {
                const isCorrect = option.value === question.correctValue;

                return [
                    '<div class="answer-option' + (isCorrect ? ' is-correct' : '') + '">',
                    '<span>' + escapeHtml(option.value) + '</span>',
                    '<p>' + escapeHtml(option.text) + '</p>',
                    '</div>',
                ].join('');
            }).join(''),
            '</div>',
        ].join('');
    }

    function renderQuiz() {
        if (!state.quiz.length) {
            elements.quizQuestions.innerHTML = [
                '<article class="question-card blank">',
                '<h3>Chưa có câu hỏi</h3>',
                '<p>Ngân hàng câu hỏi đang để trống.</p>',
                '</article>',
            ].join('');
            return;
        }

        elements.quizQuestions.innerHTML = state.quiz.map(function (question, index) {
            return renderQuestionCard(question, index);
        }).join('');
    }

    function renderQuestionCard(question, index) {
        const detail = state.result.byId[question.id];
        const status = getQuestionDisplayStatus(question, detail);
        const answered = Boolean(state.answers[question.id]);
        const cardClasses = ['question-card', status.cardClass];

        if (answered) {
            cardClasses.push(detail.isCorrect ? 'correct' : 'incorrect');
        }

        return [
            '<article class="' + cardClasses.join(' ') + '" data-question-id="' + escapeHtml(question.id) + '">',
            '<div class="question-head">',
            '<div class="question-badges">',
            '<span class="badge badge-index">Câu ' + (index + 1) + '</span>',
            '<span class="badge">Bài ' + escapeHtml(String(question.lesson)) + '</span>',
            '</div>',
            '<span class="answer-state ' + escapeHtml(status.stateClass) + '">' + escapeHtml(status.text) + '</span>',
            '</div>',
            '<h3 class="question-title">' + escapeHtml(question.question) + '</h3>',
            '<p class="question-lesson">' + escapeHtml(question.lessonTitle) + '</p>',
            renderChoiceQuestion(question, detail),
            answered ? renderInlineReview(question, detail) : '',
            '</article>',
        ].join('');
    }

    function renderChoiceQuestion(question, detail) {
        const selectedValue = state.answers[question.id] || '';
        const answered = Boolean(selectedValue);

        return [
            '<div class="option-list">',
            question.optionEntries.map(function (option) {
                const isSelected = selectedValue === option.value;
                const isCorrect = question.correctValue === option.value;
                const optionClasses = ['option'];

                if (isSelected) {
                    optionClasses.push('selected');
                }

                if (answered && isCorrect) {
                    optionClasses.push('correct-option');
                }

                if (answered && isSelected && !isCorrect) {
                    optionClasses.push('wrong-option');
                }

                return [
                    '<label class="' + optionClasses.join(' ') + '">',
                    '<input class="option-input" type="radio" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option.value) + '"' +
                        (isSelected ? ' checked' : '') +
                        (answered ? ' disabled' : '') +
                        '>',
                    '<span class="option-label">' + escapeHtml(option.displayLabel) + '</span>',
                    '<span class="option-copy">' + escapeHtml(option.text) + '</span>',
                    '</label>',
                ].join('');
            }).join(''),
            '</div>',
        ].join('');
    }

    function renderInlineReview(question, detail) {
        const selectedLabel = formatChoiceLabel(question, detail.selectedValue);
        const correctLabel = formatChoiceLabel(question, question.correctValue);
        const statusText = detail.isCorrect ? 'Bạn chọn đúng.' : 'Bạn chọn sai.';
        const statusClass = detail.isCorrect ? 'good' : 'bad';

        return [
            '<div class="inline-review ' + statusClass + '">',
            '<p><strong>' + statusText + '</strong></p>',
            '<p><strong>Bạn chọn:</strong> ' + escapeHtml(selectedLabel) + '</p>',
            '<p><strong>Đáp án đúng:</strong> ' + escapeHtml(correctLabel) + '</p>',
            '<p><strong>Giải thích:</strong> ' + escapeHtml(question.explanation) + '</p>',
            '</div>',
        ].join('');
    }

    function handleAnswerChange(event) {
        if (!state.bank) {
            return;
        }

        const target = event.target;

        if (!target.matches('input[type="radio"]')) {
            return;
        }

        if (state.answers[target.name]) {
            return;
        }

        state.answers[target.name] = target.value;
        syncDerivedState();
        rerenderQuestion(target.name);
        updateProgress();
        updateResultPanel();
        saveSession();
    }

    function handleAnswerFilterChange(event) {
        state.answerLessonFilter = event.target.value;
        renderAnswerLibrary();
    }

    function handleAnswerSearchInput(event) {
        state.answerSearch = event.target.value;
        renderAnswerLibrary();
    }

    function rerenderQuestion(questionId) {
        const questionIndex = state.quiz.findIndex(function (question) {
            return question.id === questionId;
        });

        if (questionIndex === -1) {
            return;
        }

        const existingCard = elements.quizQuestions.querySelector('[data-question-id="' + cssEscape(questionId) + '"]');

        if (!existingCard) {
            return;
        }

        existingCard.outerHTML = renderQuestionCard(state.quiz[questionIndex], questionIndex);
    }

    function buildResult() {
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
        summary.isFinished = summary.blank === 0 && summary.total > 0;
        summary.completedAt = summary.isFinished ? new Date().toLocaleString('vi-VN') : '';

        return summary;
    }

    function updateResultPanel() {
        const result = state.result;

        if (!result || !result.isFinished) {
            resetResultPanel();
            return;
        }

        if (state.activeMode !== 'quiz') {
            elements.resultPanel.classList.add('hidden');
            return;
        }

        elements.resultPanel.classList.remove('hidden');
        elements.scoreValue.textContent = result.correct + '/' + result.total;
        elements.scorePercent.textContent = formatNumber(result.percent) + '%';
        elements.scoreNote.textContent = getScoreNote(result);
        elements.correctCount.textContent = result.correct + ' câu đúng';
        elements.wrongCount.textContent = result.wrong + ' câu sai';
        elements.blankCount.textContent = result.blank + ' câu bỏ trống';
        elements.resultSubtitle.textContent = 'Hoàn thành lúc ' + result.completedAt + ' • Điểm quy đổi: ' + formatNumber(result.score10) + '/10';
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
    }

    function updateProgress() {
        if (!state.quiz.length || !state.result) {
            elements.progressText.textContent = 'Chưa có câu hỏi';
            elements.progressMeta.textContent = 'Ngân hàng câu hỏi đang để trống.';
            elements.progressBar.style.width = '0%';
            return;
        }

        const answered = state.result.correct + state.result.wrong;
        const percent = state.quiz.length ? (answered / state.quiz.length) * 100 : 0;

        elements.progressText.textContent = 'Đúng ' + state.result.correct + '/' + state.quiz.length + ' câu';
        elements.progressMeta.textContent = 'Sai ' + state.result.wrong + ' • Còn ' + state.result.blank + ' câu chưa chọn';
        elements.progressBar.style.width = percent + '%';
    }

    function getQuestionDisplayStatus(question, detail) {
        if (!detail || detail.isBlank) {
            return {
                cardClass: 'unanswered',
                stateClass: 'pending',
                text: 'Chưa chọn',
            };
        }

        if (detail.isCorrect) {
            return {
                cardClass: 'answered',
                stateClass: 'good',
                text: 'Đúng',
            };
        }

        return {
            cardClass: 'answered',
            stateClass: 'bad',
            text: 'Sai',
        };
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
        if (state.result && state.result.isFinished) {
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

    function saveSession() {
        try {
            const payload = {
                signature: getBankSignature(),
                quiz: state.quiz,
                answers: state.answers,
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
            return 'Làm khá chắc. Có thể trộn bộ mới để kiểm tra lại độ ổn định.';
        }

        if (result.percent >= 75) {
            return 'Mức làm bài ổn. Xem lại các câu sai để khóa kiến thức.';
        }

        if (result.percent >= 50) {
            return 'Đang có nền nhưng còn hổng ý. Nên làm lại thêm một lượt.';
        }

        return 'Nên ôn lại giáo trình rồi trộn bộ mới để làm tiếp.';
    }

    function getAlphabetLabel(index) {
        return String.fromCharCode(65 + index);
    }

    function formatNumber(value) {
        return Number(value).toFixed(1).replace(/\.0$/, '');
    }

    function normalizeSearchText(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd');
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
