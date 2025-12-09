import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import { connectToDatabase } from "../database";
import { User } from "../database/models/models";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

// Define custom types
type CustomUser = {
  _id: Types.ObjectId;
  id: string;
  email: string;
  name: string;
  surname: string;
  username: string;
  bonus_points: number;
  last_login_date?: Date;
  isAdmin?: boolean;
};

declare module "@auth/core/types" {
  interface User extends CustomUser {}

  interface Session {
    user: CustomUser;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    _id?: Types.ObjectId;
    id?: string;
    surname?: string;
    username?: string;
    bonus_points?: number;
    last_login_date?: Date;
    isAdmin?: boolean;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "signIn" || trigger === "signUp") {
        if (user) {
          token._id = user._id;
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.surname = user.surname;
          token.username = user.username;
          token.bonus_points = user.bonus_points;
          token.last_login_date = user.last_login_date;
          token.isAdmin = user.isAdmin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          _id: token._id as Types.ObjectId,
          id: token.id ?? "",
          email: token.email ?? "",
          name: token.name ?? "",
          surname: token.surname ?? "",
          username: token.username ?? "",
          bonus_points: token.bonus_points ?? 0,
          last_login_date: token.last_login_date,
          isAdmin: token.isAdmin ?? false,
        },
      };
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google" && profile?.email) {
          await connectToDatabase();

          const existingUser = await User.findOne({
            email: profile.email.toLowerCase(),
          }).exec();

          if (!existingUser) {
            // Split Google name into first and last name
            let name = profile.given_name || "";
            let surname = profile.family_name || "";

            const newUser = await User.create({
              email: profile.email.toLowerCase(),
              username: profile.email.split("@")[0], // Create username from email
              name,
              surname,
              sign_up_date: new Date(),
              last_login_date: new Date(),
              bonus_points: 0,
              oauth_provider: "google",
              password: undefined, // No password for OAuth users
            });

            Object.assign(user, {
              _id: newUser._id,
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
              surname: newUser.surname,
              username: newUser.username,
              bonus_points: newUser.bonus_points,
              last_login_date: newUser.last_login_date,
            });
          } else {
            // Update last login date for existing users
            await User.findByIdAndUpdate(existingUser._id, {
              last_login_date: new Date(),
            });

            Object.assign(user, {
              _id: existingUser._id,
              id: existingUser._id.toString(),
              email: existingUser.email,
              name: existingUser.name,
              surname: existingUser.surname,
              username: existingUser.username,
              bonus_points: existingUser.bonus_points,
              last_login_date: new Date(),
            });
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          _id: profile.sub, // Added for consistency
          name: profile.given_name,
          surname: profile.family_name,
          email: profile.email,
          username: profile.email.split("@")[0],
          bonus_points: 0,
          last_login_date: new Date(),
          isAdmin: false,
        };
      },
    }),
    Credentials({
      async authorize(credentials: {
        email?: string;
        password?: string;
      }): Promise<CustomUser | null> {
        try {
          await connectToDatabase();

          if (!credentials?.password || !credentials?.email) {
            throw new AuthError("Missing credentials");
          }

          const user = await User.findOne({ email: credentials.email }).exec();

          if (!user) {
            throw new AuthError("Invalid email or password");
          }

          if (user.oauth_provider) {
            throw new AuthError(`Please sign in with ${user.oauth_provider}`);
          }

          if (!user.password) {
            throw new AuthError("Password not set for this account");
          }

          const passwordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordCorrect) {
            throw new AuthError("Password is incorrect");
          }

          // Update last login date
          await User.findByIdAndUpdate(user._id, {
            last_login_date: new Date(),
          });

          if (!user.isVerified) {
            throw new AuthError(
              "Please verify your email address before logging in"
            );
          }

          return {
            _id: user._id,
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            surname: user.surname,
            username: user.username,
            bonus_points: user.bonus_points,
            last_login_date: new Date(),
          };
        } catch (error) {
          console.error("Auth error:", error);
          if (error instanceof AuthError) {
            throw error;
          }
          throw new AuthError("An unexpected error occurred");
        }
      },
    }),
  ],
});
