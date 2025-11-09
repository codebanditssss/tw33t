import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Admin email addresses
const ADMIN_EMAILS = [
  'khushidiwan953@gmail.com',
  'spunit2025@gmail.com'
];

// Check if user is admin
export async function isUserAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );

    const { data: user, error } = await supabase.auth.getUser();
    
    if (error || !user.user?.email) {
      return false;
    }

    return ADMIN_EMAILS.includes(user.user.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Get current user and check if admin
export async function getCurrentUserAdmin() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, isAdmin: false };
    }

    const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email) : false;
    
    return { user, isAdmin };
  } catch (error) {
    console.error('Error getting current user admin status:', error);
    return { user: null, isAdmin: false };
  }
} 