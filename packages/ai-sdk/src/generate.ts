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
  generateObject as aiGenerateObject,
  generateText as aiGenerateText
} from "ai";
import { credentialsForModel } from "./credentials";
import { ask } from "./gate";
import type {
  GenerateObjectDefault,
  GenerateTextDefault,
  MayIAiSdkOptions
} from "./types";

type GenerateTextParams = Parameters<typeof aiGenerateText>[0];
type GenerateObjectParams = Parameters<typeof aiGenerateObject>[0];

type MayIKeys = keyof MayIAiSdkOptions;

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
  mayI: MayIAiSdkOptions<T>;
  rest: Record<string, unknown>;
} {
  const mayI: MayIAiSdkOptions<T> = {};
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
 * AI SDK {@link generateText} with May I credential gating.
 *
 * When credentials are missing, returns `default` (or throws). Credentials
 * default to AI Gateway **or** the provider key inferred from `model`.
 *
 * @example
 * ```ts
 * import { generateText } from "@may-i/ai-sdk";
 *
 * const { text } = await generateText({
 *   model: "openai/gpt-4.1",
 *   prompt: "Hello",
 *   default: { text: "Offline fallback" }
 * });
 * ```
 *
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text
 */
export async function generateText<T = Awaited<ReturnType<typeof aiGenerateText>>>(
  options: GenerateTextParams &
    MayIAiSdkOptions<T> & {
      default?: MayIAiSdkOptions<T>["default"] | GenerateTextDefault;
    }
): Promise<T> {
  const { mayI, rest } = splitMayIOptions<T>(
    options as Record<string, unknown>
  );
  const aiOptions = rest as GenerateTextParams;

  return ask({
    ...mayI,
    credentials:
      mayI.credentials ?? credentialsForModel(aiOptions.model),
    default: mayI.default as MayIAiSdkOptions<T>["default"],
    run: () => aiGenerateText(aiOptions) as Promise<T>
  });
}

/**
 * AI SDK {@link generateObject} with May I credential gating.
 *
 * @example
 * ```ts
 * import { generateObject } from "@may-i/ai-sdk";
 * import { z } from "zod";
 *
 * const { object } = await generateObject({
 *   model: "openai/gpt-4.1",
 *   schema: z.object({ ok: z.boolean() }),
 *   prompt: "Is the sky blue?",
 *   default: { object: { ok: false } }
 * });
 * ```
 *
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object
 */
export async function generateObject<
  T = Awaited<ReturnType<typeof aiGenerateObject>>
>(
  options: GenerateObjectParams &
    MayIAiSdkOptions<T> & {
      default?:
        | MayIAiSdkOptions<T>["default"]
        | GenerateObjectDefault<unknown>;
    }
): Promise<T> {
  const { mayI, rest } = splitMayIOptions<T>(
    options as Record<string, unknown>
  );
  const aiOptions = rest as GenerateObjectParams;

  return ask({
    ...mayI,
    credentials:
      mayI.credentials ?? credentialsForModel(aiOptions.model),
    default: mayI.default as MayIAiSdkOptions<T>["default"],
    run: () => aiGenerateObject(aiOptions) as Promise<T>
  });
}
