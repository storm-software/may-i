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

export {
  DEFAULT_LANGCHAIN_CREDENTIALS,
  credentialsForModel,
  langchainCredential,
  resolveProviderId
} from "./credentials";
export type {
  LangchainModelLike,
  LangchainProviderName
} from "./credentials";
export { ask, gate } from "./gate";
export { invoke } from "./invoke";
export type { InvokeParams, LangchainRunnableLike } from "./invoke";
export type * from "./types";

export {
  MayIError,
  checkCredentials,
  hasCredentials,
  isMayIError,
  providerCredentials,
  PROVIDER_ENV
} from "@may-i/core";
export type { ProviderName } from "@may-i/core";
