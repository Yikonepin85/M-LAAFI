
import type { ProfessionalTitle, MedicalSpecialty, Gender, MedicalTestStatus } from '@/lib/constants';

export interface CaregiverInfo {
  name: string;
  title: ProfessionalTitle;
  specialty?: MedicalSpecialty | '';
}

export interface PatientInfo {
  firstName: string;
  lastName: string;
  sex: Gender;
  age: number;
}

export interface Vitals {
  weight?: number; // kg
  height?: number; // cm
  bloodPressure?: string; // "120/80"
  heartRate?: number; // bpm
  temperature?: number; // °C
}

export interface Consultation {
  id: string;
  caregiver: CaregiverInfo;
  patient: PatientInfo;
  vitals: Vitals;
  imc?: number;
  imcCategory?: string;
  notes?: string;
  createdAt: string; // ISO date string
  hasAppointment?: boolean;
  appointmentType?: 'results_presentation' | 'control' | '';
  location?: {
    establishment: string;
    address?: string;
  };
}

export interface Medication {
  id: string;
  name: string;
  intakeTimes: string[]; // e.g., ["08:00", "20:00"]
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  notes?: string;
  consultationId?: string; // ID de la consultation d'origine
  patientFullName?: string; // Nom complet du patient pour ce médicament si prescrit
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty?: MedicalSpecialty | '';
  contactPhone?: string;
  dateTime: string; // ISO date string
  location?: string; // Address or geolocation string
  notes?: string;
  consultationId?: string; // ID de la consultation d'origine
  patientFullName?: string; // Nom complet du patient pour ce RDV
}

export interface MedicalTest {
  id: string;
  name: string;
  patientFullName: string;
  prescribedDate: string; // ISO date string
  status: MedicalTestStatus;
  notes?: string;
  consultationId?: string;
  results?: string;
  resultsDate?: string; // ISO date string
}

export interface VitalRecord {
  id: string;
  date: string; // ISO date string
  weight?: number; // kg
  bloodPressure?: string; // "120/80 mmHg"
  heartRate?: number; // bpm
  temperature?: number; // °C
  notes?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  sex: Gender;
  birthDate: string; // ISO date string
}
