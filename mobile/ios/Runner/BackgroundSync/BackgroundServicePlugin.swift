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
    // e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"app.alextran.immich.backgroundFetch"]
    // or
    // e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"app.alextran.immich.backgroundProcessing"]
    // Then resume the application see the background code run
    // Tested on a physical device, not a simulator
    // This will submit either the Fetch or Processing command to the BGTaskScheduler for immediate processing.
    // In my tests, I can only get app.alextran.immich.backgroundProcessing simulated by running the above command
    
    // This is the task ID in Info.plist to register as our background task ID
    public static let backgroundFetchTaskID = "app.alextran.immich.backgroundFetch"
    public static let backgroundProcessingTaskID = "app.alextran.immich.backgroundProcessing"
    
    // Establish communication with the main isolate and set up the channel call
    // to this BackgroundServicePlugion()
    public static func register(with registrar: FlutterPluginRegistrar) {
        let channel = FlutterMethodChannel(
            name: "immich/foregroundChannel",
            binaryMessenger: registrar.messenger()
        )

        let instance = BackgroundServicePlugin()
        registrar.addMethodCallDelegate(instance, channel: channel)
        registrar.addApplicationDelegate(instance)
    }
    
    // Registers the Flutter engine with the plugins, used by the other Background Flutter engine
    public static func register(engine: FlutterEngine) {
        GeneratedPluginRegistrant.register(with: engine)
    }

    // Registers the task IDs from the system so that we can process them here in this class
    public static func registerBackgroundProcessing() {
 
        let processingRegisterd = BGTaskScheduler.shared.register(
            forTaskWithIdentifier: backgroundProcessingTaskID,
            using: nil) { task in
            if task is BGProcessingTask {
                handleBackgroundProcessing(task: task as! BGProcessingTask)
            }
        }
        
        let fetchRegisterd = BGTaskScheduler.shared.register(
            forTaskWithIdentifier: backgroundFetchTaskID,
            using: nil) { task in
            if task is BGAppRefreshTask {
                handleBackgroundFetch(task: task as! BGAppRefreshTask)
            }
        }
    }

    // Handles the channel methods from Flutter
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
            case "lastBackgroundFetchTime":
                let defaults = UserDefaults.standard
                let lastRunTime = defaults.value(forKey: "last_background_fetch_run_time")
                result(lastRunTime)
            case "lastBackgroundProcessingTime":
                let defaults = UserDefaults.standard
                let lastRunTime = defaults.value(forKey: "last_background_processing_run_time")
                result(lastRunTime)
            case "numberOfBackgroundProcesses":
                handleNumberOfProcesses(call: call, result: result)
            default:
                result(FlutterMethodNotImplemented)
                break
        }
    }
    
    // Called by the flutter code when enabled so that we can turn on the backround services
    // and save the callback information to communicate on this method channel
    public func handleBackgroundEnable(call: FlutterMethodCall, result: FlutterResult) {
        
        // Needs to parse the arguments from the method call
        guard let args = call.arguments as? Array<Any> else {
            print("Cannot parse args as array: \(call.arguments)")
            result(FlutterMethodNotImplemented)
            return
        }
        
        // Requires 3 arguments in the array
        guard args.count == 3 else {
            print("Requires 3 arguments and received \(args.count)")
            result(FlutterMethodNotImplemented)
            return
        }
                
        // Parses the arguments
        let callbackHandle = args[0] as? Int64
        let notificationTitle = args[1] as? String
        let instant = args[2] as? Bool
        
        // Write enabled to settings
        let defaults = UserDefaults.standard
        
        // We are now enabled, so store this
        defaults.set(true, forKey: "background_service_enabled")
        
        // The callback handle is an int64 address to communicate with the main isolate's
        // entry function
        defaults.set(callbackHandle, forKey: "callback_handle")
        
        // This is not used yet and will need to be implemented
        defaults.set(notificationTitle, forKey: "notification_title")
        
        // Schedule the background services if instant
        if (instant ?? true) {
            BackgroundServicePlugin.scheduleBackgroundSync()
            BackgroundServicePlugin.scheduleBackgroundFetch()
        }
        result(true)
    }
    
    // Called by the flutter code at launch to see if the background service is enabled or not
    func handleIsEnabled(call: FlutterMethodCall, result: FlutterResult) {
        let defaults = UserDefaults.standard
        let enabled = defaults.value(forKey: "background_service_enabled") as? Bool
        
        // False by default
        result(enabled ?? false)
    }
    
    // Called by the Flutter code whenever a change in configuration is set
    func handleConfigure(call: FlutterMethodCall, result: FlutterResult) {
        
        // Needs to be able to parse the arguments or else fail
        guard let args = call.arguments as? Array<Any> else {
            print("Cannot parse args as array: \(call.arguments)")
            result(FlutterError())
            return
        }
        
        // Needs to have 4 arguments in the call or else fail
        guard args.count == 4 else {
            print("Not enough arguments, 4 required: \(args.count) given")
            result(FlutterError())
            return
        }
        
        // Parse the arguments from the method call
        let requireUnmeteredNetwork = args[0] as? Bool
        let requireCharging = args[1] as? Bool
        let triggerUpdateDelay = args[2] as? Int
        let triggerMaxDelay = args[3] as? Int
        
        // Store the values from the call in the defaults
        let defaults = UserDefaults.standard
        defaults.set(requireUnmeteredNetwork, forKey: "require_unmetered_network")
        defaults.set(requireCharging, forKey: "require_charging")
        defaults.set(triggerUpdateDelay, forKey: "trigger_update_delay")
        defaults.set(triggerMaxDelay, forKey: "trigger_max_delay")

        // Cancel the background services and reschedule them
        BGTaskScheduler.shared.cancelAllTaskRequests()
        BackgroundServicePlugin.scheduleBackgroundSync()
        BackgroundServicePlugin.scheduleBackgroundFetch()
        result(true)
    }
    
    // Returns the number of currently scheduled background processes to Flutter, striclty
    // for debugging
    func handleNumberOfProcesses(call: FlutterMethodCall, result: @escaping FlutterResult) {
        BGTaskScheduler.shared.getPendingTaskRequests { requests in
            result(requests.count)
        }
    }
    
    // Disables the service, cancels all the task requests
    func handleDisable(call: FlutterMethodCall, result: FlutterResult) {
        let defaults = UserDefaults.standard
        defaults.set(false, forKey: "background_service_enabled")
        
        BGTaskScheduler.shared.cancelAllTaskRequests()
        result(true)
    }
  
    // Schedules a short-running background sync to sync only a few photos
    static func scheduleBackgroundFetch() {
        // We will only schedule this task to run if the user has explicitely allowed us to backup while
        // not connected to power
        let defaults = UserDefaults.standard
        if defaults.value(forKey: "require_charging") as? Bool == true {
            return
        }
                
        let backgroundFetch = BGAppRefreshTaskRequest(identifier: BackgroundServicePlugin.backgroundFetchTaskID)
        
        // Use 5 minutes from now as earliest begin date
        backgroundFetch.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60)
        
        do {
            try BGTaskScheduler.shared.submit(backgroundFetch)
        } catch {
            print("Could not schedule the background task \(error.localizedDescription)")
        }
    }
    
    // Schedules a long-running background sync for syncing all of the photos
    static func scheduleBackgroundSync() {
        let backgroundProcessing = BGProcessingTaskRequest(identifier: BackgroundServicePlugin.backgroundProcessingTaskID)
        
        // We need the values for requiring charging
        let defaults = UserDefaults.standard
        let requireCharging = defaults.value(forKey: "require_charging") as? Bool
        
        // Always require network connectivity, and set the require charging from the above
        backgroundProcessing.requiresNetworkConnectivity = true
        backgroundProcessing.requiresExternalPower = requireCharging ?? true
                
        // Use 15 minutes from now as earliest begin date
        backgroundProcessing.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        
        do {
            // Submit the task to the scheduler
            try BGTaskScheduler.shared.submit(backgroundProcessing)
        } catch {
            print("Could not schedule the background task \(error.localizedDescription)")
        }
    }
    
    // This function runs when the system kicks off the BGAppRefreshTask from the Background Task Scheduler
    static func handleBackgroundFetch(task: BGAppRefreshTask) {
        // Log the time of last background processing to now
        let defaults = UserDefaults.standard
        defaults.set(Date().timeIntervalSince1970, forKey: "last_background_fetch_run_time")
        
        // Schedule the next sync task so we can run this again later
        scheduleBackgroundFetch()
        
        // The background sync task should only run for 20 seconds at most
        BackgroundServicePlugin.runBackgroundSync(task, maxSeconds: 20)
    }
    
    // This function runs when the system kicks off the BGProcessingTask from the Background Task Scheduler
    static func handleBackgroundProcessing(task: BGProcessingTask) {
        // Log the time of last background processing to now
        let defaults = UserDefaults.standard
        defaults.set(Date().timeIntervalSince1970, forKey: "last_background_processing_run_time")
        
        // Schedule the next sync task so we run this again later
        scheduleBackgroundSync()
        
        // We won't specify a max time for the background sync service, so this can run for longer
        BackgroundServicePlugin.runBackgroundSync(task, maxSeconds: nil)
    }
    
    // This is a synchronous function which uses a semaphore to run the background sync worker's run
    // function, which will create a background Isolate and communicate with the Flutter code to back
    // up the assets. When it completes, we signal the semaphore and complete the execution allowing the
    // control to pass back to the caller synchronously
    static func runBackgroundSync(_ task: BGTask, maxSeconds: Int?) {

        let semaphore = DispatchSemaphore(value: 0)
        DispatchQueue.main.async {
            let backgroundWorker = BackgroundSyncWorker { _ in
                semaphore.signal()
            }
            task.expirationHandler = {
                backgroundWorker.cancel()
                task.setTaskCompleted(success: true)
            }
            
            backgroundWorker.run(maxSeconds: maxSeconds)
            task.setTaskCompleted(success: true)
        }
        semaphore.wait()
    }


}
