"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "ADMIN" | "TENANT";
  phone?: string | null;
  plan?: "FREE" | "STARTER" | "PRO" | "BUSINESS";
}

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("habita_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>("/auth/me")
      .then(setUser)
      .catch(() => window.localStorage.removeItem("habita_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    window.localStorage.setItem("habita_token", result.token);
    setUser(result.user);
    router.push(result.user.role === "TENANT" ? "/mon-espace" : "/dashboard");
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    const result = await api.post<{ token: string; user: User }>("/auth/register", { name, email, password, phone });
    window.localStorage.setItem("habita_token", result.token);
    setUser(result.user);
    router.push("/dashboard");
  }

  async function updateProfile(input: UpdateProfileInput) {
    const updated = await api.patch<User>("/auth/me", input);
    setUser(updated);
  }

  function logout() {
    window.localStorage.removeItem("habita_token");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  return ctx;
}
