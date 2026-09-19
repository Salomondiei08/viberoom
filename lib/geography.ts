import type { Application } from "./applications";

export type Country = { key: string; name: string; lat: number; lng: number; aliases: string[] };

/** Country centers are used only to place submitted locations on the globe. */
export const countries: Country[] = [
  { key: "ci", name: "Côte d’Ivoire", lat: 7.54, lng: -5.55, aliases: ["côte d'ivoire", "cote d'ivoire", "côte d’ivoire", "cote d’ivoire", "abidjan", "bouaké", "bouake", "yamoussoukro", "gagnoa", "ci"] },
  { key: "bf", name: "Burkina Faso", lat: 12.37, lng: -1.52, aliases: ["burkina", "ouagadougou", "banfora"] },
  { key: "gh", name: "Ghana", lat: 7.95, lng: -1.02, aliases: ["ghana", "accra", "gh"] },
  { key: "tg", name: "Togo", lat: 8.62, lng: 0.82, aliases: ["togo", "lomé", "lome"] },
  { key: "bj", name: "Bénin", lat: 9.31, lng: 2.32, aliases: ["bénin", "benin", "cotonou"] },
  { key: "fr", name: "France", lat: 46.23, lng: 2.21, aliases: ["france", "courbevoie", "paris"] },
  { key: "sn", name: "Sénégal", lat: 14.50, lng: -14.45, aliases: ["sénégal", "senegal", "dakar"] },
  { key: "ng", name: "Nigeria", lat: 9.08, lng: 8.68, aliases: ["nigeria", "lagos", "abuja"] },
  { key: "cm", name: "Cameroun", lat: 7.37, lng: 12.35, aliases: ["cameroun", "cameroon", "yaoundé", "yaounde", "douala"] },
  { key: "ml", name: "Mali", lat: 17.57, lng: -3.99, aliases: ["mali", "bamako"] },
];

export function countryForLocation(location: string): Country | undefined {
  const normalized = location.toLocaleLowerCase("fr");
  return countries.find(country => country.aliases.some(alias => normalized.includes(alias)));
}

export type LocatedApplication = Application & { country?: Country };
export function locateApplications(applications: Application[]): LocatedApplication[] {
  return applications.map(application => ({ ...application, country: countryForLocation(application.location) }));
}
