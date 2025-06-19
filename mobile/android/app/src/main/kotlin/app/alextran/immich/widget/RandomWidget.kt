package app.alextran.immich.widget

import HomeWidgetGlanceState
import HomeWidgetGlanceStateDefinition
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.glance.appwidget.*
import androidx.glance.*
import androidx.glance.layout.*
import androidx.glance.state.*
import androidx.glance.text.*

class RandomWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<*>
    get() = HomeWidgetGlanceStateDefinition()

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    provideContent {
      GlanceContent(context, currentState())
    }
  }

  @Composable
  private fun GlanceContent(context: Context, currentState: HomeWidgetGlanceState) {
    val prefs = currentState.preferences
    val counter = prefs.getInt("counter", 0)
    Box(modifier = GlanceModifier.background(Color.White).padding(16.dp)) {
      Column() {
        Text(
          counter.toString()
        )
      }
    }
  }
}
