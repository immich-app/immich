package app.alextran.immich.widget

import android.graphics.Bitmap
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

@Composable
fun PhotoWidget(image: Bitmap?, error: String?, subtitle: String?) {

  Box(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(Color.White) // your color here
  ) {
    if (image != null) {
      Image(
        provider = ImageProvider(image),
        contentDescription = "Widget Image",
        contentScale = ContentScale.Crop,
        modifier = GlanceModifier.fillMaxSize()
      )
    } else {
      Image(
        provider = ImageProvider(R.drawable.splash),
        contentDescription = null,
      )
      Text(error ?: "NOPERS")
    }
  }
}
