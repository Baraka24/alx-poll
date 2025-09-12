// lib/data/auth.ts
import { createClient } from '@/lib/supabase';
import { NewProfile } from '@/lib/types';

const supabase = createClient();

export async function signUpWithEmail(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }, // Pass username to the auth.users table (if configured in Supabase)
    },
  });

  if (error) {
    console.error('Sign up error:', error.message);
    throw new Error(error.message);
  }

  // Create a profile entry immediately after successful sign-up
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username: username });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
      // Depending on your error handling, you might want to rollback the user creation
      // or just log the error and let the user update their profile later.
      throw new Error(`Sign up successful, but failed to create profile: ${profileError.message}`);
    }
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error.message);
    throw new Error(error.message);
  }
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Get session error:', error.message);
    return null;
  }
  return session;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Get user error:', error.message);
    return null;
  }
  return user;
}
