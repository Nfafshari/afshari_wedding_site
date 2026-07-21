import { authConfig } from '@/auth.config';
import NextAuth from 'next-auth';

const { auth } = NextAuth(authConfig);

export default auth;

// protected paths
export const config = {
    matcher: [
        '/planner/:path*'
    ]
}