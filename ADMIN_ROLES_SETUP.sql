-- ============================================
-- Configuration des rôles administrateurs
-- ============================================

-- 1. Créer la table pour les administrateurs
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Activer RLS sur admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Politique : Seuls les admins peuvent voir cette table
CREATE POLICY "Only admins can view admin_users"
ON admin_users
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- 4. Politique : Seuls les admins peuvent créer d'autres admins
CREATE POLICY "Only admins can insert admin_users"
ON admin_users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- 5. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- 6. Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour créer un utilisateur admin
-- Cette fonction peut être appelée par n'importe qui initialement
-- Après avoir créé le premier admin, on peut la restreindre
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Vérifier si c'est le premier admin (pas de restriction)
  -- Ou si l'utilisateur actuel est admin
  IF EXISTS (SELECT 1 FROM admin_users) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent créer d''autres administrateurs';
  END IF;

  -- Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  -- Ajouter l'utilisateur à la table admin_users
  INSERT INTO admin_users (user_id, email, role)
  VALUES (v_user_id, p_email, 'admin');

  -- Retourner le résultat
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'message', 'Utilisateur administrateur créé avec succès'
  );

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Un utilisateur avec cet email existe déjà'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Donner accès à la fonction
GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT) TO anon, authenticated;

-- 9. Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_admin_users_updated_at();

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

-- 1. Exécuter ce script dans l'éditeur SQL de Supabase

-- 2. Pour créer le premier admin via SQL directement :
/*
SELECT create_admin_user('admin@example.com', 'VotreMotDePasseSecurise123!');
*/

-- 3. Après avoir créé le premier admin, vous pouvez créer d'autres admins
--    via l'interface web en vous connectant avec le premier admin

-- 4. Pour lister tous les administrateurs :
/*
SELECT 
  au.id,
  au.email,
  au.role,
  au.created_at,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;
*/

-- 5. Pour supprimer un admin (attention, cela supprime aussi l'utilisateur) :
/*
DELETE FROM admin_users WHERE email = 'admin@example.com';
-- L'utilisateur sera automatiquement supprimé grâce à ON DELETE CASCADE
*/

