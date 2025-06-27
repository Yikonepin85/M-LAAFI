
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MedicalTestSchema } from '@/lib/schemas';
import type { MedicalTest, Patient } from '@/types';
import { MEDICAL_TEST_STATUSES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, FileText } from "lucide-react";
import { format, parse, parseISO, isValid, set, getDaysInMonth, setMonth } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import useLocalStorage from '@/hooks/useLocalStorage';
import Link from 'next/link';

type MedicalTestFormData = Omit<MedicalTest, 'id'>;

interface MedicalTestFormProps {
  onSubmit: (data: MedicalTestFormData) => void;
  initialData?: Partial<MedicalTestFormData>;
  isSubmitting?: boolean;
}

const getInitialDate = (dateString?: string, defaultValue: string = ''): string => {
    if (dateString) {
        const parsed = parseISO(dateString);
        if (isValid(parsed)) {
            return format(parsed, 'yyyy-MM-dd');
        }
    }
    return defaultValue;
};

const defaultValues: MedicalTestFormData = {
  patientId: '',
  name: '',
  patientFullName: '',
  prescribedDate: format(new Date(), 'yyyy-MM-dd'),
  status: MEDICAL_TEST_STATUSES[0],
  notes: '',
  consultationId: undefined,
  results: '',
  resultsDate: '',
};

const DateDropdowns: React.FC<{field: any, optional?: boolean}> = ({ field, optional = false }) => {
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

    if (optional && !field.value) {
        return <Button variant="outline" onClick={() => field.onChange(format(new Date(), 'yyyy-MM-dd'))}>Définir une date</Button>
    }

    return (
        <div className="grid grid-cols-3 gap-2">
            <Select onValueChange={(v) => handleDatePartChange('date', Number(v))} value={String(selectedDate.getDate())}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                    {days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select onValueChange={(v) => handleDatePartChange('month', Number(v))} value={String(selectedDate.getMonth())}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select onValueChange={(v) => handleDatePartChange('year', Number(v))} value={String(selectedDate.getFullYear())}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
            {optional && field.value && <Button variant="ghost" size="sm" onClick={() => field.onChange('')} className="col-span-3">Effacer</Button>}
        </div>
    );
};


const MedicalTestForm: React.FC<MedicalTestFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const [patients] = useLocalStorage<Patient[]>('patients', []);
  
  const form = useForm<MedicalTestFormData>({
    resolver: zodResolver(MedicalTestSchema),
    defaultValues: initialData ? {
      ...defaultValues,
      ...initialData,
      prescribedDate: getInitialDate(initialData.prescribedDate, defaultValues.prescribedDate),
      resultsDate: getInitialDate(initialData.resultsDate, ''),
      consultationId: initialData.consultationId || undefined,
      patientId: initialData.patientId || '',
      patientFullName: initialData.patientFullName || '',
      results: initialData.results || '',
    } : defaultValues,
  });

  const handleSubmit = (data: MedicalTestFormData) => {
    onSubmit({
      ...data,
      prescribedDate: data.prescribedDate ? new Date(data.prescribedDate).toISOString() : '',
      resultsDate: data.resultsDate ? new Date(data.resultsDate).toISOString() : undefined, 
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

  const currentResults = form.watch('results');
  const currentStatus = form.watch('status');

  useEffect(() => {
    if (currentResults && currentResults.trim() !== '') {
      if (form.getValues('status') !== "Résultats disponibles") {
        form.setValue('status', "Résultats disponibles", { shouldValidate: true });
      }
      if (!form.getValues('resultsDate')) {
        form.setValue('resultsDate', format(new Date(), 'yyyy-MM-dd'), { shouldValidate: true });
      }
    }
  }, [currentResults, form]);

  useEffect(() => {
    if (currentStatus === "Résultats disponibles" && !form.getValues('resultsDate')) {
       form.setValue('resultsDate', format(new Date(), 'yyyy-MM-dd'), { shouldValidate: true });
    }
  }, [currentStatus, form]);


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
                <FormLabel>Nom de l'examen</FormLabel>
                <FormControl><Input placeholder="Ex: Numération Formule Sanguine (NFS)" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="prescribedDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de prescription</FormLabel>
                 <DateDropdowns field={field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut de l'examen</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un statut" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {MEDICAL_TEST_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2 p-3 border rounded-md mt-4 bg-accent/5">
            <h4 className="text-md font-semibold flex items-center"><FileText className="mr-2 h-5 w-5 text-accent"/> Résultats de l'examen</h4>
            <FormField
              control={form.control}
              name="resultsDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date des résultats</FormLabel>
                  <DateDropdowns field={field} optional={true} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="results"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description des résultats</FormLabel>
                  <FormControl><Textarea placeholder="Ex: Globules blancs: 12000/mm3. CRP élevée." {...field} rows={4} /></FormControl>
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
                <FormLabel>Notes générales (facultatif)</FormLabel>
                <FormControl><Textarea placeholder="Ex: À jeun depuis 8h pour la prescription. Suivi nécessaire." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

export default MedicalTestForm;
