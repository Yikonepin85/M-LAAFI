
"use client";

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Patient, Consultation, Medication, MedicalTest, Appointment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Cake, Calendar, Pill, FlaskConical, Stethoscope, BrainCircuit, Loader2, Activity, TrendingUp, AlertTriangle, CalendarCheck } from 'lucide-react';
import { format, parseISO, differenceInYears, isValid, compareDesc } from 'date-fns';
import { fr } from 'date-fns/locale';
import { summarizePatientRecord, type PatientRecordInput, type PatientRecordOutput } from '@/ai/flows/summarize-patient-record-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Helper to get age from birthDate
const getAgeFromBirthDate = (birthDateString: string): number | null => {
    if (!birthDateString) return null;
    const birthDate = parseISO(birthDateString);
    if (!isValid(birthDate)) return null;
    return differenceInYears(new Date(), birthDate);
}

// Timeline event types
type TimelineEvent = 
  | { type: 'consultation'; date: Date; data: Consultation }
  | { type: 'appointment'; date: Date; data: Appointment }
  | { type: 'medication'; date: Date; data: Medication }
  | { type: 'test'; date: Date; data: MedicalTest };

const EventIcon = ({ type }: { type: TimelineEvent['type'] }) => {
  const iconMap: Record<TimelineEvent['type'], React.ElementType> = {
    consultation: Stethoscope,
    appointment: CalendarCheck,
    medication: Pill,
    test: FlaskConical,
  };
  const Icon = iconMap[type];
  return <Icon className="h-5 w-5 text-primary" />;
};


export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { toast } = useToast();

  const [patients] = useLocalStorage<Patient[]>('patients', []);
  const [consultations] = useLocalStorage<Consultation[]>('consultations', []);
  const [medications] = useLocalStorage<Medication[]>('medications', []);
  const [medicalTests] = useLocalStorage<MedicalTest[]>('medicalTests', []);
  const [appointments] = useLocalStorage<Appointment[]>('appointments', []);
  
  const [summary, setSummary] = useState<PatientRecordOutput | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Memoize patient data and create timeline events
  const { patient, timelineEvents } = useMemo(() => {
    const currentPatient = patients.find(p => p.id === id);
    if (!currentPatient) {
      return { patient: null, timelineEvents: [] };
    }

    const fullName = `${currentPatient.firstName} ${currentPatient.lastName}`;

    // Filter all relevant data for the patient
    const patientConsultations = consultations.filter(c => c.patient.firstName === currentPatient.firstName && c.patient.lastName === currentPatient.lastName);
    const patientMedications = medications.filter(m => m.patientFullName === fullName);
    const patientMedicalTests = medicalTests.filter(t => t.patientFullName === fullName);
    const patientAppointments = appointments.filter(a => a.patientFullName === fullName);

    // Create a flat array of all events
    const events: TimelineEvent[] = [];
    patientConsultations.forEach(c => events.push({ type: 'consultation', date: parseISO(c.createdAt), data: c }));
    patientAppointments.forEach(a => events.push({ type: 'appointment', date: parseISO(a.dateTime), data: a }));
    patientMedications.forEach(m => events.push({ type: 'medication', date: parseISO(m.startDate), data: m }));
    patientMedicalTests.forEach(t => events.push({ type: 'test', date: parseISO(t.prescribedDate), data: t }));

    // Sort events by date, most recent first
    const sortedEvents = events.filter(e => isValid(e.date)).sort((a, b) => compareDesc(a.date, b.date));

    return { patient: currentPatient, timelineEvents: sortedEvents };
  }, [id, patients, consultations, medications, medicalTests, appointments]);
  

  const handleGenerateSummary = async () => {
    if (!patient) return;
    setIsSummaryLoading(true);
    setSummary(null);
    setSummaryError(null);

    // This logic relies on the card-based layout's filtering, which is now inside useMemo.
    // For simplicity, I'll re-filter here. In a larger app, this would be a shared selector.
    const fullName = `${patient.firstName} ${patient.lastName}`;
    const patientConsultations = consultations.filter(c => c.patient.firstName === patient.firstName && c.patient.lastName === patient.lastName);
    const patientMedications = medications.filter(m => m.patientFullName === fullName);
    const patientMedicalTests = medicalTests.filter(t => t.patientFullName === fullName);
    const patientAppointments = appointments.filter(a => a.patientFullName === fullName);

    try {
        const patientAge = getAgeFromBirthDate(patient.birthDate);
        const patientInfo = `Patient: ${patient.firstName} ${patient.lastName}, ${patientAge ? `${patientAge} ans` : 'âge inconnu'}, ${patient.sex}.`;

        const consultationsStr = patientConsultations.length > 0 ? patientConsultations.map(c => 
            `Date: ${format(parseISO(c.createdAt), "P", { locale: fr })}; Soignant: ${c.caregiver.name}; Notes: ${c.notes || 'N/A'}; ` +
            `Vitales: Poids ${c.vitals.weight || 'N/A'}kg, Taille ${c.vitals.height || 'N/A'}cm, Tension ${c.vitals.bloodPressure || 'N/A'}`
        ).join('\n') : "Aucune consultation.";

        const vitalsHistoryStr = patientConsultations.length > 0 ? patientConsultations.map(c => {
             const vitalsParts = [
                c.vitals.weight ? `Poids: ${c.vitals.weight}kg` : null,
                c.vitals.bloodPressure ? `Tension: ${c.vitals.bloodPressure}` : null,
                c.vitals.heartRate ? `Pouls: ${c.vitals.heartRate}bpm` : null,
             ].filter(Boolean).join(', ');
             return `${format(parseISO(c.createdAt), 'P', { locale: fr })}: ${vitalsParts || 'Aucune donnée majeure.'}`;
        }).join('\n') : "Aucun historique de vitales via consultation.";
        
        const medicationsStr = patientMedications.length > 0 ? patientMedications.map(m => 
            `${m.name} (du ${format(parseISO(m.startDate), "P", { locale: fr })} au ${format(parseISO(m.endDate), "P", { locale: fr })})`
        ).join(', ') : "Aucun médicament.";

        const medicalTestsStr = patientMedicalTests.length > 0 ? patientMedicalTests.map(t => 
            `${t.name} (prescrit le ${format(parseISO(t.prescribedDate), "P", { locale: fr })}, statut: ${t.status}, résultats: ${t.results || 'N/A'})`
        ).join('\n') : "Aucun examen médical.";
        
        const appointmentsStr = patientAppointments.length > 0 ? patientAppointments.map(a =>
            `RDV avec ${a.doctorName} le ${format(parseISO(a.dateTime), "Pp", { locale: fr })}`
        ).join('\n') : "Aucun rendez-vous.";

        const input: PatientRecordInput = {
            patientInfo,
            consultations: consultationsStr,
            medications: medicationsStr,
            medicalTests: medicalTestsStr,
            appointments: appointmentsStr,
            vitalsHistory: vitalsHistoryStr,
        };

        const result = await summarizePatientRecord(input);
        setSummary(result);
        toast({ title: "Résumé généré", description: "La synthèse du dossier patient est prête." });

    } catch (error) {
        console.error("Error generating summary:", error);
        setSummaryError("Une erreur est survenue lors de la génération du résumé. Veuillez réessayer.");
        toast({ title: "Erreur", description: "Erreur lors de la génération du résumé.", variant: "destructive" });
    } finally {
        setIsSummaryLoading(false);
    }
  };

  const renderEventContent = (event: TimelineEvent) => {
    switch (event.type) {
      case 'consultation':
        return (
          <>
            <CardTitle>Consultation avec {event.data.caregiver.name}</CardTitle>
            <CardDescription>{event.data.caregiver.specialty || 'Généraliste'}</CardDescription>
            <p className="text-sm mt-2">{event.data.notes || "Aucune note pour cette consultation."}</p>
          </>
        );
      case 'appointment':
        return (
          <>
            <CardTitle>Rendez-vous avec {event.data.doctorName}</CardTitle>
            <CardDescription>{event.data.specialty || 'Généraliste'}</CardDescription>
            <p className="text-sm mt-2">{event.data.location}</p>
          </>
        );
      case 'medication':
        return (
          <>
            <CardTitle>Début du traitement: {event.data.name}</CardTitle>
            <CardDescription>Traitement jusqu'au {format(parseISO(event.data.endDate), "PPP", { locale: fr })}.</CardDescription>
          </>
        );
      case 'test':
        return (
          <>
            <CardTitle>Examen: {event.data.name}</CardTitle>
            <CardDescription>Statut: {event.data.status}</CardDescription>
            {event.data.results && <p className="text-sm mt-2 text-muted-foreground">{event.data.results}</p>}
          </>
        );
      default:
        return null;
    }
  };

  if (!patient) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl font-bold">Patient non trouvé</h2>
        <p className="text-muted-foreground">Le patient que vous recherchez n'existe pas.</p>
        <Button onClick={() => router.push('/patients')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    );
  }
  
  const age = getAgeFromBirthDate(patient.birthDate);
  const birthDate = parseISO(patient.birthDate);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold font-headline">Dossier Patient</h2>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-primary">
            <User className="h-8 w-8"/>
            <span>{patient.firstName} {patient.lastName}</span>
          </CardTitle>
          <CardDescription>{patient.sex}{age !== null ? `, ${age} ans` : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <Cake className="mr-2 h-4 w-4" />
            <span>Né(e) le: {isValid(birthDate) ? format(birthDate, "d MMMM yyyy", { locale: fr }) : "Date invalide"}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="text-primary"/> Résumé Médical par IA
                </div>
                <Button onClick={handleGenerateSummary} disabled={isSummaryLoading} size="sm">
                    {isSummaryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Générer
                </Button>
            </CardTitle>
            <CardDescription>
                Obtenez une synthèse du dossier médical de ce patient, générée par IA.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isSummaryLoading && (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4">Analyse en cours...</p>
                </div>
            )}
            {summaryError && (
                <p className="text-destructive text-sm p-4 text-center">{summaryError}</p>
            )}
            {summary && (
                <ScrollArea className="h-[450px] rounded-md border p-4 bg-muted/20">
                    <div className="space-y-4 text-sm">
                        {summary.overview && (
                            <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2"><User className="h-4 w-4"/>Vue d'ensemble</h4>
                                <p className="p-3 border rounded-md bg-background">{summary.overview}</p>
                            </div>
                        )}
                        {summary.keyMedicalHistory && (
                             <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2"><Stethoscope className="h-4 w-4"/>Historique Médical Clé</h4>
                                <pre className="p-3 border rounded-md bg-background whitespace-pre-wrap font-sans">{summary.keyMedicalHistory}</pre>
                            </div>
                        )}
                        {summary.currentStatus && (
                            <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2"><Activity className="h-4 w-4"/>Statut Actuel</h4>
                                <pre className="p-3 border rounded-md bg-background whitespace-pre-wrap font-sans">{summary.currentStatus}</pre>
                            </div>
                        )}
                        {summary.importantTrends && (
                             <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Tendances Importantes</h4>
                                <pre className="p-3 border rounded-md bg-background whitespace-pre-wrap font-sans">{summary.importantTrends}</pre>
                            </div>
                        )}
                        {summary.upcomingActions && (
                            <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2"><Calendar className="h-4 w-4"/>Actions à Venir</h4>
                                <pre className="p-3 border rounded-md bg-background whitespace-pre-wrap font-sans">{summary.upcomingActions}</pre>
                            </div>
                        )}
                        {summary.potentialRisks && (
                            <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4"/>Risques Potentiels</h4>
                                <pre className="p-3 border rounded-md bg-destructive/10 border-destructive/50 text-destructive whitespace-pre-wrap font-sans">{summary.potentialRisks}</pre>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            )}
            {!summary && !isSummaryLoading && !summaryError && (
                <p className="text-sm text-muted-foreground text-center p-6 border-2 border-dashed rounded-lg">Cliquez sur "Générer" pour créer un résumé.</p>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="text-primary"/> Chronologie du Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
            {timelineEvents.length > 0 ? (
                <div className="relative pl-6">
                    {/* Vertical line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
                    
                    <div className="space-y-8">
                    {timelineEvents.map((event, index) => (
                        <div key={`${event.type}-${event.data.id}-${index}`} className="relative flex items-start">
                            <div className="absolute left-0 top-0 -translate-x-1/2 bg-background p-1 rounded-full border-2 border-border">
                                <EventIcon type={event.type} />
                            </div>
                            <div className="pl-8 w-full">
                                <p className="font-semibold text-muted-foreground mb-1">
                                    {format(event.date, "PPP", { locale: fr })}
                                </p>
                                <Card className="bg-card/70">
                                    <CardContent className="p-4">
                                        {renderEventContent(event)}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun événement dans l'historique de ce patient.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
