import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/signup_screen.dart';
import '../features/chatbot/presentation/chatbot_screen.dart';
import '../features/complaints/presentation/complaint_detail_screen.dart';
import '../features/complaints/presentation/complaint_feed_screen.dart';
import '../features/complaints/presentation/complaint_map_screen.dart';
import '../features/complaints/presentation/personal_reports_screen.dart';
import '../features/complaints/presentation/complaint_submit_screen.dart';
import '../features/transparency/presentation/transparency_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/bootstrap',
    routes: [
      GoRoute(
        path: '/bootstrap',
        builder: (context, state) => const AuthBootstrapScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/feed',
        builder: (context, state) => const ComplaintFeedScreen(),
      ),
      GoRoute(
        path: '/map',
        builder: (context, state) => const ComplaintMapScreen(),
      ),
      GoRoute(
        path: '/submit',
        builder: (context, state) => const ComplaintSubmitScreen(),
      ),
      GoRoute(
        path: '/chatbot',
        builder: (context, state) => const ChatbotScreen(),
      ),
      GoRoute(
        path: '/reports',
        builder: (context, state) => const PersonalReportsScreen(),
      ),
      GoRoute(
        path: '/transparency',
        builder: (context, state) => const TransparencyScreen(),
      ),
      GoRoute(
        path: '/complaints/:id',
        builder: (context, state) {
          final complaintId = state.pathParameters['id']!;
          return ComplaintDetailScreen(complaintId: complaintId);
        },
      ),
    ],
    redirect: (context, state) {
      final inAuth = state.matchedLocation == '/login' || state.matchedLocation == '/signup';
      final inBootstrap = state.matchedLocation == '/bootstrap';

      if (!authState.initialized && !inBootstrap) {
        return '/bootstrap';
      }

      if (authState.initialized && !authState.isAuthenticated && !inAuth) {
        return '/login';
      }

      if (authState.isAuthenticated && (inAuth || inBootstrap)) {
        return '/home';
      }

      return null;
    },
  );
});

class AuthBootstrapScreen extends ConsumerStatefulWidget {
  const AuthBootstrapScreen({super.key});

  @override
  ConsumerState<AuthBootstrapScreen> createState() => _AuthBootstrapScreenState();
}

class _AuthBootstrapScreenState extends ConsumerState<AuthBootstrapScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authControllerProvider.notifier).initialize());
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Civic Rezo'),
        actions: [
          IconButton(
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
            icon: const Icon(Icons.logout),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome ${authState.user?.fullName ?? ''}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text('Email: ${authState.user?.email ?? '-'}'),
            const SizedBox(height: 24),
            _ActionCard(
              icon: Icons.feed,
              title: 'Complaint Feed',
              subtitle: 'Browse and vote on nearby complaints',
              onTap: () => context.push('/feed'),
            ),
            const SizedBox(height: 12),
            _ActionCard(
              icon: Icons.map,
              title: 'Map View',
              subtitle: 'See complaint locations on a live map',
              onTap: () => context.push('/map'),
            ),
            const SizedBox(height: 12),
            _ActionCard(
              icon: Icons.report_problem,
              title: 'Submit Complaint',
              subtitle: 'Create a new complaint and preview priority',
              onTap: () => context.push('/submit'),
            ),
            const SizedBox(height: 12),
            _ActionCard(
              icon: Icons.chat,
              title: 'Civic Chatbot',
              subtitle: 'Ask about reporting, voting, or app features',
              onTap: () => context.push('/chatbot'),
            ),
            const SizedBox(height: 12),
            _ActionCard(
              icon: Icons.receipt_long,
              title: 'My Reports',
              subtitle: 'Track your submitted complaints',
              onTap: () => context.push('/reports'),
            ),
            const SizedBox(height: 12),
            _ActionCard(
              icon: Icons.analytics,
              title: 'Transparency',
              subtitle: 'View public complaint statistics',
              onTap: () => context.push('/transparency'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
