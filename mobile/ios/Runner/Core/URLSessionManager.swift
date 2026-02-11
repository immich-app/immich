import Foundation

let CLIENT_CERT_LABEL = "app.alextran.immich.client_identity"

/// Manages a shared URLSession with SSL configuration support.
class URLSessionManager: NSObject {
  static let shared = URLSessionManager()
  
  let session: URLSession
  private let configuration = {
    let config = URLSessionConfiguration.default
    
    let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
      .first!
      .appendingPathComponent("api", isDirectory: true)
    try! FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true)
    
    config.urlCache = URLCache(
      memoryCapacity: 0,
      diskCapacity: 1024 * 1024 * 1024,
      directory: cacheDir
    )
    
    config.httpMaximumConnectionsPerHost = 64
    config.timeoutIntervalForRequest = 60
    config.timeoutIntervalForResource = 300
    
    let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
    config.httpAdditionalHeaders = ["User-Agent": "Immich_iOS_\(version)"]
    
    return config
  }()
  
  private override init() {
    session = URLSession(configuration: configuration, delegate: URLSessionManagerDelegate(), delegateQueue: nil)
    super.init()
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
