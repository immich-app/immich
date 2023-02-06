import UIKit
import Flutter
import BackgroundTasks

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    
  let backgroundSyncTaskID = "app.alextran.immich-BackgroundSync"
    
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    
    BGTaskScheduler.shared.register(forTaskWithIdentifier: backgroundSyncTaskID, using: nil) { task in
        self.handleBackgroundSync(task: task as! BGAppRefreshTask)
    }
      
      //  Pause the application in XCode, then enter
      // e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"app.alextran.immich-BackgroundSync"]
      // Then resume the application see the background code run
      // Tested on a physical device, not a simulator
      scheduleBackgroundSync()
      
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
    
  func scheduleBackgroundSync() {
        let backgroundSync = BGAppRefreshTaskRequest(identifier: backgroundSyncTaskID)
        
        // Run 5 seconds from now
        backgroundSync.earliestBeginDate = Date(timeIntervalSinceNow: 5)
        
        do {
            try BGTaskScheduler.shared.submit(backgroundSync)
        } catch {
            print("Could not schedule the background task \(error.localizedDescription)")
        }
        
    }
    
    func handleBackgroundSync(task: BGAppRefreshTask) {
        // Schedule the next sync task
        scheduleBackgroundSync()
        
        // The background sync function to run
        BackgroundSyncManager.sync()
    }
}
