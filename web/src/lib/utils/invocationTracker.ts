export class InvocationTracker {
  invocationsStarted = 0;
  invocationsEnded = 0;
  constructor() {}
  startInvocation() {
    this.invocationsStarted++;
    const invocation = this.invocationsStarted;

    return {
      isInvalidInvocationError(error: unknown) {
        return error instanceof Error && error.message === 'Invocation not valid';
      },
      checkStillValid: () => {
        if (invocation !== this.invocationsStarted) {
          throw new Error('Invocation not valid');
        }
      },
      endInvocation: () => {
        this.invocationsEnded = invocation;
      },
    };
  }
  isActive() {
    return this.invocationsStarted !== this.invocationsEnded;
  }
}
