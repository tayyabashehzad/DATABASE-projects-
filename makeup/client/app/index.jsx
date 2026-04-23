import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";
export default function Login() {
  const [rememberMe, setRememberMe] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [id, setId] = useState("");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const signIn = async () => {
    if (!registeredName || !passcode) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://makeup-backend-lake.vercel.app/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_id: id, 
          registered_name: registeredName,
          pin: passcode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.detail || "Invalid credentials");
        return;
      }

      dispatch(setUser({ p_id: id, user_name: registeredName }));
      // ✅ Login success
    router.push({
      pathname: "/makeup",
      params: {
        p_id: id,
        user_name: registeredName,
      },
    });


    } catch (error) {
      Alert.alert("Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.headerText}>IU MAKEUP</Text>
        </View>
      </View>

      <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={14} // height of header
>
         <ScrollView
    contentContainerStyle={styles.main}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Sign in with the credentials provided by department
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Provided ID"
            value={id}
            onChangeText={setId}
          />

          <TextInput
            style={styles.input}
            placeholder="Registered Name"
            value={registeredName}
            onChangeText={setRegisteredName}
            
          />

          <TextInput
            style={styles.input}
            placeholder="Pin"
            value={passcode}
            onChangeText={setPasscode}
            secureTextEntry
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 15 }}>Remember Me</Text>
            <Switch
              value={rememberMe}
              onValueChange={() => setRememberMe(v => !v)}
              trackColor={{ true: "#1A44A8" }}
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={signIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  header: {
    width: "100%",
    height: 64,
     paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
  paddingBottom: 16,
  // paddingHorizontal: 20,
    backgroundColor: "#1A44A8",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  headerInner: {
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 16,
  },

  headerText: {
    color: "#fff",
    fontSize: 23,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  main: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "600",
  },

  subtitle: {
    textAlign: "center",
    color: "#6C6C6C",
    marginBottom: 8,
    paddingHorizontal: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#B4B4B4",
    padding: 10,
    width: 250,
  },

  btn: {
    backgroundColor: "#1A44A8",
    padding: 10,
    width: 250,
    marginTop: 4,
  },

  btnText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "500",
  },
});
