"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signOutAction() {
  // Delete the session cookie on the server side
  cookies().delete('next-auth.session-token');
  cookies().delete('next-auth.csrf-token');
  cookies().delete('next-auth.callback-url');
  
  // Redirect to the signin page
  redirect('/auth/signin');
} 