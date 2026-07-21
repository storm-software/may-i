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

import type { CredentialCheckResult } from "./types";

/**
 * Thrown when required AI credentials are missing and no default was provided.
 */
export class MayIError extends Error {
  override readonly name: string = "MayIError";

  readonly code: string = "MAY_I_MISSING_CREDENTIALS";

  readonly missing: string[];

  readonly present: string[];

  readonly mode: CredentialCheckResult["mode"];

  constructor(
    message: string,
    result: Pick<CredentialCheckResult, "missing" | "present" | "mode">
  ) {
    super(message);
    this.missing = result.missing;
    this.present = result.present;
    this.mode = result.mode;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isMayIError(error: unknown): error is MayIError {
  return error instanceof MayIError;
}
