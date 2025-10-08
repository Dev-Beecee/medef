import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EmailCheckState {
  email: string;
  isLoading: boolean;
  hasVoted: boolean;
}

export const useEmailCheck = () => {
  const [state, setState] = useState<EmailCheckState>({
    email: '',
    isLoading: false,
    hasVoted: false,
  });

  const checkEmail = async (email: string) => {
    if (!email) {
      toast.error('Veuillez saisir votre adresse email');
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, email }));
      
      // Vérifier si l'email a déjà voté
      const { data: existingVotes, error: checkError } = await supabase
        .from('votes')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (checkError) throw checkError;

      const hasVoted = existingVotes && existingVotes.length > 0;
      setState(prev => ({ ...prev, hasVoted }));

      if (hasVoted) {
        toast.error('Cette adresse email a déjà voté');
        return false;
      }

      toast.success('Adresse email valide');
      return true;
      
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      toast.error('Erreur lors de la vérification de l\'email');
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const reset = () => {
    setState({
      email: '',
      isLoading: false,
      hasVoted: false,
    });
  };

  return {
    ...state,
    checkEmail,
    reset,
    setEmail: (email: string) => setState(prev => ({ ...prev, email })),
  };
};

