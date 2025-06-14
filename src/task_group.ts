export class TaskGroup {
  private count = 0;
  private waiters: (() => void)[] = [];

  add(n: number) {
    this.count += n;
  }

  done() {
    this.count -= 1;
    if (this.count === 0) {
      this.waiters.forEach((r) => r());
      this.waiters.length = 0;
    }
  }

  async wait(): Promise<void> {
    if (this.count === 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }
}
