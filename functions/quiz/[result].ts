import { getQuizResult } from "../../src/app/content/quiz";
import { Env, SITE_BASE, htmlMetaPage, isBot } from "../_lib/meta";

export const onRequest: PagesFunction<Env> = async (context) => {
  if (!isBot(context.request)) {
    return context.env.ASSETS.fetch(context.request);
  }

  const resultSlug = context.params.result as string;
  const result = getQuizResult(resultSlug);
  if (!result) {
    return context.env.ASSETS.fetch(context.request);
  }

  const pageUrl = `${SITE_BASE}/quiz/${result.slug}`;
  return new Response(
    htmlMetaPage({
      title: `${result.name} | AI Work Style Quiz`,
      description: "Think you’re good with AI? Prove it. Take the quiz and see how you actually stack up.",
      pageUrl,
      imageUrl: `${SITE_BASE}/og/quiz-share.svg`,
      type: "article",
      cta: "See the full quiz result on Proof of AI Work",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
};
