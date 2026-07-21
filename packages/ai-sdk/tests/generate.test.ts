/* -------------------------------------------------------------------

                        🗲 Storm Software - May I

 This code was released as part of the May I project. May I
 is maintained by Storm Software under the Apache-2.0 license, and is
 free for commercial and private use. For more information, please visit
 our licensing page at https://stormsoftware.com/licenses/projects/may-i.

 Website:                  https://stormsoftware.com
 Repository:               https://github.com/storm-software/may-i
 Documentation:            https://docs.stormsoftware.com/projects/may-i
 Contact:                  https://stormsoftware.com/contact

 SPDX-License-Identifier:  Apache-2.0

 ------------------------------------------------------------------- */

import { beforeEach, describe, expect, it, vi } from "vitest";

const generateTextMock = vi.fn();
const generateObjectMock = vi.fn();

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateTextMock(...args),
  generateObject: (...args: unknown[]) => generateObjectMock(...args)
}));

describe("generateText / generateObject", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
    generateObjectMock.mockReset();
  });

  it("calls AI SDK generateText when credentials exist", async () => {
    generateTextMock.mockResolvedValue({ text: "from-model" });

    const { generateText } = await import("../src/generate.ts");
    const result = await generateText({
      model: "openai/gpt-4.1",
      prompt: "Hi",
      env: { OPENAI_API_KEY: "sk-test" },
      default: { text: "fallback" }
    });

    expect(result).toEqual({ text: "from-model" });
    expect(generateTextMock).toHaveBeenCalledOnce();
    expect(generateTextMock.mock.calls[0]?.[0]).toMatchObject({
      model: "openai/gpt-4.1",
      prompt: "Hi"
    });
    expect(generateTextMock.mock.calls[0]?.[0]).not.toHaveProperty("default");
    expect(generateTextMock.mock.calls[0]?.[0]).not.toHaveProperty("env");
  });

  it("returns default without calling AI SDK when credentials missing", async () => {
    const { generateText } = await import("../src/generate.ts");
    const result = await generateText({
      model: "openai/gpt-4.1",
      prompt: "Hi",
      env: {},
      default: { text: "Offline fallback" }
    });

    expect(result).toEqual({ text: "Offline fallback" });
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("gates generateObject the same way", async () => {
    generateObjectMock.mockResolvedValue({ object: { ok: true } });

    const { generateObject } = await import("../src/generate.ts");
    const result = await generateObject({
      model: "anthropic/claude-sonnet-4.5",
      prompt: "ok?",
      env: { AI_GATEWAY_API_KEY: "gw" },
      default: { object: { ok: false } }
    } as never);

    expect(result).toEqual({ object: { ok: true } });
    expect(generateObjectMock).toHaveBeenCalledOnce();
  });
});
