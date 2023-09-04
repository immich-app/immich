import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:immich_mobile/shared/models/store.dart';

class AdminWebView extends StatefulWidget {
  const AdminWebView({super.key});

  @override
  _AdminWebViewState createState() => _AdminWebViewState();
}

class _AdminWebViewState extends State<AdminWebView> {
  final GlobalKey webViewKey = GlobalKey();

  InAppWebViewController? webViewController;
  InAppWebViewGroupOptions options = InAppWebViewGroupOptions(
    crossPlatform: InAppWebViewOptions(
      useShouldOverrideUrlLoading: true,
      mediaPlaybackRequiresUserGesture: false,
    ),
    android: AndroidInAppWebViewOptions(
      useHybridComposition: true,
    ),
    ios: IOSInAppWebViewOptions(
      allowsInlineMediaPlayback: true,
    ),
  );

  String url = "";
  double progress = 0;
  final urlController = TextEditingController();

  @override
  void initState() {
    super.initState();

    final String? token = Store.tryGet(StoreKey.accessToken);
    final bool? oauthLogin = Store.tryGet(StoreKey.currentUser)?.oAuthLoggedIn;
    final String? serverUri = Store.get(StoreKey.serverUrl);

    if (serverUri != null && token != null) {
      CookieManager cookieManager = CookieManager.instance();
      cookieManager.setCookie(
        url: Uri.parse((serverUri)),
        name: "immich_access_token",
        value: token,
      );
      cookieManager.setCookie(
        url: Uri.parse((serverUri)),
        name: "immich_auth_type",
        value: oauthLogin != null && oauthLogin ? "oauth" : "password",
      );
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String adminUrl = "${Store.get(StoreKey.serverUrl)}admin";

    return Scaffold(
      appBar: AppBar(title: Text("profile_drawer_admin_page".tr())),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Expanded(
              child: Stack(
                children: [
                  InAppWebView(
                    key: webViewKey,
                    initialUrlRequest: URLRequest(
                      url: Uri.parse(adminUrl),
                    ),
                    initialOptions: options,
                    onWebViewCreated: (controller) {
                      webViewController = controller;
                    },
                    androidOnPermissionRequest:
                        (controller, origin, resources) async {
                      return PermissionRequestResponse(
                        resources: resources,
                        action: PermissionRequestResponseAction.GRANT,
                      );
                    },
                    onLoadStop: (controller, url) async {
                      setState(() {
                        this.url = url.toString();
                      });
                    },
                    onLoadError: (controller, url, code, message) {},
                    onProgressChanged: (controller, progress) {
                      setState(() {
                        this.progress = progress / 100;
                      });
                    },
                    onUpdateVisitedHistory: (controller, url, androidIsReload) {
                      setState(() {
                        this.url = url.toString();
                      });
                    },
                  ),
                  progress < 1.0
                      ? LinearProgressIndicator(value: progress)
                      : Container(),
                ],
              ),
            ),
            ButtonBar(
              alignment: MainAxisAlignment.center,
              children: <Widget>[
                ElevatedButton(
                  child: const Icon(Icons.arrow_back),
                  onPressed: () {
                    webViewController?.goBack();
                  },
                ),
                ElevatedButton(
                  child: const Icon(Icons.refresh),
                  onPressed: () {
                    webViewController?.reload();
                  },
                ),
                ElevatedButton(
                  child: const Icon(Icons.arrow_forward),
                  onPressed: () {
                    webViewController?.goForward();
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
