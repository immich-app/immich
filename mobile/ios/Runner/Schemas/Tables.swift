import SQLiteData

extension QueryExpression where QueryValue: _OptionalProtocol {
  // asserts column result cannot be nil
  var unwrapped: SQLQueryExpression<QueryValue.Wrapped> {
    SQLQueryExpression(self.queryFragment, as: QueryValue.Wrapped.self)
  }
}

extension Date {
  var unixTime: Date.UnixTimeRepresentation {
    return Date.UnixTimeRepresentation(queryOutput: self)
  }
}

@Table("asset_face_entity")
struct AssetFace: Identifiable {
  let id: String
  @Column("asset_id")
  let assetId: RemoteAsset.ID
  @Column("person_id")
  let personId: Person.ID?
  @Column("image_width")
  let imageWidth: Int
  @Column("image_height")
  let imageHeight: Int
  @Column("bounding_box_x1")
  let boundingBoxX1: Int
  @Column("bounding_box_y1")
  let boundingBoxY1: Int
  @Column("bounding_box_x2")
  let boundingBoxX2: Int
  @Column("bounding_box_y2")
  let boundingBoxY2: Int
  @Column("source_type")
  let sourceType: SourceType
}

@Table("auth_user_entity")
struct AuthUser: Identifiable {
  let id: String
  let name: String
  let email: String
  @Column("is_admin")
  let isAdmin: Bool
  @Column("has_profile_image")
  let hasProfileImage: Bool
  @Column("profile_changed_at")
  let profileChangedAt: Date
  @Column("avatar_color")
  let avatarColor: AvatarColor
  @Column("quota_size_in_bytes")
  let quotaSizeInBytes: Int
  @Column("quota_usage_in_bytes")
  let quotaUsageInBytes: Int
  @Column("pin_code")
  let pinCode: String?
}

@Table("local_album_entity")
struct LocalAlbum: Identifiable {
  let id: String
  @Column("backup_selection")
  let backupSelection: BackupSelection
  @Column("linked_remote_album_id")
  let linkedRemoteAlbumId: RemoteAlbum.ID?
  @Column("marker")
  let marker_: Bool?
  let name: String
  @Column("is_ios_shared_album")
  let isIosSharedAlbum: Bool
  @Column("updated_at")
  let updatedAt: Date
}

@Table("local_album_asset_entity")
struct LocalAlbumAsset {
  let id: ID
  @Column("marker")
  let marker_: String?

  @Selection
  struct ID {
    @Column("asset_id")
    let assetId: String
    @Column("album_id")
    let albumId: String
  }
}

@Table("local_asset_entity")
struct LocalAsset: Identifiable {
  let id: String
  let checksum: String?
  @Column("created_at")
  let createdAt: String
  @Column("duration_in_seconds")
  let durationInSeconds: Int?
  let height: Int?
  @Column("is_favorite")
  let isFavorite: Bool
  let name: String
  let orientation: String
  let type: AssetType
  @Column("updated_at")
  let updatedAt: String
  let width: Int?
}

@Selection
struct LocalAssetCandidate {
  let id: LocalAsset.ID
  let type: AssetType
}

@Selection
struct LocalAssetDownloadData {
  let checksum: String?
  let createdAt: String
  let filename: String
  let livePhotoVideoId: RemoteAsset.ID?
  let localId: LocalAsset.ID
  let taskId: UploadTask.ID
  let updatedAt: String
}

@Selection
struct LocalAssetUploadData {
  let filename: String
  let filePath: URL
  let priority: Float
  let taskId: UploadTask.ID
  let type: AssetType
}

@Table("memory_asset_entity")
struct MemoryAsset {
  let id: ID

  @Selection
  struct ID {
    @Column("asset_id")
    let assetId: String
    @Column("album_id")
    let albumId: String
  }
}

@Table("memory_entity")
struct Memory: Identifiable {
  let id: String
  @Column("created_at")
  let createdAt: Date
  @Column("updated_at")
  let updatedAt: Date
  @Column("deleted_at")
  let deletedAt: Date?
  @Column("owner_id")
  let ownerId: User.ID
  let type: MemoryType
  let data: String
  @Column("is_saved")
  let isSaved: Bool
  @Column("memory_at")
  let memoryAt: Date
  @Column("seen_at")
  let seenAt: Date?
  @Column("show_at")
  let showAt: Date?
  @Column("hide_at")
  let hideAt: Date?
}

@Table("partner_entity")
struct Partner {
  let id: ID
  @Column("in_timeline")
  let inTimeline: Bool

  @Selection
  struct ID {
    @Column("shared_by_id")
    let sharedById: String
    @Column("shared_with_id")
    let sharedWithId: String
  }
}

@Table("person_entity")
struct Person: Identifiable {
  let id: String
  @Column("created_at")
  let createdAt: Date
  @Column("updated_at")
  let updatedAt: Date
  @Column("owner_id")
  let ownerId: String
  let name: String
  @Column("face_asset_id")
  let faceAssetId: AssetFace.ID?
  @Column("is_favorite")
  let isFavorite: Bool
  @Column("is_hidden")
  let isHidden: Bool
  let color: String?
  @Column("birth_date")
  let birthDate: Date?
}

@Table("remote_album_entity")
struct RemoteAlbum: Identifiable {
  let id: String
  @Column("created_at")
  let createdAt: Date
  let description: String?
  @Column("is_activity_enabled")
  let isActivityEnabled: Bool
  let name: String
  let order: Int
  @Column("owner_id")
  let ownerId: String
  @Column("thumbnail_asset_id")
  let thumbnailAssetId: RemoteAsset.ID?
  @Column("updated_at")
  let updatedAt: Date
}

@Table("remote_album_asset_entity")
struct RemoteAlbumAsset {
  let id: ID

  @Selection
  struct ID {
    @Column("asset_id")
    let assetId: String
    @Column("album_id")
    let albumId: String
  }
}

@Table("remote_album_user_entity")
struct RemoteAlbumUser {
  let id: ID
  let role: AlbumUserRole

  @Selection
  struct ID {
    @Column("album_id")
    let albumId: String
    @Column("user_id")
    let userId: String
  }
}

@Table("remote_asset_entity")
struct RemoteAsset: Identifiable {
  let id: String
  let checksum: String
  @Column("is_favorite")
  let isFavorite: Bool
  @Column("deleted_at")
  let deletedAt: Date?
  @Column("owner_id")
  let ownerId: User.ID
  @Column("local_date_time")
  let localDateTime: Date?
  @Column("thumb_hash")
  let thumbHash: String?
  @Column("library_id")
  let libraryId: String?
  @Column("live_photo_video_id")
  let livePhotoVideoId: String?
  @Column("stack_id")
  let stackId: Stack.ID?
  let visibility: AssetVisibility
}

@Table("remote_exif_entity")
struct RemoteExif {
  @Column("asset_id", primaryKey: true)
  let assetId: RemoteAsset.ID
  let city: String?
  let state: String?
  let country: String?
  @Column("date_time_original")
  let dateTimeOriginal: Date?
  let description: String?
  let height: Int?
  let width: Int?
  @Column("exposure_time")
  let exposureTime: String?
  @Column("f_number")
  let fNumber: Double?
  @Column("file_size")
  let fileSize: Int?
  @Column("focal_length")
  let focalLength: Double?
  let latitude: Double?
  let longitude: Double?
  let iso: Int?
  let make: String?
  let model: String?
  let lens: String?
  let orientation: String?
  @Column("time_zone")
  let timeZone: String?
  let rating: Int?
  @Column("projection_type")
  let projectionType: String?
}

@Table("stack_entity")
struct Stack: Identifiable {
  let id: String
  @Column("created_at")
  let createdAt: Date
  @Column("updated_at")
  let updatedAt: Date
  @Column("owner_id")
  let ownerId: User.ID
  @Column("primary_asset_id")
  let primaryAssetId: String
}

@Table("store_entity")
struct Store: Identifiable {
  let id: StoreKey
  @Column("string_value")
  let stringValue: String?
  @Column("int_value")
  let intValue: Int?
}

@Table("upload_tasks")
struct UploadTask: Identifiable {
  let id: Int64
  let attempts: Int
  @Column("created_at", as: Date.UnixTimeRepresentation.self)
  let createdAt: Date
  @Column("file_path")
  var filePath: URL?
  @Column("is_live_photo")
  let isLivePhoto: Bool?
  @Column("last_error")
  let lastError: UploadErrorCode?
  @Column("live_photo_video_id")
  let livePhotoVideoId: RemoteAsset.ID?
  @Column("local_id")
  var localId: LocalAsset.ID?
  let method: UploadMethod
  var priority: Float
  @Column("retry_after", as: Date?.UnixTimeRepresentation.self)
  let retryAfter: Date?
  var status: TaskStatus
}

@Table("upload_task_stats")
struct UploadTaskStat {
  @Column("pending_downloads")
  let pendingDownloads: Int
  @Column("pending_uploads")
  let pendingUploads: Int
  @Column("queued_downloads")
  let queuedDownloads: Int
  @Column("queued_uploads")
  let queuedUploads: Int
  @Column("failed_downloads")
  let failedDownloads: Int
  @Column("failed_uploads")
  let failedUploads: Int
  @Column("completed_uploads")
  let completedUploads: Int
  @Column("skipped_uploads")
  let skippedUploads: Int

  static let availableDownloadSlots = Self.select {
    TaskConfig.maxPendingDownloads - ($0.pendingDownloads + $0.queuedDownloads)
  }

  static let availableUploadSlots = Self.select {
    TaskConfig.maxPendingUploads - ($0.pendingUploads + $0.queuedUploads)
  }

  static let availableSlots = Self.select {
    TaskConfig.maxPendingUploads + TaskConfig.maxPendingDownloads
      - ($0.pendingDownloads + $0.queuedDownloads + $0.pendingUploads + $0.queuedUploads)
  }
}

@Table("user_entity")
struct User: Identifiable {
  let id: String
  let name: String
  let email: String
  @Column("has_profile_image")
  let hasProfileImage: Bool
  @Column("profile_changed_at")
  let profileChangedAt: Date
  @Column("avatar_color")
  let avatarColor: AvatarColor
}

@Table("user_metadata_entity")
struct UserMetadata {
  let id: ID
  let value: Data

  @Selection
  struct ID {
    @Column("user_id")
    let userId: String
    let key: Date
  }
}
