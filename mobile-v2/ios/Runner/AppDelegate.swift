import UIKit
import Flutter

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    // Register piegon handler
    let controller: FlutterViewController = window?.rootViewController as! FlutterViewController
    ImHostServiceSetup.setUp(binaryMessenger: controller.binaryMessenger, api: ImHostServiceImpl())
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
