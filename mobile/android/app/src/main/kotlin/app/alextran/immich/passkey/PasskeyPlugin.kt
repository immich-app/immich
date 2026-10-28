package app.alextran.immich.passkey

import android.app.Activity
import android.os.Build
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
import app.alextran.immich.core.ImmichPlugin
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch

class PasskeyPlugin : ImmichPlugin(), ActivityAware, PasskeyHostApi {
  private val scope = MainScope()
  private var activity: Activity? = null

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    super.onAttachedToEngine(binding)
    PasskeyHostApi.setUp(binding.binaryMessenger, this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    super.onDetachedFromEngine(binding)
    PasskeyHostApi.setUp(binding.binaryMessenger, null)
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

  override fun isSupported(): Boolean = BuildConfig.PASSKEYS && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P

  override fun register(options: String, callback: (Result<String?>) -> Unit) {
    val currentActivity = activity ?: return callback(Result.failure(IllegalStateException("No activity")))
    scope.launch {
      val result = try {
        val request = CreatePublicKeyCredentialRequest(options)
        val response = CredentialManager.create(currentActivity)
          .createCredential(currentActivity, request) as CreatePublicKeyCredentialResponse
        Result.success(response.registrationResponseJson)
      } catch (_: CreateCredentialCancellationException) {
        Result.success(null)
      } catch (e: CreatePublicKeyCredentialDomException) {
        // Play services reports a cancel as NotAllowedError, like browsers do
        if (e.domError is NotAllowedError) Result.success(null) else Result.failure(e)
      } catch (e: Exception) {
        Result.failure(e)
      }
      completeWhenActive(callback, result)
    }
  }

  override fun authenticate(options: String, callback: (Result<String?>) -> Unit) {
    val currentActivity = activity ?: return callback(Result.failure(IllegalStateException("No activity")))
    scope.launch {
      val result = try {
        val request = GetCredentialRequest(listOf(GetPublicKeyCredentialOption(options)))
        val credential = CredentialManager.create(currentActivity)
          .getCredential(currentActivity, request).credential as PublicKeyCredential
        Result.success(credential.authenticationResponseJson)
      } catch (_: GetCredentialCancellationException) {
        Result.success(null)
      } catch (e: GetPublicKeyCredentialDomException) {
        if (e.domError is NotAllowedError) Result.success(null) else Result.failure(e)
      } catch (e: Exception) {
        Result.failure(e)
      }
      completeWhenActive(callback, result)
    }
  }
}
