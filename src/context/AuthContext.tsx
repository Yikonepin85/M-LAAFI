
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLocked: boolean;
  pin: string | null;
  setPin: (pin: string | null) => void;
  unlockApp: (enteredPin: string) => boolean;
  lockApp: () => void;
  isPinSet: boolean;
  isLockEnabled: boolean;
  toggleLockFeature: (enable: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedPin, setStoredPin] = useLocalStorage<string | null>('app-pin', null);
  // Verrouillage désactivé par défaut
  const [isLockFeatureEnabled, setIsLockFeatureEnabled] = useLocalStorage<boolean>('app-lock-enabled', false); 
  const [isLockedState, setIsLockedState] = useState<boolean>(false); // Démarre déverrouillé si fonctionnalité désactivée
  const router = useRouter();

  const isPinActuallySet = storedPin !== null && storedPin !== '';

  useEffect(() => {
    if (isLockFeatureEnabled && isPinActuallySet) {
      setIsLockedState(true);
    } else {
      setIsLockedState(false); // Non verrouillé si la fonction est désactivée ou s'il n'y a pas de PIN
    }
  }, [isLockFeatureEnabled, isPinActuallySet]);
  
  const unlockApp = useCallback((enteredPin: string): boolean => {
    if (isPinActuallySet && enteredPin === storedPin) {
      setIsLockedState(false);
      return true;
    }
    return false;
  }, [storedPin, isPinActuallySet]);

  const lockApp = useCallback(() => {
    if (isLockFeatureEnabled && isPinActuallySet) {
      setIsLockedState(true);
      router.push('/lockscreen');
    }
  }, [isLockFeatureEnabled, isPinActuallySet, router]);

  const setPin = (newPin: string | null) => {
    setStoredPin(newPin);
    if (newPin && isLockFeatureEnabled) {
      setIsLockedState(true); // Verrouiller si un nouveau PIN est défini et que la fonction est activée
    } else if (!newPin) {
      setIsLockedState(false); // Déverrouiller si le PIN est supprimé
      // Si le PIN est supprimé, la fonction de verrouillage devrait aussi être désactivée par sécurité/logique
      // toggleLockFeature(false); // Optionnel: commenter si on veut garder la préférence d'activation
    }
  };
  
  const toggleLockFeature = (enable: boolean) => {
    setIsLockFeatureEnabled(enable);
    if (!enable) {
      setIsLockedState(false); // Déverrouiller si la fonction est désactivée
    } else if (enable && isPinActuallySet) {
      setIsLockedState(true); // Verrouiller si la fonction est activée et qu'un PIN existe
    }
  };


  return (
    <AuthContext.Provider value={{ 
        isLocked: isLockedState, 
        pin: storedPin, 
        setPin, 
        unlockApp, 
        lockApp, 
        isPinSet: isPinActuallySet,
        isLockEnabled: isLockFeatureEnabled,
        toggleLockFeature,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
