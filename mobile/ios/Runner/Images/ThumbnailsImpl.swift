import CryptoKit
import Flutter
import MobileCoreServices
import Photos

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
  
  func setThumbnailToBuffer(assetId: String, width: Int64, height: Int64, completion: @escaping (Result<[String: Int64], any Error>) -> Void) {
    Self.processingQueue.async {
      guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: Self.fetchOptions).firstObject
      else { completion(.failure(PigeonError(code: "", message: "Could not get asset data for \(assetId)", details: nil))); return }
      
      Self.cacheManager.requestImage(
        for: asset,
        targetSize: CGSize(width: Double(width), height: Double(height)),
        contentMode: .aspectFit,
        options: Self.requestOptions,
        resultHandler: { (image, info) -> Void in
          guard let image = image,
                let cgImage = image.cgImage else {
            completion(.failure(PigeonError(code: "", message: "Could not get pixel data for \(assetId)", details: nil)))
            return
          }

          let pointer = UnsafeMutableRawPointer.allocate(
            byteCount: Int(cgImage.width) * Int(cgImage.height) * 4,
            alignment: MemoryLayout<UInt8>.alignment
          )
          
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
            completion(.failure(PigeonError(code: "", message: "Could not create context for \(assetId)", details: nil)))
            return
          }
          context.interpolationQuality = .none
          context.draw(cgImage, in: CGRect(x: 0, y: 0, width: cgImage.width, height: cgImage.height))
          completion(.success(["pointer": Int64(Int(bitPattern: pointer)), "width": Int64(cgImage.width), "height": Int64(cgImage.height)]))
        }
      )
    }
  }
}
