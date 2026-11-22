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
    // FlutterApi 绑在这台引擎的 messenger 上，每次 attach 都要重建。
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

    // 引擎换了就重建，绑在旧引擎上的 uploader 会失败。
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
      // 懒创建；丢掉 cancel 就丢了「排队中被取消」这个信号。
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

    // 会阻塞到 Cronet 结束。
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
            // Pigeon 必须在平台线程。
            mainHandler.post {
              progressApi?.onProgress(progressKey, sent, total) {}
            }
          },
        )
      } catch (t: Throwable) {
        // catch Throwable 而不是 Exception：Error 会让 Dart 那边的 Future 挂着。
        StreamingFileUploader.Outcome(false, 0, null, t.toString())
      }
      // Pigeon 回复要在平台线程发。
      mainHandler.post {
          // BinaryMessenger 已销毁时回复会抛。
        runCatching {
          callback(
            Result.success(
              StreamingUploadResult(
                outcome.isSuccess,
                // Pigeon 把 Dart 的 int 映射成 Kotlin 的 Long。
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

  /// 由 [NetworkApiPlugin] 赋值，进度靠它推回 Dart。
  var progressApi: StreamingUploadProgressApi? = null
}
