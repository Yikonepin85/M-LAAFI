
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConsultationForm from '@/components/consultation/ConsultationForm';
import BMIDisplay, { calculateBMI, getBMICategory } from '@/components/consultation/BMIDisplay';
import FormModal from '@/components/shared/FormModal';
import type { Consultation, Appointment, MedicalTest, Medication, Patient } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit3, Trash2, Stethoscope, ClipboardPlus, CalendarPlus, MapPin, ExternalLink, Pill, FlaskConical, CalendarCheck2 } from 'lucide-react';
import { format, parseISO, addWeeks, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BMI_CATEGORIES, type BMICategory } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


type ConsultationFormData = Omit<Consultation, 'id' | 'createdAt' | 'imc' | 'imcCategory'>;

const getAppointmentTypeText = (type?: 'results_presentation' | 'control' | '') => {
  if (type === 'results_presentation') return "Présentation de résultats d'examen";
  if (type === 'control') return "Contrôle";
  return "Non spécifié";
};

const getBorderClassFromBmiCategoryLabel = (categoryLabel?: string): string => {
  if (!categoryLabel) return '';
  const category = BMI_CATEGORIES.find(cat => cat.label === categoryLabel);
  if (category && category.colorClass) {
    const backgroundColorClass = category.colorClass.split(' ').find(c => c.startsWith('bg-'));
    if (backgroundColorClass) {
      return `border-2 ${backgroundColorClass.replace('bg-', 'border-')}`;
    }
  }
  return '';
};


export default function ConsultationPage() {
  const [consultations, setConsultations] = useLocalStorage<Consultation[]>('consultations', []);
  const [appointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [medicalTests] = useLocalStorage<MedicalTest[]>('medicalTests', []);
  const [medications] = useLocalStorage<Medication[]>('medications', []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const openAddModal = () => {
    setEditingConsultation(null);
    setIsModalOpen(true);
  };
  
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAddModal();
      // Clean searchParams to avoid re-triggering
      router.replace('/consultation', { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFormSubmit = (data: ConsultationFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const bmi = data.vitals ? calculateBMI(data.vitals.weight, data.vitals.height) : null;
      const bmiCategory = getBMICategory(bmi);
      let savedConsultation: Consultation | undefined;
      let consultationIdForAction: string | undefined;

      if (editingConsultation) {
        const updatedConsultation: Consultation = { 
            ...editingConsultation, 
            ...data, 
            imc: bmi ?? undefined, 
            imcCategory: bmiCategory?.label,
            hasAppointment: data.hasAppointment,
            appointmentType: data.hasAppointment ? data.appointmentType : '',
        };
        setConsultations(prev => prev.map(c => c.id === editingConsultation.id ? updatedConsultation : c));
        savedConsultation = updatedConsultation;
        consultationIdForAction = updatedConsultation.id;
      } else {
        const newConsultation: Consultation = {
          ...data,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          imc: bmi ?? undefined,
          imcCategory: bmiCategory?.label,
          hasAppointment: data.hasAppointment,
          appointmentType: data.hasAppointment ? data.appointmentType : '',
        };
        setConsultations(prev => [newConsultation, ...prev]);
        savedConsultation = newConsultation;
        consultationIdForAction = newConsultation.id;
      }

      setIsModalOpen(false);
      setEditingConsultation(null);
      setIsSubmitting(false);
      
      toast({ title: editingConsultation ? "Consultation Modifiée" : "Consultation Ajoutée", description: editingConsultation ? "La consultation a été mise à jour." : "Nouvelle consultation enregistrée." });

      if (savedConsultation?.hasAppointment && savedConsultation.appointmentType && consultationIdForAction && !editingConsultation) {
        // Only auto-redirect for new consultations with hasAppointment true
        handleScheduleAppointment(savedConsultation, savedConsultation.appointmentType);
      }

    }, 500);
  };

  const openEditModal = (consultation: Consultation) => {
    setEditingConsultation(consultation);
    setIsModalOpen(true);
  };

  const handleDeleteConsultation = (idToDelete: string) => {
    setConsultations(prev => prev.filter(c => c.id !== idToDelete));
    let itemsDeletedMessage = "La consultation a été supprimée.";
    let itemsDeletedCount = 0;

    try {
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        let appointments: Appointment[] = JSON.parse(storedAppointments);
        const initialAppointmentsLength = appointments.length;
        const updatedAppointments = appointments.filter(appt => appt.consultationId !== idToDelete);
        if (initialAppointmentsLength !== updatedAppointments.length) {
          localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
          itemsDeletedCount++;
        }
      }
      const storedMedicalTests = localStorage.getItem('medicalTests');
      if (storedMedicalTests) {
        let medicalTests: MedicalTest[] = JSON.parse(storedMedicalTests);
        const initialMedicalTestsLength = medicalTests.length;
        const updatedMedicalTests = medicalTests.filter(test => test.consultationId !== idToDelete);
         if (initialMedicalTestsLength !== updatedMedicalTests.length) {
          localStorage.setItem('medicalTests', JSON.stringify(updatedMedicalTests));
           itemsDeletedCount++;
        }
      }
      // Potentially delete linked medications too if that feature is added
      // const storedMedications = localStorage.getItem('medications'); etc.

      if (itemsDeletedCount > 0) {
        itemsDeletedMessage = `La consultation et ${itemsDeletedCount === 1 ? "l'élément associé" : "les éléments associés"} (RDV/Examen) ont été supprimés.`;
      }
      toast({ title: "Suppression Effectuée", description: itemsDeletedMessage, variant: "destructive" });

    } catch (error) {
      console.error("Erreur lors de la suppression des éléments associés:", error);
      toast({ title: "Consultation Supprimée", description: "La consultation a été supprimée (erreur lors de la suppression des éléments associés).", variant: "destructive" });
    }
  };
  
  const handlePrescribeExam = (consultation: Consultation) => {
    const queryParams = new URLSearchParams();
    if (!consultation.patient) return;
    const patientFullName = `${consultation.patient.firstName} ${consultation.patient.lastName}`;
    queryParams.append('patientId', consultation.patientId);
    queryParams.append('patientFullName', patientFullName);
    queryParams.append('consultationId', consultation.id);
    const consultationDate = consultation.createdAt ? parseISO(consultation.createdAt) : null;
    const formattedDate = consultationDate && isValid(consultationDate) ? format(consultationDate, "PPP", { locale: fr }) : 'date inconnue';
    queryParams.append('notes', `Examen prescrit pour ${patientFullName} suite à la consultation du ${formattedDate}.`);
    
    router.push(`/examens?${queryParams.toString()}`);
    toast({ title: "Prescription d'Examen", description: "Redirection vers le formulaire d'examen." });
  };

  const handlePrescribeMedication = (consultation: Consultation) => {
    const queryParams = new URLSearchParams();
    if (!consultation.patient) return;
    const patientFullName = `${consultation.patient.firstName} ${consultation.patient.lastName}`;
    queryParams.append('patientId', consultation.patientId);
    queryParams.append('patientFullName', patientFullName);
    queryParams.append('consultationId', consultation.id);
    const consultationDate = consultation.createdAt ? parseISO(consultation.createdAt) : null;
    const formattedDate = consultationDate && isValid(consultationDate) ? format(consultationDate, "PPP", { locale: fr }) : 'date inconnue';
    queryParams.append('notes', `Médicament prescrit pour ${patientFullName} suite à la consultation du ${formattedDate}. Posologie à définir.`);
    
    router.push(`/medicaments?${queryParams.toString()}`);
    toast({ title: "Prescription Médicament", description: "Redirection vers le formulaire de médicament." });
  };

  const handleScheduleAppointment = (consultation: Consultation, appointmentType?: 'results_presentation' | 'control' | '') => {
    const queryParams = new URLSearchParams();
    if (!consultation.caregiver || !consultation.patient) return;
    const fullDoctorName = `${consultation.caregiver.title} ${consultation.caregiver.name}`;
    queryParams.append('doctorName', fullDoctorName);
    
    if (consultation.caregiver.specialty) {
      queryParams.append('specialty', consultation.caregiver.specialty);
    }
    
    const patientFullName = `${consultation.patient.firstName} ${consultation.patient.lastName}`;
    queryParams.append('patientId', consultation.patientId);
    queryParams.append('patientFullName', patientFullName);

    const defaultType = appointmentType || 'control'; // Default to 'control' if not specified by form
    const consultationDate = consultation.createdAt ? parseISO(consultation.createdAt) : null;
    const formattedDate = consultationDate && isValid(consultationDate) ? format(consultationDate, "PPP", { locale: fr }) : 'date inconnue';
    const notesForRdv = `RDV pour ${patientFullName}. Suite à la consultation du ${formattedDate}. Type de RDV: ${getAppointmentTypeText(defaultType)}.`;
    queryParams.append('notes', notesForRdv);
    
    queryParams.append('consultationId', consultation.id);

    router.push(`/rendez-vous?${queryParams.toString()}`);
    toast({ title: "Planification RDV", description: "Redirection vers le formulaire de rendez-vous." });
  };

  const handleOpenMap = (location: { establishment: string; address?: string }) => {
    const query = encodeURIComponent(`${location.establishment}, ${location.address || ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };


  return (
    <div className="container mx-auto p-4 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-headline">Gestion des Consultations</h2>
        <Button onClick={openAddModal}>
          Ajouter
        </Button>
      </div>
      
      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingConsultation(null); }}
        title={editingConsultation ? "Modifier Consultation" : "Ajouter une Consultation"}
        onSubmit={() => document.querySelector<HTMLFormElement>('#consultation-form-in-modal form')?.requestSubmit()}
        isSubmitting={isSubmitting}
      >
        <div id="consultation-form-in-modal">
          <ConsultationForm 
            onSubmit={handleFormSubmit} 
            initialData={editingConsultation ? editingConsultation : undefined}
            isSubmitting={isSubmitting} 
          />
        </div>
      </FormModal>

      {consultations.length === 0 ? (
        <Card className="text-center p-8 bg-card shadow-lg">
          <CardContent>
            <p className="text-lg text-muted-foreground">Aucune consultation enregistrée.</p>
            <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Ajouter" pour commencer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations.map(consultation => {
             const consultationDate = consultation.createdAt ? parseISO(consultation.createdAt) : null;
             const linkedAppointment = appointments.find(a => a.consultationId === consultation.id);
             const linkedTests = medicalTests.filter(t => t.consultationId === consultation.id);
             const linkedMedications = medications.filter(m => m.consultationId === consultation.id);

             return (
            <Card 
              key={consultation.id} 
              className={cn(
                "shadow-lg hover:shadow-xl transition-shadow duration-300",
                getBorderClassFromBmiCategoryLabel(consultation.imcCategory)
              )}
            >
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={consultation.id} className="border-b-0">
                  <div className="flex items-center p-4">
                    <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline [&[data-state=open]>svg]:text-primary">
                        {consultation.caregiver && (
                            <div>
                            <CardTitle className="font-headline">
                                {consultation.caregiver.name}
                            </CardTitle>
                            <CardDescription>
                                {consultation.caregiver.title}
                                {consultation.caregiver.specialty && ` (${consultation.caregiver.specialty})`}
                                {' - '}
                                {consultationDate && isValid(consultationDate) ? format(consultationDate, "PPP", { locale: fr }) : "Date invalide"}
                            </CardDescription>
                            </div>
                        )}
                    </AccordionTrigger>
                    <div className="flex items-center space-x-1 pl-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePrescribeMedication(consultation); }} className="text-xs" aria-label="Prescrire Médicament">
                            <ClipboardPlus className="mr-1 h-4 w-4" /> Médicament
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePrescribeExam(consultation); }} className="text-xs" aria-label="Prescrire Examen">
                            <Stethoscope className="mr-1 h-4 w-4" /> Examen
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleScheduleAppointment(consultation); }} className="text-xs" aria-label="Planifier RDV">
                            <CalendarPlus className="mr-1 h-4 w-4" /> RDV
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditModal(consultation); }} aria-label="Modifier">
                            <Edit3 className="h-5 w-5" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="Supprimer" onClick={(e) => e.stopPropagation()}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible et supprimera définitivement la consultation ainsi que tous les rendez-vous et examens médicaux qui y sont directement liés.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteConsultation(consultation.id)} className="bg-destructive hover:bg-destructive/90">
                                    Supprimer
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                  <AccordionContent>
                    <div className="px-4 pb-4">
                        <div className="border-t pt-4 space-y-3">
                           <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">Heure de consultation : </span>
                            {consultationDate && isValid(consultationDate) ? format(consultationDate, "HH:mm", { locale: fr }) : "N/A"}
                           </p>

                          {consultation.patient && <p><strong>Patient:</strong> {consultation.patient.firstName} {consultation.patient.lastName}, {consultation.patient.age} ans, {consultation.patient.sex}</p>}
                          
                          {consultation.location?.establishment && (
                            <div className="flex items-start pt-2 mt-2 border-t">
                              <MapPin className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                              <div className="flex-grow">
                                <p className="font-semibold">{consultation.location.establishment}</p>
                                {consultation.location.address && <p className="text-sm text-muted-foreground">{consultation.location.address}</p>}
                              </div>
                              <Button variant="ghost" size="icon" className="ml-auto flex-shrink-0" onClick={() => handleOpenMap(consultation.location!)}>
                                <ExternalLink className="h-5 w-5" />
                              </Button>
                            </div>
                          )}
                          
                          {consultation.vitals && (
                            <div>
                              <strong>Vitales:</strong>
                              <ul className="list-disc list-inside ml-4 text-sm">
                                {consultation.vitals.weight && <li>Poids: {consultation.vitals.weight} kg</li>}
                                {consultation.vitals.height && <li>Taille: {consultation.vitals.height} cm</li>}
                                {consultation.vitals.bloodPressure && <li>Tension: {consultation.vitals.bloodPressure}</li>}
                                {consultation.vitals.heartRate && <li>Pouls: {consultation.vitals.heartRate} bpm</li>}
                                {consultation.vitals.temperature && <li>Temp.: {consultation.vitals.temperature} °C</li>}
                              </ul>
                            </div>
                          )}

                          {consultation.hasAppointment !== undefined && (
                            <div className="text-sm pt-2 mt-2 border-t space-y-1">
                              <div className="flex items-start">
                                <p className="w-32 shrink-0 font-semibold">RDV Associé:</p>
                                <p className="flex-1">{consultation.hasAppointment ? 'Oui' : 'Non'}</p>
                              </div>
                              {consultation.hasAppointment && consultation.appointmentType && (
                                <div className="flex items-start">
                                  <p className="w-32 shrink-0 font-semibold">Type de RDV:</p>
                                  <p className="flex-1">{getAppointmentTypeText(consultation.appointmentType)}</p>
                                </div>
                              )}
                            </div>
                          )}

                           {(linkedAppointment || linkedTests.length > 0 || linkedMedications.length > 0) && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <h4 className="text-sm font-semibold text-muted-foreground">Éléments Liés à cette Consultation</h4>
                              {linkedAppointment && isValid(parseISO(linkedAppointment.dateTime)) && (
                                <div className="flex items-center text-sm">
                                  <CalendarCheck2 className="mr-2 h-4 w-4 text-primary" />
                                  <span>RDV: {format(parseISO(linkedAppointment.dateTime), "PPP 'à' HH:mm", { locale: fr })} avec {linkedAppointment.doctorName}</span>
                                </div>
                              )}
                              {linkedTests.map(test => (
                                <div key={test.id} className="flex items-center text-sm">
                                  <FlaskConical className="mr-2 h-4 w-4 text-primary" />
                                  <span>Examen: {test.name} ({test.status})</span>
                                </div>
                              ))}
                              {linkedMedications.map(med => (
                                <div key={med.id} className="flex items-center text-sm">
                                  <Pill className="mr-2 h-4 w-4 text-primary" />
                                  <span>Médicament: {med.name}</span>
                                </div>
                              ))}
                            </div>
                           )}

                          {consultation.imc !== undefined && consultation.imcCategory && (
                            <BMIDisplay weight={consultation.vitals?.weight} height={consultation.vitals?.height} />
                          )}
                          {consultation.medicalHistory && <p className="text-sm border-t pt-2 mt-2"><strong>Antécédents:</strong> {consultation.medicalHistory}</p>}
                          {consultation.notes && <p className="text-sm border-t pt-2 mt-2"><strong>Notes:</strong> {consultation.notes}</p>}
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
