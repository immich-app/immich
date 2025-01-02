import 'dart:async';
import 'package:basic_utils/basic_utils.dart';
import 'package:logging/logging.dart';

class DnsQueryService {
	final Logger _log = Logger('DnsQueryService');

	/// Validates the domain name format.
  bool _isValidDomain(String domain) {
	  final regex = RegExp(r'^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$');
	  return regex.hasMatch(domain);
  }
  
	/// Fetch SRV records for a given domain.  
	Future<List<Map<String, dynamic>>> fetchSrvRecords(String domain) async {
	  if (!_isValidDomain(domain)) {
			_log.warning('Invalid domain name: $domain');
		  throw Exception('Invalid domain name: $domain');
	  }
    
		try {
			_log.info('Attempting to fetch SRV records for domain: $domain');
      
			// Perform the SRV record lookup
			final srvRecords = await DnsUtils.lookupRecord(domain, RRecordType.SRV);

			_log.info('Successfully fetched SRV records for domain: $domain');
      
			// Transform the result into a list of maps
			return srvRecords.map((record) {
				return {
					'priority': record.priority,
					'weight': record.weight,
					'port': record.port,
					'target': record.target,
				};
			}).toList();
		} catch (e, stackTrace) {
			_log.severe(
				'Failed to fetch SRV records for domain: $domain',
				e,
				stackTrace,
			);
			throw Exception('Failed to fetch SRV records: $e');
		}
	}
}
