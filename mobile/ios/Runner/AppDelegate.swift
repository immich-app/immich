import BackgroundTasks
import Flutter
import SQLiteData
import UIKit
import network_info_plus
import path_provider_foundation
import permission_handler_apple
import photo_manager
import shared_preferences_foundation

@main
@objc class AppDelegate: FlutterAppDelegate {
  private var backgroundCompletionHandlers: [String: () -> Void] = [:]

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Required for flutter_local_notification
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
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
        SharedPreferencesPlugin.register(
          with: registry.registrar(forPlugin: "org.cocoapods.shared-preferences-foundation")!
        )
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

  override func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    backgroundCompletionHandlers[identifier] = completionHandler
  }

  func completionHandler(forSession identifier: String) -> (() -> Void)? {
    return backgroundCompletionHandlers.removeValue(forKey: identifier)
  }

  public static func registerPlugins(with engine: FlutterEngine) {
    NativeSyncApiImpl.register(with: engine.registrar(forPlugin: NativeSyncApiImpl.name)!)
    ThumbnailApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: ThumbnailApiImpl())
    BackgroundWorkerFgHostApiSetup.setUp(binaryMessenger: engine.binaryMessenger, api: BackgroundWorkerApiImpl())

    let statusListener = StatusEventListener()
    StreamStatusStreamHandler.register(with: engine.binaryMessenger, streamHandler: statusListener)
    let progressListener = ProgressEventListener()
    StreamProgressStreamHandler.register(with: engine.binaryMessenger, streamHandler: progressListener)

    let dbUrl = try! FileManager.default.url(
      for: .documentDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    ).appendingPathComponent("immich.sqlite")
    let db = try! DatabasePool(path: dbUrl.path)
    let storeRepository = StoreRepository(db: db)
    let taskRepository = TaskRepository(db: db)

    UploadApiSetup.setUp(
      binaryMessenger: engine.binaryMessenger,
      api: UploadApiImpl(
        storeRepository: storeRepository,
        taskRepository: taskRepository,
        statusListener: statusListener,
        progressListener: progressListener
      )
    )
  }

  public static func cancelPlugins(with engine: FlutterEngine) {
    (engine.valuePublished(byPlugin: NativeSyncApiImpl.name) as? NativeSyncApiImpl)?.detachFromEngine()
  }
}
