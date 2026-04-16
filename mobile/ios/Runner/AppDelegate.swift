import BackgroundTasks
import Flutter
import native_video_player
import network_info_plus
import path_provider_foundation
import permission_handler_apple
import photo_manager
import shared_preferences_foundation
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Required for flutter_local_notification
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self as UNUserNotificationCenterDelegate
    }

    SwiftNativeVideoPlayerPlugin.cookieStorage = URLSessionManager.cookieStorage
    URLSessionManager.patchBackgroundDownloader()
    GeneratedPluginRegistrant.register(with: self)
    let controller: FlutterViewController = window?.rootViewController as! FlutterViewController
    AppDelegate.registerPlugins(with: controller.engine, controller: controller)
    BackgroundWorkerApiImpl.registerBackgroundWorkers()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  public static func registerPlugins(with engine: FlutterEngine, controller: FlutterViewController?) {
    NativeSyncApiImpl.register(with: engine.registrar(forPlugin: NativeSyncApiImpl.name)!)
    LocalImageApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: LocalImageApiImpl())
    RemoteImageApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: RemoteImageApiImpl())
    BackgroundWorkerFgHostApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: BackgroundWorkerApiImpl())
    ConnectivityApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: ConnectivityApiImpl())
    NetworkApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: NetworkApiImpl(viewController: controller))
  }
  
  public static func cancelPlugins(with engine: FlutterEngine) {
    (engine.valuePublished(byPlugin: NativeSyncApiImpl.name) as? NativeSyncApiImpl)?.detachFromEngine()
  }
}
