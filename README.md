# ProofOfAIWork Marketing Site

Public acquisition site for `proofofaiwork.com`. The product app remains at `https://app.proofofaiwork.com`.

## Run

```bash
npm install
npm run dev
npm run check:content
npm run build
```

## Routes

- `/`
- `/quizzes`
- `/quizzes/ai-native-score`
- `/quizzes/ai-work-style`
- `/blog`
- `/blog/:slug`
- `/scores`
- `/examples`
- `/your-ai-resume`
- `/resume-is-dead`
- `/your-ai-resume/:slug`
- `/:seo-opportunity-slug`
- `/employers`
- `/job-seekers`
- `/about`
- `/privacy`
- `/terms`

## Adding Blog Posts

Add posts in `src/marketing/content/blog.ts`. Each post needs:

- `title`
- `slug`
- `description`
- `date`
- `category`
- `seoTitle`
- `seoDescription`
- `body`

Keep slugs unique and route-safe. Run `npm run check:content` after adding posts.

## Editing Quizzes

Quiz definitions live in `src/marketing/data/quiz.ts`. Scoring logic lives in `src/marketing/lib/quiz.ts`.

Each primary quiz should have 8 to 12 questions. Each answer choice has a `points` value from 0 to 10. The result score is normalized to 0-100 and mapped to these labels:

- 90-100: AI-Native Operator
- 80-89: AI-Augmented Builder
- 70-79: Capable AI Collaborator
- 60-69: Emerging AI Worker
- Below 60: Early AI Explorer

Quiz results are directional only. Verified proof requires a real transcript in the app.
