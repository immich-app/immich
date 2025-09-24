
class ConnectivityApiImpl: ConnectivityApi {
  func getCapabilities(completion: @escaping (Result<[NetworkCapability], any Error>) -> Void) {
    completion(Result.success([]))
  }
}
