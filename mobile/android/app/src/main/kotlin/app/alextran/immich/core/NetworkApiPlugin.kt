package app.alextran.immich.core

import android.app.Activity
import android.content.Context
import android.net.Uri
import android.os.OperationCanceledException
import android.text.InputType
import android.view.ContextThemeWrapper
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
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
  private var promptText: ClientCertPrompt? = null

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

  override fun selectCertificate(promptText: ClientCertPrompt, callback: (Result<ClientCertData>) -> Unit) {
    val picker = filePicker ?: return callback(Result.failure(IllegalStateException("No activity")))
    pendingCallback = callback
    this.promptText = promptText
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
        promptText = null
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
    val themedContext = ContextThemeWrapper(activity, com.google.android.material.R.style.Theme_Material3_DayNight_Dialog)
    val density = activity.resources.displayMetrics.density
    val horizontalPadding = (24 * density).toInt()

    val textInputLayout = TextInputLayout(themedContext).apply {
      hint = "Password"
      endIconMode = TextInputLayout.END_ICON_PASSWORD_TOGGLE
      layoutParams = FrameLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT).apply {
        setMargins(horizontalPadding, 0, horizontalPadding, 0)
      }
    }

    val editText = TextInputEditText(textInputLayout.context).apply {
      inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
      layoutParams = LinearLayout.LayoutParams(MATCH_PARENT, WRAP_CONTENT)
    }
    textInputLayout.addView(editText)

    val container = FrameLayout(themedContext).apply { addView(textInputLayout) }

    val text = promptText!!
    MaterialAlertDialogBuilder(themedContext)
      .setTitle(text.title)
      .setMessage(text.message)
      .setView(container)
      .setPositiveButton(text.confirm) { _, _ -> callback(editText.text.toString()) }
      .setNegativeButton(text.cancel) { _, _ -> callback(null) }
      .setOnCancelListener { callback(null) }
      .show()
  }
}
