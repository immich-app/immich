import Flutter
import UIKit
import Photos

// TODO: the bounds this uses for scaling can change with the hero animation,
// so it doesn't display the image correctly until swiping to the next asset and back
class NativeImageView: NSObject, FlutterPlatformView {
  private var _containerView: UIView
  private var _scrollView: UIScrollView
  private var _imageView: UIImageView
  private var _image: UIImage?
  private var _hasSetupZoom = false

  private static let imageManager = PHImageManager.default()
  private static let fetchOptions = {
    let fetchOptions = PHFetchOptions()
    fetchOptions.fetchLimit = 1
    fetchOptions.wantsIncrementalChangeDetails = false
    return fetchOptions
  }()
  private static let requestOptions = {
    let requestOptions = PHImageRequestOptions()
    requestOptions.isNetworkAccessAllowed = true
    requestOptions.deliveryMode = .opportunistic
    requestOptions.resizeMode = .none
    requestOptions.isSynchronous = false
    requestOptions.version = .current
    return requestOptions
  }()

  init(
    frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?,
    binaryMessenger messenger: FlutterBinaryMessenger
  ) {
    _containerView = UIView(frame: frame)
    _scrollView = UIScrollView()
    _imageView = UIImageView()
    super.init()

    setupViews()

    guard let arguments = args as? [String: Any],
          let assetId = arguments["assetId"] as? String else {
      print("Asset ID not provided")
      return
    }

    guard let asset = ThumbnailApiImpl.requestAsset(assetId: assetId) else {
      print("Asset not found for identifier: \(assetId)")
      return
    }

    loadImage(from: asset)
  }

  func view() -> UIView {
    return _containerView
  }

  private func setupViews() {
    // Configure image view
    _imageView.contentMode = .scaleAspectFit
    _imageView.preferredImageDynamicRange = .high
    if #available(iOS 17.0, *) {
      _imageView.layer.wantsExtendedDynamicRangeContent = true
      _imageView.layer.contentsFormat = .RGBA16Float
    }

    // Configure scroll view
    _scrollView.delegate = self
    _scrollView.showsVerticalScrollIndicator = false
    _scrollView.showsHorizontalScrollIndicator = false
    _scrollView.bouncesZoom = true
    _scrollView.decelerationRate = .fast
    _scrollView.contentInsetAdjustmentBehavior = .never
    _scrollView.backgroundColor = .clear

    // Add double tap gesture
    let doubleTapGesture = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTap(_:)))
    doubleTapGesture.numberOfTapsRequired = 2
    _scrollView.addGestureRecognizer(doubleTapGesture)

    // Setup view hierarchy
    _scrollView.addSubview(_imageView)
    _containerView.addSubview(_scrollView)

    // Setup constraints
    _scrollView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      _scrollView.topAnchor.constraint(equalTo: _containerView.topAnchor),
      _scrollView.leadingAnchor.constraint(equalTo: _containerView.leadingAnchor),
      _scrollView.trailingAnchor.constraint(equalTo: _containerView.trailingAnchor),
      _scrollView.bottomAnchor.constraint(equalTo: _containerView.bottomAnchor)
    ])

    // Observe bounds changes
    _containerView.addObserver(self, forKeyPath: "bounds", options: [.new], context: nil)
  }

  override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
    if keyPath == "bounds", let image = _image {
      DispatchQueue.main.async { [weak self] in
        self?.setupZoomScale(for: image)
      }
    }
  }

  deinit {
    _containerView.removeObserver(self, forKeyPath: "bounds")
  }

  private func loadImage(from asset: PHAsset) {
    Self.imageManager.requestImageDataAndOrientation(
      for: asset,
      options: Self.requestOptions
    ) { [weak self] data, uti, orientation, info in
      guard let data = data else { return }

      if #available(iOS 17.0, *) {
        var config = UIImageReader.Configuration()
        config.prefersHighDynamicRange = true
        let imageReader = UIImageReader(configuration: config)
        guard let image = imageReader.image(data: data) else { return }
        DispatchQueue.main.async {
          self?.setImage(image)
        }
      } else {
        guard let image = UIImage(data: data) else { return }
        DispatchQueue.main.async {
          self?.setImage(image)
        }
      }
    }
  }

  private func setImage(_ image: UIImage) {
    _image = image
    _imageView.image = image

    // Wait for next run loop to ensure layout is complete
    DispatchQueue.main.async { [weak self] in
      self?.setupZoomScale(for: image)
    }
  }

  private func setupZoomScale(for image: UIImage) {
    guard _scrollView.bounds.size.width > 0, _scrollView.bounds.size.height > 0 else {
      // View not laid out yet
      return
    }

    // Set image view size to match image
    _imageView.frame = CGRect(origin: .zero, size: image.size)
    _scrollView.contentSize = image.size

    // Calculate zoom scales
    let scrollViewSize = _scrollView.bounds.size
    let widthScale = scrollViewSize.width / image.size.width
    let heightScale = scrollViewSize.height / image.size.height
    let minScale = min(widthScale, heightScale)

    _scrollView.minimumZoomScale = minScale
    _scrollView.maximumZoomScale = max(2.0, minScale * 5.0)
    _scrollView.zoomScale = minScale

    centerImageView()
    _hasSetupZoom = true
  }

  private func centerImageView() {
    let scrollViewSize = _scrollView.bounds.size
    let imageViewSize = _imageView.frame.size

    let horizontalInset = max(0, (scrollViewSize.width - imageViewSize.width) / 2)
    let verticalInset = max(0, (scrollViewSize.height - imageViewSize.height) / 2)

    _scrollView.contentInset = UIEdgeInsets(
      top: verticalInset,
      left: horizontalInset,
      bottom: verticalInset,
      right: horizontalInset
    )
  }

  @objc private func handleDoubleTap(_ gesture: UITapGestureRecognizer) {
    guard _hasSetupZoom else { return }

    if _scrollView.zoomScale > _scrollView.minimumZoomScale {
      _scrollView.setZoomScale(_scrollView.minimumZoomScale, animated: true)
    } else {
      let tapLocation = gesture.location(in: _imageView)
      let zoomScale = min(_scrollView.maximumZoomScale, _scrollView.minimumZoomScale * 3.0)
      let zoomRect = zoomRectForScale(zoomScale, center: tapLocation)
      _scrollView.zoom(to: zoomRect, animated: true)
    }
  }

  private func zoomRectForScale(_ scale: CGFloat, center: CGPoint) -> CGRect {
    var zoomRect = CGRect.zero
    zoomRect.size.width = _scrollView.frame.size.width / scale
    zoomRect.size.height = _scrollView.frame.size.height / scale
    zoomRect.origin.x = center.x - (zoomRect.size.width / 2.0)
    zoomRect.origin.y = center.y - (zoomRect.size.height / 2.0)
    return zoomRect
  }
}

// MARK: - UIScrollViewDelegate
extension NativeImageView: UIScrollViewDelegate {
  func viewForZooming(in scrollView: UIScrollView) -> UIView? {
    return _imageView
  }

  func scrollViewDidZoom(_ scrollView: UIScrollView) {
    centerImageView()
  }
}
