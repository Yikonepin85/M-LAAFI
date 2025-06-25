
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller }
from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MedicalTestSchema } from '@/lib/schemas';
import type { MedicalTest } from '@/types';
import { MEDICAL_TEST_STATUSES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, User, FileText } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from '@/components/ui/scroll-area';

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
  name: '',
  patientFullName: '',
  prescribedDate: format(new Date(), 'yyyy-MM-dd'),
  status: MEDICAL_TEST_STATUSES[0],
  notes: '',
  consultationId: undefined,
  results: '',
  resultsDate: '',
};

const MedicalTestForm: React.FC<MedicalTestFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const form = useForm<MedicalTestFormData>({
    resolver: zodResolver(MedicalTestSchema),
    defaultValues: initialData ? {
      ...defaultValues,
      ...initialData,
      prescribedDate: getInitialDate(initialData.prescribedDate, defaultValues.prescribedDate),
      resultsDate: getInitialDate(initialData.resultsDate, ''),
      consultationId: initialData.consultationId || undefined,
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
  
  const patientFullNameFromInitial = form.watch('patientFullName');
  const consultationIdFromInitial = form.watch('consultationId');
  const isPrescriptionContext = !!consultationIdFromInitial && !!patientFullNameFromInitial;

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
        <ScrollArea className="max-h-[70vh] p-1">
          <div className="space-y-4 p-2">
            {isPrescriptionContext && (
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Examen pour (lié à une consultation):
                </p>
                <p className="text-base font-semibold">{patientFullNameFromInitial}</p>
              </div>
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
              name="patientFullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet du patient</FormLabel>
                  <FormControl><Input placeholder="Ex: Adama Traoré" {...field} 
                    readOnly={isPrescriptionContext} 
                    className={isPrescriptionContext ? "bg-muted/50 cursor-not-allowed" : ""}
                  /></FormControl>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value && isValid(new Date(field.value)) ? format(new Date(field.value), "PPP", { locale: fr }) : <span>Choisir une date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value && isValid(new Date(field.value)) ? format(new Date(field.value), "PPP", { locale: fr }) : <span>Choisir une date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
        </ScrollArea>
      </form>
    </Form>
  );
};

export default MedicalTestForm;
