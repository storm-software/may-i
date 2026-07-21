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

import {
  ask as coreAsk,
  gate as coreGate
} from "@may-i/core";
import type { MayIGate } from "@may-i/core";
import { DEFAULT_TANSTACK_CREDENTIALS } from "./credentials";
import type { MayITanstackAskOptions, MayITanstackOptions } from "./types";

function toCoreOptions<T>(options: MayITanstackOptions<T>) {
  return {
    credentials: options.credentials ?? DEFAULT_TANSTACK_CREDENTIALS,
    mode: "any" as const,
    defaultValue: options.default,
    error: options.error,
    env: options.env,
    onFallback: options.onFallback
  };
}

/**
 * Create a reusable gate around a TanStack AI call.
 *
 * Credentials default to OpenRouter / common TanStack AI provider keys (`any`
 * mode). Pass `default` for offline fallbacks shaped like TanStack AI results.
 *
 * @example
 * ```ts
 * import { chat } from "@tanstack/ai";
 * import { openaiText } from "@tanstack/ai-openai";
 * import { gate } from "@may-i/tanstack";
 *
 * const ask = gate({
 *   default: "Offline fallback"
 * });
 *
 * const text = await ask(() =>
 *   chat({
 *     adapter: openaiText("gpt-5.2"),
 *     messages: [{ role: "user", content: "Hello" }],
 *     stream: false
 *   })
 * );
 * ```
 */
export function gate<T>(options: MayITanstackOptions<T> = {}): MayIGate<T> {
  return coreGate(toCoreOptions(options));
}

/**
 * One-shot helper: check credentials, then run the TanStack AI call or use a
 * default.
 *
 * @example
 * ```ts
 * import { chat } from "@tanstack/ai";
 * import { openaiText } from "@tanstack/ai-openai";
 * import { ask } from "@may-i/tanstack";
 *
 * const text = await ask({
 *   default: "Hello from fallback",
 *   run: () =>
 *     chat({
 *       adapter: openaiText("gpt-5.2"),
 *       messages: [{ role: "user", content: "Hi" }],
 *       stream: false
 *     })
 * });
 * ```
 */
export async function ask<T>(options: MayITanstackAskOptions<T>): Promise<T>;
export function ask<T>(options: MayITanstackOptions<T>): MayIGate<T>;
export function ask<T>(
  options: MayITanstackOptions<T> | MayITanstackAskOptions<T>
): Promise<T> | MayIGate<T> {
  if ("run" in options && options.run) {
    return coreAsk({
      ...toCoreOptions(options),
      run: options.run
    });
  }

  return gate(options);
}
