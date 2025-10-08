'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Shield, Mail, User } from 'lucide-react';

interface AdminUser {
  id?: number;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at?: string;
  last_login?: string;
}

interface CreateAdminUserProps {
  onUserCreated?: (user: AdminUser) => void;
}

const CreateAdminUser: React.FC<CreateAdminUserProps> = ({ onUserCreated }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'admin' as 'admin' | 'super_admin',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setIsLoading(true);

      // Note: Vérification de l'existence dans Supabase Auth désactivée temporairement
      // car l'API admin n'est pas accessible côté client
      
      // Vérifier si l'utilisateur existe déjà dans notre table admin_users
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingUser, error: checkError } = await (supabase as any)
        .from('admin_users')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        toast.error('Un administrateur avec cet email existe déjà');
        return;
      }

      // Créer l'utilisateur via l'API route
      const response = await fetch('/api/create-admin-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      toast.success('Administrateur créé avec succès !');
      
      // Réinitialiser le formulaire
      setFormData({
        email: '',
        role: 'admin',
        password: '',
        confirmPassword: ''
      });

      // Notifier le parent
      if (onUserCreated && result.user) {
        onUserCreated(result.user as AdminUser);
      }

    } catch (error) {
      console.error('Erreur lors de la création de l\'administrateur:', error);
      toast.error('Erreur lors de la création de l\'administrateur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <UserPlus className="w-12 h-12 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Créer un Administrateur</CardTitle>
        <p className="text-gray-600 text-sm">
          Ajouter un nouvel utilisateur administrateur
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rôle *
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Administrateur
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Super Administrateur
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {/* Confirmation mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {/* Informations sur les rôles */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Rôles disponibles :</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span><strong>Administrateur :</strong> Gestion des participations et votes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span><strong>Super Admin :</strong> Accès complet + gestion des utilisateurs</span>
              </div>
            </div>
          </div>

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Créer l&apos;Administrateur
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateAdminUser;