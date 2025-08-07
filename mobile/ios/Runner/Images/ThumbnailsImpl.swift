import CryptoKit
import Flutter
import MobileCoreServices
import Photos

struct Request {
  var managerId: Int32?
  var workItem: DispatchWorkItem?
  var isCancelled = false
  let callback: (Result<[String: Int64], any Error>) -> Void
}

class ThumbnailApiImpl: ThumbnailApi {
  private static let cacheManager = PHImageManager.default()
  private static let fetchOptions = {
    let fetchOptions = PHFetchOptions()
    fetchOptions.fetchLimit = 1
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
  private static let processingQueue = DispatchQueue(label: "thumbnail.processing", qos: .userInteractive, attributes: .concurrent)
  private static let rgbColorSpace = CGColorSpaceCreateDeviceRGB()
  private static let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue).rawValue
  private static var requests = [Int64: Request]()
  private static let cancelledResult = Result<[String: Int64], any Error>.success([:])
  
  func requestImage(assetId: String, requestId: Int64, width: Int64, height: Int64, completion: @escaping (Result<[String: Int64], any Error>) -> Void) {
    var request = Request(callback: completion)
    let item = DispatchWorkItem {
      guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: Self.fetchOptions).firstObject
      else {
        Self.requests[requestId] = nil
        completion(.failure(PigeonError(code: "", message: "Could not get asset data for \(assetId)", details: nil)))
        return
      }
      
      request.managerId = Self.cacheManager.requestImage(
        for: asset,
        targetSize: CGSize(width: Double(width), height: Double(height)),
        contentMode: .aspectFit,
        options: Self.requestOptions,
        resultHandler: { (image, info) -> Void in
          defer { Self.requests[requestId] = nil }
          guard let image = image,
                let cgImage = image.cgImage else {
            return completion(.failure(PigeonError(code: "", message: "Could not get pixel data for \(assetId)", details: nil)))
          }
          
          if request.isCancelled {
            return completion(Self.cancelledResult)
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
          
          completion(.success(["pointer": Int64(Int(bitPattern: pointer)), "width": Int64(cgImage.width), "height": Int64(cgImage.height)]))
        }
      )
    }
    
    request.workItem = item
    Self.requests[requestId] = request
    Self.processingQueue.async(execute: item)
  }
  
  func cancelImageRequest(requestId: Int64) {
    guard var request = Self.requests.removeValue(forKey: requestId) else { return }
    request.isCancelled = true
    guard let item = request.workItem else { return }
    item.cancel()
    if item.isCancelled {
      request.callback(Self.cancelledResult)
    } else if let managerId = request.managerId {
      Self.cacheManager.cancelImageRequest(managerId)
    }
  }
}
