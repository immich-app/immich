package app.alextran.immich.platform

import ImHostService
import SyncDelta
import android.content.Context
import android.os.Build
import android.os.ext.SdkExtensions

class MessagesImpl(context: Context) : ImHostService {
  private val ctx: Context = context.applicationContext
  private val mediaManager: MediaManager = MediaManager(ctx)

  override fun shouldFullSync(callback: (Result<Boolean>) -> Unit) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      mediaManager.shouldFullSync(callback)
    } else {
      callback(Result.success(true))
    }
  }

  override fun hasMediaChanges(callback: (Result<Boolean>) -> Unit) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && SdkExtensions.getExtensionVersion(Build.VERSION_CODES.R) >= 1) {
      mediaManager.hasMediaChanges(callback)
    } else {
      callback(Result.failure(IllegalStateException("hasMediaChanges changes not supported on this Android version.")))
    }
  }

  override fun getMediaChanges(callback: (Result<SyncDelta>) -> Unit) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && SdkExtensions.getExtensionVersion(Build.VERSION_CODES.R) >= 1) {
      mediaManager.getMediaChanges(callback)
    } else {
      callback(Result.failure(IllegalStateException("getMediaChanges not supported on this Android version.")))
    }
  }

  override fun checkpointSync(callback: (Result<Unit>) -> Unit) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && SdkExtensions.getExtensionVersion(Build.VERSION_CODES.R) >= 1) {
      mediaManager.checkpointSync(callback)
    } else {
      callback(Result.success(Unit))
    }
  }

  override fun getAssetIdsForAlbum(
    albumId: String,
    callback: (Result<List<String>>) -> Unit
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && SdkExtensions.getExtensionVersion(Build.VERSION_CODES.R) >= 1) {
      mediaManager.getAssetIdsForAlbum(albumId, callback)
    } else {
      callback(Result.failure(IllegalStateException("getAssetIdsForAlbum not supported on this Android version.")))
    }
  }
}
