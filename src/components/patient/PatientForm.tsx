
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PatientSchema } from '@/lib/schemas';
import type { Patient } from '@/types';
import { GENDERS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { format, parse, parseISO, isValid, set, getDaysInMonth, setMonth } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


type PatientFormData = Omit<Patient, 'id'>;

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  initialData?: Partial<PatientFormData>;
  isSubmitting?: boolean;
}

const getInitialDate = (dateString?: string): string => {
    if (dateString) {
        const parsed = parseISO(dateString);
        if (isValid(parsed)) {
            return format(parsed, 'yyyy-MM-dd');
        }
    }
    // For birthDate, let's default to 30 years ago.
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 30);
    return format(defaultDate, 'yyyy-MM-dd');
};

const defaultFormValues: PatientFormData = {
  firstName: '',
  lastName: '',
  sex: GENDERS[0],
  birthDate: getInitialDate(),
};

const PatientForm: React.FC<PatientFormProps> = ({ onSubmit, initialData }) => {
  const form = useForm<PatientFormData>({
    resolver: zodResolver(PatientSchema),
    defaultValues: initialData ? {
      ...defaultFormValues,
      ...initialData,
      birthDate: getInitialDate(initialData.birthDate),
    } : defaultFormValues,
  });

  const handleSubmit = (data: PatientFormData) => {
    onSubmit({
      ...data,
      birthDate: new Date(data.birthDate).toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4 p-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl><Input placeholder="Ex: Fatoumata" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl><Input placeholder="Ex: Traoré" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => {
              const selectedDate = field.value && isValid(parse(field.value, "yyyy-MM-dd", new Date()))
                  ? parse(field.value, "yyyy-MM-dd", new Date())
                  : parse(defaultFormValues.birthDate, "yyyy-MM-dd", new Date());

              const currentYear = new Date().getFullYear();
              const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
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
                  <FormLabel>Date de naissance</FormLabel>
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
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexe</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 pt-2">
                    {GENDERS.map(gender => (
                      <FormItem key={gender} className="flex items-center space-x-2">
                        <FormControl><RadioGroupItem value={gender} id={`sex-${gender}`} /></FormControl>
                        <Label htmlFor={`sex-${gender}`}>{gender}</Label>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

export default PatientForm;
