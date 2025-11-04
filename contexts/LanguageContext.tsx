import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";


export type Language = {
  code: string;
  name: string;
  nativeName: string;
  isAvailable: boolean;
};


type LanguageContextType = {
    language: string
    setLanguage: (lang: string) => void
    availableLanguages: Language[];

}


const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const availableLanguages: Language[] = [
  { code: "en", name: "English", nativeName: "English", isAvailable: true },
  { code: "es", name: "Spanish", nativeName: "Español", isAvailable: true },
  { code: "fr", name: "French", nativeName: "Français", isAvailable: true },
  { code: "de", name: "German", nativeName: "Deutsch", isAvailable: true },
  { code: "it", name: "Italian", nativeName: "Italiano", isAvailable: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", isAvailable: true },
  { code: "ru", name: "Russian", nativeName: "Русский", isAvailable: false },
  { code: "zh", name: "Chinese", nativeName: "中文", isAvailable: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", isAvailable: false },
  { code: "ko", name: "Korean", nativeName: "한국어", isAvailable: false },
  { code: "ar", name: "Arabic", nativeName: "العربية", isAvailable: false },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", isAvailable: false },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", isAvailable: false },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", isAvailable: false },
];


export function LanguageProvider({children} : {children: React.ReactNode}) {

    const [language, setLanguage] = useState("en")

    useEffect(() => {
        loadLanguage()
    }, [])

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem("appLanguage")
            if(savedLanguage) {
                setLanguage(savedLanguage)
            }
        } catch (error) {
            console.error("Error loading language: ", error)
        }
    }

    const handleSetLanguage = async (lang: string) => {

        // Validate that the language is available
        const LangExist = availableLanguages.find(l => l.code === lang && l.isAvailable)
        if(LangExist) {
            setLanguage(lang)

            try {
                await AsyncStorage.setItem("appLanguage", lang)
            } catch (error) {
                console.error("Error saving language: ", error)
            }
        } else {
            Alert.alert("Language Not Available", "The selected language is not available yet.")
        }
    }

    return (
        <LanguageContext.Provider value={{language, setLanguage: handleSetLanguage, availableLanguages}}>
            {children}
        </LanguageContext.Provider>
    )
}


export function useLanguage() {
    const context = useContext(LanguageContext)
    if(context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }

    return context
}