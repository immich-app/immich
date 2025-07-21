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
    requestOptions.resizeMode = .exact
    requestOptions.isSynchronous = true
    requestOptions.version = .current
    return requestOptions
  }()
  private static let processingQueue = DispatchQueue(label: "thumbnail.processing", qos: .userInteractive, attributes: .concurrent)
  
  func setThumbnailToBuffer(pointer: Int64, assetId: String, width: Int64, height: Int64, completion: @escaping (Result<Void, any Error>) -> Void) {
    guard let bufferPointer = UnsafeMutableRawPointer(bitPattern: Int(pointer))
    else { completion(.failure(PigeonError(code: "", message: "Could not get buffer pointer for \(assetId)", details: nil))); return }
    Self.processingQueue.async {
      do {
        let asset = try self.getAsset(assetId: assetId)
        Self.cacheManager.requestImage(
          for: asset,
          targetSize: CGSize(width: Double(width), height: Double(height)),
          contentMode: .aspectFill,
          options: Self.requestOptions,
          resultHandler: { (image, info) -> Void in
            guard let image = image,
                  let cgImage = image.cgImage,
                  let dataProvider = cgImage.dataProvider,
                  let pixelData = dataProvider.data
            else { completion(.failure(PigeonError(code: "", message: "Could not get pixel data for \(assetId)", details: nil))); return }
            
            guard let sourceBuffer = CFDataGetBytePtr(pixelData)
            else { completion(.failure(PigeonError(code: "", message: "Could not get pixel data buffer for \(assetId)", details: nil))); return }
            let dataLength = CFDataGetLength(pixelData)
            let bufferLength = width * height * 4
            guard dataLength <= bufferLength
            else { completion(.failure(PigeonError(code: "", message: "Buffer is not large enough (\(bufferLength) vs \(dataLength) for \(assetId)", details: nil))); return }
            
            bufferPointer.copyMemory(from: sourceBuffer, byteCount: dataLength)
            completion(.success(()))
          }
        )
      } catch {
        completion(
          .failure(PigeonError(code: "", message: "Could not get asset data for \(assetId)", details: nil)))
      }
    }
  }
  
  private func getAsset(assetId: String) throws -> PHAsset {
    guard
      let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: Self.fetchOptions)
        .firstObject
    else {
      throw PigeonError(code: "", message: "Could not fetch asset", details: nil)
    }
    return asset
  }
}
