import { useTheme } from '@/contexts/ThemeContext'
import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

interface LoaderProps {
    msg: string
}

export default function Loader({msg}: LoaderProps) {
    const {darkMode} = useTheme()
  return (
    <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: darkMode ? "#000" : "#fff",
            }}
          >
            <ActivityIndicator size="large" color="#7500fc" />
            <Text style={{ 
              marginTop: 16, 
              color: darkMode ? "#fff" : "#666",
              fontSize: 16 
            }}>
              {msg}
            </Text>
          </View>
  )
}



