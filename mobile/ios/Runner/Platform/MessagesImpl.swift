import Photos

class ImHostServiceImpl: ImHostService {
  let _mediaManager: MediaManager
  
  init() {
    self._mediaManager = MediaManager()
  }
  
  func shouldFullSync(completion: @escaping (Result<Bool, Error>) -> Void) {
    if #available(iOS 16, *) {
      _mediaManager.shouldFullSync(completion: completion)
    } else {
      // Always fall back to full sync on older iOS versions
      completion(.success(true))
    }
  }

  func getMediaChanges(completion: @escaping (Result<SyncDelta, Error>) -> Void) {
    guard #available(iOS 16, *) else {
      completion(.failure(PigeonError(code: "UNSUPPORTED_OS", message: "This feature requires iOS 16 or later.", details: nil)))
      return
    }
    _mediaManager.getMediaChanges(completion: completion)
  }
  
  func checkpointSync(completion: @escaping (Result<Void, any Error>) -> Void) {
    if #available(iOS 16, *) {
      _mediaManager.checkpointSync(completion: completion)
    } else {
      completion(.success(()))
    }
  }
  
  func getAssetIdsForAlbum(albumId: String, completion: @escaping (Result<[String], any Error>) -> Void) {
    // Android specific, empty list is safe no-op
    completion(.success([]))
  }
}
