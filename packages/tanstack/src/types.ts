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

import type {
  CredentialCheckResult,
  CredentialEnv,
  CredentialsInput,
  MayIDefault,
  MayIErrorInput,
  MayIGate
} from "@may-i/core";
import type { TanstackAdapterLike } from "./credentials";

export type {
  CredentialCheckResult,
  CredentialEnv,
  CredentialsInput,
  MayIDefault,
  MayIErrorInput,
  MayIGate
};

/**
 * Slim options for TanStack AI gates.
 *
 * Compared to `@may-i/core`, `mode` is fixed to `"any"` and `credentials`
 * default to OpenRouter plus common TanStack AI provider keys.
 */
export interface MayITanstackOptions<T = unknown> {
  /**
   * Credentials required before a TanStack AI call may proceed.
   *
   * When omitted, {@link DEFAULT_TANSTACK_CREDENTIALS} is used (OpenRouter or
   * any common provider key).
   */
  credentials?: CredentialsInput;

  /**
   * Value returned instead of calling the AI API when credentials are missing.
   *
   * Prefer shapes compatible with TanStack AI results (e.g. a `string` for
   * `chat({ stream: false })`).
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
 * One-shot {@link ask} options that include the TanStack AI call.
 */
export type MayITanstackAskOptions<T> = MayITanstackOptions<T> & {
  /** TanStack AI call (or any async work) to run when credentials are present. */
  run: () => T | Promise<T>;
};

/**
 * Fallback value for non-streaming {@link chat} — typically a plain string.
 */
export type ChatDefault = string;

/**
 * Adapter accepted by TanStack AI helpers (`adapter.name` drives credentials).
 */
export type MayITanstackAdapter = TanstackAdapterLike;
