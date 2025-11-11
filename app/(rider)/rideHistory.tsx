import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/lib/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Ride = {
  id: string;
  pickup: {
    address: string;
  };
  dropoff: {
    address: string;
  };
  status: string;
  createdAt: any;
  fare?: number;
  estimatedFare: number;
  passengerInfo?: {
    name?: string;
    profilePicture?: string;
  };
};

export default function RidesHistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "completed" | "cancelled"
  >("all");
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    earnings: 0,
  });

  useEffect(() => {
    const riderId = auth.currentUser?.uid;
    if (!riderId) return;

    let q;
    if (activeFilter === "completed") {
      q = query(
        collection(db, "rides"),
        where("riderId", "==", riderId),
        where("status", "==", "completed"),
        orderBy("createdAt", "desc")
      );
    } else if (activeFilter === "cancelled") {
      q = query(
        collection(db, "rides"),
        where("riderId", "==", riderId),
        where("status", "==", "cancelled"),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "rides"),
        where("riderId", "==", riderId),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rideList: Ride[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Ride)
        );

        setRides(rideList);

        // Calculate Stats
        const completedRides = rideList.filter((d) => d.status === "completed");
        const totalEarnings = completedRides.reduce(
          (sum, ride) => sum + ride.estimatedFare,
          0
        );

        setStats({
          total: rideList.length,
          completed: completedRides.length,
          earnings: totalEarnings,
        });

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching rides history: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return theme.success;
      case "cancelled":
        return theme.danger;
      case "picked_up":
        return theme.info;
      case "accepted":
        return theme.primary;
      default:
        return theme.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      case "picked_up":
        return "bicycle";
      case "accepted":
        return "person";
      default:
        return "time";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return (
      date.toLocalDateString() +
      " " +
      date.toLocalTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const renderRideItem = ({ item }: { item: Ride }) =>(
    <TouchableOpacity
      style={[styles.rideItem, { backgroundColor: theme.card }]}
      onPress={() =>
        router.push(`/(rider)/riderRideProgress?rideId=${item.id}`)
      }
    >
      <View style={styles.rideHeader}>
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.fareText, { color: theme.primary }]}>
          GHS {item.estimatedFare?.toFixed(2)}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={theme.primary} />
          <Text
            style={[styles.locationText, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.pickup.address}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="flag" size={14} color={theme.success} />
          <Text
            style={[styles.locationText, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.dropoff.address}
          </Text>
        </View>
      </View>

      <Text style={[styles.dateText, { color: theme.muted }]}>
        {formatDate(item.createdAt)}
      </Text>
    </TouchableOpacity>
);

if(loading) {
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
  <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
    {/* Header */}
    <View style={[styles.header, {backgroundColor: theme.card}]}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, {color: theme.text}]}>Rides History</Text>
      <View style={styles.headerSpacer} />
    </View>

    {/* Stats Overview */}
    <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.success }]}>{stats.completed}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.warning }]}>GHS {stats.earnings.toFixed(2)}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>Earnings</Text>
            </View>
          </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, {backgroundColor: theme.card}]}>
        {(['all', 'completed', 'cancelled'] as const).map((filter) => (
          <TouchableOpacity key={filter} style={[styles.filterButton, activeFilter === filter && [styles.filterButtonActive, {backgroundColor: theme.primary}]]}
          onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, {color: activeFilter === filter ? theme.primaryText : theme.text}]}>
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
                    <Ionicons name="cube-outline" size={64} color={theme.muted} />
                    <Text style={[styles.emptyText, { color: theme.text }]}>
                      No deliveries found
                    </Text>
                    <Text style={[styles.emptySubtext, { color: theme.muted }]}>
                      {activeFilter === 'all' 
                        ? "You haven't completed any deliveries yet"
                        : `No ${activeFilter} deliveries found`
                      }
                    </Text>
                  </View>
      } />
          
  </SafeAreaView>
)
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
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
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
  urgentBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareText: {
    fontSize: 16,
    fontWeight: '700',
  },
  packageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  sizeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  recipientText: {
    fontSize: 14,
    fontWeight: '500',
  },
  routeContainer: {
    gap: 6,
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