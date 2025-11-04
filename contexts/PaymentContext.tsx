import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

type PaymentMethodType = "cash" | "momo";

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
};


type PaymentContextType = {
  selectedMethod: PaymentMethodType;
  setPaymentMethod: (methid: PaymentMethodType) => void;
  availableMethods: PaymentMethod[]
};

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);


export const availableMethods: PaymentMethod[] = [
  {
    id: 'cash',
    type: 'cash',
    name: 'Cash',
    description: 'Pay with cash when ride is completed',
    icon: 'cash-outline',
    isAvailable: true,
  },
  {
    id: 'momo',
    type: 'momo',
    name: 'Mobile Money',
    description: 'Pay securely with Mobile Money',
    icon: 'phone-portrait-outline',
    isAvailable: true,
  },
];


export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("cash");

  useEffect(() => {
    loadPaymentMethod();
  }, []);

  const loadPaymentMethod = async () => {
    try {
      const saveMethod = await AsyncStorage.getItem("selectedPaymentMethod");
      if (saveMethod === "cash" || saveMethod === "momo") {
        setSelectedMethod(saveMethod);
      }
    } catch (error) {
      console.error("Error loading payment method: ", error);
    }
  };

  const setPaymentMethod = async (method: PaymentMethodType) => {
    setSelectedMethod(method);
    try {
      await AsyncStorage.setItem("selectedPaymentMethod", method);
    } catch (error) {
      console.error("Error saving payment method: ", error);
    }
  };

  return (
    <PaymentContext.Provider value={{ selectedMethod, setPaymentMethod, availableMethods }}>
      {children}
    </PaymentContext.Provider>
  );
}


export function usePayment() {
    const context = useContext(PaymentContext)
    if(context === undefined) {
        throw new Error("usePayment must be used within a PaymentProvider")
    }

    return context
}
