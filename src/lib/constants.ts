
export const PROFESSIONAL_TITLES = [
  "Docteur",
  "Infirmier",
  "Sage-femme",
  "Kinésithérapeute",
  "Pharmacien",
] as const;

export type ProfessionalTitle = typeof PROFESSIONAL_TITLES[number];

export const MEDICAL_SPECIALTIES = [
  "Allergologie et immunologie clinique",
  "Anatomie et cytologie pathologiques",
  "Anesthésiologie-réanimation",
  "Biologie médicale",
  "Cardiologie",
  "Chirurgie dentaire", // Ajouté
  "Chirurgie générale",
  "Chirurgie infantile",
  "Chirurgie maxillo-faciale",
  "Chirurgie orthopédique et traumatologique",
  "Chirurgie plastique, reconstructrice et esthétique",
  "Chirurgie thoracique et cardiovasculaire",
  "Chirurgie urologique",
  "Chirurgie vasculaire",
  "Chirurgie viscérale et digestive",
  "Dermatologie et vénérologie",
  "Endocrinologie-diabétologie-nutrition",
  "Gastro-entérologie et hépatologie",
  "Génétique médicale",
  "Gériatrie",
  "Gynécologie médicale",
  "Gynécologie obstétrique",
  "Hématologie",
  "Hépatologie",
  "Infectiologie",
  "Médecine du travail",
  "Médecine d'urgence",
  "Médecine générale",
  "Médecine intensive-réanimation",
  "Médecine interne",
  "Médecine légale et expertises médicales",
  "Médecine nucléaire",
  "Médecine physique et de réadaptation",
  "Néphrologie",
  "Neurochirurgie",
  "Neurologie",
  "Odontologie", // Ajouté (spécialité dentaire)
  "Oncologie médicale",
  "Oncologie radiothérapique",
  "Ophtalmologie",
  "Oto-rhino-laryngologie (ORL) et chirurgie cervico-faciale",
  "Pédiatrie",
  "Pneumologie",
  "Psychiatrie",
  "Radiologie et imagerie médicale",
  "Rhumatologie",
  "Santé publique",
  "Stomatologie",
  "Urologie",
] as const;

export type MedicalSpecialty = typeof MEDICAL_SPECIALTIES[number];

export interface BMICategory {
  label: string;
  min: number;
  max: number;
  colorClass: string; // Tailwind CSS class for color
  emoji?: string; // Optional emoji
}

export const BMI_CATEGORIES: BMICategory[] = [
  { label: "Insuffisance pondérale", min: 0, max: 18.49, colorClass: "bg-blue-500 text-white", emoji: "🔵" },
  { label: "Normal", min: 18.5, max: 24.99, colorClass: "bg-green-500 text-white", emoji: "🟢" },
  { label: "Surpoids", min: 25, max: 29.99, colorClass: "bg-orange-500 text-white", emoji: "🟠" },
  { label: "Obésité modérée", min: 30, max: 34.99, colorClass: "bg-red-500 text-white", emoji: "🔴" },
  { label: "Obésité sévère", min: 35, max: 39.99, colorClass: "bg-red-700 text-white", emoji: "🟤" },
  { label: "Obésité morbide", min: 40, max: Infinity, colorClass: "bg-black text-white", emoji: "⚫" },
];

export const GENDERS = ["Masculin", "Féminin"] as const;
export type Gender = typeof GENDERS[number];

export const APP_INFO = {
  developer: "Jean René BATIONO",
  email: "yikonepin@gmail.com",
  phones: ["+226 70 70 66 77"],
};

export const MEDICAL_TEST_STATUSES = [
  "Prescrit",
  "Prélèvement effectué",
  "En attente de résultats",
  "Résultats disponibles",
  "Effectué/Terminé"
] as const;

export type MedicalTestStatus = typeof MEDICAL_TEST_STATUSES[number];
