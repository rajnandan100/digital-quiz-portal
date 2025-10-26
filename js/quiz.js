// ===== QUIZ RUNTIME (QuizManager) =====
// Minimal, stable QuizManager that works with your current quiz.html

class QuizManager {
  constructor() {
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.currentUser = null;
    this.quiz = null;
    this.quizId = null;
    this.currentIndex = 0;
    this.userAnswers = {}; // {questionIndex: optionIndex}
    this.marked = new Set();
    this.timer = null;
    this.timeRemaining = 0; // seconds
    this.init();
  }

  init() {
    this.auth.onAuthStateChanged(async (user) => {
      this.currentUser = user || null;
      await this.loadQuizByURL();
    });

    // Buttons
    this.hook('#btn-previous', 'click', () => this.prev());
    this.hook('#btn-next', 'click', () => this.next());
    this.hook('#btn-mark', 'click', () => this.toggleMark());
    this.hook('#btn-clear', 'click', () => this.clearResponse());
    this.hook('#btn-submit', 'click', () => this.showSubmitModal());
    this.hook('#btn-cancel-submit', 'click', () => this.hideSubmitModal());
  }

  hook(sel, evt, fn) {
    const el = document.querySelector(sel);
    if (el) el.addEventListener(evt, fn);
  }

  getParam(name) {
    const u = new URLSearchParams(window.location.search);
    return u.get(name);
  }

  async loadQuizByURL() {
    try {
      const id = this.getParam('id');
      if (!id) throw new Error('No quiz id in URL');

      this.quizId = id;
      const doc = await this.db.collection('quizzes').doc(id).get();
      if (!doc.exists) throw new Error('Quiz not found');

      this.quiz = { id: doc.id, ...doc.data() };

      // Time limit (minutes) → seconds
      const minutes = Number(this.quiz.timeLimit) || 30;
      this.timeRemaining = minutes * 60;

      this.renderHeader();
      this.renderPalette();
      this.renderQuestion();
      this.startTimer();
    } catch (e) {
      console.error('Error loading quiz:', e);
      alert('Failed to load quiz. Please go back and try again.');
      window.location.href = '../index.html';
    }
  }

  startTimer() {
    this.updateTimerUI();
    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerUI();
      if (this.timeRemaining <= 0) {
        clearInterval(this.timer);
        this.autoSubmit();
      }
    }, 1000);
  }

  updateTimerUI() {
    const el = document.getElementById('timer-display');
    if (!el) return;
    const m = Math.floor(this.timeRemaining / 60).toString().padStart(2, '0');
    const s = (this.timeRemaining % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
  }

  renderHeader() {
    this.setText('#quiz-title', this.quiz.title || 'Quiz');
    this.setText('#total-questions', (this.quiz.questions?.length || 0));
    this.updateProgress();
  }

  setText(sel, val) {
    const el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  renderPalette() {
    const grid = document.getElementById('palette-grid');
    if (!grid) return;
    grid.innerHTML = '';
    (this.quiz.questions || []).forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'question-number not-visited';
      btn.textContent = (i + 1);
      btn.addEventListener('click', () => {
        this.currentIndex = i;
        this.renderQuestion();
      });
      grid.appendChild(btn);
    });
    this.updatePaletteClasses();
    this.updatePaletteStats();
  }

  updatePaletteClasses() {
    const btns = document.querySelectorAll('.question-number');
    btns.forEach((btn, i) => {
      let cls = 'question-number';
      if (i === this.currentIndex) cls += ' current';
      else if (this.userAnswers[i] !== undefined) cls += ' answered';
      else if (this.marked.has(i)) cls += ' marked';
      else cls += ' not-visited';
      btn.className = cls;
    });
  }

  updatePaletteStats() {
    const answered = Object.keys(this.userAnswers).length;
    const marked = this.marked.size;
    const total = this.quiz.questions?.length || 0;
    const visited = new Set([
      ...Object.keys(this.userAnswers).map(Number),
      ...Array.from(this.marked),
      this.currentIndex
    ]).size;
    const remaining = Math.max(0, total - visited);
    this.setText('#answered-count', answered);
    this.setText('#marked-count', marked);
    this.setText('#remaining-count', remaining);
  }

  renderQuestion() {
    const q = this.quiz.questions?.[this.currentIndex];
    if (!q) return;

    this.setText('#current-question-number', this.currentIndex + 1);
    this.setText('#question-text', q.question || 'Question');

    // Options
    const box = document.getElementById('options-container');
    if (!box) return;
    box.innerHTML = '';

    const options = Array.isArray(q.options) ? q.options : ['True', 'False'];
    options.forEach((opt, i) => {
      const item = document.createElement('div');
      item.className = 'option-item';
      if (this.userAnswers[this.currentIndex] === i) item.classList.add('selected');

      item.innerHTML = `
        <input type="radio" class="option-input" name="q-${this.currentIndex}" id="opt-${i}" value="${i}">
        <label for="opt-${i}" class="option-text">${opt}</label>
      `;
      item.addEventListener('click', () => this.select(i));
      box.appendChild(item);
    });

    // Buttons state
    const prev = document.getElementById('btn-previous');
    const next = document.getElementById('btn-next');
    if (prev) prev.disabled = this.currentIndex === 0;
    if (next) next.innerHTML = (this.currentIndex === (this.quiz.questions.length - 1))
      ? '<i class="fas fa-flag-checkered"></i> Finish'
      : 'Next <i class="fas fa-chevron-right"></i>';

    // Mark button
    const mark = document.getElementById('btn-mark');
    if (mark) {
      if (this.marked.has(this.currentIndex)) {
        mark.classList.add('active');
        mark.innerHTML = '<i class="fas fa-flag"></i> Marked for Review';
      } else {
        mark.classList.remove('active');
        mark.innerHTML = '<i class="fas fa-flag"></i> Mark for Review';
      }
    }

    this.updateProgress();
    this.updatePaletteClasses();
    this.updatePaletteStats();
  }

  updateProgress() {
    const total = this.quiz.questions?.length || 1;
    const answered = Object.keys(this.userAnswers).length;
    const pct = Math.round((answered / total) * 100);
    const bar = document.getElementById('progress-fill');
    const txt = document.getElementById('progress-percentage');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
  }

  select(i) {
    this.userAnswers[this.currentIndex] = i;
    this.renderQuestion();
  }

  clearResponse() {
    if (this.userAnswers[this.currentIndex] !== undefined) {
      delete this.userAnswers[this.currentIndex];
      this.renderQuestion();
    }
  }

  toggleMark() {
    if (this.marked.has(this.currentIndex)) this.marked.delete(this.currentIndex);
    else this.marked.add(this.currentIndex);
    this.renderQuestion();
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderQuestion();
    }
  }

  next() {
    if (!this.quiz?.questions) return;
    if (this.currentIndex < this.quiz.questions.length - 1) {
      this.currentIndex++;
      this.renderQuestion();
    } else {
      this.showSubmitModal();
    }
  }

  showSubmitModal() {
    const modal = document.getElementById('submit-modal');
    if (!modal) return;

    const answered = Object.keys(this.userAnswers).length;
    const notAnswered = (this.quiz.questions?.length || 0) - answered;
    const marked = this.marked.size;

    this.setText('#submit-answered', answered);
    this.setText('#submit-not-answered', notAnswered);
    this.setText('#submit-marked', marked);

    modal.classList.add('show');
  }

  hideSubmitModal() {
    const modal = document.getElementById('submit-modal');
    if (modal) modal.classList.remove('show');
  }

  autoSubmit() {
    alert('Time is up! Submitting your quiz...');
    this.submit();
  }

  async submit() {
    try {
      this.hideSubmitModal();

      // Compute result
      const total = this.quiz.questions?.length || 0;
      let correct = 0;
      const detailed = [];

      this.quiz.questions.forEach((q, i) => {
        const selected = this.userAnswers[i];
        const correctAnswer = Number.isInteger(q.correctAnswer) ? q.correctAnswer
          : (q.correct !== undefined ? q.correct : 0);
        const isCorrect = selected === correctAnswer;
        if (isCorrect) correct++;

        detailed.push({
          questionIndex: i,
          selectedOption: selected ?? null,
          correctAnswer,
          isCorrect,
          isSkipped: selected === undefined
        });
      });

      const percentage = total ? Math.round((correct / total) * 100) : 0;
      const payload = {
        quizId: this.quizId,
        quizTitle: this.quiz.title || 'Quiz',
        userId: this.currentUser?.uid || '',
        userEmail: this.currentUser?.email || '',
        userName: this.currentUser?.displayName || (this.currentUser?.email?.split('@')[0]) || 'User',
        score: correct,
        total,
        percentage,
        timeTaken: (Number(this.quiz.timeLimit) || 30) * 60 - this.timeRemaining,
        answers: detailed,
        userAnswers: this.userAnswers,
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Save results
      const ref = await this.db.collection('quizResults').add(payload);

      // Redirect to results
      const params = new URLSearchParams({
        resultId: ref.id,
        quizId: this.quizId
      });
      window.location.href = `results.html?${params.toString()}`;
    } catch (e) {
      console.error('Submit failed:', e);
      alert('Failed to submit quiz. Please try again.');
    }
  }
}

// ✅ Export globally for quiz.html
window.QuizManager = QuizManager;
