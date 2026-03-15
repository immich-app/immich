import Foundation
import native_video_player

let CLIENT_CERT_LABEL = "app.alextran.immich.client_identity"
let HEADERS_KEY = "immich.request_headers"
let SERVER_URLS_KEY = "immich.server_urls"
let APP_GROUP = "group.app.immich.share"
let COOKIE_EXPIRY_DAYS: TimeInterval = 400

enum AuthCookie: CaseIterable {
  case accessToken, isAuthenticated, authType

  var name: String {
    switch self {
    case .accessToken: return "immich_access_token"
    case .isAuthenticated: return "immich_is_authenticated"
    case .authType: return "immich_auth_type"
    }
  }

  var httpOnly: Bool {
    switch self {
    case .accessToken, .authType: return true
    case .isAuthenticated: return false
    }
  }

  static let names: Set<String> = Set(allCases.map(\.name))
}

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
  static let userAgent: String = {
    let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
    return "Immich_iOS_\(version)"
  }()
  static let cookieStorage = HTTPCookieStorage.sharedCookieStorage(forGroupContainerIdentifier: APP_GROUP)
  private static var serverUrls: [String] = []
  private static var isSyncing = false

  var sessionPointer: UnsafeMutableRawPointer {
    Unmanaged.passUnretained(session).toOpaque()
  }

  private override init() {
    delegate = URLSessionManagerDelegate()
    session = Self.buildSession(delegate: delegate)
    super.init()
    Self.serverUrls = UserDefaults.group.stringArray(forKey: SERVER_URLS_KEY) ?? []
    NotificationCenter.default.addObserver(
      Self.self,
      selector: #selector(Self.cookiesDidChange),
      name: NSNotification.Name.NSHTTPCookieManagerCookiesChanged,
      object: Self.cookieStorage
    )
  }

  func recreateSession() {
    session = Self.buildSession(delegate: delegate)
  }

  static func setServerUrls(_ urls: [String]) {
    guard urls != serverUrls else { return }
    serverUrls = urls
    UserDefaults.group.set(urls, forKey: SERVER_URLS_KEY)
    syncAuthCookies()
  }

  @objc private static func cookiesDidChange(_ notification: Notification) {
    guard !isSyncing, !serverUrls.isEmpty else { return }
    syncAuthCookies()
  }

  private static func syncAuthCookies() {
    let serverHosts = Set(serverUrls.compactMap { URL(string: $0)?.host })
    let allCookies = cookieStorage.cookies ?? []
    let now = Date()

    let serverAuthCookies = allCookies.filter {
      AuthCookie.names.contains($0.name) && serverHosts.contains($0.domain)
    }

    var sourceCookies: [String: HTTPCookie] = [:]
    for cookie in serverAuthCookies {
      if cookie.expiresDate.map({ $0 > now }) ?? true {
        sourceCookies[cookie.name] = cookie
      }
    }

    isSyncing = true
    defer { isSyncing = false }

    if sourceCookies.isEmpty {
      for cookie in serverAuthCookies {
        cookieStorage.deleteCookie(cookie)
      }
      return
    }

    for serverUrl in serverUrls {
      guard let url = URL(string: serverUrl), let domain = url.host else { continue }
      let isSecure = serverUrl.hasPrefix("https")

      for (_, source) in sourceCookies {
        if allCookies.contains(where: { $0.name == source.name && $0.domain == domain && $0.value == source.value }) {
          continue
        }

        var properties: [HTTPCookiePropertyKey: Any] = [
          .name: source.name,
          .value: source.value,
          .domain: domain,
          .path: "/",
          .expires: source.expiresDate ?? Date().addingTimeInterval(COOKIE_EXPIRY_DAYS * 24 * 60 * 60),
        ]
        if isSecure { properties[.secure] = "TRUE" }
        if source.isHTTPOnly { properties[.init("HttpOnly")] = "TRUE" }

        if let cookie = HTTPCookie(properties: properties) {
          cookieStorage.setCookie(cookie)
        }
      }
    }
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

  /// Patches background_downloader's URLSession to use shared auth configuration.
  /// Must be called before background_downloader creates its session (i.e. early in app startup).
  static func patchBackgroundDownloader() {
    // Swizzle URLSessionConfiguration.background(withIdentifier:) to inject shared config
    let originalSel = NSSelectorFromString("backgroundSessionConfigurationWithIdentifier:")
    let swizzledSel = #selector(URLSessionConfiguration.immich_background(withIdentifier:))
    if let original = class_getClassMethod(URLSessionConfiguration.self, originalSel),
       let swizzled = class_getClassMethod(URLSessionConfiguration.self, swizzledSel) {
      method_exchangeImplementations(original, swizzled)
    }

    // Add auth challenge handling to background_downloader's UrlSessionDelegate
    guard let targetClass = NSClassFromString("background_downloader.UrlSessionDelegate") else { return }

    let sessionBlock: @convention(block) (AnyObject, URLSession, URLAuthenticationChallenge,
        @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) -> Void
    = { _, session, challenge, completion in
      URLSessionManager.shared.delegate.handleChallenge(session, challenge, completion)
    }
    class_replaceMethod(targetClass,
      NSSelectorFromString("URLSession:didReceiveChallenge:completionHandler:"),
      imp_implementationWithBlock(sessionBlock), "v@:@@@?")

    let taskBlock: @convention(block) (AnyObject, URLSession, URLSessionTask, URLAuthenticationChallenge,
        @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) -> Void
    = { _, session, task, challenge, completion in
      URLSessionManager.shared.delegate.handleChallenge(session, challenge, completion, task: task)
    }
    class_replaceMethod(targetClass,
      NSSelectorFromString("URLSession:task:didReceiveChallenge:completionHandler:"),
      imp_implementationWithBlock(taskBlock), "v@:@@@@?")
  }
}

private extension URLSessionConfiguration {
  @objc dynamic class func immich_background(withIdentifier id: String) -> URLSessionConfiguration {
    // After swizzle, this calls the original implementation
    let config = immich_background(withIdentifier: id)
    config.httpCookieStorage = URLSessionManager.cookieStorage
    config.httpAdditionalHeaders = ["User-Agent": URLSessionManager.userAgent]
    return config
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
