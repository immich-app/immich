import UIKit
import Flutter
import BackgroundTasks
import path_provider_ios
import photo_manager

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

      GeneratedPluginRegistrant.register(with: self)
            
      BackgroundServicePlugin.setPluginRegistrantCallback { registry in
          print("Setting plugin registrants")
          if !registry.hasPlugin("org.cocoapods.path-provider-ios") {
              print("Registering path provider")
              FLTPathProviderPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.path-provider-ios")!)
              print("do we have plugin now?")
              print(registry.hasPlugin("org.cocoapods.path-provider-ios"))
          } else {
              print("already has path provider registered")
          }
          
          if !registry.hasPlugin("org.cocoapods.photo-manager") {
              PhotoManagerPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.photo-manager")!)
          }
          
      }

      BackgroundServicePlugin.registerAppRefresh()
      
      return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
