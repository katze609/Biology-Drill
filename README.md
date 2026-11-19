# Biology Drill

A Next.js + TypeScript MVP for challenging biology practice and AI-assisted question drafting. AI-generated items are **drafts only**; they are not scientifically verified or approved for student use until reviewed by a qualified person.

## Run locally

```bash
npm install
cp .env.example .env.local
# Add your OpenAI API key to .env.local to enable question drafting.
npm run dev
```

Open http://localhost:3000. The practice screen works without an API key; AI drafting requires `OPENAI_API_KEY`.

## MVP scope

- Practice a sample biology question, reveal a worked explanation, and track a simple session score.
- Draft an original question with the OpenAI Chat Completions API.
- Keep generated content in an unreviewed draft state with source notes and reviewer fields to complete.
- Drafts currently live only in browser memory and disappear on refresh. No authentication or database is included yet.

## Content and safety notes

The AI endpoint is a drafting aid, not a credibility guarantee. Generated questions should be checked for factual accuracy, ambiguity, difficulty, exam alignment, and source/reuse rights before publication. Do not present model-generated citations as verified evidence. The sample practice item is illustrative and should also receive expert review before use in a production question bank.

Keep the API key server-side in `.env.local`; never expose it through a `NEXT_PUBLIC_` variable. The endpoint returns an error when the key is not configured.
