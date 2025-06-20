package app.alextran.immich.widget

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.background
import androidx.glance.layout.Box
import androidx.glance.layout.ContentScale
import androidx.glance.layout.fillMaxSize
import androidx.glance.text.Text
import app.alextran.immich.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL


suspend fun downloadBitmap(urlString: String): Bitmap? =
  withContext(Dispatchers.IO) {
    try {
      val url = URL(urlString)
      val connection = url.openConnection() as HttpURLConnection
      connection.doInput = true
      connection.connect()
      val input: InputStream = connection.inputStream
      BitmapFactory.decodeStream(input)
    } catch (e: Exception) {
      e.printStackTrace()
      null
    }
  }


@Composable
fun PhotoWidget(imageURI: Uri?, error: String?, subtitle: String?) {

  Box(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(Color.White) // your color here
  ) {
    Text(subtitle ?: "WTF is this")
//    Image(
//      provider = ImageProvider(R.drawable.splash),
//      contentDescription = null,
//      contentScale = ContentScale.Crop,
//      modifier = GlanceModifier.fillMaxSize()
//    )
  }
}
