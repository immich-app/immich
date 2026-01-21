import Accelerate
import Flutter
import MobileCoreServices
import Photos

class RemoteImageRequest {
  weak var task: URLSessionDataTask?
  let id: Int64
  var isCancelled = false
  var data: CFMutableData?
  let completion: (Result<[String: Int64]?, any Error>) -> Void
  
  init(id: Int64, task: URLSessionDataTask, completion: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    self.id = id
    self.task = task
    self.data = nil
    self.completion = completion
  }
}

class RemoteImageApiImpl: NSObject, RemoteImageApi {
  private static let delegate = RemoteImageApiDelegate()
  static let session = {
    let config = URLSessionConfiguration.default
    let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
    config.httpAdditionalHeaders = ["User-Agent": "Immich_iOS_\(version)"]
    let thumbnailPath = FileManager.default.temporaryDirectory.appendingPathComponent("thumbnails", isDirectory: true)
    try! FileManager.default.createDirectory(at: thumbnailPath, withIntermediateDirectories: true)
    config.urlCache = URLCache(
      memoryCapacity: 0,
      diskCapacity: 1 << 30,
      directory: thumbnailPath
    )
    config.httpMaximumConnectionsPerHost = 16
    return URLSession(configuration: config, delegate: delegate, delegateQueue: nil)
  }()
  
  func requestImage(url: String, headers: [String : String], requestId: Int64, completion: @escaping (Result<[String : Int64]?, any Error>) -> Void) {
    var urlRequest = URLRequest(url: URL(string: url)!)
    for (key, value) in headers {
      urlRequest.setValue(value, forHTTPHeaderField: key)
    }
    let task = Self.session.dataTask(with: urlRequest)
    
    let imageRequest = RemoteImageRequest(id: requestId, task: task, completion: completion)
    Self.delegate.add(taskId: task.taskIdentifier, request: imageRequest)
    
    task.resume()
  }
  
  func cancelRequest(requestId: Int64) {
    Self.delegate.cancel(requestId: requestId)
  }
}

class RemoteImageApiDelegate: NSObject, URLSessionDataDelegate {
  private static let requestQueue = DispatchQueue(label: "thumbnail.requests", qos: .userInitiated, attributes: .concurrent)
  private static var rgbaFormat = vImage_CGImageFormat(
    bitsPerComponent: 8,
    bitsPerPixel: 32,
    colorSpace: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
    renderingIntent: .perceptual
  )!
  private static var requestByTaskId = [Int: RemoteImageRequest]()
  private static var taskIdByRequestId = [Int64: Int]()
  private static let cancelledResult = Result<[String: Int64]?, any Error>.success(nil)
  private static let decodeOptions = [
    kCGImageSourceShouldCache: false,
    kCGImageSourceShouldCacheImmediately: true,
    kCGImageSourceCreateThumbnailWithTransform: true,
  ] as CFDictionary
  
  func urlSession(
    _ session: URLSession, dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    guard let request = get(taskId: dataTask.taskIdentifier)
    else {
      return completionHandler(.cancel)
    }
    
    let capacity = max(Int(response.expectedContentLength), 0)
    request.data = CFDataCreateMutable(nil, capacity)
    
    completionHandler(.allow)
  }
  
  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask,
                  didReceive data: Data) {
    guard let request = get(taskId: dataTask.taskIdentifier) else { return }
    
    data.withUnsafeBytes { bytes in
      CFDataAppendBytes(request.data, bytes.bindMemory(to: UInt8.self).baseAddress, data.count)
    }
  }
  
  func urlSession(_ session: URLSession, task: URLSessionTask,
                  didCompleteWithError error: Error?) {
    guard let request = get(taskId: task.taskIdentifier) else { return }
        
    defer { remove(taskId: task.taskIdentifier, requestId: request.id) }
    
    if let error = error {
      if request.isCancelled || (error as NSError).code == NSURLErrorCancelled {
        return request.completion(Self.cancelledResult)
      }
      return request.completion(.failure(error))
    }
    
    guard let data = request.data else {
      return request.completion(.failure(PigeonError(code: "", message: "No data received", details: nil)))
    }
    
    guard let imageSource = CGImageSourceCreateWithData(data, nil),
          let cgImage = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, Self.decodeOptions) else {
      return request.completion(.failure(PigeonError(code: "", message: "Failed to decode image for request", details: nil)))
    }
    
    if request.isCancelled {
      return request.completion(Self.cancelledResult)
    }
    
    do {
      let buffer = try vImage_Buffer(cgImage: cgImage, format: Self.rgbaFormat)
      
      if request.isCancelled {
        buffer.free()
        return request.completion(Self.cancelledResult)
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
  
  @inline(__always) func get(taskId: Int) -> RemoteImageRequest? {
    Self.requestQueue.sync { Self.requestByTaskId[taskId] }
  }
  
  @inline(__always) func add(taskId: Int, request: RemoteImageRequest) -> Void {
    Self.requestQueue.async(flags: .barrier) {
      Self.requestByTaskId[taskId] = request
      Self.taskIdByRequestId[request.id] = taskId
    }
  }
  
  @inline(__always) func remove(taskId: Int, requestId: Int64) -> Void {
    Self.requestQueue.async(flags: .barrier) {
      Self.taskIdByRequestId[requestId] = nil
      Self.requestByTaskId[taskId] = nil
    }
  }
  
  @inline(__always) func cancel(requestId: Int64) -> Void {
    guard let request: RemoteImageRequest = (Self.requestQueue.sync {
      guard let taskId = Self.taskIdByRequestId[requestId] else { return nil }
      return Self.requestByTaskId[taskId]
    }) else { return }
    request.isCancelled = true
    request.task?.cancel()
  }
}
