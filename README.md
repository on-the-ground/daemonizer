# 🌀 Daemonizer

A minimal async control flow framework for writing browser and Node.js daemons.

Daemonizer helps you manage long-running async event loops, safely respond to cancellation, and yield control to the macro task queue—without starving the event loop.

---

## 🚀 Installation

```bash
yarn add daemonizer
# or
npm install daemonizer
```

---

## ✨ Features

- ✅ **Abort-aware event loop**
- ✅ **Task group with lifecycle tracking**
- ✅ **Yielding mechanism to avoid blocking**
- ✅ **Bounded queue for backpressure**
- ✅ **Works in both Node.js and browser**

---

## 📦 Usage

```ts
import { launchEventLoop, TaskGroup } from "daemonizer";

const abortController = new AbortController();
const taskGroup = new TaskGroup();

const stream = someAsyncEventSource();

launchEventLoop(
  abortController.signal,
  taskGroup,
  stream,
  async (_signal, event) => {
    // handle your event
    console.log("event:", event);
  }
);

...

await taskGroup.wait();
```

---

## 🧩 API Overview

### `launchEventLoop(signal, taskGroup, events, handler)`

Runs a long-lived, abortable event loop over an `AsyncIterable`.  
Automatically yields to the macro task queue to prevent starvation.

### `TaskGroup`

Tracks the lifecycle of multiple concurrent async tasks.

- `add(n = 1)`
- `done()`
- `wait(): Promise<void>`

### `MacroTaskYielder`

Yields only if enough time has passed since the last yield.

### `BoundedQueue<T>`

A fixed-capacity async queue. Backpressure-aware and safe for multiple consumers.

---

## 🌐 Compatibility

Daemonizer is fully compatible with:

- ✅ Node.js (v16+)
- ✅ Modern browsers (via bundlers like Vite, Webpack, etc.)

No external runtime dependencies.

---

## 📜 License

MIT © 2025 Joohyung Park  
[github.com/on-the-ground/daemonizer](https://github.com/on-the-ground/daemonizer)

---

> _"The name was subconsciously inspired by countless replays of Judas Priest’s 'Demonizer'."_