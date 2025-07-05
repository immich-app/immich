package app.alextran.immich.widget.configure

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.geometry.*
import androidx.compose.ui.layout.*
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.*

data class DropdownItem (
  val label: String,
  val id: String,
)

// Creating a composable to display a drop down menu
@Composable
fun Dropdown(items: List<DropdownItem>,
                 selectedItem: DropdownItem?,
                 onItemSelected: (DropdownItem) -> Unit,
                 modifier: Modifier = Modifier,
                 label: String = "",) {

  var expanded by remember { mutableStateOf(false) }
  var textFieldSize by remember { mutableStateOf(Size.Zero) }

  // Toggle icon based on expanded state
  val icon = if (expanded)
    Icons.Filled.KeyboardArrowUp
  else
    Icons.Filled.KeyboardArrowDown

  Column(modifier) {
    OutlinedTextField(
      value = selectedItem?.label ?: "",
      onValueChange = {},
      readOnly = true,
      modifier = Modifier
        .fillMaxWidth()
        .onGloballyPositioned { coordinates ->
          textFieldSize = coordinates.size.toSize()
        },
      trailingIcon = {
        Icon(
          imageVector = icon,
          contentDescription = "Dropdown icon",
          modifier = Modifier.clickable { expanded = !expanded }
        )
      }
    )

    DropdownMenu(
      expanded = expanded,
      onDismissRequest = { expanded = false },
      modifier = Modifier.width(with(LocalDensity.current) { textFieldSize.width.toDp() })
    ) {
      items.forEach { item ->
        DropdownMenuItem(
          text = { Text(text = item.label) },
          onClick = {
            onItemSelected(item)
            expanded = false
          }
        )
      }
    }
  }
}
