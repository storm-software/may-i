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

import { chat as tanstackChat } from "@tanstack/ai";
import { credentialsForAdapter } from "./credentials";
import { ask } from "./gate";
import type { ChatDefault, MayITanstackOptions } from "./types";

type ChatParams = Parameters<typeof tanstackChat>[0];

type MayIKeys = keyof MayITanstackOptions;

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
  mayI: MayITanstackOptions<T>;
  rest: Record<string, unknown>;
} {
  const mayI: MayITanstackOptions<T> = {};
  const rest: Record<string, unknown> = { ...options };

  for (const key of MAY_I_OPTION_KEYS) {
    if (key in rest) {
      (mayI as Record<string, unknown>)[key] = rest[key];
      delete rest[key];
    }
  }

  return { mayI, rest };
}

/**
 * TanStack AI {@link chat} with May I credential gating.
 *
 * When credentials are missing, returns `default` (or throws). Credentials
 * default to the provider key inferred from `adapter.name`.
 *
 * Always returns a `Promise` (credential checks are async). For streaming
 * chats, await the iterable then `for await` over it.
 *
 * @example
 * ```ts
 * import { openaiText } from "@tanstack/ai-openai";
 * import { chat } from "@may-i/tanstack";
 *
 * const text = await chat({
 *   adapter: openaiText("gpt-5.2"),
 *   messages: [{ role: "user", content: "Hello" }],
 *   stream: false,
 *   default: "Offline fallback"
 * });
 * ```
 *
 * @see https://tanstack.com/ai/latest/docs/reference/functions/chat
 */
export async function chat<
  T = Awaited<ReturnType<typeof tanstackChat>>
>(
  options: ChatParams &
    MayITanstackOptions<T> & {
      default?: MayITanstackOptions<T>["default"] | ChatDefault;
    }
): Promise<T> {
  const { mayI, rest } = splitMayIOptions<T>(
    options as unknown as Record<string, unknown>
  );
  const chatOptions = rest as ChatParams;

  return ask({
    ...mayI,
    credentials:
      mayI.credentials ?? credentialsForAdapter(chatOptions.adapter),
    default: mayI.default as MayITanstackOptions<T>["default"],
    run: () => tanstackChat(chatOptions) as T | Promise<T>
  });
}
