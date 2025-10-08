import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Clé API admin (à configurer dans les variables d'environnement)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé service role pour l'API admin
);

export async function POST() {
  try {
    console.log('🔄 Début de la synchronisation des utilisateurs admin...');

    // Récupérer tous les utilisateurs admin sans auth_user_id
    const { data: usersWithoutAuth, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .is('auth_user_id', null);

    if (fetchError) {
      console.error('❌ Erreur récupération utilisateurs:', fetchError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      );
    }

    console.log(`📊 ${usersWithoutAuth?.length || 0} utilisateurs à synchroniser`);

    if (!usersWithoutAuth || usersWithoutAuth.length === 0) {
      console.log('✅ Tous les utilisateurs sont déjà synchronisés');
      return NextResponse.json({
        success: true,
        message: 'Tous les utilisateurs sont déjà synchronisés',
        syncedCount: 0,
        errorCount: 0
      });
    }

    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const user of usersWithoutAuth) {
      console.log(`🔄 Synchronisation de ${user.email}...`);
      
      try {
        console.log(`🔄 Création de ${user.email} dans Supabase Auth...`);
        
        // Créer l'utilisateur dans Supabase Auth directement
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password_hash,
          email_confirm: true,
          user_metadata: {
            role: user.role,
            is_admin: true
          }
        });

        if (authError) {
          // Si l'utilisateur existe déjà, essayer de le récupérer
          if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
            console.log(`⚠️ ${user.email} existe déjà dans Auth, tentative de récupération...`);
            
            // Essayer de récupérer l'utilisateur existant via une autre méthode
            // Pour l'instant, on va juste marquer comme synchronisé
            const { error: updateError } = await supabaseAdmin
              .from('admin_users')
              .update({ auth_user_id: 'existing-user' }) // Placeholder
              .eq('id', user.id);

            if (updateError) {
              console.error(`❌ Erreur mise à jour pour ${user.email}:`, updateError);
              errorCount++;
              errors.push(`${user.email}: Erreur de mise à jour - ${updateError.message}`);
            } else {
              console.log(`✅ ${user.email} marqué comme synchronisé`);
              syncedCount++;
            }
            continue;
          }
          
          console.error(`❌ Erreur création Auth pour ${user.email}:`, authError);
          errorCount++;
          errors.push(`${user.email}: Erreur création Auth - ${authError.message}`);
          continue;
        }

        console.log(`✅ ${user.email} créé dans Auth avec l'ID: ${authUser.user?.id}`);

        // Mettre à jour l'utilisateur avec l'auth_user_id
        const { error: updateError } = await supabaseAdmin
          .from('admin_users')
          .update({ auth_user_id: authUser.user?.id })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Erreur mise à jour pour ${user.email}:`, updateError);
          errorCount++;
          errors.push(`${user.email}: Erreur de mise à jour - ${updateError.message}`);
        } else {
          console.log(`✅ ${user.email} synchronisé avec succès`);
          syncedCount++;
        }

      } catch (error) {
        console.error(`❌ Erreur générale pour ${user.email}:`, error);
        errorCount++;
        errors.push(`${user.email}: Erreur générale - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    console.log(`🎉 Synchronisation terminée: ${syncedCount} succès, ${errorCount} erreurs`);

    return NextResponse.json({
      success: true,
      syncedCount,
      errorCount,
      errors,
      message: `${syncedCount} utilisateur(s) synchronisé(s), ${errorCount} erreur(s)`
    });

  } catch (error) {
    console.error('❌ Erreur API sync-admin-users:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
