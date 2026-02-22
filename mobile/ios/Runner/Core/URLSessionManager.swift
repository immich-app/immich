import Foundation
import native_video_player

let CLIENT_CERT_LABEL = "app.alextran.immich.client_identity"
let HEADERS_KEY = "immich.request_headers"
let SERVER_URL_KEY = "immich.server_url"
let APP_GROUP = "group.app.immich.share"

extension UserDefaults {
  static let group = UserDefaults(suiteName: APP_GROUP)!
}

/// Manages a shared URLSession with SSL configuration support.
/// Old sessions are kept alive by Dart's FFI retain until all isolates release them.
class URLSessionManager: NSObject {
  static let shared = URLSessionManager()
  
  private(set) var session: URLSession
  let delegate: URLSessionManagerDelegate
  private static let cacheDir: URL = {
    let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
      .first!
      .appendingPathComponent("api", isDirectory: true)
    try! FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }()
  private static let urlCache = URLCache(
    memoryCapacity: 0,
    diskCapacity: 1024 * 1024 * 1024,
    directory: cacheDir
  )
  private static let userAgent: String = {
    let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
    return "Immich_iOS_\(version)"
  }()
  static let cookieStorage = HTTPCookieStorage.sharedCookieStorage(forGroupContainerIdentifier: APP_GROUP)
  
  var sessionPointer: UnsafeMutableRawPointer {
    Unmanaged.passUnretained(session).toOpaque()
  }
  
  private override init() {
    delegate = URLSessionManagerDelegate()
    session = Self.buildSession(delegate: delegate)
    super.init()
  }

  func recreateSession() {
    session = Self.buildSession(delegate: delegate)
  }

  private static func buildSession(delegate: URLSessionManagerDelegate) -> URLSession {
    let config = URLSessionConfiguration.default
    config.urlCache = urlCache
    config.httpCookieStorage = cookieStorage
    config.httpMaximumConnectionsPerHost = 64
    config.timeoutIntervalForRequest = 60
    config.timeoutIntervalForResource = 300

    var headers = UserDefaults.group.dictionary(forKey: HEADERS_KEY) as? [String: String] ?? [:]
    headers["User-Agent"] = headers["User-Agent"] ?? userAgent
    config.httpAdditionalHeaders = headers

    return URLSession(configuration: config, delegate: delegate, delegateQueue: nil)
  }
}

class URLSessionManagerDelegate: NSObject, URLSessionTaskDelegate, URLSessionWebSocketDelegate {
  func urlSession(
    _ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    handleChallenge(session, challenge, completionHandler)
  }
  
  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    handleChallenge(session, challenge, completionHandler, task: task)
  }
  
  func handleChallenge(
    _ session: URLSession,
    _ challenge: URLAuthenticationChallenge,
    _ completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void,
    task: URLSessionTask? = nil
  ) {
    switch challenge.protectionSpace.authenticationMethod {
    case NSURLAuthenticationMethodClientCertificate: handleClientCertificate(session, completion: completionHandler)
    case NSURLAuthenticationMethodHTTPBasic: handleBasicAuth(session, task: task, completion: completionHandler)
    default: completionHandler(.performDefaultHandling, nil)
    }
  }
  
  private func handleClientCertificate(
    _ session: URLSession,
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
      if #available(iOS 15, *) {
        VideoProxyServer.shared.session = session
      }
      return completion(.useCredential, credential)
    }
    completion(.performDefaultHandling, nil)
  }
  
  private func handleBasicAuth(
    _ session: URLSession,
    task: URLSessionTask?,
    completion: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    guard let url = task?.originalRequest?.url,
      let user = url.user,
      let password = url.password
    else {
      return completion(.performDefaultHandling, nil)
    }
    if #available(iOS 15, *) {
      VideoProxyServer.shared.session = session
    }
    let credential = URLCredential(user: user, password: password, persistence: .forSession)
    completion(.useCredential, credential)
  }
}
