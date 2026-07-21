import Accelerate
import Flutter
import ImageIO
import MobileCoreServices
import Photos

final class RemoteImageRequest: ImageRequest {
  var task: URLSessionDataTask?
  let id: Int64

  init(id: Int64, completion: @escaping @Sendable (Result<[String: Int64]?, any Error>) -> Void) {
    self.id = id
    super.init(completion: completion)
  }

  override func cancel() {
    super.cancel()
    task?.cancel()
  }
}

class RemoteImageApiImpl: NSObject, RemoteImageApi {
  private static let registry = RequestRegistry<RemoteImageRequest>()
  private static let rgbaFormat = vImage_CGImageFormat(
    bitsPerComponent: 8,
    bitsPerPixel: 32,
    colorSpace: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
    renderingIntent: .perceptual
  )!
  private static let decodeOptions: [NSString: Any] = [
    kCGImageSourceShouldCache: false,
    kCGImageSourceShouldCacheImmediately: true,
    kCGImageSourceCreateThumbnailWithTransform: true,
    kCGImageSourceCreateThumbnailFromImageAlways: true
  ]

  func requestImage(url: String, requestId: Int64, preferEncoded: Bool, width: Int64?, height: Int64?, completion: @escaping (Result<[String : Int64]?, any Error>) -> Void) {
    var urlRequest = URLRequest(url: URL(string: url)!)
    urlRequest.cachePolicy = .returnCacheDataElseLoad

    let request = RemoteImageRequest(id: requestId, completion: completion)

    let task = URLSessionManager.shared.session.dataTask(with: urlRequest) { data, response, error in
      Self.handleCompletion(request: request, encoded: preferEncoded, width: width, height: height, data: data, response: response, error: error)
    }

    request.task = task
    Self.registry.add(requestId: requestId, request: request)
    task.resume()
  }

  private static func handleCompletion(request: RemoteImageRequest, encoded: Bool, width: Int64?, height: Int64?, data: Data?, response: URLResponse?, error: Error?) {
    if request.isCancelled {
      return request.completion(ImageProcessing.cancelledResult)
    }

    if let error = error {
      registry.remove(requestId: request.id)
      return request.completion(.failure(error))
    }

    guard let data = data else {
      registry.remove(requestId: request.id)
      return request.completion(.failure(PigeonError(code: "", message: "No data received", details: nil)))
    }

    if encoded {
      let length = data.count
      let pointer = malloc(length)!
      data.copyBytes(to: pointer.assumingMemoryBound(to: UInt8.self), count: length)

      if request.isCancelled {
        free(pointer)
        return request.completion(ImageProcessing.cancelledResult)
      }

      registry.remove(requestId: request.id)
      return request.completion(
        .success([
          "pointer": Int64(Int(bitPattern: pointer)),
          "length": Int64(length),
        ]))
    }

    ImageProcessing.queue.addOperation {
      if request.isCancelled {
        return request.completion(ImageProcessing.cancelledResult)
      }

      guard let imageSource = CGImageSourceCreateWithData(data as CFData, nil) else {
        registry.remove(requestId: request.id)
        return request.completion(.failure(PigeonError(code: "", message: "Failed to decode image for request", details: nil)))
      }

      var options = decodeOptions
      if let maxPixelSize = targetThumbnailRenderSize(imageSource: imageSource, width: width, height: height) {
        options[kCGImageSourceThumbnailMaxPixelSize] = maxPixelSize
      }

      guard let cgImage = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, options as CFDictionary) else {
        registry.remove(requestId: request.id)
        return request.completion(.failure(PigeonError(code: "", message: "Failed to decode image for request", details: nil)))
      }

      if request.isCancelled {
        return request.completion(ImageProcessing.cancelledResult)
      }

      do {
        let buffer = try vImage_Buffer(cgImage: cgImage, format: rgbaFormat)

        if request.isCancelled {
          buffer.free()
          return request.completion(ImageProcessing.cancelledResult)
        }

        registry.remove(requestId: request.id)
        return request.completion(
                 .success([
                   "pointer": Int64(Int(bitPattern: buffer.data)),
                   "width": Int64(buffer.width),
                   "height": Int64(buffer.height),
                   "rowBytes": Int64(buffer.rowBytes),
                 ]))
      } catch {
        registry.remove(requestId: request.id)
        return request.completion(.failure(PigeonError(code: "", message: "Failed to convert image for request: \(error)", details: nil)))
      }
    }
  }

  /// Returns the longest rendered edge needed to cover the requested size.
  private static func targetThumbnailRenderSize(imageSource: CGImageSource, width: Int64?, height: Int64?) -> Int? {
    guard let width,
          let height,
          width > 0,
          height > 0,
          let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [CFString: Any],
          let pixelWidth = properties[kCGImagePropertyPixelWidth] as? NSNumber,
          let pixelHeight = properties[kCGImagePropertyPixelHeight] as? NSNumber else {
      return nil
    }

    let orientation = (properties[kCGImagePropertyOrientation] as? NSNumber)
      .flatMap { CGImagePropertyOrientation(rawValue: $0.uint32Value) } ?? .up
    let swapsDimensions: Bool
    switch orientation {
    case .leftMirrored, .right, .rightMirrored, .left:
      swapsDimensions = true
    default:
      swapsDimensions = false
    }
    let sourceWidth = swapsDimensions ? pixelHeight.doubleValue : pixelWidth.doubleValue
    let sourceHeight = swapsDimensions ? pixelWidth.doubleValue : pixelHeight.doubleValue
    let fillScale = max(Double(width) / sourceWidth, Double(height) / sourceHeight)
    let scale = min(1, fillScale)
    return scale < 1 ? Int(ceil(max(sourceWidth * scale, sourceHeight * scale))) : nil
  }

  func cancelRequest(requestId: Int64) {
    Self.registry.remove(requestId: requestId)?.cancel()
  }

  func clearCache(completion: @escaping (Result<Int64, any Error>) -> Void) {
    Task {
      let cache = URLSessionManager.shared.session.configuration.urlCache!
      let cacheSize = Int64(cache.currentDiskUsage)
      cache.removeAllCachedResponses()
      completion(.success(cacheSize))
    }
  }
}
