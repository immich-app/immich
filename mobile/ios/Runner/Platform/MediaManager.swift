import Photos

struct AssetWrapper: Hashable, Equatable {
  let asset: Asset
  
  init(with asset: Asset) {
    self.asset = asset
  }
  
  func hash(into hasher: inout Hasher) {
    hasher.combine(self.asset.id)
  }
  
  static func == (lhs: AssetWrapper, rhs: AssetWrapper) -> Bool {
    return lhs.asset.id == rhs.asset.id
  }
}

class MediaManager {
  private let defaults: UserDefaults
  private let changeTokenKey = "immich:changeToken"
  
  init(with defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  @available(iOS 16, *)
  private func getChangeToken() -> PHPersistentChangeToken? {
    guard let encodedToken = defaults.data(forKey: changeTokenKey) else {
        print("MediaManager::_getChangeToken: Change token not available in UserDefaults")
        return nil
    }

    do {
        return try NSKeyedUnarchiver.unarchivedObject(ofClass: PHPersistentChangeToken.self, from: encodedToken)
    } catch {
        print("MediaManager::_getChangeToken: Cannot decode the token from UserDefaults")
        return nil
    }
  }
  
  @available(iOS 16, *)
  private func saveChangeToken(token: PHPersistentChangeToken) -> Void {
    do {
        let encodedToken = try NSKeyedArchiver.archivedData(withRootObject: token, requiringSecureCoding: true)
        defaults.set(encodedToken, forKey: changeTokenKey)
        print("MediaManager::_setChangeToken: Change token saved to UserDefaults")
    } catch {
        print("MediaManager::_setChangeToken: Failed to persist the token to UserDefaults: \(error)")
    }
  }
  
  func clearSyncCheckpoint() -> Void {
    defaults.removeObject(forKey: changeTokenKey)
    print("MediaManager::removeChangeToken: Change token removed from UserDefaults")
  }
  
  @available(iOS 16, *)
  func checkpointSync() {
    saveChangeToken(token: PHPhotoLibrary.shared().currentChangeToken)
  }
  
  @available(iOS 16, *)
  func shouldFullSync() -> Bool {
    guard PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized else {
      // When we do not have access to photo library, return true to fallback to old sync
      return true
    }
    
    guard let storedToken = getChangeToken() else {
       // No token exists, perform the initial full sync
       print("MediaManager::shouldUseOldSync: No token found. Full sync required")
       return true
    }

    do {
        _ = try PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken)
      return false
    } catch {
      // fallback to using old sync when we cannot detect changes using the available token
      print("MediaManager::shouldUseOldSync: fetchPersistentChanges failed with error (\(error))")
    }
    return true
  }

  @available(iOS 16, *)
  func getMediaChanges() throws -> SyncDelta {
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
      return SyncDelta(hasChanges: false, updates: [], deletes: [])
    }

    do {
      let changes = try PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken)
      
      var updatedAssets: Set<AssetWrapper> = []
      var deletedAssets: Set<String> = []
      
      for change in changes {
        guard let details = try? change.changeDetails(for: PHObjectType.asset) else { continue }
        
        let updated = details.updatedLocalIdentifiers.union(details.insertedLocalIdentifiers)
        if (updated.isEmpty) { continue }
        
        let result = PHAsset.fetchAssets(withLocalIdentifiers: Array(updated), options: nil)
        for i in 0..<result.count {
          let asset = result.object(at: i)
          
          // Asset wrapper only uses the id for comparison. Multiple change can contain the same asset, skip duplicate changes
          let predicate = Asset(id: asset.localIdentifier, name: "", type: 0, createdAt: nil, updatedAt: nil, durationInSeconds: 0, albumIds: [])
          if (updatedAssets.contains(AssetWrapper(with: predicate))) {
            continue
          }
          
          let id = asset.localIdentifier
          let name = PHAssetResource.assetResources(for: asset).first?.originalFilename ?? asset.title()
          let type: Int64 = Int64(asset.mediaType.rawValue)
          let createdAt = asset.creationDate?.timeIntervalSince1970
          let updatedAt = asset.modificationDate?.timeIntervalSince1970
          let durationInSeconds: Int64 = Int64(asset.duration)
          
          let domainAsset = AssetWrapper(with: Asset(
            id: id,
            name: name,
            type: type,
            createdAt:  createdAt.map { Int64($0) },
            updatedAt: updatedAt.map { Int64($0) },
            durationInSeconds: durationInSeconds,
            albumIds: self._getAlbumIds(forAsset: asset)
          ))
          
          updatedAssets.insert(domainAsset)
        }
        
        deletedAssets.formUnion(details.deletedLocalIdentifiers)
      }
      
      return SyncDelta(hasChanges: true, updates: Array(updatedAssets.map { $0.asset }), deletes: Array(deletedAssets))
    }
  }
  
  @available(iOS 16, *)
  func _getAlbumIds(forAsset: PHAsset) -> [String] {
    var albumIds: [String] = []
    let albumTypes: [PHAssetCollectionType] = [.album, .smartAlbum]

    albumTypes.forEach { type in
      let collections = PHAssetCollection.fetchAssetCollections(with: type, subtype: .any, options: nil)
      collections.enumerateObjects { (album, _, _) in
        var options = PHFetchOptions()
        options.fetchLimit = 1
        options.predicate = NSPredicate(format: "localIdentifier == %@", forAsset.localIdentifier)
        let result = PHAsset.fetchAssets(in: album, options: options)
        if(result.count == 1) {
          albumIds.append(album.localIdentifier)
        }
      }
    }
    return albumIds
  }

}
