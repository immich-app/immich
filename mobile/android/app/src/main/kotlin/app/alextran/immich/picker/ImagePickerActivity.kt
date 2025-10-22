package app.alextran.immich.picker

import android.app.Activity
import android.content.ClipData
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import app.alextran.immich.MainActivity
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.FlutterEngineCache
import java.io.File

/**
 * Activity that handles ACTION_GET_CONTENT and ACTION_PICK intents
 * Communicates with Flutter to get the selected image URI
 */
class ImagePickerActivity : FlutterActivity() {
  private var imagePickerApi: ImagePickerProviderApi? = null
  private var hasRequestedImage = false

  override fun onCreate(savedInstanceState: Bundle?) {
    Log.d(TAG, "onCreate() called")
    super.onCreate(savedInstanceState)
    
    val action = intent.action
    val type = intent.type

    Log.d(TAG, "ImagePickerActivity started with action: $action, type: $type")

    if ((action == Intent.ACTION_GET_CONTENT || action == Intent.ACTION_PICK)) {
      Log.d(TAG, "Valid intent detected")
    } else {
      // Invalid intent, finish immediately
      Log.w(TAG, "Invalid intent action or type, finishing activity")
      setResult(Activity.RESULT_CANCELED)
      finish()
    }
    Log.d(TAG, "onCreate() finished")
  }

  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    Log.d(TAG, "configureFlutterEngine() called, hasRequestedImage = $hasRequestedImage")
    super.configureFlutterEngine(flutterEngine)
    
    // Register all plugins
    Log.d(TAG, "Registering plugins...")
    MainActivity.registerPlugins(this, flutterEngine)
    Log.d(TAG, "Plugins registered")
    
    // Set up the image picker API
    Log.d(TAG, "Setting up ImagePickerProviderApi...")
    imagePickerApi = ImagePickerProviderApi(flutterEngine.dartExecutor.binaryMessenger)
    Log.d(TAG, "ImagePickerProviderApi set up: ${imagePickerApi != null}")
    
    // Check if this is a valid image picker intent and we haven't requested yet
    val action = intent.action
    if (!hasRequestedImage && (action == Intent.ACTION_GET_CONTENT || action == Intent.ACTION_PICK)) {
      Log.d(TAG, "Valid intent and haven't requested yet, calling requestImageFromFlutter()")
      hasRequestedImage = true
      requestImageFromFlutter()
    } else {
      Log.w(TAG, "NOT calling requestImageFromFlutter() - hasRequestedImage: $hasRequestedImage, action: $action")
    }
    Log.d(TAG, "configureFlutterEngine() finished")
  }

  private fun requestImageFromFlutter() {
    Log.d(TAG, "=== requestImageFromFlutter() CALLED ===")
    Log.d(TAG, "imagePickerApi is null: ${imagePickerApi == null}")
    
    // Check if the calling app allows multiple selection
    val allowMultiple = intent.getBooleanExtra(Intent.EXTRA_ALLOW_MULTIPLE, false)
    Log.d(TAG, "Intent allows multiple selection: $allowMultiple")
    
    imagePickerApi?.pickImagesForIntent { result ->
      Log.d(TAG, "pickImagesForIntent callback received")
      result.fold(
        onSuccess = { imageUriList ->
          Log.d(TAG, "SUCCESS: Received ${imageUriList?.size ?: 0} image URI(s) from Flutter")
          
          if (imageUriList.isNullOrEmpty()) {
            // User cancelled or no images selected
            Log.d(TAG, "No images selected, returning RESULT_CANCELED")
            setResult(Activity.RESULT_CANCELED)
            finish()
            return@fold
          }
          
          try {
            // Convert all URIs to content URIs
            val contentUris = imageUriList.mapNotNull { uriString ->
              uriString?.let { 
                try {
                  convertToContentUri(it)
                } catch (e: Exception) {
                  Log.e(TAG, "Error converting URI: $it", e)
                  null
                }
              }
            }
            
            if (contentUris.isEmpty()) {
              Log.e(TAG, "No valid content URIs after conversion")
              setResult(Activity.RESULT_CANCELED)
              finish()
              return@fold
            }
            
            val resultIntent = Intent()
            
            if (contentUris.size == 1 || !allowMultiple) {
              // Single image or app doesn't support multiple
              Log.d(TAG, "Returning single image URI: ${contentUris.first()}")
              resultIntent.data = contentUris.first()
            } else {
              // Multiple images - use ClipData
              Log.d(TAG, "Returning ${contentUris.size} images using ClipData")
              val clipData = ClipData.newUri(contentResolver, "Images", contentUris.first())
              
              // Add the rest of the URIs to ClipData
              for (i in 1 until contentUris.size) {
                clipData.addItem(ClipData.Item(contentUris[i]))
              }
              
              resultIntent.clipData = clipData
              resultIntent.data = contentUris.first() // Also set primary URI for compatibility
            }
            
            // Grant temporary read permission to all URIs
            resultIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            
            setResult(Activity.RESULT_OK, resultIntent)
            finish()
          } catch (e: Exception) {
            Log.e(TAG, "Error processing URIs", e)
            setResult(Activity.RESULT_CANCELED)
            finish()
          }
        },
        onFailure = { error ->
          Log.e(TAG, "Error getting images from Flutter", error)
          setResult(Activity.RESULT_CANCELED)
          finish()
        }
      )
    }
  }

  /**
   * Converts a file:// URI to a content:// URI using FileProvider
   * This is required for API 24+ to share files with other apps
   */
  private fun convertToContentUri(uriString: String): Uri {
    val uri = uriString.toUri()
    
    return if (uri.scheme == "file") {
      val file = File(uri.path!!)
      FileProvider.getUriForFile(
        this,
        "${applicationContext.packageName}.fileprovider",
        file
      )
    } else {
      // Already a content URI or other type
      uri
    }
  }

  override fun getCachedEngineId(): String? {
    // Try to use the cached engine if available
    val hasCachedEngine = FlutterEngineCache.getInstance().contains("immich_engine")
    Log.d(TAG, "getCachedEngineId() called, has cached engine: $hasCachedEngine")
    return if (hasCachedEngine) {
      Log.d(TAG, "Using cached engine 'immich_engine'")
      "immich_engine"
    } else {
      Log.d(TAG, "No cached engine found, will create new engine")
      null
    }
  }
  
  override fun onStart() {
    super.onStart()
    Log.d(TAG, "onStart() called")
  }
  
  override fun onResume() {
    super.onResume()
    Log.d(TAG, "onResume() called")
  }
  
  override fun onPause() {
    super.onPause()
    Log.d(TAG, "onPause() called")
  }
  
  override fun onDestroy() {
    Log.d(TAG, "onDestroy() called")
    super.onDestroy()
  }

  companion object {
    private const val TAG = "ImagePickerActivity"
  }
}
