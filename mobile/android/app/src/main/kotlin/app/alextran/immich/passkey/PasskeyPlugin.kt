package app.alextran.immich.passkey

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.CreateCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.domerrors.NotAllowedError
import androidx.credentials.exceptions.publickeycredential.CreatePublicKeyCredentialDomException
import androidx.credentials.exceptions.publickeycredential.GetPublicKeyCredentialDomException
import app.alextran.immich.BuildConfig
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class PasskeyPlugin : FlutterPlugin, ActivityAware, PasskeyHostApi {
  private lateinit var scope: CoroutineScope
  private lateinit var context: Context
  private var activity: Activity? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    scope = MainScope()
    context = binding.applicationContext
    PasskeyHostApi.setUp(binding.binaryMessenger, this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    PasskeyHostApi.setUp(binding.binaryMessenger, null)
    scope.cancel()
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activity = binding.activity
  }

  override fun onDetachedFromActivityForConfigChanges() {
    activity = null
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    activity = binding.activity
  }

  override fun onDetachedFromActivity() {
    activity = null
  }

  override fun isSupported(): Boolean = BuildConfig.PASSKEYS && when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE -> true
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.P -> hasPlayServicesForPasskeys()
    else -> false
  }

  override fun register(options: String, callback: (Result<String?>) -> Unit) = perform(callback) {
    val request = CreatePublicKeyCredentialRequest(options)
    val response = CredentialManager.create(it).createCredential(it, request) as CreatePublicKeyCredentialResponse
    response.registrationResponseJson
  }

  override fun authenticate(options: String, callback: (Result<String?>) -> Unit) = perform(callback) {
    val request = GetCredentialRequest(listOf(GetPublicKeyCredentialOption(options)))
    val credential = CredentialManager.create(it).getCredential(it, request).credential as PublicKeyCredential
    credential.authenticationResponseJson
  }

  private fun perform(callback: (Result<String?>) -> Unit, request: suspend (Activity) -> String) {
    val currentActivity = activity ?: return callback(Result.failure(IllegalStateException("No activity")))
    scope.launch {
      val result = try {
        Result.success(request(currentActivity))
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        if (isCancel(e)) Result.success(null) else Result.failure(e)
      }
      callback(result)
    }
  }

  // Before Android 14 passkeys go through Google Play services, which androidx.credentials only uses from 230815045 on
  @RequiresApi(Build.VERSION_CODES.P)
  private fun hasPlayServicesForPasskeys(): Boolean = try {
    val info = context.packageManager.getPackageInfo("com.google.android.gms", 0)
    info.applicationInfo?.enabled == true && info.longVersionCode >= 230815045
  } catch (_: PackageManager.NameNotFoundException) {
    false
  }

  // WebAuthn uses NotAllowedError for a cancel, a timeout and other refusals without telling them apart, and Play
  // services sends it when the user cancels on Android 9 to 13, so like the web client it counts as a cancel
  private fun isCancel(e: Exception) = when (e) {
    is CreateCredentialCancellationException, is GetCredentialCancellationException -> true
    is CreatePublicKeyCredentialDomException -> e.domError is NotAllowedError
    is GetPublicKeyCredentialDomException -> e.domError is NotAllowedError
    else -> false
  }
}
