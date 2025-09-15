import Photos
import CryptoKit

struct AssetWrapper: Hashable, Equatable {
  let asset: PlatformAsset
  
  init(with asset: PlatformAsset) {
    self.asset = asset
  }
  
  func hash(into hasher: inout Hasher) {
    hasher.combine(self.asset.id)
  }
  
  static func == (lhs: AssetWrapper, rhs: AssetWrapper) -> Bool {
    return lhs.asset.id == rhs.asset.id
  }
}

extension PHAsset {
  func toPlatformAsset() -> PlatformAsset {
    return PlatformAsset(
      id: localIdentifier,
      name: title,
      type: Int64(mediaType.rawValue),
      createdAt: creationDate.map { Int64($0.timeIntervalSince1970) },
      updatedAt: modificationDate.map { Int64($0.timeIntervalSince1970) },
      width: Int64(pixelWidth),
      height: Int64(pixelHeight),
      durationInSeconds: Int64(duration),
      orientation: 0,
      isFavorite: isFavorite
    )
  }
}

class NativeSyncApiImpl: NativeSyncApi {
  private let defaults: UserDefaults
  private let changeTokenKey = "immich:changeToken"
  private let albumTypes: [PHAssetCollectionType] = [.album, .smartAlbum]
  private let recoveredAlbumSubType = 1000000219
  
  private let hashBufferSize = 2 * 1024 * 1024

  
  init(with defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }
  
  @available(iOS 16, *)
  private func getChangeToken() -> PHPersistentChangeToken? {
    guard let data = defaults.data(forKey: changeTokenKey) else {
      return nil
    }
    return try? NSKeyedUnarchiver.unarchivedObject(ofClass: PHPersistentChangeToken.self, from: data)
  }
  
  @available(iOS 16, *)
  private func saveChangeToken(token: PHPersistentChangeToken) -> Void {
    guard let data = try? NSKeyedArchiver.archivedData(withRootObject: token, requiringSecureCoding: true) else {
      return
    }
    defaults.set(data, forKey: changeTokenKey)
  }
  
  func clearSyncCheckpoint() -> Void {
    defaults.removeObject(forKey: changeTokenKey)
  }
  
  func checkpointSync() {
    guard #available(iOS 16, *) else {
      return
    }
    saveChangeToken(token: PHPhotoLibrary.shared().currentChangeToken)
  }
  
  func shouldFullSync() -> Bool {
    guard #available(iOS 16, *),
          PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized,
          let storedToken = getChangeToken() else {
      // When we do not have access to photo library, older iOS version or No token available, fallback to full sync
      return true
    }
    
    guard let _ = try? PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken) else {
      // Cannot fetch persistent changes
      return true
    }
    
    return false
  }
  
  func getAlbums() throws -> [PlatformAlbum] {
    var albums: [PlatformAlbum] = []
    
    albumTypes.forEach { type in
      let collections = PHAssetCollection.fetchAssetCollections(with: type, subtype: .any, options: nil)
      for i in 0..<collections.count {
        let album = collections.object(at: i)
      
        // Ignore recovered album
        if(album.assetCollectionSubtype.rawValue == self.recoveredAlbumSubType) {
          continue;
        }
        
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "modificationDate", ascending: false)]
        options.includeHiddenAssets = false
        let assets = PHAsset.fetchAssets(in: album, options: options)
        let isCloud = album.assetCollectionSubtype == .albumCloudShared || album.assetCollectionSubtype == .albumMyPhotoStream
        
        var domainAlbum = PlatformAlbum(
          id: album.localIdentifier,
          name: album.localizedTitle!,
          updatedAt: nil,
          isCloud: isCloud,
          assetCount: Int64(assets.count)
        )
        
        if let firstAsset = assets.firstObject {
          domainAlbum.updatedAt = firstAsset.modificationDate.map { Int64($0.timeIntervalSince1970) }
        }
        
        albums.append(domainAlbum)
      }
    }
    return albums.sorted { $0.id < $1.id }
  }
  
  func getMediaChanges() throws -> SyncDelta {
    guard #available(iOS 16, *) else {
      throw PigeonError(code: "UNSUPPORTED_OS", message: "This feature requires iOS 16 or later.", details: nil)
    }
    
    guard PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized else {
      throw PigeonError(code: "NO_AUTH", message: "No photo library access", details: nil)
    }
    
    guard let storedToken = getChangeToken() else {
      // No token exists, definitely need a full sync
      print("MediaManager::getMediaChanges: No token found")
      throw PigeonError(code: "NO_TOKEN", message: "No stored change token", details: nil)
    }
    
    let currentToken = PHPhotoLibrary.shared().currentChangeToken
    if storedToken == currentToken {
      return SyncDelta(hasChanges: false, updates: [], deletes: [], assetAlbums: [:])
    }
    
    do {
      let changes = try PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken)
      
      var updatedAssets: Set<AssetWrapper> = []
      var deletedAssets: Set<String> = []
      
      for change in changes {
        guard let details = try? change.changeDetails(for: PHObjectType.asset) else { continue }
        
        let updated = details.updatedLocalIdentifiers.union(details.insertedLocalIdentifiers)
        deletedAssets.formUnion(details.deletedLocalIdentifiers)
        
        if (updated.isEmpty) { continue }
        
        let options = PHFetchOptions()
        options.includeHiddenAssets = false
        let result = PHAsset.fetchAssets(withLocalIdentifiers: Array(updated), options: options)
        for i in 0..<result.count {
          let asset = result.object(at: i)
          
          // Asset wrapper only uses the id for comparison. Multiple change can contain the same asset, skip duplicate changes
          let predicate = PlatformAsset(
            id: asset.localIdentifier,
            name: "",
            type: 0,
            durationInSeconds: 0,
            orientation: 0,
            isFavorite: false
          )
          if (updatedAssets.contains(AssetWrapper(with: predicate))) {
            continue
          }
          
          let domainAsset = AssetWrapper(with: asset.toPlatformAsset())
          updatedAssets.insert(domainAsset)
        }
      }
      
      let updates = Array(updatedAssets.map { $0.asset })
      return SyncDelta(hasChanges: true, updates: updates, deletes: Array(deletedAssets), assetAlbums: buildAssetAlbumsMap(assets: updates))
    }
  }
  
  
  private func buildAssetAlbumsMap(assets: Array<PlatformAsset>) -> [String: [String]] {
    guard !assets.isEmpty else {
      return [:]
    }
    
    var albumAssets: [String: [String]] = [:]
    
    for type in albumTypes {
      let collections = PHAssetCollection.fetchAssetCollections(with: type, subtype: .any, options: nil)
      collections.enumerateObjects { (album, _, _) in
        let options = PHFetchOptions()
        options.predicate = NSPredicate(format: "localIdentifier IN %@", assets.map(\.id))
        options.includeHiddenAssets = false
        let result = PHAsset.fetchAssets(in: album, options: options)
        result.enumerateObjects { (asset, _, _) in
          albumAssets[asset.localIdentifier, default: []].append(album.localIdentifier)
        }
      }
    }
    return albumAssets
  }
  
  func getAssetIdsForAlbum(albumId: String) throws -> [String] {
    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: nil)
    guard let album = collections.firstObject else {
      return []
    }
    
    var ids: [String] = []
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    let assets = PHAsset.fetchAssets(in: album, options: options)
    assets.enumerateObjects { (asset, _, _) in
      ids.append(asset.localIdentifier)
    }
    return ids
  }
  
  func getAssetsCountSince(albumId: String, timestamp: Int64) throws -> Int64 {
    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: nil)
    guard let album = collections.firstObject else {
      return 0
    }
    
    let date = NSDate(timeIntervalSince1970: TimeInterval(timestamp))
    let options = PHFetchOptions()
    options.predicate = NSPredicate(format: "creationDate > %@ OR modificationDate > %@", date, date)
    options.includeHiddenAssets = false
    let assets = PHAsset.fetchAssets(in: album, options: options)
    return Int64(assets.count)
  }
  
  func getAssetsForAlbum(albumId: String, updatedTimeCond: Int64?) throws -> [PlatformAsset] {
    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: nil)
    guard let album = collections.firstObject else {
      return []
    }
    
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    if(updatedTimeCond != nil) {
      let date = NSDate(timeIntervalSince1970: TimeInterval(updatedTimeCond!))
      options.predicate = NSPredicate(format: "creationDate > %@ OR modificationDate > %@", date, date)
    }

    let result = PHAsset.fetchAssets(in: album, options: options)
    if(result.count == 0) {
      return []
    }
    
    var assets: [PlatformAsset] = []
    result.enumerateObjects { (asset, _, _) in
      assets.append(asset.toPlatformAsset())
    }
    return assets
  }
  
  func hashAssets(assetIds: [String], allowNetworkAccess: Bool, completion: @escaping (Result<[HashResult], Error>) -> Void) {
    Task {
      await withTaskGroup(of: HashResult.self) { taskGroup in
        for assetId in assetIds {
          taskGroup.addTask { [weak self] in
            guard let self = self else {
              return HashResult(assetId: assetId, error: "NativeSyncApiImpl deallocated", hash: nil)
            }
            return await self.hashAsset(assetId, allowNetworkAccess: allowNetworkAccess)
          }
        }
        
        var results: [HashResult] = []
        for await result in taskGroup {
          results.append(result)
        }
        
        completion(.success(results))
      }
    }
  }
  
  private func hashAsset(_ assetId: String, allowNetworkAccess: Bool) async -> HashResult {
    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: nil).firstObject else {
      return HashResult(assetId: assetId, error: "Cannot get asset for id", hash: nil)
    }
  
    guard let resource = asset.getResource() else {
      return HashResult(assetId: assetId, error: "Cannot get asset resource", hash: nil)
    }

    let options = PHAssetResourceRequestOptions()
    options.isNetworkAccessAllowed = allowNetworkAccess

    return await withCheckedContinuation { continuation in
      var hasher = Insecure.SHA1()
      
      PHAssetResourceManager.default().requestData(
          for: resource,
          options: options,
          dataReceivedHandler: { data in
              hasher.update(data: data)
          },
          completionHandler: { error in
              if let error = error {
                continuation.resume(returning: HashResult(
                  assetId: assetId, 
                  error: "Failed to hash asset: \(error.localizedDescription)", 
                  hash: nil
                ))
              } else {
                  let digest = hasher.finalize()
                  let hashData = Data(digest)
                  let hashString = hashData.base64EncodedString()
                  
                  continuation.resume(returning: HashResult(
                    assetId: assetId, 
                    error: nil, 
                    hash: hashString
                  ))
              }
          }
      )
    }
  }
}
