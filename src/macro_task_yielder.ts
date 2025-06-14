export class MacroTaskYielder {
  private lastYield: number;
  constructor(private readonly interval: number = 8) {
    this.lastYield = performance.now();
  }

  yieldByInterval = async (): Promise<void> => {
    const now = performance.now();
    if (now - this.lastYield < this.interval) return;
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        this.lastYield = performance.now();
        resolve();
      })
    );
  };
}
