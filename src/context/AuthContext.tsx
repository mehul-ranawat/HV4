// License: Proprietary / Internal Use
// HealthVault (HV4) - All rights reserved.
// Designed and developed by the HealthVault Team.
// Unauthorized copying, distribution, or modification is strictly prohibited.
//
// Contributors:
//   - Mehul Ranawat       (Lead Developer & Architect)
//   - Laxmi Nayakodi      (UI/UX Design)
//   - Srushti Reddy       (Security)
//   - Sanket Deshmukh     (Data Engineering)

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth, db, doc, getDoc } from '../firebase/config'

interface AuthContextType {
  user: User | null
  role: string | null
  isVerified: boolean
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isVerified: false,
  loading: true,
  logout: async () => { },
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setRole(data.role || 'patient')
            setIsVerified(data.isVerified || false)
          } else {
            setRole('patient')
            setIsVerified(false)
          }
        } catch (err) {
          console.error('Error fetching user data:', err)
          setRole('patient')
          setIsVerified(false)
        }
      } else {
        setRole(null)
        setIsVerified(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setRole(null)
    setIsVerified(false)
  }

  return (
    <AuthContext.Provider value={{ user, role, isVerified, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
