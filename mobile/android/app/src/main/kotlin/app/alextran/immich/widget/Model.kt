package app.alextran.immich.widget

import androidx.glance.appwidget.GlanceAppWidget

sealed class WidgetError : Exception() {
  data object NoLogin : WidgetError()
  data object FetchFailed : WidgetError()
  data object Unknown : WidgetError()
  data object AlbumNotFound : WidgetError()
}

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

enum class WidgetType {
  RANDOM;

  val widgetClass: Class<out GlanceAppWidget>
    get() = when (this) {
      RANDOM -> RandomWidget::class.java
    }
}

data class WidgetConfig(
  val widgetType: WidgetType,
  val params: Map<String, String>,
  val credentials: ServerConfig
)

data class ServerConfig(val serverEndpoint: String, val sessionKey: String)
