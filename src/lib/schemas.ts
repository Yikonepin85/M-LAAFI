
import { z } from 'zod';
import { PROFESSIONAL_TITLES, MEDICAL_SPECIALTIES, GENDERS, MEDICAL_TEST_STATUSES } from './constants';
import { format, formatISO, parseISO } from 'date-fns';

export const CaregiverInfoSchema = z.object({
  name: z.string().min(2, "Le nom du soignant est requis."),
  title: z.enum(PROFESSIONAL_TITLES, { errorMap: () => ({ message: "Titre professionnel invalide." })}),
  specialty: z.enum(MEDICAL_SPECIALTIES).optional().or(z.literal('')),
}).refine(data => data.title === 'Docteur' ? !!data.specialty : true, {
  message: "La spécialité est requise pour les docteurs.",
  path: ["specialty"],
});

export const PatientInfoSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  sex: z.enum(GENDERS, { errorMap: () => ({ message: "Sexe invalide." })}),
  age: z.coerce.number({required_error: "L'âge est requis."}).min(0, "L'âge doit être positif.").max(150, "Âge invalide."),
});

export const VitalsSchema = z.object({
  weight: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({ invalid_type_error: "Le poids doit être un nombre." }).positive("Le poids doit être positif.").optional()
  ),
  height: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({ invalid_type_error: "La taille doit être un nombre." }).positive("La taille doit être positive.").optional()
  ),
  bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format tension: 120/80").optional().or(z.literal('')),
  heartRate: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({ invalid_type_error: "La fréquence cardiaque doit être un nombre." }).positive("Fréquence cardiaque invalide.").optional()
  ),
  temperature: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({ invalid_type_error: "La température doit être un nombre." }).optional()
  ),
});

export const ConsultationSchema = z.object({
  patientId: z.string().min(1, "La sélection d'un patient est requise."),
  caregiver: CaregiverInfoSchema,
  patient: PatientInfoSchema,
  vitals: VitalsSchema,
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
  hasAppointment: z.boolean().optional(),
  appointmentType: z.enum(['results_presentation', 'control', '']).optional(),
  location: z.object({
      establishment: z.string().min(1, "Le nom de l'établissement est requis."),
      address: z.string().optional().or(z.literal('')),
  }).optional(),
}).refine(data => {
  if (data.hasAppointment === true) {
    return data.appointmentType === 'results_presentation' || data.appointmentType === 'control';
  }
  return true;
}, {
  message: "Veuillez sélectionner un type de RDV lorsque 'RDV' est 'Oui'.",
  path: ["appointmentType"],
}).transform(data => {
    if (data.hasAppointment === false && data.appointmentType && data.appointmentType !== '') {
        return { ...data, appointmentType: '' };
    }
    return data;
});

export const MedicationSchema = z.object({
  patientId: z.string().min(1, "Veuillez sélectionner un patient."),
  name: z.string().min(1, "Le nom du médicament est requis."),
  intakeTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format heure invalide HH:MM")).min(1, "Au moins une heure de prise est requise."),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Date de début invalide." }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Date de fin invalide." }),
  notes: z.string().optional(),
  consultationId: z.string().optional(),
  patientFullName: z.string().optional(),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "La date de fin doit être après la date de début.",
  path: ["endDate"],
});


export const AppointmentSchema = z.object({
  patientId: z.string().min(1, "Veuillez sélectionner un patient."),
  doctorName: z.string().min(1, "Le nom du médecin est requis."),
  specialty: z.enum(MEDICAL_SPECIALTIES).optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  dateTime: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Date et heure invalides." }),
  location: z.string().optional(),
  notes: z.string().optional(),
  consultationId: z.string().optional(),
  patientFullName: z.string().optional(),
});

export const PinSchema = z.object({
  pin: z.string().min(4, "Le PIN doit comporter au moins 4 chiffres.").max(8, "Le PIN ne doit pas dépasser 8 chiffres."),
  confirmPin: z.string().optional(), // Optional for login, required for setup
}).refine(data => !data.confirmPin || data.pin === data.confirmPin, {
  message: "Les PINs ne correspondent pas.",
  path: ["confirmPin"],
});

export const EmailConfigSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});

export const MedicalTestSchema = z.object({
  patientId: z.string().min(1, "Veuillez sélectionner un patient."),
  name: z.string().min(1, "Le nom de l'examen est requis."),
  patientFullName: z.string().min(1, "Le nom du patient est requis."),
  prescribedDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Date de prescription invalide." }),
  status: z.enum(MEDICAL_TEST_STATUSES, { errorMap: () => ({ message: "Statut invalide." })}),
  notes: z.string().optional(),
  consultationId: z.string().optional(),
  results: z.string().optional(),
  resultsDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), { message: "Date des résultats invalide." }).optional(),
}).transform(data => {
  const newData = { ...data };
  if (newData.results && newData.results.trim() !== '') {
    newData.status = "Résultats disponibles";
    if (!newData.resultsDate) {
      newData.resultsDate = formatISO(new Date());
    }
  }
  return newData;
});

export const VitalRecordSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Date de mesure invalide." }),
  weight: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({invalid_type_error: "Le poids doit être un nombre."}).positive("Le poids doit être positif.").optional()
  ),
  bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format de tension artérielle invalide (ex: 120/80).").optional().or(z.literal('')),
  heartRate: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({invalid_type_error: "La fréquence cardiaque doit être un nombre."}).positive("La fréquence cardiaque doit être positive.").optional()
  ),
  temperature: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({invalid_type_error: "La température doit être un nombre."}).optional()
  ),
  notes: z.string().optional(),
});

export const PatientSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  sex: z.enum(GENDERS, { errorMap: () => ({ message: "Sexe invalide." }) }),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Date de naissance invalide." }),
});
