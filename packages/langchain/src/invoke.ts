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

import { credentialsForModel } from "./credentials";
import type { LangchainModelLike } from "./credentials";
import { ask } from "./gate";
import type { InvokeDefault, MayILangchainOptions } from "./types";

/**
 * Runnable / chat-model shape with {@link invoke}.
 */
export type LangchainRunnableLike = LangchainModelLike & {
  invoke: (
    input: unknown,
    options?: unknown
  ) => unknown | Promise<unknown>;
};

type MayIKeys = keyof MayILangchainOptions;

const MAY_I_OPTION_KEYS = [
  "credentials",
  "default",
  "error",
  "env",
  "onFallback"
] as const satisfies readonly MayIKeys[];

function splitMayIOptions<T>(
  options: Record<string, unknown>
): {
  mayI: MayILangchainOptions<T>;
  rest: Record<string, unknown>;
} {
  const mayI: MayILangchainOptions<T> = {};
  const rest: Record<string, unknown> = { ...options };

  for (const key of MAY_I_OPTION_KEYS) {
    if (key in rest) {
      (mayI as Record<string, unknown>)[key] = rest[key];
      delete rest[key];
    }
  }

  return { mayI, rest };
}

export type InvokeParams = {
  /** LangChain chat model / runnable to call. */
  model: LangchainRunnableLike;
  /** Input passed to `model.invoke` (string, messages, etc.). */
  input: unknown;
  /** Optional LangChain runnable config passed as the second argument. */
  config?: unknown;
};

/**
 * LangChain `model.invoke` with May I credential gating.
 *
 * When credentials are missing, returns `default` (or throws). Credentials
 * default to the provider key inferred from `model` (`_llmType` / `lc_id`).
 *
 * @example
 * ```ts
 * import { initChatModel } from "langchain";
 * import { invoke } from "@may-i/langchain";
 *
 * const model = await initChatModel("openai:gpt-5.5");
 * const message = await invoke({
 *   model,
 *   input: "Hello",
 *   default: { content: "Offline fallback" }
 * });
 * ```
 *
 * @see https://docs.langchain.com/oss/javascript/langchain/models
 */
export async function invoke<T = unknown>(
  options: InvokeParams &
    MayILangchainOptions<T> & {
      default?: MayILangchainOptions<T>["default"] | InvokeDefault;
    }
): Promise<T> {
  const { mayI, rest } = splitMayIOptions<T>(
    options as unknown as Record<string, unknown>
  );
  const { model, input, config } = rest as InvokeParams;

  return ask({
    ...mayI,
    credentials: mayI.credentials ?? credentialsForModel(model),
    default: mayI.default as MayILangchainOptions<T>["default"],
    run: () => model.invoke(input, config) as T | Promise<T>
  });
}
