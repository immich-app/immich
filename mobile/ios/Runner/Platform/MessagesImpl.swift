import Photos

class ImHostServiceImpl: ImHostService {
  let _mediaManager: MediaManager
  
  init() {
    _mediaManager = MediaManager()
  }
  
  func shouldFullSync(completion: @escaping (Result<Bool, Error>) -> Void) {
    if #available(iOS 16, *) {
      _mediaManager.shouldFullSync(completion: completion)
      return;
    } else {
      // Always fall back to full sync on older iOS versions
      completion(.success(true))
    }
  }

  func hasMediaChanges(completion: @escaping (Result<Bool, Error>) -> Void) {
    if #available(iOS 16, *) {
      _mediaManager.hasMediaChanges(completion: completion)
    } else {
      completion(.failure(PigeonError(code: "-1", message: "Not supported", details: nil)))
    }
  }

  func getMediaChanges(completion: @escaping (Result<SyncDelta, Error>) -> Void) {
    if #available(iOS 16, *) {
      _mediaManager.getMediaChanges(completion: completion)
    } else {
      completion(.failure(PigeonError(code: "-1", message: "Not supported", details: nil)))
    }
  }
  
  func checkpointSync(completion: @escaping (Result<Void, any Error>) -> Void) {
    if #available(iOS 16, *) {
      _mediaManager.checkpointSync(completion: completion)
    } else {
      completion(.success(()))
    }
  }
  
}
