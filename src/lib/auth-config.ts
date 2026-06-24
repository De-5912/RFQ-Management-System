export function getCompanyEmailPolicy() {
  const domain = process.env.COMPANY_EMAIL_DOMAIN?.trim().toLowerCase() || "";

  return {
    domain,
    isConfigured: Boolean(domain),
    allows(email: string) {
      if (!domain) return true;
      return email.toLowerCase().endsWith(`@${domain}`);
    },
  };
}

export const futureAuthIntegrations = [
  "email_otp",
  "email_verification",
  "mfa",
  "azure_ad",
  "google_workspace",
] as const;
