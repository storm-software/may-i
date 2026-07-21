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
import { loadApiKey } from "@ai-sdk/provider-utils";
import { isSetString } from "@stryke/type-checks/is-set-string";
import type { LanguageModel } from "ai";

function hasEnvValue(env: CredentialEnv, name: string): boolean {
  const value = env[name];

  return isSetString(value) && value.trim().length > 0;
}

/**
 * Credential source that uses AI SDK {@link loadApiKey} against `process.env`.
 *
 * When May I supplies a custom `env` map (tests / injection), presence is
 * checked on that map instead — `loadApiKey` only reads `process.env`.
 *
 * @see https://ai-sdk.dev/providers/ai-sdk-providers
 */
export function aiSdkCredential(
  environmentVariableName: string,
  description: string
): CredentialSource {
  return {
    name: environmentVariableName,
    check: (env?: CredentialEnv) => {
      if (env !== undefined) {
        return hasEnvValue(env, environmentVariableName);
      }

      try {
        loadApiKey({
          apiKey: undefined,
          environmentVariableName,
          description
        });

        return true;
      } catch {
        return false;
      }
    }
  };
}

const PROVIDERS = {
  openai: () => aiSdkCredential("OPENAI_API_KEY", "OpenAI"),
  anthropic: () => aiSdkCredential("ANTHROPIC_API_KEY", "Anthropic"),
  gateway: () => aiSdkCredential("AI_GATEWAY_API_KEY", "AI Gateway"),
  openrouter: () => aiSdkCredential("OPENROUTER_API_KEY", "OpenRouter"),
  google: () =>
    aiSdkCredential("GOOGLE_GENERATIVE_AI_API_KEY", "Google Generative AI"),
  azure: () => aiSdkCredential("AZURE_API_KEY", "Azure"),
  bedrock: () =>
    aiSdkCredential("AWS_BEARER_TOKEN_BEDROCK", "Amazon Bedrock"),
  groq: () => aiSdkCredential("GROQ_API_KEY", "Groq"),
  xai: () => aiSdkCredential("XAI_API_KEY", "xAI"),
  mistral: () => aiSdkCredential("MISTRAL_API_KEY", "Mistral"),
  together: () => aiSdkCredential("TOGETHER_API_KEY", "Together AI"),
  fireworks: () => aiSdkCredential("FIREWORKS_API_KEY", "Fireworks"),
  perplexity: () => aiSdkCredential("PERPLEXITY_API_KEY", "Perplexity"),
  deepseek: () => aiSdkCredential("DEEPSEEK_API_KEY", "DeepSeek"),
  cohere: () => aiSdkCredential("COHERE_API_KEY", "Cohere"),
  huggingface: () => aiSdkCredential("HUGGINGFACE_API_KEY", "Hugging Face"),
  cerebras: () => aiSdkCredential("CEREBRAS_API_KEY", "Cerebras"),
  deepinfra: () => aiSdkCredential("DEEPINFRA_API_KEY", "DeepInfra")
} as const;

export type AiSdkProviderName = keyof typeof PROVIDERS;

/**
 * Map AI SDK / Gateway provider ids to credential factories.
 */
const PROVIDER_ID_TO_KEY: Record<string, AiSdkProviderName> = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
  "google.generative-ai": "google",
  azure: "azure",
  "azure-openai": "azure",
  "amazon-bedrock": "bedrock",
  bedrock: "bedrock",
  groq: "groq",
  xai: "xai",
  mistral: "mistral",
  togetherai: "together",
  together: "together",
  fireworks: "fireworks",
  perplexity: "perplexity",
  deepseek: "deepseek",
  cohere: "cohere",
  huggingface: "huggingface",
  cerebras: "cerebras",
  deepinfra: "deepinfra",
  openrouter: "openrouter",
  gateway: "gateway"
};

/**
 * Default credential sources when the caller omits `credentials`.
 *
 * Uses `"any"` mode via {@link gate}: AI Gateway **or** any listed provider key,
 * verified with AI SDK `loadApiKey`.
 */
export const DEFAULT_AISDK_CREDENTIALS: CredentialSource[] = [
  PROVIDERS.gateway(),
  PROVIDERS.openai(),
  PROVIDERS.anthropic(),
  PROVIDERS.google(),
  PROVIDERS.azure(),
  PROVIDERS.bedrock(),
  PROVIDERS.groq(),
  PROVIDERS.xai(),
  PROVIDERS.mistral(),
  PROVIDERS.together(),
  PROVIDERS.fireworks(),
  PROVIDERS.perplexity(),
  PROVIDERS.deepseek(),
  PROVIDERS.cohere(),
  PROVIDERS.huggingface(),
  PROVIDERS.cerebras(),
  PROVIDERS.deepinfra(),
  PROVIDERS.openrouter()
];

/**
 * Resolve the provider id from an AI SDK {@link LanguageModel}.
 *
 * - `"openai/gpt-4.1"` → `"openai"`
 * - language model object → `model.provider`
 */
export function resolveProviderId(
  model: LanguageModel
): string | undefined {
  if (isSetString(model)) {
    const slash = model.indexOf("/");

    return slash === -1 ? undefined : model.slice(0, slash);
  }

  if (
    typeof model === "object" &&
    model !== null &&
    "provider" in model &&
    isSetString((model as { provider: unknown }).provider)
  ) {
    return (model as { provider: string }).provider;
  }

  return undefined;
}

/**
 * Credential sources for a model: AI Gateway **or** the matching provider key.
 *
 * Falls back to {@link DEFAULT_AISDK_CREDENTIALS} when the provider is unknown.
 */
export function credentialsForModel(model: LanguageModel): CredentialSource[] {
  const providerId = resolveProviderId(model);
  const key = providerId ? PROVIDER_ID_TO_KEY[providerId] : undefined;

  if (key && key !== "gateway") {
    return [PROVIDERS.gateway(), PROVIDERS[key]()];
  }

  if (key === "gateway") {
    return [PROVIDERS.gateway()];
  }

  return [...DEFAULT_AISDK_CREDENTIALS];
}
