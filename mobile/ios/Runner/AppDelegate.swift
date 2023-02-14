import UIKit
import Flutter
import BackgroundTasks

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    
  let backgroundSyncTaskID = "app.alextran.immich-BackgroundSync"
    
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

    
      BGTaskScheduler.shared.register(forTaskWithIdentifier: backgroundSyncTaskID, using: nil) { task in
          self.handleBackgroundSync(task: task as! BGAppRefreshTask)
      }
      
      let controller: FlutterViewController = window?.rootViewController as! FlutterViewController
      let foregroundChannel = FlutterMethodChannel(
        name: "immich/foregroundChannel",
        binaryMessenger: controller.binaryMessenger
      )
      
      foregroundChannel.setMethodCallHandler({
        (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
          guard call.method == "enable" else {
              result(FlutterMethodNotImplemented)
              return
          }
          
          self.handleBackgroundEnable(call: call, result: result)
      })
      
      //  Pause the application in XCode, then enter
      // e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"app.alextran.immich-BackgroundSync"]
      // Then resume the application see the background code run
      // Tested on a physical device, not a simulator
      scheduleBackgroundSync()
      
      GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
    
    func handleBackgroundEnable(call: FlutterMethodCall, result: FlutterResult) {
        guard let args = call.arguments as? Array<Any> else {
            print("Cannot parse args as array: \(call.arguments)")
            result(FlutterMethodNotImplemented)
            return
        }
        
        guard args.count >= 2 else {
            print("Not enough arguments: \(call.arguments)")
            result(FlutterMethodNotImplemented)
            return
        }
        
        self.callbackHandle = args[0] as? Int64
        self.notificationTitle = args[1] as? String
        print("registered callback handle \(callbackHandle) and notification \(notificationTitle)")
    }
    
    var callbackHandle: Int64?
    var notificationTitle: String?
    
  func scheduleBackgroundSync() {
        let backgroundSync = BGAppRefreshTaskRequest(identifier: backgroundSyncTaskID)
        
        // Run 5 seconds from now
        backgroundSync.earliestBeginDate = Date(timeIntervalSinceNow: 5)
        
        do {
            try BGTaskScheduler.shared.submit(backgroundSync)
        } catch {
            print("Could not schedule the background task \(error.localizedDescription)")
        }
        
    }
    
    func handleBackgroundSync(task: BGAppRefreshTask) {
        // Schedule the next sync task
        scheduleBackgroundSync()
        
        // The background sync function to run
        guard let callbackHandle else {
            print("callbackHandle is nil \(callbackHandle)")
            return
        }
        
        BackgroundSyncManager.sync(callbackHandle: callbackHandle)
    }
}
