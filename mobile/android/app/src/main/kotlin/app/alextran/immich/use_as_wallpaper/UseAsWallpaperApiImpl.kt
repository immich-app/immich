package app.alextran.immich.use_as_wallpaper

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.FileProvider
import java.io.File

class UseAsWallpaperApiImpl(private val context: Context) : UseAsWallpaperApi {
    override fun useAsWallpaper(filePath: String, callback: (Result<Boolean>) -> Unit) {
        try {
            val file = File(filePath)
            val uri = FileProvider.getUriForFile(
                context,
                context.packageName + ".provider",
                file
            )

            val intent = Intent(Intent.ACTION_ATTACH_DATA).apply {
                setDataAndType(uri, "image/*")
                putExtra("mimeType", "image/*")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(Intent.createChooser(intent, "Set as Wallpaper"))

            callback(Result.success(true))
        } catch (e: Exception) {
            Log.e("UseAsWallpaperApiImpl", "Failed to launch wallpaper intent", e)
            callback(Result.success(false))
        }
    }
}