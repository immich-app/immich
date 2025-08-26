import BackgroundTasks

class BackgroundWorkerApiImpl: BackgroundWorkerFgHostApi {
  func enableSyncWorker() throws {
    BackgroundWorkerApiImpl.scheduleLocalSync()
    print("BackgroundUploadImpl:enableSyncWorker Local Sync worker scheduled")
  }
  
  func enableBackupWorker(callbackHandle: Int64) throws {
    BackgroundWorkerApiImpl.updateBackgroundUploadEnabled(true)
    // Store the callback handle for later use when starting background Flutter isolates
    BackgroundWorkerApiImpl.updateBackgroundUploadCallbackHandle(callbackHandle)
    
    BackgroundWorkerApiImpl.scheduleBackgroundRefresh()
    BackgroundWorkerApiImpl.scheduleBackgroundProcessing()
    print("BackgroundUploadImpl:enableBackupWorker Scheduled background tasks")
  }
  
  func disableBackupWorker() throws {
    BackgroundWorkerApiImpl.updateBackgroundUploadEnabled(false)
    BackgroundWorkerApiImpl.cancelTasks()
    print("BackgroundUploadImpl:disableBackupWorker Disabled background tasks")
  }
  
  public static let backgroundUploadEnabledKey = "immich:background:backup:enabled"
  public static let backgroundUploadCallbackHandleKey = "immich:background:backup:callbackHandle"
  
  private static let localRefreshTaskID = "app.alextran.immich.background.localRefresh"
  private static let backgroundRefreshTaskID = "app.alextran.immich.background.backgroundRefresh"
  private static let backgroundProcessingTaskID = "app.alextran.immich.background.backgroundProcessing"

  private static func updateBackgroundUploadEnabled(_ isEnabled: Bool) {
    return UserDefaults.standard.set(isEnabled, forKey: BackgroundWorkerApiImpl.backgroundUploadEnabledKey)
  }

  private static func updateBackgroundUploadCallbackHandle(_ callbackHandle: Int64) {
    return UserDefaults.standard.set(String(callbackHandle), forKey: BackgroundWorkerApiImpl.backgroundUploadCallbackHandleKey)
  }

  // Cancels only the backup tasks but leaves the sync task in
  private static func cancelTasks() {
    BackgroundWorkerApiImpl.updateBackgroundUploadEnabled(false)
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: backgroundRefreshTaskID);
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: backgroundProcessingTaskID);
  }

  public static func registerBackgroundProcessing() {
      BGTaskScheduler.shared.register(
          forTaskWithIdentifier: backgroundProcessingTaskID, using: nil) { task in
          if task is BGProcessingTask {
            handleBackgroundProcessing(task: task as! BGProcessingTask)
          }
      }

      BGTaskScheduler.shared.register(
          forTaskWithIdentifier: backgroundRefreshTaskID, using: nil) { task in
          if task is BGAppRefreshTask {
            handleBackgroundRefresh(task: task as! BGAppRefreshTask, taskType: .refresh)
          }
      }
    
    BGTaskScheduler.shared.register(
        forTaskWithIdentifier: localRefreshTaskID, using: nil) { task in
        if task is BGAppRefreshTask {
          handleBackgroundRefresh(task: task as! BGAppRefreshTask, taskType: .localSync)
        }
    }
  }
  
  private static func scheduleLocalSync() {
    let backgroundRefresh = BGAppRefreshTaskRequest(identifier: localRefreshTaskID)
      backgroundRefresh.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60) // 5 mins

      do {
          try BGTaskScheduler.shared.submit(backgroundRefresh)
      } catch {
          print("Could not schedule the local sync task \(error.localizedDescription)")
      }
  }
  
  private static func scheduleBackgroundRefresh() {
    let backgroundRefresh = BGAppRefreshTaskRequest(identifier: backgroundRefreshTaskID)
      backgroundRefresh.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60) // 5 mins

      do {
          try BGTaskScheduler.shared.submit(backgroundRefresh)
      } catch {
          print("Could not schedule the background refresh task \(error.localizedDescription)")
      }
  }

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
  
  private static func handleBackgroundRefresh(task: BGAppRefreshTask, taskType: BackgroundTaskType) {
    scheduleBackgroundRefresh()
    // Restrict the refresh task to run only for a maximum of 20 seconds
    runUploadWorker(task: task, taskType: taskType, maxSeconds: 20)
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
