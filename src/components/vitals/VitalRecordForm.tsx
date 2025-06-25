
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VitalRecordSchema } from '@/lib/schemas';
import type { VitalRecord } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { CalendarIcon } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';

type VitalRecordFormData = Omit<VitalRecord, 'id'>;

interface VitalRecordFormProps {
  onSubmit: (data: VitalRecordFormData) => void;
  initialData?: Partial<VitalRecordFormData>;
  isSubmitting?: boolean;
}

const getInitialDate = (dateString?: string): string => {
    if (dateString) {
        const parsed = parseISO(dateString);
        if (isValid(parsed)) {
            return format(parsed, 'yyyy-MM-dd');
        }
    }
    return format(new Date(), 'yyyy-MM-dd');
};

const defaultFormValues: VitalRecordFormData = {
  date: format(new Date(), 'yyyy-MM-dd'),
  weight: undefined,
  bloodPressure: '',
  heartRate: undefined,
  temperature: undefined,
  notes: '',
};

const VitalRecordForm: React.FC<VitalRecordFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const form = useForm<VitalRecordFormData>({
    resolver: zodResolver(VitalRecordSchema),
    defaultValues: initialData ? {
      ...defaultFormValues,
      ...initialData,
      date: getInitialDate(initialData.date),
      weight: initialData.weight ?? undefined,
      bloodPressure: initialData.bloodPressure ?? '',
      heartRate: initialData.heartRate ?? undefined,
      temperature: initialData.temperature ?? undefined,
      notes: initialData.notes ?? '',
    } : defaultFormValues,
  });

  const handleSubmit = (data: VitalRecordFormData) => {
    onSubmit({
      ...data,
      date: new Date(data.date).toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[70vh] p-1">
          <div className="space-y-4 p-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de la mesure</FormLabel>
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
                      <UICalendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        initialFocus
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poids (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 65.5"
                      {...field}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloodPressure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tension artérielle (mmHg)</FormLabel>
                  <FormControl><Input placeholder="Ex: 120/80" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heartRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fréquence cardiaque (bpm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 72"
                      {...field}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Température corporelle (°C)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 37.2"
                      {...field}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (facultatif)</FormLabel>
                  <FormControl><Textarea placeholder="Ex: Prise après le repas, sensation de fatigue..." {...field} /></FormControl>
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

export default VitalRecordForm;
