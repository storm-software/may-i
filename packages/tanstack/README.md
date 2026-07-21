<!-- START header -->

<!-- END header -->

# May I? - TanStack AI integration

Credential-gated helpers for [TanStack AI](https://tanstack.com/ai/latest) (`@tanstack/ai`). Same idea as `@may-i/core`, fewer options, TanStack AI–aware defaults.

## Installing

Using [pnpm](http://pnpm.io):

```bash
pnpm add -D @may-i/tanstack @tanstack/ai
```

<details>
  <summary>Using npm</summary>

```bash
npm install -D @may-i/tanstack @tanstack/ai
```

</details>

<details>
  <summary>Using yarn</summary>

```bash
yarn add -D @may-i/tanstack @tanstack/ai
```

</details>

Also install a provider adapter (e.g. `@tanstack/ai-openai`, `@tanstack/ai-anthropic`, `@tanstack/ai-openrouter`).

## Usage

```ts
import { chat as tanstackChat } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { chat, gate } from "@may-i/tanstack";

// Drop-in chat: returns `default` when no AI credentials exist
const text = await chat({
  adapter: openaiText("gpt-5.2"),
  messages: [{ role: "user", content: "Hello" }],
  stream: false,
  default: "Offline fallback"
});

// Or wrap any TanStack AI call — credentials default to OpenRouter + common providers
const run = gate({ default: "Offline" });
const result = await run(() =>
  tanstackChat({
    adapter: openaiText("gpt-5.2"),
    messages: [{ role: "user", content: "Hi" }],
    stream: false
  })
);
```

Set provider keys in the environment (`OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, etc.). See the [TanStack AI quick start](https://tanstack.com/ai/latest/docs/getting-started/quick-start).

## Building

Run `nx build tanstack` to build the library.

## Running unit tests

Run `nx test tanstack` to execute the unit tests via [Vitest](https://vitest.dev/).

<!-- START footer -->

<!-- END footer -->
