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
  private let requestQueue: DispatchQueue
  private let processingQueue: DispatchQueue
  
  private var batchTimer: DispatchWorkItem?
  private let batchLock = NSLock()
  private let batchTimeout: TimeInterval
  
  private let fetchOptions: PHFetchOptions
  private var assetRequests = [AssetRequest]()
  private let assetCache: NSCache<NSString, PHAsset>
  
  init(
    fetchOptions: PHFetchOptions,
    batchTimeout: TimeInterval = 0.00025, // 250μs
    cacheSize: Int = 10000,
    qos: DispatchQoS = .unspecified
  ) {
    self.fetchOptions = fetchOptions
    self.batchTimeout = batchTimeout
    self.assetCache =  NSCache<NSString, PHAsset>()
    self.assetCache.countLimit = cacheSize
    self.requestQueue = DispatchQueue(label: "assets.requests", qos: qos)
    self.processingQueue = DispatchQueue(label: "assets.processing", qos: qos)
  }
  
  func requestAsset(request: AssetRequest) {
    requestQueue.async {
      if (request.isCancelled) {
        request.completion(nil)
        return
      }
      
      if let cachedAsset = self.assetCache.object(forKey: request.assetId as NSString) {
        request.completion(cachedAsset)
        return
      }
      
      self.batchLock.lock()
      if (request.isCancelled) {
        self.batchLock.unlock()
        request.completion(nil)
        return
      }
      
      self.assetRequests.append(request)
      
      self.batchTimer?.cancel()
      let timer = DispatchWorkItem(block: self.processBatch)
      self.batchTimer = timer
      self.batchLock.unlock()
      self.processingQueue.asyncAfter(deadline: .now() + self.batchTimeout, execute: timer)
    }
  }
  
  private func processBatch() {
    batchLock.lock()
    if assetRequests.isEmpty {
      batchTimer = nil
      batchLock.unlock()
      return
    }
    
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
    
    let assets = PHAsset.fetchAssets(withLocalIdentifiers: activeAssetIds, options: self.fetchOptions)
    assets.enumerateObjects { asset, _, _ in
      let assetId = asset.localIdentifier
      for completion in completionMap.removeValue(forKey: assetId)! {
        completion(asset)
      }
      self.requestQueue.async { self.assetCache.setObject(asset, forKey: assetId as NSString) }
    }
    
    for completions in completionMap.values {
      for completion in completions {
        completion(nil)
      }
    }
  }
}
