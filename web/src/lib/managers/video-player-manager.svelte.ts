/**
 * The playhead of the video open in the asset viewer, published so that panels beside the video can
 * follow it and steer it without owning the element.
 *
 * Keyed by asset, because the viewer keeps rendering while navigating between assets and a panel
 * must not highlight lines against the playhead of a video that is no longer the one it describes.
 */
class VideoPlayerManager {
  #assetId = $state<string>();
  #currentTime = $state(0);
  #player: HTMLVideoElement | undefined;

  get assetId() {
    return this.#assetId;
  }

  /** Playhead of `assetId` in seconds, or undefined when that video is not the one playing. */
  currentTimeOf(assetId: string) {
    return this.#assetId === assetId ? this.#currentTime : undefined;
  }

  register(assetId: string, player: HTMLVideoElement) {
    this.#assetId = assetId;
    this.#player = player;
    this.#currentTime = player.currentTime || 0;
  }

  unregister(player: HTMLVideoElement) {
    // A viewer being torn down after its replacement has already registered must not clear the
    // replacement's state: teardown of the old effect runs after the new one has run.
    if (this.#player !== player) {
      return;
    }

    this.#player = undefined;
    this.#assetId = undefined;
    this.#currentTime = 0;
  }

  onTimeUpdate(player: HTMLVideoElement) {
    if (this.#player === player) {
      this.#currentTime = player.currentTime;
    }
  }

  /** Moves the playhead, reporting whether there was a player of `assetId` to move. */
  seek(assetId: string, time: number) {
    if (this.#assetId !== assetId || !this.#player) {
      return false;
    }

    this.#player.currentTime = time;
    // Adopted immediately rather than waiting for the element's own event, so that what the panel
    // highlights matches what the click asked for even while the player is still seeking.
    this.#currentTime = time;
    return true;
  }
}

export const videoPlayerManager = new VideoPlayerManager();
