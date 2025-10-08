import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Clé API admin (à configurer dans les variables d'environnement)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé service role pour l'API admin
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    // Validation des données
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password et role sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà dans Supabase Auth
    const { data: existingUser } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      );
    }

    // Créer l'utilisateur dans Supabase Auth directement
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        is_admin: true
      }
    });

    if (authError) {
      // Si l'utilisateur existe déjà
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Un utilisateur avec cet email existe déjà dans l\'authentification' },
          { status: 409 }
        );
      }
      
      console.error('Erreur création utilisateur Auth:', authError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'utilisateur dans Auth' },
        { status: 500 }
      );
    }

    // Créer l'utilisateur dans notre table admin_users
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email,
        role,
        password_hash: password, // En production, hasher le mot de passe
        is_active: true,
        auth_user_id: authUser.user?.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur création utilisateur admin:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'utilisateur admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      authUser: authUser.user
    });

  } catch (error) {
    console.error('Erreur API create-admin-user:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
