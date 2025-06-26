package app.alextran.immich.widget

enum class WidgetError {
  NO_LOGIN, FETCH_FAILED, UNKNOWN, ALBUM_NOT_FOUND
}

data class WidgetEntry(
  val imageURI: String? = null,
  val error: WidgetError? = null,
  val subtitle: String? = null
)
