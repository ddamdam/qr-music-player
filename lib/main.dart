import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:spotify_sdk/spotify_sdk.dart';

void main() => runApp(const HitsterLiteApp());

class HitsterLiteApp extends StatelessWidget {
  const HitsterLiteApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hitster Lite',
      theme: ThemeData.dark(),
      home: const HitsterHome(),
    );
  }
}

class HitsterHome extends StatefulWidget {
  const HitsterHome({super.key});
  @override
  State<HitsterHome> createState() => HitsterHomeState();
}

class HitsterHomeState extends State<HitsterHome> {
  bool _connected = false;
  bool _playing = false;
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  Future<void> _connectToSpotify() async {
    try {
      await SpotifySdk.connectToSpotifyRemote(
        clientId: 'YOUR_SPOTIFY_CLIENT_ID',
        redirectUrl: 'yourapp://spotify-login',
      );
      setState(() => _connected = true);
    } catch (e) {
      debugPrint('Error connecting: $e');
    }
  }

  Future<void> _playTrack(String url) async {
    final trackId = Uri.parse(url).pathSegments.last;
    final spotifyUri = 'spotify:track:$trackId';
    await SpotifySdk.play(spotifyUri: spotifyUri);
    setState(() => _playing = true);
  }

  Future<void> _pauseResume() async {
    if (_playing) {
      await SpotifySdk.pause();
      setState(() => _playing = false);
    } else {
      await SpotifySdk.resume();
      setState(() => _playing = true);
    }
  }

  void _scanQRCode() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => QRScanPage(onResult: _playTrack)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Hitster Custom')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (!_connected)
              ElevatedButton(
                onPressed: _connectToSpotify,
                child: const Text('Connect to Spotify'),
              )
            else ...[
              ElevatedButton(
                onPressed: _scanQRCode,
                child: const Text('Scan Card'),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _pauseResume,
                child: Text(_playing ? 'Pause' : 'Resume'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class QRScanPage extends StatefulWidget {
  final Function(String) onResult;
  const QRScanPage({super.key, required this.onResult});
  @override
  State<QRScanPage> createState() => _QRScanPageState();
}

class _QRScanPageState extends State<QRScanPage> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool scanned = false;
  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) async {
      if (scanned) return;
      scanned = true;
      controller.pauseCamera();
      widget.onResult(scanData.code!);
      Navigator.pop(context);
    });
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: QRView(key: qrKey, onQRViewCreated: _onQRViewCreated),
    );
  }
}
