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
  user: (User & { email?: string | null }) | null;
  firebaseUser: FirebaseUser | null;
  hasUnreadNotifications: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  hasUnreadNotifications: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<(User & { email?: string | null }) | null>(
    null
  );
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    let unsubscribeNotifications: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      // Clean up previous notification listener
      unsubscribeNotifications();

      if (fbUser) {
        const userRef = doc(db, "users", fbUser.uid);
        const docSnap = await getDoc(userRef);
        let appUser: User & { email?: string | null };

        if (docSnap.exists()) {
          appUser = docSnap.data() as User;
        } else {
          // Create a new user profile in Firestore if it doesn't exist
          const newUserProfile: User = {
            id: fbUser.uid,
            name: fbUser.displayName || "Anonymous Neighbor",
            avatarUrl:
              fbUser.photoURL ||
              `https://placehold.co/100x100/E0F8F8/000000?text=${
                fbUser.displayName?.charAt(0) || "A"
              }`,
            email: fbUser.email ?? "",
          };
          await setDoc(userRef, newUserProfile);
          appUser = newUserProfile;
        }

        appUser.email = fbUser.email ?? "";
        setUser(appUser);

        // Set up new notification listener
        const unreadNotifsQuery = query(
          collection(db, `users/${fbUser.uid}/notifications`),
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
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNotifications();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, hasUnreadNotifications }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
