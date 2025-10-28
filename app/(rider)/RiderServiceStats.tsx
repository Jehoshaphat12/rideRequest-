// /app/(rider)/riderStats.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { auth, db } from '@/lib/firebaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Platform, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RiderStats {
  totalRides: number;
  totalDeliveries: number;
  rideEarnings: number;
  deliveryEarnings: number;
  totalEarnings: number;
  rating: number;
  completedThisWeek: number;
}

export default function RiderStatsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<RiderStats>({
    totalRides: 0,
    totalDeliveries: 0,
    rideEarnings: 0,
    deliveryEarnings: 0,
    totalEarnings: 0,
    rating: 4.8,
    completedThisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const riderId = auth.currentUser?.uid;
    if (!riderId) return;

    // Listen to completed rides
    const ridesQuery = query(
      collection(db, 'rides'),
      where('riderId', '==', riderId),
      where('status', '==', 'completed')
    );

    const ridesUnsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const completedRides = snapshot.docs.map(doc => doc.data());
      const rideEarnings = completedRides.reduce((sum, ride) => sum + (ride.estimatedFare || 0), 0);
      
      // Listen to completed deliveries
      const deliveriesQuery = query(
        collection(db, 'deliveries'),
        where('riderId', '==', riderId),
        where('status', '==', 'delivered')
      );

      const deliveriesUnsubscribe = onSnapshot(deliveriesQuery, (deliverySnapshot) => {
        const completedDeliveries = deliverySnapshot.docs.map(doc => doc.data());
        const deliveryEarnings = completedDeliveries.reduce((sum, delivery) => sum + (delivery.estimatedFare || 0), 0);
        
        setStats({
          totalRides: completedRides.length,
          totalDeliveries: completedDeliveries.length,
          rideEarnings,
          deliveryEarnings,
          totalEarnings: rideEarnings + deliveryEarnings,
          rating: 4.8, // This would come from user profile
          completedThisWeek: completedRides.length + completedDeliveries.length // Simplified
        });
        
        setLoading(false);
      });

      return () => deliveriesUnsubscribe();
    });

    return () => ridesUnsubscribe();
  }, []);

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.muted }]}>{title}</Text>
        {subtitle && <Text style={[styles.statSubtitle, { color: color }]}>{subtitle}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Statistics</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Total Earnings */}
        <View style={[styles.earningsCard, { backgroundColor: theme.primary }]}>
          <Text style={[styles.earningsLabel, { color: theme.primaryText }]}>Total Earnings</Text>
          <Text style={[styles.earningsAmount, { color: theme.primaryText }]}>
            GHS {stats.totalEarnings.toFixed(2)}
          </Text>
          <Text style={[styles.earningsSubtext, { color: theme.primaryText }]}>
            From {stats.totalRides + stats.totalDeliveries} total services
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Rides Completed"
            value={stats.totalRides}
            subtitle={`GHS ${stats.rideEarnings.toFixed(2)}`}
            icon="car-sport"
            color={theme.primary}
          />
          <StatCard
            title="Deliveries Completed"
            value={stats.totalDeliveries}
            subtitle={`GHS ${stats.deliveryEarnings.toFixed(2)}`}
            icon="cube"
            color={theme.success}
          />
          <StatCard
            title="Rating"
            value={stats.rating.toFixed(1)}
            subtitle="⭐ Overall"
            icon="star"
            color={theme.warning}
          />
          <StatCard
            title="This Week"
            value={stats.completedThisWeek}
            subtitle="Services"
            icon="calendar"
            color={theme.info}
          />
        </View>

        {/* Service Distribution */}
        <View style={[styles.distributionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Service Distribution</Text>
          <View style={styles.distributionRow}>
            <View style={styles.serviceType}>
              <Ionicons name="car-sport" size={20} color={theme.primary} />
              <Text style={[styles.serviceLabel, { color: theme.text }]}>Rides</Text>
              <Text style={[styles.servicePercentage, { color: theme.primary }]}>
                {stats.totalRides} ({Math.round((stats.totalRides / (stats.totalRides + stats.totalDeliveries)) * 100) || 0}%)
              </Text>
            </View>
            <View style={styles.serviceType}>
              <Ionicons name="cube" size={20} color={theme.success} />
              <Text style={[styles.serviceLabel, { color: theme.text }]}>Deliveries</Text>
              <Text style={[styles.servicePercentage, { color: theme.success }]}>
                {stats.totalDeliveries} ({Math.round((stats.totalDeliveries / (stats.totalRides + stats.totalDeliveries)) * 100) || 0}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.card }]}
            onPress={() => router.push('/(rider)/deliveryHistory')}
          >
            <Ionicons name="cube-outline" size={24} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.text }]}>Delivery History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.card }]}
            onPress={() => router.push('/(rider)/requestedRide')}
          >
            <Ionicons name="car-sport-outline" size={24} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.text }]}>Ride History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  earningsCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  earningsSubtext: {
    fontSize: 14,
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  distributionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceType: {
    alignItems: 'center',
    flex: 1,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  servicePercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});