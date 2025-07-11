package app.alextran.immich.widget.configure

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*


data class DropdownItem (
  val label: String,
  val id: String,
)

// Creating a composable to display a drop down menu
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Dropdown(items: List<DropdownItem>,
             selectedItem: DropdownItem?,
             onItemSelected: (DropdownItem) -> Unit,
             enabled: Boolean = true
) {

  var expanded by remember { mutableStateOf(false) }
  var selectedOption by remember { mutableStateOf(selectedItem?.label ?: items[0].label) }

    ExposedDropdownMenuBox(
      expanded = expanded,
      onExpandedChange = { expanded = !expanded && enabled },
    ) {

      TextField(
        value = selectedOption,
        onValueChange = {},
        readOnly = true,
        enabled = enabled,
        trailingIcon = {
          ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
        },
        colors = ExposedDropdownMenuDefaults.textFieldColors(),
        modifier = Modifier
          .fillMaxWidth()
          .menuAnchor()
      )

      ExposedDropdownMenu(
        expanded = expanded,
        onDismissRequest = { expanded = false }
      ) {
        items.forEach { option ->
          DropdownMenuItem(
            text = { Text(option.label, color = MaterialTheme.colorScheme.onSurface) },
            onClick = {
              selectedOption = option.label
              onItemSelected(option)

              expanded = false
            },
            contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding
          )
        }
      }
    }
  }

