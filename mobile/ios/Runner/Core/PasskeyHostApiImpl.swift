import UIKit

class PasskeyHostApiImpl: PasskeyHostApi {
  func isSupported() throws -> Bool {
    if #available(iOS 16, *) {
      return true
    }
    return false
  }

  func register(options: String, completion: @escaping (Result<String?, Error>) -> Void) {
    run(completion) { try await $0.register(options) }
  }

  func authenticate(options: String, completion: @escaping (Result<String?, Error>) -> Void) {
    run(completion) { try await $0.authenticate(options) }
  }

  private func run(
    _ completion: @escaping (Result<String?, Error>) -> Void,
    _ operation: @escaping @MainActor (Passkeys) async throws -> String?
  ) {
    Task { @MainActor in
      let window = UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .flatMap { $0.windows }
        .first { $0.isKeyWindow }
      guard let window else {
        return completion(.failure(PigeonError(code: "NO_WINDOW", message: "Window not available", details: nil)))
      }

      do {
        completion(.success(try await operation(Passkeys(anchor: window))))
      } catch {
        completion(.failure(error))
      }
    }
  }
}
