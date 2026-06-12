import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { ENV } from "../config/environment";
import { sendEmail } from "../services/emailService";

const client = new MongoClient(ENV.MONGODB_URI);

export const auth = betterAuth({
    database: mongodbAdapter(client.db()),
    emailAndPassword: {
        enabled: true,
        async sendVerificationEmail({ user, url }: { user: any; url: string }) {
            await sendEmail(
                user.email,
                "Verify your email",
                `Please verify your email by clicking this link: ${url}`,
                `<p>Please verify your email by clicking the link below:</p><p><a href="${url}">${url}</a></p>`
            );
        },
        async sendResetPasswordEmail({ user, url }: { user: any; url: string }) {
            await sendEmail(
                user.email,
                "Reset your password",
                `Reset your password by clicking this link: ${url}`,
                `<p>Reset your password by clicking the link below:</p><p><a href="${url}">${url}</a></p>`
            );
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
            },
        },
    },
    trustedOrigins: [ENV.CLIENT_FRONTEND_URL, ENV.ADMIN_FRONTEND_URL],
});
