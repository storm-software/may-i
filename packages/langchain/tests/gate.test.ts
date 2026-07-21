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

import type { CredentialSource } from "@may-i/core";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LANGCHAIN_CREDENTIALS,
  ask,
  credentialsForModel,
  gate,
  isMayIError,
  langchainCredential,
  resolveProviderId
} from "../src/index.ts";

function credentialNames(sources: CredentialSource[]): string[] {
  return sources.map((source, index) => {
    if (typeof source === "string") {
      return source;
    }
    if (typeof source === "function") {
      return `custom[${index}]`;
    }
    return source.name;
  });
}

describe("credentialsForModel", () => {
  it("maps provider:model strings to provider credentials", () => {
    expect(credentialNames(credentialsForModel("openai:gpt-5.5"))).toEqual([
      "OPENAI_API_KEY"
    ]);
    expect(
      credentialNames(credentialsForModel("anthropic:claude-sonnet-4-6"))
    ).toEqual(["ANTHROPIC_API_KEY"]);
    expect(
      credentialNames(
        credentialsForModel("google-genai:gemini-3.1-pro-preview")
      )
    ).toEqual(["GOOGLE_API_KEY"]);
    expect(
      credentialNames(credentialsForModel("azure_openai:gpt-5.5"))
    ).toEqual(["AZURE_OPENAI_API_KEY"]);
    expect(
      credentialNames(
        credentialsForModel("openrouter:anthropic/claude-sonnet-4-6")
      )
    ).toEqual(["OPENROUTER_API_KEY"]);
  });

  it("maps provider/model slash strings", () => {
    expect(credentialNames(credentialsForModel("groq/llama"))).toEqual([
      "GROQ_API_KEY"
    ]);
  });

  it("reads provider from _llmType on model objects", () => {
    expect(
      credentialNames(
        credentialsForModel({
          _llmType: () => "anthropic"
        })
      )
    ).toEqual(["ANTHROPIC_API_KEY"]);
  });

  it("infers provider from lc_id Chat* class names", () => {
    expect(
      credentialNames(
        credentialsForModel({
          lc_id: ["langchain", "chat_models", "openai", "ChatOpenAI"]
        })
      )
    ).toEqual(["OPENAI_API_KEY"]);
  });

  it("falls back to default credential list for unknown providers", () => {
    expect(resolveProviderId("unknown-model-id")).toBeUndefined();
    expect(credentialNames(credentialsForModel("unknown-model-id"))).toEqual(
      credentialNames(DEFAULT_LANGCHAIN_CREDENTIALS)
    );
  });
});

describe("gate / ask", () => {
  it("defaults credentials and runs when a provider key exists", async () => {
    const run = vi.fn(async () => ({ content: "from-model" }));

    const result = await gate({
      env: { OPENAI_API_KEY: "sk-test" },
      default: { content: "fallback" }
    })(run);

    expect(result).toEqual({ content: "from-model" });
    expect(run).toHaveBeenCalledOnce();
  });

  it("returns LangChain-shaped default when credentials are missing", async () => {
    const run = vi.fn(async () => ({ content: "from-model" }));
    const onFallback = vi.fn();

    const result = await ask({
      env: {},
      default: { content: "Offline fallback" },
      onFallback,
      run
    });

    expect(result).toEqual({ content: "Offline fallback" });
    expect(run).toHaveBeenCalledTimes(0);
    expect(onFallback).toHaveBeenCalledOnce();
  });

  it("throws MayIError when credentials and default are both missing", async () => {
    await expect(
      ask({
        credentials: langchainCredential("OPENAI_API_KEY"),
        env: {},
        run: async () => ({ content: "nope" })
      })
    ).rejects.toSatisfy(error => {
      expect(isMayIError(error)).toBe(true);
      return true;
    });
  });

  it("allows model-specific credential overrides", async () => {
    const askModel = gate({
      credentials: credentialsForModel("xai:grok-4"),
      env: { XAI_API_KEY: "xai-key" }
    });

    await expect(askModel.allowed()).resolves.toBe(true);
  });
});
