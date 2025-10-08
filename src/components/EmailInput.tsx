'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle } from 'lucide-react';

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Mail className="w-12 h-12 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Confirmer votre vote</CardTitle>
        <p className="text-gray-600 text-sm">
          Saisissez votre adresse email pour finaliser votre vote
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
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
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Votre vote est sécurisé</p>
              <p className="text-blue-600">
                Chaque adresse email ne peut voter qu&apos;une seule fois
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onSubmit}
          disabled={!email || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Vérification...
            </>
          ) : (
            'Confirmer mon vote'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmailInput;
