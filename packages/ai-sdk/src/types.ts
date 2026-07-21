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

import type {
  CredentialCheckResult,
  CredentialEnv,
  CredentialsInput,
  MayIDefault,
  MayIErrorInput,
  MayIGate
} from "@may-i/core";
import type { LanguageModel } from "ai";

export type {
  CredentialCheckResult,
  CredentialEnv,
  CredentialsInput,
  MayIDefault,
  MayIErrorInput,
  MayIGate
};

/**
 * Slim options for AI SDK gates.
 *
 * Compared to `@may-i/core`, `mode` is fixed to `"any"` and `credentials`
 * default to AI Gateway plus common AI SDK provider keys.
 */
export interface MayIAiSdkOptions<T = unknown> {
  /**
   * Credentials required before an AI SDK call may proceed.
   *
   * When omitted, {@link DEFAULT_AISDK_CREDENTIALS} is used (AI Gateway or any
   * common provider key).
   */
  credentials?: CredentialsInput;

  /**
   * Value returned instead of calling the AI API when credentials are missing.
   *
   * Prefer shapes compatible with AI SDK results (e.g. `{ text: string }` for
   * {@link GenerateTextResult}).
   */
  default?: MayIDefault<T>;

  /**
   * Custom error (or factory) used when credentials are missing and `default`
   * is not provided.
   */
  error?: MayIErrorInput;

  /**
   * Environment map for credential lookups. Defaults to `process.env`.
   */
  env?: CredentialEnv;

  /**
   * Invoked when the default value is used instead of the AI API.
   */
  onFallback?: (context: CredentialCheckResult) => void;
}

/**
 * One-shot {@link ask} options that include the AI SDK call.
 */
export type MayIAiSdkAskOptions<T> = MayIAiSdkOptions<T> & {
  /** AI SDK call (or any async work) to run when credentials are present. */
  run: () => T | Promise<T>;
};

/**
 * Fallback value for {@link generateText} — typically `{ text: string }`.
 */
export type GenerateTextDefault = {
  text: string;
};

/**
 * Fallback value for {@link generateObject} — typically `{ object: T }`.
 */
export type GenerateObjectDefault<OBJECT = unknown> = {
  object: OBJECT;
};

/**
 * Model accepted by AI SDK helpers (`"provider/model"` or a language model).
 */
export type MayILanguageModel = LanguageModel;
