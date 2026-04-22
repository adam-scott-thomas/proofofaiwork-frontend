import { Env, SITE_BASE, htmlMetaPage, isBot } from "./_lib/meta";

export const onRequest: PagesFunction<Env> = async (context) => {
  if (!isBot(context.request)) {
    return context.env.ASSETS.fetch(context.request);
  }

  const pageUrl = `${SITE_BASE}/quiz`;
  return new Response(
    htmlMetaPage({
      title: "AI Work Style Quiz | Are You Leading AI or Letting It Lead You?",
      description:
        "Think you’re good with AI? Prove it. Take the quiz and see how you actually stack up.",
      pageUrl,
      imageUrl: `${SITE_BASE}/og/quiz-share.svg`,
      type: "article",
      cta: "Take the quiz on Proof of AI Work",
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
