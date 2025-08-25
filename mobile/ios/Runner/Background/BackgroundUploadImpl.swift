import BackgroundTasks

/// Implementation class for managing background upload functionality in iOS.
/// This class handles the registration, scheduling, and execution of background tasks
/// for syncing and uploading photos to Immich server when the app is not active.
/// Implements the BackgroundUploadFgHostApi protocol for Flutter communication.
class BackgroundUploadImpl: BackgroundUploadFgHostApi {
  func enable(callbackHandle: Int64) throws {
    BackgroundUploadImpl.updateBackgroundUploadEnabled(true)
    // Store the callback handle for later use when starting background Flutter isolates
    BackgroundUploadImpl.updateBackgroundUploadCallbackHandle(callbackHandle)
    
    BackgroundUploadImpl.scheduleBackgroundRefresh()
    BackgroundUploadImpl.scheduleBackgroundProcessing()
    print("BackgroundUploadImpl:enable Scheduled background tasks")
  }
  
  func disable() throws {
    BackgroundUploadImpl.updateBackgroundUploadEnabled(false)
    BackgroundUploadImpl.cancelTasks()
  }
  
  public static let backgroundUploadEnabledKey = "immich:background:enabled"
  public static let backgroundUploadCallbackHandleKey = "immich:background:callbackHandle"
  
  private static let backgroundRefreshTaskID = "app.alextran.immich.background.backgroundRefresh"
  private static let backgroundProcessingTaskID = "app.alextran.immich.background.backgroundProcessing"

  private static func updateBackgroundUploadEnabled(_ isEnabled: Bool) {
    return UserDefaults.standard.set(isEnabled, forKey: BackgroundUploadImpl.backgroundUploadEnabledKey)
  }

  private static func updateBackgroundUploadCallbackHandle(_ callbackHandle: Int64) {
    return UserDefaults.standard.set(String(callbackHandle), forKey: BackgroundUploadImpl.backgroundUploadCallbackHandleKey)
  }

  private static func cancelTasks() {
    BackgroundUploadImpl.updateBackgroundUploadEnabled(false)
    BGTaskScheduler.shared.cancelAllTaskRequests();
  }

  public static func registerBackgroundProcessing() {
      // Register handler for long-running background processing tasks
      BGTaskScheduler.shared.register(
          forTaskWithIdentifier: backgroundProcessingTaskID, using: nil) { task in
          if task is BGProcessingTask {
            handleBackgroundProcessing(task: task as! BGProcessingTask)
          }
      }

      // Register handler for short background refresh tasks
      BGTaskScheduler.shared.register(
          forTaskWithIdentifier: backgroundRefreshTaskID, using: nil) { task in
          if task is BGAppRefreshTask {
            handleBackgroundRefresh(task: task as! BGAppRefreshTask)
          }
      }
  }
  
  /**
   * Schedules a short-running background refresh task with iOS.
   * This task performs quick synchronization operations:
   * - Sync local changes to the server
   * - Sync remote changes from the server
   * The task is scheduled to run 5 minutes from the current time at the earliest.
   */
  private static func scheduleBackgroundRefresh() {
    let backgroundRefresh = BGAppRefreshTaskRequest(identifier: backgroundRefreshTaskID)
      backgroundRefresh.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60) // 5 mins

      do {
          try BGTaskScheduler.shared.submit(backgroundRefresh)
      } catch {
          print("Could not schedule the background refresh task \(error.localizedDescription)")
      }
  }
  
  /**
   * Schedules a long-running background processing task with iOS.
   * This task performs comprehensive synchronization and upload operations:
   * - Sync local changes to the server
   * - Sync remote changes from the server
   * - Hash new assets for upload preparation
   * - Queue assets for background upload
   * The task requires network connectivity and is scheduled to run 15 minutes from the current time at the earliest.
   */
  private static func scheduleBackgroundProcessing() {
    let backgroundProcessing = BGProcessingTaskRequest(identifier: backgroundProcessingTaskID)
    
    backgroundProcessing.requiresNetworkConnectivity = true
    backgroundProcessing.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 mins
    
    do {
        try BGTaskScheduler.shared.submit(backgroundProcessing)
    } catch {
        print("Could not schedule the background processing task \(error.localizedDescription)")
    }
  }
  
  private static func handleBackgroundRefresh(task: BGAppRefreshTask) {
    scheduleBackgroundRefresh()
    // Restrict the refresh task to run only for a maximum of 20 seconds
    runUploadWorker(task: task, taskType: .refresh, maxSeconds: 20)
  }
  
  private static func handleBackgroundProcessing(task: BGProcessingTask) {
    scheduleBackgroundProcessing()
    // There are no restrictions for processing tasks. Although, the OS could signal expiration at any time
    runUploadWorker(task: task, taskType: .processing, maxSeconds: nil)
  }
  
  /**
   * Executes the background upload worker within the context of a background task.
   * This method creates a BackgroundUploadWorker, sets up task expiration handling,
   * and manages the synchronization between the background task and the Flutter engine.
   *
   * - Parameters:
   *   - task: The iOS background task that provides the execution context
   *   - taskType: The type of background operation to perform (refresh or processing)
   *   - maxSeconds: Optional timeout for the operation in seconds
   */
  private static func runUploadWorker(task: BGTask, taskType: BackgroundTaskType, maxSeconds: Int?) {
    let semaphore = DispatchSemaphore(value: 0)
    var isSuccess = true
    
    let backgroundWorker = BackgroundUploadWorker(taskType: taskType, maxSeconds: maxSeconds) { success in
      isSuccess = success
      semaphore.signal()
    }

    task.expirationHandler = {
      DispatchQueue.main.async {
        backgroundWorker.cancel()
      }
      isSuccess = false
      
      // Schedule a timer to signal the semaphore after 2 seconds
      Timer.scheduledTimer(withTimeInterval: 2, repeats: false) { _ in
        semaphore.signal()
      }
    }

    DispatchQueue.main.async {
      backgroundWorker.run()
    }

    semaphore.wait()
    task.setTaskCompleted(success: isSuccess)
    print("Background task completed with success: \(isSuccess)")
  }
}
