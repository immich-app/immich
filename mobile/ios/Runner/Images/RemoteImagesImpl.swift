import Accelerate
import Flutter
import MobileCoreServices
import Photos

class RemoteImageRequest {
  weak var task: URLSessionDataTask?
  let id: Int64
  var isCancelled = false
  let completion: (Result<[String: Int64]?, any Error>) -> Void
  let url: String
  let isThumbnail: Bool
  
  init(id: Int64, task: URLSessionDataTask, url: String, isThumbnail: Bool, completion: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    self.id = id
    self.task = task
    self.url = url
    self.isThumbnail = isThumbnail
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
  
  func requestImage(url: String, headers: [String : String], requestId: Int64, isThumbnail: Bool, completion: @escaping (Result<[String : Int64]?, any Error>) -> Void) {
    var urlRequest = URLRequest(url: URL(string: url)!)
    urlRequest.cachePolicy = .returnCacheDataElseLoad
    for (key, value) in headers {
      urlRequest.setValue(value, forHTTPHeaderField: key)
    }
    
    let session = isThumbnail ? URLSessionManager.shared.thumbnailSession : URLSessionManager.shared.highResSession
    
    let task = session.dataTask(with: urlRequest) { data, response, error in
      Self.handleCompletion(requestId: requestId, data: data, response: response, error: error)
    }
    
    let request = RemoteImageRequest(id: requestId, task: task, url: url, isThumbnail: isThumbnail, completion: completion)
    
    os_unfair_lock_lock(&Self.lock)
    Self.requests[requestId] = request
    os_unfair_lock_unlock(&Self.lock)
    
    task.resume()
  }
  
  private static func handleCompletion(requestId: Int64, data: Data?, response: URLResponse?, error: Error?) {
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
    
    if !request.isThumbnail {
      URLSessionManager.shared.recordAccess(for: request.url)
    }
    
    ImageProcessing.queue.async {
      ImageProcessing.semaphore.wait()
      defer { ImageProcessing.semaphore.signal() }
      
      if request.isCancelled {
        return request.completion(ImageProcessing.cancelledResult)
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
  
  func clearThumbnailCache(completion: @escaping (Result<Int64, any Error>) -> Void) {
    Task {
      let size = URLSessionManager.shared.clearThumbnailCache()
      completion(.success(size))
    }
  }
  
  func clearHighResCache(completion: @escaping (Result<Int64, any Error>) -> Void) {
    Task {
      let size = URLSessionManager.shared.clearHighResCache()
      completion(.success(size))
    }
  }

  func getDualCacheStats(completion: @escaping (Result<DualCacheStats, any Error>) -> Void) {
    Task {
      let thumb = URLSessionManager.shared.thumbnailCacheStats()
      let highRes = URLSessionManager.shared.highResCacheStats()
      completion(.success(DualCacheStats(
        thumbnailSize: thumb.size,
        thumbnailCount: thumb.count,
        highResSize: highRes.size,
        highResCount: highRes.count
      )))
    }
  }
  
  func cleanupExpiredHighRes(maxAgeDays: Int64, completion: @escaping (Result<Int64, any Error>) -> Void) {
    Task {
      let cleared = URLSessionManager.shared.cleanupExpired(maxAgeDays: Int(maxAgeDays))
      completion(.success(cleared))
    }
  }
}
