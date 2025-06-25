
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { CalendarIcon } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';

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
    return format(new Date(), 'yyyy-MM-dd');
};

const defaultFormValues: PatientFormData = {
  firstName: '',
  lastName: '',
  sex: GENDERS[0],
  birthDate: format(new Date(new Date().setFullYear(new Date().getFullYear() - 30)), 'yyyy-MM-dd'),
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
        <ScrollArea className="max-h-[70vh] p-1">
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
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de naissance</FormLabel>
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
                        captionLayout="dropdown-buttons"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
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
        </ScrollArea>
      </form>
    </Form>
  );
};

export default PatientForm;
