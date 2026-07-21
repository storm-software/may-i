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

import type { CredentialEnv, CredentialSource } from "@may-i/core";
import { getApiKeyFromEnv } from "@tanstack/ai-utils";
import { isSetString } from "@stryke/type-checks/is-set-string";

function hasEnvValue(env: CredentialEnv, name: string): boolean {
  const value = env[name];

  return isSetString(value) && value.trim().length > 0;
}

/**
 * Credential source that uses TanStack AI {@link getApiKeyFromEnv}.
 *
 * When May I supplies a custom `env` map (tests / injection), presence is
 * checked on that map instead — `getApiKeyFromEnv` only reads process /
 * `window.env`.
 *
 * @see https://tanstack.com/ai/latest/docs/getting-started/quick-start
 */
export function tanstackCredential(
  environmentVariableName: string
): CredentialSource {
  return {
    name: environmentVariableName,
    check: (env?: CredentialEnv) => {
      if (env !== undefined) {
        return hasEnvValue(env, environmentVariableName);
      }

      try {
        getApiKeyFromEnv(environmentVariableName);

        return true;
      } catch {
        return false;
      }
    }
  };
}

/**
 * Gemini accepts `GOOGLE_API_KEY` or `GEMINI_API_KEY` (same as
 * `@tanstack/ai-gemini` `getGeminiApiKeyFromEnv`).
 */
function geminiCredential(): CredentialSource {
  return {
    name: "GOOGLE_API_KEY|GEMINI_API_KEY",
    check: (env?: CredentialEnv) => {
      if (env !== undefined) {
        return (
          hasEnvValue(env, "GOOGLE_API_KEY") ||
          hasEnvValue(env, "GEMINI_API_KEY")
        );
      }

      try {
        getApiKeyFromEnv("GOOGLE_API_KEY");

        return true;
      } catch {
        try {
          getApiKeyFromEnv("GEMINI_API_KEY");

          return true;
        } catch {
          return false;
        }
      }
    }
  };
}

/**
 * Local Ollama needs no API key (`OLLAMA_HOST` defaults). Always allowed when
 * the caller targets the Ollama adapter explicitly.
 *
 * @see https://tanstack.com/ai/latest/docs/adapters/ollama
 */
function ollamaLocalCredential(): CredentialSource {
  return {
    name: "OLLAMA_HOST",
    check: () => true
  };
}

const PROVIDERS = {
  openrouter: () => tanstackCredential("OPENROUTER_API_KEY"),
  openai: () => tanstackCredential("OPENAI_API_KEY"),
  anthropic: () => tanstackCredential("ANTHROPIC_API_KEY"),
  gemini: geminiCredential,
  xai: () => tanstackCredential("XAI_API_KEY"),
  groq: () => tanstackCredential("GROQ_API_KEY"),
  bedrock: () => tanstackCredential("AWS_BEARER_TOKEN_BEDROCK"),
  /** Cloud / keyed Ollama — used in default "any provider" lists. */
  ollama: () => tanstackCredential("OLLAMA_API_KEY"),
  /** Local Ollama — no key required when adapter is known. */
  ollamaLocal: ollamaLocalCredential
} as const;

export type TanstackProviderName = keyof typeof PROVIDERS;

/**
 * Map TanStack AI adapter `name` values to credential factories.
 */
const PROVIDER_ID_TO_KEY: Record<string, TanstackProviderName> = {
  openai: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
  google: "gemini",
  grok: "xai",
  xai: "xai",
  groq: "groq",
  openrouter: "openrouter",
  ollama: "ollamaLocal",
  bedrock: "bedrock",
  "amazon-bedrock": "bedrock"
};

/**
 * Default credential sources when the caller omits `credentials`.
 *
 * Uses `"any"` mode via {@link gate}: OpenRouter **or** any listed provider key,
 * verified with TanStack `getApiKeyFromEnv`. Local Ollama (no key) is omitted
 * here so an empty env still falls back.
 */
export const DEFAULT_TANSTACK_CREDENTIALS: CredentialSource[] = [
  PROVIDERS.openrouter(),
  PROVIDERS.openai(),
  PROVIDERS.anthropic(),
  PROVIDERS.gemini(),
  PROVIDERS.xai(),
  PROVIDERS.groq(),
  PROVIDERS.bedrock(),
  PROVIDERS.ollama()
];

/**
 * Minimal adapter shape used for credential inference (`adapter.name`).
 */
export type TanstackAdapterLike = {
  readonly name: string;
};

/**
 * Resolve the provider id from a TanStack AI adapter (or adapter name string).
 *
 * - `{ name: "openai", model: "gpt-5.2" }` → `"openai"`
 * - `"anthropic"` → `"anthropic"`
 */
export function resolveProviderId(
  adapter: TanstackAdapterLike | string
): string | undefined {
  if (isSetString(adapter)) {
    return adapter;
  }

  if (
    typeof adapter === "object" &&
    adapter !== null &&
    "name" in adapter &&
    isSetString(adapter.name)
  ) {
    return adapter.name;
  }

  return undefined;
}

/**
 * Credential sources for an adapter: the matching provider key check.
 *
 * Falls back to {@link DEFAULT_TANSTACK_CREDENTIALS} when the provider is unknown.
 */
export function credentialsForAdapter(
  adapter: TanstackAdapterLike | string
): CredentialSource[] {
  const providerId = resolveProviderId(adapter);
  const key = providerId ? PROVIDER_ID_TO_KEY[providerId] : undefined;

  if (key) {
    return [PROVIDERS[key]()];
  }

  return [...DEFAULT_TANSTACK_CREDENTIALS];
}
