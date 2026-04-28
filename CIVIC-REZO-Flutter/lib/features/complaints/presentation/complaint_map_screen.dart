import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../data/complaint_models.dart';
import '../data/complaints_repository.dart';

final mapComplaintsProvider = FutureProvider<List<ComplaintSummary>>((ref) {
  return ref.watch(complaintsRepositoryProvider).getComplaints(
        page: 1,
        limit: 100,
      ).then((result) => result.complaints);
});

class ComplaintMapScreen extends ConsumerStatefulWidget {
  const ComplaintMapScreen({super.key});

  @override
  ConsumerState<ComplaintMapScreen> createState() => _ComplaintMapScreenState();
}

class _ComplaintMapScreenState extends ConsumerState<ComplaintMapScreen> {
  final _latitudeController = TextEditingController(text: '11.0168');
  final _longitudeController = TextEditingController(text: '76.9558');
  final MapController _mapController = MapController();

  @override
  void dispose() {
    _latitudeController.dispose();
    _longitudeController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  double _lat() => double.tryParse(_latitudeController.text.trim()) ?? 11.0168;
  double _lng() => double.tryParse(_longitudeController.text.trim()) ?? 76.9558;

  @override
  Widget build(BuildContext context) {
    final complaintsAsync = ref.watch(mapComplaintsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Complaint Map'),
        actions: [
          IconButton(
            onPressed: () => ref.refresh(mapComplaintsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _latitudeController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                    decoration: const InputDecoration(labelText: 'Center latitude'),
                    onSubmitted: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _longitudeController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                    decoration: const InputDecoration(labelText: 'Center longitude'),
                    onSubmitted: (_) => setState(() {}),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: complaintsAsync.when(
              data: (complaints) {
                final markers = complaints
                    .where((item) => item.latitude != null && item.longitude != null)
                    .map(
                      (item) => Marker(
                        point: LatLng(item.latitude!, item.longitude!),
                        width: 50,
                        height: 50,
                        child: Tooltip(
                          message: item.title,
                          child: const Icon(Icons.location_on, color: Colors.red, size: 40),
                        ),
                      ),
                    )
                    .toList(growable: false);

                if (markers.isNotEmpty) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    final bounds = LatLngBounds.fromPoints(markers.map((m) => m.point).toList());
                    _mapController.fitCamera(
                      CameraFit.bounds(
                        bounds: bounds,
                        padding: const EdgeInsets.all(48),
                      ),
                    );
                  });
                }

                return Column(
                  children: [
                    Expanded(
                      flex: 3,
                      child: FlutterMap(
                        mapController: _mapController,
                        options: MapOptions(
                          initialCenter: LatLng(_lat(), _lng()),
                          initialZoom: 12,
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'civic_rezo_flutter',
                          ),
                          MarkerLayer(markers: markers),
                        ],
                      ),
                    ),
                    if (markers.isEmpty)
                      const Padding(
                        padding: EdgeInsets.only(top: 8, bottom: 8),
                        child: Text('No complaints with coordinates were found to place on the map.'),
                      ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: complaints.length,
                        itemBuilder: (context, index) {
                          final item = complaints[index];
                          return ListTile(
                            leading: const Icon(Icons.location_on),
                            title: Text(item.title),
                            subtitle: Text('${item.category} • ${item.status} • ${item.voteCount} votes'),
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Failed to load map data: $error')),
            ),
          ),
        ],
      ),
    );
  }
}