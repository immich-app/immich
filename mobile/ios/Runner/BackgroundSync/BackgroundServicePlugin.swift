//
//  BackgroundServicePlugin.swift
//  Runner
//
//  Created by Marty Fuhry on 2/14/23.
//

import Flutter
import BackgroundTasks
import path_provider_foundation
import CryptoKit
import Network

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
                break
            case "lastBackgroundProcessingTime":
                let defaults = UserDefaults.standard
                let lastRunTime = defaults.value(forKey: "last_background_processing_run_time")
                result(lastRunTime)
                break
            case "numberOfBackgroundProcesses":
                handleNumberOfProcesses(call: call, result: result)
                break
            case "backgroundAppRefreshEnabled":
                handleBackgroundRefreshStatus(call: call, result: result)
                break
            case "digestFiles":
                handleDigestFiles(call: call, result: result)
                break
            default:
                result(FlutterMethodNotImplemented)
                break
        }
    }
    
    // Calculates the SHA-1 hash of each file from the list of paths provided
    func handleDigestFiles(call: FlutterMethodCall, result: @escaping FlutterResult) {
        
        let bufsize = 2 * 1024 * 1024
        // Private error to throw if file cannot be read
        enum DigestError: String, LocalizedError {
            case NoFileHandle = "Cannot Open File Handle"

            public var errorDescription: String? { self.rawValue }
        }
        
        // Parse the arguments or else fail
        guard let args = call.arguments as? Array<String> else {
            print("Cannot parse args as array: \(String(describing: call.arguments))")
            result(FlutterError(code: "Malformed",
                                message: "Received args is not an Array<String>",
                                details: nil))
            return
        }
        
        // Compute hash in background thread
        DispatchQueue.global(qos: .background).async {
            var hashes: [FlutterStandardTypedData?] = Array(repeating: nil, count: args.count)
            for i in (0 ..< args.count) {
                do {
                    guard let file = FileHandle(forReadingAtPath: args[i]) else { throw DigestError.NoFileHandle }
                    var hasher = Insecure.SHA1.init();
                    while autoreleasepool(invoking: {
                        let chunk = file.readData(ofLength: bufsize)
                        guard !chunk.isEmpty else { return false } // EOF
                        hasher.update(data: chunk)
                        return true // continue
                    }) { }
                    let digest = hasher.finalize()
                    hashes[i] = FlutterStandardTypedData(bytes: Data(Array(digest.makeIterator())))
                } catch {
                    print("Cannot calculate the digest of the file \(args[i]) due to \(error.localizedDescription)")
                }
            }
            
            // Return result in main thread
            DispatchQueue.main.async {
                result(Array(hashes))
            }
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
        
        // Schedule the background services
        BackgroundServicePlugin.scheduleBackgroundSync()
        BackgroundServicePlugin.scheduleBackgroundFetch()

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
  
    // Checks the status of the Background App Refresh from the system
    // Returns true if the service is enabled for Immich, and false otherwise
    func handleBackgroundRefreshStatus(call: FlutterMethodCall, result: FlutterResult) {
        switch UIApplication.shared.backgroundRefreshStatus {
        case .available:
            result(true)
            break
        case .denied:
            result(false)
            break
        case .restricted:
            result(false)
            break
        default:
            result(false)
            break
        }
    }

    
    // Schedules a short-running background sync to sync only a few photos
    static func scheduleBackgroundFetch() {
        // We will schedule this task to run no matter the charging or wifi requirents from the end user
        // 1. They can set Background App Refresh to Off / Wi-Fi / Wi-Fi & Cellular Data from Settings
        // 2. We will check the battery connectivity when we begin running the background activity
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
        // Schedule the next sync task so we can run this again later
        scheduleBackgroundFetch()
        
        // Log the time of last background processing to now
        let defaults = UserDefaults.standard
        defaults.set(Date().timeIntervalSince1970, forKey: "last_background_fetch_run_time")
        
        // If we have required charging, we should check the charging status
        let requireCharging = defaults.value(forKey: "require_charging") as? Bool ?? false
        if (requireCharging) {
            UIDevice.current.isBatteryMonitoringEnabled = true
            if (UIDevice.current.batteryState == .unplugged) {
                // The device is unplugged and we have required charging
                // Therefore, we will simply complete the task without
                // running it.
                task.setTaskCompleted(success: true)
                return
            }
        }
        
        // If we have required Wi-Fi, we can check the isExpensive property
        let requireWifi = defaults.value(forKey: "require_wifi") as? Bool ?? false
        if (requireWifi) {
            let wifiMonitor = NWPathMonitor(requiredInterfaceType: .wifi)
            let isExpensive = wifiMonitor.currentPath.isExpensive
            if (isExpensive) {
                // The network is expensive and we have required Wi-Fi
                // Therfore, we will simply complete the task without
                // running it
                task.setTaskCompleted(success: true)
                return
            }
        }
        
        // Schedule the next sync task so we can run this again later
        scheduleBackgroundFetch()
        
        // The background sync task should only run for 20 seconds at most
        BackgroundServicePlugin.runBackgroundSync(task, maxSeconds: 20)
    }
    
    // This function runs when the system kicks off the BGProcessingTask from the Background Task Scheduler
    static func handleBackgroundProcessing(task: BGProcessingTask) {
        // Schedule the next sync task so we run this again later
        scheduleBackgroundSync()

        // Log the time of last background processing to now
        let defaults = UserDefaults.standard
        defaults.set(Date().timeIntervalSince1970, forKey: "last_background_processing_run_time")
        
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
