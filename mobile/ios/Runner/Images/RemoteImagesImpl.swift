import Accelerate
import Flutter
import MobileCoreServices
import Photos

class RemoteImageRequest {
  weak var task: URLSessionDataTask?
  let id: Int64
  var isCancelled = false
  let completion: (Result<[String: Int64]?, any Error>) -> Void

  init(id: Int64, task: URLSessionDataTask, completion: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    self.id = id
    self.task = task
    self.completion = completion
  }
}

class RemoteImageApiImpl: NSObject, RemoteImageApi {
  private static var lock = os_unfair_lock()
  private static var requests = [Int64: RemoteImageRequest]()
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

  func requestImage(url: String, headers: [String : String], requestId: Int64, preferEncoded: Bool, completion: @escaping (Result<[String : Int64]?, any Error>) -> Void) {
    var urlRequest = URLRequest(url: URL(string: url)!)
    urlRequest.cachePolicy = .returnCacheDataElseLoad
    for (key, value) in headers {
      urlRequest.setValue(value, forHTTPHeaderField: key)
    }

    let task = URLSessionManager.shared.session.dataTask(with: urlRequest) { data, response, error in
      Self.handleCompletion(requestId: requestId, encoded: preferEncoded, data: data, response: response, error: error)
    }

    let request = RemoteImageRequest(id: requestId, task: task, completion: completion)

    os_unfair_lock_lock(&Self.lock)
    Self.requests[requestId] = request
    os_unfair_lock_unlock(&Self.lock)

    task.resume()
  }

  private static func handleCompletion(requestId: Int64, encoded: Bool, data: Data?, response: URLResponse?, error: Error?) {
    os_unfair_lock_lock(&Self.lock)
    guard let request = requests[requestId] else {
      return os_unfair_lock_unlock(&Self.lock)
    }
    requests[requestId] = nil
    os_unfair_lock_unlock(&Self.lock)

    if let error = error {
      if request.isCancelled || (error as NSError).code == NSURLErrorCancelled {
        return request.completion(ImageProcessing.cancelledResult)
      }
      return request.completion(.failure(error))
    }

    if request.isCancelled {
      return request.completion(ImageProcessing.cancelledResult)
    }

    guard let data = data else {
      return request.completion(.failure(PigeonError(code: "", message: "No data received", details: nil)))
    }

    ImageProcessing.queue.async {
      ImageProcessing.semaphore.wait()
      defer { ImageProcessing.semaphore.signal() }

      if request.isCancelled {
        return request.completion(ImageProcessing.cancelledResult)
      }

      // Return raw encoded bytes when requested (for animated images)
      if encoded {
        let length = data.count
        let pointer = malloc(length)!
        data.copyBytes(to: pointer.assumingMemoryBound(to: UInt8.self), count: length)

        if request.isCancelled {
          free(pointer)
          return request.completion(ImageProcessing.cancelledResult)
        }

        return request.completion(
          .success([
            "pointer": Int64(Int(bitPattern: pointer)),
            "length": Int64(length),
          ]))
      }

      guard let imageSource = CGImageSourceCreateWithData(data as CFData, nil),
            let cgImage = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, decodeOptions) else {
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

        request.completion(
          .success([
            "pointer": Int64(Int(bitPattern: buffer.data)),
            "width": Int64(buffer.width),
            "height": Int64(buffer.height),
            "rowBytes": Int64(buffer.rowBytes),
          ]))
      } catch {
        return request.completion(.failure(PigeonError(code: "", message: "Failed to convert image for request: \(error)", details: nil)))
      }
    }
  }

  func cancelRequest(requestId: Int64) {
    os_unfair_lock_lock(&Self.lock)
    let request = Self.requests[requestId]
    os_unfair_lock_unlock(&Self.lock)

    guard let request = request else { return }
    request.isCancelled = true
    request.task?.cancel()
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
