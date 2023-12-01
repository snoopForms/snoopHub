import { env } from "@/env.mjs";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@formbricks/database";
import { EMAIL_VERIFICATION_DISABLED, INTERNAL_SECRET, WEBAPP_URL } from "@formbricks/lib/constants";
import { verifyToken } from "@formbricks/lib/jwt";
import { getProfileByEmail } from "@formbricks/lib/profile/service";
import Providers from "next-auth/providers";
import {
  TIntegration,
  TSlackConfig,
  TSlackConfigData,
  TSlackCredential,
  TSlackIntegration,
} from "@formbricks/types/v1/integrations";
import type { IdentityProvider } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import SlackProvider from "next-auth/providers/slack";
import { cn } from "@formbricks/lib/cn";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: {
          label: "Email Address",
          type: "email",
          placeholder: "Your email address",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Your password",
        },
      },
      async authorize(credentials, _req) {
        let user;
        try {
          user = await prisma.user.findUnique({
            where: {
              email: credentials?.email,
            },
          });
        } catch (e) {
          console.error(e);
          throw Error("Internal server error. Please try again later");
        }

        if (!user || !credentials) {
          throw new Error("No user matches the provided credentials");
        }
        if (!user.password) {
          throw new Error("No user matches the provided credentials");
        }

        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) {
          throw new Error("No user matches the provided credentials");
        }

        return {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.firstname,
          emailVerified: user.emailVerified,
        };
      },
    }),
    CredentialsProvider({
      id: "token",
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Token",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        token: {
          label: "Verification Token",
          type: "string",
        },
      },
      async authorize(credentials, _req) {
        let user;
        try {
          if (!credentials?.token) {
            throw new Error("Token not found");
          }
          const { id } = await verifyToken(credentials?.token);
          user = await prisma.user.findUnique({
            where: {
              id: id,
            },
          });
        } catch (e) {
          console.error(e);
          throw new Error("Either a user does not match the provided token or the token is invalid");
        }

        if (!user) {
          throw new Error("Either a user does not match the provided token or the token is invalid");
        }

        if (user.emailVerified) {
          throw new Error("Email already verified");
        }

        user = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: { emailVerified: new Date().toISOString() },
        });

        return {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.firstname,
          emailVerified: user.emailVerified,
        };
      },
    }),
    GitHubProvider({
      clientId: env.GITHUB_ID || "",
      clientSecret: env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    SlackProvider({
      clientId: env.SLACK_CLIENT_ID as string,
      clientSecret: env.SLACK_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
      wellKnown: "",
      token: {
        async request(context) {
          const formData = new URLSearchParams();
          formData.append("code", context.params.code ?? "");
          formData.append("client_id", context.provider.clientId ?? "");
          formData.append("client_secret", context.provider.clientSecret ?? "");

          try {
            const response = await fetch("https://slack.com/api/oauth.access", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();
            return {
              tokens: {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: data.expires_in,
                user_id: data.user_id,
                team_id: data.team_id,
                team_name: data.team_name,
              },
            };
          } catch (error) {
            throw error;
          }
        },
      },
      userinfo: {
        async request(context) {
          const formData = new URLSearchParams();
          formData.append("user", context.tokens.user_id ?? "");

          const response = await fetch(`https://slack.com/api/users.info`, {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${context.tokens.access_token}`,
            },
          });

          console.log(response);

          const data = await response.json();

          console.log("============responsetype===============");
          // console.log(data)

          // if (!response.ok) {
          //   throw new Error(`HTTP error! status: ${response.status}`);
          // }

          console.log(data);

          // Slack APIs always respond with an 'ok' field in the JSON response
          // If 'ok' is false, there's an error. Here we throw an error if 'ok' is false.
          if (!data.ok) {
            throw new Error(data.error);
          }

          return {
            name: data.user.name,
            sub: data.user.id,
            email: data.user.profile.email,
            image: data.user.profile.image_original,
          };
        },
      },
      authorization: {
        url: "https://slack.com/oauth/authorize",
        params: {
          scope: "channels:read,groups:read,mpim:read,im:read,users:read,users.profile:read,users:read.email",
        },
      },
      idToken: false,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const existingUser = await getProfileByEmail(token?.email!);

      if (!existingUser) {
        return token;
      }

      let additionalAttributes: any = {
        id: existingUser.id,
        createdAt: existingUser.createdAt,
        onboardingCompleted: existingUser.onboardingCompleted,
        name: existingUser.name,
      };

      if (account && account.provider && account.provider === "slack") {
        const accountAttributes = {
          accessToken: account.access_token,
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };

        additionalAttributes = { ...additionalAttributes, accountAttributes };
      }

      return {
        ...token,
        ...additionalAttributes,
      };
    },
    // @ts-nocheck
    async session({ session, token }) {
      if (token.accountAttributes) {
        // @ts-ignore
        session.user.accessToken = token.accountAttributes.accessToken;
        // @ts-ignore
        session.user.idToken = token.accountAttributes.idToken;
        // @ts-ignore
        session.user.refreshToken = token.accountAttributes.refreshToken;
        // @ts-ignore
        session.user.expiresAt = token.accountAttributes.expiresAt;
      }

      // @ts-ignore
      session.user.id = token?.id;
      // @ts-ignore
      session.user.createdAt = token?.createdAt ? new Date(token?.createdAt).toISOString() : undefined;
      // @ts-ignore
      session.user.onboardingCompleted = token?.onboardingCompleted;
      // @ts-ignore
      session.user.name = token.name || "";

      return session;
    },
    async signIn({ user, account }: any) {
      console.log("===================signin=======================");
      console.log(user, account);
      if (account.provider === "credentials" || account.provider === "token") {
        if (!user.emailVerified && !EMAIL_VERIFICATION_DISABLED) {
          return `/auth/verification-requested?email=${encodeURIComponent(user.email)}`;
        }
        return true;
      }

      if (!user.email || !user.name || account.type !== "oauth") {
        return false;
      }

      if (account.provider) {
        // Handle Logic of Connecting with the slack Integration
        if (account.provider === "slack") {
          return true;
        }

        const provider = account.provider.toLowerCase() as IdentityProvider;
        // check if accounts for this provider / account Id already exists
        const existingUserWithAccount = await prisma.user.findFirst({
          include: {
            accounts: {
              where: {
                provider: account.provider,
              },
            },
          },
          where: {
            identityProvider: provider,
            identityProviderAccountId: account.providerAccountId,
          },
        });

        if (existingUserWithAccount) {
          // User with this provider found
          // check if email still the same
          if (existingUserWithAccount.email === user.email) {
            return true;
          }

          // user seemed to change his email within the provider
          // check if user with this email already exist
          // if not found just update user with new email address
          // if found throw an error (TODO find better solution)
          const otherUserWithEmail = await prisma.user.findFirst({
            where: { email: user.email },
          });

          if (!otherUserWithEmail) {
            await prisma.user.update({
              where: { id: existingUserWithAccount.id },
              data: { email: user.email },
            });
            return true;
          }
          return "/auth/login?error=Looks%20like%20you%20updated%20your%20email%20somewhere%20else.%0AA%20user%20with%20this%20new%20email%20exists%20already.";
        }

        // There is no existing account for this identity provider / account id
        // check if user account with this email already exists
        // if user already exists throw error and request password login
        const existingUserWithEmail = await prisma.user.findFirst({
          where: { email: user.email },
        });

        if (existingUserWithEmail) {
          return "/auth/login?error=A%20user%20with%20this%20email%20exists%20already.";
        }

        const createdUser = await prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            emailVerified: new Date(Date.now()),
            onboardingCompleted: false,
            identityProvider: provider,
            identityProviderAccountId: user.id as string,
            accounts: {
              create: [{ ...account }],
            },
            memberships: {
              create: [
                {
                  accepted: true,
                  role: "owner",
                  team: {
                    create: {
                      name: `${user.name}'s Team`,
                      products: {
                        create: [
                          {
                            name: "My Product",
                            environments: {
                              create: [
                                {
                                  type: "production",
                                  eventClasses: {
                                    create: [
                                      {
                                        name: "New Session",
                                        description: "Gets fired when a new session is created",
                                        type: "automatic",
                                      },
                                      {
                                        name: "Exit Intent (Desktop)",
                                        description: "A user on Desktop leaves the website with the cursor.",
                                        type: "automatic",
                                      },
                                      {
                                        name: "50% Scroll",
                                        description: "A user scrolled 50% of the current page",
                                        type: "automatic",
                                      },
                                    ],
                                  },
                                  attributeClasses: {
                                    create: [
                                      {
                                        name: "userId",
                                        description: "The internal ID of the person",
                                        type: "automatic",
                                      },
                                      {
                                        name: "email",
                                        description: "The email of the person",
                                        type: "automatic",
                                      },
                                    ],
                                  },
                                },
                                {
                                  type: "development",
                                  eventClasses: {
                                    create: [
                                      {
                                        name: "New Session",
                                        description: "Gets fired when a new session is created",
                                        type: "automatic",
                                      },
                                      {
                                        name: "Exit Intent (Desktop)",
                                        description: "A user on Desktop leaves the website with the cursor.",
                                        type: "automatic",
                                      },
                                      {
                                        name: "50% Scroll",
                                        description: "A user scrolled 50% of the current page",
                                        type: "automatic",
                                      },
                                    ],
                                  },
                                  attributeClasses: {
                                    create: [
                                      {
                                        name: "userId",
                                        description: "The internal ID of the person",
                                        type: "automatic",
                                      },
                                      {
                                        name: "email",
                                        description: "The email of the person",
                                        type: "automatic",
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
          include: {
            memberships: true,
          },
        });

        const teamId = createdUser.memberships?.[0]?.teamId;
        if (teamId) {
          fetch(`${WEBAPP_URL}/api/v1/teams/${teamId}/add_demo_product`, {
            method: "POST",
            headers: {
              "x-api-key": INTERNAL_SECRET,
            },
          });
        }

        return true;
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/login", // Error code passed in query string as ?error=
  },
};

// Nahi Chalta hai
// https://slack.com/openid/connect/authorize?client_id=5781516181558.6018565403344&scope=channels:read,groups:read,mpim:read,im:read&response_type=code&state=2XTLDiWfqyVmAXCzJPRWscqChn1frWXTojso-dTtW9o

// https://slack.com/openid/connect/authorize?client_id=5781516181558.6018565403344&user_scope=channels:read,groups:read,mpim:read,im:read&response_type=code&redirect_uri=https://localhost:3000/api/auth/callback/slack

// Chalta Hai
// https://gitpodslackte-fow3293.slack.com/oauth?client_id=5781516181558.6018565403344&scope=channels:read,groups:read,mpim:read,im:read&redirect_uri=&state=&granular_bot_scope=1&single_channel=0&install_redirect=&tracked=1&team=
