package app.alextran.immich

import android.app.Application
import android.content.Context
import androidx.work.Configuration
import androidx.work.WorkManager
import io.flutter.embedding.engine.FlutterEngineGroup
import io.flutter.embedding.engine.FlutterEngineGroupCache

class ImmichApp : Application() {
  companion object {
    private const val ENGINE_GROUP_ID = "immich::engines"

    fun getOrCreateEngineGroup(ctx: Context): FlutterEngineGroup {
      var engineGroup = FlutterEngineGroupCache.getInstance().get(ENGINE_GROUP_ID)
      if (engineGroup == null) {
        engineGroup = FlutterEngineGroup(ctx)
        FlutterEngineGroupCache.getInstance().put(ENGINE_GROUP_ID, engineGroup)
      }
      return engineGroup
    }
  }

  override fun onCreate() {
    super.onCreate()
    val config = Configuration.Builder().build()
    WorkManager.initialize(this, config)
    // always start BackupWorker after WorkManager init; this fixes the following bug:
    // After the process is killed (by user or system), the first trigger (taking a new picture) is lost.
    // Thus, the BackupWorker is not started. If the system kills the process after each initialization
    // (because of low memory etc.), the backup is never performed.
    // As a workaround, we also run a backup check when initializing the application
    ContentObserverWorker.startBackupWorker(context = this, delayMilliseconds = 0)
    getOrCreateEngineGroup(this)
  }
}
