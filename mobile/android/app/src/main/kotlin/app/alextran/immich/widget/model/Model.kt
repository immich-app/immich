package app.alextran.immich.widget.model

import androidx.datastore.preferences.core.*

// MARK: Immich Entities

enum class AssetType {
  IMAGE, VIDEO, AUDIO, OTHER
}

data class Asset(
  val id: String,
  val type: AssetType,
)

data class SearchFilters(
  var type: AssetType = AssetType.IMAGE,
  val size: Int = 1,
  var albumIds: List<String> = listOf(),
  var isFavorite: Boolean? = null
)

data class MemoryResult(
  val id: String,
  var assets: List<Asset>,
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

enum class WidgetConfigState {
  LOADING, SUCCESS, LOG_IN, NO_CONNECTION
}

data class WidgetEntry (
  val assetId: String,
  val subtitle: String?,
  val deeplink: String?
)

// MARK: Widget State Keys
val kAssetId = stringPreferencesKey("assetId")
val kSubtitleText = stringPreferencesKey("subtitle")
val kNow = longPreferencesKey("now")
val kWidgetState = stringPreferencesKey("state")
val kSelectedAlbum = stringPreferencesKey("albumID")
val kSelectedAlbumName = stringPreferencesKey("albumName")
val kShowAlbumName = booleanPreferencesKey("showAlbumName")
val kDeeplinkURL = stringPreferencesKey("deeplink")

const val kWorkerWidgetType = "widgetType"
const val kWorkerWidgetID = "widgetId"
const val kTriggeredFromApp = "triggeredFromApp"

fun assetDeeplink(asset: Asset): String {
  return "immich://asset?id=${asset.id}"
}
