package app.alextran.immich.schema

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.net.URL
import java.util.Date

class Converters {
  private val gson = Gson()

  @TypeConverter
  fun fromTimestamp(value: Long?): Date? = value?.let { Date(it * 1000) }

  @TypeConverter
  fun dateToTimestamp(date: Date?): Long? = date?.let { it.time / 1000 }

  @TypeConverter
  fun fromUrl(value: String?): URL? = value?.let { URL(it) }

  @TypeConverter
  fun urlToString(url: URL?): String? = url?.toString()

  @TypeConverter
  fun fromStoreKey(value: Int?): StoreKey? = value?.let { StoreKey.fromInt(it) }

  @TypeConverter
  fun storeKeyToInt(storeKey: StoreKey?): Int? = storeKey?.rawValue

  @TypeConverter
  fun fromTaskStatus(value: Int?): TaskStatus? = value?.let { TaskStatus.entries[it] }

  @TypeConverter
  fun taskStatusToInt(status: TaskStatus?): Int? = status?.ordinal

  @TypeConverter
  fun fromBackupSelection(value: Int?): BackupSelection? = value?.let { BackupSelection.entries[it] }

  @TypeConverter
  fun backupSelectionToInt(selection: BackupSelection?): Int? = selection?.ordinal

  @TypeConverter
  fun fromAvatarColor(value: Int?): AvatarColor? = value?.let { AvatarColor.entries[it] }

  @TypeConverter
  fun avatarColorToInt(color: AvatarColor?): Int? = color?.ordinal

  @TypeConverter
  fun fromAlbumUserRole(value: Int?): AlbumUserRole? = value?.let { AlbumUserRole.entries[it] }

  @TypeConverter
  fun albumUserRoleToInt(role: AlbumUserRole?): Int? = role?.ordinal

  @TypeConverter
  fun fromMemoryType(value: Int?): MemoryType? = value?.let { MemoryType.entries[it] }

  @TypeConverter
  fun memoryTypeToInt(type: MemoryType?): Int? = type?.ordinal

  @TypeConverter
  fun fromAssetVisibility(value: Int?): AssetVisibility? = value?.let { AssetVisibility.entries[it] }

  @TypeConverter
  fun assetVisibilityToInt(visibility: AssetVisibility?): Int? = visibility?.ordinal

  @TypeConverter
  fun fromSourceType(value: String?): SourceType? = value?.let { SourceType.fromString(it) }

  @TypeConverter
  fun sourceTypeToString(type: SourceType?): String? = type?.value

  @TypeConverter
  fun fromUploadMethod(value: Int?): UploadMethod? = value?.let { UploadMethod.entries[it] }

  @TypeConverter
  fun uploadMethodToInt(method: UploadMethod?): Int? = method?.ordinal

  @TypeConverter
  fun fromUploadErrorCode(value: Int?): UploadErrorCode? = value?.let { UploadErrorCode.entries[it] }

  @TypeConverter
  fun uploadErrorCodeToInt(code: UploadErrorCode?): Int? = code?.ordinal

  @TypeConverter
  fun fromAssetType(value: Int?): AssetType? = value?.let { AssetType.entries[it] }

  @TypeConverter
  fun assetTypeToInt(type: AssetType?): Int? = type?.ordinal

  @TypeConverter
  fun fromStringMap(value: String?): Map<String, String>? {
    val type = object : TypeToken<Map<String, String>>() {}.type
    return gson.fromJson(value, type)
  }

  @TypeConverter
  fun stringMapToString(map: Map<String, String>?): String? = gson.toJson(map)

  @TypeConverter
  fun fromEndpointStatus(value: String?): EndpointStatus? = value?.let { EndpointStatus.fromString(it) }

  @TypeConverter
  fun endpointStatusToString(status: EndpointStatus?): String? = status?.value

  @TypeConverter
  fun fromEndpointList(value: String?): List<Endpoint>? {
    val type = object : TypeToken<List<Endpoint>>() {}.type
    return gson.fromJson(value, type)
  }

  @TypeConverter
  fun endpointListToString(list: List<Endpoint>?): String? = gson.toJson(list)
}

