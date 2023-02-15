//
//  BackgroundServicePlugin.swift
//  Runner
//
//  Created by Marty Fuhry on 2/14/23.
//

import Flutter
import BackgroundTasks

class BackgroundServicePlugin: NSObject, FlutterPlugin {
    

  //  Pause the application in XCode, then enter
  // e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"immichBackgroundFetch"]
  // Then resume the application see the background code run
  // Tested on a physical device, not a simulator

    var channel: FlutterMethodChannel? = nil

    public static let backgroundSyncTaskID = "immichBackgroundFetch"
    public static let backgroundProcessingTaskID = "immichBackgroundProcessing"
    
    public static func register(with registrar: FlutterPluginRegistrar) {
        print("registering with \(registrar)")
        let channel = FlutterMethodChannel(
            name: "immich/backgroundChannel",
            binaryMessenger: registrar.messenger()
        )
        
        let instance = BackgroundServicePlugin()
        instance.channel = channel
        registrar.addMethodCallDelegate(instance, channel: channel)
        registrar.addApplicationDelegate(instance)
    }
    
    public static func register(engine: FlutterEngine) {
        GeneratedPluginRegistrant.register(with: engine)
    }

    public static func registerAppRefresh() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: BackgroundServicePlugin.backgroundSyncTaskID, using: nil) { task in
          handleBackgroundSync(task: task as! BGAppRefreshTask)
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
            default:
                result(FlutterMethodNotImplemented)
        }
    }
    
    public func handleBackgroundEnable(call: FlutterMethodCall, result: FlutterResult) {
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
    
  
    static func scheduleBackgroundSync() {
        let backgroundSync = BGAppRefreshTaskRequest(identifier: BackgroundServicePlugin.backgroundSyncTaskID)
        
        // Run 5 seconds from now
        backgroundSync.earliestBeginDate = Date(timeIntervalSinceNow: 5)
        
        do {
            try BGTaskScheduler.shared.submit(backgroundSync)
        } catch {
            print("Could not schedule the background task \(error.localizedDescription)")
        }
    }
    
    static func handleBackgroundSync(task: BGAppRefreshTask) {
        print("handling background sync")
        // Schedule the next sync task
        scheduleBackgroundSync()
        
        BackgroundServicePlugin.runBackgroundSync()
        task.setTaskCompleted(success: true)
    }
    
    static func runBackgroundSync() {
        let semaphore = DispatchSemaphore(value: 0)
        DispatchQueue.main.async {
            BackgroundSyncManager.sync { _ in
                semaphore.signal()
            }
        }
        semaphore.wait()
    }


}
