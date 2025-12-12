import GRDB
import SQLiteData

@Table("asset_face_entity")
struct AssetFace {
  let id: String
  let assetId: String
  let personId: String?
  let imageWidth: Int
  let imageHeight: Int
  let boundingBoxX1: Int
  let boundingBoxY1: Int
  let boundingBoxX2: Int
  let boundingBoxY2: Int
  let sourceType: String
}

@Table("auth_user_entity")
struct AuthUser {
  let id: String
  let name: String
  let email: String
  let isAdmin: Bool
  let hasProfileImage: Bool
  let profileChangedAt: Date
  let avatarColor: AvatarColor
  let quotaSizeInBytes: Int
  let quotaUsageInBytes: Int
  let pinCode: String?
}

@Table("local_album_entity")
struct LocalAlbum {
  let id: String
  let backupSelection: BackupSelection
  let linkedRemoteAlbumId: String?
  let marker_: Bool?
  let name: String
  let isIosSharedAlbum: Bool
  let updatedAt: Date
}

@Table("local_album_asset_entity")
struct LocalAlbumAsset {
  let id: ID
  let marker_: String?

  @Selection
  struct ID {
    let assetId: String
    let albumId: String
  }
}

@Table("local_asset_entity")
struct LocalAsset {
  let id: String
  let checksum: String?
  let createdAt: Date
  let durationInSeconds: Int?
  let height: Int?
  let isFavorite: Bool
  let name: String
  let orientation: String
  let type: Int
  let updatedAt: Date
  let width: Int?
}

@Table("memory_asset_entity")
struct MemoryAsset {
  let id: ID

  @Selection
  struct ID {
    let assetId: String
    let albumId: String
  }
}

@Table("memory_entity")
struct Memory {
  let id: String
  let createdAt: Date
  let updatedAt: Date
  let deletedAt: Date?
  let ownerId: String
  let type: MemoryType
  let data: String
  let isSaved: Bool
  let memoryAt: Date
  let seenAt: Date?
  let showAt: Date?
  let hideAt: Date?
}

@Table("partner_entity")
struct Partner {
  let id: ID
  let inTimeline: Bool

  @Selection
  struct ID {
    let sharedById: String
    let sharedWithId: String
  }
}

@Table("person_entity")
struct Person {
  let id: String
  let createdAt: Date
  let updatedAt: Date
  let ownerId: String
  let name: String
  let faceAssetId: String?
  let isFavorite: Bool
  let isHidden: Bool
  let color: String?
  let birthDate: Date?
}

@Table("remote_album_entity")
struct RemoteAlbum {
  let id: String
  let createdAt: Date
  let description: String?
  let isActivityEnabled: Bool
  let name: String
  let order: Int
  let ownerId: String
  let thumbnailAssetId: String?
  let updatedAt: Date
}

@Table("remote_album_asset_entity")
struct RemoteAlbumAsset {
  let id: ID

  @Selection
  struct ID {
    let assetId: String
    let albumId: String
  }
}

@Table("remote_album_user_entity")
struct RemoteAlbumUser {
  let id: ID
  let role: AlbumUserRole

  @Selection
  struct ID {
    let albumId: String
    let userId: String
  }
}

@Table("remote_asset_entity")
struct RemoteAsset {
  let id: String
  let checksum: String?
  let deletedAt: Date?
  let isFavorite: Int
  let libraryId: String?
  let livePhotoVideoId: String?
  let localDateTime: Date?
  let orientation: String
  let ownerId: String
  let stackId: String?
  let visibility: Int
}

@Table("remote_exif_entity")
struct RemoteExif {
  @Column(primaryKey: true)
  let assetId: String
  let city: String?
  let state: String?
  let country: String?
  let dateTimeOriginal: Date?
  let description: String?
  let height: Int?
  let width: Int?
  let exposureTime: String?
  let fNumber: Double?
  let fileSize: Int?
  let focalLength: Double?
  let latitude: Double?
  let longitude: Double?
  let iso: Int?
  let make: String?
  let model: String?
  let lens: String?
  let orientation: String?
  let timeZone: String?
  let rating: Int?
  let projectionType: String?
}

@Table("stack_entity")
struct Stack {
  let id: String
  let createdAt: Date
  let updatedAt: Date
  let ownerId: String
  let primaryAssetId: String
}

@Table("store_entity")
struct Store {
  let id: StoreKey
  let stringValue: String?
  let intValue: Int?
}

@Table("user_entity")
struct User {
  let id: String
  let name: String
  let email: String
  let hasProfileImage: Bool
  let profileChangedAt: Date
  let avatarColor: AvatarColor
}

@Table("user_metadata_entity")
struct UserMetadata {
  let id: ID
  let value: Data

  @Selection
  struct ID {
    let userId: String
    let key: Date
  }
}
