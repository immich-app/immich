import BackgroundTasks
import Flutter
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
      UNUserNotificationCenter.current().delegate = self as? UNUserNotificationCenterDelegate
    }

    GeneratedPluginRegistrant.register(with: self)
    let controller: FlutterViewController = window?.rootViewController as! FlutterViewController
    AppDelegate.registerPlugins(with: controller.engine)
    BackgroundServicePlugin.register(with: self.registrar(forPlugin: "BackgroundServicePlugin")!)

    BackgroundServicePlugin.registerBackgroundProcessing()
    BackgroundWorkerApiImpl.registerBackgroundWorkers()

    BackgroundServicePlugin.setPluginRegistrantCallback { registry in
      if !registry.hasPlugin("org.cocoapods.path-provider-foundation") {
        PathProviderPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.path-provider-foundation")!)
      }

      if !registry.hasPlugin("org.cocoapods.photo-manager") {
        PhotoManagerPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.photo-manager")!)
      }

      if !registry.hasPlugin("org.cocoapods.shared-preferences-foundation") {
        SharedPreferencesPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.shared-preferences-foundation")!)
      }

      if !registry.hasPlugin("org.cocoapods.permission-handler-apple") {
        PermissionHandlerPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.permission-handler-apple")!)
      }

      if !registry.hasPlugin("org.cocoapods.network-info-plus") {
        FPPNetworkInfoPlusPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.network-info-plus")!)
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  public static func registerPlugins(with engine: FlutterEngine) {
    NativeSyncApiImpl.register(with: engine.registrar(forPlugin: NativeSyncApiImpl.name)!)
    ThumbnailApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: ThumbnailApiImpl())
    BackgroundWorkerFgHostApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: BackgroundWorkerApiImpl())
  }
  
  public static func cancelPlugins(with engine: FlutterEngine) {
    (engine.valuePublished(byPlugin: NativeSyncApiImpl.name) as? NativeSyncApiImpl)?.detachFromEngine()
  }
}
