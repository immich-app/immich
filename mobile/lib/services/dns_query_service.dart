import 'dart:async';
import 'dart:io';
import 'dart:math';

class DnsQueryService {
  final String dnsServer;

  /// Constructor with optional custom DNS server address.
  DnsQueryService({this.dnsServer = '8.8.8.8'});

  /// Query DNS for HTTPS or SRV records and return the resolved URL.
  Future<String?> resolveDns(String domain) async {
    final httpsRecord = await _queryDns(domain, 'HTTPS');
    if (httpsRecord != null) {
      return httpsRecord;
    }

    final srvRecord = await _queryDns(domain, 'SRV');
    if (srvRecord != null) {
      return srvRecord;
    }

    return null;
  }

  /// Internal method to query DNS for specific record types.
  Future<String?> _queryDns(String domain, String recordType) async {
    final queryType = recordType == 'HTTPS' ? 65 : 33; // 65: HTTPS, 33: SRV
    RawDatagramSocket? rawSocket;
    try {
      final bindAddress = InternetAddress.anyIPv6;
      rawSocket = await RawDatagramSocket.bind(bindAddress, 0);

      final dnsRequest = _buildDnsRequest(domain, queryType);
      final targetAddress = InternetAddress(dnsServer, type: InternetAddressType.any);
      rawSocket.send(dnsRequest, targetAddress, 53);

      await for (var event in rawSocket) {
        if (event == RawSocketEvent.read) {
          final response = rawSocket.receive();
          if (response != null) {
            return _parseDnsResponse(response.data, recordType);
          }
        }
      }
    } on SocketException catch (e) {
      print('IPv6 failed, falling back to IPv4: $e');
      try {
        rawSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
        final dnsRequest = _buildDnsRequest(domain, queryType);
        final targetAddress = InternetAddress(dnsServer, type: InternetAddressType.any);
        rawSocket.send(dnsRequest, targetAddress, 53);

        await for (var event in rawSocket) {
          if (event == RawSocketEvent.read) {
            final response = rawSocket.receive();
            if (response != null) {
              return _parseDnsResponse(response.data, recordType);
            }
          }
        }
      } catch (fallbackError) {
        print('IPv4 fallback also failed: $fallbackError');
      }
    } catch (e) {
      print('DNS query failed: $e');
    } finally {
      rawSocket?.close();
    }

    return null;
  }

  /// Build a DNS request packet for the given domain and record type.
  List<int> _buildDnsRequest(String domain, int queryType) {
    final packet = <int>[];

    // Random transaction ID
    final transactionId = List<int>.generate(2, (_) => Random().nextInt(256));
    packet.addAll(transactionId);

    packet.addAll([0x01, 0x00]); // Flags
    packet.addAll([0x00, 0x01]); // Questions
    packet.addAll([0x00, 0x00, 0x00, 0x00]); // Answer/Authority/Additional RRs

    for (final part in domain.split('.')) {
      packet.add(part.length);
      packet.addAll(part.codeUnits);
    }
    packet.add(0); // End of domain name
    packet.addAll([0x00, queryType]); // Query type
    packet.addAll([0x00, 0x01]); // Query class (IN)
    return packet;
  }

  /// Parse the DNS response and extract the target domain and port if applicable.
  String? _parseDnsResponse(List<int> response, String recordType) {
    // Simplified parsing logic
    if (recordType == 'HTTPS') {
      // Implement HTTPS record parsing
    } else if (recordType == 'SRV') {
      // Implement SRV record parsing
    }
    return null;
  }
}
