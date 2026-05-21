(function () {
    const data = window.questionBank;

    if (!data || !Array.isArray(data.questions)) {
        document.body.innerHTML = '<main class="shell"><section class="panel"><h2>Khong tai duoc du lieu cau hoi.</h2></section></main>';
        return;
    }

    const state = {
        currentQuiz: [],
        hasSubmitted: false,
    };

    const lessonGrid = document.getElementById('lesson-grid');
    const heroMeta = document.getElementById('hero-meta');
    const selectionSummary = document.getElementById('selection-summary');
    const quizPanel = document.getElementById('quiz-panel');
    const quizForm = document.getElementById('quiz-form');
    const quizQuestions = document.getElementById('quiz-questions');
    const quizSummary = document.getElementById('quiz-summary');
    const submitQuizButton = quizForm.querySelector('button[type="submit"]');
    const resultPanel = document.getElementById('result-panel');
    const scoreValue = document.getElementById('score-value');
    const scorePercent = document.getElementById('score-percent');
    const scoreNote = document.getElementById('score-note');
    const lessonBreakdown = document.getElementById('lesson-breakdown');
    const questionBank = document.getElementById('question-bank');
    const questionCount = document.getElementById('question-count');
    const shuffleQuestions = document.getElementById('shuffle-questions');
    const shuffleOptions = document.getElementById('shuffle-options');
    const generateQuizButton = document.getElementById('generate-quiz');
    const resetQuizButton = document.getElementById('reset-quiz');
    const selectAllLessonsButton = document.getElementById('select-all-lessons');
    const clearAllLessonsButton = document.getElementById('clear-all-lessons');

    init();

    function init() {
        renderHeroMeta();
        renderLessonFilters();
        renderQuestionBank();
        updateSelectionSummary();

        lessonGrid.addEventListener('change', updateSelectionSummary);
        questionCount.addEventListener('change', updateSelectionSummary);
        generateQuizButton.addEventListener('click', generateQuiz);
        resetQuizButton.addEventListener('click', generateQuiz);
        selectAllLessonsButton.addEventListener('click', function () {
            setAllLessonCheckboxes(true);
        });
        clearAllLessonsButton.addEventListener('click', function () {
            setAllLessonCheckboxes(false);
        });
        quizForm.addEventListener('submit', handleSubmit);
    }

    function renderHeroMeta() {
        const lessonCount = Object.keys(data.lessons).length;
        const questionTotal = data.questions.length;
        heroMeta.innerHTML = [
            renderMetaChip(lessonCount + ' bài'),
            renderMetaChip(questionTotal + ' câu hỏi'),
            renderMetaChip('Chấm điểm tự động'),
            renderMetaChip('Phù hợp host tĩnh / GitHub Pages'),
        ].join('');
    }

    function renderMetaChip(text) {
        return '<span class="meta-chip">' + escapeHtml(text) + '</span>';
    }

    function renderLessonFilters() {
        const lessonEntries = Object.entries(data.lessons)
            .map(function (entry) {
                return {
                    lesson: Number(entry[0]),
                    title: entry[1],
                };
            })
            .sort(function (a, b) {
                return a.lesson - b.lesson;
            });

        lessonGrid.innerHTML = lessonEntries.map(function (entry) {
            const total = getQuestionCountByLesson(entry.lesson);
            return [
                '<label class="lesson-chip">',
                '<input type="checkbox" class="lesson-checkbox" value="' + entry.lesson + '" checked>',
                '<span>',
                '<strong>Bài ' + entry.lesson + '</strong>',
                '<small>' + escapeHtml(entry.title) + ' • ' + total + ' câu</small>',
                '</span>',
                '</label>',
            ].join('');
        }).join('');
    }

    function getQuestionCountByLesson(lesson) {
        return data.questions.filter(function (question) {
            return question.lesson === lesson;
        }).length;
    }

    function setAllLessonCheckboxes(checked) {
        Array.from(document.querySelectorAll('.lesson-checkbox')).forEach(function (input) {
            input.checked = checked;
        });
        updateSelectionSummary();
    }

    function getSelectedLessons() {
        return Array.from(document.querySelectorAll('.lesson-checkbox:checked')).map(function (input) {
            return Number(input.value);
        });
    }

    function getFilteredQuestions() {
        const selectedLessons = getSelectedLessons();
        return data.questions.filter(function (question) {
            return selectedLessons.includes(question.lesson);
        });
    }

    function updateSelectionSummary() {
        const selectedLessons = getSelectedLessons();
        const availableQuestions = getFilteredQuestions().length;
        const desiredCount = questionCount.value === 'all'
            ? availableQuestions
            : Math.min(Number(questionCount.value), availableQuestions);

        if (!selectedLessons.length) {
            selectionSummary.textContent = 'Chưa chọn bài nào.';
            return;
        }

        selectionSummary.textContent = 'Đang chọn ' + selectedLessons.length + ' bài, có ' + availableQuestions + ' câu khả dụng, đề sẽ lấy ' + desiredCount + ' câu.';
    }

    function generateQuiz() {
        const selectedLessons = getSelectedLessons();
        const pool = getFilteredQuestions();

        if (!selectedLessons.length) {
            alert('Chọn ít nhất 1 bài trước khi tạo đề.');
            return;
        }

        if (!pool.length) {
            alert('Không có câu hỏi cho lựa chọn hiện tại.');
            return;
        }

        const requestedCount = questionCount.value === 'all'
            ? pool.length
            : Math.min(Number(questionCount.value), pool.length);

        const clonedPool = pool.map(function (question) {
            return createQuestionInstance(question);
        });

        const prepared = shuffleQuestions.checked ? shuffleArray(clonedPool) : clonedPool.slice();
        state.currentQuiz = prepared.slice(0, requestedCount);
        state.hasSubmitted = false;
        submitQuizButton.disabled = false;
        submitQuizButton.textContent = 'Nộp bài và chấm điểm';

        renderQuiz();
        resultPanel.classList.add('hidden');
        quizPanel.classList.remove('hidden');
        quizPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function createQuestionInstance(question) {
        const optionEntries = Object.entries(question.options).map(function (entry) {
            return {
                key: entry[0],
                text: entry[1],
            };
        });

        return {
            id: question.id,
            lesson: question.lesson,
            lessonTitle: data.lessons[question.lesson],
            type: question.type,
            question: question.question,
            options: question.options,
            answer: question.answer,
            explanation: question.explanation,
            displayOptions: shuffleOptions.checked ? shuffleArray(optionEntries) : optionEntries,
        };
    }

    function renderQuiz() {
        const selectedLessonSet = new Set(state.currentQuiz.map(function (question) {
            return question.lesson;
        }));

        quizSummary.textContent = 'Đề hiện tại gồm ' + state.currentQuiz.length + ' câu từ ' + selectedLessonSet.size + ' bài.';

        quizQuestions.innerHTML = state.currentQuiz.map(function (question, index) {
            const optionMarkup = question.displayOptions.map(function (option) {
                const inputId = question.id + '-' + option.key;
                return [
                    '<div class="option">',
                    '<label for="' + inputId + '">',
                    '<input type="radio" name="' + question.id + '" id="' + inputId + '" value="' + option.key + '">',
                    '<span class="option-label">' + escapeHtml(option.key) + '</span>',
                    '<span>' + escapeHtml(option.text) + '</span>',
                    '</label>',
                    '</div>',
                ].join('');
            }).join('');

            return [
                '<article class="question-card" data-question-id="' + question.id + '">',
                '<div class="question-head">',
                '<span class="badge">Bài ' + question.lesson + '</span>',
                '<span class="badge">' + (question.type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm') + '</span>',
                '</div>',
                '<div class="question-title">Câu ' + (index + 1) + '. ' + escapeHtml(question.question) + '</div>',
                '<div class="option-list">' + optionMarkup + '</div>',
                '</article>',
            ].join('');
        }).join('');
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (state.hasSubmitted) {
            return;
        }

        if (!state.currentQuiz.length) {
            return;
        }

        const answers = collectAnswers();
        const unanswered = state.currentQuiz.filter(function (question) {
            return !answers[question.id];
        });

        if (unanswered.length) {
            const proceed = window.confirm('Bạn còn ' + unanswered.length + ' câu chưa chọn đáp án. Vẫn nộp bài chứ?');
            if (!proceed) {
                return;
            }
        }

        const result = gradeQuiz(answers);
        state.hasSubmitted = true;
        submitQuizButton.disabled = true;
        submitQuizButton.textContent = 'Đã chấm xong';

        renderGradedQuiz(result);
        renderResult(result);
        resultPanel.classList.remove('hidden');
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function collectAnswers() {
        const answers = {};

        state.currentQuiz.forEach(function (question) {
            const checked = quizForm.querySelector('input[name="' + question.id + '"]:checked');
            answers[question.id] = checked ? checked.value : '';
        });

        return answers;
    }

    function gradeQuiz(answers) {
        let correct = 0;

        const details = state.currentQuiz.map(function (question) {
            const selected = answers[question.id];
            const isCorrect = selected === question.answer;

            if (isCorrect) {
                correct += 1;
            }

            return {
                question: question,
                selected: selected,
                isCorrect: isCorrect,
            };
        });

        return {
            total: state.currentQuiz.length,
            correct: correct,
            percent: state.currentQuiz.length ? (correct / state.currentQuiz.length) * 100 : 0,
            details: details,
        };
    }

    function renderGradedQuiz(result) {
        result.details.forEach(function (detail, index) {
            const card = quizQuestions.querySelector('[data-question-id="' + detail.question.id + '"]');
            if (!card) {
                return;
            }

            card.classList.add(detail.isCorrect ? 'correct' : 'incorrect');

            Array.from(card.querySelectorAll('input')).forEach(function (input) {
                input.disabled = true;
            });

            Array.from(card.querySelectorAll('.option')).forEach(function (optionNode) {
                const input = optionNode.querySelector('input');
                if (!input) {
                    return;
                }

                if (input.value === detail.question.answer) {
                    optionNode.classList.add('correct-option');
                } else if (input.checked && input.value !== detail.question.answer) {
                    optionNode.classList.add('wrong-option');
                }
            });

            const selectedText = detail.selected
                ? detail.selected + '. ' + detail.question.options[detail.selected]
                : 'Chưa chọn đáp án';
            const answerText = detail.question.answer + '. ' + detail.question.options[detail.question.answer];
            const statusClass = detail.isCorrect ? 'ok' : 'bad';
            const statusText = detail.isCorrect ? 'Đúng' : 'Sai';

            card.insertAdjacentHTML('beforeend', [
                '<div class="question-status ' + statusClass + '">' + statusText + '</div>',
                '<div class="question-explanation"><strong>Bạn chọn:</strong> ' + escapeHtml(selectedText) + '</div>',
                '<div class="question-explanation"><strong>Đáp án đúng:</strong> ' + escapeHtml(answerText) + '</div>',
                '<div class="question-explanation"><strong>Giải thích:</strong> ' + escapeHtml(detail.question.explanation) + '</div>',
            ].join(''));
        });
    }

    function renderResult(result) {
        const percent = result.percent.toFixed(1);
        scoreValue.textContent = result.correct + '/' + result.total;
        scorePercent.textContent = percent + '%';
        scoreNote.textContent = getScoreNote(result.percent);

        const perLesson = buildLessonBreakdown(result.details);

        lessonBreakdown.innerHTML = Object.keys(perLesson)
            .sort(function (a, b) {
                return Number(a) - Number(b);
            })
            .map(function (lessonKey) {
                const entry = perLesson[lessonKey];
                return [
                    '<div class="breakdown-chip">',
                    '<strong>Bài ' + lessonKey + '</strong><br>',
                    '<span>' + escapeHtml(entry.title) + '</span><br>',
                    '<span>' + entry.correct + '/' + entry.total + ' câu đúng</span>',
                    '</div>',
                ].join('');
            })
            .join('');
    }

    function buildLessonBreakdown(details) {
        return details.reduce(function (accumulator, detail) {
            const key = String(detail.question.lesson);

            if (!accumulator[key]) {
                accumulator[key] = {
                    title: detail.question.lessonTitle,
                    correct: 0,
                    total: 0,
                };
            }

            accumulator[key].total += 1;
            if (detail.isCorrect) {
                accumulator[key].correct += 1;
            }

            return accumulator;
        }, {});
    }

    function getScoreNote(percent) {
        if (percent >= 90) {
            return 'Rất tốt. Bộ câu hỏi đã được nắm khá chắc.';
        }
        if (percent >= 75) {
            return 'Ổn. Nên rà lại các câu sai và xem phần giải thích.';
        }
        if (percent >= 50) {
            return 'Đang ở mức trung bình. Nên ôn lại theo từng bài rồi làm lại đề trộn.';
        }
        return 'Cần ôn lại nội dung trước khi làm một lượt đề khác.';
    }

    function renderQuestionBank() {
        const lessonEntries = Object.entries(data.lessons)
            .map(function (entry) {
                return {
                    lesson: Number(entry[0]),
                    title: entry[1],
                };
            })
            .sort(function (a, b) {
                return a.lesson - b.lesson;
            });

        questionBank.innerHTML = lessonEntries.map(function (entry) {
            const questions = data.questions.filter(function (question) {
                return question.lesson === entry.lesson;
            });

            const items = questions.map(function (question, index) {
                const answer = question.answer + '. ' + question.options[question.answer];
                const options = Object.entries(question.options).map(function (option) {
                    return '<li>' + escapeHtml(option[0] + '. ' + option[1]) + '</li>';
                }).join('');

                return [
                    '<article class="bank-item">',
                    '<strong>' + (index + 1) + '. ' + escapeHtml(question.question) + '</strong>',
                    '<ul>' + options + '</ul>',
                    '<div class="bank-answer"><strong>Đáp án:</strong> ' + escapeHtml(answer) + '</div>',
                    '<div class="bank-answer"><strong>Giải thích:</strong> ' + escapeHtml(question.explanation) + '</div>',
                    '</article>',
                ].join('');
            }).join('');

            return [
                '<details class="bank-lesson"' + (entry.lesson === 1 ? ' open' : '') + '>',
                '<summary>',
                '<span>Bài ' + entry.lesson + ': ' + escapeHtml(entry.title) + '</span>',
                '<span class="summary-pill">' + questions.length + ' câu</span>',
                '</summary>',
                '<div class="bank-list">' + items + '</div>',
                '</details>',
            ].join('');
        }).join('');
    }

    function shuffleArray(items) {
        const array = items.slice();
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
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
})();
