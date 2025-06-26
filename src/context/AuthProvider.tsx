'use client';

import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React,
{
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUser(docSnap.data() as User);
        } else {
          // Create a new user profile in Firestore if it doesn't exist
          const newUserProfile: User = {
            id: user.uid,
            name: user.displayName || 'Anonymous Neighbor',
            avatarUrl: user.photoURL || `https://placehold.co/100x100/E0F8F8/000000?text=${user.displayName?.charAt(0) || 'A'}`,
          };
          await setDoc(userRef, newUserProfile);
          setUser(newUserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
