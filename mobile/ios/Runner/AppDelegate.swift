import UIKit
import Flutter
import BackgroundTasks

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    
  let backgroundSyncTaskID = "immichBackgroundFetch"
  let backgroundProcessingTaskID = "immichBackgroundProcessing"
    
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

      GeneratedPluginRegistrant.register(with: self)
    
      BGTaskScheduler.shared.register(forTaskWithIdentifier: backgroundSyncTaskID, using: nil) { task in
          self.handleBackgroundSync(task: task as! BGAppRefreshTask) { registry in
              GeneratedPluginRegistrant.register(with: registry)
          }
      }
      
      BGTaskScheduler.shared.register(forTaskWithIdentifier: backgroundProcessingTaskID, using: nil) { task in
          self.handleBackgroundProcessing(task: task as! BGProcessingTask)
      }
      
   
      
      //  Pause the application in XCode, then enter
      // e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"immichBackgroundFetch"]
      // Then resume the application see the background code run
      // Tested on a physical device, not a simulator

      
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
    
    func handleBackgroundEnable(call: FlutterMethodCall, result: FlutterResult) {
        guard let args = call.arguments as? Array<Any> else {
            print("Cannot parse args as array: \(call.arguments)")
            result(FlutterMethodNotImplemented)
            return
        }
        
        guard args.count == 3 else {
            print("Requires 3 arguments and received \(args.count)")
            result(FlutterMethodNotImplemented)
            return
        }
        
        let callbackHandle = args[0] as? Int64
        let notificationTitle = args[1] as? String
        let instant = args[2] as? Bool
        
        let defaults = UserDefaults.standard
        defaults.set(callbackHandle, forKey: "callback_handle")
        defaults.set(notificationTitle, forKey: "notification_title")
        
        self.scheduleBackgroundSync()
        self.scheduleBackgroundTask()
        result(true)
        
        print("registered callback handle \(callbackHandle) and notification \(notificationTitle)")
    }
    
    func handleIsEnabled(call: FlutterMethodCall, result: FlutterResult) {
        self.scheduleBackgroundSync()
        self.scheduleBackgroundTask()
        
        print("handled isEnabled")
        result(true)
    }
    
    func handleConfigure(call: FlutterMethodCall, result: FlutterResult) {
        guard let args = call.arguments as? Array<Any> else {
            print("Cannot parse args as array: \(call.arguments)")
            result(FlutterError())
            return
        }
        
        guard args.count == 4 else {
            print("Not enough arguments, 4 required: \(args.count) given")
            result(FlutterError())
            return
        }
        
        let requireUnmeteredNetwork = args[0] as? Bool
        let requireCharging = args[1] as? Bool
        let triggerUpdateDelay = args[2] as? Int
        let triggerMaxDelay = args[3] as? Int
        
        let defaults = UserDefaults.standard
        defaults.set(requireUnmeteredNetwork, forKey: "require_unmetered_network")
        defaults.set(requireCharging, forKey: "require_charging")
        defaults.set(triggerUpdateDelay, forKey: "trigger_update_delay")
        defaults.set(triggerMaxDelay, forKey: "trigger_max_delay")

        result(true)
    }
    
    func handleDisable(call: FlutterMethodCall, result: FlutterResult) {
        BGTaskScheduler.shared.cancelAllTaskRequests()
        
        result(true)
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
    
    func handleBackgroundSync(task: BGAppRefreshTask, _ callback: @escaping FlutterPluginRegistrantCallback) {
        print("handling background sync")
        // Schedule the next sync task
        scheduleBackgroundSync()
        
        runBackgroundSync(callback)
        task.setTaskCompleted(success: true)
    }
    
    func handleBackgroundProcessing(task: BGProcessingTask) {
        print("handling background processing")
        scheduleBackgroundTask()
        
        //runBackgroundSync()
        task.setTaskCompleted(success: true)
    }
    
    func runBackgroundSync(_ callback: FlutterPluginRegistrantCallback) {
        let semaphore = DispatchSemaphore(value: 0)
        DispatchQueue.main.async {
            BackgroundSyncManager.sync(flutterCallback: callback) { _ in
                semaphore.signal()
            }
        }
        semaphore.wait()
    }
}
