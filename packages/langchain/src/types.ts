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
import type { LangchainModelLike } from "./credentials";

export type {
  CredentialCheckResult,
  CredentialEnv,
  CredentialsInput,
  MayIDefault,
  MayIErrorInput,
  MayIGate
};

/**
 * Slim options for LangChain gates.
 *
 * Compared to `@may-i/core`, `mode` is fixed to `"any"` and `credentials`
 * default to common LangChain provider keys.
 */
export interface MayILangchainOptions<T = unknown> {
  /**
   * Credentials required before a LangChain call may proceed.
   *
   * When omitted, {@link DEFAULT_LANGCHAIN_CREDENTIALS} is used (any common
   * provider key).
   */
  credentials?: CredentialsInput;

  /**
   * Value returned instead of calling the AI API when credentials are missing.
   *
   * Prefer shapes compatible with LangChain results (e.g. an `AIMessage`-like
   * object with `content`, or a plain string).
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
 * One-shot {@link ask} options that include the LangChain call.
 */
export type MayILangchainAskOptions<T> = MayILangchainOptions<T> & {
  /** LangChain call (or any async work) to run when credentials are present. */
  run: () => T | Promise<T>;
};

/**
 * Fallback value for {@link invoke} — typically message `content` or a string.
 */
export type InvokeDefault = string | { content: string };

/**
 * Model accepted by LangChain helpers (`"provider:model"` or a chat model).
 */
export type MayILangchainModel = LangchainModelLike | string;
