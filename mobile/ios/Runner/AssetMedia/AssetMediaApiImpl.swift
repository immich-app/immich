class AssetMediaApiImpl: ImmichPlugin, AssetMediaApi, FlutterPlugin {
  static let name = "AssetMediaApi"

  static func register(with registrar: FlutterPluginRegistrar) {
    let instance = AssetMediaApiImpl()
    AssetMediaApiSetup.setUp(binaryMessenger: registrar.messenger(), api: instance)
    registrar.publish(instance)
  }

  func detachFromEngine(for registrar: FlutterPluginRegistrar) {
    AssetMediaApiSetup.setUp(binaryMessenger: registrar.messenger(), api: nil)
    super.detachFromEngine()
  }

  func trash(ids: [String], completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void) {
    completeWhenActive(for: completion, with: .success(ids.map { AssetMediaActionResult(id: $0, status: .failed) }))
  }

  func restore(ids: [String], completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void) {
    completeWhenActive(for: completion, with: .success(ids.map { AssetMediaActionResult(id: $0, status: .failed) }))
  }

  func trashedAmong(ids: [String], completion: @escaping (Result<[String], Error>) -> Void) {
    completeWhenActive(for: completion, with: .success([]))
  }
}
