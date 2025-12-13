//
//  BackgroundSyncProcessing.swift
//  Runner
//
//  Created by Marty Fuhry on 2/6/23.
//
// Credit to https://github.com/fluttercommunity/flutter_workmanager/blob/main/ios/Classes/BackgroundWorker.swift

import Foundation
import Flutter
import BackgroundTasks

// The background worker which creates a new Flutter VM, communicates with it
// to run the backup job, and then finishes execution and calls back to its callback
// handler
class BackgroundSyncWorker {

    // The Flutter engine we create for background execution.
    // This is not the main Flutter engine which shows the UI,
    // this is a brand new isolate created and managed in this code
    // here. It does not share memory with the main
    // Flutter engine which shows the UI.
    // It needs to be started up, registered, and torn down here
    let engine: FlutterEngine? = FlutterEngine(
        name: "BackgroundImmich"
    )
    
    let notificationId = "com.alextran.immich/backgroundNotifications"
    // The background message passing channel
    var channel: FlutterMethodChannel?
    
    var completionHandler: (UIBackgroundFetchResult) -> Void
    let taskSessionStart = Date()
    
    // We need the completion handler to tell the system when we are done running
    init(_ completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        
        // This is the background message passing channel to be used with the background engine
        // created here in this platform code
        self.channel = FlutterMethodChannel(
            name: "immich/backgroundChannel",
            binaryMessenger: engine!.binaryMessenger
        )
        self.completionHandler = completionHandler
    }
    
    // Handles all of the messages from the Flutter VM called into this platform code
    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "initialized":
            // Initialize tells us that we can now call into the Flutter VM to tell it to begin the update
            self.channel?.invokeMethod(
                "backgroundProcessing",
                arguments: nil,
                result: { flutterResult in
                    
                    // This is the result we send back to the BGTaskScheduler to let it know whether we'll need more time later or
                    // if this execution failed
                    let result: UIBackgroundFetchResult = (flutterResult as? Bool ?? false) ? .newData : .failed
                    
                    // Show the task duration
                    let taskSessionCompleter = Date()
                    let taskDuration = taskSessionCompleter.timeIntervalSince(self.taskSessionStart)
                    print("[\(String(describing: self))] \(#function) -> performBackgroundRequest.\(result) (finished in \(taskDuration) seconds)")
                    
                    // Complete the execution
                    self.complete(result)
                })
            break
        case "updateNotification":
            let handled = self.handleNotification(call)
            result(handled)
            break
        case "showError":
            let handled = self.handleError(call)
            result(handled)
            break
        case "clearErrorNotifications":
            self.handleClearErrorNotifications()
            result(true)
            break
        case "hasContentChanged":
            // This is only called for Android, but we provide an implementation here
            // telling Flutter that we don't have any information about whether the gallery
            // contents have changed or not, so we can just say "no, they've not changed"
            result(false)
            break
        default:
            result(FlutterError()) 
            self.complete(UIBackgroundFetchResult.failed)
        }
    }
    
    // Runs the background sync by starting up a new isolate and handling the calls
    // until it completes
    public func run(maxSeconds: Int?) {
        // We need the callback handle to start up the Flutter VM from the entry point
        let defaults = UserDefaults.standard
        guard let callbackHandle = defaults.value(forKey: "callback_handle") as? Int64 else {
            // Can't find the callback handle, this is fatal
            complete(UIBackgroundFetchResult.failed)
            return
            
        }
        
        // Use the provided callbackHandle to get the callback function
        guard let callback = FlutterCallbackCache.lookupCallbackInformation(callbackHandle) else {
            // We need this callback or else this is fatal
            complete(UIBackgroundFetchResult.failed)
            return
        }
        
        // Sanity check for the engine existing
        if engine == nil {
            complete(UIBackgroundFetchResult.failed)
            return
        }
               
        // Run the engine
        let isRunning = engine!.run(
            withEntrypoint: callback.callbackName,
            libraryURI: callback.callbackLibraryPath
        )
        
        // If this engine isn't running, this is fatal
        if !isRunning {
            complete(UIBackgroundFetchResult.failed)
            return
        }
        
        // If we have a timer, we need to start the timer to cancel ourselves
        // so that we don't run longer than the provided maxSeconds
        // After maxSeconds has elapsed, we will invoke "systemStop"
        if maxSeconds != nil {
            // Schedule a non-repeating timer to run after maxSeconds
            let timer = Timer.scheduledTimer(withTimeInterval: TimeInterval(maxSeconds!),
                                                      repeats: false) { timer in
                // The callback invalidates the timer and stops execution
                timer.invalidate()
                
                // If the channel is already deallocated, we don't need to do anything
                if self.channel == nil {
                    return
                }
                
                // Tell the Flutter VM to stop backing up now
                self.channel?.invokeMethod(
                    "systemStop",
                    arguments: nil,
                    result: nil)
                
                // Complete the execution
                self.complete(UIBackgroundFetchResult.newData)
            }
        }
        
        // Set the handle function to the channel message handler
        self.channel?.setMethodCallHandler(handle)
        
        // Register this to get access to the plugins on the platform channel
        BackgroundServicePlugin.flutterPluginRegistrantCallback?(engine!)
    }
    
    // Cancels execution of this task, used by the system's task expiration handler
    // which is called shortly before execution is about to expire
    public func cancel() {
        // If the channel is already deallocated, we don't need to do anything
        if self.channel == nil {
            return
        }
        
        // Tell the Flutter VM to stop backing up now
        self.channel?.invokeMethod(
            "systemStop",
            arguments: nil,
            result: nil)
        
        // Complete the execution
        self.complete(UIBackgroundFetchResult.newData)
    }

    // Completes the execution, destroys the engine, and sends a completion to our callback completionHandler
    private func complete(_ fetchResult: UIBackgroundFetchResult) {
        engine?.destroyContext()
        channel = nil
        completionHandler(fetchResult)
    }
    
    private func handleNotification(_ call: FlutterMethodCall) -> Bool {
        
        // Parse the arguments as an array list
        guard let args = call.arguments as? Array<Any> else {
            print("Failed to parse \(call.arguments) as array")
            return false;
        }
        
        // Requires 7 arguments passed or else fail
        guard args.count == 7 else {
            print("Needs 7 arguments, but was only passed \(args.count)")
            return false
        }
        
        // Parse the arguments to send the notification update
        let title = args[0] as? String
        let content = args[1] as? String
        let progress = args[2] as? Int
        let maximum = args[3] as? Int
        let indeterminate = args[4] as? Bool
        let isDetail = args[5] as? Bool
        let onlyIfForeground = args[6] as? Bool
        
        // Build the notification
        let notificationContent = UNMutableNotificationContent()
        notificationContent.body = content ?? "Uploading..."
        notificationContent.title = title ?? "Immich"
        
        // Add it to the Notification center
        let notification = UNNotificationRequest(
            identifier: notificationId,
            content: notificationContent,
            trigger: nil
        )
        let center = UNUserNotificationCenter.current()
        center.add(notification) { (error: Error?) in
            if let theError = error {
                print("Error showing notifications: \(theError)")
            }
        }
        
        return true
    }
    
    private func handleError(_ call: FlutterMethodCall) -> Bool {
        // Parse the arguments as an array list
        guard let args = call.arguments as? Array<Any> else {
            return false;
        }
        
        // Requires 7 arguments passed or else fail
        guard args.count == 3 else {
            return false
        }
        
        let title = args[0] as? String
        let content = args[1] as? String
        let individualTag = args[2] as? String
        
        // Build the notification
        let notificationContent = UNMutableNotificationContent()
        notificationContent.body = content ?? "Error running the backup job."
        notificationContent.title = title ?? "Immich"
        
        // Add it to the Notification center
        let notification = UNNotificationRequest(
            identifier: notificationId,
            content: notificationContent,
            trigger: nil
        )
        let center = UNUserNotificationCenter.current()
        center.add(notification)
        
        return true
    }
    
    private func handleClearErrorNotifications() {
        let center = UNUserNotificationCenter.current()
        center.removeDeliveredNotifications(withIdentifiers: [notificationId])
        center.removePendingNotificationRequests(withIdentifiers: [notificationId])
    }
}

