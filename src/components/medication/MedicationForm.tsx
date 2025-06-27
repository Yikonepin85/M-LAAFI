
"use client";

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MedicationSchema } from '@/lib/schemas';
import type { Medication, Patient } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2, User } from "lucide-react";
import { format, parse, parseISO, isValid, set, getDaysInMonth, setMonth } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useLocalStorage from '@/hooks/useLocalStorage';
import Link from 'next/link';

type MedicationFormData = Omit<Medication, 'id'>;

interface MedicationFormProps {
  onSubmit: (data: MedicationFormData) => void;
  initialData?: Partial<MedicationFormData>; 
  isSubmitting?: boolean;
}

const getInitialDate = (dateString?: string, defaultValue?: string): string => {
    if (dateString) {
        const parsed = parseISO(dateString);
        if (isValid(parsed) && defaultValue) {
            return format(parsed, 'yyyy-MM-dd');
        }
    }
    return defaultValue || format(new Date(), 'yyyy-MM-dd');
};

const defaultValues: MedicationFormData = {
  patientId: '',
  name: '',
  intakeTimes: ['08:00'],
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), 
  notes: '',
  consultationId: undefined,
  patientFullName: '',
};

const DateDropdowns: React.FC<{field: any}> = ({ field }) => {
    const selectedDate = field.value && isValid(parse(field.value, "yyyy-MM-dd", new Date())) 
        ? parse(field.value, "yyyy-MM-dd", new Date()) 
        : new Date();

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
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
        field.onChange(format(newDate, "yyyy-MM-dd"));
    };

    return (
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
    );
};

const MedicationForm: React.FC<MedicationFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const [patients] = useLocalStorage<Patient[]>('patients', []);
  
  const form = useForm<MedicationFormData>({
    resolver: zodResolver(MedicationSchema),
    defaultValues: initialData ? {
      ...defaultValues, 
      ...initialData,   
      startDate: getInitialDate(initialData.startDate, defaultValues.startDate),
      endDate: getInitialDate(initialData.endDate, defaultValues.endDate),
      consultationId: initialData.consultationId || undefined,
      patientId: initialData.patientId || '',
      patientFullName: initialData.patientFullName || '',
    } : defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "intakeTimes",
  });
  
  const intakeTimesValues = form.watch('intakeTimes');

  const handleSubmit = (data: MedicationFormData) => {
    onSubmit({
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      consultationId: data.consultationId || undefined, 
      patientFullName: data.patientFullName || undefined, 
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du médicament</FormLabel>
                <FormControl><Input placeholder="Paracétamol 500mg" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <Label>Heure(s) de prise</Label>
            {fields.map((item, index) => {
                const [hour = '08', minute = '00'] = intakeTimesValues[index] ? intakeTimesValues[index].split(':') : [];
                return (
                  <div key={item.id} className="flex items-center space-x-2 mt-1">
                    <Select value={hour} onValueChange={(newHour) => {
                        const currentMinute = (form.getValues(`intakeTimes.${index}`) || '00:00').split(':')[1];
                        form.setValue(`intakeTimes.${index}`, `${newHour}:${currentMinute}`, { shouldValidate: true });
                    }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span>:</span>
                    <Select value={minute} onValueChange={(newMinute) => {
                        const currentHour = (form.getValues(`intakeTimes.${index}`) || '00:00').split(':')[0];
                        form.setValue(`intakeTimes.${index}`, `${currentHour}:${newMinute}`, { shouldValidate: true });
                    }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['00', '15', '30', '45'].map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                  </div>
                );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => append('08:00')} className="mt-2 w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une prise
            </Button>
             {form.formState.errors.intakeTimes && (
              <p className="text-sm font-medium text-destructive mt-1">
                {form.formState.errors.intakeTimes.root?.message || "Veuillez vérifier les heures de prise."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de début</FormLabel>
                  <DateDropdowns field={field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de fin</FormLabel>
                  <DateDropdowns field={field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes / Posologie (facultatif)</FormLabel>
                <FormControl><Textarea placeholder="Ex: 1 comprimé matin, midi et soir après le repas. Pendant 7 jours." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

export default MedicationForm;


    