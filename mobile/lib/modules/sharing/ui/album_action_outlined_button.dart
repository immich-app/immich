import 'package:flutter/material.dart';

class AlbumActionOutlinedButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String labelText;
  final IconData iconData;

  const AlbumActionOutlinedButton({Key? key, this.onPressed, required this.labelText, required this.iconData})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: OutlinedButton.icon(
        style: ButtonStyle(
          padding: MaterialStateProperty.all<EdgeInsets>(const EdgeInsets.symmetric(vertical: 0, horizontal: 10)),
          shape: MaterialStateProperty.resolveWith<OutlinedBorder>(
            (_) => RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(25),
            ),
          ),
          side: MaterialStateProperty.resolveWith<BorderSide>(
            (_) => const BorderSide(width: 1, color: Color.fromARGB(255, 158, 158, 158)),
          ),
        ),
        icon: Icon(iconData, size: 15),
        label: Text(
          labelText,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
        ),
        onPressed: onPressed,
      ),
    );
  }
}
