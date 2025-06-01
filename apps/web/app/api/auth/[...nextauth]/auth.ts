import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import type { NextAuthConfig, NextAuthResult } from "next-auth";

const config = {
	trustHost: true,
	providers: [
		Google({
			clientId: process.env.AUTH_GOOGLE_ID,
			clientSecret: process.env.AUTH_GOOGLE_SECRET,
			authorization: {
				params: {
					prompt: "consent",
					access_type: "offline",
					response_type: "code",
				},
			},
		}),
	],
} as NextAuthConfig;

const result = NextAuth({
	...config,
	session: {
		strategy: "jwt",
	},
	callbacks: {
		async signIn({ account, profile, user }) {
			if (account?.provider === "google") {
				if (!profile?.email) return false;
				try {
					return true;
				} catch (error) {
					throw Error("Not Google Provider");
				}
			}
			return true;
		},
		async jwt({ token, user, account, profile }) {
			if (account && profile) {
				token.id = user.id;
				token.image = profile.picture;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.image = token.picture as string;
			}
			return session;
		},
	},
});

const handlers: NextAuthResult["handlers"] = result.handlers;
const auth: NextAuthResult["auth"] = result.auth;
const signIn: NextAuthResult["signIn"] = result.signIn;
const signOut: NextAuthResult["signOut"] = result.signOut;

export { handlers, auth, signIn, signOut };
