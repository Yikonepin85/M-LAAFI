
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppointmentSchema } from '@/lib/schemas';
import type { Appointment, Patient } from '@/types';
import { MEDICAL_SPECIALTIES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, parse, parseISO, set, isValid, getDaysInMonth, setMonth } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User } from 'lucide-react';
import useLocalStorage from '@/hooks/useLocalStorage';
import Link from 'next/link';

type AppointmentFormData = Omit<Appointment, 'id'>;

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => void;
  initialData?: Partial<AppointmentFormData>;
  isSubmitting?: boolean;
}

const getDefaultDate = () => {
  const now = new Date();
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now;
};

const getInitialDateTime = (dateTimeStr?: string): string => {
    if (dateTimeStr) {
        const parsedDate = parseISO(dateTimeStr);
        if (isValid(parsedDate)) {
            return format(parsedDate, "yyyy-MM-dd'T'HH:mm");
        }
        const parsedFromFormat = parse(dateTimeStr, "yyyy-MM-dd'T'HH:mm", new Date());
        if (isValid(parsedFromFormat)) {
          return format(parsedFromFormat, "yyyy-MM-dd'T'HH:mm");
        }
    }
    return format(getDefaultDate(), "yyyy-MM-dd'T'HH:mm");
};


const defaultFormValues: AppointmentFormData = {
  patientId: '',
  doctorName: '',
  specialty: '_none_',
  contactPhone: '',
  dateTime: format(getDefaultDate(), "yyyy-MM-dd'T'HH:mm"),
  location: '',
  notes: '',
  consultationId: undefined,
  patientFullName: '',
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const [patients] = useLocalStorage<Patient[]>('patients', []);
  
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: initialData ? {
        ...defaultFormValues,
        ...initialData,
        specialty: initialData.specialty === '' || initialData.specialty === undefined || !initialData.specialty ? '_none_' : initialData.specialty,
        dateTime: getInitialDateTime(initialData.dateTime),
        consultationId: initialData.consultationId || undefined,
        patientId: initialData.patientId || '',
        patientFullName: initialData.patientFullName || '',
      } : defaultFormValues
  });

  const handleSubmit = (data: AppointmentFormData) => {
    let finalDateTimeISO = '';
    if (data.dateTime) {
      const combinedDate = parse(data.dateTime, "yyyy-MM-dd'T'HH:mm", new Date());
      if (isValid(combinedDate)) {
        finalDateTimeISO = combinedDate.toISOString();
      } else {
        console.error("Invalid date/time string before submission:", data.dateTime);
        finalDateTimeISO = new Date().toISOString();
      }
    }

    onSubmit({
      ...data,
      specialty: data.specialty === '_none_' ? '' : data.specialty,
      dateTime: finalDateTimeISO,
    });
  };
  
  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      form.setValue('patientId', patient.id);
      form.setValue('patientFullName', `${patient.firstName} ${patient.lastName}`);
    }
  };
  
  const isContextual = !!initialData?.consultationId || !!initialData?.patientId;

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4 p-2">
          {isContextual && initialData?.patientFullName && (
              <div className="p-3 border rounded-md bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Patient concerné:
              </p>
              <p className="text-base font-semibold">{initialData.patientFullName}</p>
              </div>
          )}

          {!isContextual && (
              <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        handlePatientSelect(value);
                    }} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Choisir un patient..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    {patients.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                          Aucun patient enregistré. <Link href="/patients" className="text-primary underline">Ajouter un patient</Link>
                      </p>
                    )}
                    <FormMessage />
                </FormItem>
              )}
            />
          )}

        <FormField
          control={form.control}
          name="doctorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du médecin/praticien</FormLabel>
              <FormControl><Input placeholder="Dr. Salifou Kaboré" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specialty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spécialité (facultatif)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? '_none_'}>
                <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une spécialité" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="_none_">Aucune</SelectItem>
                  {MEDICAL_SPECIALTIES.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact téléphonique (facultatif)</FormLabel>
              <FormControl><Input type="tel" placeholder="Ex: 70123456" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateTime"
          render={({ field }) => {
            const selectedDate = field.value && isValid(parse(field.value, "yyyy-MM-dd'T'HH:mm", new Date())) 
                ? parse(field.value, "yyyy-MM-dd'T'HH:mm", new Date()) 
                : getDefaultDate();

            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
            const months = Array.from({ length: 12 }, (_, i) => ({
              value: i,
              label: format(setMonth(new Date(), i), 'MMMM', { locale: fr }),
            }));
            const daysInMonth = getDaysInMonth(selectedDate);
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

            const handleDatePartChange = (part: 'year' | 'month' | 'date', value: number) => {
                let newDate = set(selectedDate, { [part]: value });
                const maxDays = getDaysInMonth(newDate);
                if (newDate.getDate() > maxDays) {
                    newDate = set(newDate, { date: maxDays });
                }
                field.onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
            };

            const handleHourChange = (hour: string) => {
              const newDateTime = set(selectedDate, { hours: parseInt(hour, 10) });
              field.onChange(format(newDateTime, "yyyy-MM-dd'T'HH:mm"));
            };
            
            const handleMinuteChange = (minute: string) => {
              const newDateTime = set(selectedDate, { minutes: parseInt(minute, 10) });
              field.onChange(format(newDateTime, "yyyy-MM-dd'T'HH:mm"));
            };

            return (
              <div className="space-y-4 rounded-md border p-4">
                <FormLabel>Date et heure du RDV</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  <FormItem>
                    <FormLabel className="text-xs">Jour</FormLabel>
                     <Select onValueChange={(v) => handleDatePartChange('date', Number(v))} value={String(selectedDate.getDate())}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            {days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </FormItem>
                   <FormItem>
                    <FormLabel className="text-xs">Mois</FormLabel>
                     <Select onValueChange={(v) => handleDatePartChange('month', Number(v))} value={String(selectedDate.getMonth())}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </FormItem>
                  <FormItem>
                    <FormLabel className="text-xs">Année</FormLabel>
                    <Select onValueChange={(v) => handleDatePartChange('year', Number(v))} value={String(selectedDate.getFullYear())}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </FormItem>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Heure</FormLabel>
                    <Select value={format(selectedDate, 'HH')} onValueChange={handleHourChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((hour) => (
                          <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Minute</FormLabel>
                    <Select value={format(selectedDate, 'mm')} onValueChange={handleMinuteChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['00', '15', '30', '45'].map((minute) => (
                          <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                </div>
                <FormMessage />
              </div>
            );
          }}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lieu/Adresse (facultatif)</FormLabel>
              <FormControl><Input placeholder="Avenue Charles de Gaulle, Ouagadougou" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes personnelles (facultatif)</FormLabel>
              <FormControl><Textarea placeholder="Ex: Apporter carnet de vaccination." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </form>
    </Form>
  );
};

export default AppointmentForm;
