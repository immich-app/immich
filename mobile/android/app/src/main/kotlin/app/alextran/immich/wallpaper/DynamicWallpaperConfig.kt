package app.alextran.immich.wallpaper

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import es.antonborri.home_widget.HomeWidgetPlugin

const val kDynamicWallpaperAssetIds = "dynamic_wallpaper_asset_ids"
const val kDynamicWallpaperIntervalMinutes = "dynamic_wallpaper_interval_minutes"
const val kDynamicWallpaperNextIndex = "dynamic_wallpaper_next_index"
const val kDynamicWallpaperPreloadedIndex = "dynamic_wallpaper_preloaded_index"
const val kDynamicWallpaperImageFilename = "dynamic_wallpaper.jpg"
const val kDynamicWallpaperNextImageFilename = "dynamic_wallpaper_next.jpg"

data class DynamicWallpaperConfig(
  val assetIds: List<String>,
  val intervalMinutes: Int,
  val nextIndex: Int,
  val preloadedIndex: Int?,
)

object DynamicWallpaperConfigStore {
  private val gson = Gson()

  fun read(context: Context): DynamicWallpaperConfig {
    val prefs = HomeWidgetPlugin.getData(context)
    val assetIdsJson = prefs.getString(kDynamicWallpaperAssetIds, "[]") ?: "[]"
    val intervalMinutes = prefs.getString(kDynamicWallpaperIntervalMinutes, "60")?.toIntOrNull() ?: 60
    val nextIndex = prefs.getString(kDynamicWallpaperNextIndex, "0")?.toIntOrNull() ?: 0
    val preloadedIndex = prefs.getString(kDynamicWallpaperPreloadedIndex, null)?.toIntOrNull()
    val listType = object : TypeToken<List<String>>() {}.type
    val assetIds = runCatching {
      gson.fromJson<List<String>>(assetIdsJson, listType) ?: emptyList()
    }.getOrDefault(emptyList())

    return DynamicWallpaperConfig(
      assetIds = assetIds,
      intervalMinutes = intervalMinutes.coerceAtLeast(15),
      nextIndex = nextIndex.coerceAtLeast(0),
      preloadedIndex = preloadedIndex?.coerceAtLeast(0),
    )
  }

  fun write(context: Context, assetIds: List<String>, intervalMinutes: Int) {
    HomeWidgetPlugin.getData(context).edit()
      .putString(kDynamicWallpaperAssetIds, gson.toJson(assetIds))
      .putString(kDynamicWallpaperIntervalMinutes, intervalMinutes.coerceAtLeast(15).toString())
      .putString(kDynamicWallpaperNextIndex, "0")
      .remove(kDynamicWallpaperPreloadedIndex)
      .apply()
  }

  fun writeNextIndex(context: Context, nextIndex: Int) {
    HomeWidgetPlugin.getData(context).edit()
      .putString(kDynamicWallpaperNextIndex, nextIndex.coerceAtLeast(0).toString())
      .apply()
  }

  fun writePreloadedIndex(context: Context, preloadedIndex: Int) {
    HomeWidgetPlugin.getData(context).edit()
      .putString(kDynamicWallpaperPreloadedIndex, preloadedIndex.coerceAtLeast(0).toString())
      .apply()
  }

  fun clearPreloadedIndex(context: Context) {
    HomeWidgetPlugin.getData(context).edit()
      .remove(kDynamicWallpaperPreloadedIndex)
      .apply()
  }
}
