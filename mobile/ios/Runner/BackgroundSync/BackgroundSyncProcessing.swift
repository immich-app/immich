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

class BackgroundSyncManager {
    
    static func sync(_ completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        let defaults = UserDefaults.standard
        guard let callbackHandle = defaults.value(forKey: "callback_handle") as? Int64 else {
            print("Could not retrieve callback_handle from defaults")
            return
        }
        print("got callback handle \(callbackHandle)")

        let callback = FlutterCallbackCache.lookupCallbackInformation(callbackHandle)
        
        var flutterEngine: FlutterEngine? = FlutterEngine(
            name: "BackgroundImmich"
        )
        
        let isRunning = flutterEngine!.run(
            withEntrypoint: callback?.callbackName,
            libraryURI: callback?.callbackLibraryPath
        )
        
        // Register this to get access to the plugins on the platform channel
        BackgroundServicePlugin.register(engine: flutterEngine!)
        
        var channel: FlutterMethodChannel? = FlutterMethodChannel(
            name: "immich/backgroundChannel",
            binaryMessenger: flutterEngine!.binaryMessenger
        )

        func cleanup() {
            flutterEngine?.destroyContext()
            channel = nil
            flutterEngine = nil
        }

        let taskSessionStart = Date()
        channel?.setMethodCallHandler { (call, result) in
            print("call method \(call.method)")
            switch call.method {
            case "initialized":
                channel?.invokeMethod(
                    "backgroundFetch",
                    arguments: nil,
                    result: { flutterResult in
                        cleanup()
                        let taskSessionCompleter = Date()
                        let result: UIBackgroundFetchResult = (flutterResult as? Bool ?? false) ? .newData : .failed
                        let taskDuration = taskSessionCompleter.timeIntervalSince(taskSessionStart)
                        print("[\(String(describing: self))] \(#function) -> performBackgroundRequest.\(result) (finished in \(taskDuration)")
                        
                        completionHandler(result)
                    })
                break
            case "updateNotification":
                print("update notification called")
                cleanup()
                result(true)
                break
            case "showError":
                print("showError called")
                cleanup()
                break
            case "clearErrorNotifications":
                print("clearErrorNotifications")
                result(true)
                cleanup()
                break
            case "hasContentChanged":
                print("hasContentChanged")
                result(true)
                cleanup()
                break
            default:
                result(FlutterError())
                cleanup()
                completionHandler(UIBackgroundFetchResult.failed)
            }
        }
    }
}

