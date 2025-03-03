package app.alextran.immich;

import android.content.ContentUris;
import android.content.ContentValues;
import android.content.ContentResolver;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;

import androidx.annotation.NonNull;

import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;

class MainActivity : FlutterActivity() {
    private val CHANNEL = "file_trash"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        flutterEngine.plugins.add(BackgroundServicePlugin())

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "moveToTrash" -> {
                    val fileName = call.argument<String>("fileName")
                    if (fileName != null) {
                        val success = moveToTrash(fileName)
                        result.success(success)
                    } else {
                        result.error("INVALID_NAME", "The file name is not specified.", null)
                    }
                }
                "restoreFromTrash" -> {
                    val fileName = call.argument<String>("fileName")
                    if (fileName != null) {
                        val success = untrashImage(fileName)
                        result.success(success)
                    } else {
                        result.error("INVALID_NAME", "The file name is not specified.", null)
                    }
                }

                else -> result.notImplemented()
            }
        }
    }

    private fun moveToTrash(fileName: String): Boolean {
    val uri = getFileUri(fileName)

    Log.e("FILE_URI", uri.toString())

    return uri?.let { moveToTrash(it) } ?: false
}

    private fun moveToTrash(contentUri: Uri): Boolean {
        return try {
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.IS_TRASHED, 1) // Move to trash
            }

            val updated = contentResolver.update(contentUri, values, null, null)
            updated > 0
        } catch (e: Exception) {
            Log.e("TrashError", "Error moving to trash", e)
            false
        }
    }

    private fun getFileUri(fileName: String): Uri? {
        val contentUri = MediaStore.Files.getContentUri("external")
        val projection = arrayOf(MediaStore.Images.Media._ID)
        val selection = "${MediaStore.Images.Media.DISPLAY_NAME} = ?"
        val selectionArgs = arrayOf(fileName)
        var fileUri: Uri? = null

        contentResolver.query(contentUri, projection, selection, selectionArgs, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID))
                fileUri = ContentUris.withAppendedId(contentUri, id)
            }
        }
        return fileUri
    }


    private fun untrashImage(name: String): Boolean {
    val uri = getTrashedFileUri(contentResolver,name)
    Log.e("FILE_URI", uri.toString())

    return uri?.let { untrashImage(it) } ?: false
}


    private fun untrashImage(contentUri: Uri): Boolean {
        Log.e("TrashError", "UNTRASH STARTED")
        return try {
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.IS_TRASHED, 0) // Restore file
            }

            val updated = contentResolver.update(contentUri, values, null, null)
            updated > 0
        } catch (e: Exception) {
            Log.e("ANDROID_TEST", "Error restoring file", e)
            false
        }
    }

    fun getTrashedFileUri(contentResolver: ContentResolver, fileName: String): Uri? {
    val contentUri = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    val projection = arrayOf(MediaStore.Files.FileColumns._ID)

    val queryArgs = Bundle().apply {
        putString(ContentResolver.QUERY_ARG_SQL_SELECTION, "${MediaStore.Files.FileColumns.DISPLAY_NAME} = ?")
        putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, arrayOf(fileName))
        putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_ONLY)
    }

    contentResolver.query(contentUri, projection, queryArgs, null)?.use { cursor ->
        if (cursor.moveToFirst()) {
            val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID))
            return ContentUris.withAppendedId(contentUri, id)
        }
    }
    return null
}
}
