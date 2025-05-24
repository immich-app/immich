import Photos

struct AssetWrapper: Hashable, Equatable {
  let asset: ImAsset
  
  init(with asset: ImAsset) {
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
  func toImAsset() -> ImAsset {
    return ImAsset(
      id: localIdentifier,
      name: PHAssetResource.assetResources(for: self).first?.originalFilename ?? title(),
      type: Int64(mediaType.rawValue),
      createdAt: creationDate.map { Int64($0.timeIntervalSince1970) },
      updatedAt: modificationDate.map { Int64($0.timeIntervalSince1970) },
      durationInSeconds: Int64(duration),
    )
  }
}

class NativeSyncApiImpl: NativeSyncApi {
  private let defaults: UserDefaults
  private let changeTokenKey = "immich:changeToken"
  private let albumTypes: [PHAssetCollectionType] = [.album, .smartAlbum]
  
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
  
  func getAlbums() throws -> [ImAlbum] {
    var albums: [ImAlbum] = []
    
    albumTypes.forEach { type in
      let collections = PHAssetCollection.fetchAssetCollections(with: type, subtype: .any, options: nil)
      collections.enumerateObjects { (album, _, _) in
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "modificationDate", ascending: false)]
        let assets = PHAsset.fetchAssets(in: album, options: options)
        let isCloud = album.assetCollectionSubtype == .albumCloudShared || album.assetCollectionSubtype == .albumMyPhotoStream
        
        var domainAlbum = ImAlbum(
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
        
        let result = PHAsset.fetchAssets(withLocalIdentifiers: Array(updated), options: nil)
        for i in 0..<result.count {
          let asset = result.object(at: i)
          
          // Asset wrapper only uses the id for comparison. Multiple change can contain the same asset, skip duplicate changes
          let predicate = ImAsset(id: asset.localIdentifier, name: "", type: 0, createdAt: nil, updatedAt: nil, durationInSeconds: 0)
          if (updatedAssets.contains(AssetWrapper(with: predicate))) {
            continue
          }
          
          let domainAsset = AssetWrapper(with: asset.toImAsset())
          updatedAssets.insert(domainAsset)
        }
      }
      
      let updates = Array(updatedAssets.map { $0.asset })
      return SyncDelta(hasChanges: true, updates: updates, deletes: Array(deletedAssets), assetAlbums: buildAssetAlbumsMap(assets: updates))
    }
  }
  
  
  private func buildAssetAlbumsMap(assets: Array<ImAsset>) -> [String: [String]] {
    guard !assets.isEmpty else {
      return [:]
    }
    
    var albumAssets: [String: [String]] = [:]
    
    for type in albumTypes {
      let collections = PHAssetCollection.fetchAssetCollections(with: type, subtype: .any, options: nil)
      collections.enumerateObjects { (album, _, _) in
        let options = PHFetchOptions()
        options.predicate = NSPredicate(format: "localIdentifier IN %@", assets.map(\.id))
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
    let assets = PHAsset.fetchAssets(in: album, options: nil)
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
    let assets = PHAsset.fetchAssets(in: album, options: options)
    return Int64(assets.count)
  }
  
  func getAssetsForAlbum(albumId: String, updatedTimeCond: Int64?) throws -> [ImAsset] {
    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumId], options: nil)
    guard let album = collections.firstObject else {
      return []
    }
    
    let options = PHFetchOptions()
    if(updatedTimeCond != nil) {
      let date = NSDate(timeIntervalSince1970: TimeInterval(updatedTimeCond!))
      options.predicate = NSPredicate(format: "creationDate > %@ OR modificationDate > %@", date, date)
    }
    let result = PHAsset.fetchAssets(in: album, options: options)
    var assets: [ImAsset] = []
    result.enumerateObjects { (asset, _, _) in
      assets.append(asset.toImAsset())
    }
    return assets
  }
}
