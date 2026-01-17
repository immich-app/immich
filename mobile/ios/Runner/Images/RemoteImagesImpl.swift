import CoreImage
import CoreVideo
import Flutter
import MobileCoreServices
import Photos

class RemoteImageRequest {
  weak var task: URLSessionDataTask?
  var isCancelled = false
  var data: CFMutableData?
  let completion: (Result<[String: Int64], any Error>) -> Void
  
  init(task: URLSessionDataTask, completion: @escaping (Result<[String: Int64], any Error>) -> Void) {
    self.task = task
    self.data = nil
    self.completion = completion
  }
}

class RemoteImageApiImpl: NSObject, RemoteImageApi {
  private static let delegate = RemoteImageApiDelegate()
  static let session = {
    let config = URLSessionConfiguration.default
    let thumbnailPath = FileManager.default.temporaryDirectory.appendingPathComponent("thumbnails2", isDirectory: true)
    try! FileManager.default.createDirectory(at: thumbnailPath, withIntermediateDirectories: true)
    config.urlCache = URLCache(
      memoryCapacity: 0,
      diskCapacity: 1 << 30,
      directory: thumbnailPath
    )
    config.httpMaximumConnectionsPerHost = 16
    return URLSession(configuration: config, delegate: delegate, delegateQueue: nil)
  }()
  
  func requestImage(url: String, headers: [String : String], requestId: Int64, completion: @escaping (Result<[String : Int64], any Error>) -> Void) {
    var urlRequest = URLRequest(url: URL(string: url)!)
    for (key, value) in headers {
      urlRequest.setValue(value, forHTTPHeaderField: key)
    }
    let task = Self.session.dataTask(with: urlRequest)
    task.taskDescription = String(requestId)
    
    let imageRequest = RemoteImageRequest(task: task, completion: completion)
    Self.delegate.add(requestId: requestId, request: imageRequest)
    
    task.resume()
  }
  
  func cancelRequest(requestId: Int64) {
    Self.delegate.cancel(requestId: requestId)
    Self.delegate.releasePixelBuffer(requestId: requestId)
  }
  
  func releaseImage(requestId: Int64) {
    Self.delegate.releasePixelBuffer(requestId: requestId)
  }
}

class RemoteImageApiDelegate: NSObject, URLSessionDataDelegate {
  private static let requestQueue = DispatchQueue(label: "thumbnail.requests", qos: .userInitiated)
  private static var requests = [Int64: RemoteImageRequest]()
  private static var lockedPixelBuffers = [Int64: CVPixelBuffer]()
  private static let cancelledResult = Result<[String: Int64], any Error>.success([:])
  private static let ciContext = CIContext(options: [.useSoftwareRenderer: false])
  
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
    guard let taskDescription = dataTask.taskDescription,
          let requestId = Int64(taskDescription),
          let request = get(requestId: requestId)
    else { return }
    
    data.withUnsafeBytes { bytes in
      CFDataAppendBytes(request.data, bytes.bindMemory(to: UInt8.self).baseAddress, data.count)
    }
  }
  
  func urlSession(_ session: URLSession, task: URLSessionTask,
                  didCompleteWithError error: Error?) {
    guard let taskDescription = task.taskDescription,
          let requestId = Int64(taskDescription),
          let request = get(requestId: requestId),
          let data = request.data
    else { return }
    
    defer { remove(requestId: requestId) }
    
    if let error = error {
      if request.isCancelled || (error as NSError).code == NSURLErrorCancelled {
        return request.completion(Self.cancelledResult)
      }
      return request.completion(.failure(error))
    }
    
    guard let ciImage = CIImage(data: data as Data, options: [.applyOrientationProperty: true]) else {
      return request.completion(.failure(PigeonError(code: "", message: "Failed to decode image for request \(requestId)", details: nil)))
    }
    
    if request.isCancelled {
      return request.completion(Self.cancelledResult)
    }
    
    let extent = ciImage.extent
    let width = Int(extent.width)
    let height = Int(extent.height)
    
    guard width > 0 && height > 0 else {
      return request.completion(.failure(PigeonError(code: "", message: "Invalid image dimensions \(width)x\(height) for request \(requestId)", details: nil)))
    }
    
    var pixelBuffer: CVPixelBuffer?
    let attrs: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
      kCVPixelBufferIOSurfacePropertiesKey as String: [:],
    ]
    let status = CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA, attrs as CFDictionary, &pixelBuffer)
    
    guard status == kCVReturnSuccess, let pixelBuffer = pixelBuffer else {
      return request.completion(.failure(PigeonError(code: "", message: "Failed to create pixel buffer for request \(requestId), status: \(status)", details: nil)))
    }
    
    if request.isCancelled {
      return request.completion(Self.cancelledResult)
    }
    
    Self.ciContext.render(ciImage, to: pixelBuffer)
    
    CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    guard let pointer = CVPixelBufferGetBaseAddress(pixelBuffer) else {
      CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
      return request.completion(.failure(PigeonError(code: "", message: "Failed to lock pixel buffer for request \(requestId)", details: nil)))
    }
    
    let rowBytes = CVPixelBufferGetBytesPerRow(pixelBuffer)
    
    Self.requestQueue.sync {
      Self.lockedPixelBuffers[requestId] = pixelBuffer
    }
    
    request.completion(
      .success([
        "pointer": Int64(Int(bitPattern: pointer)),
        "width": Int64(width),
        "height": Int64(height),
        "rowBytes": Int64(rowBytes),
      ]))
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
  
  func releasePixelBuffer(requestId: Int64) -> Void {
    guard let pixelBuffer = (Self.requestQueue.sync { Self.lockedPixelBuffers.removeValue(forKey: requestId) }) else { return }
    CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
  }
}
