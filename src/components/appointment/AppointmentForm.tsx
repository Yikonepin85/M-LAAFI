
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppointmentSchema } from '@/lib/schemas';
import type { Appointment } from '@/types';
import { MEDICAL_SPECIALTIES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as UICalendar } from "@/components/ui/calendar"; // Renamed to avoid conflict
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, User, Clock } from "lucide-react";
import { format, parse, parseISO, setHours, setMinutes, setSeconds, isValid } from "date-fns";
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';

type AppointmentFormData = Omit<Appointment, 'id'>;

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => void;
  initialData?: Partial<AppointmentFormData>;
  isSubmitting?: boolean;
}

// Helper to get a default Date object, ensuring it's valid
const getDefaultDate = () => {
  const now = new Date();
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now;
};

// Helper to safely parse and format the initial date-time string
const getInitialDateTime = (dateTimeStr?: string): string => {
    if (dateTimeStr) {
        const parsedDate = parseISO(dateTimeStr);
        if (isValid(parsedDate)) {
            return format(parsedDate, "yyyy-MM-dd'T'HH:mm");
        }
        // Fallback for potentially non-ISO formats stored previously
        const parsedFromFormat = parse(dateTimeStr, "yyyy-MM-dd'T'HH:mm", new Date());
        if (isValid(parsedFromFormat)) {
          return format(parsedFromFormat, "yyyy-MM-dd'T'HH:mm");
        }
    }
    return format(getDefaultDate(), "yyyy-MM-dd'T'HH:mm");
};


const defaultFormValues: AppointmentFormData = {
  doctorName: '',
  specialty: '_none_',
  contactPhone: '',
  dateTime: format(getDefaultDate(), "yyyy-MM-dd'T'HH:mm"), // Store as combined string
  location: '',
  notes: '',
  consultationId: undefined,
  patientFullName: '',
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: initialData ? {
        ...defaultFormValues,
        ...initialData,
        specialty: initialData.specialty === '' || initialData.specialty === undefined || !initialData.specialty ? '_none_' : initialData.specialty,
        dateTime: getInitialDateTime(initialData.dateTime),
        consultationId: initialData.consultationId || undefined,
        patientFullName: initialData.patientFullName || '',
      } : defaultFormValues
  });

  const handleSubmit = (data: AppointmentFormData) => {
    let finalDateTimeISO = '';
    if (data.dateTime) {
      // data.dateTime is already yyyy-MM-dd'T'HH:mm from the form state
      const combinedDate = parse(data.dateTime, "yyyy-MM-dd'T'HH:mm", new Date());
      if (isValid(combinedDate)) {
        finalDateTimeISO = combinedDate.toISOString();
      } else {
        // Fallback or error handling if parsing fails
        console.error("Invalid date/time string before submission:", data.dateTime);
        finalDateTimeISO = new Date().toISOString(); // Or handle error appropriately
      }
    }

    onSubmit({
      ...data,
      specialty: data.specialty === '_none_' ? '' : data.specialty,
      dateTime: finalDateTimeISO,
      consultationId: data.consultationId || undefined,
      patientFullName: data.patientFullName || undefined,
    });
  };
  
  const patientFullNameFromInitial = form.watch('patientFullName');
  const currentDateTimeStr = form.watch('dateTime');

  // Helper to update parts of the dateTime string
  const updateDateTime = (newDatePart?: Date, newTimePart?: string) => {
    let currentDate = parse(currentDateTimeStr, "yyyy-MM-dd'T'HH:mm", getDefaultDate());
    if (!isValid(currentDate)) currentDate = getDefaultDate();


    if (newDatePart) {
      currentDate.setDate(newDatePart.getDate());
      currentDate.setMonth(newDatePart.getMonth());
      currentDate.setFullYear(newDatePart.getFullYear());
    }

    if (newTimePart) {
      const [hours, minutes] = newTimePart.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        currentDate = setHours(currentDate, hours);
        currentDate = setMinutes(currentDate, minutes);
        currentDate = setSeconds(currentDate, 0); // Ensure seconds are zero
      }
    }
    form.setValue('dateTime', format(currentDate, "yyyy-MM-dd'T'HH:mm"), { shouldValidate: true });
  };


  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <ScrollArea className="max-h-[70vh] p-1">
        <div className="space-y-4 p-2">
          {patientFullNameFromInitial && (
            <div className="p-3 border rounded-md bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <User className="mr-2 h-4 w-4" />
                Patient concerné:
              </p>
              <p className="text-base font-semibold">{patientFullNameFromInitial}</p>
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dateTime" // This field now controls the date part
              render={({ field }) => { // field.value is "yyyy-MM-dd'T'HH:mm"
                const currentDateValue = field.value ? parse(field.value, "yyyy-MM-dd'T'HH:mm", new Date()) : null;
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date du RDV</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !currentDateValue && "text-muted-foreground")}
                          >
                            {currentDateValue && isValid(currentDateValue) ? format(currentDateValue, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <UICalendar
                          mode="single"
                          selected={currentDateValue && isValid(currentDateValue) ? currentDateValue : undefined}
                          onSelect={(date) => {
                            if (date) updateDateTime(date, undefined);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <FormField
              control={form.control}
              name="dateTime" // This field now controls the time part
              render={({ field }) => { // field.value is "yyyy-MM-dd'T'HH:mm"
                const currentTimeValue = field.value ? format(parse(field.value, "yyyy-MM-dd'T'HH:mm", new Date()), 'HH:mm') : '';
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Heure du RDV</FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        value={currentTimeValue}
                        onChange={(e) => {
                          if (e.target.value) updateDateTime(undefined, e.target.value);
                        }}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </div>
           {form.formState.errors.dateTime && (
             <FormMessage>{form.formState.errors.dateTime.message}</FormMessage>
           )}


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
      </ScrollArea>
    </form>
    </Form>
  );
};

export default AppointmentForm;
