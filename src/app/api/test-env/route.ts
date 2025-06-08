import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DODO_PAYMENTS_API_URL: process.env.DODO_PAYMENTS_API_URL,
    DODO_PAYMENTS_API_KEY: !!process.env.DODO_PAYMENTS_API_KEY,
    DODO_WEBHOOK_SECRET: !!process.env.DODO_WEBHOOK_SECRET,
    DODO_PRO_PRODUCT_ID: process.env.DODO_PRO_PRODUCT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  return NextResponse.json(envVars);
} 