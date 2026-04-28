import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../complaints/data/complaints_repository.dart';

final transparencyDashboardProvider = FutureProvider<Map<String, dynamic>>((ref) {
  return ref.watch(complaintsRepositoryProvider).transparencyDashboard();
});

class TransparencyScreen extends ConsumerWidget {
  const TransparencyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(transparencyDashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transparency'),
        actions: [
          IconButton(
            onPressed: () => ref.refresh(transparencyDashboardProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: dashboard.when(
        data: (data) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _MetricCard(title: 'Total complaints', value: '${data['totalComplaints'] ?? 0}'),
              _MetricCard(title: 'Resolved', value: '${data['resolvedComplaints'] ?? 0}'),
              _MetricCard(title: 'In progress', value: '${data['inProgressComplaints'] ?? 0}'),
              _MetricCard(title: 'Pending', value: '${data['pendingComplaints'] ?? 0}'),
              _MetricCard(title: 'Resolution rate', value: '${data['resolutionRate'] ?? 0}%'),
              const SizedBox(height: 20),
              Text('Impact stats', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              _SummaryLine(label: 'People impacted', value: '${data['impactStats']?['totalPeopleImpacted'] ?? 0}'),
              _SummaryLine(label: 'High priority issues', value: '${data['impactStats']?['highPriorityIssues'] ?? 0}'),
              _SummaryLine(label: 'Community engagement', value: '${data['impactStats']?['communityEngagement'] ?? 0}'),
              const SizedBox(height: 20),
              Text('Voting stats', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              _SummaryLine(label: 'Total votes', value: '${data['votingStats']?['totalVotes'] ?? 0}'),
              _SummaryLine(label: 'Avg votes per complaint', value: '${data['votingStats']?['averageVotesPerComplaint'] ?? 0}'),
              const SizedBox(height: 20),
              Text('Category breakdown', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ...((data['categoryStats'] as List? ?? const [])).map(
                (item) {
                  final map = item as Map<String, dynamic>;
                  return Card(
                    child: ListTile(
                      title: Text(map['name']?.toString() ?? 'Category'),
                      subtitle: Text('Resolved ${map['resolved'] ?? 0} / ${map['total'] ?? 0}'),
                      trailing: Text('${map['resolutionRate'] ?? 0}%'),
                    ),
                  );
                },
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Failed to load transparency dashboard: $error')),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(title),
        trailing: Text(value, style: Theme.of(context).textTheme.titleMedium),
      ),
    );
  }
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}