
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConsultationSchema } from '@/lib/schemas';
import type { Consultation, Patient } from '@/types';
import { PROFESSIONAL_TITLES, MEDICAL_SPECIALTIES, GENDERS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import useLocalStorage from '@/hooks/useLocalStorage';
import { differenceInYears, parseISO, isValid } from 'date-fns';
import Link from 'next/link';


type ConsultationFormData = Omit<Consultation, 'id' | 'createdAt' | 'imc' | 'imcCategory'>;

interface ConsultationFormProps {
  onSubmit: (data: ConsultationFormData) => void;
  initialData?: ConsultationFormData;
  isSubmitting?: boolean;
}

const defaultValues: ConsultationFormData = {
  patientId: '',
  caregiver: { name: '', title: PROFESSIONAL_TITLES[0], specialty: '' },
  patient: { firstName: '', lastName: '', sex: GENDERS[0], age: 0 },
  vitals: { weight: undefined, height: undefined, bloodPressure: '', heartRate: undefined, temperature: undefined },
  medicalHistory: '',
  notes: '',
  hasAppointment: false,
  appointmentType: '',
  location: { establishment: '', address: '' },
};

const getAgeFromBirthDate = (birthDateString: string): number | null => {
    if (!birthDateString) return null;
    const birthDate = parseISO(birthDateString);
    if (!isValid(birthDate)) return null;
    return differenceInYears(new Date(), birthDate);
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(ConsultationSchema),
    defaultValues: initialData ? {
        ...defaultValues,
        ...initialData,
        vitals: {
          weight: initialData.vitals?.weight ?? undefined,
          height: initialData.vitals?.height ?? undefined,
          bloodPressure: initialData.vitals?.bloodPressure || '',
          heartRate: initialData.vitals?.heartRate ?? undefined,
          temperature: initialData.vitals?.temperature ?? undefined,
        },
        hasAppointment: initialData.hasAppointment === undefined ? false : initialData.hasAppointment,
        appointmentType: initialData.appointmentType || '',
        location: initialData.location || { establishment: '', address: '' },
        medicalHistory: initialData.medicalHistory || '',
    } : defaultValues,
  });

  const [patients] = useLocalStorage<Patient[]>('patients', []);
  const selectedPatientId = form.watch('patientId');

  const selectedPatient = React.useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find(p => p.id === selectedPatientId);
  }, [selectedPatientId, patients]);

  const selectedTitle = form.watch('caregiver.title');
  const hasAppointmentValue = form.watch('hasAppointment');

  React.useEffect(() => {
    if (hasAppointmentValue === false) {
      form.setValue('appointmentType', '');
    }
  }, [hasAppointmentValue, form]);

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      const age = getAgeFromBirthDate(patient.birthDate);
      form.setValue('patientId', patient.id, { shouldValidate: true });
      form.setValue('patient.firstName', patient.firstName);
      form.setValue('patient.lastName', patient.lastName);
      form.setValue('patient.sex', patient.sex);
      form.setValue('patient.age', age ?? 0);
    }
  };

  const handleSubmit = (data: ConsultationFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6 p-2">
          <section className="space-y-3 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold font-headline">Informations du Patient</h3>
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Sélectionner un patient</FormLabel>
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

            {selectedPatient && (
              <div className="mt-4 space-y-2 rounded-md border bg-muted/50 p-4">
                <h4 className="font-semibold text-muted-foreground">Détails du Patient sélectionné</h4>
                <p><strong>Nom:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p><strong>Sexe:</strong> {selectedPatient.sex}</p>
                <p><strong>Âge:</strong> {getAgeFromBirthDate(selectedPatient.birthDate) ?? 'N/A'} ans</p>
              </div>
            )}
          </section>

          <section className="space-y-3 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold font-headline">Antécédents Médicaux</h3>
            <FormField
              control={form.control}
              name="medicalHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antécédents connus du patient</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Diabète de type 2, hypertension, allergie à la pénicilline..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ce champ est facultatif. Renseignez ici les maladies chroniques, allergies ou opérations passées.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-3 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold font-headline">Informations du Soignant</h3>
            <FormField
              control={form.control}
              name="caregiver.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du soignant</FormLabel>
                  <FormControl><Input placeholder="Dr. Aïssata Ouédraogo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="caregiver.title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre professionnel</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un titre" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PROFESSIONAL_TITLES.map(title => <SelectItem key={title} value={title}>{title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedTitle === 'Docteur' && (
              <FormField
                control={form.control}
                name="caregiver.specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spécialité médicale</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une spécialité" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {MEDICAL_SPECIALTIES.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </section>

          <section className="space-y-3 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold font-headline">Lieu de la Consultation</h3>
             <FormField
                control={form.control}
                name="location.establishment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'établissement</FormLabel>
                    <FormControl><Input placeholder="Ex: Hôpital Yalgado Ouédraogo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse (facultatif)</FormLabel>
                    <FormControl><Input placeholder="Ex: Avenue de l'Indépendance, Ouagadougou" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </section>

          <section className="space-y-3 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold font-headline">Constantes Vitales</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="vitals.weight" 
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
                <FormField control={form.control} name="vitals.height" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 170" 
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="vitals.bloodPressure" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tension artérielle</FormLabel>
                      <FormControl><Input placeholder="Ex: 120/80" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="vitals.heartRate" 
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
                <FormField control={form.control} name="vitals.temperature" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Température (°C)</FormLabel>
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
            </div>
          </section>

          <section className="space-y-3 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold font-headline">Suites de la consultation</h3>
            <FormField
              control={form.control}
              name="hasAppointment"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Un rendez-vous de suivi est-il nécessaire ?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === 'true')}
                      value={String(field.value ?? 'false')}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" id="hasAppointment-true" />
                        </FormControl>
                        <Label htmlFor="hasAppointment-true" className="font-normal">
                          Oui, planifier un RDV de suivi
                        </Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" id="hasAppointment-false" />
                        </FormControl>
                        <Label htmlFor="hasAppointment-false" className="font-normal">
                          Non, pas de suivi nécessaire pour le moment
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {hasAppointmentValue && (
              <FormField
                control={form.control}
                name="appointmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de RDV</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un type..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="results_presentation">Présentation de résultats d'examen</SelectItem>
                        <SelectItem value="control">Contrôle</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </section>

          <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes d'observation</FormLabel><FormControl><Textarea placeholder="Ex: Céphalées depuis 3 jours." {...field} /></FormControl>
              <FormDescription>
                Si un examen a été fait sur place, vous pouvez noter les résultats ici.
              </FormDescription>
              <FormMessage /></FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

export default ConsultationForm;
