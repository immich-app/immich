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
import androidx.compose.material.icons.filled.Close
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
import app.alextran.immich.widget.WidgetState
import app.alextran.immich.widget.WidgetType
import app.alextran.immich.widget.kSelectedAlbum
import app.alextran.immich.widget.kSelectedAlbumName
import app.alextran.immich.widget.kShowAlbumName
import kotlinx.coroutines.launch

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
  var state by remember { mutableStateOf(WidgetState.LOADING) }

  val scope = rememberCoroutineScope()

  LaunchedEffect(Unit) {
    // get albums from server
    val serverCfg = ImmichAPI.getServerConfig(context)
    val api: ImmichAPI?

    if (serverCfg == null) {
      state = WidgetState.LOG_IN
      return@LaunchedEffect
    }

    api = ImmichAPI(serverCfg)
    val albumItems = api.fetchAlbums().map {
      DropdownItem(it.albumName, it.id)
    }

    availableAlbums = listOf(DropdownItem("None", "NONE")) + albumItems
    state = WidgetState.SUCCESS

    // load selected configuration
    val currentState = getAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId)
    val currentAlbumId = currentState[kSelectedAlbum]
    val albumEntity = availableAlbums.firstOrNull { it.id == currentAlbumId }
    selectedAlbum = albumEntity ?: availableAlbums.first()

    // load showAlbumName
    showAlbumName = currentState[kShowAlbumName] ?: false
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
        navigationIcon = {
          IconButton(onClick = {
            scope.launch {
              saveConfiguration()
              onDone()
            }
          }) {
            Icon(Icons.Default.Close, contentDescription = "Close")
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
          WidgetState.LOADING -> CircularProgressIndicator(modifier = Modifier.size(48.dp))
          WidgetState.LOG_IN -> Text("You must log in inside the Immich App to configure this widget.")
          WidgetState.SUCCESS -> {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
              Text("View a random image from your library or a specific album.", style = MaterialTheme.typography.bodyMedium)

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
                )

                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.SpaceBetween,
                  modifier = Modifier.fillMaxWidth()
                ) {
                  Text(text = "Show Album Name")
                  Switch(
                    checked = showAlbumName,
                    onCheckedChange = { showAlbumName = it }
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

