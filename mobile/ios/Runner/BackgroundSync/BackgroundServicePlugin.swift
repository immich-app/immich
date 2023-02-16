//
//  BackgroundServicePlugin.swift
//  Runner
//
//  Created by Marty Fuhry on 2/14/23.
//

import Flutter
import BackgroundTasks
import path_provider_foundation

class BackgroundServicePlugin: NSObject, FlutterPlugin {
    
    public static var flutterPluginRegistrantCallback: FlutterPluginRegistrantCallback?
    
    public static func setPluginRegistrantCallback(_ callback: FlutterPluginRegistrantCallback) {
        flutterPluginRegistrantCallback = callback
    }

  //  Pause the application in XCode, then enter
  // e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"immichBackgroundFetch"]
  // Then resume the application see the background code run
  // Tested on a physical device, not a simulator

    public static let backgroundSyncTaskID = "immichBackgroundFetch"
    public static let backgroundProcessingTaskID = "immichBackgroundProcessing"
    
    public static func register(with registrar: FlutterPluginRegistrar) {
        let channel = FlutterMethodChannel(
            name: "immich/foregroundChannel",
            binaryMessenger: registrar.messenger()
        )

        let instance = BackgroundServicePlugin()
        registrar.addMethodCallDelegate(instance, channel: channel)
        registrar.addApplicationDelegate(instance)
    }
    
    public static func register(engine: FlutterEngine) {
        GeneratedPluginRegistrant.register(with: engine)
    }

    public static func registerBackgroundProcessing() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: BackgroundServicePlugin.backgroundProcessingTaskID, using: nil) { task in
          handleBackgroundProcessing(task: task as! BGProcessingTask)
        }
        
        BGTaskScheduler.shared.register(forTaskWithIdentifier: BackgroundServicePlugin.backgroundSyncTaskID, using: nil) { task in
          handleBackgroundFetch(task: task as! BGAppRefreshTask)
        }
    }

    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
            case "enable":
                handleBackgroundEnable(call: call, result: result)
                break
            case "configure":
                handleConfigure(call: call, result: result)
                break
            case "disable":
                handleDisable(call: call, result: result)
                break
            case "isEnabled":
                handleIsEnabled(call: call, result: result)
                break
            case "isIgnoringBatteryOptimizations":
                result(FlutterMethodNotImplemented)
                break
            default:
                result(FlutterMethodNotImplemented)
                break
        }
    }
    
    public func handleBackgroundEnable(call: FlutterMethodCall, result: FlutterResult) {
        print("background enable called")

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
        
        BackgroundServicePlugin.scheduleBackgroundSync()
        result(true)
        
        print("registered callback handle \(callbackHandle) and notification \(notificationTitle)")
    }
    
    func handleIsEnabled(call: FlutterMethodCall, result: FlutterResult) {
        BackgroundServicePlugin.scheduleBackgroundSync()
        print("isEnabled called")
        
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

        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: BackgroundServicePlugin.backgroundProcessingTaskID)
        BackgroundServicePlugin.scheduleBackgroundSync()
        result(true)
    }
    
    func handleDisable(call: FlutterMethodCall, result: FlutterResult) {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: BackgroundServicePlugin.backgroundProcessingTaskID)
        result(true)
    }
  
    // Schedules a short-running background sync to sync only a few photos
    static func scheduleBackgroundFetch() {
        let backgroundFetch = BGAppRefreshTaskRequest(identifier: BackgroundServicePlugin.backgroundSyncTaskID)
        // Use 1 minute from now as earliest begin date
        backgroundFetch.earliestBeginDate = Date(timeIntervalSinceNow: 60)
        
        do {
            try BGTaskScheduler.shared.submit(backgroundFetch)
        } catch {
            print("Could not schedule the background task \(error.localizedDescription)")
        }
    }
    
    // Schedules a long-running background sync for syncing all of the photos
    static func scheduleBackgroundSync() {
        let backgroundProcessing = BGProcessingTaskRequest(identifier: BackgroundServicePlugin.backgroundProcessingTaskID)
        print("scheduled background sync")
        let defaults = UserDefaults.standard
        let requireCharging = defaults.value(forKey: "require_charging") as? Bool
        let requireUnmeteredNetwork = defaults.value(forKey: "require_unmetered_network") as? Bool
        
        backgroundProcessing.requiresNetworkConnectivity = requireUnmeteredNetwork ?? true
        backgroundProcessing.requiresExternalPower = requireCharging ?? true
                
        // Use 15 minutes from now as earliest begin date
        backgroundProcessing.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        
        do {
            try BGTaskScheduler.shared.submit(backgroundProcessing)
        } catch {
            print("Could not schedule the background task \(error.localizedDescription)")
        }
    }
    
    static func handleBackgroundFetch(task: BGAppRefreshTask) {
        print("handling background fetch")
        // Schedule the next sync task
        scheduleBackgroundFetch()
        
        BackgroundServicePlugin.runBackgroundSync(maxSeconds: 10)
        task.setTaskCompleted(success: true)
    }
    
    static func handleBackgroundProcessing(task: BGProcessingTask) {
        print("handling background processing")
        // Schedule the next sync task
        scheduleBackgroundSync()
        
        BackgroundServicePlugin.runBackgroundSync(maxSeconds: nil)
        task.setTaskCompleted(success: true)
    }
    
    static func runBackgroundSync(maxSeconds: Int?) {
        let semaphore = DispatchSemaphore(value: 0)
        DispatchQueue.main.async {
            let backgroundWorker = BackgroundSyncWorker { _ in
                semaphore.signal()
            }
            backgroundWorker.run(maxSeconds: maxSeconds)
        }
        semaphore.wait()
    }


}
