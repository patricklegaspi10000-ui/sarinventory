import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screen/LoginScreen";
import DashboardScreen from "./src/screen/DashboardScreen";
// Remove the // on each line below once that screen file exists,
// and use your real file names.
// import ProductsScreen from "./src/screen/ProductsScreen";
// import SalesScreen from "./src/screen/SalesScreen";
// import RestockScreen from "./src/screen/RestockScreen";
// import CategoriesScreen from "./src/screen/CategoriesScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        {/* <Stack.Screen name="Products" component={ProductsScreen} /> */}
        {/* <Stack.Screen name="Sales" component={SalesScreen} /> */}
        {/* <Stack.Screen name="Restock" component={RestockScreen} /> */}
        {/* <Stack.Screen name="Categories" component={CategoriesScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}