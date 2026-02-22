import Foundation
import UniformTypeIdentifiers
import native_video_player

enum ImportError: Error {
  case noFile
  case noViewController
  case keychainError(OSStatus)
  case cancelled
}

class NetworkApiImpl: NetworkApi {
  weak var viewController: UIViewController?
  private var activeImporter: CertImporter?
  
  init(viewController: UIViewController?) {
    self.viewController = viewController
  }
  
  func selectCertificate(promptText: ClientCertPrompt, completion: @escaping (Result<Void, any Error>) -> Void) {
    let importer = CertImporter(promptText: promptText, completion: { [weak self] result in
      self?.activeImporter = nil
      completion(result)
    }, viewController: viewController)
    activeImporter = importer
    importer.load()
  }

  func hasCertificate() throws -> Bool {
    let query: [String: Any] = [
      kSecClass as String: kSecClassIdentity,
      kSecAttrLabel as String: CLIENT_CERT_LABEL,
      kSecReturnRef as String: true,
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    return status == errSecSuccess
  }
  
  func removeCertificate(completion: @escaping (Result<Void, any Error>) -> Void) {
    let status = clearCerts()
    if status == errSecSuccess || status == errSecItemNotFound {
      return completion(.success(()))
    }
    completion(.failure(ImportError.keychainError(status)))
  }
  
  func addCertificate(clientData: ClientCertData, completion: @escaping (Result<Void, any Error>) -> Void) {
    let status = importCert(clientData: clientData.data.data, password: clientData.password)
    if status == errSecSuccess {
      return completion(.success(()))
    }
    completion(.failure(ImportError.keychainError(status)))
  }
  
  func getClientPointer() throws -> Int64 {
    let pointer = URLSessionManager.shared.sessionPointer
    return Int64(Int(bitPattern: pointer))
  }
  
  func setRequestHeaders(headers: [String : String], serverUrls: [String]) throws {
    var headers = headers
    if let token = headers.removeValue(forKey: "x-immich-user-token") {
      for serverUrl in serverUrls {
        guard let url = URL(string: serverUrl), let domain = url.host else { continue }
        let isSecure = serverUrl.hasPrefix("https")
        let cookies: [(String, String, Bool)] = [
          ("immich_access_token", token, true),
          ("immich_is_authenticated", "true", false),
          ("immich_auth_type", "password", true),
        ]
        let expiry = Date().addingTimeInterval(400 * 24 * 60 * 60)
        for (name, value, httpOnly) in cookies {
          var properties: [HTTPCookiePropertyKey: Any] = [
            .name: name,
            .value: value,
            .domain: domain,
            .path: "/",
            .expires: expiry,
          ]
          if isSecure { properties[.secure] = "TRUE" }
          if httpOnly { properties[.init("HttpOnly")] = "TRUE" }
          if let cookie = HTTPCookie(properties: properties) {
            URLSessionManager.cookieStorage.setCookie(cookie)
          }
        }
      }
    } else {
      URLSessionManager.cookieStorage.removeCookies(since: .distantPast)
    }

    if serverUrls.first != UserDefaults.group.string(forKey: SERVER_URL_KEY) {
      UserDefaults.group.set(serverUrls.first, forKey: SERVER_URL_KEY)
    }

    if headers != UserDefaults.group.dictionary(forKey: HEADERS_KEY) as? [String: String] {
      UserDefaults.group.set(headers, forKey: HEADERS_KEY)
      URLSessionManager.shared.recreateSession() // Recreate session to apply custom headers without app restart
    }
  }
}

private class CertImporter: NSObject, UIDocumentPickerDelegate {
  private let promptText: ClientCertPrompt
  private var completion: ((Result<Void, Error>) -> Void)
  private weak var viewController: UIViewController?

  init(promptText: ClientCertPrompt, completion: (@escaping (Result<Void, Error>) -> Void), viewController: UIViewController?) {
    self.promptText = promptText
    self.completion = completion
    self.viewController = viewController
  }
  
  func load() {
    guard let vc = viewController else { return completion(.failure(ImportError.noViewController)) }
    let picker = UIDocumentPickerViewController(forOpeningContentTypes: [
      UTType(filenameExtension: "p12")!,
      UTType(filenameExtension: "pfx")!,
    ])
    picker.delegate = self
    picker.allowsMultipleSelection = false
    vc.present(picker, animated: true)
  }
  
  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard let url = urls.first else {
      return completion(.failure(ImportError.noFile))
    }
    
    Task { @MainActor in
      do {
        let data = try readSecurityScoped(url: url)
        guard let password = await promptForPassword() else {
          return completion(.failure(ImportError.cancelled))
        }
        let status = importCert(clientData: data, password: password)
        if status != errSecSuccess {
          return completion(.failure(ImportError.keychainError(status)))
        }
        
        await URLSessionManager.shared.session.flush()
        self.completion(.success(()))
      } catch {
        completion(.failure(error))
      }
    }
  }
  
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    completion(.failure(ImportError.cancelled))
  }
  
  private func promptForPassword() async -> String? {
    guard let vc = viewController else { return nil }
    
    return await withCheckedContinuation { continuation in
      let alert = UIAlertController(
        title: promptText.title,
        message: promptText.message,
        preferredStyle: .alert
      )
      
      alert.addTextField { $0.isSecureTextEntry = true }
      
      alert.addAction(UIAlertAction(title: promptText.cancel, style: .cancel) { _ in
        continuation.resume(returning: nil)
      })
      
      alert.addAction(UIAlertAction(title: promptText.confirm, style: .default) { _ in
        continuation.resume(returning: alert.textFields?.first?.text ?? "")
      })
      
      vc.present(alert, animated: true)
    }
  }
  
  private func readSecurityScoped(url: URL) throws -> Data {
    guard url.startAccessingSecurityScopedResource() else {
      throw ImportError.noFile
    }
    defer { url.stopAccessingSecurityScopedResource() }
    return try Data(contentsOf: url)
  }
}

private func importCert(clientData: Data, password: String) -> OSStatus {
  let options = [kSecImportExportPassphrase: password] as CFDictionary
  var items: CFArray?
  let status = SecPKCS12Import(clientData as CFData, options, &items)
  
  guard status == errSecSuccess,
        let array = items as? [[String: Any]],
        let first = array.first,
        let identity = first[kSecImportItemIdentity as String] else {
    return status
  }
  
  clearCerts()
  
  let addQuery: [String: Any] = [
    kSecClass as String: kSecClassIdentity,
    kSecValueRef as String: identity,
    kSecAttrLabel as String: CLIENT_CERT_LABEL,
    kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
  ]
  return SecItemAdd(addQuery as CFDictionary, nil)
}

@discardableResult private func clearCerts() -> OSStatus {
  let deleteQuery: [String: Any] = [
    kSecClass as String: kSecClassIdentity,
    kSecAttrLabel as String: CLIENT_CERT_LABEL,
  ]
  return SecItemDelete(deleteQuery as CFDictionary)
}
