
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MedicationForm from '@/components/medication/MedicationForm';
import FormModal from '@/components/shared/FormModal';
import type { Medication, Consultation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, Pill, AlarmClock, AlertCircle, Clock, CheckCircle2, User, ClipboardList, Beaker, XCircle, TrendingUp } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, isEqual, setHours, setMinutes, setSeconds, differenceInMinutes, isFuture, isValid, subDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { showNotification } from '@/lib/notificationUtils';
import InteractionChecker from '@/components/medication/InteractionChecker';
import { Progress } from '@/components/ui/progress';


type MedicationFormData = Omit<Medication, 'id'>;

interface ProcessedIntake {
  medicationId: string;
  medicationName: string;
  intakeTime: string; // "HH:mm"
  scheduledDateTime: Date;
  minutesUntil: number;
  status: 'due_now' | 'upcoming_soon' | 'upcoming_later' | 'past_today';
}

export default function MedicamentsPage() {
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', []);
  const [consultations] = useLocalStorage<Consultation[]>('consultations', []);
  const [medicationLog, setMedicationLog] = useLocalStorage<Record<string, 'taken' | 'skipped'>>('medicationLog', {});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [prefillDataForNewMedication, setPrefillDataForNewMedication] = useState<Partial<MedicationFormData> | undefined>(undefined);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [notifiedIntakeKeys, setNotifiedIntakeKeys] = useState<Set<string>>(new Set());

  const openAddModal = () => {
    setEditingMedication(null);
    setPrefillDataForNewMedication(undefined);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const consultationIdParam = searchParams.get('consultationId');
    const actionParam = searchParams.get('action');

    if (actionParam === 'add' && !consultationIdParam) {
      openAddModal();
      router.replace('/medicaments', { scroll: false });
      return;
    }

    if (consultationIdParam && !isModalOpen) { 
      const patientFullNameParam = searchParams.get('patientFullName');
      const notesParam = searchParams.get('notes'); 

      const dataToPrefill: Partial<MedicationFormData> = {
        patientFullName: patientFullNameParam || '',
        consultationId: consultationIdParam,
        notes: notesParam || '',
      };
      setPrefillDataForNewMedication(dataToPrefill);
      setEditingMedication(null);
      setIsModalOpen(true);
      
      router.replace('/medicaments', { scroll: false }); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]); 

  useEffect(() => {
    setCurrentTime(new Date()); // Set initial time on mount
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); 
    return () => clearInterval(timer);
  }, []);

  const activeMedications = useMemo(() => medications.filter(med => {
    if (!med.startDate || !med.endDate) return false;
    const today = new Date();
    today.setHours(0,0,0,0); 
    const startDate = parseISO(med.startDate);
    const endDate = parseISO(med.endDate);
    if (!isValid(startDate) || !isValid(endDate)) return false;
    return (isEqual(today, startDate) || isAfter(today, startDate)) && (isEqual(today, endDate) || isBefore(today, endDate));
  }).sort((a,b) => {
      if (!a.startDate || !b.startDate) return 0;
      const dateA = parseISO(a.startDate);
      const dateB = parseISO(b.startDate);
      if(!isValid(dateA) || !isValid(dateB)) return 0;
      return dateA.getTime() - dateB.getTime()
  }), [medications]);

  const todaysIntakes = useMemo(() => {
    if (!currentTime) return []; // Guard against null currentTime on initial render

    const allTodaysScheduledTimes: ProcessedIntake[] = [];
    const now = currentTime;

    activeMedications.forEach(med => {
      if (!med.intakeTimes || !Array.isArray(med.intakeTimes)) return;
      med.intakeTimes.forEach(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        let scheduledDateTime = setSeconds(setMinutes(setHours(now, hours), minutes), 0);
        scheduledDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

        const minutesUntil = differenceInMinutes(scheduledDateTime, now);
        let status: ProcessedIntake['status'];

        if (minutesUntil <= 5 && minutesUntil >= -10) { 
          status = 'due_now';
        } else if (minutesUntil > 5 && minutesUntil <= 30) {
          status = 'upcoming_soon';
        } else if (minutesUntil > 30) {
           if (isFuture(scheduledDateTime)) {
             status = 'upcoming_later';
           } else {
             status = 'past_today';
           }
        } else { 
          status = 'past_today';
        }
        
        allTodaysScheduledTimes.push({
          medicationId: med.id,
          medicationName: med.name,
          intakeTime: timeStr,
          scheduledDateTime,
          minutesUntil,
          status,
        });
      });
    });

    return allTodaysScheduledTimes.sort((a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime());
  }, [activeMedications, currentTime]);

  useEffect(() => {
    if (Notification.permission === 'granted' && currentTime) {
      const newNotifiedKeys = new Set(notifiedIntakeKeys);
      const todayStr = format(currentTime, 'yyyy-MM-dd');
      todaysIntakes.forEach(intake => {
        const intakeKey = `${intake.medicationId}-${intake.intakeTime}`;
        const logKey = `${todayStr}-${intakeKey}`;
        
        // Do not notify if the intake has already been logged for today
        if (medicationLog[logKey]) return;

        if ((intake.status === 'due_now' || intake.status === 'upcoming_soon') && !notifiedIntakeKeys.has(intakeKey)) {
          let body = `Il est temps de prendre votre ${intake.medicationName}.`;
          if (intake.status === 'upcoming_soon') {
            body = `${intake.medicationName} à prendre dans ${intake.minutesUntil} minutes.`;
          }
          showNotification("Rappel Médicament - M'LAAFI", { 
            body: body,
            tag: `medication-${intakeKey}` 
          });
          newNotifiedKeys.add(intakeKey);
        }
      });
      setNotifiedIntakeKeys(newNotifiedKeys);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysIntakes, currentTime, medicationLog]); 
  
  const adherenceStats = useMemo(() => {
    if (!medications.length || !currentTime) return { percentage: null, taken: 0, scheduled: 0 };
  
    const rangeStartDate = subDays(new Date(currentTime), 6);
    rangeStartDate.setHours(0, 0, 0, 0);
  
    let totalScheduled = 0;
    let totalTaken = 0;
  
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(rangeStartDate, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
  
      medications.forEach(med => {
        const medStartDate = parseISO(med.startDate);
        const medEndDate = parseISO(med.endDate);
  
        // Check if the medication is active on the current day in the loop
        if (
          isValid(medStartDate) &&
          isValid(medEndDate) &&
          isAfter(currentDate, subDays(medStartDate, 1)) &&
          isBefore(currentDate, addDays(medEndDate, 1))
        ) {
          if (med.intakeTimes) {
            totalScheduled += med.intakeTimes.length;
  
            med.intakeTimes.forEach(time => {
              const logKey = `${dateStr}-${med.id}-${time}`;
              if (medicationLog[logKey] === 'taken') {
                totalTaken++;
              }
            });
          }
        }
      });
    }
  
    if (totalScheduled === 0) {
      return { percentage: null, taken: 0, scheduled: 0 };
    }
  
    const percentage = Math.round((totalTaken / totalScheduled) * 100);
  
    return {
      percentage: isNaN(percentage) ? null : percentage,
      taken: totalTaken,
      scheduled: totalScheduled,
    };
  }, [medications, medicationLog, currentTime]);


  const handleFormSubmit = (data: MedicationFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (editingMedication && !prefillDataForNewMedication) { 
        setMedications(prev => prev.map(m => m.id === editingMedication.id ? { ...editingMedication, ...data } : m));
        toast({ title: "Médicament Modifié", description: "Les informations du médicament ont été mises à jour." });
      } else { 
        const newMedication: Medication = { 
          ...data, 
          id: Date.now().toString(),
          consultationId: prefillDataForNewMedication?.consultationId || data.consultationId,
          patientFullName: prefillDataForNewMedication?.patientFullName || data.patientFullName,
        };
        setMedications(prev => [newMedication, ...prev]);
        toast({ title: "Médicament Ajouté", description: "Nouveau médicament enregistré." });
      }
      setIsModalOpen(false);
      setEditingMedication(null);
      setPrefillDataForNewMedication(undefined);
      setIsSubmitting(false);
      setNotifiedIntakeKeys(new Set()); 
    }, 500);
  };

  const handleLogIntake = (intake: ProcessedIntake, status: 'taken' | 'skipped') => {
    if (!currentTime) return;
    const logKey = `${format(currentTime, 'yyyy-MM-dd')}-${intake.medicationId}-${intake.intakeTime}`;
    setMedicationLog(prevLog => ({ ...prevLog, [logKey]: status }));
    toast({
        title: `Prise ${status === 'taken' ? 'enregistrée' : 'marquée comme sautée'}`,
        description: `${intake.medicationName} à ${intake.intakeTime}.`
    });
  };

  const openEditModal = (medication: Medication) => {
    setEditingMedication(medication);
    setPrefillDataForNewMedication(undefined);
    setIsModalOpen(true);
  };

  const handleDeleteMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
    toast({ title: "Médicament Supprimé", description: "Le médicament a été supprimé.", variant: "destructive" });
    setNotifiedIntakeKeys(new Set()); 
  };
  
  const getIntakeStatusDisplay = (intake: ProcessedIntake) => {
    switch (intake.status) {
      case 'due_now': return { icon: <AlertCircle className="h-5 w-5 text-red-500" />, text: "À prendre maintenant !", badgeVariant: "destructive" } as const;
      case 'upcoming_soon': return { icon: <AlarmClock className="h-5 w-5 text-orange-500" />, text: `Dans ${intake.minutesUntil} min`, badgeVariant: "default", badgeClassName: "bg-orange-500 text-white hover:bg-orange-500/90" } as const;
      case 'upcoming_later': return { icon: <Clock className="h-5 w-5 text-primary" />, text: `Prévue à ${intake.intakeTime}`, badgeVariant: "outline" } as const;
      case 'past_today': return { icon: <Clock className="h-5 w-5 text-slate-500" />, text: `Heure de prise passée (${intake.intakeTime})`, badgeVariant: "secondary" } as const;
      default: return { icon: <Clock className="h-5 w-5" />, text: "", badgeVariant: "outline"} as const;
    }
  };


  return (
    <div className="container mx-auto p-4 min-h-full space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold font-headline">Gestion des Médicaments</h2>
        <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setIsInteractionModalOpen(true)} size="sm">
                <Beaker className="mr-2 h-4 w-4" />
                Interactions
            </Button>
            <Button onClick={openAddModal} size="sm">
              Ajouter
            </Button>
        </div>
      </div>

      <InteractionChecker 
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        medications={medications}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingMedication(null); setPrefillDataForNewMedication(undefined); }}
        title={editingMedication ? "Modifier Médicament" : "Ajouter un Médicament"}
        onSubmit={() => document.querySelector<HTMLFormElement>('#medication-form-in-modal form')?.requestSubmit()}
        isSubmitting={isSubmitting}
      >
       <div id="medication-form-in-modal">
        <MedicationForm 
            onSubmit={handleFormSubmit} 
            initialData={editingMedication || (prefillDataForNewMedication as MedicationFormData) || undefined}
            isSubmitting={isSubmitting}
          />
        </div>
      </FormModal>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center">
            <AlarmClock className="mr-2 h-6 w-6" /> Prises du Jour ({currentTime ? format(currentTime, 'PPP', { locale: fr }) : '...'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysIntakes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune prise de médicament prévue pour aujourd'hui.</p>
          ) : (
            <ul className="space-y-3">
              {todaysIntakes.map((intake, index) => {
                 const logKey = currentTime ? `${format(currentTime, 'yyyy-MM-dd')}-${intake.medicationId}-${intake.intakeTime}` : '';
                 const logStatus = medicationLog[logKey];
                 const isActionable = (intake.status === 'past_today' || intake.status === 'due_now') && !logStatus;

                 const { icon, text, badgeVariant, badgeClassName } = getIntakeStatusDisplay(intake);
                 return (
                  <li key={`${intake.medicationId}-${intake.intakeTime}-${index}`} className={cn("p-3 bg-card/50 rounded-md border transition-all", logStatus === 'taken' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', logStatus === 'skipped' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 opacity-75')}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {logStatus === 'taken' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : logStatus === 'skipped' ? <XCircle className="h-5 w-5 text-red-600" /> : icon}
                            <div className="ml-3">
                                <p className="font-semibold">{intake.medicationName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {logStatus === 'taken' ? `Pris à ${intake.intakeTime}` : logStatus === 'skipped' ? `Sauté à ${intake.intakeTime}` : text}
                                </p>
                            </div>
                        </div>
                        <Badge variant={badgeVariant} className={badgeClassName}>{intake.intakeTime}</Badge>
                    </div>
                    {isActionable && (
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700" onClick={() => handleLogIntake(intake, 'skipped')}>
                                <XCircle className="mr-2 h-4 w-4" /> Sauté
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleLogIntake(intake, 'taken')}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Pris
                            </Button>
                        </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center">
            <TrendingUp className="mr-2 h-6 w-6" /> Suivi de l'Observance (7 derniers jours)
          </CardTitle>
          <CardDescription>
            Suivez la régularité de votre prise de médicaments pour un traitement efficace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adherenceStats.percentage !== null ? (
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-4xl font-bold text-accent">{adherenceStats.percentage}%</span>
                <span className="text-sm text-muted-foreground">{adherenceStats.taken} / {adherenceStats.scheduled} prises effectuées</span>
              </div>
              <Progress value={adherenceStats.percentage} className="h-3" />
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-4">Aucune prise de médicament programmée sur les 7 derniers jours.</p>
          )}
        </CardContent>
      </Card>


      {medications.length === 0 && activeMedications.length === 0 ? (
         <Card className="text-center p-8 bg-card shadow-lg mt-6">
          <CardContent>
            <Pill className="mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Aucun médicament enregistré.</p>
            <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Ajouter" pour en enregistrer un.</p>
          </CardContent>
        </Card>
      ) : medications.length > 0 ? (
        <div className="space-y-4 mt-6">
          <h3 className="text-xl font-semibold font-headline text-primary">Liste de tous les Traitements</h3>
          {medications.sort((a,b) => {
              if (!a.startDate || !b.startDate) return 0;
              const dateA = parseISO(a.startDate);
              const dateB = parseISO(b.startDate);
              if (isValid(dateB) && !isValid(dateA)) return 1;
              if (!isValid(dateB) && isValid(dateA)) return -1;
              if (!isValid(dateB) && !isValid(dateA)) return 0;
              return dateB.getTime() - dateA.getTime();
          }).map(med => {
            const isActive = activeMedications.some(activeMed => activeMed.id === med.id);
            const startDate = med.startDate ? parseISO(med.startDate) : null;
            const endDate = med.endDate ? parseISO(med.endDate) : null;
            const linkedConsultation = med.consultationId ? consultations.find(c => c.id === med.consultationId) : null;
            const consultationDate = linkedConsultation?.createdAt ? parseISO(linkedConsultation.createdAt) : null;
            return (
            <Card key={med.id} className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300", isActive ? "border-primary border-2" : "opacity-75")}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline">{med.name}</CardTitle>
                    {isActive && <Badge className="mt-1 bg-accent text-accent-foreground">Actif</Badge>}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(med)} aria-label="Modifier">
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
                            Cette action est irréversible et supprimera définitivement ce médicament.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMedication(med.id)} className="bg-destructive hover:bg-destructive/90">
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardDescription>
                  Du {startDate && isValid(startDate) ? format(startDate, "PPP", { locale: fr }) : 'N/A'} au {endDate && isValid(endDate) ? format(endDate, "PPP", { locale: fr }) : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {med.intakeTimes && <p><strong>Heures de prise:</strong> {med.intakeTimes.join(', ')}</p>}
                {med.notes && <p className="text-sm mt-2 border-t pt-2"><strong>Notes/Posologie:</strong> {med.notes}</p>}
                
                {linkedConsultation && consultationDate && isValid(consultationDate) && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t flex items-center">
                        <ClipboardList className="mr-2 h-3 w-3 flex-shrink-0" />
                        <span>Prescrit pour <strong>{med.patientFullName}</strong> lors de la consultation du {format(consultationDate, 'PPP', { locale: fr })}</span>
                    </div>
                )}
                {!linkedConsultation && med.patientFullName && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t flex items-center">
                        <User className="mr-2 h-3 w-3 flex-shrink-0" />
                        <span>Traitement pour <strong>{med.patientFullName}</strong></span>
                    </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      ) : null}
    </div>
  );
}
