import Photos

class AssetMediaApiImpl: ImmichPlugin, AssetMediaApi, FlutterPlugin {
  static let name = "AssetMediaApi"

  private var messenger: FlutterBinaryMessenger?

  static func register(with registrar: FlutterPluginRegistrar) {
    let instance = AssetMediaApiImpl()
    instance.messenger = registrar.messenger()
    AssetMediaApiSetup.setUp(binaryMessenger: registrar.messenger(), api: instance)
    registrar.publish(instance)
  }

  func detachFromEngine(for registrar: FlutterPluginRegistrar) {
    detachFromEngine()
  }

  override func detachFromEngine() {
    if let messenger {
      AssetMediaApiSetup.setUp(binaryMessenger: messenger, api: nil)
    }
    messenger = nil
    super.detachFromEngine()
  }

  // Trash and delete are the same on iOS
  func trash(ids: [String], completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void) {
    deleteAssets(ids: ids, completion: completion)
  }

  func delete(ids: [String], completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void) {
    deleteAssets(ids: ids, completion: completion)
  }


  func restore(ids: [String], completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void) {
    completeWhenActive(
      for: completion,
      with: .failure(
        PigeonError(
          code: kUnsupportedOs,
          message: "PhotoKit cannot restore assets from Recently Deleted",
          details: nil
        )
      )
    )
  }

  private func deleteAssets(
    ids: [String],
    completion: @escaping (Result<[AssetMediaActionResult], Error>) -> Void
  ) {
    guard !ids.isEmpty else {
      completeWhenActive(for: completion, with: .success([]))
      return
    }

    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self, !self.detached else { return }

      let assets = PHAsset.fetchAssets(withLocalIdentifiers: ids, options: nil)

      guard assets.count > 0 else {
        self.completeWhenActive(
          for: completion,
          with: .success(ids.map { AssetMediaActionResult(id: $0, status: .notFound) })
        )
        return
      }

      var seen = Set<String>()
      assets.enumerateObjects { asset, _, _ in seen.insert(asset.localIdentifier) }

      guard !self.detached else { return }

      PHPhotoLibrary.shared().performChanges {
        PHAssetChangeRequest.deleteAssets(assets)
      } completionHandler: { success, _ in
        let status: AssetMediaActionStatus = success ? .done : .failed
        let results = ids.map {
          AssetMediaActionResult(id: $0, status: seen.contains($0) ? status : .notFound)
        }
        self.completeWhenActive(for: completion, with: .success(results))
      }
    }
  }
}
