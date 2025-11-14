import GRDB
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
  @Column("profile_changed_at", as: Date.UnixTimeRepresentation.self)
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
  @Column("updated_at", as: Date.UnixTimeRepresentation.self)
  let updatedAt: Date
}

extension LocalAlbum {
  static let selected = Self.where { $0.backupSelection.eq(BackupSelection.selected) }
  static let excluded = Self.where { $0.backupSelection.eq(BackupSelection.excluded) }
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

extension LocalAlbumAsset {
  static let selected = Self.where {
    $0.id.assetId.eq(LocalAsset.columns.id) && $0.id.albumId.in(LocalAlbum.selected.select(\.id))
  }
  static let excluded = Self.where {
    $0.id.assetId.eq(LocalAsset.columns.id) && $0.id.albumId.in(LocalAlbum.excluded.select(\.id))
  }
}

@Table("local_asset_entity")
struct LocalAsset: Identifiable {
  let id: String
  let checksum: String?
  @Column("created_at", as: Date.UnixTimeRepresentation.self)
  let createdAt: Date
  @Column("duration_in_seconds")
  let durationInSeconds: Int?
  let height: Int?
  @Column("is_favorite")
  let isFavorite: Bool
  let name: String
  let orientation: String
  let type: AssetType
  @Column("updated_at", as: Date.UnixTimeRepresentation.self)
  let updatedAt: Date
  let width: Int?

  static func getCandidates() -> Where<LocalAsset> {
    return Self.where { local in
      LocalAlbumAsset.selected.exists()
        && !LocalAlbumAsset.excluded.exists()
        && !RemoteAsset.where {
          local.checksum.eq($0.checksum)
            && $0.ownerId.eq(Store.select(\.stringValue).where { $0.id.eq(StoreKey.currentUser.rawValue) }.unwrapped)
        }.exists()
        && !UploadTask.where { $0.localId.eq(local.id) }.exists()
    }
  }
}

@Selection
struct LocalAssetTaskData {
  let attempts: Int
  let checksum: String
  @Column(as: Date.UnixTimeRepresentation.self)
  let createdAt: Date
  let fileName: String
  let filePath: URL?
  let isFavorite: Bool
  let localId: LocalAsset.ID
  let priority: Float
  let taskId: UploadTask.ID
  let type: AssetType
  @Column(as: Date.UnixTimeRepresentation.self)
  let updatedAt: Date
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
  @Column("created_at", as: Date.UnixTimeRepresentation.self)
  let createdAt: Date
  @Column("updated_at", as: Date.UnixTimeRepresentation.self)
  let updatedAt: Date
  @Column("deleted_at", as: Date?.UnixTimeRepresentation.self)
  let deletedAt: Date?
  @Column("owner_id")
  let ownerId: User.ID
  let type: MemoryType
  let data: String
  @Column("is_saved")
  let isSaved: Bool
  @Column("memory_at", as: Date.UnixTimeRepresentation.self)
  let memoryAt: Date
  @Column("seen_at", as: Date?.UnixTimeRepresentation.self)
  let seenAt: Date?
  @Column("show_at", as: Date?.UnixTimeRepresentation.self)
  let showAt: Date?
  @Column("hide_at", as: Date?.UnixTimeRepresentation.self)
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
  @Column("created_at", as: Date.UnixTimeRepresentation.self)
  let createdAt: Date
  @Column("updated_at", as: Date.UnixTimeRepresentation.self)
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
  @Column("birth_date", as: Date?.UnixTimeRepresentation.self)
  let birthDate: Date?
}

@Table("remote_album_entity")
struct RemoteAlbum: Identifiable {
  let id: String
  @Column("created_at", as: Date.UnixTimeRepresentation.self)
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
  @Column("updated_at", as: Date.UnixTimeRepresentation.self)
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
  @Column("deleted_at", as: Date?.UnixTimeRepresentation.self)
  let deletedAt: Date?
  @Column("owner_id")
  let ownerId: User.ID
  @Column("local_date_time", as: Date?.UnixTimeRepresentation.self)
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
  @Column("date_time_original", as: Date?.UnixTimeRepresentation.self)
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
  @Column("created_at", as: Date.UnixTimeRepresentation.self)
  let createdAt: Date
  @Column("updated_at", as: Date.UnixTimeRepresentation.self)
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
  let filePath: URL?
  let lastError: UploadErrorCode?
  @Column("local_id")
  var localId: LocalAsset.ID
  let method: UploadMethod
  let priority: Float
  @Column("remote_id")
  let remoteId: RemoteAsset.ID?
  @Column("retry_after", as: Date?.UnixTimeRepresentation.self)
  let retryAfter: Date?
  @Column("session_id")
  var sessionId: String?
  let status: TaskStatus

  static let assetData = Self.join(LocalAsset.all) { task, asset in task.localId.eq(asset.id) }
    .where { task, asset in asset.checksum.isNot(nil) }
    .select { task, asset in
      LocalAssetTaskData.Columns(
        attempts: task.attempts,
        checksum: asset.checksum.unwrapped,
        createdAt: asset.createdAt,
        fileName: asset.name,
        filePath: task.filePath,
        isFavorite: asset.isFavorite,
        localId: asset.id,
        priority: task.priority,
        taskId: task.id,
        type: asset.type,
        updatedAt: asset.updatedAt
      )
    }

  static func retryOrFail(code: UploadErrorCode, status: TaskStatus) -> Update<UploadTask, ()> {
    return Self.update { row in
      row.status = Case().when((row.attempts + 1).lt(TaskConfig.maxAttempts), then: TaskStatus.downloadPending)
        .else(status)
      row.attempts += 1
      row.lastError = code
      row.sessionId = nil
      row.retryAfter = #sql("unixepoch('now') + pow(3.0, \(row.attempts))")
    }
  }
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
  @Column("profile_changed_at", as: Date.UnixTimeRepresentation.self)
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
    @Column(as: Date.UnixTimeRepresentation.self)
    let key: Date
  }
}
