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

/**
 * How multiple credential sources are evaluated.
 *
 * - `any` — at least one credential must be present (default)
 * - `all` — every credential must be present
 */
export type CredentialMode = "any" | "all";

/**
 * Environment map used when resolving credential names.
 *
 * Defaults to `process.env` when omitted.
 */
export type CredentialEnv = Record<string, string | undefined>;

/**
 * Synchronous or asynchronous predicate that reports whether a credential is
 * available (for example a custom secret store or in-memory token).
 *
 * When May I evaluates credentials with a custom {@link CredentialEnv} map
 * (via `options.env`), that map is passed as the first argument so checkers
 * can honor test / injected environments.
 */
export type CredentialChecker = (
  env?: CredentialEnv
) => boolean | Promise<boolean>;

/**
 * A single credential requirement.
 *
 * - `string` — non-empty environment variable name (e.g. `OPENAI_API_KEY`)
 * - `CredentialChecker` — custom availability check
 * - object — named env var and/or custom check (name used in error messages)
 */
export type CredentialSource =
  | string
  | CredentialChecker
  | {
      /** Label used when reporting missing credentials. */
      name: string;
      /** Environment variable to read. Ignored when `check` is provided. */
      env?: string;
      /** Custom availability check. Takes precedence over `env`. */
      check?: CredentialChecker;
      /** Explicit value to treat as present when non-empty. */
      value?: string | null | undefined;
    };

/**
 * One or more credential sources required before an AI call may proceed.
 */
export type CredentialsInput = CredentialSource | readonly CredentialSource[];

/**
 * Fallback used when required credentials are missing.
 *
 * May be any value valid for the wrapped AI API response (string, JSON object,
 * structured output, etc.), or a sync/async factory that produces that value.
 */
export type MayIDefault<T> = T | (() => T | Promise<T>);

/**
 * Error factory used when credentials are missing and no default is provided.
 */
export type MayIErrorInput =
  string | Error | ((context: CredentialCheckResult) => Error | string);

/**
 * Result of evaluating configured credentials.
 */
export interface CredentialCheckResult {
  /** `true` when the call is allowed to reach the AI API. */
  allowed: boolean;
  /** Credential names that were present. */
  present: string[];
  /** Credential names that were missing. */
  missing: string[];
  /** Mode used for the evaluation. */
  mode: CredentialMode;
}

/**
 * Options for {@link mayI} / {@link gate}.
 */
export interface MayIOptions<T = unknown> {
  /**
   * Credentials required to call the AI provider (API keys, tokens, etc.).
   *
   * Common environment variables include `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
   * `AI_GATEWAY_API_KEY`, `OPENROUTER_API_KEY`, and `GEMINI_API_KEY`.
   */
  credentials?: CredentialsInput;

  /**
   * Whether every credential (`all`) or any credential (`any`) must be present.
   *
   * @defaultValue `"any"`
   */
  mode?: CredentialMode;

  /**
   * Value returned instead of calling the AI API when credentials are missing.
   *
   * When omitted, {@link ask} / {@link gate} throws {@link MayIError}.
   */
  defaultValue?: MayIDefault<T>;

  /**
   * Custom error (or factory) used when credentials are missing and `defaultValue`
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
 * A prepared gate that wraps an AI API call.
 */
export interface MayIGate<T> {
  /**
   * Run `fn` when credentials are present; otherwise return `defaultValue` or throw.
   */
  (fn: () => T | Promise<T>, defaultValue?: MayIDefault<T>): Promise<T>;

  /**
   * Check whether the configured credentials currently allow an AI call.
   */
  check: () => Promise<CredentialCheckResult>;

  /**
   * `true` when {@link MayIGate.check} reports `allowed`.
   */
  allowed: () => Promise<boolean>;
}

/**
 * Options for the one-shot {@link ask} helper that includes the AI call.
 */
export type MayIAskOptions<T> = MayIOptions<T> & {
  /** AI API call (or any async work) to run when credentials are present. */
  run: () => T | Promise<T>;
};
