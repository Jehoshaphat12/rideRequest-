// /app/(customer)/deliveryHistory.tsx
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

interface DeliveryHistoryItem {
  id: string;
  pickup: {
    address: string;
  };
  dropoff: {
    address: string;
  };
  status: string;
  estimatedFare: number;
  createdAt: any;
  deliveredAt?: any;
}

export default function DeliveryHistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    const customerId = auth.currentUser?.uid;
    if (!customerId) return;

    let q;
    if (activeFilter === 'completed') {
      q = query(
        collection(db, 'deliveries'),
        where('customerId', '==', customerId),
        where('status', '==', 'delivered'),
        orderBy('createdAt', 'desc')
      );
    } else if (activeFilter === 'cancelled') {
      q = query(
        collection(db, 'deliveries'),
        where('customerId', '==', customerId),
        where('status', '==', 'cancelled'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'deliveries'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deliveryList: DeliveryHistoryItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DeliveryHistoryItem));
      
      setDeliveries(deliveryList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching delivery history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return theme.success;
      case 'cancelled': return theme.danger;
      case 'in_transit': return theme.warning;
      default: return theme.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'in_transit': return 'car';
      case 'picked_up': return 'cube';
      case 'accepted': return 'person';
      default: return 'time';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderDeliveryItem = ({ item }: { item: DeliveryHistoryItem }) => (
    <TouchableOpacity
      style={[styles.deliveryItem, { backgroundColor: theme.card }]}
      onPress={() => router.push(`/(passenger)/deliveryTracking?deliveryId=${item.id}`)}
    >
      <View style={styles.deliveryHeader}>
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
          GHS {item.estimatedFare?.toFixed(2)}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={theme.primary} />
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
            {item.pickup.address}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="flag" size={16} color={theme.success} />
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
            {item.dropoff.address}
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
            Loading delivery history...
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Delivery History</Text>
        <View style={styles.headerSpacer} />
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

      {/* Delivery List */}
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No deliveries found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.muted }]}>
              {activeFilter === 'all' 
                ? "You haven't made any deliveries yet"
                : `No ${activeFilter} deliveries found`
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
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    margin: 16,
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
  },
  deliveryItem: {
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
  deliveryHeader: {
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
  routeContainer: {
    gap: 8,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
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