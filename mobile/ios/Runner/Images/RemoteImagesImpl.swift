import Accelerate
import Flutter
import MobileCoreServices
import Photos

class RemoteImageRequest {
  weak var task: URLSessionDataTask?
  var isCancelled = false
  let imageSource: CGImageSource
  var data: CFMutableData?
  let completion: (Result<[String: Int64], any Error>) -> Void
  
  init(task: URLSessionDataTask, imageSource: CGImageSource, completion: @escaping (Result<[String: Int64], any Error>) -> Void) {
    self.task = task
    self.imageSource = imageSource
    self.data = nil
    self.completion = completion
  }
}

class RemoteImageApiImpl: NSObject, RemoteImageApi {
  private static let delegate = RemoteImageApiDelegate()
  static let session = {
    let config = URLSessionConfiguration.default
    let thumbnailPath = FileManager.default.temporaryDirectory.appendingPathComponent("thumbnails", isDirectory: true)
    try! FileManager.default.createDirectory(at: thumbnailPath, withIntermediateDirectories: true)
    config.urlCache = URLCache(
      memoryCapacity: 0,
      diskCapacity: 10 << 20,
      directory: thumbnailPath
    )
    config.httpMaximumConnectionsPerHost = 16
    return URLSession(configuration: config, delegate: delegate, delegateQueue: nil)
  }()
  
  func requestImage(url: String, headers: [String : String], requestId: Int64, completion: @escaping (Result<[String : Int64], any Error>) -> Void) {
    print("Got image request \(requestId) for \(url)")
    var urlRequest = URLRequest(url: URL(string: url)!)
    for (key, value) in headers {
      urlRequest.setValue(value, forHTTPHeaderField: key)
    }
    let task = Self.session.dataTask(with: urlRequest)
    task.taskDescription = String(requestId)
    
    let imageRequest = RemoteImageRequest(
      task: task,
      imageSource: CGImageSourceCreateIncremental(
        [kCGImageSourceShouldCache: false] as CFDictionary),
      completion: completion
    )
    Self.delegate.add(requestId: requestId, request: imageRequest)
    
    task.resume()
    print("Started task for \(requestId)")
  }
  
  func cancelRequest(requestId: Int64) {
    print("Cancelling task for \(requestId)")
    Self.delegate.cancel(requestId: requestId)
  }
}

class RemoteImageApiDelegate: NSObject, URLSessionDataDelegate {
  private static let requestQueue = DispatchQueue(label: "thumbnail.requests", qos: .userInitiated)
  private static var rgbaFormat = vImage_CGImageFormat(
    bitsPerComponent: 8,
    bitsPerPixel: 32,
    colorSpace: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
    renderingIntent: .perceptual
  )!
  private static var requests = [Int64: RemoteImageRequest]()
  private static let cancelledResult = Result<[String: Int64], any Error>.success([:])
  
  func urlSession(
    _ session: URLSession, dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    guard let taskDescription = dataTask.taskDescription,
          let requestId = Int64(taskDescription),
          let request = (Self.requestQueue.sync { Self.requests[requestId] })
    else {
      return completionHandler(.cancel)
    }
    
    let capacity = max(Int(response.expectedContentLength), 0)
    request.data = CFDataCreateMutable(nil, capacity)
    
    completionHandler(.allow)
  }
  
  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask,
                  didReceive data: Data) {
    print("Got data")
    guard let taskDescription = dataTask.taskDescription,
          let requestId = Int64(taskDescription),
          let request = get(requestId: requestId),
          let accumulatedData = request.data
    else { return }
    
    data.withUnsafeBytes { bytes in
      CFDataAppendBytes(request.data, bytes.bindMemory(to: UInt8.self).baseAddress, data.count)
    }
    CGImageSourceUpdateData(request.imageSource, accumulatedData, false)
  }
  
  func urlSession(_ session: URLSession, task: URLSessionTask,
                  didCompleteWithError error: Error?) {
    print("Task ended")
    guard let taskDescription = task.taskDescription,
          let requestId = Int64(taskDescription),
          let request = get(requestId: requestId),
          let accumulatedData = request.data
    else { return }
    
    if let error = error {
      print("Task failed for \(requestId): \(error)")
      remove(requestId: requestId)
      return request.completion(.failure(error))
    }
    
    CGImageSourceUpdateData(request.imageSource, accumulatedData, true)
    
    let options = [kCGImageSourceShouldCacheImmediately: true] as CFDictionary
    guard let cgImage = CGImageSourceCreateImageAtIndex(request.imageSource, 0, nil) else {
      print("No image for \(requestId)")
      remove(requestId: requestId)
      return request.completion(.failure(PigeonError(code: "", message: "Failed to decode image for request \(requestId)", details: nil)))
    }
    print("Got image for \(requestId)")
    
    if request.isCancelled {
      remove(requestId: requestId)
      return request.completion(Self.cancelledResult)
    }
    
    do {
      let buffer = try vImage_Buffer(cgImage: cgImage, format: Self.rgbaFormat)
      
      if request.isCancelled {
        buffer.free()
        remove(requestId: requestId)
        return request.completion(Self.cancelledResult)
      }
      
      request.completion(
        .success([
          "pointer": Int64(Int(bitPattern: buffer.data)),
          "width": Int64(buffer.width),
          "height": Int64(buffer.height),
          "rowBytes": Int64(buffer.rowBytes),
        ]))
      print("Successful response for \(requestId)")
      
      remove(requestId: requestId)
    } catch {
      print("vImage conversion failed for \(requestId): \(error)")
      remove(requestId: requestId)
      return request.completion(.failure(PigeonError(code: "", message: "Failed to convert image for request \(requestId): \(error)", details: nil)))
    }
  }
  
  func get(requestId: Int64) -> RemoteImageRequest? {
    Self.requestQueue.sync { Self.requests[requestId] }
  }
  
  func add(requestId: Int64, request: RemoteImageRequest) -> Void {
    Self.requestQueue.sync { Self.requests[requestId] = request }
  }
  
  func remove(requestId: Int64) -> Void {
    Self.requestQueue.sync { Self.requests[requestId] = nil }
  }
  
  func cancel(requestId: Int64) -> Void {
    guard let request = (Self.requestQueue.sync { Self.requests[requestId] }) else { return }
    request.isCancelled = true
    request.task?.cancel()
  }
}
