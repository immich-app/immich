package app.alextran.immich.sync

import android.content.Context


class NativeSyncApiImpl26(context: Context) : NativeSyncApiImplBase(context), NativeSyncApi {
  override fun shouldFullSync(): Boolean {
    return true
  }

  // No-op for Android 10 and below
  override fun checkpointSync() {
    // Cannot throw exception as this is called from the Dart side
    // during the full sync process as well
  }

  override fun clearSyncCheckpoint() {
    // No-op for Android 10 and below
  }

  override fun getMediaChanges(): SyncDelta {
    throw IllegalStateException("Method not supported on this Android version.")
  }

  override fun getTrashedAssetsForAlbum(
    albumId: String,
    updatedTimeCond: Long?
  ): List<PlatformAsset> {
    throw IllegalStateException("Method not supported on this Android version.")
  }

  override fun hashTrashedAssets(
    trashedAssets: List<TrashedAssetParams>,
    callback: (Result<List<HashResult>>) -> Unit
  ) {
    throw IllegalStateException("Method not supported on this Android version.")
  }
}
