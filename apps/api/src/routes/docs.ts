import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";

const specPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../openapi/openapi.yaml");
const openApiYaml = readFileSync(specPath, "utf8");

const scalar = Scalar({
  url: "/openapi.yaml",
  pageTitle: "Auzy API",
  theme: "kepler",
  darkMode: true,
  customCss: `
    :root {
      --scalar-color-accent: #2ee59d;
    }
  `,
});

export const docsRoutes = new Hono();

docsRoutes.get("/openapi.yaml", (c) =>
  c.text(openApiYaml, 200, {
    "Content-Type": "application/yaml; charset=utf-8",
    "Cache-Control": "no-store",
  }),
);

docsRoutes.get("/scalar", scalar);
docsRoutes.get("/docs", scalar);
