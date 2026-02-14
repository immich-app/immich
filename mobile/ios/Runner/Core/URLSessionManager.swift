import Foundation

let CLIENT_CERT_LABEL = "app.alextran.immich.client_identity"

class URLSessionManager: NSObject {
  static let shared = URLSessionManager()
  
  let thumbnailSession: URLSession
  let highResSession: URLSession
  private let thumbnailCacheDir: URL
  private let highResCacheDir: URL
  private let highResMetadataFile: URL
  
  var session: URLSession { highResSession }
  
  private static func createConfig(cacheDir: URL) -> URLSessionConfiguration {
    let config = URLSessionConfiguration.default
    try! FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true)
    config.urlCache = URLCache(memoryCapacity: 0, diskCapacity: 1024 * 1024 * 1024, directory: cacheDir)
    config.httpMaximumConnectionsPerHost = 64
    config.timeoutIntervalForRequest = 60
    config.timeoutIntervalForResource = 300
    let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
    config.httpAdditionalHeaders = ["User-Agent": "Immich_iOS_\(version)"]
    return config
  }
  
  private override init() {
    let cacheBase = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
    thumbnailCacheDir = cacheBase.appendingPathComponent("thumbnails", isDirectory: true)
    highResCacheDir = cacheBase.appendingPathComponent("highres", isDirectory: true)
    highResMetadataFile = cacheBase.appendingPathComponent("highres_access.plist")
    
    let delegate = URLSessionManagerDelegate()
    thumbnailSession = URLSession(configuration: Self.createConfig(cacheDir: thumbnailCacheDir), delegate: delegate, delegateQueue: nil)
    highResSession = URLSession(configuration: Self.createConfig(cacheDir: highResCacheDir), delegate: delegate, delegateQueue: nil)
    super.init()
  }
  
  func recordAccess(for url: String) {
    var metadata = loadMetadata()
    metadata[url] = Date().timeIntervalSince1970
    saveMetadata(metadata)
  }
  
  func cleanupExpired(maxAgeDays: Int) -> Int64 {
    let metadata = loadMetadata()
    let cutoff = Date().timeIntervalSince1970 - Double(maxAgeDays * 24 * 60 * 60)
    var expiredUrls: [String] = []
    
    for (url, timestamp) in metadata {
      if timestamp < cutoff {
        expiredUrls.append(url)
      }
    }
    
    guard !expiredUrls.isEmpty else { return 0 }
    
    let cache = highResSession.configuration.urlCache!
    var bytesCleared: Int64 = 0
    
    for urlString in expiredUrls {
      if let url = URL(string: urlString) {
        let request = URLRequest(url: url)
        if let response = cache.cachedResponse(for: request) {
          bytesCleared += Int64(response.data.count)
          cache.removeCachedResponse(for: request)
        }
      }
    }
    
    var newMetadata = metadata
    for url in expiredUrls {
      newMetadata.removeValue(forKey: url)
    }
    saveMetadata(newMetadata)
    
    return bytesCleared
  }
  
  private func loadMetadata() -> [String: Double] {
    guard let data = try? Data(contentsOf: highResMetadataFile),
          let dict = try? PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Double] else {
      return [:]
    }
    return dict
  }
  
  private func saveMetadata(_ metadata: [String: Double]) {
    if let data = try? PropertyListSerialization.data(fromPropertyList: metadata, format: .binary, options: 0) {
      try? data.write(to: highResMetadataFile)
    }
  }
  
  func thumbnailCacheStats() -> (size: Int64, count: Int64) {
    return folderStats(thumbnailCacheDir)
  }
  
  func highResCacheStats() -> (size: Int64, count: Int64) {
    return folderStats(highResCacheDir)
  }
  
  private func folderStats(_ dir: URL) -> (size: Int64, count: Int64) {
    var totalSize: Int64 = 0
    var totalCount: Int64 = 0
    let fm = FileManager.default
    guard let enumerator = fm.enumerator(at: dir, includingPropertiesForKeys: [.fileSizeKey, .isRegularFileKey]) else {
      return (0, 0)
    }
    for case let fileURL as URL in enumerator {
      guard let values = try? fileURL.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey]),
            values.isRegularFile == true else { continue }
      totalSize += Int64(values.fileSize ?? 0)
      totalCount += 1
    }
    return (totalSize, totalCount)
  }
  
  func clearThumbnailCache() -> Int64 {
    let size = Int64(thumbnailSession.configuration.urlCache?.currentDiskUsage ?? 0)
    thumbnailSession.configuration.urlCache?.removeAllCachedResponses()
    return size
  }
  
  func clearHighResCache() -> Int64 {
    let size = Int64(highResSession.configuration.urlCache?.currentDiskUsage ?? 0)
    highResSession.configuration.urlCache?.removeAllCachedResponses()
    saveMetadata([:])
    return size
  }
}

class URLSessionManagerDelegate: NSObject, URLSessionTaskDelegate {
  func urlSession(
    _ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    handleChallenge(challenge, completionHandler: completionHandler)
  }
  
  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    handleChallenge(challenge, completionHandler: completionHandler)
  }
  
  func handleChallenge(
    _ challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    switch challenge.protectionSpace.authenticationMethod {
    case NSURLAuthenticationMethodClientCertificate: handleClientCertificate(completion: completionHandler)
    default: completionHandler(.performDefaultHandling, nil)
    }
  }
  
  private func handleClientCertificate(
    completion: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassIdentity,
      kSecAttrLabel as String: CLIENT_CERT_LABEL,
      kSecReturnRef as String: true,
    ]
    
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    if status == errSecSuccess, let identity = item {
      let credential = URLCredential(identity: identity as! SecIdentity,
                                     certificates: nil,
                                     persistence: .forSession)
      return completion(.useCredential, credential)
    }
    completion(.performDefaultHandling, nil)
  }
}
