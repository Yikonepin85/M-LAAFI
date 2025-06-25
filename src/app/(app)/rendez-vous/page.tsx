
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppointmentForm from '@/components/appointment/AppointmentForm';
import FormModal from '@/components/shared/FormModal';
import type { Appointment, Consultation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Trash2, CalendarCheck2, MapPin, Phone, CalendarDays, User, ClipboardList } from 'lucide-react';
import { format, parseISO, isFuture, differenceInMinutes, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { showNotification } from '@/lib/notificationUtils';

type AppointmentFormData = Omit<Appointment, 'id'>;

const APPOINTMENT_REMINDER_MINUTES_BEFORE = 60; // Send reminder 60 minutes before

export default function RendezVousPage() {
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [consultations] = useLocalStorage<Consultation[]>('consultations', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [prefillDataForNewAppointment, setPrefillDataForNewAppointment] = useState<Partial<AppointmentFormData> | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [notifiedAppointmentIds, setNotifiedAppointmentIds] = useState<Set<string>>(new Set());

  const openAddModal = () => {
    setEditingAppointment(null);
    setPrefillDataForNewAppointment(undefined); 
    setIsModalOpen(true);
  };

  useEffect(() => {
    setCurrentTime(new Date()); // Set initial time on mount
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000 * 5); // Update current time every 5 minutes for appointment checks
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    const doctorNameParam = searchParams.get('doctorName');
    const actionParam = searchParams.get('action');

    if (actionParam === 'add' && !doctorNameParam) {
      openAddModal();
      router.replace('/rendez-vous', { scroll: false });
      return;
    }
    
    if (doctorNameParam) { 
      const specialtyParam = searchParams.get('specialty');
      const notesParam = searchParams.get('notes');
      const dateTimeParam = searchParams.get('dateTime');
      const consultationIdParam = searchParams.get('consultationId');
      const patientFullNameParam = searchParams.get('patientFullName');

      const dataToPrefill: Partial<AppointmentFormData> = {
        doctorName: doctorNameParam,
        specialty: specialtyParam || '',
        contactPhone: '', 
        dateTime: dateTimeParam || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        location: '', 
        notes: notesParam || '',
        consultationId: consultationIdParam || undefined,
        patientFullName: patientFullNameParam || '',
      };
      setPrefillDataForNewAppointment(dataToPrefill);
      setEditingAppointment(null); 
      setIsModalOpen(true);
      router.replace('/rendez-vous', { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); 

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    appointments.forEach(appt => {
      if (!appt.dateTime) return; // Skip if no dateTime
      const parsedDate = parseISO(appt.dateTime);
      if (isValid(parsedDate)) {
        if (isFuture(parsedDate)) {
          upcoming.push(appt);
        } else {
          past.push(appt);
        }
      } 
      // Appointments with invalid dates are simply ignored.
    });

    // Sort the valid appointments
    upcoming.sort((a, b) => parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime());
    past.sort((a, b) => parseISO(b.dateTime).getTime() - parseISO(a.dateTime).getTime());
    
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  useEffect(() => {
    if (Notification.permission === 'granted' && currentTime) {
      const newNotifiedIds = new Set(notifiedAppointmentIds);
      upcomingAppointments.forEach(appt => {
        const apptDateTime = parseISO(appt.dateTime);
        if (!isValid(apptDateTime)) return;
        
        const minutesUntil = differenceInMinutes(apptDateTime, currentTime);

        if (minutesUntil > 0 && minutesUntil <= APPOINTMENT_REMINDER_MINUTES_BEFORE && !notifiedAppointmentIds.has(appt.id)) {
          showNotification("Rappel Rendez-vous - M'LAAFI", {
            body: `Votre rendez-vous avec ${appt.doctorName} est prévu à ${format(apptDateTime, "HH:mm", { locale: fr })}.`,
            tag: `appointment-${appt.id}`
          });
          newNotifiedIds.add(appt.id);
        }
      });
      setNotifiedAppointmentIds(newNotifiedIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingAppointments, currentTime]);


  const handleFormSubmit = (data: AppointmentFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (editingAppointment && !prefillDataForNewAppointment) { 
        setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? { ...editingAppointment, ...data } : a));
        toast({ title: "Rendez-vous Modifié", description: "Les informations du rendez-vous ont été mises à jour." });
      } else {
        const newAppointment: Appointment = { 
          ...data, 
          id: Date.now().toString(),
          consultationId: prefillDataForNewAppointment?.consultationId || data.consultationId,
          patientFullName: prefillDataForNewAppointment?.patientFullName || data.patientFullName,
        };
        setAppointments(prev => [newAppointment, ...prev]);
        toast({ title: "Rendez-vous Ajouté", description: "Nouveau rendez-vous enregistré." });
      }
      setIsModalOpen(false);
      setEditingAppointment(null);
      setPrefillDataForNewAppointment(undefined); 
      setIsSubmitting(false);
      setNotifiedAppointmentIds(new Set()); // Reset notified appointments on data change
    }, 500);
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setPrefillDataForNewAppointment(undefined); 
    setIsModalOpen(true);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    toast({ title: "Rendez-vous Supprimé", description: "Le rendez-vous a été supprimé.", variant: "destructive" });
    setNotifiedAppointmentIds(new Set()); // Reset notified appointments on data change
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const parsedDateTime = parseISO(appointment.dateTime);
    const isDateTimeValid = isValid(parsedDateTime);
    const linkedConsultation = appointment.consultationId ? consultations.find(c => c.id === appointment.consultationId) : null;
    const consultationDate = linkedConsultation?.createdAt ? parseISO(linkedConsultation.createdAt) : null;

    return (
      <Card key={appointment.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline">{appointment.doctorName}</CardTitle>
              {appointment.specialty && <CardDescription>{appointment.specialty}</CardDescription>}
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => openEditModal(appointment)} aria-label="Modifier">
                <Edit3 className="h-5 w-5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="Supprimer">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible et supprimera définitivement ce rendez-vous.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteAppointment(appointment.id)} className="bg-destructive hover:bg-destructive/90">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {appointment.patientFullName && <p className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" /> <strong>Patient:</strong> {appointment.patientFullName}</p>}
          <p className="flex items-center"><CalendarCheck2 className="mr-2 h-4 w-4 text-primary" /> {isDateTimeValid ? format(parsedDateTime, "PPPPp", { locale: fr }) : "Date invalide"}</p>
          {appointment.location && <p className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" /> {appointment.location}</p>}
          {appointment.contactPhone && <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-primary" /> {appointment.contactPhone}</p>}
          {appointment.notes && <p className="text-sm mt-2 border-t pt-2"><strong>Notes:</strong> {appointment.notes}</p>}
          {linkedConsultation && consultationDate && isValid(consultationDate) && (
              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t flex items-center">
                <ClipboardList className="mr-2 h-3 w-3" />
                <span>
                  Suite à la consultation du {format(consultationDate, 'PPP', { locale: fr })}
                </span>
              </div>
           )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-headline">Gestion des Rendez-vous</h2>
        <Button onClick={openAddModal}>
          Ajouter
        </Button>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { 
            setIsModalOpen(false); 
            setEditingAppointment(null); 
            setPrefillDataForNewAppointment(undefined); 
        }}
        title={editingAppointment ? "Modifier Rendez-vous" : "Ajouter un Rendez-vous"}
        onSubmit={() => document.querySelector<HTMLFormElement>('#appointment-form-in-modal form')?.requestSubmit()}
        isSubmitting={isSubmitting}
      >
        <div id="appointment-form-in-modal">
          <AppointmentForm 
            onSubmit={handleFormSubmit} 
            initialData={editingAppointment || (prefillDataForNewAppointment as AppointmentFormData) || undefined} 
            isSubmitting={isSubmitting}
          />
        </div>
      </FormModal>

      {appointments.length === 0 ? (
        <Card className="text-center p-8 bg-card shadow-lg">
          <CardContent>
            <CalendarDays className="mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Aucun rendez-vous programmé.</p>
            <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Ajouter" pour commencer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcomingAppointments.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold font-headline text-primary mb-3">Rendez-vous à Venir</h3>
              <div className="space-y-4">
                {upcomingAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} />)}
              </div>
            </section>
          )}
          {pastAppointments.length > 0 && (
             <section>
              <h3 className="text-xl font-semibold font-headline text-primary mb-3">Rendez-vous Passés</h3>
              <div className="space-y-4">
                {pastAppointments.map(appt => <AppointmentCard key={appt.id} appointment={appt} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
