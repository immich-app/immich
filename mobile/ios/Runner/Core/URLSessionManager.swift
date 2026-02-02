import Foundation

let CLIENT_CERT_LABEL = "app.alextran.immich.client_identity"

/// Manages a shared URLSession with SSL configuration support.
class URLSessionManager: NSObject {
  static let shared = URLSessionManager()
  
  let session: URLSession
  let delegate: URLSessionManagerDelegate
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
  
  var sessionPointer: UnsafeMutableRawPointer {
    Unmanaged.passUnretained(session).toOpaque()
  }
  
  private override init() {
    delegate = URLSessionManagerDelegate()
    session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)
    super.init()
  }
  
  /// Creates a WebSocket task and waits for connection to be established.
  func createWebSocketTask(
    url: URL,
    protocols: [String]?,
    completion: @escaping (Result<(URLSessionWebSocketTask, String?), Error>) -> Void
  ) {
    let task: URLSessionWebSocketTask
    if let protocols = protocols, !protocols.isEmpty {
      task = session.webSocketTask(with: url, protocols: protocols)
    } else {
      task = session.webSocketTask(with: url)
    }
    
    delegate.registerWebSocketTask(task) { result in
      completion(result)
    }
    task.resume()
  }
}

enum WebSocketError: Error {
  case connectionFailed(String)
  case invalidURL(String)
}

class URLSessionManagerDelegate: NSObject, URLSessionTaskDelegate, URLSessionWebSocketDelegate {
  private var webSocketCompletions: [Int: (Result<(URLSessionWebSocketTask, String?), Error>) -> Void] = [:]
  private let lock = {
    let lock = UnsafeMutablePointer<os_unfair_lock>.allocate(capacity: 1)
    lock.initialize(to: os_unfair_lock())
    return lock
  }()
  
  func registerWebSocketTask(
    _ task: URLSessionWebSocketTask,
    completion: @escaping (Result<(URLSessionWebSocketTask, String?), Error>) -> Void
  ) {
    os_unfair_lock_lock(lock)
    webSocketCompletions[task.taskIdentifier] = completion
    os_unfair_lock_unlock(lock)
  }
  
  func urlSession(
    _ session: URLSession,
    webSocketTask: URLSessionWebSocketTask,
    didOpenWithProtocol protocol: String?
  ) {
    os_unfair_lock_lock(lock)
    let completion = webSocketCompletions.removeValue(forKey: webSocketTask.taskIdentifier)
    os_unfair_lock_unlock(lock)
    completion?(.success((webSocketTask, `protocol`)))
  }
  
  func urlSession(
    _ session: URLSession,
    webSocketTask: URLSessionWebSocketTask,
    didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
    reason: Data?
  ) {
    // Close events are handled by CupertinoWebSocket via task.closeCode/closeReason
  }
  
  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didCompleteWithError error: Error?
  ) {
    guard let webSocketTask = task as? URLSessionWebSocketTask else { return }
    
    os_unfair_lock_lock(lock)
    let completion = webSocketCompletions.removeValue(forKey: webSocketTask.taskIdentifier)
    os_unfair_lock_unlock(lock)
    
    if let error = error {
      completion?(.failure(error))
    }
  }
  
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
