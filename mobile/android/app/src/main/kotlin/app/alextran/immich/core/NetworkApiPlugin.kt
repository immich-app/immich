package app.alextran.immich.core

import android.app.Activity
import android.content.Context
import android.os.OperationCanceledException
import android.security.KeyChain
import app.alextran.immich.NativeBuffer
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding

class NetworkApiPlugin : FlutterPlugin, ActivityAware {
  private var networkApi: NetworkApiImpl? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    networkApi = NetworkApiImpl()
    NetworkApi.setUp(binding.binaryMessenger, networkApi)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    NetworkApi.setUp(binding.binaryMessenger, null)
    networkApi = null
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

private class NetworkApiImpl() : NetworkApi {
  var activity: Activity? = null

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

  override fun setRequestHeaders(headers: Map<String, String>, serverUrls: List<String>) {
    HttpClientManager.setRequestHeaders(headers)
  }
}
