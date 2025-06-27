
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VitalRecordSchema } from '@/lib/schemas';
import type { VitalRecord } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { format, parse, parseISO, isValid, set, getDaysInMonth, setMonth } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        <div className="space-y-4 p-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => {
              const selectedDate = field.value && isValid(parse(field.value, "yyyy-MM-dd", new Date()))
                  ? parse(field.value, "yyyy-MM-dd", new Date())
                  : new Date();

              const currentYear = new Date().getFullYear();
              const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
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
                <FormItem>
                  <FormLabel>Date de la mesure</FormLabel>
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
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
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
                    onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
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
                    onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
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
                    onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
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
      </form>
    </Form>
  );
};

export default VitalRecordForm;
