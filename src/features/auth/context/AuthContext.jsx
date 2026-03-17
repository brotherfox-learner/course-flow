import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { supabase } from "@/infrastructure/supabase"


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Supabase session
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile จาก users table
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  //  Bootstrap session + listener

  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
  
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );
  
    return () => {
      sub.subscription.unsubscribe();
    };
  
  }, []);

  //  Derived state

  const user = session?.user ?? null;
  const token = session?.access_token ?? null;
  const isLoggedIn = !!user;


  //  Fetch profile from backend

  const fetchProfile = useCallback(async (accessToken) => {
    if (!accessToken) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true)
    try {
      const res = await axios.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      setProfile(res.data);
    } catch (err) {
      console.error("fetchProfile failed:", err.message);
      setProfile(null);

      if (err.response?.status === 401) {
        await supabase.auth.signOut();
      }
    } finally {
      setProfileLoading(false)
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile(token)
    } else {
      setProfile(null)
      setProfileLoading(false)
    }
  }, [token, fetchProfile])

  //   (ใช้ Supabase ตรง)

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error; // hook จะ catch เอง
    return data;
  };

  // Logout

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        token,
        profile,
        isLoggedIn,
        loading: loading || profileLoading,
        login,
        logout,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

