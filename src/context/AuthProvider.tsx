"use client";

import { auth, db } from "@/lib/firebase";
import type { User } from "@/lib/types";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  limit,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  hasUnreadNotifications: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  hasUnreadNotifications: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    let unsubscribeNotifications: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);

      // Clean up previous notification listener
      unsubscribeNotifications();

      if (user) {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUser(docSnap.data() as User);
        } else {
          // Create a new user profile in Firestore if it doesn't exist
          const newUserProfile: User = {
            id: user.uid,
            name: user.displayName || "Anonymous Neighbor",
            avatarUrl:
              user.photoURL ||
              `https://placehold.co/100x100/E0F8F8/000000?text=${
                user.displayName?.charAt(0) || "A"
              }`,
          };
          await setDoc(userRef, newUserProfile);
          setUser(newUserProfile);
        }

        // Set up new notification listener
        const unreadNotifsQuery = query(
          collection(db, `users/${user.uid}/notifications`),
          where("read", "==", false),
          limit(1)
        );
        unsubscribeNotifications = onSnapshot(unreadNotifsQuery, (snapshot) => {
          setHasUnreadNotifications(!snapshot.empty);
        });
      } else {
        setUser(null);
        setHasUnreadNotifications(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNotifications();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, hasUnreadNotifications }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
