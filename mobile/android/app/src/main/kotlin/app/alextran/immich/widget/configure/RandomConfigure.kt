package app.alextran.immich.widget.configure

import android.appwidget.AppWidgetManager
import android.content.Context
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import app.alextran.immich.widget.ImageDownloadWorker
import app.alextran.immich.widget.ImmichAPI
import app.alextran.immich.widget.model.*
import kotlinx.coroutines.launch
import java.io.FileNotFoundException

class RandomConfigure : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Get widget ID from intent
    val appWidgetId = intent?.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,
      AppWidgetManager.INVALID_APPWIDGET_ID)
      ?: AppWidgetManager.INVALID_APPWIDGET_ID

    if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
      finish()
      return
    }

    val glanceId = GlanceAppWidgetManager(applicationContext)
      .getGlanceIdBy(appWidgetId)

    setContent {
      LightDarkTheme {
        RandomConfiguration(applicationContext, appWidgetId, glanceId, onDone = {
          finish()
          Log.w("WIDGET_ACTIVITY", "SAVING")
        })
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RandomConfiguration(context: Context, appWidgetId: Int, glanceId: GlanceId, onDone: () -> Unit) {

  var selectedAlbum by remember { mutableStateOf<DropdownItem?>(null) }
  var showAlbumName by remember { mutableStateOf(false) }
  var availableAlbums by remember { mutableStateOf<List<DropdownItem>>(listOf()) }
  var state by remember { mutableStateOf(WidgetConfigState.LOADING) }

  val scope = rememberCoroutineScope()

  LaunchedEffect(Unit) {
    // get albums from server
    val serverCfg = ImmichAPI.getServerConfig(context)

    if (serverCfg == null) {
      state = WidgetConfigState.LOG_IN
      return@LaunchedEffect
    }

    val api = ImmichAPI(serverCfg)

    val currentState = getAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId)
    val currentAlbumId = currentState[kSelectedAlbum] ?: "NONE"
    val currentAlbumName = currentState[kSelectedAlbumName] ?: "None"
    var albumItems: List<DropdownItem>

    try {
      albumItems = api.fetchAlbums().map {
        DropdownItem(it.albumName, it.id)
      }

      state = WidgetConfigState.SUCCESS
    } catch (e: FileNotFoundException) {
      Log.e("WidgetWorker", "Error fetching albums: ${e.message}")

      state = WidgetConfigState.NO_CONNECTION
      albumItems = listOf(DropdownItem(currentAlbumName, currentAlbumId))
    }

    availableAlbums = listOf(DropdownItem("None", "NONE"), DropdownItem("Favorites", "FAVORITES")) + albumItems

    // load selected configuration
    val albumEntity = availableAlbums.firstOrNull { it.id == currentAlbumId }
    selectedAlbum = albumEntity ?: availableAlbums.first()

    // load showAlbumName
    showAlbumName = currentState[kShowAlbumName] == true
  }

  suspend fun saveConfiguration() {
    updateAppWidgetState(context, glanceId) { prefs ->
      prefs[kSelectedAlbum] = selectedAlbum?.id ?: ""
      prefs[kSelectedAlbumName] = selectedAlbum?.label ?: ""
      prefs[kShowAlbumName] = showAlbumName
    }

    ImageDownloadWorker.singleShot(context, appWidgetId, WidgetType.RANDOM)
  }

  Scaffold(
    topBar = {
      TopAppBar (
        title = { Text("Widget Configuration") },
        actions = {
          IconButton(onClick = {
            scope.launch {
              saveConfiguration()
              onDone()
            }
          }) {
            Icon(Icons.Default.Check, contentDescription = "Close", tint = MaterialTheme.colorScheme.primary)
          }
        }
      )
    }
  ) { innerPadding ->
    Surface(
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding), // Respect the top bar
      color = MaterialTheme.colorScheme.background
    ) {
      Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        when (state) {
          WidgetConfigState.LOADING -> CircularProgressIndicator(modifier = Modifier.size(48.dp))
          WidgetConfigState.LOG_IN -> Text("You must log in inside the Immich App to configure this widget.")
          else -> {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
              Text("View a random image from your library or a specific album.", style = MaterialTheme.typography.bodyMedium)

              // no connection warning
              if (state == WidgetConfigState.NO_CONNECTION) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.errorContainer)
                    .padding(12.dp),
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = "Warning",
                    modifier = Modifier.size(24.dp)
                  )
                  Spacer(modifier = Modifier.width(12.dp))
                  Text(
                    text = "No connection to the server is available. Please try again later.",
                    style = MaterialTheme.typography.bodyMedium
                  )
                }
              }

              Column(
                modifier = Modifier
                  .clip(RoundedCornerShape(12.dp))
                  .background(MaterialTheme.colorScheme.surfaceContainer)
                  .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
              ) {
                Text("Album")
                Dropdown(
                  items = availableAlbums,
                  selectedItem = selectedAlbum,
                  onItemSelected = { selectedAlbum = it },
                  enabled = (state != WidgetConfigState.NO_CONNECTION)
                )

                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.SpaceBetween,
                  modifier = Modifier.fillMaxWidth()
                ) {
                  Text(text = "Show Album Name")
                  Switch(
                    checked = showAlbumName,
                    onCheckedChange = { showAlbumName = it },
                    enabled = (state != WidgetConfigState.NO_CONNECTION)
                  )
                }
              }
            }
          }
        }
      }
    }
  }
}

