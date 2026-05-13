import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { createSafeServerClient } from '@/lib/supabase-server';
import { generateToken } from '@/services/auth/utils';
import { setAuthCookie } from '@/services/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSafeServerClient();
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      const { user } = data;
      
      // Step 3 — User Record Creation / Sync with Prisma
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! }
      });

      let dbRole = "USER";
      if (existingUser) {
        dbRole = existingUser.role;
        
        // If the ID was different (unlikely with same provider but possible in migrations)
        // update the ID to link with Auth or keep current. 
        // Best to maintain link via email.
      } else {
        // First Login: create profile
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata.full_name || user.email?.split('@')[0] || "User",
            role: "USER", // Default role
            passwordHash: "", // Placeholder for OAuth users
          }
        });
      }

      // Generate our custom JWT for compatibility with middleware/guards
      const token = await generateToken({
        userId: user.id,
        email: user.email!,
        role: dbRole,
        isProvider: dbRole === "PROVIDER",
      });

      // Mandatory Provider verification check (Important Rule)
      if (dbRole === "PROVIDER") {
        const providerProfile = await prisma.providerProfile.findUnique({
          where: { userId: user.id }
        });

        if (!providerProfile || providerProfile.verificationStatus !== "VERIFIED") {
            const res = NextResponse.redirect(`${origin}/verification-pending`);
            return setAuthCookie(res, token);
        }
      }

      // Admin Panel check
      if (dbRole === "ADMIN") {
        const res = NextResponse.redirect(`${origin}/admin/dashboard`);
        return setAuthCookie(res, token);
      }

      const res = NextResponse.redirect(`${origin}${next}`);
      return setAuthCookie(res, token);
    }
  }

  // Fallback / Error
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
}
