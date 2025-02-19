package app.alextran.immich

import android.content.ContentValues
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    private val CHANNEL = "file_trash"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        flutterEngine.plugins.add(BackgroundServicePlugin())

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "moveToTrash") {
                val filePath = call.argument<String>("filePath")
                if (filePath != null) {
                    val success = moveToTrash(filePath)
                    result.success(success)
                } else {
                    result.error("INVALID_PATH", "The file path is not specified.", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    private fun moveToTrash(filePath: String): Boolean {
    return try {
        val file = File(filePath)
        if (!file.exists()) return false

        val contentUri = MediaStore.Files.getContentUri("external")
        val projection = arrayOf(MediaStore.MediaColumns._ID)
        val selection = "${MediaStore.MediaColumns.DATA}=?"
        val selectionArgs = arrayOf(filePath)

        contentResolver.query(contentUri, projection, selection, selectionArgs, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID))
                val fileUri = MediaStore.Files.getContentUri("external", id)

                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.IS_TRASHED, 1) // Move to trash
                }

                val updated = contentResolver.update(fileUri, values, null, null)
                return updated > 0
            }
        }
        false
    } catch (e: Exception) {
        Log.e("TrashError", "Error moving to trash.", e)
        false
    }
}
}



