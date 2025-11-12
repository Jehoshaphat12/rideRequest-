// /app/(rider)/rideHistory.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { auth, db } from '@/lib/firebaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList, Platform, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RideHistoryItem {
  id: string;
  pickup: {
    address: string;
    coordinates: any;
  };
  dropoff: {
    address: string;
    coordinates: any;
  };
  passenger: {
    name: string;
    phone?: string;
    rating?: number;
  };
  status: string;
  fare: number;
  distance: number;
  duration: number;
  vehicleType: string;
  createdAt: any;
  completedAt?: any;
  paymentMethod: string;
  riderEarnings: number;
}

export default function RiderRideHistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    earnings: 0,
    totalDistance: 0
  });

  useEffect(() => {
    const riderId = auth.currentUser?.uid;
    if (!riderId) return;

    let q;
    if (activeFilter === 'completed') {
      q = query(
        collection(db, 'rides'),
        where('riderId', '==', riderId),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
    } else if (activeFilter === 'cancelled') {
      q = query(
        collection(db, 'rides'),
        where('riderId', '==', riderId),
        where('status', '==', 'cancelled'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'rides'),
        where('riderId', '==', riderId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rideList: RideHistoryItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RideHistoryItem));
      
      setRides(rideList);
      
      // Calculate stats
      const completedRides = rideList.filter(r => r.status === 'completed');
      const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.riderEarnings || ride.fare), 0);
      const totalDistance = completedRides.reduce((sum, ride) => sum + (ride.distance || 0), 0);
      
      setStats({
        total: rideList.length,
        completed: completedRides.length,
        earnings: totalEarnings,
        totalDistance: totalDistance
      });
      
      setLoading(false);
    }, (error) => {
      console.error('Error fetching ride history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.success;
      case 'cancelled': return theme.danger;
      case 'in_progress': return theme.warning;
      case 'arrived': return theme.info;
      case 'accepted': return theme.primary;
      case 'pending': return theme.info;
      default: return theme.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'in_progress': return 'car-sport';
      case 'arrived': return 'location';
      case 'accepted': return 'person';
      case 'waiting': return 'time';
      default: return 'ellipse';
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'motorcycle': return 'bicycle';
      case 'car': return 'car';
      case 'suv': return 'car-sport';
      case 'premium': return 'diamond';
      default: return 'car';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDistance = (distance: number) => {
    return `${(distance / 1000).toFixed(1)} km`;
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderRideItem = ({ item }: { item: RideHistoryItem }) => (
    <TouchableOpacity
      style={[styles.rideItem, { backgroundColor: theme.card }]}
      onPress={() => router.push(`/(rider)/riderRideProgress?rideId=${item.id}`)}
    >
      <View style={styles.rideHeader}>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status) as any} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.fareText, { color: theme.primary }]}>
          GHS {(item.riderEarnings || item.fare)?.toFixed(2)}
        </Text>
      </View>

      <View style={styles.passengerInfo}>
        <View style={styles.vehicleContainer}>
          <Ionicons 
            name={getVehicleIcon(item.vehicleType) as any} 
            size={14} 
            color={theme.primary} 
          />
          <Text style={[styles.vehicleText, { color: theme.text }]}>
            {item.vehicleType.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.passengerText, { color: theme.text }]}>
          {item.passenger.name}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
            {item.pickup.address}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: theme.success }]} />
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
            {item.dropoff.address}
          </Text>
        </View>
      </View>

      <View style={styles.rideMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="speedometer" size={12} color={theme.muted} />
          <Text style={[styles.metaText, { color: theme.muted }]}>
            {formatDistance(item.distance)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={12} color={theme.muted} />
          <Text style={[styles.metaText, { color: theme.muted }]}>
            {formatDuration(item.duration)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="card" size={12} color={theme.muted} />
          <Text style={[styles.metaText, { color: theme.muted }]}>
            {item.paymentMethod}
          </Text>
        </View>
      </View>

      <Text style={[styles.dateText, { color: theme.muted }]}>
        {formatDate(item.createdAt)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading ride history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Rides</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Overview */}
      <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Total Rides</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.success }]}>{stats.completed}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.warning }]}>GHS {stats.earnings.toFixed(2)}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Earnings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.info }]}>{stats.totalDistance.toFixed(1)}km</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Distance</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: theme.card }]}>
        {(['all', 'completed', 'cancelled'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && [styles.filterButtonActive, { backgroundColor: theme.primary }]
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              { color: activeFilter === filter ? theme.primaryText : theme.text }
            ]}>
              {filter === 'all' ? 'All' : filter === 'completed' ? 'Completed' : 'Cancelled'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ride List */}
      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No rides found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.muted }]}>
              {activeFilter === 'all' 
                ? "You haven't completed any rides yet"
                : `No ${activeFilter} rides found`
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
  statsContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '25%',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    // backgroundColor set dynamically
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 20,
  },
  rideItem: {
    padding: 16,
    borderRadius: 12,
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
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fareText: {
    fontSize: 16,
    fontWeight: '700',
  },
  passengerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passengerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  routeContainer: {
    gap: 8,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
  },
  rideMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});