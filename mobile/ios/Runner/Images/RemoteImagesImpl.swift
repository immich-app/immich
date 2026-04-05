import Accelerate
import Flutter
import MobileCoreServices
import Photos

class RemoteImageRequest: ImageRequest {
  private let operationLock = UnfairLock()
  weak var task: URLSessionDataTask?
  private weak var _operation: Operation?
  // This needs to be thread safe because operation is set from a background thread, while onCancel is called from the main thread
  weak var operation: Operation? {
    get { operationLock.withLock { _operation } }
    set { operationLock.withLock { _operation = newValue } }
  }

  init(task: URLSessionDataTask, completion: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
      self.task = task
      super.init(callback: completion)
    }

  override func onCancel() {
    task?.cancel()
    operation?.cancel()
  }
}

class RemoteImageApiImpl: NSObject, RemoteImageApi {
  private static let registry = RequestRegistry<RemoteImageRequest>()
  private static var rgbaFormat = vImage_CGImageFormat(
    bitsPerComponent: 8,
    bitsPerPixel: 32,
    colorSpace: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
    renderingIntent: .perceptual
  )!
  private static let decodeOptions = [
    kCGImageSourceShouldCache: false,
    kCGImageSourceShouldCacheImmediately: true,
    kCGImageSourceCreateThumbnailWithTransform: true,
    kCGImageSourceCreateThumbnailFromImageAlways: true
  ] as CFDictionary

  func requestImage(url: String, requestId: Int64, preferEncoded: Bool, completion: @escaping (Result<[String : Int64]?, any Error>) -> Void) {
    var urlRequest = URLRequest(url: URL(string: url)!)
    urlRequest.cachePolicy = .returnCacheDataElseLoad

    let task = URLSessionManager.shared.session.dataTask(with: urlRequest) { data, response, error in
      Self.handleCompletion(requestId: requestId, encoded: preferEncoded, data: data, response: response, error: error)
    }

    let request = RemoteImageRequest(task: task) { result in
      Self.registry.remove(requestId: requestId)
      completion(result)
    }

    Self.registry.add(requestId: requestId, request: request)

    task.resume()
  }

  private static func handleCompletion(requestId: Int64, encoded: Bool, data: Data?, response: URLResponse?, error: Error?) {
    guard let request = registry.get(requestId: requestId) else {
      return
    }

    if request.isCancelled { return }

    if let error = error {
      if (error as NSError).code == NSURLErrorCancelled {
        return request.finish(with: ImageProcessing.cancelledResult)
      }
      return request.finish(with: .failure(error))
    }

    guard let data = data else {
      return request.finish(with: .failure(PigeonError(code: "", message: "No data received", details: nil)))
    }

    let operation = BlockOperation {
      if request.isCancelled { return }

      // Return raw encoded bytes when requested (for animated images)
      if encoded {
        return request.finish(encoding: data)
      }

      guard let imageSource = CGImageSourceCreateWithData(data as CFData, nil),
            let cgImage = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, decodeOptions) else {
        return request.finish(with: .failure(PigeonError(code: "", message: "Failed to decode image for request", details: nil)))
      }

      if request.isCancelled { return }

      do {
        try request.finish(cgImage: cgImage, format: &rgbaFormat)
      } catch {
        return request.finish(with: .failure(PigeonError(code: "", message: "Failed to convert image for request: \(error)", details: nil)))
      }
    }

    request.operation = operation
    ImageProcessing.queue.addOperation(operation)
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
