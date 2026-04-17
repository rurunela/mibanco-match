import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

import { auth, db, provider } from "../firebase/config";

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

  // 🔐 LOGIN GOOGLE
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

          skills: [],
          skills_normalized: [],
          experience: [],
          total_experience: 0,
          level: "Junior",

          education: [],
          education_keywords: [],
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
      console.error("LOGIN GOOGLE ERROR:", err);
    }
  }, []);

  // 🔓 LOGIN EMAIL
  const loginWithEmail = useCallback(async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
    } catch (err) {
      console.error("LOGIN EMAIL ERROR:", err);
      throw err;
    }
  }, []);

  // 🆕 REGISTER EMAIL
  const registerWithEmail = useCallback(async (email, password, name) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const u = result.user;

      await updateProfile(u, { displayName: name });

      const ref = doc(db, "users", u.uid);

      await setDoc(ref, {
        uid: u.uid,
        name: name || "",
        email: email,
        photoURL: "",

        role: "user",

        headline: "",
        bio: "",
        status: "searching",

        location: {
          city: "",
          country: "Perú"
        },

        skills: [],
        skills_normalized: [],
        experience: [],
        total_experience: 0,
        level: "Junior",

        education: [],
        education_keywords: [],
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

      setUser(u);
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      throw err;
    }
  }, []);

  // 🚪 LOGOUT
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setLoading(true);
  }, []);

  // 🔄 SYNC
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

  const role = profile?.role ?? null;

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

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,

      role,
      permissions,

      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
    }),
    [user, profile, loading, role, permissions, loginWithGoogle, loginWithEmail, registerWithEmail, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};