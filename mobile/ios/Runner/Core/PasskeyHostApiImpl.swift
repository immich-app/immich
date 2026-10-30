import AuthenticationServices
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

// AuthenticationServices has no WebAuthn JSON API, so the server's options and the credentials are mapped here
@MainActor
private final class Passkeys: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
  private static let decoder = {
    let decoder = JSONDecoder()
    decoder.dataDecodingStrategy = .custom { decoder in
      var base64 = try decoder.singleValueContainer().decode(String.self)
        .replacingOccurrences(of: "-", with: "+")
        .replacingOccurrences(of: "_", with: "/")
      base64 += String(repeating: "=", count: (4 - base64.count % 4) % 4)
      guard let data = Data(base64Encoded: base64) else {
        throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Invalid base64url"))
      }

      return data
    }
    return decoder
  }()

  private static let encoder = {
    let encoder = JSONEncoder()
    encoder.dataEncodingStrategy = .custom { data, encoder in
      var container = encoder.singleValueContainer()
      try container.encode(
        data.base64EncodedString()
          .replacingOccurrences(of: "+", with: "-")
          .replacingOccurrences(of: "/", with: "_")
          .replacingOccurrences(of: "=", with: "")
      )
    }
    return encoder
  }()

  private let anchor: ASPresentationAnchor
  private var continuation: CheckedContinuation<ASAuthorization, Error>?

  init(anchor: ASPresentationAnchor) {
    self.anchor = anchor
  }

  func register(_ json: String) async throws -> String? {
    let options = try Self.decoder.decode(CreationOptions.self, from: Data(json.utf8))
    let request = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: options.rp.id)
      .createCredentialRegistrationRequest(challenge: options.challenge, name: options.user.name, userID: options.user.id)
    request.displayName = options.user.displayName
    request.userVerificationPreference = .init(rawValue: options.authenticatorSelection.userVerification)
    request.attestationPreference = .init(rawValue: options.attestation)
    // A platform registration takes excludedCredentials from iOS 17.4. Without it the same device can register the
    // account again, and the server keeps adding passkeys for it
    if #available(iOS 17.4, *) {
      request.excludedCredentials = options.excludeCredentials.map {
        ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: $0.id)
      }
    }

    guard let credential: ASAuthorizationPlatformPublicKeyCredentialRegistration = try await perform(request) else {
      return nil
    }

    guard let attestationObject = credential.rawAttestationObject else {
      throw ASAuthorizationError(.invalidResponse)
    }

    let response = RegistrationResponse(clientDataJSON: credential.rawClientDataJSON, attestationObject: attestationObject)
    return try encode(credential, response)
  }

  func authenticate(_ json: String) async throws -> String? {
    let options = try Self.decoder.decode(RequestOptions.self, from: Data(json.utf8))
    let request = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: options.rpId)
      .createCredentialAssertionRequest(challenge: options.challenge)
    request.userVerificationPreference = .init(rawValue: options.userVerification)

    guard let credential: ASAuthorizationPlatformPublicKeyCredentialAssertion = try await perform(request) else {
      return nil
    }

    let response = AssertionResponse(
      clientDataJSON: credential.rawClientDataJSON,
      authenticatorData: credential.rawAuthenticatorData,
      signature: credential.signature,
      userHandle: credential.userID
    )
    return try encode(credential, response)
  }

  private func perform<T>(_ request: ASAuthorizationRequest) async throws -> T? {
    let controller = ASAuthorizationController(authorizationRequests: [request])
    controller.delegate = self
    controller.presentationContextProvider = self

    do {
      let authorization = try await withCheckedThrowingContinuation { continuation in
        self.continuation = continuation
        controller.performRequests()
      }

      guard let credential = authorization.credential as? T else {
        throw ASAuthorizationError(.invalidResponse)
      }

      return credential
    } catch ASAuthorizationError.canceled {
      return nil
    }
  }

  private func encode(_ credential: ASPublicKeyCredential, _ response: some Encodable) throws -> String {
    let json = PublicKeyCredential(id: credential.credentialID, rawId: credential.credentialID, response: response)
    return String(decoding: try Self.encoder.encode(json), as: UTF8.self)
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    continuation?.resume(returning: authorization)
    continuation = nil
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
    continuation?.resume(throwing: error)
    continuation = nil
  }

  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
    anchor
  }
}

private struct CreationOptions: Decodable {
  struct RelyingParty: Decodable {
    let id: String
  }

  struct User: Decodable {
    let id: Data
    let name: String
    let displayName: String
  }

  struct Credential: Decodable {
    let id: Data
  }

  struct Selection: Decodable {
    let userVerification: String
  }

  let challenge: Data
  let rp: RelyingParty
  let user: User
  let excludeCredentials: [Credential]
  let authenticatorSelection: Selection
  let attestation: String
}

private struct RequestOptions: Decodable {
  let challenge: Data
  let rpId: String
  let userVerification: String
}

private struct PublicKeyCredential<Response: Encodable>: Encodable {
  let id: Data
  let rawId: Data
  let type = "public-key"
  let response: Response
  let clientExtensionResults: [String: String] = [:]
}

private struct RegistrationResponse: Encodable {
  let clientDataJSON: Data
  let attestationObject: Data
}

private struct AssertionResponse: Encodable {
  let clientDataJSON: Data
  let authenticatorData: Data
  let signature: Data
  let userHandle: Data
}
