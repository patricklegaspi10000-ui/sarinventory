import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import client from "./src/api/client";
import { C } from "./src/theme";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ProductsScreen from "./src/screens/ProductsScreen";
import SalesScreen from "./src/screens/SalesScreen";
import SalesHistoryScreen from "./src/screens/SalesHistoryScreen";
import RestockScreen from "./src/screens/RestockScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import StaffScreen from "./src/screens/StaffScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import ReportsScreen from "./src/screens/ReportsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [start, setStart] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          setStart({ route: "Login" });
          return;
        }
        const res = await client.get("/auth/me");
        setStart({ route: "Dashboard", user: res.data });
      } catch (err) {
        if (err.response && err.response.status === 401) {
          await SecureStore.deleteItemAsync("token");
        }
        setStart({ route: "Login" });
      }
    })();
  }, []);

  if (!start) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.green} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={start.route}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          initialParams={{ user: start.user }}
        />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="Sales" component={SalesScreen} />
        <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} />
        <Stack.Screen name="Restock" component={RestockScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Staff" component={StaffScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}