import React, { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  role: string;
  token?: string;
}

interface AuthContextData {
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextData>({
  user: null,
  login: async () => {},
  logout: async () => {},
  loading: true,
  setUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Lỗi load user:", error);
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (token: string) => {
    if (typeof token !== "string" || token.trim() === "") {
      throw new Error("Token không hợp lệ");
    }
    const decoded: User = jwtDecode(token);
    const userWithToken: User = {
      ...decoded,
      token: token,
    };
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(userWithToken));
    setUser(userWithToken);
    if (userWithToken?.role === "STAFF") {
      router.push("/staff" as any);
    } else if (userWithToken?.role === "MANAGER") {
      router.push("/admin" as any);
    } else {
      router.push("/home");
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setUser(null);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
