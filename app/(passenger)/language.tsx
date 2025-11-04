import { availableLanguages, useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type Language = {
  code: string;
  name: string;
  nativeName: string;
  isAvailable: boolean;
};

export default function LanguagesScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
//   const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
const {language, setLanguage} = useLanguage()

  

  const handleLanguageSelect = (languageCode: string) => {
    setLanguage(languageCode)
  };

  const getCurrentLanguage = () => {
    return availableLanguages.find(lang => lang.code === language) || availableLanguages[0];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header with Back Button */}
      <View style={[styles.navheader, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Language</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Current Language Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Language</Text>
          <View style={[styles.currentLanguageCard, { backgroundColor: theme.primary + '15' }]}>
            <View style={styles.languageInfo}>
              <Text style={[styles.currentLanguageName, { color: theme.text }]}>
                {getCurrentLanguage().name}
              </Text>
              <Text style={[styles.currentLanguageNative, { color: theme.primary }]}>
                {getCurrentLanguage().nativeName}
              </Text>
            </View>
            <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </View>
        </View>

        {/* Available Languages Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Languages</Text>
          <Text style={[styles.sectionDescription, { color: theme.muted }]}>
            Choose your preferred language for the app interface.
          </Text>
          
          {availableLanguages.filter(lang => lang.isAvailable).map((languageItem) => (
            <LanguageOption
              key={languageItem.code}
              language={languageItem}
              isSelected={language === languageItem.code}
              onSelect={handleLanguageSelect}
              theme={theme}
            />
          ))}
        </View>

        {/* Coming Soon Languages Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Coming Soon</Text>
          <Text style={[styles.sectionDescription, { color: theme.muted }]}>
            These languages will be available in future updates.
          </Text>
          
          {availableLanguages.filter(lang => !lang.isAvailable).map((languageItem) => (
            <LanguageOption
              key={languageItem.code}
              language={languageItem}
              isSelected={false}
              onSelect={handleLanguageSelect}
              theme={theme}
            />
          ))}
        </View>

        {/* Help Text */}
        <View style={[styles.helpSection, { backgroundColor: theme.card + '80' }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.muted} />
          <Text style={[styles.helpText, { color: theme.muted }]}>
            Changing the language will update the app interface. Ride details and driver communications remain in their original language.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Language Option Component
function LanguageOption({ 
  language, 
  isSelected, 
  onSelect, 
  theme 
}: { 
  language: Language;
  isSelected: boolean;
  onSelect: (code: string) => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.languageOption,
        { 
          borderBottomColor: theme.border,
          opacity: language.isAvailable ? 1 : 0.6
        }
      ]}
      onPress={() => onSelect(language.code)}
      disabled={!language.isAvailable}
    >
      <View style={styles.languageContent}>
        <View>
          <Text style={[styles.languageName, { color: theme.text }]}>
            {language.name}
          </Text>
          <Text style={[styles.languageNative, { color: theme.muted }]}>
            {language.nativeName}
          </Text>
        </View>
        
        {!language.isAvailable && (
          <View style={[styles.comingSoonBadge, { backgroundColor: theme.muted }]}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        )}
      </View>

      <View style={styles.radioContainer}>
        {isSelected ? (
          <View style={[styles.radioSelected, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        ) : (
          <View style={[styles.radioUnselected, { borderColor: theme.muted }]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  navheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 18,
  },
  currentLanguageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  languageInfo: {
    flex: 1,
  },
  currentLanguageName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  currentLanguageNative: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 14,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 12,
  },
});