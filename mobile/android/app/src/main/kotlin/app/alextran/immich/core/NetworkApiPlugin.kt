package app.alextran.immich.core

import android.app.Activity
import android.content.Context
import android.os.OperationCanceledException
import android.security.KeyChain
import app.alextran.immich.NativeBuffer
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import org.chromium.net.CronetEngine

class NetworkApiPlugin : FlutterPlugin, ActivityAware {
  private var networkApi: NetworkApiImpl? = null
  private var progressApi: StreamingUploadProgressApi? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    val impl = NetworkApiImpl(binding.applicationContext)
    // Progress is pushed back through a FlutterApi bound to this engine's
    // messenger, so it must be created per-attachment.
    val progress = StreamingUploadProgressApi(binding.binaryMessenger)
    impl.progressApi = progress
    networkApi = impl
    progressApi = progress
    NetworkApi.setUp(binding.binaryMessenger, impl)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    NetworkApi.setUp(binding.binaryMessenger, null)
    networkApi?.progressApi = null
    networkApi = null
    progressApi = null
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    networkApi?.activity = binding.activity
  }

  override fun onDetachedFromActivityForConfigChanges() {
    networkApi?.activity = null
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    networkApi?.activity = binding.activity
  }

  override fun onDetachedFromActivity() {
    networkApi?.activity = null
  }
}

private class NetworkApiImpl(private val context: Context) : NetworkApi {
  var activity: Activity? = null

    // Cached per engine instance: rebuildCronetEngine() shuts the old engine down,
    // and an uploader bound to it would fail every later upload with "Engine is
    // shut down".
  @Volatile private var uploaderEngine: CronetEngine? = null
  @Volatile private var uploaderRef: StreamingFileUploader? = null

  /** Reused for every progress tick instead of allocating a Handler per MB. */
  private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())

  private fun currentUploader(): StreamingFileUploader? {
    val engine = HttpClientManager.cronetEngine ?: return null
    val cached = uploaderRef
    if (cached != null && uploaderEngine === engine) {
      return cached
    }
    synchronized(this) {
      val live = HttpClientManager.cronetEngine ?: return null
      val existing = uploaderRef
      if (existing != null && uploaderEngine === live) {
        return existing
      }
      return StreamingFileUploader(live, HttpClientManager.cronetExecutor).also {
        uploaderEngine = live
        uploaderRef = it
      }
    }
  }

  override fun getAppGroupId(): String = context.packageName

  override fun requestAuthHeaders(url: String): Map<String, String> {
    return HttpClientManager.getAuthHeaders(url)
  }

  override fun getCronetUserAgent(): String = HttpClientManager.getUserAgent()

  override fun getCronetStoragePath(): String = HttpClientManager.getApiCronetStoragePath()

  override fun addCertificate(clientData: ClientCertData, callback: (Result<Unit>) -> Unit) {
    try {
      HttpClientManager.setKeyEntry(clientData.data, clientData.password.toCharArray())
      callback(Result.success(Unit))
    } catch (e: Exception) {
      callback(Result.failure(e))
    }
  }

  override fun selectCertificate(promptText: ClientCertPrompt, callback: (Result<Unit>) -> Unit) {
    val currentActivity = activity
      ?: return callback(Result.failure(IllegalStateException("No activity")))

    val onAlias = { alias: String? ->
      if (alias != null) {
        HttpClientManager.setKeyChainAlias(alias)
        callback(Result.success(Unit))
      } else {
        callback(Result.failure(OperationCanceledException()))
      }
    }
    KeyChain.choosePrivateKeyAlias(currentActivity, onAlias, null, null, null, null)
  }

  override fun removeCertificate(callback: (Result<Unit>) -> Unit) {
    HttpClientManager.deleteKeyEntry()
    callback(Result.success(Unit))
  }

  override fun hasCertificate(): Boolean {
    return HttpClientManager.isMtls
  }

  override fun getClientPointer(): Long {
    return HttpClientManager.getClientPointer()
  }

  override fun setRequestHeaders(headers: Map<String, String>, serverUrls: List<String>, token: String?) {
    HttpClientManager.setRequestHeaders(headers, serverUrls, token)
  }

  override fun clearCookies() {
    HttpClientManager.clearCookies()
  }

  override fun cancelStreamingUpload(progressKey: String) {
      // Created lazily on the first upload. Dropping the cancel when it does not
      // exist yet loses the "cancelled while queued" signal.
    (uploaderRef ?: currentUploader())?.cancel(progressKey)
  }

  override fun uploadFileStreaming(
    url: String,
    filePath: String,
    fileName: String,
    fileFieldName: String,
    mimeType: String?,
    fields: Map<String, String>,
    progressKey: String,
    callback: (Result<StreamingUploadResult>) -> Unit,
  ) {
    val uploader = currentUploader()
    if (uploader == null) {
      callback(Result.success(StreamingUploadResult(false, 0, null, "Cronet engine unavailable", 0)))
      return
    }

    // Run off the main thread: the upload blocks on a latch until Cronet is done.
    Thread {
      val outcome = try {
        uploader.upload(
          url = url,
          file = java.io.File(filePath),
          fileName = fileName,
          fileFieldName = fileFieldName,
          mimeType = mimeType,
          fields = fields,
          progressKey = progressKey,
          onProgress = { sent, total ->
            // Cronet invokes this on its own thread. Pigeon channels must be used
            // from the platform thread, so hop back before notifying Dart.
            mainHandler.post {
              progressApi?.onProgress(progressKey, sent, total) {}
            }
          },
        )
      } catch (t: Throwable) {
        // Catch Throwable, not Exception: an Error (e.g. OOM while sizing a
        // buffer) would kill this thread before the callback fires, leaving the
        // Dart Future pending forever.
        StreamingFileUploader.Outcome(false, 0, null, t.toString())
      }
      // Pigeon replies must go out on the platform thread; this runs on the
      // upload thread.
      mainHandler.post {
          // The engine can be destroyed while the upload is in flight. Replying on
          // a dead BinaryMessenger throws, and that crashes the process.
        runCatching {
          callback(
            Result.success(
              StreamingUploadResult(
                outcome.isSuccess,
                // Pigeon maps Dart int to Kotlin Long.
                outcome.statusCode.toLong(),
                outcome.body,
                outcome.errorMessage,
                outcome.bytesSent,
              ),
            ),
          )
        }
      }
    }.start()
  }

  /// Set by [NetworkApiPlugin] once the engine is attached so progress can be
  /// pushed back to Dart.
  var progressApi: StreamingUploadProgressApi? = null
}
