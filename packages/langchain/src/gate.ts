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
import { DEFAULT_LANGCHAIN_CREDENTIALS } from "./credentials";
import type { MayILangchainAskOptions, MayILangchainOptions } from "./types";

function toCoreOptions<T>(options: MayILangchainOptions<T>) {
  return {
    credentials: options.credentials ?? DEFAULT_LANGCHAIN_CREDENTIALS,
    mode: "any" as const,
    defaultValue: options.default,
    error: options.error,
    env: options.env,
    onFallback: options.onFallback
  };
}

/**
 * Create a reusable gate around a LangChain call.
 *
 * Credentials default to common LangChain provider keys (`any` mode). Pass
 * `defaultValue` for offline fallbacks shaped like LangChain results.
 *
 * @example
 * ```ts
 * import { initChatModel } from "langchain";
 * import { gate } from "@may-i/langchain";
 *
 * const ask = gate({
 *   defaultValue: { content: "Offline fallback" }
 * });
 *
 * const model = await initChatModel("openai:gpt-5.5");
 * const result = await ask(() => model.invoke("Hello"));
 * ```
 *
 * @see https://docs.langchain.com/oss/javascript/langchain/overview
 */
export function gate<T>(options: MayILangchainOptions<T> = {}): MayIGate<T> {
  return coreGate(toCoreOptions(options));
}

/**
 * One-shot helper: check credentials, then run the LangChain call or use a default.
 *
 * @example
 * ```ts
 * import { initChatModel } from "langchain";
 * import { ask } from "@may-i/langchain";
 *
 * const model = await initChatModel("openai:gpt-5.5");
 * const result = await ask({
 *   defaultValue: { content: "Hello from fallback" },
 *   run: () => model.invoke("Hi")
 * });
 * ```
 */
export async function ask<T>(options: MayILangchainAskOptions<T>): Promise<T>;
export function ask<T>(options: MayILangchainOptions<T>): MayIGate<T>;
export function ask<T>(
  options: MayILangchainOptions<T> | MayILangchainAskOptions<T>
): Promise<T> | MayIGate<T> {
  if ("run" in options && options.run) {
    return coreAsk({
      ...toCoreOptions(options),
      run: options.run
    });
  }

  return gate(options);
}
