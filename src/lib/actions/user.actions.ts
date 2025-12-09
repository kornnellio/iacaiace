"use server";

import bcrypt from "bcryptjs";
import { connectToDatabase } from "../database";
import { NewsletterEmail, User } from "@/lib/database/models/models";
import { Types } from "mongoose";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

// Input and Response types
interface UserInput {
  email?: string;
  username?: string;
  name?: string;
  surname?: string;
  currentPassword?: string;
  password?: string;
  bonus_points?: number;
  newsletter?: boolean;
}

interface UserResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  surname: string;
  bonus_points: number;
  sign_up_date: Date;
  last_login_date?: Date;
}

interface UserActionReturn {
  error?: string;
  user?: UserResponse;
}

interface UsersActionReturn {
  error?: string;
  users?: UserResponse[];
}

// Helper function to convert User document to UserResponse
function convertToResponse(user: any): UserResponse {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    name: user.name,
    surname: user.surname,
    bonus_points: user.bonus_points,
    sign_up_date: user.sign_up_date,
    last_login_date: user.last_login_date,
  };
}

// Create new user
export async function createUser(
  userData: UserInput
): Promise<UserActionReturn> {
  try {
    await connectToDatabase();
    const {
      email,
      username,
      password,
      name,
      surname,
      bonus_points = 0,
      newsletter = false,
    } = userData;

    if (!email || !username || !password || !name || !surname) {
      throw new Error("Missing required fields");
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      throw new Error(
        existingUser.email === email.toLowerCase()
          ? "Email already in use"
          : "Username already taken"
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token (6 random numbers)
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create user with verification token
    const user = await User.create({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      name,
      surname,
      bonus_points,
      sign_up_date: new Date(),
      orders: [],
      address: [],
      verificationToken,
      isVerified: false,
    });

    // Send verification email
    await resend.emails.send({
      from: "iaCaiace.ro <verify@iacaiace.ro>",
      to: email,
      subject: "Verifică-ți adresa de email",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
              .content { padding: 20px; background-color: white; border-radius: 5px; }
              .verification-code { font-size: 32px; text-align: center; letter-spacing: 5px; margin: 20px 0; color: #007bff; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #007bff; margin: 0;">Bine ai venit la iaCaiace.ro!</h1>
              </div>
              <div class="content">
                <p>Salut ${name},</p>
                <p>Îți mulțumim că ți-ai creat un cont la noi. Pentru a finaliza înregistrarea, te rugăm să folosești următorul cod de verificare:</p>
                <div class="verification-code">${verificationToken}</div>
                <p>Acest cod va expira în 24 de ore.</p>
                <p>Dacă nu tu ți-ai creat acest cont, te rugăm să ignori acest email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} iaCaiace.ro. Toate drepturile rezervate.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (newsletter) {
      // Add to newsletter collection
      await NewsletterEmail.create({
        email: email,
        name: name,
        surname: surname,
      });

      // Add to Resend audience
      await resend.contacts.create({
        email: email,
        firstName: name,
        lastName: surname,
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_ID || "",
      });
    }

    return { user: convertToResponse(user) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

// Update existing user
export async function updateUser(
  userId: string,
  userData: UserInput
): Promise<UserActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Handle password change
    if (userData.currentPassword && userData.password) {
      // Verify current password
      if (!userData.currentPassword) {
        throw new Error("Current password is required");
      }
      const isMatch = await bcrypt.compare(
        userData.currentPassword,
        user.password ?? ""
      );
      if (!isMatch) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      userData.password = hashedPassword;
    } else if (userData.password) {
      throw new Error("Current password is required to change password");
    }

    // Remove currentPassword from update data
    const { currentPassword, ...updateData } = userData;

    // Check email/username uniqueness if they're being changed
    if (updateData.email || updateData.username) {
      const conditions = [];
      if (updateData.email) {
        conditions.push({ email: updateData.email.toLowerCase() });
      }
      if (updateData.username) {
        conditions.push({ username: updateData.username });
      }

      const existingUser = await User.findOne({
        $or: conditions,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new Error(
          existingUser.email === updateData.email?.toLowerCase()
            ? "Email already in use"
            : "Username already taken"
        );
      }
    }

    // Update email to lowercase if provided
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...updateData },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("Failed to update user");
    }

    return { user: convertToResponse(updatedUser) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

// Delete user
export async function deleteUser(
  userId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has any order
    if (user.orders.length > 0) {
      throw new Error("Cannot delete user with existing order");
    }

    await User.findByIdAndDelete(userId);

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

// Get all users
export async function getUsers(): Promise<UsersActionReturn> {
  try {
    await connectToDatabase();
    const users = await User.find().sort({ username: 1 });
    return {
      users: users.map(convertToResponse),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

// Get specific user
export async function getUser(userId: string): Promise<UserActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return { user: convertToResponse(user) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch user",
    };
  }
}

// Update user bonus points
export async function updateUserBonusPoints(
  userId: string,
  points: number
): Promise<UserActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { bonus_points: points } },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return { user: convertToResponse(user) };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update bonus points",
    };
  }
}

// Get user profile with orders
export async function getUserProfile(
  userId: string
): Promise<UserActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId)
      .populate({
        path: "orders",
        options: { sort: { order_placed_date: -1 } },
      })
      .populate("address");

    if (!user) {
      throw new Error("User not found");
    }

    return { user: convertToResponse(user) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch user profile",
    };
  }
}

// Update last login date
export async function updateLastLogin(
  userId: string
): Promise<UserActionReturn> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { last_login_date: new Date() },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return { user: convertToResponse(user) };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update last login",
    };
  }
}

// Validate password
export async function validatePassword(
  userId: string,
  password: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password ?? "");
    return { valid: isMatch };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Failed to validate password",
    };
  }
}

// Add new verification action
export async function verifyEmail(
  email: string,
  token: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isVerified) {
      throw new Error("Email already verified");
    }

    if (user.verificationToken !== token) {
      throw new Error("Invalid verification token");
    }

    await User.findByIdAndUpdate(user._id, {
      verificationToken: null,
      isVerified: true,
    });

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to verify email",
    };
  }
}

// Generate reset token and send email
export async function initiatePasswordReset(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security reasons, always return success even if email doesn't exist
      return { success: true };
    }

    // Generate reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token and expiry
    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    // Send reset email
    await resend.emails.send({
      from: "iaCaiace.ro <reset@iacaiace.ro>",
      to: email,
      subject: "Resetează-ți parola",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
              .content { padding: 20px; background-color: white; border-radius: 5px; }
              .reset-code { font-size: 32px; text-align: center; letter-spacing: 5px; margin: 20px 0; color: #dc3545; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #dc3545; margin: 0;">Cerere de Resetare Parolă</h1>
              </div>
              <div class="content">
                <p>Salut,</p>
                <p>Am primit o cerere de resetare a parolei tale. Te rugăm să folosești următorul cod pentru a-ți reseta parola:</p>
                <div class="reset-code">${resetToken}</div>
                <p>Acest cod va expira în 1 oră.</p>
                <p>Dacă nu tu ai solicitat această resetare a parolei, te rugăm să ignori acest email sau să contactezi suportul dacă ai nelămuriri.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} iaCaiace.ro. Toate drepturile rezervate.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to initiate password reset",
    };
  }
}

// Reset password with token
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await connectToDatabase();

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to reset password",
    };
  }
}
