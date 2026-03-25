import Accelerate
import Flutter
import MobileCoreServices
import Photos

class LocalImageRequest {
  weak var workItem: DispatchWorkItem?
  var isCancelled = false
  let callback: (Result<[String: Int64]?, any Error>) -> Void

  init(callback: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    self.callback = callback
  }
}

class LocalImageApiImpl: LocalImageApi {
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

  private static var rgbaFormat = vImage_CGImageFormat(
    bitsPerComponent: 8,
    bitsPerPixel: 32,
    colorSpace: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
    renderingIntent: .defaultIntent
  )!
  private static var requests = [Int64: LocalImageRequest]()
  private static let assetCache = {
    let assetCache = NSCache<NSString, PHAsset>()
    assetCache.countLimit = 10000
    return assetCache
  }()

  func getThumbhash(thumbhash: String, completion: @escaping (Result<[String : Int64], any Error>) -> Void) {
    ImageProcessing.queue.async {
      guard let data = Data(base64Encoded: thumbhash)
      else { return completion(.failure(PigeonError(code: "", message: "Invalid base64 string: \(thumbhash)", details: nil)))}

      let (width, height, pointer) = thumbHashToRGBA(hash: data)
      completion(.success([
        "pointer": Int64(Int(bitPattern: pointer.baseAddress)),
        "width": Int64(width),
        "height": Int64(height),
        "rowBytes": Int64(width * 4)
      ]))
    }
  }

  func requestImage(assetId: String, requestId: Int64, width: Int64, height: Int64, isVideo: Bool, preferEncoded: Bool, completion: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    let request = LocalImageRequest(callback: completion)
    let item = DispatchWorkItem {
      if request.isCancelled {
        return completion(ImageProcessing.cancelledResult)
      }

      ImageProcessing.semaphore.wait()
      defer {
        ImageProcessing.semaphore.signal()
      }

      if request.isCancelled {
        return completion(ImageProcessing.cancelledResult)
      }

      guard let asset = Self.requestAsset(assetId: assetId)
      else {
        Self.remove(requestId: requestId)
        completion(.failure(PigeonError(code: "", message: "Could not get asset data for \(assetId)", details: nil)))
        return
      }

      if request.isCancelled {
        return completion(ImageProcessing.cancelledResult)
      }

      if preferEncoded {
        let dataOptions = PHImageRequestOptions()
        dataOptions.isNetworkAccessAllowed = true
        dataOptions.isSynchronous = true
        dataOptions.version = .current

        var imageData: Data?
        Self.imageManager.requestImageDataAndOrientation(
          for: asset,
          options: dataOptions,
          resultHandler: { (data, _, _, _) in
            imageData = data
          }
        )

        if request.isCancelled {
          Self.remove(requestId: requestId)
          return completion(ImageProcessing.cancelledResult)
        }

        guard let data = imageData else {
          Self.remove(requestId: requestId)
          return completion(.failure(PigeonError(code: "", message: "Could not get image data for \(assetId)", details: nil)))
        }

        let length = data.count
        let pointer = malloc(length)!
        data.copyBytes(to: pointer.assumingMemoryBound(to: UInt8.self), count: length)

        if request.isCancelled {
          free(pointer)
          Self.remove(requestId: requestId)
          return completion(ImageProcessing.cancelledResult)
        }

        request.callback(.success([
          "pointer": Int64(Int(bitPattern: pointer)),
          "length": Int64(length),
        ]))
        Self.remove(requestId: requestId)
        return
      }

      var image: UIImage?
      Self.imageManager.requestImage(
        for: asset,
        targetSize: width > 0 && height > 0 ? CGSize(width: Double(width), height: Double(height)) : PHImageManagerMaximumSize,
        contentMode: .aspectFill,
        options: Self.requestOptions,
        resultHandler: { (_image, info) -> Void in
          image = _image
        }
      )

      if request.isCancelled {
        return completion(ImageProcessing.cancelledResult)
      }

      guard let image = image,
            let cgImage = image.cgImage else {
        Self.remove(requestId: requestId)
        return completion(.failure(PigeonError(code: "", message: "Could not get pixel data for \(assetId)", details: nil)))
      }

      if request.isCancelled {
        return completion(ImageProcessing.cancelledResult)
      }

      do {
        let buffer = try vImage_Buffer(cgImage: cgImage, format: Self.rgbaFormat)

        if request.isCancelled {
          buffer.free()
          return completion(ImageProcessing.cancelledResult)
        }

        request.callback(.success([
          "pointer": Int64(Int(bitPattern: buffer.data)),
          "width": Int64(buffer.width),
          "height": Int64(buffer.height),
          "rowBytes": Int64(buffer.rowBytes)
        ]))
        Self.remove(requestId: requestId)
      } catch {
        Self.remove(requestId: requestId)
        return completion(.failure(PigeonError(code: "", message: "Failed to convert image for \(assetId): \(error)", details: nil)))
      }
    }

    request.workItem = item
    Self.add(requestId: requestId, request: request)
    ImageProcessing.queue.async(execute: item)
  }

  func cancelRequest(requestId: Int64) {
    Self.cancel(requestId: requestId)
  }

  private static func add(requestId: Int64, request: LocalImageRequest) -> Void {
    requestQueue.sync { requests[requestId] = request }
  }

  private static func remove(requestId: Int64) -> Void {
    requestQueue.sync { requests[requestId] = nil }
  }

  private static func cancel(requestId: Int64) -> Void {
    requestQueue.async {
      guard let request = requests.removeValue(forKey: requestId) else { return }
      request.isCancelled = true
      guard let item = request.workItem else { return }
      if item.isCancelled {
        cancelQueue.async { request.callback(ImageProcessing.cancelledResult) }
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
}
