import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";

export default function IndexPage() {
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  
  if (!_hasHydrated) {
    return null; // Or a splash screen / loading spinner
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(auth)/login" />;
}
