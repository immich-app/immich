package app.alextran.immich.widget.configure

import android.os.Build
import androidx.compose.foundation.*
import androidx.compose.material3.*
import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

@Composable
fun LightDarkTheme(
  content: @Composable () -> Unit
) {
  val context = LocalContext.current
  val isDarkTheme = isSystemInDarkTheme()

  val colorScheme = when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && isDarkTheme ->
      dynamicDarkColorScheme(context)
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !isDarkTheme ->
      dynamicLightColorScheme(context)
    isDarkTheme -> darkColorScheme()
    else -> lightColorScheme()
  }
  MaterialTheme(
    colorScheme = colorScheme,
    content = content
  )
}
