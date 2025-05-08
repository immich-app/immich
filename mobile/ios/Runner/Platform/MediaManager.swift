import Photos

class WrapperAsset: Hashable, Equatable {
  var asset: Asset
  
  init(with asset: Asset) {
    self.asset = asset
  }
  
  func hash(into hasher: inout Hasher) {
    hasher.combine(self.asset.id)
  }
  
  static func == (lhs: WrapperAsset, rhs: WrapperAsset) -> Bool {
    return lhs.asset.id == rhs.asset.id
  }
}

class MediaManager {
  private let _defaults: UserDefaults
  private let _changeTokenKey = "immich:changeToken"
  
  init(with defaults: UserDefaults = .standard) {
    self._defaults = defaults
  }

  @available(iOS 16, *)
  func _getChangeToken() -> PHPersistentChangeToken? {
    guard let encodedToken = _defaults.data(forKey: _changeTokenKey) else {
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
  func _saveChangeToken(token: PHPersistentChangeToken) -> Void {
    do {
        let encodedToken = try NSKeyedArchiver.archivedData(withRootObject: token, requiringSecureCoding: true)
        _defaults.set(encodedToken, forKey: _changeTokenKey)
        print("MediaManager::_setChangeToken: Change token saved to UserDefaults")
    } catch {
        print("MediaManager::_setChangeToken: Failed to persist the token to UserDefaults: \(error)")
    }
  }
  
  @available(iOS 16, *)
  func checkpointSync(completion: @escaping (Result<Void, any Error>) -> Void) {
    _saveChangeToken(token: PHPhotoLibrary.shared().currentChangeToken)
    completion(.success(()))
  }
  
  @available(iOS 16, *)
  func shouldFullSync(completion: @escaping (Result<Bool, Error>) -> Void) {
    guard PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized else {
      // When we do not have access to photo library, return true to fallback to old sync
      completion(.success(true))
      return
    }
    
    guard let storedToken = _getChangeToken() else {
       // No token exists, perform the initial full sync
       print("MediaManager::shouldUseOldSync: No token found. Full sync required")
       completion(.success(true))
       return
    }

    do {
        _ = try PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken)
      completion(.success(false))
    } catch {
      // fallback to using old sync when we cannot detect changes using the available token
      print("MediaManager::shouldUseOldSync: fetchPersistentChanges failed with error (\(error))")
      completion(.success(true))
    }
    
  }

  @available(iOS 16, *)
  func getMediaChanges(completion: @escaping (Result<SyncDelta, Error>) -> Void) {
    guard PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized else {
      completion(.failure(PigeonError(code: "NO_AUTH", message: "No photo library access", details: nil)))
      return
    }
    
    guard let storedToken = _getChangeToken() else {
       // No token exists, definitely need a full sync
       print("MediaManager::getMediaChanges: No token found")
       completion(.failure(PigeonError(code: "NO_TOKEN", message: "No stored change token", details: nil)))
       return
    }
    
    let currentToken = PHPhotoLibrary.shared().currentChangeToken
    if storedToken == currentToken {
      completion(.success(SyncDelta(hasChanges: false, updates: [], deletes: [])))
      return
    }

    do {
      let result = try PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken)
      let dateFormatter = ISO8601DateFormatter()
      dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

      var updatedArr: Set<WrapperAsset> = []
      var deletedArr: Set<String> = []

      for changes in result {
        let details = try changes.changeDetails(for: PHObjectType.asset)

        let updated = details.updatedLocalIdentifiers.union(details.insertedLocalIdentifiers)
        let deleted = details.deletedLocalIdentifiers
      
        let options = PHFetchOptions()
        options.includeHiddenAssets = false
        
        let updatedAssets = PHAsset.fetchAssets(withLocalIdentifiers: Array(updated), options: options)

        updatedAssets.enumerateObjects { (asset, _, _) in
   
          let id = asset.localIdentifier
          let name = PHAssetResource.assetResources(for: asset).first?.originalFilename ?? asset.title()
          let type: Int64 = Int64(asset.mediaType.rawValue)
          let createdAt = asset.creationDate.map { dateFormatter.string(from: $0) }
          let updatedAt = asset.modificationDate.map { dateFormatter.string(from: $0) }
          let durationInSeconds: Int64 = Int64(asset.duration)
          
          let domainAsset = WrapperAsset(with: Asset(
              id: id,
              name: name,
              type: type,
              createdAt: createdAt,
              updatedAt: updatedAt,
              durationInSeconds: durationInSeconds,
              albumIds: self._getAlbumIds(forAsset: asset)
          ))
          
          updatedArr.insert(domainAsset)
        }
        
        deletedArr.formUnion(deleted)
      }

      let delta = SyncDelta(hasChanges: true, updates: Array(updatedArr.map { $0.asset }), deletes: Array(deletedArr))
    
      completion(.success(delta))
      return
    } catch {
      print("MediaManager::getMediaChanges: Error fetching persistent changes: \(error)")
      completion(.failure(PigeonError(code: "3", message: error.localizedDescription, details: nil)))
      return
    }
  }
  
  @available(iOS 16, *)
  func _getAlbumIds(forAsset: PHAsset) -> [String] {
    var albumIds: [String] = []
    let albumTypes: [PHAssetCollectionType] = [.album, .smartAlbum]

    albumTypes.forEach { type in
      let collections = PHAssetCollection.fetchAssetCollectionsContaining(forAsset, with: type, options: nil)
      collections.enumerateObjects { (album, _, _) in
        albumIds.append(album.localIdentifier)
      }
    }
    return albumIds
  }

}
