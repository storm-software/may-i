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
import {
  checkCredentials,
  gate,
  hasCredentials,
  isMayIError,
  ask,
  PROVIDER_ENV,
  providerCredentials
} from "../src";

describe("checkCredentials", () => {
  it("allows when any listed env var is set", async () => {
    const result = await checkCredentials(
      [PROVIDER_ENV.openai, PROVIDER_ENV.gateway],
      {
        mode: "any",
        env: { OPENAI_API_KEY: "sk-test" }
      }
    );

    expect(result.allowed).toBe(true);
    expect(result.present).toEqual(["OPENAI_API_KEY"]);
    expect(result.missing).toEqual(["AI_GATEWAY_API_KEY"]);
  });

  it("requires all env vars when mode is all", async () => {
    const result = await checkCredentials(
      ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
      {
        mode: "all",
        env: { OPENAI_API_KEY: "sk-test" }
      }
    );

    expect(result.allowed).toBe(false);
    expect(result.missing).toEqual(["ANTHROPIC_API_KEY"]);
  });

  it("treats blank env values as missing", async () => {
    await expect(
      hasCredentials("OPENAI_API_KEY", { env: { OPENAI_API_KEY: "  " } })
    ).resolves.toBe(false);
  });

  it("supports custom checkers and explicit values", async () => {
    const result = await checkCredentials(
      [
        () => true,
        { name: "token", value: "abc" },
        { name: "empty", value: "" }
      ],
      { mode: "all" }
    );

    expect(result.allowed).toBe(false);
    expect(result.present).toEqual(["custom[0]", "token"]);
    expect(result.missing).toEqual(["empty"]);
  });
});

describe("gate / ask", () => {
  it("runs the wrapped AI call when credentials exist", async () => {
    const run = vi.fn(async () => ({ text: "from-model" }));

    const result = await gate({
      credentials: "OPENAI_API_KEY",
      env: { OPENAI_API_KEY: "sk-test" },
      defaultValue: { text: "fallback" }
    })(run);

    expect(result).toEqual({ text: "from-model" });
    expect(run).toHaveBeenCalledOnce();
  });

  it("returns a default value when credentials are missing", async () => {
    const run = vi.fn(async () => ({
      text: "from-model",
      object: { ok: false }
    }));
    const onFallback = vi.fn();

    const result = await gate({
      credentials: "OPENAI_API_KEY",
      env: {},
      defaultValue: { text: "fallback", object: { ok: true } },
      onFallback
    })(run);

    expect(result).toEqual({ text: "fallback", object: { ok: true } });
    expect(run).toHaveBeenCalledTimes(0);
    expect(onFallback).toHaveBeenCalledOnce();
  });

  it("resolves lazy default factories", async () => {
    const result = await ask({
      credentials: "OPENAI_API_KEY",
      env: {},
      defaultValue: async () => "lazy-default",
      run: async () => "from-model"
    });

    expect(result).toBe("lazy-default");
  });

  it("throws MayIError when credentials and default are both missing", async () => {
    const ask = gate({
      credentials: providerCredentials("openai", "gateway"),
      env: {}
    });

    await expect(ask(async () => "nope")).rejects.toSatisfy(error => {
      expect(isMayIError(error)).toBe(true);
      if (isMayIError(error)) {
        expect(error.code).toBe("MAY_I_MISSING_CREDENTIALS");
        expect(error.missing).toEqual([
          "OPENAI_API_KEY",
          "AI_GATEWAY_API_KEY"
        ]);
      }
      return true;
    });
  });

  it("uses a custom error message when provided", async () => {
    await expect(
      ask({
        credentials: "OPENAI_API_KEY",
        env: {},
        error: "No AI key configured",
        run: async () => "nope"
      })
    ).rejects.toMatchObject({
      message: "No AI key configured",
      name: "MayIError"
    });
  });

  it("exposes check and allowed helpers on the gate", async () => {
    const ask = gate({
      credentials: "ANTHROPIC_API_KEY",
      env: { ANTHROPIC_API_KEY: "sk-ant" }
    });

    await expect(ask.allowed()).resolves.toBe(true);
    await expect(ask.check()).resolves.toMatchObject({
      allowed: true,
      present: ["ANTHROPIC_API_KEY"]
    });
  });
});
