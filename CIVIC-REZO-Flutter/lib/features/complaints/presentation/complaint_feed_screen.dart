import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/complaint_models.dart';
import '../data/complaints_repository.dart';
import 'widgets/complaint_card.dart';

final complaintFeedProvider = FutureProvider.family<ComplaintListResult, ComplaintFeedQuery>((ref, query) {
  return ref.watch(complaintsRepositoryProvider).getComplaints(
        page: query.page,
        limit: query.limit,
        status: query.status,
        category: query.category,
      );
});

class ComplaintFeedQuery {
  const ComplaintFeedQuery({this.page = 1, this.limit = 20, this.status, this.category});

  final int page;
  final int limit;
  final String? status;
  final String? category;

  @override
  bool operator ==(Object other) {
    return other is ComplaintFeedQuery &&
        other.page == page &&
        other.limit == limit &&
        other.status == status &&
        other.category == category;
  }

  @override
  int get hashCode => Object.hash(page, limit, status, category);
}

class ComplaintFeedScreen extends ConsumerStatefulWidget {
  const ComplaintFeedScreen({super.key});

  @override
  ConsumerState<ComplaintFeedScreen> createState() => _ComplaintFeedScreenState();
}

class _ComplaintFeedScreenState extends ConsumerState<ComplaintFeedScreen> {
  String? _status;
  String? _category;

  @override
  Widget build(BuildContext context) {
    final query = ComplaintFeedQuery(status: _status, category: _category);
    final feed = ref.watch(complaintFeedProvider(query));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Complaint Feed'),
        actions: [
          IconButton(
            onPressed: () => ref.refresh(complaintFeedProvider(query)),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                FilterChip(
                  label: const Text('All'),
                  selected: _status == null,
                  onSelected: (_) => setState(() => _status = null),
                ),
                FilterChip(
                  label: const Text('Pending'),
                  selected: _status == 'pending',
                  onSelected: (_) => setState(() => _status = 'pending'),
                ),
                FilterChip(
                  label: const Text('In Progress'),
                  selected: _status == 'in_progress',
                  onSelected: (_) => setState(() => _status = 'in_progress'),
                ),
                FilterChip(
                  label: const Text('Resolved'),
                  selected: _status == 'resolved',
                  onSelected: (_) => setState(() => _status = 'resolved'),
                ),
              ],
            ),
          ),
          Expanded(
            child: feed.when(
              data: (result) {
                if (result.complaints.isEmpty) {
                  return const Center(child: Text('No complaints found'));
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: result.complaints.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = result.complaints[index];
                    return ComplaintCard(
                      complaint: item,
                      onTap: () => context.push('/complaints/${item.id}'),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('Failed to load complaints: $error'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}