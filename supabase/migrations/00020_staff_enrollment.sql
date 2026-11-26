CREATE TABLE public.staff_invitations (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES public.outlets ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles,
  email text NOT NULL,
  name text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  UNIQUE (outlet_id,email)
);
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_invitations FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.invite_outlet_staff(p_outlet uuid,p_email text,p_name text,p_role text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  result uuid;
  role_key uuid;
  session jsonb := public.get_pos_session(p_outlet);
BEGIN
  IF p_role IS NULL OR p_role NOT IN ('owner','cashier','kitchen') OR NOT (
    public.is_platform_super_admin() OR
    (p_role <> 'owner' AND coalesce(session->'effectivePermissions' ? 'staff.manage',false)
      AND (session->>'outletId')::uuid = p_outlet)
  ) THEN RAISE EXCEPTION 'Staff invitation permission required' USING ERRCODE = '42501'; END IF;
  IF coalesce(length(trim(p_name)),0) NOT BETWEEN 1 AND 120 OR
    coalesce(trim(p_email),'') !~ '^[^ @]+@[^ @]+\.[^ @]+$' OR length(p_email)>254 THEN
    RAISE EXCEPTION 'Enter a name and email address';
  END IF;
  SELECT id INTO STRICT role_key FROM public.roles WHERE code=p_role AND tenant_id IS NULL AND is_system;
  INSERT INTO public.staff_invitations(outlet_id,email,name,role_id)
    VALUES(p_outlet,lower(trim(p_email)),trim(p_name),role_key)
    ON CONFLICT(outlet_id,email) DO UPDATE SET name=excluded.name,role_id=excluded.role_id,
      token=gen_random_uuid(), expires_at=excluded.expires_at
    RETURNING token INTO result;
  RETURN result;
END;
$$;

CREATE FUNCTION public.accept_staff_invitation(p_token uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  invite public.staff_invitations%ROWTYPE;
  identity_email text;
  employee uuid;
  tenant uuid;
  owner_role boolean;
BEGIN
  SELECT lower(email) INTO identity_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
  SELECT * INTO invite FROM public.staff_invitations WHERE token=p_token AND expires_at>now()
    AND email=identity_email FOR UPDATE;
  IF invite.token IS NULL THEN RAISE EXCEPTION 'Invitation expired or email does not match'; END IF;
  SELECT o.tenant_id INTO STRICT tenant FROM public.outlets o JOIN public.tenants t ON t.id=o.tenant_id
    WHERE o.id=invite.outlet_id AND o.status='active' AND t.status='active';
  INSERT INTO public.profiles(email,name,auth_user_id,avatar_initials)
    VALUES(identity_email,invite.name,auth.uid(),upper(left(invite.name,2)))
    ON CONFLICT(email) DO UPDATE SET auth_user_id=excluded.auth_user_id
      WHERE profiles.is_active AND (profiles.auth_user_id IS NULL OR profiles.auth_user_id=auth.uid())
    RETURNING id INTO employee;
  IF employee IS NULL THEN RAISE EXCEPTION 'This account cannot accept the invitation'; END IF;
  SELECT code='owner' INTO owner_role FROM public.roles WHERE id=invite.role_id;
  INSERT INTO public.tenant_memberships(tenant_id,profile_id,is_owner) VALUES(tenant,employee,owner_role)
    ON CONFLICT(tenant_id,profile_id) DO UPDATE SET is_owner=tenant_memberships.is_owner OR excluded.is_owner;
  INSERT INTO public.outlet_memberships(outlet_id,profile_id,role_id,status)
    VALUES(invite.outlet_id,employee,invite.role_id,'active')
    ON CONFLICT(outlet_id,profile_id) DO UPDATE SET status='active',role_id=excluded.role_id
      WHERE outlet_memberships.status='inactive' AND outlet_memberships.role_id=excluded.role_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'This person already has an outlet assignment'; END IF;
  DELETE FROM public.staff_invitations WHERE token=p_token;
END;
$$;
CREATE FUNCTION public.disable_outlet_staff(p_outlet uuid,p_staff uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE session jsonb := public.get_pos_session(p_outlet);
BEGIN
  IF NOT coalesce(session->'effectivePermissions' ? 'staff.manage',false) OR
    (session->>'outletId')::uuid IS DISTINCT FROM p_outlet THEN RAISE EXCEPTION 'Staff permission required' USING ERRCODE='42501'; END IF;
  UPDATE public.outlet_memberships m SET status='inactive' FROM public.roles r
    WHERE m.role_id=r.id AND r.code IN ('cashier','kitchen') AND m.profile_id=p_staff AND m.outlet_id=p_outlet;
  IF NOT FOUND THEN RAISE EXCEPTION 'This staff assignment cannot be disabled'; END IF;
  DELETE FROM public.staff_invitations i USING public.profiles p WHERE p.id=p_staff AND i.email=lower(p.email) AND i.outlet_id=p_outlet;
  DELETE FROM public.tenant_memberships tm WHERE tm.profile_id=p_staff AND NOT tm.is_owner AND tm.tenant_id=(session->>'tenantId')::uuid
    AND NOT EXISTS(SELECT 1 FROM public.outlet_memberships m JOIN public.outlets o ON m.outlet_id=o.id
      WHERE m.profile_id=p_staff AND m.status='active' AND o.tenant_id=tm.tenant_id);
END;
$$;
REVOKE ALL ON FUNCTION public.invite_outlet_staff(uuid,text,text,text),public.accept_staff_invitation(uuid),public.disable_outlet_staff(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.invite_outlet_staff(uuid,text,text,text),public.accept_staff_invitation(uuid),public.disable_outlet_staff(uuid,uuid) TO authenticated;

-- A blank outlet needs a category before its first product can be entered.
CREATE FUNCTION public.initialize_outlet_menu() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  INSERT INTO public.categories(tenant_id,outlet_id,name,slug) VALUES(NEW.tenant_id,NEW.id,'Menu','menu');
  RETURN NEW;
END;
$$;
CREATE TRIGGER initialize_outlet_menu AFTER INSERT ON public.outlets
FOR EACH ROW EXECUTE FUNCTION public.initialize_outlet_menu();
INSERT INTO public.categories(tenant_id,outlet_id,name,slug)
SELECT o.tenant_id,o.id,'Menu','menu' FROM public.outlets o WHERE NOT EXISTS(
  SELECT 1 FROM public.categories c WHERE c.tenant_id=o.tenant_id AND (c.outlet_id=o.id OR c.outlet_id IS NULL)
);
