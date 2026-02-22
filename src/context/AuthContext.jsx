import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)


  useEffect(() => {
    const stored = localStorage.getItem("auth")
    if (stored) {
      const parsed = JSON.parse(stored)
      setUser(parsed.user)
      setAccessToken(parsed.accessToken)
    }
  }, [])

  const login = ({ user, accessToken }) => {
    setUser(user)
    setAccessToken(accessToken)

    localStorage.setItem(
      "auth",
      JSON.stringify({ user, accessToken })
    )
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem("auth")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {
  const useAuth = useContext(AuthContext)
  if (!useAuth) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return useAuth
}