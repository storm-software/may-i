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

import { list } from "@stryke/string-format/list";
import { isFunction } from "@stryke/type-checks/is-function";
import { isString } from "@stryke/type-checks/is-string";
import { checkCredentials } from "./credentials";
import { MayIError } from "./error";
import type {
  CredentialCheckResult,
  MayIAskOptions,
  MayIDefault,
  MayIErrorInput,
  MayIGate,
  MayIOptions
} from "./types";

async function resolveDefault<T>(value: MayIDefault<T>): Promise<T> {
  return isFunction(value) ? value() : value;
}

function resolveError(
  input: MayIErrorInput | undefined,
  result: CredentialCheckResult
): Error {
  if (input === undefined) {
    const missing = list(result.missing);
    const requirement =
      result.mode === "all"
        ? `all of: ${missing}`
        : `at least one of: ${missing}`;

    return new MayIError(
      `Missing required AI credentials (${requirement}). Provide the credentials or a default value.`,
      result
    );
  }

  const resolved = isFunction(input) ? input(result) : input;

  if (isString(resolved)) {
    return new MayIError(resolved, result);
  }

  return resolved;
}

async function runGate<T>(
  options: MayIOptions<T>,
  fn: () => T | Promise<T>
): Promise<T> {
  const result = await checkCredentials(options.credentials, {
    mode: options.mode,
    env: options.env
  });

  if (result.allowed) {
    return fn();
  }

  if (options.defaultValue !== undefined) {
    options.onFallback?.(result);
    return resolveDefault(options.defaultValue);
  }

  throw resolveError(options.error, result);
}

/**
 * Create a reusable gate around an AI API call.
 *
 * When configured credentials are present, the wrapped function runs.
 * Otherwise the configured `default` is returned, or an error is thrown when
 * no default is provided.
 *
 * @example
 * ```ts
 * import { generateText } from "ai";
 * import { gate, PROVIDER_ENV } from "@may-i/core";
 *
 * const ask = gate({
 *   credentials: [PROVIDER_ENV.openai, PROVIDER_ENV.gateway],
 *   default: { text: "Offline fallback" }
 * });
 *
 * const result = await ask(() =>
 *   generateText({ model: "openai/gpt-4.1", prompt: "Hello" })
 * );
 * ```
 */
export function gate<T>(options: MayIOptions<T>): MayIGate<T> {
  const invoke = (async (fn: () => T | Promise<T>, defaultValue?: MayIDefault<T>) =>
    runGate({ ...options, defaultValue: defaultValue ?? options.defaultValue }, fn)) as MayIGate<T>;

  invoke.check = async () =>
    checkCredentials(options.credentials, {
      mode: options.mode,
      env: options.env
    });

  invoke.allowed = async () => {
    const result = await invoke.check();

    return result.allowed;
  };

  return invoke;
}

/**
 * One-shot helper: check credentials, then run the AI call or use a default.
 *
 * @example
 * ```ts
 * const text = await ask({
 *   credentials: "OPENAI_API_KEY",
 *   default: "Hello from fallback",
 *   run: async () => {
 *     const result = await generateText({ model, prompt: "Hi" });
 *     return result.text;
 *   }
 * });
 * ```
 */
export async function ask<T>(options: MayIAskOptions<T>): Promise<T>;
export function ask<T>(options: MayIOptions<T>): MayIGate<T>;
export function ask<T>(
  options: MayIOptions<T> | MayIAskOptions<T>
): Promise<T> | MayIGate<T> {
  if ("run" in options && options.run) {
    return runGate(options, options.run);
  }

  return gate(options);
}
