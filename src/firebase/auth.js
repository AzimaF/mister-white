// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from './config';

export const registerHost = async (email, password, username) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: username });
  await set(ref(db, `users/${user.uid}`), {
    uid: user.uid,
    email,
    username,
    createdAt: Date.now(),
  });
  return user;
};

export const loginHost = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutHost = async () => {
  await signOut(auth);
};
