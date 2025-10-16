'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface EmailInputProps {
  email: string;
  isLoading: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
}

const EmailInput: React.FC<EmailInputProps> = ({
  email,
  isLoading,
  onEmailChange,
  onSubmit
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg text-white mb-4">Pour valider vos votes, merci de saisir votre adresse email.</h2>
      </div>
      
      <Card 
        className="w-full max-w-md mx-auto"
        style={{
          background: 'rgb(30, 46, 86)',
          border: '1px solid rgb(219, 181, 114)'
        }}
      >
      <CardHeader className="text-center">
       <h3 className="text-2xl font-bold mb-2 text-left" style={{ color: '#dbb572' }}>Confirmer votre vote</h3>
      </CardHeader>
      <CardContent className="space-y-4" style={{ color: 'white' }}>
        <div className="space-y-2">
          <Label htmlFor="email" style={{ color: 'white' }}>Adresse email</Label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="p-3 rounded-lg" style={{ background: 'rgba(219, 181, 114, 0.1)', border: '1px solid rgba(219, 181, 114, 0.3)' }}>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#dbb572' }} />
            <div className="text-sm" style={{ color: 'white' }}>
              <p className="font-medium">Votre vote est sécurisé</p>
              <p style={{ color: '#dbb572' }}>
                Chaque adresse email ne peut voter qu&apos;une seule fois
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onSubmit}
          disabled={!email || isLoading}
          className="w-full"
          style={{
            borderRadius: '10px',
            border: '1px solid #EBE7E1',
            background: '#DBB572',
            backdropFilter: 'blur(40px)',
            color: '#10214b'
          }}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: '#10214b' }}></div>
              Vérification...
            </>
          ) : (
            'Confirmer mon vote'
          )}
        </Button>
      </CardContent>
    </Card>
    </div>
  );
};

export default EmailInput;
