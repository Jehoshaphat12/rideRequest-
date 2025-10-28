// // NEW: Service Toggle Component from first code
//   const ServiceToggle = () => (
//     <View style={styles.serviceToggle}>
//       {[
//         { key: "rides", label: "Rides", icon: "car-sport" },
//         { key: "deliveries", label: "Deliveries", icon: "cube" },
//         { key: "both", label: "Both", icon: "options" },
//       ].map((service) => (
//         <TouchableOpacity
//           key={service.key}
//           style={[
//             styles.serviceOption,
//             activeService === service.key && [
//               styles.serviceOptionActive,
//               { backgroundColor: theme.primary },
//             ],
//           ]}
//           onPress={() => setActiveService(service.key as any)}
//         >
//           <Ionicons
//             name={service.icon as any}
//             size={18}
//             color={
//               activeService === service.key ? theme.primaryText : theme.primary
//             }
//           />
//           <Text
//             style={[
//               styles.serviceOptionText,
//               {
//                 color:
//                   activeService === service.key
//                     ? theme.primaryText
//                     : theme.text,
//               },
//             ]}
//           >
//             {service.label}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );