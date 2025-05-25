/**
 * Tracks the state of asynchronous invocations to handle race conditions and stale operations.
 * This class helps manage concurrent operations by tracking which invocations are active
 * and allowing operations to check if they're still valid.
 */
export class InvocationTracker {
  /** Counter for the number of invocations that have been started */
  invocationsStarted = 0;
  /** Counter for the number of invocations that have been completed */
  invocationsEnded = 0;

  constructor() {}

  /**
   * Starts a new invocation and returns an object with utilities to manage the invocation lifecycle.
   * @returns  An object containing methods to manage the invocation:
   *   - isInvalidInvocationError: Checks if an error is an invalid invocation error
   *   - checkStillValid: Throws an error if the invocation is no longer valid
   *   - endInvocation: Marks the invocation as complete
   */
  startInvocation() {
    this.invocationsStarted++;
    const invocation = this.invocationsStarted;

    return {
      /**
       * Throws an error if this invocation is no longer valid
       * @throws {Error} If the invocation is no longer valid
       */
      isStillValid: () => {
        if (invocation !== this.invocationsStarted) {
          return false;
        }
        return true;
      },

      /**
       * Marks this invocation as complete
       */
      endInvocation: () => {
        this.invocationsEnded = invocation;
      },
    };
  }

  /**
   * Checks if there are any active invocations
   * @returns True if there are active invocations, false otherwise
   */
  isActive() {
    return this.invocationsStarted !== this.invocationsEnded;
  }
}
