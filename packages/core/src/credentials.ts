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

import { toArray } from "@stryke/convert/to-array";
import { isFunction } from "@stryke/type-checks/is-function";
import { isSetString } from "@stryke/type-checks/is-set-string";
import type { Arrayable } from "@stryke/types/array";
import type {
  CredentialCheckResult,
  CredentialEnv,
  CredentialMode,
  CredentialSource,
  CredentialsInput
} from "./types";

/**
 * Common provider environment variable names used by AI SDK, TanStack AI,
 * LangChain, and related adapters. Prefer these when configuring
 * {@link checkCredentials}.
 *
 * @see https://ai-sdk.dev/docs
 * @see https://tanstack.com/ai/latest
 * @see https://docs.langchain.com/oss/javascript/integrations/providers/overview
 */
export const PROVIDER_ENV = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  /** Anthropic Bearer auth (`Authorization` header); alternative to `anthropic` */
  anthropicAuth: "ANTHROPIC_AUTH_TOKEN",
  /** Anthropic on AWS */
  anthropicAws: "ANTHROPIC_AWS_API_KEY",
  /** Vercel AI Gateway */
  gateway: "AI_GATEWAY_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  /** TanStack AI / Google Gemini adapters */
  gemini: "GEMINI_API_KEY",
  /** AI SDK Google provider */
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  /** LangChain Google Generative AI (`@langchain/google-genai`) */
  googleApi: "GOOGLE_API_KEY",
  /** Google Vertex Express Mode */
  googleVertex: "GOOGLE_VERTEX_API_KEY",
  azure: "AZURE_API_KEY",
  /** LangChain / Azure OpenAI */
  azureOpenAI: "AZURE_OPENAI_API_KEY",
  /** Azure Cosmos DB NoSQL connection string */
  azureCosmosdb: "AZURE_COSMOSDB_NOSQL_CONNECTION_STRING",
  /** Azure Cosmos DB NoSQL endpoint (pair with key/token auth) */
  azureCosmosdbEndpoint: "AZURE_COSMOSDB_NOSQL_ENDPOINT",
  /** Azure Cosmos DB for MongoDB vCore connection string */
  azureCosmosdbMongo: "AZURE_COSMOSDB_MONGODB_CONNECTION_STRING",
  /** Azure DocumentDB connection string */
  azureDocumentdb: "AZURE_DOCUMENTDB_CONNECTION_STRING",
  /** Amazon Bedrock API key auth */
  bedrock: "AWS_BEARER_TOKEN_BEDROCK",
  groq: "GROQ_API_KEY",
  xai: "XAI_API_KEY",
  mistral: "MISTRAL_API_KEY",
  together: "TOGETHER_API_KEY",
  /** LangChain Together AI (`@langchain/together-ai`) */
  togetherAi: "TOGETHER_AI_API_KEY",
  fireworks: "FIREWORKS_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  cohere: "COHERE_API_KEY",
  huggingface: "HUGGINGFACE_API_KEY",
  /** LangChain Hugging Face Hub */
  huggingfaceHub: "HUGGINGFACEHUB_API_KEY",
  cerebras: "CEREBRAS_API_KEY",
  deepinfra: "DEEPINFRA_API_KEY",
  /** Cloudflare Workers AI (pair with `cloudflareAccount`) */
  cloudflare: "CLOUDFLARE_API_TOKEN",
  cloudflareAccount: "CLOUDFLARE_ACCOUNT_ID",
  /** Exa / Exa Search (LangChain docs) */
  exa: "EXASEARCH_API_KEY",
  /** Exa alternate env name */
  exaApi: "EXA_API_KEY",
  tavily: "TAVILY_API_KEY",
  /** You.com */
  youdotcom: "YDC_API_KEY",
  nomic: "NOMIC_API_KEY",
  /** Ollama Cloud hosted inference */
  ollama: "OLLAMA_API_KEY",
  pinecone: "PINECONE_API_KEY",
  qdrant: "QDRANT_API_KEY",
  weaviate: "WEAVIATE_API_KEY",
  turbopuffer: "TURBOPUFFER_API_KEY",
  /** MongoDB Atlas vector search */
  mongodb: "MONGODB_ATLAS_URI",
  fal: "FAL_API_KEY",
  /** fal.ai alternate env name */
  falKey: "FAL_KEY",
  replicate: "REPLICATE_API_TOKEN",
  assemblyai: "ASSEMBLYAI_API_KEY",
  baseten: "BASETEN_API_KEY",
  cartesia: "CARTESIA_API_KEY",
  deepgram: "DEEPGRAM_API_KEY",
  elevenlabs: "ELEVENLABS_API_KEY",
  gladia: "GLADIA_API_KEY",
  hume: "HUME_API_KEY",
  lmnt: "LMNT_API_KEY",
  luma: "LUMA_API_KEY",
  moonshot: "MOONSHOT_API_KEY",
  alibaba: "ALIBABA_API_KEY",
  /** ByteDance Ark */
  bytedance: "ARK_API_KEY",
  /** Black Forest Labs */
  blackForestLabs: "BFL_API_KEY",
  voyage: "VOYAGE_API_KEY",
  /** Voyage AI alternate env name */
  voyageAi: "VOYAGEAI_API_KEY",
  quiverai: "QUIVERAI_API_KEY",
  prodia: "PRODIA_TOKEN",
  revai: "REVAI_API_KEY",
  vercel: "VERCEL_API_KEY",
  /** Kling AI (pair with `klingaiSecret`) */
  klingai: "KLINGAI_ACCESS_KEY",
  klingaiSecret: "KLINGAI_SECRET_KEY"
} as const;

export type ProviderName = keyof typeof PROVIDER_ENV;

function readEnvValue(
  name: string,
  env: CredentialEnv | undefined
): string | undefined {
  const source = env ?? (typeof process !== "undefined" ? process.env : {});
  const value = source[name];

  if (!isSetString(value)) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function sourceName(source: CredentialSource, index: number): string {
  if (isSetString(source)) {
    return source;
  }

  if (isFunction(source)) {
    return `custom[${index}]`;
  }

  return source.name;
}

async function isSourcePresent(
  source: CredentialSource,
  env: CredentialEnv | undefined
): Promise<boolean> {
  if (isSetString(source)) {
    return readEnvValue(source, env) !== undefined;
  }

  if (isFunction(source)) {
    return Boolean(await source(env));
  }

  if (source.check) {
    return Boolean(await source.check(env));
  }

  if (source.value !== undefined) {
    return isSetString(source.value) && source.value.trim().length > 0;
  }

  if (source.env) {
    return readEnvValue(source.env, env) !== undefined;
  }

  return readEnvValue(source.name, env) !== undefined;
}

/**
 * Evaluate whether the given credentials are available.
 */
export async function checkCredentials(
  credentials?: CredentialsInput,
  options: {
    mode?: CredentialMode;
    env?: CredentialEnv;
  } = {}
): Promise<CredentialCheckResult> {
  const mode = options.mode ?? "any";
  const sources = toArray((credentials ?? []) as Arrayable<CredentialSource>);
  const present: string[] = [];
  const missing: string[] = [];

  for (const [index, source] of sources.entries()) {
    const name = sourceName(source, index);
    const ok = await isSourcePresent(source, options.env);

    if (ok) {
      present.push(name);
    } else {
      missing.push(name);
    }
  }

  const allowed =
    sources.length === 0
      ? false
      : mode === "all"
        ? missing.length === 0
        : present.length > 0;

  return { allowed, present, missing, mode };
}

/**
 * `true` when {@link checkCredentials} reports `allowed`.
 */
export async function hasCredentials(
  credentials: CredentialsInput,
  options: {
    mode?: CredentialMode;
    env?: CredentialEnv;
  } = {}
): Promise<boolean> {
  const result = await checkCredentials(credentials, options);

  return result.allowed;
}

/**
 * Resolve env var names for one or more known AI providers.
 */
export function providerCredentials(...providers: ProviderName[]): string[] {
  return providers.map(provider => PROVIDER_ENV[provider]);
}
