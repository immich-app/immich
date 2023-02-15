import UIKit
import Flutter
import BackgroundTasks

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

      GeneratedPluginRegistrant.register(with: self)

      print("calling to background service plugin")

      BackgroundServicePlugin.registerAppRefresh()
      
      return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
