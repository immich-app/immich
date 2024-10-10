/**
 * Tiny function to mark the action performed by the test in console.
 *
 * @param text name of the step performed by the test
 */
export function step(text: string) {
  console.log(`🚩 STEP: ${text}`);
}
