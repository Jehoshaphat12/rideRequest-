import { db } from "@/lib/firebaseConfig";
import auth from "@react-native-firebase/auth";
import { RouteProp } from '@react-navigation/native';
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

type ParamList = {
  Verify: { uid: string; phone: string };
};

export default function PhoneVerificationScreen({ route, navigation }: { route: RouteProp<ParamList, 'Verify'>, navigation: any }) {
    const {uid, phone} = route.params
    const [code, setCode] = useState("")
    const [ confirm, setConfirm] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const sendCode = async () => {
        try {
            const confirmation = await auth().signInWithPhoneNumber(phone)
            setConfirm(confirmation)
            Alert.alert("Code sent", "Check your phone for the verification code.")
        } catch (error) {
            Alert.alert("Error", "Failed to send verification code. Please Check the phone number and try again.")
        }
    }

    const verifyCode = async () => {
        if(!confirm) return Alert.alert("Error", "Please request a verification code first.")
        
        try {
            setLoading(true)
            await confirm.confirm(code)

            // Mark phone as verified in database
            await updateDoc(doc(db, "users", uid), {phoneVerified: true})

            Alert.alert("Success", "Phone number verified successfully!")
            router.replace("/Login")
        } catch (error) {
            Alert.alert("Invalid Code", "err.message")
        } finally {
            setLoading(false)
        }
    }

    return (
<View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      {!confirm ? (
        <>
          <Text style={{ marginBottom: 8 }}>Phone: {phone}</Text>
          <TouchableOpacity
            onPress={sendCode}
            style={{ backgroundColor: "#6200ee", padding: 12, borderRadius: 8 }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>Send Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Enter OTP"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
            }}
          />
          <TouchableOpacity
            onPress={verifyCode}
            style={{
              backgroundColor: "#6200ee",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {loading ? "Verifying..." : "Verify Code"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
    )
}