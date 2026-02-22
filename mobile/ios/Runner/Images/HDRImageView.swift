import Flutter
import Photos
import UIKit

@available(iOS 17.0, *)
class HDRImageViewFactory: NSObject, FlutterPlatformViewFactory {
  static let viewTypeId = "immich/hdr_image_view"

  private let messenger: FlutterBinaryMessenger

  init(messenger: FlutterBinaryMessenger) {
    self.messenger = messenger
    super.init()
  }

  func create(withFrame frame: CGRect, viewIdentifier viewId: Int64, arguments args: Any?) -> FlutterPlatformView {
    return HDRImageViewController(frame: frame, viewId: viewId, messenger: messenger, args: args as? [String: Any])
  }

  func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
    return FlutterStandardMessageCodec.sharedInstance()
  }
}

@available(iOS 17.0, *)
class HDRImageViewController: NSObject, FlutterPlatformView {
  private let imageView: UIImageView
  private let channel: FlutterMethodChannel

  init(frame: CGRect, viewId: Int64, messenger: FlutterBinaryMessenger, args: [String: Any]?) {
    imageView = UIImageView(frame: frame)
    imageView.contentMode = .scaleAspectFit
    imageView.clipsToBounds = true
    imageView.preferredImageDynamicRange = .high
    imageView.backgroundColor = .clear
    imageView.isOpaque = false
    imageView.alpha = 0

    channel = FlutterMethodChannel(name: "immich/hdr_image_view/\(viewId)", binaryMessenger: messenger)

    super.init()

    guard let params = args else { return }
    let source = params["source"] as? String ?? ""

    if source == "local", let assetId = params["localAssetId"] as? String {
      loadLocalAsset(assetId: assetId)
    } else if source == "remote", let urlString = params["url"] as? String {
      let headers = params["headers"] as? [String: String] ?? [:]
      loadRemoteImage(urlString: urlString, headers: headers)
    }
  }

  func view() -> UIView {
    return imageView
  }

  private func loadLocalAsset(assetId: String) {
    let fetchOptions = PHFetchOptions()
    fetchOptions.fetchLimit = 1
    fetchOptions.wantsIncrementalChangeDetails = false

    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetId], options: fetchOptions).firstObject else {
      return
    }

    let requestOptions = PHImageRequestOptions()
    requestOptions.isNetworkAccessAllowed = true
    requestOptions.version = .current

    PHImageManager.default().requestImageDataAndOrientation(for: asset, options: requestOptions) { [weak self] data, _, _, _ in
      guard let self = self, let data = data else { return }
      self.decodeAndDisplay(data: data)
    }
  }

  private func loadRemoteImage(urlString: String, headers: [String: String]) {
    guard let url = URL(string: urlString) else { return }

    var request = URLRequest(url: url)
    request.cachePolicy = .returnCacheDataElseLoad
    for (key, value) in headers {
      request.setValue(value, forHTTPHeaderField: key)
    }

    let task = URLSessionManager.shared.session.dataTask(with: request) { [weak self] data, _, _ in
      guard let self = self, let data = data else { return }
      self.decodeAndDisplay(data: data)
    }
    task.resume()
  }

  private func decodeAndDisplay(data: Data) {
    var config = UIImageReader.Configuration()
    config.prefersHighDynamicRange = true
    let reader = UIImageReader(configuration: config)

    guard let image = reader.image(data: data) else { return }

    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      self.imageView.image = image
      self.imageView.alpha = 1
      self.channel.invokeMethod("onImageLoaded", arguments: nil)
    }
  }
}
