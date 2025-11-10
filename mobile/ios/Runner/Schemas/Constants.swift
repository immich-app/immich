import SQLiteData

extension Notification.Name {
  static let networkDidConnect = Notification.Name("networkDidConnect")
}

enum TaskConfig {
  static let maxActiveDownloads = 3
  static let maxPendingDownloads = 50
  static let maxPendingUploads = 50
  static let maxRetries = 10
  static let sessionId = "app.mertalev.immich.upload"
  static let downloadCheckIntervalNs: UInt64 = 30_000_000_000  // 30 seconds
  static let downloadTimeoutS = TimeInterval(60)
  static let transferSpeedAlpha = 0.4
  static let originalsDir = FileManager.default.temporaryDirectory.appendingPathComponent(
    "originals",
    isDirectory: true
  )
}

enum StoreKey: Int, CaseIterable, QueryBindable {
  // MARK: - Int
  case _version = 0
  static let version = Typed<Int>(rawValue: ._version)
  case _deviceIdHash = 3
  static let deviceIdHash = Typed<Int>(rawValue: ._deviceIdHash)
  case _backupTriggerDelay = 8
  static let backupTriggerDelay = Typed<Int>(rawValue: ._backupTriggerDelay)
  case _tilesPerRow = 103
  static let tilesPerRow = Typed<Int>(rawValue: ._tilesPerRow)
  case _groupAssetsBy = 105
  static let groupAssetsBy = Typed<Int>(rawValue: ._groupAssetsBy)
  case _uploadErrorNotificationGracePeriod = 106
  static let uploadErrorNotificationGracePeriod = Typed<Int>(rawValue: ._uploadErrorNotificationGracePeriod)
  case _thumbnailCacheSize = 110
  static let thumbnailCacheSize = Typed<Int>(rawValue: ._thumbnailCacheSize)
  case _imageCacheSize = 111
  static let imageCacheSize = Typed<Int>(rawValue: ._imageCacheSize)
  case _albumThumbnailCacheSize = 112
  static let albumThumbnailCacheSize = Typed<Int>(rawValue: ._albumThumbnailCacheSize)
  case _selectedAlbumSortOrder = 113
  static let selectedAlbumSortOrder = Typed<Int>(rawValue: ._selectedAlbumSortOrder)
  case _logLevel = 115
  static let logLevel = Typed<Int>(rawValue: ._logLevel)
  case _mapRelativeDate = 119
  static let mapRelativeDate = Typed<Int>(rawValue: ._mapRelativeDate)
  case _mapThemeMode = 124
  static let mapThemeMode = Typed<Int>(rawValue: ._mapThemeMode)

  // MARK: - String
  case _assetETag = 1
  static let assetETag = Typed<String>(rawValue: ._assetETag)
  case _currentUser = 2
  static let currentUser = Typed<String>(rawValue: ._currentUser)
  case _deviceId = 4
  static let deviceId = Typed<String>(rawValue: ._deviceId)
  case _accessToken = 11
  static let accessToken = Typed<String>(rawValue: ._accessToken)
  case _sslClientCertData = 15
  static let sslClientCertData = Typed<String>(rawValue: ._sslClientCertData)
  case _sslClientPasswd = 16
  static let sslClientPasswd = Typed<String>(rawValue: ._sslClientPasswd)
  case _themeMode = 102
  static let themeMode = Typed<String>(rawValue: ._themeMode)
  case _customHeaders = 127
  static let customHeaders = Typed<[String: String]>(rawValue: ._customHeaders)
  case _primaryColor = 128
  static let primaryColor = Typed<String>(rawValue: ._primaryColor)
  case _preferredWifiName = 133
  static let preferredWifiName = Typed<String>(rawValue: ._preferredWifiName)

  // MARK: - Endpoint
  case _externalEndpointList = 135
  static let externalEndpointList = Typed<[Endpoint]>(rawValue: ._externalEndpointList)

  // MARK: - URL
  case _serverUrl = 10
  static let serverUrl = Typed<URL>(rawValue: ._serverUrl)
  case _serverEndpoint = 12
  static let serverEndpoint = Typed<URL>(rawValue: ._serverEndpoint)
  case _localEndpoint = 134
  static let localEndpoint = Typed<URL>(rawValue: ._localEndpoint)

  // MARK: - Date
  case _backupFailedSince = 5
  static let backupFailedSince = Typed<Date>(rawValue: ._backupFailedSince)

  // MARK: - Bool
  case _backupRequireWifi = 6
  static let backupRequireWifi = Typed<Bool>(rawValue: ._backupRequireWifi)
  case _backupRequireCharging = 7
  static let backupRequireCharging = Typed<Bool>(rawValue: ._backupRequireCharging)
  case _autoBackup = 13
  static let autoBackup = Typed<Bool>(rawValue: ._autoBackup)
  case _backgroundBackup = 14
  static let backgroundBackup = Typed<Bool>(rawValue: ._backgroundBackup)
  case _loadPreview = 100
  static let loadPreview = Typed<Bool>(rawValue: ._loadPreview)
  case _loadOriginal = 101
  static let loadOriginal = Typed<Bool>(rawValue: ._loadOriginal)
  case _dynamicLayout = 104
  static let dynamicLayout = Typed<Bool>(rawValue: ._dynamicLayout)
  case _backgroundBackupTotalProgress = 107
  static let backgroundBackupTotalProgress = Typed<Bool>(rawValue: ._backgroundBackupTotalProgress)
  case _backgroundBackupSingleProgress = 108
  static let backgroundBackupSingleProgress = Typed<Bool>(rawValue: ._backgroundBackupSingleProgress)
  case _storageIndicator = 109
  static let storageIndicator = Typed<Bool>(rawValue: ._storageIndicator)
  case _advancedTroubleshooting = 114
  static let advancedTroubleshooting = Typed<Bool>(rawValue: ._advancedTroubleshooting)
  case _preferRemoteImage = 116
  static let preferRemoteImage = Typed<Bool>(rawValue: ._preferRemoteImage)
  case _loopVideo = 117
  static let loopVideo = Typed<Bool>(rawValue: ._loopVideo)
  case _mapShowFavoriteOnly = 118
  static let mapShowFavoriteOnly = Typed<Bool>(rawValue: ._mapShowFavoriteOnly)
  case _selfSignedCert = 120
  static let selfSignedCert = Typed<Bool>(rawValue: ._selfSignedCert)
  case _mapIncludeArchived = 121
  static let mapIncludeArchived = Typed<Bool>(rawValue: ._mapIncludeArchived)
  case _ignoreIcloudAssets = 122
  static let ignoreIcloudAssets = Typed<Bool>(rawValue: ._ignoreIcloudAssets)
  case _selectedAlbumSortReverse = 123
  static let selectedAlbumSortReverse = Typed<Bool>(rawValue: ._selectedAlbumSortReverse)
  case _mapwithPartners = 125
  static let mapwithPartners = Typed<Bool>(rawValue: ._mapwithPartners)
  case _enableHapticFeedback = 126
  static let enableHapticFeedback = Typed<Bool>(rawValue: ._enableHapticFeedback)
  case _dynamicTheme = 129
  static let dynamicTheme = Typed<Bool>(rawValue: ._dynamicTheme)
  case _colorfulInterface = 130
  static let colorfulInterface = Typed<Bool>(rawValue: ._colorfulInterface)
  case _syncAlbums = 131
  static let syncAlbums = Typed<Bool>(rawValue: ._syncAlbums)
  case _autoEndpointSwitching = 132
  static let autoEndpointSwitching = Typed<Bool>(rawValue: ._autoEndpointSwitching)
  case _loadOriginalVideo = 136
  static let loadOriginalVideo = Typed<Bool>(rawValue: ._loadOriginalVideo)
  case _manageLocalMediaAndroid = 137
  static let manageLocalMediaAndroid = Typed<Bool>(rawValue: ._manageLocalMediaAndroid)
  case _readonlyModeEnabled = 138
  static let readonlyModeEnabled = Typed<Bool>(rawValue: ._readonlyModeEnabled)
  case _autoPlayVideo = 139
  static let autoPlayVideo = Typed<Bool>(rawValue: ._autoPlayVideo)
  case _photoManagerCustomFilter = 1000
  static let photoManagerCustomFilter = Typed<Bool>(rawValue: ._photoManagerCustomFilter)
  case _betaPromptShown = 1001
  static let betaPromptShown = Typed<Bool>(rawValue: ._betaPromptShown)
  case _betaTimeline = 1002
  static let betaTimeline = Typed<Bool>(rawValue: ._betaTimeline)
  case _enableBackup = 1003
  static let enableBackup = Typed<Bool>(rawValue: ._enableBackup)
  case _useWifiForUploadVideos = 1004
  static let useWifiForUploadVideos = Typed<Bool>(rawValue: ._useWifiForUploadVideos)
  case _useWifiForUploadPhotos = 1005
  static let useWifiForUploadPhotos = Typed<Bool>(rawValue: ._useWifiForUploadPhotos)
  case _needBetaMigration = 1006
  static let needBetaMigration = Typed<Bool>(rawValue: ._needBetaMigration)
  case _shouldResetSync = 1007
  static let shouldResetSync = Typed<Bool>(rawValue: ._shouldResetSync)

  struct Typed<T>: RawRepresentable {
    let rawValue: StoreKey

    @_transparent
    init(rawValue value: StoreKey) {
      self.rawValue = value
    }
  }
}

enum UploadHeaders: String {
  case reprDigest = "Repr-Digest"
  case userToken = "X-Immich-User-Token"
  case assetData = "X-Immich-Asset-Data"
}

enum TaskStatus: Int, QueryBindable {
  case downloadPending, downloadQueued, downloadFailed, uploadPending, uploadQueued, uploadFailed, uploadComplete,
    uploadSkipped
}

enum BackupSelection: Int, QueryBindable {
  case selected, none, excluded
}

enum AvatarColor: Int, QueryBindable {
  case primary, pink, red, yellow, blue, green, purple, orange, gray, amber
}

enum AlbumUserRole: Int, QueryBindable {
  case editor, viewer
}

enum MemoryType: Int, QueryBindable {
  case onThisDay
}

enum AssetVisibility: Int, QueryBindable {
  case timeline, hidden, archive, locked
}

enum SourceType: String, QueryBindable {
  case machineLearning = "machine-learning"
  case exif, manual
}

enum UploadMethod: Int, QueryBindable {
  case multipart, resumable
}

enum UploadError: Error {
  case fileCreationFailed
  case iCloudError(UploadErrorCode)
  case photosError(UploadErrorCode)
}

enum UploadErrorCode: Int, QueryBindable {
  case unknown
  case assetNotFound
  case fileNotFound
  case resourceNotFound
  case invalidResource
  case encodingFailed
  case writeFailed
  case notEnoughSpace
  case networkError
  case photosInternalError
  case photosUnknownError
  case noServerUrl
  case noDeviceId
  case noAccessToken
  case interrupted
  case cancelled
  case downloadStalled
  case forceQuit
  case outOfResources
  case backgroundUpdatesDisabled
  case uploadTimeout
  case iCloudRateLimit
  case iCloudThrottled
  case invalidResponse
  case badRequest
  case internalServerError
}

enum AssetType: Int, QueryBindable {
  case other, image, video, audio
}

enum AssetMediaStatus: String, Codable {
  case created, replaced, duplicate
}

struct Endpoint: Codable {
  let url: URL
  let status: Status

  enum Status: String, Codable {
    case loading, valid, error, unknown
  }
}

struct UploadSuccessResponse: Codable {
  let status: AssetMediaStatus
  let id: String
}

struct UploadErrorResponse: Codable {
  let message: String
}
