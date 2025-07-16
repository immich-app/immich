import CryptoKit
import Flutter
import Photos
import MobileCoreServices

// https://stackoverflow.com/a/55839062
extension UIImage {
  func toData (options: NSDictionary?, type: ImageType) -> Data? {
    guard cgImage != nil else { return nil }
    return toData(options: options, type: type.value)
  }
  
  // about properties: https://developer.apple.com/documentation/imageio/1464962-cgimagedestinationaddimage
  func toData (options: NSDictionary?, type: CFString) -> Data? {
    guard let cgImage = cgImage else { return nil }
    return autoreleasepool { () -> Data? in
      let data = NSMutableData()
      guard let imageDestination = CGImageDestinationCreateWithData(data as CFMutableData, type, 1, nil) else { return nil }
      CGImageDestinationAddImage(imageDestination, cgImage, options)
      CGImageDestinationFinalize(imageDestination)
      return data as Data
    }
  }

  enum ImageType {
    case image // abstract image data
    case jpeg                       // JPEG image
    case jpeg2000                   // JPEG-2000 image
    case tiff                       // TIFF image
    case pict                       // Quickdraw PICT format
    case gif                        // GIF image
    case png                        // PNG image
    case quickTimeImage             // QuickTime image format (OSType 'qtif')
    case appleICNS                  // Apple icon data
    case bmp                        // Windows bitmap
    case ico                        // Windows icon data
    case rawImage                   // base type for raw image data (.raw)
    case scalableVectorGraphics     // SVG image
    case livePhoto                  // Live Photo
    
    var value: CFString {
      switch self {
      case .image: return kUTTypeImage
      case .jpeg: return kUTTypeJPEG
      case .jpeg2000: return kUTTypeJPEG2000
      case .tiff: return kUTTypeTIFF
      case .pict: return kUTTypePICT
      case .gif: return kUTTypeGIF
      case .png: return kUTTypePNG
      case .quickTimeImage: return kUTTypeQuickTimeImage
      case .appleICNS: return kUTTypeAppleICNS
      case .bmp: return kUTTypeBMP
      case .ico: return kUTTypeICO
      case .rawImage: return kUTTypeRawImage
      case .scalableVectorGraphics: return kUTTypeScalableVectorGraphics
      case .livePhoto: return kUTTypeLivePhoto
      }
    }
  }
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
    requestOptions.resizeMode = .exact
    requestOptions.isSynchronous = true
    requestOptions.version = .current
    return requestOptions
  }()
  private static let processingQueue = DispatchQueue(label: "thumbnail.processing", qos: .userInteractive, attributes: .concurrent)
  private static let imageCache = NSCache<NSString, FlutterStandardTypedData>()

  func requestThumbnail(
    assetId: String,
    width: Int64,
    height: Int64,
    completion: @escaping (Result<Int32, Error>) -> Void
  ) {
    Self.processingQueue.async {
      do {
        let asset = try self.getAsset(assetId: assetId)
        
        let requestId = Self.cacheManager.requestImage(
          for: asset,
          targetSize: CGSize(width: Double(width), height: Double(height)),
          contentMode: .aspectFill,
          options: Self.requestOptions,
          resultHandler: { (image, info) -> Void in
            guard let data = image?.toData(options: nil, type: .bmp) else { return }
            Self.imageCache.setObject(FlutterStandardTypedData(bytes: data), forKey: assetId as NSString)
          }
        )
        completion(.success(requestId))
      } catch {
        completion(.failure(PigeonError(code: "", message: "Could not get asset data", details: nil)))
      }
    }
  }
  
  func getThumbnail(assetId assetIdArg: String, width widthArg: Int64, height heightArg: Int64, completion: @escaping (Result<FlutterStandardTypedData?, PigeonError>) -> Void) {
  
  }

  func sendThumbnail(
    assetId: String,
    width: Int64,
    height: Int64,
    completion: @escaping (Result<FlutterStandardTypedData, Error>) -> Void
  ) {
    Self.processingQueue.async {
      do {
        let asset = try self.getAsset(assetId: assetId)
        
        Self.cacheManager.requestImage(
          for: asset,
          targetSize: CGSize(width: Double(width), height: Double(height)),
          contentMode: .aspectFill,
          options: Self.requestOptions,
          resultHandler: { (image, info) -> Void in
            guard let data = image?.toData(options: nil, type: .bmp) else { return }
            completion(.success(FlutterStandardTypedData(bytes: data)))
          }
        )
      } catch {
        completion(.failure(PigeonError(code: "", message: "Could not get asset data", details: nil)))
      }
    }
  }

  func cancel(requestId: Int32) {
    Self.cacheManager.cancelImageRequest(requestId as PHImageRequestID)
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
