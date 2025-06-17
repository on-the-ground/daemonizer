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

## 🧪 Try in Your Browser

Run the daemon in your browser with no setup:  
👉 [examples/example.html](./examples/example.html)

Open your browser console and watch `tick:` messages stream in real time!

```html
<!-- examples/example.html -->
<!DOCTYPE html>
<html>
  <body>
    <script type="module">
      import {
        launchEventLoop,
        TaskGroup,
      } from "https://esm.sh/@on-the-ground/daemonizer";

      const controller = new AbortController();
      const signal = controller.signal;
      const taskGroup = new TaskGroup();

      async function* stream() {
        while (true) {
          await new Promise((r) => setTimeout(r, 500));
          yield Math.random();
        }
      }

      launchEventLoop(signal, taskGroup, stream(), async (_sig, e) => {
        console.log("tick:", e);
      });

      setTimeout(() => {
        controller.abort();
      }, 5000);

      console.log("waiting the daemon down");
      await taskGroup.wait();
      console.log("the daemon got down");
    </script>
  </body>
</html>

<!-- Results:
waiting the daemon down
test.html:22 tick: 0.17133613821350968
test.html:22 tick: 0.1096581440474449
test.html:22 tick: 0.9839765784196945
test.html:22 tick: 0.015502678232037548
test.html:22 tick: 0.12016593237300965
test.html:22 tick: 0.4231255582511755
test.html:22 tick: 0.3327403253579475
test.html:22 tick: 0.48606744644617483
test.html:22 tick: 0.637584393131401
test.html:31 the daemon got down -->
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
