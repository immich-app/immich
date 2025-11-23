package app.alextran.immich.schema

import androidx.room.*
import java.net.URL
import java.util.Date

@Entity(tableName = "asset_face_entity")
data class AssetFace(
  @PrimaryKey
  val id: String,
  @ColumnInfo(name = "asset_id")
  val assetId: String,
  @ColumnInfo(name = "person_id")
  val personId: String?,
  @ColumnInfo(name = "image_width")
  val imageWidth: Int,
  @ColumnInfo(name = "image_height")
  val imageHeight: Int,
  @ColumnInfo(name = "bounding_box_x1")
  val boundingBoxX1: Int,
  @ColumnInfo(name = "bounding_box_y1")
  val boundingBoxY1: Int,
  @ColumnInfo(name = "bounding_box_x2")
  val boundingBoxX2: Int,
  @ColumnInfo(name = "bounding_box_y2")
  val boundingBoxY2: Int,
  @ColumnInfo(name = "source_type")
  val sourceType: SourceType
)

@Entity(tableName = "auth_user_entity")
data class AuthUser(
  @PrimaryKey
  val id: String,
  val name: String,
  val email: String,
  @ColumnInfo(name = "is_admin")
  val isAdmin: Boolean,
  @ColumnInfo(name = "has_profile_image")
  val hasProfileImage: Boolean,
  @ColumnInfo(name = "profile_changed_at")
  val profileChangedAt: Date,
  @ColumnInfo(name = "avatar_color")
  val avatarColor: AvatarColor,
  @ColumnInfo(name = "quota_size_in_bytes")
  val quotaSizeInBytes: Int,
  @ColumnInfo(name = "quota_usage_in_bytes")
  val quotaUsageInBytes: Int,
  @ColumnInfo(name = "pin_code")
  val pinCode: String?
)

@Entity(tableName = "local_album_entity")
data class LocalAlbum(
  @PrimaryKey
  val id: String,
  @ColumnInfo(name = "backup_selection")
  val backupSelection: BackupSelection,
  @ColumnInfo(name = "linked_remote_album_id")
  val linkedRemoteAlbumId: String?,
  @ColumnInfo(name = "marker")
  val marker: Boolean?,
  val name: String,
  @ColumnInfo(name = "is_ios_shared_album")
  val isIosSharedAlbum: Boolean,
  @ColumnInfo(name = "updated_at")
  val updatedAt: Date
)

@Entity(
  tableName = "local_album_asset_entity",
  primaryKeys = ["asset_id", "album_id"]
)
data class LocalAlbumAsset(
  @ColumnInfo(name = "asset_id")
  val assetId: String,
  @ColumnInfo(name = "album_id")
  val albumId: String,
  @ColumnInfo(name = "marker")
  val marker: String?
)

@Entity(tableName = "local_asset_entity")
data class LocalAsset(
  @PrimaryKey
  val id: String,
  val checksum: String?,
  @ColumnInfo(name = "created_at")
  val createdAt: Date,
  @ColumnInfo(name = "duration_in_seconds")
  val durationInSeconds: Int?,
  val height: Int?,
  @ColumnInfo(name = "is_favorite")
  val isFavorite: Boolean,
  val name: String,
  val orientation: String,
  val type: AssetType,
  @ColumnInfo(name = "updated_at")
  val updatedAt: Date,
  val width: Int?
)

data class BackupCandidate(
  val id: String,
  val type: AssetType
)

@Entity(
  tableName = "memory_asset_entity",
  primaryKeys = ["asset_id", "album_id"]
)
data class MemoryAsset(
  @ColumnInfo(name = "asset_id")
  val assetId: String,
  @ColumnInfo(name = "album_id")
  val albumId: String
)

@Entity(tableName = "memory_entity")
data class Memory(
  @PrimaryKey
  val id: String,
  @ColumnInfo(name = "created_at")
  val createdAt: Date,
  @ColumnInfo(name = "updated_at")
  val updatedAt: Date,
  @ColumnInfo(name = "deleted_at")
  val deletedAt: Date?,
  @ColumnInfo(name = "owner_id")
  val ownerId: String,
  val type: MemoryType,
  val data: String,
  @ColumnInfo(name = "is_saved")
  val isSaved: Boolean,
  @ColumnInfo(name = "memory_at")
  val memoryAt: Date,
  @ColumnInfo(name = "seen_at")
  val seenAt: Date?,
  @ColumnInfo(name = "show_at")
  val showAt: Date?,
  @ColumnInfo(name = "hide_at")
  val hideAt: Date?
)

@Entity(
  tableName = "partner_entity",
  primaryKeys = ["shared_by_id", "shared_with_id"]
)
data class Partner(
  @ColumnInfo(name = "shared_by_id")
  val sharedById: String,
  @ColumnInfo(name = "shared_with_id")
  val sharedWithId: String,
  @ColumnInfo(name = "in_timeline")
  val inTimeline: Boolean
)

@Entity(tableName = "person_entity")
data class Person(
  @PrimaryKey
  val id: String,
  @ColumnInfo(name = "created_at")
  val createdAt: Date,
  @ColumnInfo(name = "updated_at")
  val updatedAt: Date,
  @ColumnInfo(name = "owner_id")
  val ownerId: String,
  val name: String,
  @ColumnInfo(name = "face_asset_id")
  val faceAssetId: String?,
  @ColumnInfo(name = "is_favorite")
  val isFavorite: Boolean,
  @ColumnInfo(name = "is_hidden")
  val isHidden: Boolean,
  val color: String?,
  @ColumnInfo(name = "birth_date")
  val birthDate: Date?
)

@Entity(tableName = "remote_album_entity")
data class RemoteAlbum(
  @PrimaryKey
  val id: String,
  @ColumnInfo(name = "created_at")
  val createdAt: Date,
  val description: String?,
  @ColumnInfo(name = "is_activity_enabled")
  val isActivityEnabled: Boolean,
  val name: String,
  val order: Int,
  @ColumnInfo(name = "owner_id")
  val ownerId: String,
  @ColumnInfo(name = "thumbnail_asset_id")
  val thumbnailAssetId: String?,
  @ColumnInfo(name = "updated_at")
  val updatedAt: Date
)

@Entity(
  tableName = "remote_album_asset_entity",
  primaryKeys = ["asset_id", "album_id"]
)
data class RemoteAlbumAsset(
  @ColumnInfo(name = "asset_id")
  val assetId: String,
  @ColumnInfo(name = "album_id")
  val albumId: String
)

@Entity(
  tableName = "remote_album_user_entity",
  primaryKeys = ["album_id", "user_id"]
)
data class RemoteAlbumUser(
  @ColumnInfo(name = "album_id")
  val albumId: String,
  @ColumnInfo(name = "user_id")
  val userId: String,
  val role: AlbumUserRole
)

@Entity(tableName = "remote_asset_entity")
data class RemoteAsset(
  @PrimaryKey
  val id: String,
  val checksum: String,
  @ColumnInfo(name = "is_favorite")
  val isFavorite: Boolean,
  @ColumnInfo(name = "deleted_at")
  val deletedAt: Date?,
  @ColumnInfo(name = "owner_id")
  val ownerId: String,
  @ColumnInfo(name = "local_date_time")
  val localDateTime: Date?,
  @ColumnInfo(name = "thumb_hash")
  val thumbHash: String?,
  @ColumnInfo(name = "library_id")
  val libraryId: String?,
  @ColumnInfo(name = "live_photo_video_id")
  val livePhotoVideoId: String?,
  @ColumnInfo(name = "stack_id")
  val stackId: String?,
  val visibility: AssetVisibility
)

@Entity(tableName = "remote_exif_entity")
data class RemoteExif(
  @PrimaryKey
  @ColumnInfo(name = "asset_id")
  val assetId: String,
  val city: String?,
  val state: String?,
  val country: String?,
  @ColumnInfo(name = "date_time_original")
  val dateTimeOriginal: Date?,
  val description: String?,
  val height: Int?,
  val width: Int?,
  @ColumnInfo(name = "exposure_time")
  val exposureTime: String?,
  @ColumnInfo(name = "f_number")
  val fNumber: Double?,
  @ColumnInfo(name = "file_size")
  val fileSize: Int?,
  @ColumnInfo(name = "focal_length")
  val focalLength: Double?,
  val latitude: Double?,
  val longitude: Double?,
  val iso: Int?,
  val make: String?,
  val model: String?,
  val lens: String?,
  val orientation: String?,
  @ColumnInfo(name = "time_zone")
  val timeZone: String?,
  val rating: Int?,
  @ColumnInfo(name = "projection_type")
  val projectionType: String?
)

@Entity(tableName = "stack_entity")
data class Stack(
  @PrimaryKey
  val id: String,
  @ColumnInfo(name = "created_at")
  val createdAt: Date,
  @ColumnInfo(name = "updated_at")
  val updatedAt: Date,
  @ColumnInfo(name = "owner_id")
  val ownerId: String,
  @ColumnInfo(name = "primary_asset_id")
  val primaryAssetId: String
)

@Entity(tableName = "store_entity")
data class Store(
  @PrimaryKey
  val id: StoreKey,
  @ColumnInfo(name = "string_value")
  val stringValue: String?,
  @ColumnInfo(name = "int_value")
  val intValue: Int?
)

@Entity(tableName = "upload_task_entity")
data class UploadTask(
  @PrimaryKey(autoGenerate = true)
  val id: Long = 0,
  val attempts: Int,
  @ColumnInfo(name = "created_at")
  val createdAt: Date,
  @ColumnInfo(name = "file_path")
  val filePath: URL?,
  @ColumnInfo(name = "is_live_photo")
  val isLivePhoto: Boolean?,
  @ColumnInfo(name = "last_error")
  val lastError: UploadErrorCode?,
  @ColumnInfo(name = "live_photo_video_id")
  val livePhotoVideoId: String?,
  @ColumnInfo(name = "local_id")
  val localId: String,
  val method: UploadMethod,
  val priority: Float,
  @ColumnInfo(name = "retry_after")
  val retryAfter: Date?,
  val status: TaskStatus
)

// Data class for query results
data class LocalAssetTaskData(
  val attempts: Int,
  val checksum: String,
  val createdAt: Date,
  val fileName: String,
  val filePath: URL?,
  val isFavorite: Boolean,
  val localId: String,
  val priority: Float,
  val taskId: Long,
  val type: AssetType,
  val updatedAt: Date
)

@Entity(tableName = "upload_task_stats")
data class UploadTaskStat(
  @ColumnInfo(name = "pending_downloads")
  val pendingDownloads: Int,
  @ColumnInfo(name = "pending_uploads")
  val pendingUploads: Int,
  @ColumnInfo(name = "queued_downloads")
  val queuedDownloads: Int,
  @ColumnInfo(name = "queued_uploads")
  val queuedUploads: Int,
  @ColumnInfo(name = "failed_downloads")
  val failedDownloads: Int,
  @ColumnInfo(name = "failed_uploads")
  val failedUploads: Int,
  @ColumnInfo(name = "completed_uploads")
  val completedUploads: Int
)

@Entity(tableName = "user_entity")
data class User(
  @PrimaryKey
  val id: String,
  val name: String,
  val email: String,
  @ColumnInfo(name = "has_profile_image")
  val hasProfileImage: Boolean,
  @ColumnInfo(name = "profile_changed_at")
  val profileChangedAt: Date,
  @ColumnInfo(name = "avatar_color")
  val avatarColor: AvatarColor
)

@Entity(
  tableName = "user_metadata_entity",
  primaryKeys = ["user_id", "key"]
)
data class UserMetadata(
  @ColumnInfo(name = "user_id")
  val userId: String,
  val key: Date,
  val value: ByteArray
) {
  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (javaClass != other?.javaClass) return false

    other as UserMetadata

    if (userId != other.userId) return false
    if (key != other.key) return false
    if (!value.contentEquals(other.value)) return false

    return true
  }

  override fun hashCode(): Int {
    var result = userId.hashCode()
    result = 31 * result + key.hashCode()
    result = 31 * result + value.contentHashCode()
    return result
  }
}
