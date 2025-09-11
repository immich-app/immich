import Photos

class AssetRequest: Request {
  let assetId: String
  var completion: (PHAsset?) -> Void

  init(cancellationToken: CancellationToken, assetId: String, completion: @escaping (PHAsset?) -> Void) {
    self.assetId = assetId
    self.completion = completion
    super.init(cancellationToken: cancellationToken)
  }
}

class AssetResolver {
  private static let requestQueue = DispatchQueue(label: "assets.requests", qos: .userInitiated)
  private static let processingQueue = DispatchQueue(label: "assets.processing", qos: .userInitiated)

  private static var batchTimer: DispatchWorkItem?
  private static let batchLock = NSLock()
  private static let batchTimeout: TimeInterval = 0.001 // 1ms

  private static let fetchOptions = {
    let fetchOptions = PHFetchOptions()
    fetchOptions.wantsIncrementalChangeDetails = false
    return fetchOptions
  }()
  private static var assetRequests = [AssetRequest]()
  private static let assetCache = {
    let assetCache = NSCache<NSString, PHAsset>()
    assetCache.countLimit = 10000
    return assetCache
  }()

  static func requestAsset(request: AssetRequest) {
    requestQueue.async {
      if (request.isCancelled) {
        request.completion(nil)
      }

      if let cachedAsset = assetCache.object(forKey: request.assetId as NSString) {
        request.completion(cachedAsset)
        return
      }

      batchLock.lock()
      if (request.isCancelled) {
        batchLock.unlock()
        request.completion(nil)
        return
      }

      assetRequests.append(request)

      batchTimer?.cancel()
      let timer = DispatchWorkItem(block: processBatch)
      batchTimer = timer
      batchLock.unlock()

      processingQueue.asyncAfter(deadline: .now() + batchTimeout, execute: timer)
    }
  }

  private static func processBatch() {
    batchLock.lock()
    var completionMap = [String: [(PHAsset?) -> Void]]()
    var activeAssetIds = [String]()
    completionMap.reserveCapacity(assetRequests.count)
    activeAssetIds.reserveCapacity(assetRequests.count)
    for request in assetRequests {
      if (request.isCancelled) {
        request.completion(nil)
        continue
      }

      if var completions = completionMap[request.assetId] {
        completions.append(request.completion)
      } else {
        activeAssetIds.append(request.assetId)
        completionMap[request.assetId] = [request.completion]
      }
    }
    assetRequests.removeAll(keepingCapacity: true)
    batchTimer = nil
    batchLock.unlock()

    guard !activeAssetIds.isEmpty else { return }

    let assets = PHAsset.fetchAssets(withLocalIdentifiers: activeAssetIds, options: Self.fetchOptions)
    assets.enumerateObjects { asset, _, _ in
      let assetId = asset.localIdentifier
      for completion in completionMap.removeValue(forKey: assetId)! {
        completion(asset)
      }
      requestQueue.async { assetCache.setObject(asset, forKey: assetId as NSString) }
    }

    for completions in completionMap.values {
      for completion in completions {
        completion(nil)
      }
    }
  }
}
