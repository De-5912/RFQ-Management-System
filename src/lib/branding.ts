export function getBranding() {
  const companyName = process.env.COMPANY_NAME?.trim() || "Company Procurement";
  const logoUrl = process.env.COMPANY_LOGO_URL?.trim() || "";

  return {
    companyName,
    logoUrl,
    initials: companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CP",
  };
}
