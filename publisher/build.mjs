import { spawn } from "node:child_process";
import { access, copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, "..");
const varRoot = path.join(workspace, "var");
const currentDir = path.join(varRoot, "public-dist");
const nextDir = path.join(varRoot, "public-dist-next");
const backupDir = path.join(varRoot, "public-dist-backup");
const apiUrl = process.env.API_URL || "http://api:8000";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function writeStaticShell() {
  await mkdir(path.join(nextDir, "assets"), { recursive: true });
  await mkdir(path.join(nextDir, "data"), { recursive: true });
  await mkdir(path.join(nextDir, "pdf"), { recursive: true });

  await build({
    entryPoints: [path.join(here, "public-app.tsx")],
    outfile: path.join(nextDir, "assets", "app.js"),
    bundle: true,
    minify: true,
    platform: "browser",
    format: "esm",
    jsx: "automatic",
    nodePaths: [path.join(here, "node_modules")],
    alias: {
      react: path.join(here, "node_modules", "react"),
      "react-dom": path.join(here, "node_modules", "react-dom"),
      "lucide-react": path.join(here, "node_modules", "lucide-react"),
    },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.NEXT_PUBLIC_API_PORT": '"8000"',
    },
  });

  const globalCss = await readFile(path.join(workspace, "frontend", "app", "globals.css"), "utf8");
  const css = globalCss.replace(/^@import "tailwindcss";\s*/m, "");
  await writeFile(path.join(nextDir, "assets", "app.css"), css);
  await writeFile(
    path.join(nextDir, "index.html"),
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="description" content="Blockfolio에서 발행한 이력서·포트폴리오·자기소개서" />
    <title>Blockfolio Resume</title>
    <link rel="stylesheet" href="/assets/app.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>`,
  );
  await writeFile(path.join(nextDir, "_redirects"), "/r/* / 200\n");
}

async function generate() {
  await mkdir(varRoot, { recursive: true });
  await rm(nextDir, { recursive: true, force: true });
  await writeStaticShell();

  const resumes = await fetchJson(`${apiUrl}/api/public/resumes`);
  await writeFile(
    path.join(nextDir, "data", "index.json"),
    JSON.stringify(
      resumes.map(({ title, slug, published_at }) => ({ title, slug, published_at })),
      null,
      2,
    ),
  );

  for (const resume of resumes) {
    await writeFile(
      path.join(nextDir, "data", `${resume.slug}.json`),
      JSON.stringify(resume, null, 2),
    );
    const pdfResponse = await fetch(`${apiUrl}/api/public/resumes/${resume.slug}/pdf`);
    if (!pdfResponse.ok) throw new Error(`PDF generation failed for ${resume.slug}`);
    await writeFile(
      path.join(nextDir, "pdf", `${resume.slug}.pdf`),
      Buffer.from(await pdfResponse.arrayBuffer()),
    );
  }

  await access(path.join(nextDir, "index.html"));
  await access(path.join(nextDir, "assets", "app.js"));
  await access(path.join(nextDir, "data", "index.json"));

  await rm(backupDir, { recursive: true, force: true });
  try {
    await rename(currentDir, backupDir);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await rename(nextDir, currentDir);
    await rm(backupDir, { recursive: true, force: true });
  } catch (error) {
    try {
      await rename(backupDir, currentDir);
    } catch {}
    throw error;
  }

  return resumes.length;
}

function deploy() {
  const project = process.env.CLOUDFLARE_PAGES_PROJECT;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!project || !account || !token) {
    throw new Error("Cloudflare credentials are required when DEPLOY=true");
  }
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      [
        "wrangler",
        "pages",
        "deploy",
        currentDir,
        "--project-name",
        project,
        "--branch",
        "main",
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          CLOUDFLARE_ACCOUNT_ID: account,
          CLOUDFLARE_API_TOKEN: token,
        },
      },
    );
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`wrangler exited ${code}`))));
  });
}

const count = await generate();
console.log(`Generated ${count} published resume(s) in ${currentDir}`);
if (process.env.DEPLOY === "true") {
  await deploy();
}
