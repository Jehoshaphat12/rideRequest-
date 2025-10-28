// Floating Service Requests Cards
//       {status === "online" && filteredRequests.length > 0 && (
//         <>
//           {/* Peek Indicator (when cards are hidden) */}
//           {!cardsVisible && (
//             <TouchableOpacity 
//               style={[styles.peekIndicator, { backgroundColor: theme.primary }]}
//               onPress={() => setCardsVisible(true)}
//             >
//               <Text style={[styles.peekText, { color: theme.primaryText }]}>
//                 👆 {filteredRequests.length} {filteredRequests.length > 1 ? 'requests' : 'request'} available
//               </Text>
//             </TouchableOpacity>
//           )}

//           {/* Cards Container (when cards are visible) */}
//           {cardsVisible && (
//             <View style={[styles.floatingCardsContainer, { backgroundColor: theme.card }]}>
//               {/* Hide Button */}
//               <TouchableOpacity 
//                 style={styles.hideButton}
//                 onPress={() => setCardsVisible(false)}
//               >
//                 <Ionicons name="chevron-down" size={24} color={theme.primary} />
//               </TouchableOpacity>

//               {/* Carousel Navigation */}
//               {filteredRequests.length > 1 && (
//                 <View style={styles.carouselNav}>
//                   <TouchableOpacity
//                     style={[
//                       styles.navButton,
//                       { backgroundColor: theme.primary },
//                       currentIndex === 0 && styles.navButtonDisabled,
//                     ]}
//                     onPress={goToPrevRequest}
//                     disabled={currentIndex === 0}
//                   >
//                     <Ionicons
//                       name="chevron-back"
//                       size={20}
//                       color={currentIndex === 0 ? theme.muted : theme.primaryText}
//                     />
//                   </TouchableOpacity>

//                   <Text style={[styles.carouselCounter, { color: theme.text }]}>
//                     {currentIndex + 1} / {filteredRequests.length}
//                   </Text>

//                   <TouchableOpacity
//                     style={[
//                       styles.navButton,
//                       { backgroundColor: theme.primary },
//                       currentIndex === filteredRequests.length - 1 &&
//                         styles.navButtonDisabled,
//                     ]}
//                     onPress={goToNextRequest}
//                     disabled={currentIndex === filteredRequests.length - 1}
//                   >
//                     <Ionicons
//                       name="chevron-forward"
//                       size={20}
//                       color={
//                         currentIndex === filteredRequests.length - 1
//                           ? theme.muted
//                           : theme.primaryText
//                       }
//                     />
//                   </TouchableOpacity>
//                 </View>
//               )}

//               {/* Service Cards Carousel */}
//               <Animated.FlatList
//                 ref={flatListRef}
//                 data={filteredRequests}
//                 renderItem={renderServiceCard}
//                 keyExtractor={(item) => item.id}
//                 horizontal
//                 pagingEnabled
//                 showsHorizontalScrollIndicator={false}
//                 onScroll={onScroll}
//                 onMomentumScrollEnd={onMomentumScrollEnd}
//                 scrollEventThrottle={16}
//                 snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
//                 decelerationRate="fast"
//                 contentContainerStyle={styles.carouselContent}
//               />

//               {/* Dots Indicator */}
//               {filteredRequests.length > 1 && (
//                 <View style={styles.dotsContainer}>
//                   {filteredRequests.map((_, index) => (
//                     <View
//                       key={index}
//                       style={[
//                         styles.dot,
//                         {
//                           backgroundColor:
//                             index === currentIndex ? theme.primary : theme.border,
//                         },
//                       ]}
//                     />
//                   ))}
//                 </View>
//               )}
//             </View>
//           )}
//         </>
//       )}