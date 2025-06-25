
"use client";

import React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MedicationSchema } from '@/lib/schemas';
import type { Medication } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2, User } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';

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
  name: '',
  intakeTimes: ['08:00'],
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), 
  notes: '',
  consultationId: undefined,
  patientFullName: '',
};

const MedicationForm: React.FC<MedicationFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const form = useForm<MedicationFormData>({
    resolver: zodResolver(MedicationSchema),
    defaultValues: initialData ? {
      ...defaultValues, 
      ...initialData,   
      startDate: getInitialDate(initialData.startDate, defaultValues.startDate),
      endDate: getInitialDate(initialData.endDate, defaultValues.endDate),
      consultationId: initialData.consultationId || undefined,
      patientFullName: initialData.patientFullName || '',
    } : defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "intakeTimes",
  });

  const handleSubmit = (data: MedicationFormData) => {
    onSubmit({
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      consultationId: data.consultationId || undefined, 
      patientFullName: data.patientFullName || undefined, 
    });
  };

  const patientFullNameFromInitial = form.watch('patientFullName');
  const consultationIdFromInitial = form.watch('consultationId');
  const isPrescriptionContext = !!consultationIdFromInitial && !!patientFullNameFromInitial;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[70vh] p-1">
          <div className="space-y-4 p-2">
             {isPrescriptionContext && (
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Prescription pour:
                </p>
                <p className="text-base font-semibold">{patientFullNameFromInitial}</p>
              </div>
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
             {!isPrescriptionContext && (
               <FormField
                control={form.control}
                name="patientFullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet du patient (si non lié à une consultation)</FormLabel>
                    <FormControl><Input placeholder="Ex: Adama Traoré" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             )}


            <div>
              <Label>Heure(s) de prise</Label>
              {fields.map((item, index) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name={`intakeTimes.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 mt-1">
                      <FormControl><Input type="time" {...field} /></FormControl>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append('')} className="mt-2 w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une prise
              </Button>
               {form.formState.errors.intakeTimes && !form.formState.errors.intakeTimes.message && (
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(new Date(field.value), "PPP", { locale: fr }) : <span>Choisir une date</span>}
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(new Date(field.value), "PPP", { locale: fr }) : <span>Choisir une date</span>}
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
        </ScrollArea>
      </form>
    </Form>
  );
};

export default MedicationForm;
