//
//  BackgroundSyncProcessing.swift
//  Runner
//
//  Created by Marty Fuhry on 2/6/23.
//
// Credit to https://github.com/fluttercommunity/flutter_workmanager/blob/main/ios/Classes/BackgroundWorker.swift

import Foundation
import Flutter

class BackgroundSyncManager {
    static func sync() {
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
        
        print("is running \(isRunning)")
        
        var channel: FlutterMethodChannel? = FlutterMethodChannel(
            name: "immich/backgroundChannel",
            binaryMessenger: flutterEngine!.binaryMessenger
        )

        func cleanup() {
            flutterEngine?.destroyContext()
            channel = nil
            flutterEngine = nil
        }

        print("running the sync")
        
        channel?.setMethodCallHandler { (call, result) in
            result(true)
            print("done")
            channel?.invokeMethod(
                "iosBackgroundSync",
                arguments: nil
            )
        }
         
    }
}

