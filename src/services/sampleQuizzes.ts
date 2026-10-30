import { SubjectId } from '../types';

export function detectQuestionCount(htmlContent: string): number {
  if (!htmlContent) return 0;
  
  // Strategy 1: Look for question container classes or IDs
  const questionMatches = htmlContent.match(/class=["'][^"']*\b(question|quiz-question|question-card|q-card|mcq-item)\b[^"']*["']/gi);
  if (questionMatches && questionMatches.length > 0) {
    return questionMatches.length;
  }

  // Strategy 2: Look for radio buttons or form inputs grouped by question name like name="q1", name="question1"
  const nameMatches = htmlContent.match(/name=["'](q\d+|question\d+|mcq\d+)["']/gi);
  if (nameMatches && nameMatches.length > 0) {
    const uniqueNames = new Set(nameMatches.map((m) => m.toLowerCase()));
    return uniqueNames.size;
  }

  // Strategy 3: Look for Question numbering patterns like "Question 1", "Q1.", "Q 1."
  const textMatches = htmlContent.match(/(?:Question\s+\d+|Q\s*\d+\s*[.:\)])/gi);
  if (textMatches && textMatches.length > 0) {
    return Math.min(textMatches.length, 100);
  }

  // Strategy 4: Count fieldsets or options blocks
  const fieldsetMatches = htmlContent.match(/<fieldset\b/gi);
  if (fieldsetMatches && fieldsetMatches.length > 0) {
    return fieldsetMatches.length;
  }

  return 0;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const SAMPLE_QUIZZES: Record<
  SubjectId,
  { name: string; title: string; filename: string; content: string }
> = {
  biology: {
    name: 'Cell: The Unit of Life (NCERT)',
    title: 'Cell Structure and Functions Interactive MCQ',
    filename: 'Biology_Cell_Structure_Quiz.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cell Structure & Functions - NCERT Quiz</title>
  <style>
    :root {
      --primary: #059669;
      --primary-light: #ecfdf5;
      --text: #1e293b;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --correct: #10b981;
      --incorrect: #ef4444;
      --border: #e2e8f0;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 16px;
      line-height: 1.5;
    }
    .quiz-container {
      max-width: 650px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
    .header {
      border-bottom: 2px solid var(--primary-light);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 20px;
      margin: 8px 0 4px 0;
      color: #0f172a;
    }
    .sub {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .question-card {
      background: #fafafa;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 20px;
      transition: all 0.2s ease;
    }
    .q-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 14px;
      color: #0f172a;
    }
    .options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .opt-label {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      background: #ffffff;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: border 0.15s, background 0.15s;
    }
    .opt-label:hover {
      border-color: var(--primary);
      background: var(--primary-light);
    }
    .opt-label input {
      margin-right: 12px;
      accent-color: var(--primary);
    }
    .explanation {
      display: none;
      margin-top: 12px;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.4;
    }
    .explanation.show {
      display: block;
    }
    .correct-ans {
      border-color: var(--correct) !important;
      background-color: #ecfdf5 !important;
      font-weight: 600;
      color: #065f46;
    }
    .wrong-ans {
      border-color: var(--incorrect) !important;
      background-color: #fef2f2 !important;
      color: #991b1b;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    .btn {
      flex: 1;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .btn-submit {
      background: var(--primary);
      color: white;
    }
    .btn-submit:hover {
      background: #047857;
    }
    .btn-reset {
      background: #e2e8f0;
      color: #334155;
    }
    .btn-reset:hover {
      background: #cbd5e1;
    }
    .score-banner {
      display: none;
      margin-top: 20px;
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      background: #f0fdf4;
      border: 2px solid #86efac;
    }
    .score-val {
      font-size: 26px;
      font-weight: 800;
      color: #15803d;
    }
  </style>
</head>
<body>
  <div class="quiz-container">
    <div class="header">
      <span class="badge">Biology • Chapter 8</span>
      <h1>Cell: The Unit of Life</h1>
      <p class="sub">Generated via Claude AI • Interactive NCERT Practice</p>
    </div>

    <form id="quizForm">
      <!-- Q1 -->
      <div class="question-card" id="q1-box">
        <div class="q-title">1. Which organelle is known as the powerhouse of the cell?</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q1" value="A"> Ribosome</label>
          <label class="opt-label"><input type="radio" name="q1" value="B"> Mitochondrion</label>
          <label class="opt-label"><input type="radio" name="q1" value="C"> Golgi Apparatus</label>
          <label class="opt-label"><input type="radio" name="q1" value="D"> Lysosome</label>
        </div>
        <div class="explanation" id="exp1"></div>
      </div>

      <!-- Q2 -->
      <div class="question-card" id="q2-box">
        <div class="q-title">2. Fluid Mosaic Model was proposed by Singer and Nicolson in which year?</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q2" value="A"> 1950</label>
          <label class="opt-label"><input type="radio" name="q2" value="B"> 1965</label>
          <label class="opt-label"><input type="radio" name="q2" value="C"> 1972</label>
          <label class="opt-label"><input type="radio" name="q2" value="D"> 1982</label>
        </div>
        <div class="explanation" id="exp2"></div>
      </div>

      <!-- Q3 -->
      <div class="question-card" id="q3-box">
        <div class="q-title">3. Which of the following is NOT a component of endomembrane system?</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q3" value="A"> Endoplasmic Reticulum</label>
          <label class="opt-label"><input type="radio" name="q3" value="B"> Golgi complex</label>
          <label class="opt-label"><input type="radio" name="q3" value="C"> Peroxisome</label>
          <label class="opt-label"><input type="radio" name="q3" value="D"> Lysosome</label>
        </div>
        <div class="explanation" id="exp3"></div>
      </div>

      <!-- Q4 -->
      <div class="question-card" id="q4-box">
        <div class="q-title">4. Ribosomes found in Prokaryotes are of which type?</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q4" value="A"> 70S (50S + 30S)</label>
          <label class="opt-label"><input type="radio" name="q4" value="B"> 80S (60S + 40S)</label>
          <label class="opt-label"><input type="radio" name="q4" value="C"> 60S</label>
          <label class="opt-label"><input type="radio" name="q4" value="D"> 50S</label>
        </div>
        <div class="explanation" id="exp4"></div>
      </div>

      <!-- Q5 -->
      <div class="question-card" id="q5-box">
        <div class="q-title">5. Middle lamella is mainly composed of:</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q5" value="A"> Cellulose</label>
          <label class="opt-label"><input type="radio" name="q5" value="B"> Hemicellulose</label>
          <label class="opt-label"><input type="radio" name="q5" value="C"> Calcium pectate</label>
          <label class="opt-label"><input type="radio" name="q5" value="D"> Chitin</label>
        </div>
        <div class="explanation" id="exp5"></div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-submit" id="submitBtn" onclick="calculateScore()">Submit Quiz</button>
        <button type="button" class="btn btn-reset" onclick="resetQuiz()">Retry</button>
      </div>
    </form>

    <div class="score-banner" id="scoreBanner">
      <div class="score-val" id="scoreText">0 / 5</div>
      <p style="margin: 6px 0 0; font-size: 14px; color: #166534;" id="feedbackText">Great job!</p>
    </div>
  </div>

  <script>
    const answerKey = {
      q1: { ans: 'B', exp: 'Mitochondria are the sites of aerobic respiration and produce cellular energy in the form of ATP.' },
      q2: { ans: 'C', exp: 'Singer and Nicolson proposed the widely accepted Fluid Mosaic Model of plasma membrane in 1972.' },
      q3: { ans: 'C', exp: 'Endomembrane system includes ER, Golgi apparatus, lysosomes and vacuoles. Peroxisomes, chloroplasts, and mitochondria are not part of it.' },
      q4: { ans: 'A', exp: 'Prokaryotic ribosomes are 70S, consisting of two subunits: 50S and 30S.' },
      q5: { ans: 'C', exp: 'Middle lamella is a layer made of calcium pectate which holds and glues neighbouring plant cells together.' }
    };

    function calculateScore() {
      let score = 0;
      let total = Object.keys(answerKey).length;

      for (let q in answerKey) {
        const selected = document.querySelector('input[name="' + q + '"]:checked');
        const box = document.getElementById(q + '-box');
        const exp = document.getElementById('exp' + q.replace('q', ''));
        const labels = box.querySelectorAll('.opt-label');

        labels.forEach(l => {
          l.classList.remove('correct-ans', 'wrong-ans');
          const inp = l.querySelector('input');
          if (inp.value === answerKey[q].ans) {
            l.classList.add('correct-ans');
          } else if (selected && inp.value === selected.value && selected.value !== answerKey[q].ans) {
            l.classList.add('wrong-ans');
          }
        });

        exp.classList.add('show');
        if (selected && selected.value === answerKey[q].ans) {
          score++;
          exp.style.backgroundColor = '#ecfdf5';
          exp.style.color = '#065f46';
          exp.innerHTML = '<strong>Correct!</strong> ' + answerKey[q].exp;
        } else {
          exp.style.backgroundColor = '#fef2f2';
          exp.style.color = '#991b1b';
          exp.innerHTML = '<strong>Incorrect.</strong> Correct answer is (' + answerKey[q].ans + '). ' + answerKey[q].exp;
        }
      }

      const banner = document.getElementById('scoreBanner');
      banner.style.display = 'block';
      document.getElementById('scoreText').innerText = score + ' / ' + total + ' (' + Math.round((score/total)*100) + '%)';
      document.getElementById('feedbackText').innerText = score === total ? 'Perfection! Excellent mastery of NCERT!' : score >= 3 ? 'Good job! Review the explanations above.' : 'Keep revising NCERT textbook concepts!';
      banner.scrollIntoView({ behavior: 'smooth' });
    }

    function resetQuiz() {
      document.getElementById('quizForm').reset();
      document.querySelectorAll('.opt-label').forEach(l => l.classList.remove('correct-ans', 'wrong-ans'));
      document.querySelectorAll('.explanation').forEach(e => {
        e.classList.remove('show');
        e.innerHTML = '';
      });
      document.getElementById('scoreBanner').style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  </script>
</body>
</html>`
  },
  chemistry: {
    name: 'Chemical Bonding & Molecular Structure',
    title: 'Chemical Bonding & Hybridisation Interactive Test',
    filename: 'Chemistry_Chemical_Bonding_MCQ.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chemical Bonding - Interactive MCQ</title>
  <style>
    :root {
      --primary: #b91c1c;
      --primary-light: #fef2f2;
      --text: #1e293b;
      --bg: #fff5f5;
      --card-bg: #ffffff;
      --correct: #10b981;
      --incorrect: #ef4444;
      --border: #fecaca;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 16px;
    }
    .quiz-container {
      max-width: 650px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 15px rgba(185, 28, 28, 0.08);
    }
    .header {
      border-bottom: 2px solid var(--primary-light);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
    }
    h1 {
      font-size: 20px;
      margin: 8px 0 4px 0;
      color: #881337;
    }
    .sub { font-size: 13px; color: #64748b; margin: 0; }
    .question-card {
      background: #fffafa;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .q-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; color: #4c0519; }
    .options { display: flex; flex-direction: column; gap: 10px; }
    .opt-label {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      background: #ffffff;
      border: 1.5px solid #fed7d7;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }
    .opt-label input { margin-right: 12px; accent-color: var(--primary); }
    .explanation { display: none; margin-top: 12px; padding: 12px; border-radius: 8px; font-size: 13px; }
    .explanation.show { display: block; }
    .correct-ans { border-color: var(--correct) !important; background-color: #ecfdf5 !important; color: #065f46; font-weight: 600; }
    .wrong-ans { border-color: var(--incorrect) !important; background-color: #fef2f2 !important; color: #991b1b; }
    .actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn { flex: 1; padding: 14px; font-size: 15px; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; }
    .btn-submit { background: var(--primary); color: white; }
    .btn-reset { background: #e2e8f0; color: #334155; }
    .score-banner { display: none; margin-top: 20px; padding: 16px; border-radius: 12px; text-align: center; background: #fff1f2; border: 2px solid #fda4af; }
    .score-val { font-size: 26px; font-weight: 800; color: #9f1239; }
  </style>
</head>
<body>
  <div class="quiz-container">
    <div class="header">
      <span class="badge">Chemistry • Unit 4</span>
      <h1>Chemical Bonding & Molecular Structure</h1>
      <p class="sub">Generated via Claude AI • NCERT Hybridisation Practice</p>
    </div>

    <form id="quizForm">
      <div class="question-card" id="q1-box">
        <div class="q-title">1. The hybridisation of Xenon in XeF4 is:</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q1" value="A"> sp3d</label>
          <label class="opt-label"><input type="radio" name="q1" value="B"> sp3d2 (Square planar)</label>
          <label class="opt-label"><input type="radio" name="q1" value="C"> sp3</label>
          <label class="opt-label"><input type="radio" name="q1" value="D"> dsp2</label>
        </div>
        <div class="explanation" id="exp1"></div>
      </div>

      <div class="question-card" id="q2-box">
        <div class="q-title">2. Which molecule has a dipole moment (μ ≠ 0)?</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q2" value="A"> CO2</label>
          <label class="opt-label"><input type="radio" name="q2" value="B"> BF3</label>
          <label class="opt-label"><input type="radio" name="q2" value="C"> NH3</label>
          <label class="opt-label"><input type="radio" name="q2" value="D"> CCl4</label>
        </div>
        <div class="explanation" id="exp2"></div>
      </div>

      <div class="question-card" id="q3-box">
        <div class="q-title">3. What is the bond order of O2+ according to Molecular Orbital Theory?</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q3" value="A"> 1.5</label>
          <label class="opt-label"><input type="radio" name="q3" value="B"> 2.0</label>
          <label class="opt-label"><input type="radio" name="q3" value="C"> 2.5</label>
          <label class="opt-label"><input type="radio" name="q3" value="D"> 3.0</label>
        </div>
        <div class="explanation" id="exp3"></div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-submit" onclick="calculateScore()">Submit Answers</button>
        <button type="button" class="btn btn-reset" onclick="resetQuiz()">Reset</button>
      </div>
    </form>

    <div class="score-banner" id="scoreBanner">
      <div class="score-val" id="scoreText">0 / 3</div>
      <p style="margin: 6px 0 0; font-size: 14px; color: #9f1239;" id="feedbackText">Test complete!</p>
    </div>
  </div>

  <script>
    const answerKey = {
      q1: { ans: 'B', exp: 'Xe has 8 valence electrons, 4 bonding pairs + 2 lone pairs = steric number 6 (sp3d2, square planar shape).' },
      q2: { ans: 'C', exp: 'NH3 has a pyramidal structure with a lone pair reinforcing bond dipoles, giving it a net dipole moment (1.47 D).' },
      q3: { ans: 'C', exp: 'O2+ has 15 electrons: (Nb - Na)/2 = (10 - 5)/2 = 2.5.' }
    };

    function calculateScore() {
      let score = 0;
      let total = Object.keys(answerKey).length;
      for (let q in answerKey) {
        const selected = document.querySelector('input[name="' + q + '"]:checked');
        const box = document.getElementById(q + '-box');
        const exp = document.getElementById('exp' + q.replace('q', ''));
        const labels = box.querySelectorAll('.opt-label');

        labels.forEach(l => {
          l.classList.remove('correct-ans', 'wrong-ans');
          const inp = l.querySelector('input');
          if (inp.value === answerKey[q].ans) l.classList.add('correct-ans');
          else if (selected && inp.value === selected.value) l.classList.add('wrong-ans');
        });

        exp.classList.add('show');
        if (selected && selected.value === answerKey[q].ans) {
          score++;
          exp.style.backgroundColor = '#ecfdf5'; exp.style.color = '#065f46';
          exp.innerHTML = '<strong>Correct!</strong> ' + answerKey[q].exp;
        } else {
          exp.style.backgroundColor = '#fef2f2'; exp.style.color = '#991b1b';
          exp.innerHTML = '<strong>Incorrect.</strong> Answer: (' + answerKey[q].ans + '). ' + answerKey[q].exp;
        }
      }
      const banner = document.getElementById('scoreBanner');
      banner.style.display = 'block';
      document.getElementById('scoreText').innerText = score + ' / ' + total;
      banner.scrollIntoView({ behavior: 'smooth' });
    }

    function resetQuiz() {
      document.getElementById('quizForm').reset();
      document.querySelectorAll('.opt-label').forEach(l => l.classList.remove('correct-ans', 'wrong-ans'));
      document.querySelectorAll('.explanation').forEach(e => { e.classList.remove('show'); e.innerHTML = ''; });
      document.getElementById('scoreBanner').style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  </script>
</body>
</html>`
  },
  physics: {
    name: 'Kinematics & Motion in a Straight Line',
    title: 'Kinematics Formulas and Graph Problems',
    filename: 'Physics_Kinematics_Practice.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kinematics - Interactive Physics Quiz</title>
  <style>
    :root {
      --primary: #0284c7;
      --primary-light: #f0f9ff;
      --text: #0f172a;
      --bg: #f0f9ff;
      --card-bg: #ffffff;
      --correct: #10b981;
      --incorrect: #ef4444;
      --border: #bae6fd;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 16px;
    }
    .quiz-container {
      max-width: 650px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 15px rgba(2, 132, 199, 0.08);
    }
    .header { border-bottom: 2px solid var(--primary-light); padding-bottom: 16px; margin-bottom: 24px; }
    .badge { display: inline-block; background: var(--primary-light); color: var(--primary); font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
    h1 { font-size: 20px; margin: 8px 0 4px 0; color: #0369a1; }
    .sub { font-size: 13px; color: #64748b; margin: 0; }
    .question-card { background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .q-title { font-size: 15px; font-weight: 600; margin-bottom: 14px; color: #0c4a6e; }
    .options { display: flex; flex-direction: column; gap: 10px; }
    .opt-label { display: flex; align-items: center; padding: 10px 14px; background: #ffffff; border: 1.5px solid #e0f2fe; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .opt-label input { margin-right: 12px; accent-color: var(--primary); }
    .explanation { display: none; margin-top: 12px; padding: 12px; border-radius: 8px; font-size: 13px; }
    .explanation.show { display: block; }
    .correct-ans { border-color: var(--correct) !important; background-color: #ecfdf5 !important; color: #065f46; font-weight: 600; }
    .wrong-ans { border-color: var(--incorrect) !important; background-color: #fef2f2 !important; color: #991b1b; }
    .actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn { flex: 1; padding: 14px; font-size: 15px; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; }
    .btn-submit { background: var(--primary); color: white; }
    .btn-reset { background: #e2e8f0; color: #334155; }
    .score-banner { display: none; margin-top: 20px; padding: 16px; border-radius: 12px; text-align: center; background: #f0f9ff; border: 2px solid #7dd3fc; }
    .score-val { font-size: 26px; font-weight: 800; color: #0284c7; }
  </style>
</head>
<body>
  <div class="quiz-container">
    <div class="header">
      <span class="badge">Physics • Kinematics</span>
      <h1>Motion in a Straight Line</h1>
      <p class="sub">Generated via Claude AI • NCERT Numericals</p>
    </div>

    <form id="quizForm">
      <div class="question-card" id="q1-box">
        <div class="q-title">1. The slope of a velocity-time graph represents which physical quantity?</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q1" value="A"> Displacement</label>
          <label class="opt-label"><input type="radio" name="q1" value="B"> Acceleration</label>
          <label class="opt-label"><input type="radio" name="q1" value="C"> Distance</label>
          <label class="opt-label"><input type="radio" name="q1" value="D"> Speed</label>
        </div>
        <div class="explanation" id="exp1"></div>
      </div>

      <div class="question-card" id="q2-box">
        <div class="q-title">2. A ball is thrown vertically upwards with velocity 20 m/s (g = 10 m/s²). What is the maximum height reached?</div>
        <div class="options">
          <label class="opt-label"><input type="radio" name="q2" value="A"> 10 m</label>
          <label class="opt-label"><input type="radio" name="q2" value="B"> 20 m</label>
          <label class="opt-label"><input type="radio" name="q2" value="C"> 40 m</label>
          <label class="opt-label"><input type="radio" name="q2" value="D"> 5 m</label>
        </div>
        <div class="explanation" id="exp2"></div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-submit" onclick="calculateScore()">Check Answers</button>
        <button type="button" class="btn btn-reset" onclick="resetQuiz()">Clear</button>
      </div>
    </form>

    <div class="score-banner" id="scoreBanner">
      <div class="score-val" id="scoreText">0 / 2</div>
      <p style="margin: 6px 0 0; font-size: 14px; color: #0284c7;" id="feedbackText">Test complete!</p>
    </div>
  </div>

  <script>
    const answerKey = {
      q1: { ans: 'B', exp: 'Acceleration is the rate of change of velocity: a = dv/dt, which is the slope of v-t graph.' },
      q2: { ans: 'B', exp: 'Using v² = u² - 2gh: At top v=0, so 0 = (20)² - 2(10)h => 20h = 400 => h = 20 meters.' }
    };

    function calculateScore() {
      let score = 0;
      let total = Object.keys(answerKey).length;
      for (let q in answerKey) {
        const selected = document.querySelector('input[name="' + q + '"]:checked');
        const box = document.getElementById(q + '-box');
        const exp = document.getElementById('exp' + q.replace('q', ''));
        const labels = box.querySelectorAll('.opt-label');

        labels.forEach(l => {
          l.classList.remove('correct-ans', 'wrong-ans');
          const inp = l.querySelector('input');
          if (inp.value === answerKey[q].ans) l.classList.add('correct-ans');
          else if (selected && inp.value === selected.value) l.classList.add('wrong-ans');
        });

        exp.classList.add('show');
        if (selected && selected.value === answerKey[q].ans) {
          score++;
          exp.style.backgroundColor = '#ecfdf5'; exp.style.color = '#065f46';
          exp.innerHTML = '<strong>Correct!</strong> ' + answerKey[q].exp;
        } else {
          exp.style.backgroundColor = '#fef2f2'; exp.style.color = '#991b1b';
          exp.innerHTML = '<strong>Incorrect.</strong> Answer is (' + answerKey[q].ans + '). ' + answerKey[q].exp;
        }
      }
      const banner = document.getElementById('scoreBanner');
      banner.style.display = 'block';
      document.getElementById('scoreText').innerText = score + ' / ' + total;
      banner.scrollIntoView({ behavior: 'smooth' });
    }

    function resetQuiz() {
      document.getElementById('quizForm').reset();
      document.querySelectorAll('.opt-label').forEach(l => l.classList.remove('correct-ans', 'wrong-ans'));
      document.querySelectorAll('.explanation').forEach(e => { e.classList.remove('show'); e.innerHTML = ''; });
      document.getElementById('scoreBanner').style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  </script>
</body>
</html>`
  }
};
