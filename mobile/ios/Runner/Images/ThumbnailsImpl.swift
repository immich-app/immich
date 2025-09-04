import CryptoKit
import Flutter
import MobileCoreServices
import Photos

class Request {
  weak var workItem: DispatchWorkItem?
  var isCancelled = false
  let callback: (Result<[String: Int64], any Error>) -> Void
  
  init(callback: @escaping (Result<[String: Int64], any Error>) -> Void) {
    self.callback = callback
  }
}

class ThumbnailApiImpl: ThumbnailApi {
  private static let imageManager = PHImageManager.default()
  private static let fetchOptions = {
    let fetchOptions = PHFetchOptions()
    fetchOptions.fetchLimit = 1
    fetchOptions.wantsIncrementalChangeDetails = false
    return fetchOptions
  }()
  private static let requestOptions = {
    let requestOptions = PHImageRequestOptions()
    requestOptions.isNetworkAccessAllowed = true
    requestOptions.deliveryMode = .highQualityFormat
    requestOptions.resizeMode = .fast
    requestOptions.isSynchronous = true
    requestOptions.version = .current
    return requestOptions
  }()
  
  private static let assetQueue = DispatchQueue(label: "thumbnail.assets", qos: .userInitiated)
  private static let requestQueue = DispatchQueue(label: "thumbnail.requests", qos: .userInitiated)
  private static let cancelQueue = DispatchQueue(label: "thumbnail.cancellation", qos: .default)
  private static let processingQueue = DispatchQueue(label: "thumbnail.processing", qos: .userInteractive, attributes: .concurrent)
  
  private static let rgbColorSpace = CGColorSpaceCreateDeviceRGB()
  private static let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue).rawValue
  private static var requests = [Int64: Request]()
  private static let cancelledResult = Result<[String: Int64], any Error>.success([:])
  private static let concurrencySemaphore = DispatchSemaphore(value: ProcessInfo.processInfo.activeProcessorCount * 2)
  private static let assetCache = {
    let assetCache = NSCache<NSString, PHAsset>()
    assetCache.countLimit = 10000
    return assetCache
  }()
  private static let activitySemaphore = DispatchSemaphore(value: 1)
  private static let willResignActiveObserver = NotificationCenter.default.addObserver(
    forName: UIApplication.willResignActiveNotification,
    object: nil,
    queue: .main
  ) { _ in
    processingQueue.suspend()
    activitySemaphore.wait()
  }
  private static let didBecomeActiveObserver = NotificationCenter.default.addObserver(
    forName: UIApplication.didBecomeActiveNotification,
    object: nil,
    queue: .main
  ) { _ in
    processingQueue.resume()
    activitySemaphore.signal()
  }
  
  func getThumbhash(thumbhash: String, completion: @escaping (Result<[String : Int64], any Error>) -> Void) {
    Self.processingQueue.async {
      guard let data = Data(base64Encoded: thumbhash)
      else { return completion(.failure(PigeonError(code: "", message: "Invalid base64 string: \(thumbhash)", details: nil)))}

      let (width, height, pointer) = thumbHashToRGBA(hash: data)
      self.waitForActiveState()
      completion(.success(["pointer": Int64(Int(bitPattern: pointer.baseAddress)), "width": Int64(width), "height": Int64(height)]))
    }
  }
  
  func requestImage(assetId: String, requestId: Int64, width: Int64, height: Int64, isVideo: Bool, completion: @escaping (Result<[String: Int64], any Error>) -> Void) {
    let request = Request(callback: completion)
    let item = DispatchWorkItem {
      if request.isCancelled {
        return completion(Self.cancelledResult)
      }
      
      Self.concurrencySemaphore.wait()
      defer {
        Self.concurrencySemaphore.signal()
      }
      
      if request.isCancelled {
        return completion(Self.cancelledResult)
      }
      
      guard let asset = Self.requestAsset(assetId: assetId)
      else {
        Self.removeRequest(requestId: requestId)
        completion(.failure(PigeonError(code: "", message: "Could not get asset data for \(assetId)", details: nil)))
        return
      }
      
      if request.isCancelled {
        return completion(Self.cancelledResult)
      }
      
      var image: UIImage?
      Self.imageManager.requestImage(
        for: asset,
        targetSize: CGSize(width: Double(width), height: Double(height)),
        contentMode: .aspectFill,
        options: Self.requestOptions,
        resultHandler: { (_image, info) -> Void in
          image = _image
        }
      )
      
      if request.isCancelled {
        return completion(Self.cancelledResult)
      }
      
      guard let image = image,
            let cgImage = image.cgImage else {
        Self.removeRequest(requestId: requestId)
        return completion(.failure(PigeonError(code: "", message: "Could not get pixel data for \(assetId)", details: nil)))
      }
      
      let pointer = UnsafeMutableRawPointer.allocate(
        byteCount: Int(cgImage.width) * Int(cgImage.height) * 4,
        alignment: MemoryLayout<UInt8>.alignment
      )
      
      if request.isCancelled {
        pointer.deallocate()
        return completion(Self.cancelledResult)
      }
      
      guard let context = CGContext(
        data: pointer,
        width: cgImage.width,
        height: cgImage.height,
        bitsPerComponent: 8,
        bytesPerRow: cgImage.width * 4,
        space: Self.rgbColorSpace,
        bitmapInfo: Self.bitmapInfo
      ) else {
        pointer.deallocate()
        Self.removeRequest(requestId: requestId)
        return completion(.failure(PigeonError(code: "", message: "Could not create context for \(assetId)", details: nil)))
      }
      
      if request.isCancelled {
        pointer.deallocate()
        return completion(Self.cancelledResult)
      }
      
      context.interpolationQuality = .none
      context.draw(cgImage, in: CGRect(x: 0, y: 0, width: cgImage.width, height: cgImage.height))
      
      if request.isCancelled {
        pointer.deallocate()
        return completion(Self.cancelledResult)
      }
      
      self.waitForActiveState()
      completion(.success(["pointer": Int64(Int(bitPattern: pointer)), "width": Int64(cgImage.width), "height": Int64(cgImage.height)]))
      Self.removeRequest(requestId: requestId)
    }
    
    request.workItem = item
    Self.addRequest(requestId: requestId, request: request)
    Self.processingQueue.async(execute: item)
  }
  
  func cancelImageRequest(requestId: Int64) {
    Self.cancelRequest(requestId: requestId)
  }
  
  private static func addRequest(requestId: Int64, request: Request) -> Void {
    requestQueue.sync { requests[requestId] = request }
  }
  
  private static func removeRequest(requestId: Int64) -> Void {
    requestQueue.sync { requests[requestId] = nil }
  }
  
  private static func cancelRequest(requestId: Int64) -> Void {
    requestQueue.async {
      guard let request = requests.removeValue(forKey: requestId) else { return }
      request.isCancelled = true
      guard let item = request.workItem else { return }
      if item.isCancelled {
        cancelQueue.async { request.callback(Self.cancelledResult) }
      }
    }
  }
  
  private static func requestAsset(assetId: String) -> PHAsset? {
    var asset: PHAsset?
    assetQueue.sync { asset = assetCache.object(forKey: assetId as NSString) }
    if asset != nil { return asset }
    
    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: Self.fetchOptions).firstObject
    else { return nil }
    assetQueue.async { assetCache.setObject(asset, forKey: assetId as NSString) }
    return asset
  }
  
  func waitForActiveState() {
    Self.activitySemaphore.wait()
    Self.activitySemaphore.signal()
  }
}
