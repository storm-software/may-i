<!-- START header -->

<!-- END header -->

# May I? - AI SDK integration

Credential-gated helpers for the [AI SDK](https://ai-sdk.dev) (`ai` package). Same idea as `@may-i/core`, fewer options, AI SDK–aware defaults.

## Installing

Using [pnpm](http://pnpm.io):

```bash
pnpm add -D @may-i/ai-sdk ai
```

<details>
  <summary>Using npm</summary>

```bash
npm install -D @may-i/ai-sdk ai
```

</details>

<details>
  <summary>Using yarn</summary>

```bash
yarn add -D @may-i/ai-sdk ai
```

</details>

## Usage

```ts
import { generateText as aiGenerateText } from "ai";
import { generateText, gate } from "@may-i/ai-sdk";

// Drop-in generateText: returns `default` when no AI credentials exist
const { text } = await generateText({
  model: "openai/gpt-4.1",
  prompt: "Hello",
  default: { text: "Offline fallback" }
});

// Or wrap any AI SDK call — credentials default to Gateway + common providers
const run = gate({ default: { text: "Offline" } });
const result = await run(() =>
  aiGenerateText({ model: "anthropic/claude-sonnet-4.5", prompt: "Hi" })
);
```

## Building

Run `nx build ai-sdk` to build the library.

## Running unit tests

Run `nx test ai-sdk` to execute the unit tests via [Vitest](https://vitest.dev/).

<!-- START footer -->

<!-- END footer -->
