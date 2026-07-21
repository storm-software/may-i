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
  DEFAULT_AISDK_CREDENTIALS,
  aiSdkCredential,
  ask,
  credentialsForModel,
  gate,
  isMayIError,
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
  it("maps provider/model strings to gateway + provider credentials", () => {
    expect(credentialNames(credentialsForModel("openai/gpt-4.1"))).toEqual([
      "AI_GATEWAY_API_KEY",
      "OPENAI_API_KEY"
    ]);
    expect(
      credentialNames(credentialsForModel("anthropic/claude-sonnet-4.5"))
    ).toEqual(["AI_GATEWAY_API_KEY", "ANTHROPIC_API_KEY"]);
  });

  it("reads provider from language model objects", () => {
    expect(
      credentialNames(
        credentialsForModel({
          provider: "groq",
          modelId: "llama",
          specificationVersion: "v3"
        } as never)
      )
    ).toEqual(["AI_GATEWAY_API_KEY", "GROQ_API_KEY"]);
  });

  it("falls back to default credential list for unknown providers", () => {
    expect(resolveProviderId("unknown-model-id")).toBeUndefined();
    expect(credentialNames(credentialsForModel("unknown-model-id"))).toEqual(
      credentialNames(DEFAULT_AISDK_CREDENTIALS)
    );
  });
});

describe("gate / ask", () => {
  it("defaults credentials and runs when a provider key exists", async () => {
    const run = vi.fn(async () => ({ text: "from-model" }));

    const result = await gate({
      env: { OPENAI_API_KEY: "sk-test" },
      default: { text: "fallback" }
    })(run);

    expect(result).toEqual({ text: "from-model" });
    expect(run).toHaveBeenCalledOnce();
  });

  it("returns AI SDK-shaped default when credentials are missing", async () => {
    const run = vi.fn(async () => ({ text: "from-model" }));
    const onFallback = vi.fn();

    const result = await ask({
      env: {},
      default: { text: "Offline fallback" },
      onFallback,
      run
    });

    expect(result).toEqual({ text: "Offline fallback" });
    expect(run).toHaveBeenCalledTimes(0);
    expect(onFallback).toHaveBeenCalledOnce();
  });

  it("throws MayIError when credentials and default are both missing", async () => {
    await expect(
      ask({
        credentials: aiSdkCredential("OPENAI_API_KEY", "OpenAI"),
        env: {},
        run: async () => ({ text: "nope" })
      })
    ).rejects.toSatisfy(error => {
      expect(isMayIError(error)).toBe(true);
      return true;
    });
  });

  it("allows model-specific credential overrides", async () => {
    const askModel = gate({
      credentials: credentialsForModel("xai/grok-4.5"),
      env: { XAI_API_KEY: "xai-key" }
    });

    await expect(askModel.allowed()).resolves.toBe(true);
  });
});
