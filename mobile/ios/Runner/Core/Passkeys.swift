import AuthenticationServices

// AuthenticationServices has no WebAuthn JSON API, so the server's options and the credentials are mapped here
@MainActor
final class Passkeys: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
  private let anchor: ASPresentationAnchor
  private var continuation: CheckedContinuation<ASAuthorization, Error>?

  init(anchor: ASPresentationAnchor) {
    self.anchor = anchor
  }

  func register(_ json: String) async throws -> String? {
    let options = try JSONDecoder().decode(CreationOptions.self, from: Data(json.utf8))
    let request = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: options.rp.id)
      .createCredentialRegistrationRequest(challenge: options.challenge.data, name: options.user.name, userID: options.user.id.data)
    request.displayName = options.user.displayName
    request.userVerificationPreference = .init(rawValue: options.authenticatorSelection.userVerification)
    request.attestationPreference = .init(rawValue: options.attestation)
    if #available(iOS 17.4, *) {
      request.excludedCredentials = options.excludeCredentials.map {
        ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: $0.id.data)
      }
    }

    guard let credential: ASAuthorizationPlatformPublicKeyCredentialRegistration = try await perform(request) else {
      return nil
    }
    var response = ["clientDataJSON": credential.rawClientDataJSON.base64URLEncodedString()]
    response["attestationObject"] = credential.rawAttestationObject?.base64URLEncodedString()
    return try encode(credential, response)
  }

  func authenticate(_ json: String) async throws -> String? {
    let options = try JSONDecoder().decode(RequestOptions.self, from: Data(json.utf8))
    let request = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: options.rpId)
      .createCredentialAssertionRequest(challenge: options.challenge.data)
    request.userVerificationPreference = .init(rawValue: options.userVerification)

    guard let credential: ASAuthorizationPlatformPublicKeyCredentialAssertion = try await perform(request) else {
      return nil
    }
    return try encode(credential, [
      "clientDataJSON": credential.rawClientDataJSON.base64URLEncodedString(),
      "authenticatorData": credential.rawAuthenticatorData.base64URLEncodedString(),
      "signature": credential.signature.base64URLEncodedString(),
      "userHandle": credential.userID.base64URLEncodedString(),
    ])
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
      return authorization.credential as? T
    } catch ASAuthorizationError.canceled {
      return nil
    }
  }

  private func encode(_ credential: ASPublicKeyCredential, _ response: [String: String]) throws -> String {
    let id = credential.credentialID.base64URLEncodedString()
    let json: [String: Any] = [
      "id": id,
      "rawId": id,
      "type": "public-key",
      "response": response,
      "clientExtensionResults": [String: Any](),
    ]
    return try String(decoding: JSONSerialization.data(withJSONObject: json), as: UTF8.self)
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

private struct Base64URL: Decodable {
  let data: Data

  init(from decoder: Decoder) throws {
    var base64 = try decoder.singleValueContainer().decode(String.self)
      .replacingOccurrences(of: "-", with: "+")
      .replacingOccurrences(of: "_", with: "/")
    base64 += String(repeating: "=", count: (4 - base64.count % 4) % 4)
    guard let data = Data(base64Encoded: base64) else {
      throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Invalid base64url"))
    }
    self.data = data
  }
}

private struct CreationOptions: Decodable {
  struct RelyingParty: Decodable {
    let id: String
  }

  struct User: Decodable {
    let id: Base64URL
    let name: String
    let displayName: String
  }

  struct Credential: Decodable {
    let id: Base64URL
  }

  struct Selection: Decodable {
    let userVerification: String
  }

  let challenge: Base64URL
  let rp: RelyingParty
  let user: User
  let excludeCredentials: [Credential]
  let authenticatorSelection: Selection
  let attestation: String
}

private struct RequestOptions: Decodable {
  let challenge: Base64URL
  let rpId: String
  let userVerification: String
}

private extension Data {
  func base64URLEncodedString() -> String {
    base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }
}
