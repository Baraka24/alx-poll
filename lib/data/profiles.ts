// lib/data/profiles.ts
import { createClient } from '@/lib/supabase';
import { Profile, NewProfile } from '@/lib/types';

const supabase = createClient();

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching profile:', error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateProfile(userId: string, updates: Partial<Omit<Profile, 'id' | 'created_at' | 'username'>>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function createProfile(newProfileData: NewProfile): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(newProfileData)
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error.message);
    throw new Error(error.message);
  }

  return data;
}
