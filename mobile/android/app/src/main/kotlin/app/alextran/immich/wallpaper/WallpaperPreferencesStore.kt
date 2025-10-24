package app.alextran.immich.wallpaper

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import org.json.JSONArray
import org.json.JSONException

import app.alextran.immich.wallpaper.WallpaperPreferencesMessage

/** Convenience wrapper around [WallpaperPreferencesMessage] persistence. */

private const val PREF_NAME = "immich_live_wallpaper"
internal const val KEY_ENABLED = "enabled"
internal const val KEY_PERSON_IDS = "person_ids"
internal const val KEY_ROTATION_MINUTES = "rotation_minutes"
internal const val KEY_ROTATION_MODE = "rotation_mode"
internal const val KEY_ALLOW_CELLULAR = "allow_cellular"
internal const val KEY_LAST_ERROR = "last_error"
internal const val KEY_REFRESH_TOKEN = "refresh_token"
internal const val KEY_LAST_ASSET_ID = "last_asset_id"
internal const val KEY_LAST_REFRESH_AT = "last_refresh_at"

class WallpaperPreferencesStore(private val context: Context) {
  private val prefs: SharedPreferences by lazy {
    context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
  }

  fun save(preferences: WallpaperPreferencesMessage) {
    prefs.edit {
      putBoolean(KEY_ENABLED, preferences.enabled)
      putString(KEY_PERSON_IDS, preferences.personIds.toJson())
      putLong(KEY_ROTATION_MINUTES, preferences.rotationMinutes)
      putString(KEY_ROTATION_MODE, preferences.rotationMode)
      putBoolean(KEY_ALLOW_CELLULAR, preferences.allowCellularData)
    }
    bumpRefreshToken()
  }

  fun getPreferences(): WallpaperPreferencesMessage? {
    if (!prefs.contains(KEY_ENABLED)) {
      return null
    }

    val enabled = prefs.getBoolean(KEY_ENABLED, false)
  val personIds = (prefs.getString(KEY_PERSON_IDS, null) ?: "[]").toStringList()
    val rotationMinutes = prefs.getLong(KEY_ROTATION_MINUTES, 15)
    val rotationMode = prefs.getString(KEY_ROTATION_MODE, "minutes") ?: "minutes"
    val allowCellular = prefs.getBoolean(KEY_ALLOW_CELLULAR, true)

    return WallpaperPreferencesMessage(
      enabled = enabled,
      personIds = personIds,
      rotationMinutes = rotationMinutes,
      rotationMode = rotationMode,
      allowCellularData = allowCellular
    )
  }

  fun getLastError(): String? = prefs.getString(KEY_LAST_ERROR, null)

  fun setLastError(message: String?) {
    prefs.edit {
      if (message.isNullOrBlank()) {
        remove(KEY_LAST_ERROR)
      } else {
        putString(KEY_LAST_ERROR, message)
      }
    }
  }

  fun bumpRefreshToken() {
    prefs.edit {
      putLong(KEY_REFRESH_TOKEN, System.currentTimeMillis())
    }
  }

  fun getRefreshToken(): Long = prefs.getLong(KEY_REFRESH_TOKEN, 0)

  fun setLastAssetId(assetId: String) {
    prefs.edit {
      putString(KEY_LAST_ASSET_ID, assetId)
      putLong(KEY_LAST_REFRESH_AT, System.currentTimeMillis())
    }
  }

  fun getLastAssetId(): String? = prefs.getString(KEY_LAST_ASSET_ID, null)

  fun getLastRefreshAt(): Long = prefs.getLong(KEY_LAST_REFRESH_AT, 0)

  fun registerListener(listener: SharedPreferences.OnSharedPreferenceChangeListener) {
    prefs.registerOnSharedPreferenceChangeListener(listener)
  }

  fun unregisterListener(listener: SharedPreferences.OnSharedPreferenceChangeListener) {
    prefs.unregisterOnSharedPreferenceChangeListener(listener)
  }

  private fun List<String>.toJson(): String {
    val array = JSONArray()
    forEach { array.put(it) }
    return array.toString()
  }

  private fun String.toStringList(): List<String> {
    return try {
      val array = JSONArray(this)
      val results = mutableListOf<String>()
      for (i in 0 until array.length()) {
        results.add(array.optString(i))
      }
      results
    } catch (_: JSONException) {
      emptyList()
    }
  }
}
