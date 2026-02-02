package app.alextran.immich.core

import android.app.Activity
import android.content.Context
import android.net.Uri
import android.os.OperationCanceledException
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding

class NetworkApiPlugin : FlutterPlugin, ActivityAware {
  private var networkApi: NetworkApiImpl? = null


  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    networkApi = NetworkApiImpl(binding.applicationContext)
    NetworkApi.setUp(binding.binaryMessenger, networkApi)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    NetworkApi.setUp(binding.binaryMessenger, null)
    networkApi = null
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    networkApi?.onAttachedToActivity(binding)
  }

  override fun onDetachedFromActivityForConfigChanges() {
    networkApi?.onDetachedFromActivityForConfigChanges()
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    networkApi?.onReattachedToActivityForConfigChanges(binding)
  }

  override fun onDetachedFromActivity() {
    networkApi?.onDetachedFromActivity()
  }
}

private class NetworkApiImpl(private val context: Context) : NetworkApi {
  private var activity: Activity? = null
  private var pendingCallback: ((Result<ClientCertData>) -> Unit)? = null
  private var filePicker: ActivityResultLauncher<Array<String>>? = null

  fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activity = binding.activity
    (binding.activity as? ComponentActivity)?.let { componentActivity ->
      filePicker = componentActivity.registerForActivityResult(
        ActivityResultContracts.OpenDocument()
      ) { uri -> uri?.let { handlePickedFile(it) } ?: pendingCallback?.invoke(Result.failure(OperationCanceledException())) }
    }
  }

  fun onDetachedFromActivityForConfigChanges() {
    activity = null
  }

  fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    activity = binding.activity
  }

  fun onDetachedFromActivity() {
    activity = null
  }

  override fun addCertificate(clientData: ClientCertData, callback: (Result<Unit>) -> Unit) {
    try {
      HttpClientManager.setKeyEntry(clientData.data, clientData.password.toCharArray())
      callback(Result.success(Unit))
    } catch (e: Exception) {
      callback(Result.failure(e))
    }
  }

  override fun selectCertificate(callback: (Result<ClientCertData>) -> Unit) {
    val picker = filePicker ?: return callback(Result.failure(IllegalStateException("No activity")))
    pendingCallback = callback
    picker.launch(arrayOf("application/x-pkcs12", "application/x-pem-file"))
  }

  override fun removeCertificate(callback: (Result<Unit>) -> Unit) {
    HttpClientManager.deleteKeyEntry()
    callback(Result.success(Unit))
  }

  private fun handlePickedFile(uri: Uri) {
    val callback = pendingCallback ?: return
    pendingCallback = null

    try {
      val data = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
        ?: throw IllegalStateException("Could not read file")

      val activity = activity ?: throw IllegalStateException("No activity")
      promptForPassword(activity) { password ->
        if (password == null) {
          callback(Result.failure(OperationCanceledException()))
          return@promptForPassword
        }
        try {
          HttpClientManager.setKeyEntry(data, password.toCharArray())
          callback(Result.success(ClientCertData(data, password)))
        } catch (e: Exception) {
          callback(Result.failure(e))
        }
      }
    } catch (e: Exception) {
      callback(Result.failure(e))
    }
  }

  private fun promptForPassword(activity: Activity, callback: (String?) -> Unit) {
    val builder = android.app.AlertDialog.Builder(activity)
      .setTitle("Certificate Password")
      .setMessage("Enter the password for this certificate")

    val input = android.widget.EditText(activity).apply {
      inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
    }

    builder.setView(input)
      .setPositiveButton("Import") { _, _ -> callback(input.text.toString()) }
      .setNegativeButton("Cancel") { dialog, _ ->
        dialog.cancel()
        callback(null)
      }
      .setOnCancelListener { callback(null) }
      .show()
  }
}
