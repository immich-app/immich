package app.alextran.immich.core

import android.content.Context
import android.util.Log
import java.util.concurrent.Executors

object NativeCore {
  // Matches ImmichCoreLogLevel.
  enum class Level(val value: Int, val priority: Int) { INFO(0, Log.INFO), WARNING(1, Log.WARN), SEVERE(2, Log.ERROR) }

  private val loaded by lazy { runCatching { System.loadLibrary("immich_core_ffi") }.isSuccess }
  private val queue = Executors.newSingleThreadExecutor()

  fun log(ctx: Context, level: Level, logger: String, message: String) {
    Log.println(level.priority, logger, message)
    val dir = ctx.getDir("flutter", Context.MODE_PRIVATE).absolutePath
    queue.execute { if (loaded) runCatching { nativeLog(dir, level.value, logger, message) } }
  }

  private external fun nativeLog(dir: String, level: Int, logger: String, message: String)
}
