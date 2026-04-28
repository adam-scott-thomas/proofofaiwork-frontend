const API_BASE = "https://api.proofofaiwork.com/api/v1";

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetPath = url.pathname.replace(/^\/api\/v1\/?/, "");
  const targetUrl = new URL(`${API_BASE}/${targetPath}`);
  targetUrl.search = url.search;

  const headers = new Headers(context.request.headers);

  const response = await fetch(targetUrl.toString(), {
    method: context.request.method,
    headers,
    body: context.request.method === "GET" || context.request.method === "HEAD"
      ? undefined
      : context.request.body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("access-control-allow-origin");
  responseHeaders.delete("access-control-allow-credentials");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};
