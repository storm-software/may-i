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
  DEFAULT_TANSTACK_CREDENTIALS,
  ask,
  credentialsForAdapter,
  gate,
  isMayIError,
  resolveProviderId,
  tanstackCredential
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

describe("credentialsForAdapter", () => {
  it("maps adapter name to provider credentials", () => {
    expect(credentialNames(credentialsForAdapter({ name: "openai" }))).toEqual(
      ["OPENAI_API_KEY"]
    );
    expect(
      credentialNames(credentialsForAdapter({ name: "anthropic" }))
    ).toEqual(["ANTHROPIC_API_KEY"]);
    expect(credentialNames(credentialsForAdapter({ name: "gemini" }))).toEqual(
      ["GOOGLE_API_KEY|GEMINI_API_KEY"]
    );
    expect(credentialNames(credentialsForAdapter({ name: "grok" }))).toEqual([
      "XAI_API_KEY"
    ]);
    expect(
      credentialNames(credentialsForAdapter({ name: "openrouter" }))
    ).toEqual(["OPENROUTER_API_KEY"]);
  });

  it("accepts provider id strings", () => {
    expect(credentialNames(credentialsForAdapter("groq"))).toEqual([
      "GROQ_API_KEY"
    ]);
  });

  it("falls back to default credential list for unknown providers", () => {
    expect(resolveProviderId("unknown-provider")).toBe("unknown-provider");
    expect(
      credentialNames(credentialsForAdapter({ name: "unknown-provider" }))
    ).toEqual(credentialNames(DEFAULT_TANSTACK_CREDENTIALS));
  });
});

describe("gate / ask", () => {
  it("defaults credentials and runs when a provider key exists", async () => {
    const run = vi.fn(async () => "from-model");

    const result = await gate({
      env: { OPENAI_API_KEY: "sk-test" },
      default: "fallback"
    })(run);

    expect(result).toBe("from-model");
    expect(run).toHaveBeenCalledOnce();
  });

  it("returns TanStack-shaped default when credentials are missing", async () => {
    const run = vi.fn(async () => "from-model");
    const onFallback = vi.fn();

    const result = await ask({
      env: {},
      default: "Offline fallback",
      onFallback,
      run
    });

    expect(result).toBe("Offline fallback");
    expect(run).toHaveBeenCalledTimes(0);
    expect(onFallback).toHaveBeenCalledOnce();
  });

  it("throws MayIError when credentials and default are both missing", async () => {
    await expect(
      ask({
        credentials: tanstackCredential("OPENAI_API_KEY"),
        env: {},
        run: async () => "nope"
      })
    ).rejects.toSatisfy(error => {
      expect(isMayIError(error)).toBe(true);
      return true;
    });
  });

  it("allows adapter-specific credential overrides", async () => {
    const askModel = gate({
      credentials: credentialsForAdapter({ name: "grok" }),
      env: { XAI_API_KEY: "xai-key" }
    });

    await expect(askModel.allowed()).resolves.toBe(true);
  });
});
