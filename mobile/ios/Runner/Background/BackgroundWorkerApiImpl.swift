import BackgroundTasks

class BackgroundWorkerApiImpl: BackgroundWorkerFgHostApi {
  func enableSyncWorker() throws {
    BackgroundWorkerApiImpl.scheduleLocalSync()
    print("BackgroundUploadImpl:enableSyncWorker Local Sync worker scheduled")
  }
  
  func enableUploadWorker(callbackHandle: Int64) throws {
    BackgroundWorkerApiImpl.updateUploadEnabled(true)
    // Store the callback handle for later use when starting background Flutter isolates
    BackgroundWorkerApiImpl.updateUploadCallbackHandle(callbackHandle)
    
    BackgroundWorkerApiImpl.scheduleRefreshUpload()
    BackgroundWorkerApiImpl.scheduleProcessingUpload()
    print("BackgroundUploadImpl:enableUploadWorker Scheduled background upload tasks")
  }
  
  func disableUploadWorker() throws {
    BackgroundWorkerApiImpl.updateUploadEnabled(false)
    BackgroundWorkerApiImpl.cancelUploadTasks()
    print("BackgroundUploadImpl:disableUploadWorker Disabled background upload tasks")
  }
  
  public static let backgroundUploadEnabledKey = "immich:background:backup:enabled"
  public static let backgroundUploadCallbackHandleKey = "immich:background:backup:callbackHandle"
  
  private static let localSyncTaskID = "app.alextran.immich.background.localSync"
  private static let refreshUploadTaskID = "app.alextran.immich.background.refreshUpload"
  private static let processingUploadTaskID = "app.alextran.immich.background.processingUpload"

  private static func updateUploadEnabled(_ isEnabled: Bool) {
    return UserDefaults.standard.set(isEnabled, forKey: BackgroundWorkerApiImpl.backgroundUploadEnabledKey)
  }

  private static func updateUploadCallbackHandle(_ callbackHandle: Int64) {
    return UserDefaults.standard.set(String(callbackHandle), forKey: BackgroundWorkerApiImpl.backgroundUploadCallbackHandleKey)
  }

  private static func cancelUploadTasks() {
    BackgroundWorkerApiImpl.updateUploadEnabled(false)
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: refreshUploadTaskID);
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: processingUploadTaskID);
  }

  public static func registerBackgroundProcessing() {
      BGTaskScheduler.shared.register(
          forTaskWithIdentifier: processingUploadTaskID, using: nil) { task in
          if task is BGProcessingTask {
            handleBackgroundProcessing(task: task as! BGProcessingTask)
          }
      }

      BGTaskScheduler.shared.register(
          forTaskWithIdentifier: refreshUploadTaskID, using: nil) { task in
          if task is BGAppRefreshTask {
            handleBackgroundRefresh(task: task as! BGAppRefreshTask, taskType: .refreshUpload)
          }
      }
    
    BGTaskScheduler.shared.register(
        forTaskWithIdentifier: localSyncTaskID, using: nil) { task in
        if task is BGAppRefreshTask {
          handleBackgroundRefresh(task: task as! BGAppRefreshTask, taskType: .localSync)
        }
    }
  }
  
  private static func scheduleLocalSync() {
    let backgroundRefresh = BGAppRefreshTaskRequest(identifier: localSyncTaskID)
      backgroundRefresh.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60) // 5 mins

      do {
          try BGTaskScheduler.shared.submit(backgroundRefresh)
      } catch {
          print("Could not schedule the local sync task \(error.localizedDescription)")
      }
  }
  
  private static func scheduleRefreshUpload() {
    let backgroundRefresh = BGAppRefreshTaskRequest(identifier: refreshUploadTaskID)
      backgroundRefresh.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60) // 5 mins

      do {
          try BGTaskScheduler.shared.submit(backgroundRefresh)
      } catch {
          print("Could not schedule the refresh upload task \(error.localizedDescription)")
      }
  }

  private static func scheduleProcessingUpload() {
    let backgroundProcessing = BGProcessingTaskRequest(identifier: processingUploadTaskID)
    
    backgroundProcessing.requiresNetworkConnectivity = true
    backgroundProcessing.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 mins
    
    do {
        try BGTaskScheduler.shared.submit(backgroundProcessing)
    } catch {
        print("Could not schedule the processing upload task \(error.localizedDescription)")
    }
  }
  
  private static func handleBackgroundRefresh(task: BGAppRefreshTask, taskType: BackgroundTaskType) {
    scheduleRefreshUpload()
    // Restrict the refresh task to run only for a maximum of 20 seconds
    runBackgroundWorker(task: task, taskType: taskType, maxSeconds: 20)
  }
  
  private static func handleBackgroundProcessing(task: BGProcessingTask) {
    scheduleProcessingUpload()
    // There are no restrictions for processing tasks. Although, the OS could signal expiration at any time
    runBackgroundWorker(task: task, taskType: .processingUpload, maxSeconds: nil)
  }
  
  /**
   * Executes the background worker within the context of a background task.
   * This method creates a BackgroundWorker, sets up task expiration handling,
   * and manages the synchronization between the background task and the Flutter engine.
   *
   * - Parameters:
   *   - task: The iOS background task that provides the execution context
   *   - taskType: The type of background operation to perform (refresh or processing)
   *   - maxSeconds: Optional timeout for the operation in seconds
   */
  private static func runBackgroundWorker(task: BGTask, taskType: BackgroundTaskType, maxSeconds: Int?) {
    let semaphore = DispatchSemaphore(value: 0)
    var isSuccess = true
    
    let backgroundWorker = BackgroundWorker(taskType: taskType, maxSeconds: maxSeconds) { success in
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
