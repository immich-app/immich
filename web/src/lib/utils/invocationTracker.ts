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
   * @returns {Object} An object containing methods to manage the invocation:
   *   - isInvalidInvocationError: Checks if an error is an invalid invocation error
   *   - checkStillValid: Throws an error if the invocation is no longer valid
   *   - endInvocation: Marks the invocation as complete
   */
  startInvocation() {
    this.invocationsStarted++;
    const invocation = this.invocationsStarted;

    return {
      /**
       * Checks if an error is an invalid invocation error
       * @param {unknown} error - The error to check
       * @returns {boolean} True if the error is an invalid invocation error
       */
      isInvalidInvocationError(error: unknown) {
        return error instanceof Error && error.message === 'Invocation not valid';
      },

      /**
       * Throws an error if this invocation is no longer valid
       * @throws {Error} If the invocation is no longer valid
       */
      checkStillValid: () => {
        if (invocation !== this.invocationsStarted) {
          throw new Error('Invocation not valid');
        }
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
   * @returns {boolean} True if there are active invocations, false otherwise
   */
  isActive() {
    return this.invocationsStarted !== this.invocationsEnded;
  }
}
