import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient, ApiClientError } from "@/lib/api";

function mockResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("surfaces API error messages for unauthorized responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(401, { error: "Unauthorized" })));

    await expect(apiClient.getMe()).rejects.toBeInstanceOf(ApiClientError);
    await expect(apiClient.getMe()).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
  });

  it("falls back to generic status text when API error payload is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(500, { unexpected: true })));

    await expect(apiClient.getFact()).rejects.toBeInstanceOf(ApiClientError);
    await expect(apiClient.getFact()).rejects.toMatchObject({
      status: 500,
      message: "Request failed with status 500",
    });
  });
});
