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

class BackgroundSyncWorker {

    let engine: FlutterEngine? = FlutterEngine(
        name: "BackgroundImmich"
    )
    
    var channel: FlutterMethodChannel?
    
    var completionHandler: (UIBackgroundFetchResult) -> Void
    let taskSessionStart = Date()
    
    init(_ completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        self.channel = FlutterMethodChannel(
            name: "immich/backgroundChannel",
            binaryMessenger: engine!.binaryMessenger
        )
        self.completionHandler = completionHandler
    }
    
    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "initialized":
            self.channel?.invokeMethod(
                "backgroundProcessing",
                arguments: nil,
                result: { flutterResult in
                    let taskSessionCompleter = Date()
                    let result: UIBackgroundFetchResult = (flutterResult as? Bool ?? false) ? .newData : .failed
                    let taskDuration = taskSessionCompleter.timeIntervalSince(self.taskSessionStart)
                    print("[\(String(describing: self))] \(#function) -> performBackgroundRequest.\(result) (finished in \(taskDuration)")
                    
                    self.complete(result)
                })
            break
        case "updateNotification":
            print("update notification called")
            // TODO: implement update notification
            result(true)
            break
        case "showError":
            print("showError called")
            // TODO: implement show error
            result(true)
            break
        case "clearErrorNotifications":
            print("clearErrorNotifications")
            // TODO: implement clear error notifications
            result(true)
            break
        case "hasContentChanged":
            print("hasContentChanged")
            // TODO: implement has content changed
            result(true)
            break
        default:
            result(FlutterError())
            self.complete(UIBackgroundFetchResult.failed)
        }
    }
    
    public func run() {
        let defaults = UserDefaults.standard
        guard let callbackHandle = defaults.value(forKey: "callback_handle") as? Int64 else {
            complete(UIBackgroundFetchResult.failed)
            return
            
        }
        let callback = FlutterCallbackCache.lookupCallbackInformation(callbackHandle)
        
        if engine == nil {
            complete(UIBackgroundFetchResult.failed)
            return
        }
               
        // Run the engine
        let isRunning = engine!.run(
            withEntrypoint: callback?.callbackName,
            libraryURI: callback?.callbackLibraryPath
        )
        
        if !isRunning {
            complete(UIBackgroundFetchResult.failed)
            return
        }
        
        // Set the handle function to the channel message handler
        self.channel?.setMethodCallHandler(handle)
        
        // Register this to get access to the plugins on the platform channel
        BackgroundServicePlugin.flutterPluginRegistrantCallback?(engine!)
    }

    private func complete(_ fetchResult: UIBackgroundFetchResult) {
        engine?.destroyContext()
        channel = nil
        completionHandler(fetchResult)
    }
}

