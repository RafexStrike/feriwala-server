import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { ENV } from "../config/environment";
import { sendEmail } from "../services/emailService";

const client = new MongoClient(ENV.MONGODB_URI);

const sendVerificationEmail = async ({ user, url }: { user: { email: string }; url: string }) => {
    console.info(`[AUTH] Verification email requested for ${user.email}`);
    await sendEmail(
        user.email,
        "Verify your email",
        `Please verify your email by clicking this link: ${url}`,
        `<p>Please verify your email by clicking the link below:</p><p><a href="${url}">${url}</a></p>`
    );
    console.info(`[AUTH] Verification email sent to ${user.email}`);
};

export const auth = betterAuth({
    baseURL: ENV.BETTER_AUTH_URL,
    database: mongodbAdapter(client.db()),
    // Conditionally enable social providers when env vars are present
    socialProviders: ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET ? {
        google: {
            clientId: ENV.GOOGLE_CLIENT_ID,
            clientSecret: ENV.GOOGLE_CLIENT_SECRET,
            redirectURI: `${ENV.BETTER_AUTH_URL.replace(/\/$/, '')}/api/auth/callback/google`,
        }
    } : undefined,
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }: { user: any; url: string }) {
            await sendEmail(
                user.email,
                "Reset your password",
                `Reset your password by clicking this link: ${url}`,
                `<p>Reset your password by clicking the link below:</p><p><a href="${url}">${url}</a></p>`
            );
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        async sendVerificationEmail({ user, url }: { user: { email: string }; url: string }) {
            await sendVerificationEmail({ user, url });
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
    trustedOrigins: [ENV.CLIENT_FRONTEND_URL, ENV.ADMIN_FRONTEND_URL, ENV.BETTER_AUTH_URL].filter(Boolean),
    advanced: {
        useSecureCookies: ENV.NODE_ENV === 'production',
        defaultCookieAttributes: ENV.NODE_ENV === 'production' ? {
            sameSite: 'none',
        } : undefined,
    },
});
