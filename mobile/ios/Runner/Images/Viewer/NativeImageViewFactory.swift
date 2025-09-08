import Foundation
import Flutter

public class NativeImageViewFactory: NSObject, FlutterPlatformViewFactory {
  public static let id = "native_image_view"
  
  private let messenger: FlutterBinaryMessenger
  
  init(messenger: FlutterBinaryMessenger) {
    self.messenger = messenger
  }
  
  public func create(
    withFrame frame: CGRect,
    viewIdentifier viewId: Int64,
    arguments args: Any?
  ) -> FlutterPlatformView {
    NativeImageView(
      frame: frame,
      viewIdentifier: viewId,
      arguments: args,
      binaryMessenger: messenger
    )
  }
  
  public func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
      return FlutterStandardMessageCodec.sharedInstance()
  }
}
