import Photos

class ImHostServiceImpl: ImHostService {

  private let mediaManager: MediaManager
  
  init() {
    self.mediaManager = MediaManager()
  }
  
  func shouldFullSync() throws -> Bool {
    return if #available(iOS 16, *) {
      mediaManager.shouldFullSync()
    } else {
      // Always fall back to full sync on older iOS versions
      true
    }
  }

  func getMediaChanges() throws -> SyncDelta {
    guard #available(iOS 16, *) else {
      throw PigeonError(code: "UNSUPPORTED_OS", message: "This feature requires iOS 16 or later.", details: nil)
    }
    return try mediaManager.getMediaChanges()
  }
  
  func checkpointSync() throws {
    if #available(iOS 16, *) {
      mediaManager.checkpointSync()
    }
  }
  
  func clearSyncCheckpoint() {
      mediaManager.clearSyncCheckpoint()
  }
  
  func getAssetIdsForAlbum(albumId: String) throws -> [String] {
    // Android specific, empty list is safe no-op
    return []
  }
}
