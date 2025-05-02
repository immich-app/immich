import Photos

class MediaManager {
  let _defaults: UserDefaults
  
  let _changeTokenKey = "immich:changeToken";
  
  init(with defaults: UserDefaults = .standard) {
    _defaults = defaults
  }
  
  @available(iOS 16, *)
  func _getChangeToken() -> PHPersistentChangeToken? {
    guard let encodedToken = _defaults.data(forKey: _changeTokenKey) else {
        print("_getChangeToken: Change token not available in UserDefaults")
        return nil
    }

    do {
        let changeToken = try NSKeyedUnarchiver.unarchivedObject(ofClass: PHPersistentChangeToken.self, from: encodedToken)
        return changeToken
    } catch {
        print("_getChangeToken: Cannot decode the token from UserDefaults")
        return nil
    }
  }
  
  @available(iOS 16, *)
  func _saveChangeToken(token: PHPersistentChangeToken) -> Void {
    do {
        let encodedToken = try NSKeyedArchiver.archivedData(withRootObject: token, requiringSecureCoding: true)
        _defaults.set(encodedToken, forKey: _changeTokenKey)
        print("_setChangeToken: Change token saved to UserDefaults")
    } catch {
        print("_setChangeToken: Failed to persist the token to UserDefaults: \(error)")
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
       print("shouldUseOldSync: No token found")
       completion(.success(true))
       return
    }

    do {
        _ = try PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken)
      completion(.success(false))
    } catch {
      // fallback to using old sync when we cannot detect changes using the available token
      print("shouldUseOldSync: fetchPersistentChanges failed with error (\(error))")
      completion(.success(true))
    }
    
  }

  @available(iOS 16, *)
  func hasMediaChanges(completion: @escaping (Result<Bool, Error>) -> Void) {
    guard PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized else {
      completion(.failure(PigeonError(code: "1", message: "No photo library access", details: nil)))
      return
    }

    let storedToken = _getChangeToken()
    let currentToken = PHPhotoLibrary.shared().currentChangeToken
    completion(.success(storedToken != currentToken))
  }

  @available(iOS 16, *)
  func getMediaChanges(completion: @escaping (Result<SyncDelta, Error>) -> Void) {
    guard PHPhotoLibrary.authorizationStatus(for: .readWrite) == .authorized else {
      completion(.failure(PigeonError(code: "1", message: "No photo library access", details: nil)))
      return
    }
    
    guard let storedToken = _getChangeToken() else {
       // No token exists, definitely need a full sync
       print("getMediaChanges: No token found")
       completion(.failure(PigeonError(code: "2", message: "No stored change token", details: nil)))
       return
    }

    do {
      let result = try PHPhotoLibrary.shared().fetchPersistentChanges(since: storedToken)
      
      let dateFormatter = ISO8601DateFormatter()
      dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      var delta = SyncDelta(updates: [], deletes: [])
      for changes in result {
        let details = try changes.changeDetails(for: PHObjectType.asset)
        let updated = details.updatedLocalIdentifiers.union(details.insertedLocalIdentifiers)
        let deleted = details.deletedLocalIdentifiers
      
        let options = PHFetchOptions()
        options.includeHiddenAssets = true
        let updatedAssets = PHAsset.fetchAssets(withLocalIdentifiers: Array(updated), options: options)
        
        var updates: [Asset] = []
        updatedAssets.enumerateObjects { (asset, _, _) in
          let id = asset.localIdentifier
          let name = PHAssetResource.assetResources(for: asset).first?.originalFilename ?? asset.title()
          let type: Int64 = Int64(asset.mediaType.rawValue)
          let createdAt = asset.creationDate.map { dateFormatter.string(from: $0) }
          let updatedAt = asset.modificationDate.map { dateFormatter.string(from: $0) }
          let durationInSeconds: Int64 = Int64(asset.duration)
          
          let dAsset = Asset(id: id, name: name, type: type, createdAt: createdAt, updatedAt: updatedAt,  durationInSeconds: durationInSeconds, albumIds: self._getAlbumIdsForAsset(asset: asset))  
          updates.append(dAsset)
        }
        
        delta.updates.append(contentsOf: updates)
        delta.deletes.append(contentsOf: deleted)
      }

      completion(.success(delta))
      return
    } catch {
      print("getMediaChanges: Error fetching persistent changes: \(error)")
      completion(.failure(PigeonError(code: "3", message: error.localizedDescription, details: nil)))
      return
    }
  }
  
  @available(iOS 16, *)
  func _getAlbumIdsForAsset(asset: PHAsset) -> [String] {
    var albumIds: [String] = []
    var albums = PHAssetCollection.fetchAssetCollectionsContaining(asset, with: .album, options: nil)
    albums.enumerateObjects { (album, _, _) in
        albumIds.append(album.localIdentifier)
    }
    albums = PHAssetCollection.fetchAssetCollectionsContaining(asset, with: .smartAlbum, options: nil)
    albums.enumerateObjects { (album, _, _) in
        albumIds.append(album.localIdentifier)
    }
    return albumIds
  }

}
