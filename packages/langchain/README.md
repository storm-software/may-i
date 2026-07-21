<!-- START header -->

<!-- END header -->

# May I? - LangChain integration

Credential-gated helpers for [LangChain](https://docs.langchain.com/build-overview) (`@langchain/core` / `langchain`). Same idea as `@may-i/core`, fewer options, LangChain–aware defaults.

## Installing

Using [pnpm](http://pnpm.io):

```bash
pnpm add -D @may-i/langchain @langchain/core langchain
```

<details>
  <summary>Using npm</summary>

```bash
npm install -D @may-i/langchain @langchain/core langchain
```

</details>

<details>
  <summary>Using yarn</summary>

```bash
yarn add -D @may-i/langchain @langchain/core langchain
```

</details>

Also install a provider package when needed (e.g. `@langchain/openai`, `@langchain/anthropic`, `@langchain/google-genai`).

## Usage

```ts
import { initChatModel } from "langchain";
import { invoke, gate } from "@may-i/langchain";

const model = await initChatModel("openai:gpt-5.5");

// Drop-in invoke: returns `default` when no AI credentials exist
const message = await invoke({
  model,
  input: "Hello",
  default: { content: "Offline fallback" }
});

// Or wrap any LangChain call — credentials default to common providers
const run = gate({ default: { content: "Offline" } });
const result = await run(() => model.invoke("Hi"));
```

Set provider keys in the environment (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, etc.). See the [LangChain quick start](https://docs.langchain.com/oss/javascript/langchain/quickstart).

## Building

Run `nx build langchain` to build the library.

## Running unit tests

Run `nx test langchain` to execute the unit tests via [Vitest](https://vitest.dev/).

<!-- START footer -->

<!-- END footer -->
