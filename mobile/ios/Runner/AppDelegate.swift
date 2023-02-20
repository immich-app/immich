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
      BackgroundServicePlugin.registerBackgroundProcessing()

      BackgroundServicePlugin.register(with: self.registrar(forPlugin: "BackgroundServicePlugin")!)
            
      BackgroundServicePlugin.setPluginRegistrantCallback { registry in
          if !registry.hasPlugin("org.cocoapods.path-provider-ios") {
              FLTPathProviderPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.path-provider-ios")!)
          }
          
          if !registry.hasPlugin("org.cocoapods.photo-manager") {
              PhotoManagerPlugin.register(with: registry.registrar(forPlugin: "org.cocoapods.photo-manager")!)
          }
      }
      
      return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
    
}
