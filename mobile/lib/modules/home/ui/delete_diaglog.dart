import 'package:flutter/material.dart';

class DeleteDialog extends StatelessWidget {
  const DeleteDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.grey[200],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      title: const Text("Delete Permanently"),
      content: const Text("These items will be permanently deleted from Immich and from your device"),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text(
            "Cancel",
            style: TextStyle(color: Colors.blueGrey),
          ),
        ),
        TextButton(
          onPressed: () {},
          child: Text(
            "Delete",
            style: TextStyle(color: Colors.red[400]),
          ),
        ),
      ],
    );
  }
}
