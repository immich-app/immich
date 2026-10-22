package app.alextran.immich.spherical

import android.content.Context
import android.content.Intent
import android.util.Log

class SphericalVideoApiImpl(private val ctx: Context) : SphericalVideoApi {
  override fun openViewer(url: String, callback: (Result<Boolean>) -> Unit) {
    try {
      val intent = SphericalVideoActivity.intent(ctx, url)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      callback(Result.success(true))
    } catch (e: Exception) {
      Log.e(TAG, "Failed to open the spherical video player", e)
      callback(Result.success(false))
    }
  }

  companion object {
    private const val TAG = "SphericalVideoApiImpl"
  }
}
