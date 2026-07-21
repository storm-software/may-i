/* -------------------------------------------------------------------

                        🗲 Storm Software - May I

 This code was released as part of the May I project. May I
 is maintained by Storm Software under the Apache-2.0 license, and is
 free for commercial and private use. For more information, please visit
 our licensing page at https://stormsoftware.com/licenses/projects/may-i.

    10| Website:                  https://stormsoftware.com
 Repository:               https://github.com/storm-software/may-i
 Documentation:            https://docs.stormsoftware.com/projects/may-i
 Contact:                  https://stormsoftware.com/contact

 SPDX-License-Identifier:  Apache-2.0

 ------------------------------------------------------------------- */

import { beforeEach, describe, expect, it, vi } from "vitest";

const chatMock = vi.fn();

vi.mock("@tanstack/ai", () => ({
  chat: (...args: unknown[]) => chatMock(...args)
}));

describe("chat", () => {
  beforeEach(() => {
    chatMock.mockReset();
  });

  it("calls TanStack AI chat when credentials exist", async () => {
    chatMock.mockResolvedValue("from-model");

    const { chat } = await import("../src/chat.ts");
    const adapter = { name: "openai", model: "gpt-5.2", kind: "text" };
    const result = await chat({
      adapter: adapter as never,
      messages: [{ role: "user", content: "Hi" }],
      stream: false,
      env: { OPENAI_API_KEY: "sk-test" },
      default: "fallback"
    });

    expect(result).toBe("from-model");
    expect(chatMock).toHaveBeenCalledOnce();
    expect(chatMock.mock.calls[0]?.[0]).toMatchObject({
      adapter,
      messages: [{ role: "user", content: "Hi" }],
      stream: false
    });
    expect(chatMock.mock.calls[0]?.[0]).not.toHaveProperty("default");
    expect(chatMock.mock.calls[0]?.[0]).not.toHaveProperty("env");
  });

  it("returns default without calling TanStack AI when credentials missing", async () => {
    const { chat } = await import("../src/chat.ts");
    const result = await chat({
      adapter: { name: "openai", model: "gpt-5.2", kind: "text" } as never,
      messages: [{ role: "user", content: "Hi" }],
      stream: false,
      env: {},
      default: "Offline fallback"
    });

    expect(result).toBe("Offline fallback");
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("infers GEMINI_API_KEY from gemini adapters", async () => {
    chatMock.mockResolvedValue("gemini-ok");

    const { chat } = await import("../src/chat.ts");
    const result = await chat({
      adapter: { name: "gemini", model: "gemini-2.5-pro", kind: "text" } as never,
      messages: [{ role: "user", content: "Hi" }],
      stream: false,
      env: { GEMINI_API_KEY: "gem-key" },
      default: "fallback"
    });

    expect(result).toBe("gemini-ok");
    expect(chatMock).toHaveBeenCalledOnce();
  });
});
