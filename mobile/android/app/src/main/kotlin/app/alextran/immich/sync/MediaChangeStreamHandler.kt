package app.alextran.immich.sync

import android.content.Context
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore

class MediaChangeStreamHandler(context: Context) : StreamMediaChangesStreamHandler() {
  private val resolver = context.applicationContext.contentResolver
  private var sink: PigeonEventSink<PlatformMediaChange>? = null

  private val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
    override fun onChange(selfChange: Boolean) {
      sink?.success(PlatformMediaChange())
    }
  }

  override fun onListen(p0: Any?, sink: PigeonEventSink<PlatformMediaChange>) {
    if (this.sink == null) {
      resolver.registerContentObserver(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true, observer)
      resolver.registerContentObserver(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true, observer)
    }
    this.sink = sink
  }

  override fun onCancel(p0: Any?) {
    resolver.unregisterContentObserver(observer)
    sink = null
  }
}
