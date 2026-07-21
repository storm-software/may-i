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
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { isSetString } from "@stryke/type-checks/is-set-string";

function hasEnvValue(env: CredentialEnv, name: string): boolean {
  const value = env[name];

  return isSetString(value) && value.trim().length > 0;
}

/**
 * Credential source that uses LangChain {@link getEnvironmentVariable}.
 *
 * When May I supplies a custom `env` map (tests / injection), presence is
 * checked on that map instead.
 *
 * @see https://docs.langchain.com/oss/javascript/langchain/quickstart
 * @see https://docs.langchain.com/oss/javascript/concepts/providers-and-models
 */
export function langchainCredential(
  environmentVariableName: string
): CredentialSource {
  return {
    name: environmentVariableName,
    check: (env?: CredentialEnv) => {
      if (env !== undefined) {
        return hasEnvValue(env, environmentVariableName);
      }

      const value = getEnvironmentVariable(environmentVariableName);

      return isSetString(value) && value.trim().length > 0;
    }
  };
}

/**
 * Hugging Face Hub accepts `HUGGINGFACEHUB_API_TOKEN` (docs) or
 * `HUGGINGFACEHUB_API_KEY` (legacy).
 */
function huggingfaceCredential(): CredentialSource {
  return {
    name: "HUGGINGFACEHUB_API_TOKEN|HUGGINGFACEHUB_API_KEY",
    check: (env?: CredentialEnv) => {
      if (env !== undefined) {
        return (
          hasEnvValue(env, "HUGGINGFACEHUB_API_TOKEN") ||
          hasEnvValue(env, "HUGGINGFACEHUB_API_KEY")
        );
      }

      const token = getEnvironmentVariable("HUGGINGFACEHUB_API_TOKEN");
      const key = getEnvironmentVariable("HUGGINGFACEHUB_API_KEY");

      return (
        (isSetString(token) && token.trim().length > 0) ||
        (isSetString(key) && key.trim().length > 0)
      );
    }
  };
}

const PROVIDERS = {
  openai: () => langchainCredential("OPENAI_API_KEY"),
  anthropic: () => langchainCredential("ANTHROPIC_API_KEY"),
  googleApi: () => langchainCredential("GOOGLE_API_KEY"),
  googleVertex: () => langchainCredential("GOOGLE_VERTEX_API_KEY"),
  openrouter: () => langchainCredential("OPENROUTER_API_KEY"),
  fireworks: () => langchainCredential("FIREWORKS_API_KEY"),
  baseten: () => langchainCredential("BASETEN_API_KEY"),
  ollama: () => langchainCredential("OLLAMA_API_KEY"),
  azureOpenAI: () => langchainCredential("AZURE_OPENAI_API_KEY"),
  bedrock: () => langchainCredential("AWS_BEARER_TOKEN_BEDROCK"),
  groq: () => langchainCredential("GROQ_API_KEY"),
  huggingfaceHub: huggingfaceCredential,
  mistral: () => langchainCredential("MISTRAL_API_KEY"),
  together: () => langchainCredential("TOGETHER_API_KEY"),
  togetherAi: () => langchainCredential("TOGETHER_AI_API_KEY"),
  cohere: () => langchainCredential("COHERE_API_KEY"),
  deepseek: () => langchainCredential("DEEPSEEK_API_KEY"),
  perplexity: () => langchainCredential("PERPLEXITY_API_KEY"),
  xai: () => langchainCredential("XAI_API_KEY"),
  cerebras: () => langchainCredential("CEREBRAS_API_KEY"),
  deepinfra: () => langchainCredential("DEEPINFRA_API_KEY")
} as const;

export type LangchainProviderName = keyof typeof PROVIDERS;

/**
 * Map LangChain `initChatModel` provider ids / `_llmType` values to factories.
 */
const PROVIDER_ID_TO_KEY: Record<string, LangchainProviderName> = {
  openai: "openai",
  anthropic: "anthropic",
  "google-genai": "googleApi",
  "google-generative-ai": "googleApi",
  google: "googleApi",
  gemini: "googleApi",
  "google-vertexai": "googleVertex",
  "google-vertexai-web": "googleVertex",
  openrouter: "openrouter",
  fireworks: "fireworks",
  baseten: "baseten",
  ollama: "ollama",
  azure_openai: "azureOpenAI",
  "azure-openai": "azureOpenAI",
  azure: "azureOpenAI",
  bedrock: "bedrock",
  "amazon-bedrock": "bedrock",
  groq: "groq",
  huggingface: "huggingfaceHub",
  huggingface_hub: "huggingfaceHub",
  "huggingface-hub": "huggingfaceHub",
  mistral: "mistral",
  mistralai: "mistral",
  together: "together",
  togetherai: "togetherAi",
  "together-ai": "togetherAi",
  cohere: "cohere",
  deepseek: "deepseek",
  perplexity: "perplexity",
  xai: "xai",
  grok: "xai",
  cerebras: "cerebras",
  deepinfra: "deepinfra"
};

/**
 * Default credential sources when the caller omits `credentials`.
 *
 * Uses `"any"` mode via {@link gate}: any listed LangChain provider key,
 * verified with LangChain `getEnvironmentVariable`.
 */
export const DEFAULT_LANGCHAIN_CREDENTIALS: CredentialSource[] = [
  PROVIDERS.openai(),
  PROVIDERS.anthropic(),
  PROVIDERS.googleApi(),
  PROVIDERS.openrouter(),
  PROVIDERS.fireworks(),
  PROVIDERS.baseten(),
  PROVIDERS.ollama(),
  PROVIDERS.azureOpenAI(),
  PROVIDERS.bedrock(),
  PROVIDERS.groq(),
  PROVIDERS.huggingfaceHub(),
  PROVIDERS.mistral(),
  PROVIDERS.together(),
  PROVIDERS.togetherAi(),
  PROVIDERS.cohere(),
  PROVIDERS.deepseek(),
  PROVIDERS.perplexity(),
  PROVIDERS.xai(),
  PROVIDERS.cerebras(),
  PROVIDERS.deepinfra()
];

/**
 * Minimal chat-model shape used for credential inference.
 *
 * Compatible with LangChain `BaseChatModel` (`_llmType`, `lc_id`).
 */
export type LangchainModelLike = {
  _llmType?: () => string;
  lc_id?: readonly string[];
  getName?: () => string;
};

/**
 * Resolve the provider id from a LangChain model string or instance.
 *
 * - `"openai:gpt-5.5"` → `"openai"`
 * - `"anthropic/claude-sonnet-4-6"` → `"anthropic"`
 * - model with `_llmType()` → that type string
 */
export function resolveProviderId(
  model: LangchainModelLike | string
): string | undefined {
  if (isSetString(model)) {
    const colon = model.indexOf(":");
    if (colon !== -1) {
      return model.slice(0, colon);
    }

    const slash = model.indexOf("/");
    if (slash !== -1) {
      return model.slice(0, slash);
    }

    return undefined;
  }

  if (typeof model === "object" && model !== null) {
    if (typeof model._llmType === "function") {
      const type = model._llmType();
      if (isSetString(type)) {
        return type;
      }
    }

    if (Array.isArray(model.lc_id) && model.lc_id.length > 0) {
      const last = model.lc_id[model.lc_id.length - 1];
      if (isSetString(last)) {
        const lowered = last.toLowerCase();
        if (lowered.startsWith("chat")) {
          return lowered.slice(4).replace(/^_+/, "") || undefined;
        }
        return lowered;
      }
    }

    if (typeof model.getName === "function") {
      const name = model.getName();
      if (isSetString(name)) {
        const lowered = name.toLowerCase();
        if (lowered.startsWith("chat")) {
          return lowered.slice(4).replace(/^_+/, "") || undefined;
        }
        return lowered;
      }
    }
  }

  return undefined;
}

/**
 * Credential sources for a model: the matching provider key check.
 *
 * Falls back to {@link DEFAULT_LANGCHAIN_CREDENTIALS} when the provider is unknown.
 */
export function credentialsForModel(
  model: LangchainModelLike | string
): CredentialSource[] {
  const providerId = resolveProviderId(model);
  const key = providerId ? PROVIDER_ID_TO_KEY[providerId] : undefined;

  if (key) {
    return [PROVIDERS[key]()];
  }

  return [...DEFAULT_LANGCHAIN_CREDENTIALS];
}
