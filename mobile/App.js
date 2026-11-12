import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ProductsScreen from "./src/screens/ProductsScreen";
import SalesScreen from "./src/screens/SalesScreen";
import RestockScreen from "./src/screens/RestockScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="Sales" component={SalesScreen} />
        <Stack.Screen name="Restock" component={RestockScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}