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

  override fun shouldFullSync(callback: (Result<Boolean>) -> Unit) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      mediaManager.shouldFullSync(callback)
    } else {
      callback(Result.success(true))
    }
  }

  override fun getMediaChanges(callback: (Result<SyncDelta>) -> Unit) {
    if (isMediaChangesSupported()) {
      mediaManager.getMediaChanges(callback)
    } else {
      callback(Result.failure(unsupportedFeatureException()))
    }
  }

  override fun checkpointSync(callback: (Result<Unit>) -> Unit) {
    if (isMediaChangesSupported()) {
      mediaManager.checkpointSync(callback)
    } else {
      callback(Result.success(Unit))
    }
  }

  override fun getAssetIdsForAlbum(
    albumId: String,
    callback: (Result<List<String>>) -> Unit
  ) {
    if (isMediaChangesSupported()) {
      mediaManager.getAssetIdsForAlbum(albumId, callback)
    } else {
      callback(Result.failure(unsupportedFeatureException()))
    }
  }
}
