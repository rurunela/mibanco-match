import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import { auth, db, provider } from "../firebase/config";

import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 LOGIN
  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
  uid: u.uid,
  name: u.displayName || "",
  email: u.email || "",
  photoURL: u.photoURL || "",

  role: "user",

  headline: "",
  bio: "",
  status: "searching",

  location: {
    city: "",
    country: "Perú"
  },

  // 🔥 CORE MATCH DATA
  skills: [],
  skills_normalized: [], // ← clave para match rápido

  experience: [],
  total_experience: 0, // ← calculado automático

  level: "Junior", // ← auto (Practicante, Junior, Mid, Senior)

  education: [],
  education_keywords: [], // ← ej: ["software","marketing"]

  certifications: [],

  preferences: {
    modality: "",
    type: ""
  },

  links: {
    linkedin: "",
    github: "",
    portfolio: "",
  },

  cvURL: "",

  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
      }

      setUser(u);
    } catch (err) {
      console.error("LOGIN ERROR:", err);
    }
  }, []);

  // 🚪 LOGOUT
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setLoading(true);
  }, []);

  // 🔄 SYNC FIREBASE AUTH + FIRESTORE
  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setLoading(true);

      if (!u) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(u);

      const ref = doc(db, "users", u.uid);

      unsubProfile = onSnapshot(ref, (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // 🧠 ROLE SEGURO
  const role = profile?.role ?? null;

  // 🛡️ PERMISSIONS SEGURAS
  const permissions = useMemo(() => {
    const safeRole = role ?? "loading";

    return {
      role: safeRole,

      isLoading: safeRole === "loading",

      isUser: safeRole === "user",
      isRecruiter: safeRole === "recruiter" || safeRole === "admin",
      isAdmin: safeRole === "admin",
    };
  }, [role]);

  // ⚡ VALUE GLOBAL ESTABLE
  const value = useMemo(
    () => ({
      user,
      profile,
      loading,

      role,
      permissions,

      loginWithGoogle,
      logout,
    }),
    [user, profile, loading, role, permissions, loginWithGoogle, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 🧠 HOOK SEGURO
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};