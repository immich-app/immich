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

    private const val DEFAULT_MIN_DELAY_SECONDS = 30L
    private const val DEFAULT_REQUIRE_CHARGING = false
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

  fun setLocked(paused: Boolean) {
    sp.edit {
      putBoolean(SHARED_PREF_LOCK_KEY, paused)
    }
  }

  fun isLocked(): Boolean {
    return sp.getBoolean(SHARED_PREF_LOCK_KEY, true)
  }
}

