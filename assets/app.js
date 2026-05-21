(function () {
    const DATA_URL = 'data/question-bank.json';
    const STORAGE_KEY = 'vdtl-single-quiz-state-v1';

    const state = {
        bank: null,
        quiz: [],
        answers: {},
        mode: 'practice',
        submitted: false,
        explanationsVisible: false,
        result: null,
    };

    const elements = {
        progressText: document.getElementById('progress-text'),
        progressMeta: document.getElementById('progress-meta'),
        progressBar: document.getElementById('progress-bar'),
        heroMeta: document.getElementById('hero-meta'),
        modePractice: document.getElementById('mode-practice'),
        modeExam: document.getElementById('mode-exam'),
        modeNote: document.getElementById('mode-note'),
        quizPanel: document.getElementById('quiz-panel'),
        quizSummary: document.getElementById('quiz-summary'),
        restartTop: document.getElementById('restart-top'),
        quizForm: document.getElementById('quiz-form'),
        quizQuestions: document.getElementById('quiz-questions'),
        submitQuiz: document.getElementById('submit-quiz'),
        resultPanel: document.getElementById('result-panel'),
        resultSubtitle: document.getElementById('result-subtitle'),
        revealAnswers: document.getElementById('reveal-answers'),
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
        elements.modePractice.addEventListener('click', function () {
            changeMode('practice');
        });

        elements.modeExam.addEventListener('click', function () {
            changeMode('exam');
        });

        elements.restartTop.addEventListener('click', restartQuiz);
        elements.restartBottom.addEventListener('click', restartQuiz);

        elements.revealAnswers.addEventListener('click', function () {
            state.explanationsVisible = true;
            elements.revealAnswers.classList.add('hidden');
            saveSession();
            renderQuiz();
            updateProgress();
            elements.quizPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

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

            state.bank = bank;
            renderHeroMeta();

            if (!restoreSession()) {
                buildFreshQuiz();
            } else {
                renderModeState();
                renderQuizSummary();
                renderQuiz();

                if (state.result) {
                    renderResult();
                    elements.resultPanel.classList.remove('hidden');

                    if (state.mode === 'exam' && !state.explanationsVisible) {
                        elements.revealAnswers.classList.remove('hidden');
                    }
                } else {
                    resetResultPanel();
                }

                updateProgress();
            }
        } catch (error) {
            renderLoadError(error);
        }
    }

    function setLoadingState() {
        elements.progressText.textContent = 'Đang tải bộ đề...';
        elements.progressMeta.textContent = 'Đọc dữ liệu JSON và chuẩn bị đề thi.';
        elements.progressBar.style.width = '16%';
        elements.modeNote.textContent = 'Đang khởi tạo bộ đề tổng hợp.';
        elements.quizSummary.textContent = 'Đang nạp dữ liệu câu hỏi.';
        elements.quizQuestions.innerHTML = [
            '<article class="question-card loading-card">',
            '<h3>Đang tải bộ đề tổng hợp</h3>',
            '<p>Dữ liệu câu hỏi được đọc từ file <code>data/question-bank.json</code>.</p>',
            '</article>',
        ].join('');
    }

    function renderLoadError(error) {
        const message = error && error.message ? error.message : 'Không xác định';
        elements.progressText.textContent = 'Không tải được bộ đề';
        elements.progressMeta.textContent = 'Kiểm tra lại file JSON đã được deploy cùng site hay chưa.';
        elements.progressBar.style.width = '100%';
        elements.progressBar.classList.add('is-error');
        elements.modeNote.textContent = 'Web này cần file JSON tĩnh để chạy trên GitHub Pages.';
        elements.quizSummary.textContent = 'Tải dữ liệu thất bại.';
        elements.quizQuestions.innerHTML = [
            '<article class="question-card incorrect">',
            '<h3>Lỗi tải dữ liệu</h3>',
            '<p>Không đọc được <code>' + escapeHtml(DATA_URL) + '</code>.</p>',
            '<p><strong>Chi tiết:</strong> ' + escapeHtml(message) + '</p>',
            '<p>Nếu đang deploy GitHub Pages, hãy chắc rằng file JSON đã được copy lên site.</p>',
            '</article>',
        ].join('');
        elements.submitQuiz.disabled = true;
    }

    function changeMode(mode) {
        if (!state.bank || state.mode === mode) {
            return;
        }

        if (!confirmDiscardProgress()) {
            return;
        }

        state.mode = mode;
        buildFreshQuiz();
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

        return window.confirm('Bạn đang làm dở bộ đề này. Trộn đề mới sẽ mất các đáp án đã chọn. Tiếp tục chứ?');
    }

    function hasAnyAnswer() {
        return state.quiz.some(function (question) {
            return isQuestionAnswered(question);
        });
    }

    function buildFreshQuiz() {
        state.quiz = shuffleArray(state.bank.questions.map(createQuestionInstance));
        state.answers = {};
        state.submitted = false;
        state.explanationsVisible = false;
        state.result = null;

        renderHeroMeta();
        renderModeState();
        renderQuizSummary();
        renderQuiz();
        resetResultPanel();
        updateProgress();
        saveSession();
    }

    function createQuestionInstance(question) {
        const lessonKey = String(question.lesson);
        const lessonTitle = state.bank.lessons && state.bank.lessons[lessonKey]
            ? state.bank.lessons[lessonKey]
            : 'Không rõ tiêu đề bài';

        if (question.type === 'match') {
            const leftItems = shuffleArray(question.pairs.map(function (pair, index) {
                return {
                    id: question.id + '-left-' + index,
                    prompt: pair.left,
                    correctRight: pair.right,
                };
            }));

            const rightOptions = shuffleArray(question.pairs.map(function (pair, index) {
                return {
                    id: question.id + '-right-' + index,
                    text: pair.right,
                };
            }));

            return {
                id: question.id,
                lesson: question.lesson,
                lessonTitle: lessonTitle,
                type: question.type,
                question: question.question,
                explanation: question.explanation,
                leftItems: leftItems,
                rightOptions: rightOptions,
            };
        }

        const optionEntries = shuffleArray(Object.entries(question.options).map(function (entry) {
            return {
                originalKey: entry[0],
                text: entry[1],
            };
        })).map(function (option, index) {
            return {
                originalKey: option.originalKey,
                text: option.text,
                displayLabel: getAlphabetLabel(index),
            };
        });

        return {
            id: question.id,
            lesson: question.lesson,
            lessonTitle: lessonTitle,
            type: question.type,
            question: question.question,
            explanation: question.explanation,
            correctKey: question.answer,
            optionEntries: optionEntries,
        };
    }

    function renderHeroMeta() {
        if (!state.bank) {
            return;
        }

        const totalQuestions = state.bank.questions.length;
        const lessonCount = Object.keys(state.bank.lessons || {}).length;
        const mcqCount = state.bank.questions.filter(function (question) {
            return question.type === 'mcq';
        }).length;
        const tfCount = state.bank.questions.filter(function (question) {
            return question.type === 'true_false';
        }).length;
        const matchCount = state.bank.questions.filter(function (question) {
            return question.type === 'match';
        }).length;

        elements.heroMeta.innerHTML = [
            renderMetaChip(lessonCount + ' bài'),
            renderMetaChip(totalQuestions + ' câu tổng hợp'),
            renderMetaChip(mcqCount + ' câu A/B/C/D'),
            renderMetaChip(tfCount + ' câu Đúng / Sai'),
            renderMetaChip(matchCount + ' câu ghép ý'),
            renderMetaChip('Dữ liệu local JSON'),
        ].join('');
    }

    function renderMetaChip(text) {
        return '<span class="meta-chip">' + escapeHtml(text) + '</span>';
    }

    function renderModeState() {
        const practiceActive = state.mode === 'practice';

        elements.modePractice.classList.toggle('active', practiceActive);
        elements.modeExam.classList.toggle('active', !practiceActive);
        elements.modePractice.setAttribute('aria-pressed', String(practiceActive));
        elements.modeExam.setAttribute('aria-pressed', String(!practiceActive));

        elements.modeNote.textContent = practiceActive
            ? 'Luyện tập: nộp bài xong sẽ hiện ngay đúng sai và giải thích chi tiết từng câu. Reload trang không đổi đề đang làm.'
            : 'Thi thật: nộp bài xong hiện điểm trước, đáp án và lời giải vẫn ẩn cho tới khi bấm xem chi tiết. Reload trang không đổi đề.';
    }

    function renderQuizSummary() {
        const counts = {
            mcq: 0,
            trueFalse: 0,
            match: 0,
        };

        state.quiz.forEach(function (question) {
            if (question.type === 'mcq') {
                counts.mcq += 1;
            } else if (question.type === 'true_false') {
                counts.trueFalse += 1;
            } else if (question.type === 'match') {
                counts.match += 1;
            }
        });

        elements.quizSummary.textContent = [
            'Bộ đề này có ' + state.quiz.length + ' câu, chỉ trộn lại khi bấm Trộn đề mới hoặc Làm lại đề.',
            counts.mcq + ' câu A/B/C/D',
            counts.trueFalse + ' câu Đúng/Sai',
            counts.match + ' câu ghép ý',
        ].join(' • ');
    }

    function renderQuiz() {
        const reviewVisible = shouldShowReview();

        elements.quizQuestions.innerHTML = state.quiz.map(function (question, index) {
            const status = getQuestionDisplayStatus(question);
            const detail = state.result && state.result.byId ? state.result.byId[question.id] : null;
            const cardClasses = [
                'question-card',
                status.cardClass,
            ];

            if (state.submitted && reviewVisible && detail) {
                if (detail.isCorrect) {
                    cardClasses.push('correct');
                } else if (detail.isBlank) {
                    cardClasses.push('blank');
                } else {
                    cardClasses.push('incorrect');
                }
            } else if (state.submitted) {
                cardClasses.push('locked');
            }

            return [
                '<article class="' + cardClasses.join(' ') + '" data-question-id="' + escapeHtml(question.id) + '">',
                renderQuestionHead(question, index, status),
                '<h3 class="question-title">Câu ' + (index + 1) + '. ' + escapeHtml(question.question) + '</h3>',
                '<p class="question-lesson">' + escapeHtml(question.lessonTitle) + '</p>',
                question.type === 'match'
                    ? renderMatchQuestion(question, detail, reviewVisible)
                    : renderChoiceQuestion(question, detail, reviewVisible),
                reviewVisible ? renderReviewBlock(question, detail) : '',
                '</article>',
            ].join('');
        }).join('');

        elements.submitQuiz.disabled = state.submitted;
        elements.submitQuiz.textContent = state.submitted ? 'Đã nộp bài' : 'Nộp bài';
    }

    function renderQuestionHead(question, index, status) {
        return [
            '<div class="question-head">',
            '<div class="question-badges">',
            '<span class="badge badge-index">Câu ' + (index + 1) + '</span>',
            '<span class="badge">Bài ' + escapeHtml(String(question.lesson)) + '</span>',
            '<span class="badge">' + escapeHtml(getQuestionTypeLabel(question.type)) + '</span>',
            '</div>',
            '<span class="answer-state ' + escapeHtml(status.stateClass) + '">' + escapeHtml(status.text) + '</span>',
            '</div>',
        ].join('');
    }

    function renderChoiceQuestion(question, detail, reviewVisible) {
        const selectedKey = state.answers[question.id] || '';

        return [
            '<div class="option-list">',
            question.optionEntries.map(function (option) {
                const isSelected = selectedKey === option.originalKey;
                const isCorrect = question.correctKey === option.originalKey;
                const optionClasses = ['option'];

                if (isSelected) {
                    optionClasses.push('selected');
                }

                if (reviewVisible && isCorrect) {
                    optionClasses.push('correct-option');
                }

                if (reviewVisible && isSelected && !isCorrect) {
                    optionClasses.push('wrong-option');
                }

                return [
                    '<label class="' + optionClasses.join(' ') + '">',
                    '<input type="radio" name="' + escapeHtml(question.id) + '" value="' + escapeHtml(option.originalKey) + '"' +
                        (isSelected ? ' checked' : '') +
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

    function renderMatchQuestion(question, detail, reviewVisible) {
        const selections = state.answers[question.id] || {};

        return [
            '<div class="match-list">',
            question.leftItems.map(function (leftItem, index) {
                const selectedValue = selections[leftItem.id] || '';
                const rowDetail = detail && Array.isArray(detail.rows)
                    ? detail.rows.find(function (row) {
                        return row.leftId === leftItem.id;
                    })
                    : null;
                const rowClasses = ['match-row'];

                if (selectedValue) {
                    rowClasses.push('selected');
                }

                if (reviewVisible && rowDetail) {
                    rowClasses.push(rowDetail.isCorrect ? 'correct-option' : 'wrong-option');
                }

                return [
                    '<div class="' + rowClasses.join(' ') + '">',
                    '<div class="match-left">',
                    '<span class="match-order">' + (index + 1) + '</span>',
                    '<span>' + escapeHtml(leftItem.prompt) + '</span>',
                    '</div>',
                    '<div class="match-right">',
                    '<select name="' + escapeHtml(question.id + '::' + leftItem.id) + '" data-question-id="' + escapeHtml(question.id) + '" data-left-id="' + escapeHtml(leftItem.id) + '"' +
                        (state.submitted ? ' disabled' : '') +
                        '>',
                    '<option value="">Chọn ý ghép</option>',
                    question.rightOptions.map(function (option) {
                        return '<option value="' + escapeHtml(option.text) + '"' +
                            (selectedValue === option.text ? ' selected' : '') +
                            '>' + escapeHtml(option.text) + '</option>';
                    }).join(''),
                    '</select>',
                    '</div>',
                    '</div>',
                ].join('');
            }).join(''),
            '</div>',
        ].join('');
    }

    function renderReviewBlock(question, detail) {
        if (!detail) {
            return '';
        }

        if (question.type === 'match') {
            return renderMatchReview(question, detail);
        }

        return renderChoiceReview(question, detail);
    }

    function renderChoiceReview(question, detail) {
        const selectedLabel = detail.selectedKey
            ? formatChoiceLabel(question, detail.selectedKey)
            : 'Chưa chọn đáp án';
        const correctLabel = formatChoiceLabel(question, question.correctKey);
        const wrongOptions = question.optionEntries.filter(function (option) {
            return option.originalKey !== question.correctKey;
        });

        return [
            '<div class="review-block">',
            '<div class="review-line"><strong>Bạn chọn:</strong> ' + escapeHtml(selectedLabel) + '</div>',
            '<div class="review-line"><strong>Đáp án đúng:</strong> ' + escapeHtml(correctLabel) + '</div>',
            '<div class="review-line"><strong>Vì sao đúng:</strong> ' + escapeHtml(question.explanation) + '</div>',
            '<div class="review-line"><strong>Vì sao các đáp án còn lại sai:</strong></div>',
            '<ul class="review-list">',
            wrongOptions.map(function (option) {
                const reason = buildWrongChoiceReason(question, option, detail.selectedKey);
                const itemClass = detail.selectedKey === option.originalKey ? 'review-item bad' : 'review-item';

                return '<li class="' + itemClass + '"><strong>' + escapeHtml(option.displayLabel + '. ' + option.text) + ':</strong> ' + escapeHtml(reason) + '</li>';
            }).join(''),
            '</ul>',
            '</div>',
        ].join('');
    }

    function renderMatchReview(question, detail) {
        return [
            '<div class="review-block">',
            '<div class="review-line"><strong>Kết quả ghép:</strong> ' + detail.correctPairs + '/' + detail.totalPairs + ' cặp đúng.</div>',
            '<div class="review-line"><strong>Nguyên tắc đúng:</strong> ' + escapeHtml(question.explanation) + '</div>',
            '<ul class="review-list">',
            detail.rows.map(function (row) {
                const selected = row.selectedRight || 'Chưa chọn';
                const reason = row.isCorrect
                    ? 'Đúng vì ý này trong giáo trình được ghép trực tiếp với nội dung trên.'
                    : 'Sai vì ý này không đi với lựa chọn đã ghép. Ghép đúng phải là: ' + row.correctRight + '.';
                const itemClass = row.isCorrect ? 'review-item good' : 'review-item bad';

                return [
                    '<li class="' + itemClass + '">',
                    '<strong>' + escapeHtml(row.left) + '</strong>',
                    '<span> • Bạn ghép: ' + escapeHtml(selected) + '</span>',
                    '<span> • Đáp án đúng: ' + escapeHtml(row.correctRight) + '</span>',
                    '<span> • ' + escapeHtml(reason) + '</span>',
                    '</li>',
                ].join('');
            }).join(''),
            '</ul>',
            '</div>',
        ].join('');
    }

    function buildWrongChoiceReason(question, option, selectedKey) {
        if (question.type === 'true_false') {
            if (question.correctKey === 'A') {
                return option.originalKey === selectedKey
                    ? 'Đây là lựa chọn bạn chọn nhưng mệnh đề trong câu thực ra là đúng theo giáo trình.'
                    : 'Sai vì mệnh đề trong câu là đúng theo giáo trình, nên không thể chọn phương án này.';
            }

            return option.originalKey === selectedKey
                ? 'Đây là lựa chọn bạn chọn nhưng mệnh đề trong câu trái với nội dung giáo trình.'
                : 'Sai vì mệnh đề trong câu trái với nội dung giáo trình, nên không thể chọn phương án này.';
        }

        const correctLabel = formatChoiceLabel(question, question.correctKey);
        const prefix = option.originalKey === selectedKey
            ? 'Đây là lựa chọn bạn chọn nhưng'
            : 'Sai vì';

        return prefix + ' đáp án này không khớp với ý chính của câu hỏi. Nội dung đúng theo giáo trình là ' + correctLabel + '.';
    }

    function formatChoiceLabel(question, originalKey) {
        const option = question.optionEntries.find(function (entry) {
            return entry.originalKey === originalKey;
        });

        if (!option) {
            return originalKey;
        }

        return option.displayLabel + '. ' + option.text;
    }

    function handleAnswerChange(event) {
        if (!state.bank || state.submitted) {
            return;
        }

        const target = event.target;

        if (target.matches('input[type="radio"]')) {
            state.answers[target.name] = target.value;
        }

        if (target.matches('select[data-question-id][data-left-id]')) {
            const questionId = target.getAttribute('data-question-id');
            const leftId = target.getAttribute('data-left-id');

            if (!state.answers[questionId] || typeof state.answers[questionId] !== 'object') {
                state.answers[questionId] = {};
            }

            if (target.value) {
                state.answers[questionId][leftId] = target.value;
            } else {
                delete state.answers[questionId][leftId];
            }
        }

        updateProgress();
        saveSession();
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!state.bank || state.submitted) {
            return;
        }

        const blankQuestions = state.quiz.filter(function (question) {
            return !isQuestionAnswered(question);
        });

        if (blankQuestions.length) {
            const proceed = window.confirm('Bạn còn ' + blankQuestions.length + ' câu chưa làm xong. Vẫn nộp bài chứ?');

            if (!proceed) {
                return;
            }
        }

        state.result = gradeQuiz();
        state.submitted = true;
        state.explanationsVisible = state.mode === 'practice';

        renderResult();
        renderQuiz();
        updateProgress();
        saveSession();

        if (state.mode === 'exam') {
            elements.revealAnswers.classList.remove('hidden');
        }

        elements.resultPanel.classList.remove('hidden');
        elements.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function gradeQuiz() {
        const details = state.quiz.map(function (question) {
            if (question.type === 'match') {
                const selections = state.answers[question.id] || {};
                const rows = question.leftItems.map(function (leftItem) {
                    const selectedRight = selections[leftItem.id] || '';

                    return {
                        leftId: leftItem.id,
                        left: leftItem.prompt,
                        selectedRight: selectedRight,
                        correctRight: leftItem.correctRight,
                        isCorrect: selectedRight === leftItem.correctRight,
                    };
                });

                const answeredPairs = rows.filter(function (row) {
                    return Boolean(row.selectedRight);
                }).length;
                const correctPairs = rows.filter(function (row) {
                    return row.isCorrect;
                }).length;
                const isBlank = answeredPairs === 0;
                const isCorrect = correctPairs === rows.length;

                return {
                    questionId: question.id,
                    isCorrect: isCorrect,
                    isBlank: isBlank,
                    correctPairs: correctPairs,
                    totalPairs: rows.length,
                    rows: rows,
                };
            }

            const selectedKey = state.answers[question.id] || '';

            return {
                questionId: question.id,
                selectedKey: selectedKey,
                isCorrect: selectedKey === question.correctKey,
                isBlank: !selectedKey,
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

            accumulator.byId[detail.questionId] = detail;
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

        return summary;
    }

    function renderResult() {
        const result = state.result;

        if (!result) {
            return;
        }

        elements.scoreValue.textContent = result.correct + '/' + result.total;
        elements.scorePercent.textContent = formatNumber(result.percent) + '%';
        elements.scoreNote.textContent = getScoreNote(result) + ' Câu ghép ý chỉ tính đúng khi ghép đúng toàn bộ các cặp.';
        elements.correctCount.textContent = result.correct + ' câu đúng';
        elements.wrongCount.textContent = result.wrong + ' câu sai';
        elements.blankCount.textContent = result.blank + ' câu bỏ trống';
        elements.resultSubtitle.textContent = getModeLabel() + ' • Chấm lúc ' + result.completedAt + ' • Điểm quy đổi: ' + formatNumber(result.score10) + '/10';
    }

    function resetResultPanel() {
        elements.resultPanel.classList.add('hidden');
        elements.revealAnswers.classList.add('hidden');
        elements.scoreValue.textContent = '0/0';
        elements.scorePercent.textContent = '0%';
        elements.scoreNote.textContent = '';
        elements.correctCount.textContent = '0 câu đúng';
        elements.wrongCount.textContent = '0 câu sai';
        elements.blankCount.textContent = '0 câu bỏ trống';
        elements.resultSubtitle.textContent = '';
    }

    function saveSession() {
        try {
            const payload = {
                signature: getBankSignature(),
                mode: state.mode,
                quiz: state.quiz,
                answers: state.answers,
                submitted: state.submitted,
                explanationsVisible: state.explanationsVisible,
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

            state.mode = saved.mode === 'exam' ? 'exam' : 'practice';
            state.quiz = saved.quiz;
            state.answers = saved.answers && typeof saved.answers === 'object' ? saved.answers : {};
            state.submitted = Boolean(saved.submitted);
            state.explanationsVisible = Boolean(saved.explanationsVisible);
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
            return isQuestionAnswered(question);
        }).length;
        const percent = state.quiz.length ? (answered / state.quiz.length) * 100 : 0;

        elements.progressText.textContent = 'Đã làm ' + answered + '/' + state.quiz.length + ' câu';
        elements.progressMeta.textContent = getModeLabel() + ' • Câu đã chọn sẽ tự đổi màu.';
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

            card.classList.remove('answered', 'partial', 'unanswered');
            card.classList.add(status.cardClass);

            const badge = card.querySelector('.answer-state');

            if (badge) {
                badge.className = 'answer-state ' + status.stateClass;
                badge.textContent = status.text;
            }
        });
    }

    function getQuestionDisplayStatus(question) {
        if (question.type === 'match') {
            const selections = state.answers[question.id] || {};
            const answeredCount = Object.values(selections).filter(Boolean).length;

            if (answeredCount === 0) {
                return {
                    cardClass: 'unanswered',
                    stateClass: 'pending',
                    text: 'Chưa làm',
                };
            }

            if (answeredCount < question.leftItems.length) {
                return {
                    cardClass: 'partial',
                    stateClass: 'partial',
                    text: 'Đang làm',
                };
            }

            return {
                cardClass: 'answered',
                stateClass: 'done',
                text: 'Đã làm',
            };
        }

        if (state.answers[question.id]) {
            return {
                cardClass: 'answered',
                stateClass: 'done',
                text: 'Đã làm',
            };
        }

        return {
            cardClass: 'unanswered',
            stateClass: 'pending',
            text: 'Chưa làm',
        };
    }

    function isQuestionAnswered(question) {
        const status = getQuestionDisplayStatus(question);
        return status.cardClass === 'answered';
    }

    function shouldShowReview() {
        return state.submitted && (state.mode === 'practice' || state.explanationsVisible);
    }

    function getQuestionTypeLabel(type) {
        if (type === 'true_false') {
            return 'Đúng / Sai';
        }

        if (type === 'match') {
            return 'Ghép ý';
        }

        return 'A / B / C / D';
    }

    function getModeLabel() {
        return state.mode === 'practice' ? 'Luyện tập' : 'Thi thật';
    }

    function getScoreNote(result) {
        if (result.percent >= 90) {
            return 'Nắm bài khá chắc.';
        }

        if (result.percent >= 75) {
            return 'Mức làm bài ổn, nên xem lại các câu sai để khóa kiến thức.';
        }

        if (result.percent >= 50) {
            return 'Đã có nền tảng nhưng còn hổng nhiều ý quan trọng.';
        }

        return 'Cần ôn lại giáo trình rồi làm lại một lượt đề mới.';
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
