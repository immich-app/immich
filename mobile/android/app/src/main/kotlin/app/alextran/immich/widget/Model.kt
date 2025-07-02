package app.alextran.immich.widget

import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.appwidget.GlanceAppWidget

// MARK: Immich Entities

enum class AssetType {
  IMAGE, VIDEO, AUDIO, OTHER
}

data class SearchResult(
  val id: String,
  val type: AssetType
)

data class SearchFilters(
  var type: AssetType = AssetType.IMAGE,
  val size: Int,
  var albumIds: List<String> = listOf()
)

data class MemoryResult(
  val id: String,
  var assets: List<SearchResult>,
  val type: String,
  val data: MemoryData
) {
  data class MemoryData(val year: Int)
}

data class Album(
  val id: String,
  val albumName: String
)

// MARK: Widget Specific

enum class WidgetType {
  RANDOM, MEMORIES;
}

enum class WidgetState {
  LOADING, SUCCESS, LOG_IN;
}

data class ServerConfig(val serverEndpoint: String, val sessionKey: String)

// MARK: Widget State Keys
val kImageUUID = stringPreferencesKey("uuid")
val kSubtitleText = stringPreferencesKey("subtitle")
val kNow = longPreferencesKey("now")
val kWidgetState = stringPreferencesKey("state")
val kSelectedAlbum = stringPreferencesKey("albumID")
val kSelectedAlbumName = stringPreferencesKey("albumName")
val kShowAlbumName = booleanPreferencesKey("showAlbumName")

const val kWorkerWidgetType = "widgetType"
const val kWorkerWidgetID = "widgetId"

fun imageFilename(id: String): String {
  return "widget_image_$id.jpg"
}
