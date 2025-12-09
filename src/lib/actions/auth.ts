"use server";

import { signIn } from "@/lib/auth/authOptions";
import { AuthError } from "next-auth";

export async function authenticate(formData: {
  email: string;
  password: string;
}) {
  try {
    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      const cleanError = result.error.split("Read more")[0].trim();
      return {
        error: { message: cleanError },
      };
    }

    return { success: true, message: "Login successful" };
  } catch (error) {
    if (error instanceof AuthError) {
      const cleanError = error.message.split("Read more")[0].trim();
      return {
        error: { message: cleanError },
      };
    }
    return {
      error: { message: "An unexpected error occurred" },
    };
  }
}
