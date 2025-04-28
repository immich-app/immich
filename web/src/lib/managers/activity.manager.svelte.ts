class ActivityManager {
  #numberOfComments = $state<number>(0);

  get numberOfComments() {
    return this.#numberOfComments;
  }

  set numberOfComments(number: number) {
    this.#numberOfComments = number;
  }

  updateNumberOfComments(addOrRemove: 1 | -1) {
    this.#numberOfComments += addOrRemove;
  }
}

export const activityManager = new ActivityManager();
