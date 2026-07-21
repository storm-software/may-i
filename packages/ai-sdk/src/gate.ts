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

import {
  ask as coreAsk,
  gate as coreGate
} from "@may-i/core";
import type { MayIGate } from "@may-i/core";
import { DEFAULT_AISDK_CREDENTIALS } from "./credentials";
import type { MayIAiSdkAskOptions, MayIAiSdkOptions } from "./types";

function toCoreOptions<T>(options: MayIAiSdkOptions<T>) {
  return {
    credentials: options.credentials ?? DEFAULT_AISDK_CREDENTIALS,
    mode: "any" as const,
    defaultValue: options.default,
    error: options.error,
    env: options.env,
    onFallback: options.onFallback
  };
}

/**
 * Create a reusable gate around an AI SDK call.
 *
 * Credentials default to AI Gateway / common AI SDK provider keys (`any` mode).
 * Pass `default` for offline fallbacks shaped like AI SDK results.
 *
 * @example
 * ```ts
 * import { generateText } from "ai";
 * import { gate } from "@may-i/ai-sdk";
 *
 * const ask = gate({
 *   default: { text: "Offline fallback" }
 * });
 *
 * const result = await ask(() =>
 *   generateText({ model: "openai/gpt-4.1", prompt: "Hello" })
 * );
 * ```
 */
export function gate<T>(options: MayIAiSdkOptions<T> = {}): MayIGate<T> {
  return coreGate(toCoreOptions(options));
}

/**
 * One-shot helper: check credentials, then run the AI SDK call or use a default.
 *
 * @example
 * ```ts
 * import { generateText } from "ai";
 * import { ask } from "@may-i/ai-sdk";
 *
 * const result = await ask({
 *   default: { text: "Hello from fallback" },
 *   run: () => generateText({ model: "openai/gpt-4.1", prompt: "Hi" })
 * });
 * ```
 */
export async function ask<T>(options: MayIAiSdkAskOptions<T>): Promise<T>;
export function ask<T>(options: MayIAiSdkOptions<T>): MayIGate<T>;
export function ask<T>(
  options: MayIAiSdkOptions<T> | MayIAiSdkAskOptions<T>
): Promise<T> | MayIGate<T> {
  if ("run" in options && options.run) {
    return coreAsk({
      ...toCoreOptions(options),
      run: options.run
    });
  }

  return gate(options);
}
