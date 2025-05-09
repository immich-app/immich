package app.alextran.immich.platform

import ImHostService
import SyncDelta
import android.content.Context
import android.os.Build
import android.os.ext.SdkExtensions

class MessagesImpl(context: Context) : ImHostService {
  private val ctx: Context = context.applicationContext
  private val mediaManager: MediaManager = MediaManager(ctx)

  companion object {
    private fun isMediaChangesSupported(): Boolean {
      return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
        SdkExtensions.getExtensionVersion(Build.VERSION_CODES.R) >= 1
    }

    private fun unsupportedFeatureException() =
      IllegalStateException("Method not supported on this Android version.")
  }

  override fun shouldFullSync(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || mediaManager.shouldFullSync()

  override fun getMediaChanges(): SyncDelta {
    if (!isMediaChangesSupported()) {
      throw unsupportedFeatureException()
    }
    return mediaManager.getMediaChanges()
  }

  override fun checkpointSync() {
    if (!isMediaChangesSupported()) {
      return
    }
    mediaManager.checkpointSync()
  }

  override fun getAssetIdsForAlbum(albumId: String): List<String> {
    if (!isMediaChangesSupported()) {
      throw unsupportedFeatureException()
    }
    return mediaManager.getAssetIdsForAlbum(albumId)
  }
}
