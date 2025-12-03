package app.alextran.immich.schema

import java.net.URL
import java.util.Date

enum class StoreKey(val rawValue: Int) {
  VERSION(0),
  DEVICE_ID_HASH(3),
  BACKUP_TRIGGER_DELAY(8),
  TILES_PER_ROW(103),
  GROUP_ASSETS_BY(105),
  UPLOAD_ERROR_NOTIFICATION_GRACE_PERIOD(106),
  THUMBNAIL_CACHE_SIZE(110),
  IMAGE_CACHE_SIZE(111),
  ALBUM_THUMBNAIL_CACHE_SIZE(112),
  SELECTED_ALBUM_SORT_ORDER(113),
  LOG_LEVEL(115),
  MAP_RELATIVE_DATE(119),
  MAP_THEME_MODE(124),

  ASSET_ETAG(1),
  CURRENT_USER(2),
  DEVICE_ID(4),
  ACCESS_TOKEN(11),
  SERVER_ENDPOINT(12),
  SSL_CLIENT_CERT_DATA(15),
  SSL_CLIENT_PASSWD(16),
  THEME_MODE(102),
  CUSTOM_HEADERS(127),
  PRIMARY_COLOR(128),
  PREFERRED_WIFI_NAME(133),

  EXTERNAL_ENDPOINT_LIST(135),

  LOCAL_ENDPOINT(134),
  SERVER_URL(10),

  BACKUP_FAILED_SINCE(5),

  BACKUP_REQUIRE_WIFI(6),
  BACKUP_REQUIRE_CHARGING(7),
  AUTO_BACKUP(13),
  BACKGROUND_BACKUP(14),
  LOAD_PREVIEW(100),
  LOAD_ORIGINAL(101),
  DYNAMIC_LAYOUT(104),
  BACKGROUND_BACKUP_TOTAL_PROGRESS(107),
  BACKGROUND_BACKUP_SINGLE_PROGRESS(108),
  STORAGE_INDICATOR(109),
  ADVANCED_TROUBLESHOOTING(114),
  PREFER_REMOTE_IMAGE(116),
  LOOP_VIDEO(117),
  MAP_SHOW_FAVORITE_ONLY(118),
  SELF_SIGNED_CERT(120),
  MAP_INCLUDE_ARCHIVED(121),
  IGNORE_ICLOUD_ASSETS(122),
  SELECTED_ALBUM_SORT_REVERSE(123),
  MAP_WITH_PARTNERS(125),
  ENABLE_HAPTIC_FEEDBACK(126),
  DYNAMIC_THEME(129),
  COLORFUL_INTERFACE(130),
  SYNC_ALBUMS(131),
  AUTO_ENDPOINT_SWITCHING(132),
  LOAD_ORIGINAL_VIDEO(136),
  MANAGE_LOCAL_MEDIA_ANDROID(137),
  READONLY_MODE_ENABLED(138),
  AUTO_PLAY_VIDEO(139),
  PHOTO_MANAGER_CUSTOM_FILTER(1000),
  BETA_PROMPT_SHOWN(1001),
  BETA_TIMELINE(1002),
  ENABLE_BACKUP(1003),
  USE_WIFI_FOR_UPLOAD_VIDEOS(1004),
  USE_WIFI_FOR_UPLOAD_PHOTOS(1005),
  NEED_BETA_MIGRATION(1006),
  SHOULD_RESET_SYNC(1007);

  companion object {
    fun fromInt(value: Int): StoreKey? = entries.find { it.rawValue == value }

    // Int keys
    val version = TypedStoreKey<Int>(VERSION)
    val deviceIdHash = TypedStoreKey<Int>(DEVICE_ID_HASH)
    val backupTriggerDelay = TypedStoreKey<Int>(BACKUP_TRIGGER_DELAY)
    val tilesPerRow = TypedStoreKey<Int>(TILES_PER_ROW)
    val groupAssetsBy = TypedStoreKey<Int>(GROUP_ASSETS_BY)
    val uploadErrorNotificationGracePeriod = TypedStoreKey<Int>(UPLOAD_ERROR_NOTIFICATION_GRACE_PERIOD)
    val thumbnailCacheSize = TypedStoreKey<Int>(THUMBNAIL_CACHE_SIZE)
    val imageCacheSize = TypedStoreKey<Int>(IMAGE_CACHE_SIZE)
    val albumThumbnailCacheSize = TypedStoreKey<Int>(ALBUM_THUMBNAIL_CACHE_SIZE)
    val selectedAlbumSortOrder = TypedStoreKey<Int>(SELECTED_ALBUM_SORT_ORDER)
    val logLevel = TypedStoreKey<Int>(LOG_LEVEL)
    val mapRelativeDate = TypedStoreKey<Int>(MAP_RELATIVE_DATE)
    val mapThemeMode = TypedStoreKey<Int>(MAP_THEME_MODE)

    // String keys
    val assetETag = TypedStoreKey<String>(ASSET_ETAG)
    val currentUser = TypedStoreKey<String>(CURRENT_USER)
    val deviceId = TypedStoreKey<String>(DEVICE_ID)
    val accessToken = TypedStoreKey<String>(ACCESS_TOKEN)
    val sslClientCertData = TypedStoreKey<String>(SSL_CLIENT_CERT_DATA)
    val sslClientPasswd = TypedStoreKey<String>(SSL_CLIENT_PASSWD)
    val themeMode = TypedStoreKey<String>(THEME_MODE)
    val customHeaders = TypedStoreKey<Map<String, String>>(CUSTOM_HEADERS)
    val primaryColor = TypedStoreKey<String>(PRIMARY_COLOR)
    val preferredWifiName = TypedStoreKey<String>(PREFERRED_WIFI_NAME)

    // Endpoint keys
    val externalEndpointList = TypedStoreKey<List<Endpoint>>(EXTERNAL_ENDPOINT_LIST)

    // URL keys
    val localEndpoint = TypedStoreKey<URL>(LOCAL_ENDPOINT)
    val serverEndpoint = TypedStoreKey<URL>(SERVER_ENDPOINT)
    val serverUrl = TypedStoreKey<URL>(SERVER_URL)

    // Date keys
    val backupFailedSince = TypedStoreKey<Date>(BACKUP_FAILED_SINCE)

    // Bool keys
    val backupRequireWifi = TypedStoreKey<Boolean>(BACKUP_REQUIRE_WIFI)
    val backupRequireCharging = TypedStoreKey<Boolean>(BACKUP_REQUIRE_CHARGING)
    val autoBackup = TypedStoreKey<Boolean>(AUTO_BACKUP)
    val backgroundBackup = TypedStoreKey<Boolean>(BACKGROUND_BACKUP)
    val loadPreview = TypedStoreKey<Boolean>(LOAD_PREVIEW)
    val loadOriginal = TypedStoreKey<Boolean>(LOAD_ORIGINAL)
    val dynamicLayout = TypedStoreKey<Boolean>(DYNAMIC_LAYOUT)
    val backgroundBackupTotalProgress = TypedStoreKey<Boolean>(BACKGROUND_BACKUP_TOTAL_PROGRESS)
    val backgroundBackupSingleProgress = TypedStoreKey<Boolean>(BACKGROUND_BACKUP_SINGLE_PROGRESS)
    val storageIndicator = TypedStoreKey<Boolean>(STORAGE_INDICATOR)
    val advancedTroubleshooting = TypedStoreKey<Boolean>(ADVANCED_TROUBLESHOOTING)
    val preferRemoteImage = TypedStoreKey<Boolean>(PREFER_REMOTE_IMAGE)
    val loopVideo = TypedStoreKey<Boolean>(LOOP_VIDEO)
    val mapShowFavoriteOnly = TypedStoreKey<Boolean>(MAP_SHOW_FAVORITE_ONLY)
    val selfSignedCert = TypedStoreKey<Boolean>(SELF_SIGNED_CERT)
    val mapIncludeArchived = TypedStoreKey<Boolean>(MAP_INCLUDE_ARCHIVED)
    val ignoreIcloudAssets = TypedStoreKey<Boolean>(IGNORE_ICLOUD_ASSETS)
    val selectedAlbumSortReverse = TypedStoreKey<Boolean>(SELECTED_ALBUM_SORT_REVERSE)
    val mapwithPartners = TypedStoreKey<Boolean>(MAP_WITH_PARTNERS)
    val enableHapticFeedback = TypedStoreKey<Boolean>(ENABLE_HAPTIC_FEEDBACK)
    val dynamicTheme = TypedStoreKey<Boolean>(DYNAMIC_THEME)
    val colorfulInterface = TypedStoreKey<Boolean>(COLORFUL_INTERFACE)
    val syncAlbums = TypedStoreKey<Boolean>(SYNC_ALBUMS)
    val autoEndpointSwitching = TypedStoreKey<Boolean>(AUTO_ENDPOINT_SWITCHING)
    val loadOriginalVideo = TypedStoreKey<Boolean>(LOAD_ORIGINAL_VIDEO)
    val manageLocalMediaAndroid = TypedStoreKey<Boolean>(MANAGE_LOCAL_MEDIA_ANDROID)
    val readonlyModeEnabled = TypedStoreKey<Boolean>(READONLY_MODE_ENABLED)
    val autoPlayVideo = TypedStoreKey<Boolean>(AUTO_PLAY_VIDEO)
    val photoManagerCustomFilter = TypedStoreKey<Boolean>(PHOTO_MANAGER_CUSTOM_FILTER)
    val betaPromptShown = TypedStoreKey<Boolean>(BETA_PROMPT_SHOWN)
    val betaTimeline = TypedStoreKey<Boolean>(BETA_TIMELINE)
    val enableBackup = TypedStoreKey<Boolean>(ENABLE_BACKUP)
    val useWifiForUploadVideos = TypedStoreKey<Boolean>(USE_WIFI_FOR_UPLOAD_VIDEOS)
    val useWifiForUploadPhotos = TypedStoreKey<Boolean>(USE_WIFI_FOR_UPLOAD_PHOTOS)
    val needBetaMigration = TypedStoreKey<Boolean>(NEED_BETA_MIGRATION)
    val shouldResetSync = TypedStoreKey<Boolean>(SHOULD_RESET_SYNC)
  }
}

enum class TaskStatus {
  DOWNLOAD_PENDING,
  DOWNLOAD_QUEUED,
  DOWNLOAD_FAILED,
  UPLOAD_PENDING,
  UPLOAD_QUEUED,
  UPLOAD_FAILED,
  UPLOAD_COMPLETE
}

enum class BackupSelection {
  SELECTED,
  NONE,
  EXCLUDED
}

enum class AvatarColor {
  PRIMARY,
  PINK,
  RED,
  YELLOW,
  BLUE,
  GREEN,
  PURPLE,
  ORANGE,
  GRAY,
  AMBER
}

enum class AlbumUserRole {
  EDITOR,
  VIEWER
}

enum class MemoryType {
  ON_THIS_DAY
}

enum class AssetVisibility {
  TIMELINE,
  HIDDEN,
  ARCHIVE,
  LOCKED
}

enum class SourceType(val value: String) {
  MACHINE_LEARNING("machine-learning"),
  EXIF("exif"),
  MANUAL("manual");

  companion object {
    fun fromString(value: String): SourceType? = entries.find { it.value == value }
  }
}

enum class UploadMethod {
  MULTIPART,
  RESUMABLE
}

enum class UploadErrorCode {
  UNKNOWN,
  ASSET_NOT_FOUND,
  FILE_NOT_FOUND,
  RESOURCE_NOT_FOUND,
  INVALID_RESOURCE,
  ENCODING_FAILED,
  WRITE_FAILED,
  NOT_ENOUGH_SPACE,
  NETWORK_ERROR,
  PHOTOS_INTERNAL_ERROR,
  PHOTOS_UNKNOWN_ERROR,
  NO_SERVER_URL,
  NO_DEVICE_ID,
  NO_ACCESS_TOKEN,
  INTERRUPTED,
  CANCELLED,
  DOWNLOAD_STALLED,
  FORCE_QUIT,
  OUT_OF_RESOURCES,
  BACKGROUND_UPDATES_DISABLED,
  UPLOAD_TIMEOUT,
  ICLOUD_RATE_LIMIT,
  ICLOUD_THROTTLED,
  INVALID_SERVER_RESPONSE,
}

enum class AssetType {
  OTHER,
  IMAGE,
  VIDEO,
  AUDIO
}

enum class EndpointStatus(val value: String) {
  LOADING("loading"),
  VALID("valid"),
  ERROR("error"),
  UNKNOWN("unknown");

  companion object {
    fun fromString(value: String): EndpointStatus? = entries.find { it.value == value }
  }
}

// Endpoint data class
data class Endpoint(
  val url: String,
  val status: EndpointStatus
)
