export type Task = () => Promise<unknown> | unknown;

export class Tasks {
  private tasks: Task[] = [];

  push(...tasks: Task[]) {
    this.tasks.push(...tasks);
  }

  async all() {
    await Promise.all(this.tasks.map((item) => item()));
  }
}
