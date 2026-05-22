import Foundation

class PermissionApiImpl: PermissionApi {
  func hasManageMediaPermission() throws -> Bool {
    return false
  }

  func requestManageMediaPermission(completion: @escaping (Result<Bool, Error>) -> Void) {
    completion(.success(false))
  }

  func manageMediaPermission(completion: @escaping (Result<Bool, Error>) -> Void) {
    completion(.success(false))
  }
}
