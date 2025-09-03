import BackgroundTasks

class BackgroundWorkerApiImpl: BackgroundWorkerFgHostApi {

  func enable() throws {
    BackgroundWorkerApiImpl.scheduleRefreshWorker()
    BackgroundWorkerApiImpl.scheduleProcessingWorker()
    print("BackgroundUploadImpl:enbale Background worker scheduled")
  }
  
  func disable() throws {
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: BackgroundWorkerApiImpl.refreshTaskID);
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: BackgroundWorkerApiImpl.processingTaskID);
    print("BackgroundUploadImpl:disableUploadWorker Disabled background workers")
  }
  
  private static let refreshTaskID = "app.alextran.immich.background.refreshUpload"
  private static let processingTaskID = "app.alextran.immich.background.processingUpload"

  public static func registerBackgroundWorkers() {
      BGTaskScheduler.shared.register(
          forTaskWithIdentifier: processingTaskID, using: nil) { task in
          if task is BGProcessingTask {
            handleBackgroundProcessing(task: task as! BGProcessingTask)
          }
      }

      BGTaskScheduler.shared.register(
          forTaskWithIdentifier: refreshTaskID, using: nil) { task in
          if task is BGAppRefreshTask {
            handleBackgroundRefresh(task: task as! BGAppRefreshTask)
          }
      }
  }
  
  private static func scheduleRefreshWorker() {
    let backgroundRefresh = BGAppRefreshTaskRequest(identifier: refreshTaskID)
      backgroundRefresh.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60) // 5 mins

      do {
          try BGTaskScheduler.shared.submit(backgroundRefresh)
      } catch {
          print("Could not schedule the refresh upload task \(error.localizedDescription)")
      }
  }

  private static func scheduleProcessingWorker() {
    let backgroundProcessing = BGProcessingTaskRequest(identifier: processingTaskID)
    
    backgroundProcessing.requiresNetworkConnectivity = true
    backgroundProcessing.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 mins
    
    do {
        try BGTaskScheduler.shared.submit(backgroundProcessing)
    } catch {
        print("Could not schedule the processing upload task \(error.localizedDescription)")
    }
  }
  
  private static func handleBackgroundRefresh(task: BGAppRefreshTask) {
    scheduleRefreshWorker()
    // Restrict the refresh task to run only for a maximum of (maxSeconds) seconds
    runBackgroundWorker(task: task, taskType: .refresh, maxSeconds: 20)
  }
  
  private static func handleBackgroundProcessing(task: BGProcessingTask) {
    scheduleProcessingWorker()
    // There are no restrictions for processing tasks. Although, the OS could signal expiration at any time
    runBackgroundWorker(task: task, taskType: .processing, maxSeconds: nil)
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
        backgroundWorker.close()
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
