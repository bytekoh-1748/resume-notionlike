import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the Blockfolio dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Blockfolio/);
  assert.match(html, /Blockfolio/);
  assert.match(html, /내 문서/);
  assert.match(html, /새 문서/);
  assert.doesNotMatch(html, /PDF까지 한 곳에서 관리하세요/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("renders the dynamic editor route", async () => {
  const response = await render("/editor/example-id");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /문서를 준비하는 중입니다/);
});
