import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const app = createApp({ silent: true });

describe("Scalar docs", () => {
  it("serves the OpenAPI contract", async () => {
    const response = await app.request("/openapi.yaml");
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/yaml/);
    expect(body).toContain("openapi: 3.1.0");
    expect(body).toContain("Auzy Smart Home API");
  });

  it("renders Scalar at /scalar and /docs", async () => {
    const scalar = await app.request("/scalar");
    const docs = await app.request("/docs");
    expect(scalar.status).toBe(200);
    expect(docs.status).toBe(200);
    expect(await scalar.text()).toContain("Auzy API");
    expect(await docs.text()).toContain("/openapi.yaml");
  });
});
