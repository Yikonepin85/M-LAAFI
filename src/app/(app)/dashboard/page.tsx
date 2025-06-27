"use client";

import React, { useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, parseISO, isFuture, differenceInMinutes, isEqual, isAfter, isBefore, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowRight, CalendarClock, Pill, Stethoscope, HeartPulse, Activity, Hospital } from 'lucide-react';
import type { Appointment, Medication, VitalRecord } from '@/types';


const getTodaysNextIntake = (medications: Medication[]) => {
    const now = new Date();
    let nextIntake: { medicationName: string; time: string; } | null = null;
    let minMinutesUntil = Infinity;

    const activeMedications = medications.filter(med => {
        if (!med.startDate || !med.endDate) return false;
        const today = new Date();
        today.setHours(0,0,0,0); 
        const startDate = parseISO(med.startDate);
        const endDate = parseISO(med.endDate);
        if (!isValid(startDate) || !isValid(endDate)) return false;
        return (isEqual(today, startDate) || isAfter(today, startDate)) && (isEqual(today, endDate) || isBefore(today, endDate));
    });

    activeMedications.forEach(med => {
        if (med.intakeTimes) {
            med.intakeTimes.forEach(timeStr => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                let scheduledDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
                
                if (isFuture(scheduledDateTime)) {
                    const minutesUntil = differenceInMinutes(scheduledDateTime, now);
                    if (minutesUntil >= 0 && minutesUntil < minMinutesUntil) {
                        minMinutesUntil = minutesUntil;
                        nextIntake = { medicationName: med.name, time: timeStr };
                    }
                }
            });
        }
    });

    return nextIntake;
};


export default function DashboardPage() {
    const [appointments] = useLocalStorage<Appointment[]>('appointments', []);
    const [medications] = useLocalStorage<Medication[]>('medications', []);
    const [vitals] = useLocalStorage<VitalRecord[]>('vitalRecords', []);
    

    const nextAppointment = useMemo(() => {
        return appointments
            .filter(a => a.dateTime && isValid(parseISO(a.dateTime)) && isFuture(parseISO(a.dateTime)))
            .sort((a, b) => parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime())[0];
    }, [appointments]);

    const nextMedicationIntake = useMemo(() => getTodaysNextIntake(medications), [medications]);

    const latestVital = useMemo(() => {
        return vitals
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];
    }, [vitals]);
    
    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold font-headline">Tableau de Bord</h1>
                <p className="text-muted-foreground">Bonjour ! Voici un aperçu de votre journée.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prochain RDV */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <CalendarClock className="text-primary"/> Prochain Rendez-vous
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {nextAppointment ? (
                            <div className="space-y-2">
                                <p className="font-semibold text-lg">{nextAppointment.doctorName}</p>
                                {nextAppointment.specialty && <p className="text-muted-foreground">{nextAppointment.specialty}</p>}
                                <p className="font-bold text-accent">{format(parseISO(nextAppointment.dateTime), "EEEE d MMMM 'à' HH:mm", { locale: fr })}</p>
                                <Button asChild variant="outline" size="sm" className="mt-2">
                                    <Link href="/rendez-vous">Voir les détails <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                </Button>
                            </div>
                        ) : (
                             <div className="text-center text-muted-foreground py-4">
                                <p>Aucun rendez-vous à venir.</p>
                                <Button asChild variant="secondary" size="sm" className="mt-4">
                                    <Link href="/rendez-vous?action=add">Planifier un RDV</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Prochaine Prise */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Pill className="text-primary"/> Prochaine Prise
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       {nextMedicationIntake ? (
                            <div className="space-y-2">
                                <p className="font-semibold text-lg">{nextMedicationIntake.medicationName}</p>
                                <p>Aujourd'hui à <span className="font-bold text-accent">{nextMedicationIntake.time}</span></p>
                                <Button asChild variant="outline" size="sm" className="mt-2">
                                    <Link href="/medicaments">Voir les traitements <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                </Button>
                            </div>
                        ) : (
                             <div className="text-center text-muted-foreground py-4">
                                <p>Aucune prise de médicament prévue aujourd'hui.</p>
                                <Button asChild variant="secondary" size="sm" className="mt-4">
                                    <Link href="/medicaments?action=add">Gérer les médicaments</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Latest Vitals */}
            {latestVital && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HeartPulse className="text-primary"/> Dernier Relevé de Constantes
                            </div>
                             <span className="text-sm font-normal text-muted-foreground">{format(parseISO(latestVital.date), "PPP", { locale: fr })}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            {latestVital.weight && (<div><p className="font-bold text-xl">{latestVital.weight}<span className="text-sm text-muted-foreground"> kg</span></p><p className="text-xs text-muted-foreground">Poids</p></div>)}
                            {latestVital.bloodPressure && (<div><p className="font-bold text-xl">{latestVital.bloodPressure}</p><p className="text-xs text-muted-foreground">Tension</p></div>)}
                            {latestVital.heartRate && (<div><p className="font-bold text-xl">{latestVital.heartRate}<span className="text-sm text-muted-foreground"> bpm</span></p><p className="text-xs text-muted-foreground">Pouls</p></div>)}
                            {latestVital.temperature && (<div><p className="font-bold text-xl">{latestVital.temperature}<span className="text-sm text-muted-foreground"> °C</span></p><p className="text-xs text-muted-foreground">Temp.</p></div>)}
                        </div>
                        <div className="text-center mt-4">
                           <Button asChild variant="outline" size="sm">
                                <Link href="/vitals">Voir l'historique <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions Rapides */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="text-primary"/> Actions Rapides
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <Button asChild variant="outline" className="flex flex-col items-center justify-center h-24 gap-1 p-2 text-center whitespace-normal">
                        <Link href="/consultation?action=add">
                            <Stethoscope className="h-6 w-6"/>
                            <span className="leading-tight">Nouvelle Consultation</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="flex flex-col items-center justify-center h-24 gap-1 p-2 text-center whitespace-normal">
                        <Link href="/medicaments?action=add">
                            <Pill className="h-6 w-6"/>
                            <span className="leading-tight">Nouveau Traitement</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="flex flex-col items-center justify-center h-24 gap-1 p-2 text-center whitespace-normal">
                        <Link href="/vitals?action=add">
                            <HeartPulse className="h-6 w-6"/>
                            <span className="leading-tight">Nouveau Relevé</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="flex flex-col items-center justify-center h-24 gap-1 p-2 text-center whitespace-normal">
                        <Link href="/rendez-vous?action=add">
                            <CalendarClock className="h-6 w-6"/>
                            <span className="leading-tight">Nouveau RDV</span>
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex flex-col items-center justify-center h-24 gap-1 p-2 text-center whitespace-normal">
                        <Link href="/pharmacies">
                            <Hospital className="h-6 w-6"/>
                            <span className="leading-tight">Pharmacies de Garde</span>
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
