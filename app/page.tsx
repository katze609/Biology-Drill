"use client";

import { FormEvent, useState } from "react";

type DraftQuestion = {
  prompt: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  status: "Needs review";
  sourceNotes: string;
  reviewer: string;
};

const sampleQuestion = {
  topic: "Cellular respiration",
  level: "AP Biology · Application",
  prompt: "A researcher adds a compound that makes the inner mitochondrial membrane permeable to protons. Which change is most likely to occur first?",
  choices: [
    "ATP synthesis by ATP synthase decreases",
    "The electron transport chain immediately stops",
    "More protons accumulate in the intermembrane space",
    "Glycolysis begins producing oxygen",
  ],
  answer: 0,
  explanation:
    "ATP synthase uses the proton electrochemical gradient across the inner mitochondrial membrane to drive phosphorylation of ADP. If protons can cross the membrane without passing through ATP synthase, the gradient dissipates and ATP production by oxidative phosphorylation falls. Electron transport may continue for a time, but it no longer efficiently couples to ATP synthesis.",
};

export default function Home() {
  const [view, setView] = useState<"practice" | "drafts">("practice");
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ answered: 0, correct: 0 });
  const [topic, setTopic] = useState("Cellular respiration");
  const [level, setLevel] = useState("AP Biology");
  const [difficulty, setDifficulty] = useState("Challenge");
  const [draft, setDraft] = useState<DraftQuestion | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function selectAnswer(index: number) {
    if (selected !== null) return;
    setSelected(index);
    setScore((current) => ({
      answered: current.answered + 1,
      correct: current.correct + (index === sampleQuestion.answer ? 1 : 0),
    }));
  }

  async function generateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDrafting(true);
    setError("");
    setDraft(null);
    setSaved(false);
    try {
      const response = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level, difficulty }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not generate a draft.");
      setDraft(data.question);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setDrafting(false);
    }
  }

  function saveDraft() {
    if (!draft) return;
    const existing = JSON.parse(localStorage.getItem("biology-drill-drafts") ?? "[]") as DraftQuestion[];
    localStorage.setItem("biology-drill-drafts", JSON.stringify([draft, ...existing]));
    setSaved(true);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={() => setView("practice")}>
          <span className="brand-mark">b.</span>
          <span>biology<span className="brand-light">drill</span></span>
        </a>
        <div className="side-label">YOUR WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <button className={`nav-item ${view === "practice" ? "active" : ""}`} onClick={() => setView("practice")}><span>◉</span> Practice</button>
          <button className={`nav-item ${view === "drafts" ? "active" : ""}`} onClick={() => setView("drafts")}><span>✳</span> Draft studio</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="review-note"><span className="note-icon">✦</span><strong>Built for understanding</strong><p>Work through the why, not just the answer.</p></div>
          <div className="profile"><div className="avatar">S</div><div><strong>Study session</strong><small>Biology learner</small></div><span className="more">···</span></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="breadcrumb">Biology <span>/</span> {view === "practice" ? "Practice" : "Draft studio"}</div><div className="topbar-right"><span className="status-dot" /> MVP preview <span className="help">?</span></div></header>
        {view === "practice" ? (
          <div className="content practice-content">
            <div className="eyebrow"><span className="eyebrow-line" /> YOUR DAILY PRACTICE</div>
            <div className="heading-row"><div><h1>Think like a biologist.</h1><p className="subtitle">Build intuition with problems that go beyond memorization.</p></div><div className="streak"><span>✳</span><div><strong>{score.answered ? `${score.correct}/${score.answered}` : "0"}</strong><small>SESSION SCORE</small></div></div></div>
            <div className="topic-row"><span className="topic-chip">{sampleQuestion.topic}</span><span className="level-chip">{sampleQuestion.level}</span><span className="question-count">QUESTION 01 <span>/ 05</span></span></div>
            <article className="question-card">
              <div className="card-top"><span className="question-label">APPLICATION</span><span className="points">01 <span>—</span> 05</span></div>
              <h2>{sampleQuestion.prompt}</h2>
              <div className="answer-list">
                {sampleQuestion.choices.map((choice, index) => {
                  const isCorrect = index === sampleQuestion.answer;
                  const isSelected = selected === index;
                  const stateClass = selected !== null && isCorrect ? " correct" : isSelected ? " incorrect" : "";
                  return <button key={choice} onClick={() => selectAnswer(index)} disabled={selected !== null} className={`answer-option${stateClass}`}><span className="answer-letter">{String.fromCharCode(65 + index)}</span><span>{choice}</span>{selected !== null && isCorrect && <span className="answer-check">✓</span>}{isSelected && !isCorrect && <span className="answer-check">×</span>}</button>;
                })}
              </div>
              {selected !== null && <div className={`feedback ${selected === sampleQuestion.answer ? "feedback-good" : "feedback-retry"}`}><strong>{selected === sampleQuestion.answer ? "That's right." : "Not quite—here's the key idea."}</strong><p>{sampleQuestion.explanation}</p><button className="text-button" onClick={() => setRevealed(!revealed)}>{revealed ? "Hide reasoning" : "Explore the reasoning"} <span>↗</span></button>{revealed && <div className="reasoning-note">Think of the proton gradient as stored potential energy. Uncoupling lets that energy dissipate without powering ATP synthase.</div>}</div>}
              <div className="card-footer"><span>Designed to test <strong>cause &amp; effect</strong></span><button className="next-button" onClick={() => { setSelected(null); setRevealed(false); }}>Next question <span>→</span></button></div>
            </article>
            <div className="bottom-hint"><span>✦</span> Explanations focus on the biological reasoning behind each answer.</div>
          </div>
        ) : (
          <div className="content draft-content">
            <div className="eyebrow"><span className="eyebrow-line" /> CONTENT WORKSPACE</div>
            <h1>Draft a question.</h1>
            <p className="subtitle">Use AI to get a first draft, then verify every scientific claim before it reaches learners.</p>
            <div className="draft-grid">
              <form className="question-card draft-form" onSubmit={generateDraft}>
                <div className="card-top"><span className="question-label">AI DRAFT GENERATOR</span><span className="unreviewed-tag">UNREVIEWED</span></div>
                <label>Topic<input value={topic} onChange={(event) => setTopic(event.target.value)} required maxLength={100} placeholder="e.g. Gene regulation" /></label>
                <label>Track<select value={level} onChange={(event) => setLevel(event.target.value)}><option>AP Biology</option><option>Biology Olympiad</option><option>General biology</option></select></label>
                <label>Challenge level<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>Foundational</option><option>Intermediate</option><option>Challenge</option></select></label>
                {error && <div className="error-message" role="alert">{error}</div>}
                <button className="generate-button" disabled={drafting}>{drafting ? <><span className="spinner" /> Drafting question…</> : <>✦ Generate a draft <span>→</span></>}</button>
                <p className="form-disclaimer">Drafts are AI-generated and require expert review. Generated content may be inaccurate.</p>
              </form>
              <div className="draft-preview">
                {draft ? <article className="question-card generated-card"><div className="card-top"><span className="question-label">{draft.topic.toUpperCase()}</span><span className="unreviewed-tag">NEEDS REVIEW</span></div><h2>{draft.prompt}</h2><div className="answer-list">{draft.choices.map((choice, index) => <div key={choice} className="answer-option static-option"><span className="answer-letter">{String.fromCharCode(65 + index)}</span><span>{choice}</span></div>)}</div><div className="draft-explanation"><strong>Proposed answer: {draft.correctAnswer}</strong><p>{draft.explanation}</p></div><div className="review-fields"><span>Source: {draft.sourceNotes || "Add and verify sources"}</span><span>Reviewer: {draft.reviewer || "Not yet assigned"}</span></div><button className="generate-button save-button" onClick={saveDraft}>{saved ? "Saved in this browser ✓" : "Save draft locally"}</button></article> : <div className="empty-preview"><div className="empty-icon">✳</div><strong>Your draft will appear here</strong><p>Generated questions are saved as unreviewed drafts—not as approved learning content.</p><div className="review-checklist"><span>✓ Original question format</span><span>✓ Answer rationale included</span><span>✓ Review required before use</span></div></div>}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
