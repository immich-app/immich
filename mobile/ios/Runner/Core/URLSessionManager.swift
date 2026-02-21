import Foundation
import native_video_player

let CLIENT_CERT_LABEL = "app.alextran.immich.client_identity"
let HEADERS_KEY = "immich.request_headers"
let SERVER_URL_KEY = "immich.server_url"
let APP_GROUP = "group.app.immich.share"

/// Manages a shared URLSession with SSL configuration support.
class URLSessionManager: NSObject {
  static let shared = URLSessionManager()
  
  let session: URLSession
  let delegate: URLSessionManagerDelegate
  static let cookieStorage = HTTPCookieStorage.sharedCookieStorage(forGroupContainerIdentifier: APP_GROUP)
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
    
    config.httpCookieStorage = cookieStorage
    config.httpMaximumConnectionsPerHost = 64
    config.timeoutIntervalForRequest = 60
    config.timeoutIntervalForResource = 300
    
    let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
    var headers: [String: String] = ["User-Agent": "Immich_iOS_\(version)"]
    if let saved = UserDefaults(suiteName: APP_GROUP)?.dictionary(forKey: HEADERS_KEY) as? [String: String] {
      headers.merge(saved) { _, new in new }
    }
    config.httpAdditionalHeaders = headers

    return config
  }()
  
  var sessionPointer: UnsafeMutableRawPointer {
    Unmanaged.passUnretained(session).toOpaque()
  }
  
  private override init() {
    delegate = URLSessionManagerDelegate()
    session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)
    super.init()
  }
}

class URLSessionManagerDelegate: NSObject, URLSessionTaskDelegate, URLSessionWebSocketDelegate {
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
    handleChallenge(challenge, task: task, completionHandler: completionHandler)
  }
  
  func handleChallenge(
    _ challenge: URLAuthenticationChallenge,
    task: URLSessionTask? = nil,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    switch challenge.protectionSpace.authenticationMethod {
    case NSURLAuthenticationMethodClientCertificate: handleClientCertificate(completion: completionHandler)
    case NSURLAuthenticationMethodHTTPBasic: handleBasicAuth(task: task, completion: completionHandler)
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
      VideoResourceLoader.shared.clientCredential = credential
      return completion(.useCredential, credential)
    }
    completion(.performDefaultHandling, nil)
  }
  
  private func handleBasicAuth(
    task: URLSessionTask?,
    completion: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    guard let url = task?.originalRequest?.url,
      let user = url.user,
      let password = url.password
    else {
      return completion(.performDefaultHandling, nil)
    }
    let credential = URLCredential(user: user, password: password, persistence: .forSession)
    completion(.useCredential, credential)
  }
}
