
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AppBrand from '@/components/branding/AppBrand';

const LockScreenForm: React.FC = () => {
  const [enteredPin, setEnteredPin] = useState('');
  const { unlockApp, isPinSet, setPin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  useEffect(() => {
    if (!isPinSet) {
      setIsSettingPin(true);
    }
  }, [isPinSet]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockApp(enteredPin)) {
      const redirectPath = localStorage.getItem('redirectAfterUnlock') || '/';
      localStorage.removeItem('redirectAfterUnlock');
      router.replace(redirectPath);
    } else {
      toast({
        title: 'PIN Incorrect',
        description: 'Veuillez réessayer.',
        variant: 'destructive',
      });
      setEnteredPin('');
    }
  };

  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      toast({ title: 'PIN trop court', description: 'Le PIN doit comporter au moins 4 chiffres.', variant: 'destructive' });
      return;
    }
    if (newPin !== confirmNewPin) {
      toast({ title: 'Les PINs ne correspondent pas', description: 'Veuillez vérifier votre PIN.', variant: 'destructive' });
      return;
    }
    setPin(newPin);
    setIsSettingPin(false);
    toast({ title: 'PIN Défini', description: 'Votre PIN a été configuré avec succès.' });
    router.replace('/');
  };
  
  if (isSettingPin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader className="text-center">
            <AppBrand className="mb-4" nameClassName="text-xl" />
            <CardTitle className="text-2xl font-headline">Configurer votre PIN</CardTitle>
            <CardDescription>Créez un PIN pour sécuriser votre application.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPin} className="space-y-4">
              <Input
                type="password"
                placeholder="Nouveau PIN (min 4 chiffres)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="text-center text-lg"
                pattern="\d*"
                inputMode="numeric"
                minLength={4}
              />
              <Input
                type="password"
                placeholder="Confirmer le nouveau PIN"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                className="text-center text-lg"
                pattern="\d*"
                inputMode="numeric"
                minLength={4}
              />
              <Button type="submit" className="w-full">Définir le PIN</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <AppBrand className="mb-4" nameClassName="text-xl" />
          <CardTitle className="text-2xl font-headline">Application Verrouillée</CardTitle>
          <CardDescription>Entrez votre PIN pour continuer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-6">
            <Input
              type="password"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em]"
              maxLength={8} 
              pattern="\d*"
              inputMode="numeric"
            />
            <Button type="submit" className="w-full">Déverrouiller</Button>
          </form>
        </CardContent>
        <CardFooter className="pt-6">
        </CardFooter>
      </Card>
    </div>
  );
};

export default LockScreenForm;
