import UIKit
import Flutter
import BackgroundTasks

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    
  let backgroundSyncTaskID = "immich.quick-sync"
  let backgroundProcessingTaskID = "immich.processing-sync"
    
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

    
      BGTaskScheduler.shared.register(forTaskWithIdentifier: backgroundSyncTaskID, using: nil) { task in
          self.handleBackgroundSync(task: task as! BGAppRefreshTask)
      }
      
      BGTaskScheduler.shared.register(forTaskWithIdentifier: backgroundProcessingTaskID, using: nil) { task in
          self.handleBackgroundProcessing(task: task as! BGProcessingTask)
      }
      
      let controller: FlutterViewController = window?.rootViewController as! FlutterViewController
      let foregroundChannel = FlutterMethodChannel(
        name: "immich/foregroundChannel",
        binaryMessenger: controller.binaryMessenger
      )
      
      foregroundChannel.setMethodCallHandler({
        (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
          if call.method == "enable" {
              print("handling background enable")

              self.handleBackgroundEnable(call: call, result: result)
              return
          }
          
          if call.method == "isEnabled" {
              print("handling background isEnabled")

              self.handleBackgroundEnable(call: call, result: result)
              return
          }
          
          print("call method \(call.method) is not supported")
          result(FlutterMethodNotImplemented)
      })
      
      //  Pause the application in XCode, then enter
      // e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"immich.quick-sync"]
      // Then resume the application see the background code run
      // Tested on a physical device, not a simulator
      scheduleBackgroundSync()
      scheduleBackgroundTask()
      
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
        
        let callbackHandle = args[0] as? Int64
        let notificationTitle = args[1] as? String
        
        let defaults = UserDefaults.standard
        defaults.set(callbackHandle, forKey: "callback_handle")
        defaults.set(notificationTitle, forKey: "notification_title")
        
        print("registered callback handle \(callbackHandle) and notification \(notificationTitle)")
    }
    
    func scheduleBackgroundTask() {
        let backgroundTask = BGProcessingTaskRequest(identifier: backgroundProcessingTaskID)
        backgroundTask.requiresExternalPower = true
        backgroundTask.requiresNetworkConnectivity = true
        
        backgroundTask.earliestBeginDate = Date(timeIntervalSinceNow: 60)
        do {
            try BGTaskScheduler.shared.submit(backgroundTask)
        } catch {
            print("Could not schedule the background processing task \(error.localizedDescription)")
        }
    }
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
        
        BackgroundSyncManager.sync()
    }
    
    func handleBackgroundProcessing(task: BGProcessingTask) {
        scheduleBackgroundTask()
        
        BackgroundSyncManager.sync()
    }
}
