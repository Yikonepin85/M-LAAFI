
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConsultationSchema } from '@/lib/schemas';
import type { Consultation, Patient } from '@/types';
import { PROFESSIONAL_TITLES, MEDICAL_SPECIALTIES, GENDERS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import useLocalStorage from '@/hooks/useLocalStorage';
import { differenceInYears, parseISO, isValid } from 'date-fns';


type ConsultationFormData = Omit<Consultation, 'id' | 'createdAt' | 'imc' | 'imcCategory'>;

interface ConsultationFormProps {
  onSubmit: (data: ConsultationFormData) => void;
  initialData?: ConsultationFormData;
  isSubmitting?: boolean;
}

const defaultValues: ConsultationFormData = {
  caregiver: { name: '', title: PROFESSIONAL_TITLES[0], specialty: '' },
  patient: { firstName: '', lastName: '', sex: GENDERS[0], age: 0 },
  vitals: { weight: undefined, height: undefined, bloodPressure: '', heartRate: undefined, temperature: undefined },
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
    } : defaultValues,
  });

  const [patients] = useLocalStorage<Patient[]>('patients', []);
  const [isPatientSelected, setIsPatientSelected] = React.useState(!!initialData?.patient?.firstName);

  const selectedTitle = form.watch('caregiver.title');
  const hasAppointmentValue = form.watch('hasAppointment');

  React.useEffect(() => {
    if (hasAppointmentValue === false) {
      form.setValue('appointmentType', '');
    }
  }, [hasAppointmentValue, form]);

  const handlePatientSelect = (patientId: string) => {
    if (patientId === 'manual') {
      form.reset({
        ...form.getValues(),
        patient: defaultValues.patient,
      });
      setIsPatientSelected(false);
      return;
    }

    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      const age = getAgeFromBirthDate(patient.birthDate);
      form.setValue('patient.firstName', patient.firstName, { shouldValidate: true });
      form.setValue('patient.lastName', patient.lastName, { shouldValidate: true });
      form.setValue('patient.sex', patient.sex, { shouldValidate: true });
      form.setValue('patient.age', age ?? 0, { shouldValidate: true });
      setIsPatientSelected(true);
    }
  };

  const handleSubmit = (data: ConsultationFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[70vh] p-1">
        <div className="space-y-6 p-2">
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
            <h3 className="text-lg font-semibold font-headline">Informations du Patient</h3>
            
            <FormItem>
              <FormLabel>Sélectionner un patient existant</FormLabel>
                <Select onValueChange={handlePatientSelect} disabled={patients.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={patients.length > 0 ? "Choisir pour remplir automatiquement..." : "Aucun patient enregistré"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">-- Saisie Manuelle --</SelectItem>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="patient.firstName" render={({ field }) => (
                  <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Fatoumata" {...field} readOnly={isPatientSelected} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField control={form.control} name="patient.lastName" render={({ field }) => (
                  <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Traoré" {...field} readOnly={isPatientSelected} /></FormControl><FormMessage /></FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="patient.sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexe</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      {GENDERS.map(gender => (
                        <FormItem key={gender} className="flex items-center space-x-2">
                          <FormControl><RadioGroupItem value={gender} id={`sex-${gender}`} disabled={isPatientSelected} /></FormControl>
                          <Label htmlFor={`sex-${gender}`}>{gender}</Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="patient.age" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Âge</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="30"
                      {...field}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      readOnly={isPatientSelected}
                    />
                  </FormControl>
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
                          onChange={field.onChange}
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
                          onChange={field.onChange}
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
                          onChange={field.onChange}
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
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </section>

          <section className="space-y-3 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold font-headline">Rendez-vous Associé</h3>
            <FormField
              control={form.control}
              name="hasAppointment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Un RDV est-il associé à cette consultation ?</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={String(field.value ?? 'false')}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="true">Oui</SelectItem>
                      <SelectItem value="false">Non</SelectItem>
                    </SelectContent>
                  </Select>
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
              <FormItem><FormLabel>Notes d'observation (facultatif)</FormLabel><FormControl><Textarea placeholder="Ex: Patiente se plaint de céphalées depuis 3 jours." {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
        </div>
        </ScrollArea>
      </form>
    </Form>
  );
};

export default ConsultationForm;
