import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prismaClient } from "db";
import jwt from "jsonwebtoken";

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
		maxAge: 84600 * 7,
	},
	callbacks: {
		async signIn({ account, profile, user }) {
			if (account?.provider === "google") {
				if (!profile?.email) return false;
				try {
					const createdUser = await prismaClient.user.findUnique({
						where: {
							email: profile.email,
						},
					});
					user.id = createdUser?.id;
					if (!createdUser) {
						const userCreated = await prismaClient.user.create({
							data: {
								email: profile.email,
								image: profile.picture,
								name: profile.name ?? `Guest-${profile.email.split("@")[0]}`,
							},
						});
						user.id = userCreated.id;
					}
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
				token.name = profile.name ?? `Guest-${profile.email?.split("@")[0]}`;
				const signToken = jwt.sign(
					{
						id: user.id,
						image: profile.picture,
						name: profile.name ?? `Guest-${profile.email?.split("@")[0]}`,
					},
					process.env.TOKEN_SECRET!,
					{
						expiresIn: "7d",
					}
				);
				token.accessToken = signToken;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.accessToken = token.accessToken as string;
				session.user.id = token.id as string;
				session.user.image = token.picture as string;
				session.user.name = token.name as string;
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
