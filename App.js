import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./lib/supabase";
import AuthScreen from "./screens/AuthScreen";
import DepensesScreen from "./screens/DepensesScreen";
import AjoutScreen from "./screens/AjoutScreen";
import DetailScreen from "./screens/DetailScreen";
import ProfilScreen from "./screens/ProfilScreen";
import { colors } from "./theme";

const Stack = createNativeStackNavigator();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    // Session déjà stockée sur le téléphone (AsyncStorage) ?
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setPret(true);
    });

    // Connexion / déconnexion : l'app bascule automatiquement d'un bloc à l'autre.
    const { data } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!pret) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      >
        {!session ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Depenses"
              options={({ navigation }) => ({
                title: "Mon budget",
                headerRight: () => (
                  <Pressable onPress={() => navigation.navigate("Profil")}>
                    <Text style={{ fontSize: 20 }}>⚙️</Text>
                  </Pressable>
                ),
              })}
            >
              {(props) => <DepensesScreen {...props} session={session} />}
            </Stack.Screen>

            <Stack.Screen name="Ajout" options={{ title: "Nouvelle dépense" }}>
              {(props) => <AjoutScreen {...props} session={session} />}
            </Stack.Screen>

            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={{ title: "Détail" }}
            />

            <Stack.Screen name="Profil" options={{ title: "Mon compte" }}>
              {(props) => <ProfilScreen {...props} session={session} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
