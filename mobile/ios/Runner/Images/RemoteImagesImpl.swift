import Accelerate
import Flutter
import MobileCoreServices
import Photos

class RemoteImageRequest: ImageRequest {
  weak var task: URLSessionDataTask?
  let id: Int64

  init(id: Int64, task: URLSessionDataTask, completion: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    self.id = id
    self.task = task
    super.init(callback: completion)
  }

  override func onCancel() {
    task?.cancel()
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

    let request = RemoteImageRequest(id: requestId, task: task) { result in
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
        request.finish(with: ImageProcessing.cancelledResult)
      } else {
        request.finish(with: .failure(error))
      }
      return
    }

    guard let data = data else {
      request.finish(with: .failure(PigeonError(code: "", message: "No data received", details: nil)))
      return
    }

    if encoded {
      let length = data.count
      let pointer = malloc(length)!
      data.copyBytes(to: pointer.assumingMemoryBound(to: UInt8.self), count: length)
      if !request.finish(with: .success([
        "pointer": Int64(Int(bitPattern: pointer)),
        "length": Int64(length),
      ])) {
        free(pointer)
      }
      return
    }

    ImageProcessing.queue.addOperation {
      if request.isCancelled { return }

      guard let imageSource = CGImageSourceCreateWithData(data as CFData, nil),
            let cgImage = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, decodeOptions) else {
        request.finish(with: .failure(PigeonError(code: "", message: "Failed to decode image for request", details: nil)))
        return
      }

      if request.isCancelled { return }

      do {
        let buffer = try vImage_Buffer(cgImage: cgImage, format: rgbaFormat)
        if !request.finish(with: .success([
          "pointer": Int64(Int(bitPattern: buffer.data)),
          "width": Int64(buffer.width),
          "height": Int64(buffer.height),
          "rowBytes": Int64(buffer.rowBytes),
        ])) {
          buffer.free()
        }
      } catch {
        request.finish(with: .failure(PigeonError(code: "", message: "Failed to convert image for request: \(error)", details: nil)))
      }
    }
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
