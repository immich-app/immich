import Photos

protocol PhotoLibraryProvider {
  var isAuthorized: Bool { get }
  @available(iOS 16, *)
  var currentChangeToken: PHPersistentChangeToken { get }
  
  func fetchAlbums(sorted: Bool) -> [PHAssetCollection]
  func fetchAlbums(with type: PHAssetCollectionType, subtype: PHAssetCollectionSubtype, options: PHFetchOptions?) -> PHFetchResult<PHAssetCollection>
  func fetchAssets(in album: PHAssetCollection, options: PHFetchOptions?) -> PHFetchResult<PHAsset>
  func fetchAssets(withIdentifiers ids: [String], options: PHFetchOptions?) -> PHFetchResult<PHAsset>
  @available(iOS 16, *)
  func fetchPersistentChanges(since token: PHPersistentChangeToken) throws -> PHPersistentChangeFetchResult
}

struct PhotoLibrary: PhotoLibraryProvider {
  static let shared: PhotoLibrary = .init()

  private init() {}
  
  func fetchAlbums(with type: PHAssetCollectionType, subtype: PHAssetCollectionSubtype, options: PHFetchOptions?) -> PHFetchResult<PHAssetCollection> {
    PHAssetCollection.fetchAssetCollections(with: type, subtype: subtype, options: options)
  }

  func fetchAssetCollection(albumId: String, options: PHFetchOptions? = nil) -> PHAssetCollection? {
    let albums = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: options)
    return albums.firstObject
  }

  func fetchAssets(in album: PHAssetCollection, options: PHFetchOptions?) -> PHFetchResult<PHAsset> {
    album.assetCollectionSubtype == .smartAlbumUserLibrary
      ? PHAsset.fetchAssets(with: options)
      : PHAsset.fetchAssets(in: album, options: options)
  }

  func fetchAssets(withIdentifiers ids: [String], options: PHFetchOptions?) -> PHFetchResult<PHAsset> {
    PHAsset.fetchAssets(withLocalIdentifiers: ids, options: options)
  }
  
  @available(iOS 16, *)
  func fetchPersistentChanges(since token: PHPersistentChangeToken) throws -> PHPersistentChangeFetchResult {
    try PHPhotoLibrary.shared().fetchPersistentChanges(since: token)
  }
  
  @available(iOS 16, *)
  var currentChangeToken: PHPersistentChangeToken {
    PHPhotoLibrary.shared().currentChangeToken
  }
  
  var isAuthorized: Bool {
    PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized
  }
}
