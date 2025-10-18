package app.alextran.immich.background

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit

class BackgroundWorkerPreferences(private val ctx: Context) {
  companion object {
    const val SHARED_PREF_NAME = "Immich::BackgroundWorker"
    private const val SHARED_PREF_MIN_DELAY_KEY = "BackgroundWorker::minDelaySeconds"
    private const val SHARED_PREF_REQUIRE_CHARGING_KEY = "BackgroundWorker::requireCharging"
    private const val SHARED_PREF_LOCK_KEY = "BackgroundWorker::isLocked"
    private const val SHARED_PREF_NOTIF_TITLE_KEY = "BackgroundWorker::notificationTitle"
    private const val SHARED_PREF_NOTIF_MSG_KEY = "BackgroundWorker::notificationMessage"

    private const val DEFAULT_MIN_DELAY_SECONDS = 30L
    private const val DEFAULT_REQUIRE_CHARGING = false
    private const val DEFAULT_NOTIF_TITLE = "Uploading media"
    private const val DEFAULT_NOTIF_MSG = "Checking for new assets…"
  }

  private val sp: SharedPreferences by lazy {
    ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
  }

  fun updateSettings(settings: BackgroundWorkerSettings) {
    sp.edit {
      putLong(SHARED_PREF_MIN_DELAY_KEY, settings.minimumDelaySeconds)
      putBoolean(SHARED_PREF_REQUIRE_CHARGING_KEY, settings.requiresCharging)
    }
  }

  fun getSettings(): BackgroundWorkerSettings {
    val delaySeconds = sp.getLong(SHARED_PREF_MIN_DELAY_KEY, DEFAULT_MIN_DELAY_SECONDS)

    return BackgroundWorkerSettings(
      minimumDelaySeconds = if (delaySeconds >= 1000) delaySeconds / 1000 else delaySeconds,
      requiresCharging = sp.getBoolean(
        SHARED_PREF_REQUIRE_CHARGING_KEY,
        DEFAULT_REQUIRE_CHARGING
      ),
    )
  }

  fun updateNotificationConfig(title: String, message: String) {
    sp.edit {
      putString(SHARED_PREF_NOTIF_TITLE_KEY, title)
      putString(SHARED_PREF_NOTIF_MSG_KEY, message)
    }
  }

  fun getNotificationConfig(): Pair<String, String> {
    val title =
      sp.getString(SHARED_PREF_NOTIF_TITLE_KEY, DEFAULT_NOTIF_TITLE) ?: DEFAULT_NOTIF_TITLE
    val message = sp.getString(SHARED_PREF_NOTIF_MSG_KEY, DEFAULT_NOTIF_MSG) ?: DEFAULT_NOTIF_MSG
    return Pair(title, message)
  }

  fun setLocked(paused: Boolean) {
    sp.edit {
      putBoolean(SHARED_PREF_LOCK_KEY, paused)
    }
  }

  fun isLocked(): Boolean {
    return sp.getBoolean(SHARED_PREF_LOCK_KEY, true)
  }
}

