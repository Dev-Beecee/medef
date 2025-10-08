'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Shield, 
  User, 
  Mail, 
  Calendar,
  ChevronLeft,
  Trash2,
  CheckCircle,
  XCircle,
  Database
} from 'lucide-react';
import Link from 'next/link';
import CreateAdminUser from '@/components/CreateAdminUser';

interface AdminUser {
  id: number;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean | null;
  created_at: string | null;
  last_login?: string | null;
  auth_user_id?: string | null;
}

export default function AdminUsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des administrateurs:', error);
      toast.error('Erreur lors du chargement des administrateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCreated = (newUser: AdminUser) => {
    setAdminUsers(prev => [newUser, ...prev]);
    setShowCreateForm(false);
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setAdminUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, is_active: !currentStatus }
            : user
        )
      );

      toast.success(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setAdminUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('Administrateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const syncUsersWithAuth = async () => {
    try {
      setIsSyncing(true);
      
      const response = await fetch('/api/sync-admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la synchronisation');
      }

      if (result.syncedCount > 0) {
        toast.success(result.message);
        fetchAdminUsers(); // Recharger la liste
      } else {
        toast.info(result.message);
      }
      
      if (result.errorCount > 0 && result.errors) {
        console.error('Erreurs de synchronisation:', result.errors);
        toast.error(`${result.errorCount} erreur(s) lors de la synchronisation`);
      }

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'super_admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getRoleBadge = (role: string) => {
    return role === 'super_admin' 
      ? <Badge variant="destructive">Super Admin</Badge>
      : <Badge variant="secondary">Admin</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des administrateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/ghost-dashboard">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Retour au dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Administrateurs</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/ghost-dashboard/admin/clear-database">
                <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50">
                  <Database className="w-4 h-4 mr-2" />
                  Maintenance DB
                </Button>
              </Link>
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {showCreateForm ? 'Annuler' : 'Nouvel Admin'}
              </Button>
              <Button 
                onClick={syncUsersWithAuth}
                disabled={isSyncing}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                    Synchronisation...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sync avec Auth
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-gray-600">Gérer les utilisateurs administrateurs du système</p>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateAdminUser onUserCreated={handleUserCreated} />
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Administrateurs</p>
                  <p className="text-2xl font-bold">{adminUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold">
                    {adminUsers.filter(user => user.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Super Admins</p>
                  <p className="text-2xl font-bold">
                    {adminUsers.filter(user => user.role === 'super_admin').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des administrateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Liste des Administrateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adminUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun administrateur</h3>
                <p className="text-gray-600 mb-4">Commencez par créer votre premier administrateur</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un Administrateur
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {adminUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {user.email}
                        </h4>
                        {getRoleBadge(user.role)}
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        {user.auth_user_id ? (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            ✓ Auth
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-500 text-red-600">
                            ✗ Auth
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Créé le {formatDate(user.created_at)}</span>
                        </div>
                        {user.last_login && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>Dernière connexion: {formatDate(user.last_login)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={user.is_active ? "destructive" : "default"}
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activer
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
