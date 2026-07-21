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

import { describe, expect, it, vi } from "vitest";
import { invoke } from "../src/invoke.ts";

describe("invoke", () => {
  it("calls model.invoke when credentials exist", async () => {
    const invokeMock = vi.fn(async () => ({ content: "from-model" }));
    const model = {
      _llmType: () => "openai",
      invoke: invokeMock
    };

    const result = await invoke({
      model,
      input: "Hi",
      env: { OPENAI_API_KEY: "sk-test" },
      default: { content: "fallback" }
    });

    expect(result).toEqual({ content: "from-model" });
    expect(invokeMock).toHaveBeenCalledOnce();
    expect(invokeMock).toHaveBeenCalledWith("Hi", undefined);
  });

  it("passes config through to model.invoke", async () => {
    const invokeMock = vi.fn(async () => ({ content: "ok" }));
    const config = { tags: ["may-i"] };

    await invoke({
      model: {
        _llmType: () => "anthropic",
        invoke: invokeMock
      },
      input: [{ role: "user", content: "Hi" }],
      config,
      env: { ANTHROPIC_API_KEY: "key" },
      default: { content: "fallback" }
    });

    expect(invokeMock).toHaveBeenCalledWith(
      [{ role: "user", content: "Hi" }],
      config
    );
  });

  it("returns default without calling model when credentials missing", async () => {
    const invokeMock = vi.fn(async () => ({ content: "from-model" }));

    const result = await invoke({
      model: {
        _llmType: () => "openai",
        invoke: invokeMock
      },
      input: "Hi",
      env: {},
      default: { content: "Offline fallback" }
    });

    expect(result).toEqual({ content: "Offline fallback" });
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("infers GOOGLE_API_KEY from google-genai models", async () => {
    const invokeMock = vi.fn(async () => ({ content: "gemini-ok" }));

    const result = await invoke({
      model: {
        _llmType: () => "google-genai",
        invoke: invokeMock
      },
      input: "Hi",
      env: { GOOGLE_API_KEY: "gem-key" },
      default: { content: "fallback" }
    });

    expect(result).toEqual({ content: "gemini-ok" });
    expect(invokeMock).toHaveBeenCalledOnce();
  });
});
