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
            redirectURI: ENV.GOOGLE_REDIRECT_URI ||
                `${ENV.CLIENT_FRONTEND_URL.replace(/\/$/, '')}/api/auth/callback/google`,
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
    account: {
        // The browser returns from Google to a different site (Render), and
        // Firefox is not sending the short-lived state cookie on that
        // callback. The state is still validated against the single-use,
        // expiring verification record stored in MongoDB.
        skipStateCookieCheck: true,
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
        // The OAuth state is set before navigating to Google and is returned
        // on a top-level callback. Lax avoids relying on third-party-cookie
        // behavior. Session cookies retain the global None setting above.
        cookies: {
            state: {
                attributes: {
                    sameSite: 'lax',
                },
            },
            oauth_state: {
                attributes: {
                    sameSite: 'lax',
                },
            },
        },
    },
});
