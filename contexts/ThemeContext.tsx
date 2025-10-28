import { darkTheme, lightTheme } from "@/hooks/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Appearance } from "react-native";

type ThemeContextType = {
  darkMode: boolean; // true if currently dark
  toggleDarkMode: () => void; // manual toggle
  theme: typeof lightTheme; // active theme object
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemPref = Appearance.getColorScheme() === "dark";

  const [darkMode, setDarkMode] = useState(systemPref);
  const [userOverridden, setUserOverridden] = useState(false);

  // Load saved preference if available
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("darkMode");
      if (saved !== null) {
        setDarkMode(JSON.parse(saved));
        setUserOverridden(true);
      }
    })();
  }, []);

  // Save user preference when toggled
  useEffect(() => {
    if (userOverridden) {
      AsyncStorage.setItem("darkMode", JSON.stringify(darkMode));
    }
  }, [darkMode, userOverridden]);

  // System detection only applies if user hasn’t chosen manually
  useEffect(() => {
    if (!userOverridden) {
      const listener = Appearance.addChangeListener(({ colorScheme }) => {
        setDarkMode(colorScheme === "dark");
      });
      return () => listener.remove();
    }
  }, [userOverridden]);

  const toggleDarkMode = () => {
    setUserOverridden(true);
    setDarkMode((prev) => !prev);
  };

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use ThemeContext
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
