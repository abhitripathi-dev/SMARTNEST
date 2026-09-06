import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type Profile, type Society, type Role, type Flat } from './supabase';
import { getLocal, setLocal } from './dataStore';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  society: Society | null;
  loading: boolean;
  needsOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  registerNewSociety: (params: {
    societyName: string;
    city: string;
    address?: string;
    wings: string[];
    flatsPerWing: number;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
  }) => Promise<{ error: string | null; credentials: { societyCode: string; totalFlats: number } }>;
  createSociety: (name: string, fullName: string, address?: string) => Promise<{ error: string | null }>;
  joinSociety: (societyId: string, role: 'resident' | 'staff') => Promise<{ error: string | null }>;
  updateProfile: (updates: { full_name?: string; phone?: string | null; avatar_color?: string }) => Promise<{ error: string | null }>;
  updateSociety: (updates: { name?: string; address?: string | null }) => Promise<{ error: string | null }>;
  switchDemoRole: (role: Role) => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_SOCIETY_ID = 'e7b1a234-5678-4321-8765-abcdef123456';

const DEMO_PROFILES: Record<Role, { profile: Profile; society: Society }> = {
  admin: {
    profile: {
      id: 'usr-demo-admin-001',
      society_id: DEMO_SOCIETY_ID,
      full_name: 'Vikram Mehta (Admin)',
      phone: '+91 98201 23456',
      role: 'admin',
      avatar_color: 'blue',
      created_at: new Date().toISOString(),
    },
    society: {
      id: DEMO_SOCIETY_ID,
      name: 'The Grand Heritage',
      address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
      created_by: 'usr-demo-admin-001',
      created_at: new Date().toISOString(),
    },
  },
  staff: {
    profile: {
      id: 'usr-demo-staff-002',
      society_id: DEMO_SOCIETY_ID,
      full_name: 'Rajesh Sharma (Staff)',
      phone: '+91 98302 34567',
      role: 'staff',
      avatar_color: 'teal',
      created_at: new Date().toISOString(),
    },
    society: {
      id: DEMO_SOCIETY_ID,
      name: 'The Grand Heritage',
      address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
      created_by: 'usr-demo-admin-001',
      created_at: new Date().toISOString(),
    },
  },
  resident: {
    profile: {
      id: 'usr-demo-resident-003',
      society_id: DEMO_SOCIETY_ID,
      full_name: 'Pooja Iyer (Resident)',
      phone: '+91 98403 45678',
      role: 'resident',
      avatar_color: 'violet',
      created_at: new Date().toISOString(),
    },
    society: {
      id: DEMO_SOCIETY_ID,
      name: 'The Grand Heritage',
      address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
      created_by: 'usr-demo-admin-001',
      created_at: new Date().toISOString(),
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (prof) {
        setProfile(prof as Profile);
        if (prof.society_id) {
          const { data: soc } = await supabase.from('societies').select('*').eq('id', prof.society_id).maybeSingle();
          setSociety((soc as Society) || null);
        } else {
          setSociety(null);
        }
      } else {
        // Check custom registered society
        const customRaw = localStorage.getItem('society_custom_registered');
        if (customRaw) {
          const custom = JSON.parse(customRaw);
          setProfile(custom.profile);
          setSociety(custom.society);
          return;
        }

        // If logged in via demo session
        const storedDemo = localStorage.getItem('society_demo_role') as Role | null;
        if (storedDemo && DEMO_PROFILES[storedDemo]) {
          setProfile(DEMO_PROFILES[storedDemo].profile);
          setSociety(DEMO_PROFILES[storedDemo].society);
        } else {
          setProfile(null);
          setSociety(null);
        }
      }
    } catch {
      const customRaw = localStorage.getItem('society_custom_registered');
      if (customRaw) {
        const custom = JSON.parse(customRaw);
        setProfile(custom.profile);
        setSociety(custom.society);
        return;
      }

      const storedDemo = localStorage.getItem('society_demo_role') as Role | null;
      if (storedDemo && DEMO_PROFILES[storedDemo]) {
        setProfile(DEMO_PROFILES[storedDemo].profile);
        setSociety(DEMO_PROFILES[storedDemo].society);
      }
    }
  }, []);

  useEffect(() => {
    // 1. Check custom registered society first
    const customRaw = localStorage.getItem('society_custom_registered');
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        setProfile(custom.profile);
        setSociety(custom.society);
        setSession({
          user: { id: custom.profile.id, email: custom.email } as Session['user'],
          access_token: 'custom-auth-token',
          token_type: 'bearer',
          expires_in: 86400,
          refresh_token: 'custom-refresh-token',
        } as Session);
        setLoading(false);
        return;
      } catch {
        // Fallback
      }
    }

    // 2. Check demo role
    const storedDemo = localStorage.getItem('society_demo_role') as Role | null;
    if (storedDemo && DEMO_PROFILES[storedDemo]) {
      setProfile(DEMO_PROFILES[storedDemo].profile);
      setSociety(DEMO_PROFILES[storedDemo].society);
      setSession({
        user: { id: DEMO_PROFILES[storedDemo].profile.id, email: `${storedDemo}@smartnest.community` } as Session['user'],
        access_token: 'demo-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'demo-refresh-token',
      } as Session);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        loadProfile(existingSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT' || !newSession) {
        localStorage.removeItem('society_demo_role');
        setProfile(null);
        setSociety(null);
        setLoading(false);
        return;
      }
      if (newSession?.user) {
        loadProfile(newSession.user.id).finally(() => setLoading(false));
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const registerNewSociety = async (params: {
    societyName: string;
    city: string;
    address?: string;
    wings: string[];
    flatsPerWing: number;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
  }) => {
    try {
      const societyCode = `SN-${Math.floor(10000 + Math.random() * 90000)}`;
      const societyId = `soc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const adminId = `usr-admin-${Date.now().toString(36)}`;

      const newSociety: Society = {
        id: societyId,
        name: params.societyName,
        address: params.address || `${params.city}, India`,
        created_by: adminId,
        created_at: new Date().toISOString(),
      };

      const newProfile: Profile = {
        id: adminId,
        society_id: societyId,
        full_name: `${params.adminName} (Admin)`,
        phone: params.adminPhone || '+91 98200 00000',
        role: 'admin',
        avatar_color: 'teal',
        created_at: new Date().toISOString(),
      };

      // Generate Starter Flats across all wings
      const generatedFlats: Flat[] = [];
      params.wings.forEach((wing) => {
        for (let i = 1; i <= params.flatsPerWing; i++) {
          const floorNum = Math.ceil(i / 2);
          const flatNum = `${wing}-${floorNum}${i % 2 === 1 ? '01' : '02'}`;
          generatedFlats.push({
            id: `flat-${wing.toLowerCase()}-${i}-${Date.now().toString(36)}`,
            society_id: societyId,
            flat_number: flatNum,
            block: `${wing} Wing`,
            floor: `${floorNum}${floorNum === 1 ? 'st' : floorNum === 2 ? 'nd' : floorNum === 3 ? 'rd' : 'th'} Floor`,
            area: '1,350 sq ft',
            status: 'vacant',
            created_at: new Date().toISOString(),
          });
        }
      });

      // Persist in local database store
      const existingFlats = getLocal<Flat[]>('flats', []);
      setLocal('flats', [...generatedFlats, ...existingFlats]);

      // Save Custom Registered Society info in localStorage
      const registrationPayload = {
        email: params.adminEmail,
        password: params.adminPassword,
        societyId,
        societyCode,
        profile: newProfile,
        society: newSociety,
        registered_at: new Date().toISOString(),
      };

      localStorage.setItem('society_custom_registered', JSON.stringify(registrationPayload));
      localStorage.setItem('society_active_id', societyId);
      localStorage.setItem('society_view_mode', 'portal');

      // Attempt cloud sync to Supabase if reachable
      try {
        await supabase.from('societies').insert(newSociety);
        await supabase.from('profiles').insert(newProfile);
        if (generatedFlats.length > 0) {
          await supabase.from('flats').insert(generatedFlats);
        }
      } catch {
        // Fallback to local
      }

      setProfile(newProfile);
      setSociety(newSociety);
      setSession({
        user: { id: adminId, email: params.adminEmail } as Session['user'],
        access_token: 'custom-auth-token',
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: 'custom-refresh-token',
      } as Session);
      setLoading(false);

      return {
        error: null,
        credentials: {
          societyCode,
          totalFlats: generatedFlats.length,
        },
      };
    } catch (err: any) {
      return { error: err?.message || 'Failed to initialize society database', credentials: { societyCode: '', totalFlats: 0 } };
    }
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();

    // Check custom registered account
    const customRaw = localStorage.getItem('society_custom_registered');
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        if (custom.email.toLowerCase() === cleanEmail) {
          setProfile(custom.profile);
          setSociety(custom.society);
          setSession({
            user: { id: custom.profile.id, email: custom.email } as Session['user'],
            access_token: 'custom-auth-token',
            token_type: 'bearer',
            expires_in: 86400,
            refresh_token: 'custom-refresh-token',
          } as Session);
          localStorage.setItem('society_active_id', custom.societyId);
          localStorage.setItem('society_view_mode', 'portal');
          setLoading(false);
          return { error: null };
        }
      } catch {
        // Continue
      }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Fallback for demo roles
        const role: Role = cleanEmail.includes('staff') || cleanEmail.includes('guard') || cleanEmail.includes('security')
          ? 'staff'
          : cleanEmail.includes('resident') || cleanEmail.includes('user')
          ? 'resident'
          : 'admin';

        switchDemoRole(role);
        return { error: null };
      }
      return { error: null };
    } catch {
      const role: Role = cleanEmail.includes('staff') ? 'staff' : cleanEmail.includes('resident') ? 'resident' : 'admin';
      switchDemoRole(role);
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        // Create local user profile and log them in
        const newProfile: Profile = {
          id: `usr-custom-${Date.now()}`,
          society_id: DEMO_SOCIETY_ID,
          full_name: fullName || 'SmartNest Member',
          phone: '+91 98000 00000',
          role: 'admin',
          avatar_color: 'teal',
          created_at: new Date().toISOString(),
        };
        const newSoc: Society = {
          id: DEMO_SOCIETY_ID,
          name: 'The Grand Heritage',
          address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
          created_by: newProfile.id,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('society_demo_role', 'admin');
        setProfile(newProfile);
        setSociety(newSoc);
        setSession({
          user: { id: newProfile.id, email } as Session['user'],
          access_token: 'demo-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'demo-refresh-token',
        } as Session);
        setLoading(false);
        return { error: null };
      }
      return { error: null };
    } catch {
      switchDemoRole('admin');
      return { error: null };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('society_demo_role');
    localStorage.removeItem('society_custom_registered');
    localStorage.removeItem('society_active_id');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignored for demo sessions
    }
    setSession(null);
    setProfile(null);
    setSociety(null);
  };

  const switchDemoRole = (role: Role) => {
    localStorage.removeItem('society_custom_registered');
    const data = DEMO_PROFILES[role] || DEMO_PROFILES.admin;
    localStorage.setItem('society_demo_role', role);
    localStorage.setItem('society_active_id', DEMO_SOCIETY_ID);
    setProfile(data.profile);
    setSociety(data.society);
    setSession({
      user: { id: data.profile.id, email: `${role}@smartnest.community` } as Session['user'],
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh-token',
    } as Session);
    setLoading(false);
  };

  const createSociety = async (name: string, fullName: string, address?: string) => {
    if (!session?.user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('create_society_and_assign', {
        society_name: name,
        creator_full_name: fullName,
      });

      if (error) {
        const { data: newSoc, error: socErr } = await supabase.from('societies').insert({
          name,
          address: address || null,
          created_by: session.user.id,
        }).select('id').single();

        if (socErr) return { error: socErr.message };

        const { error: profErr } = await supabase.from('profiles').update({
          society_id: newSoc.id,
          role: 'admin',
          full_name: fullName,
        }).eq('id', session.user.id);

        if (profErr) return { error: profErr.message };
      }

      if (address && data) {
        await supabase.from('societies').update({ address }).eq('id', data);
      }

      await loadProfile(session.user.id);
      return { error: null };
    } catch {
      if (profile) {
        const newSoc: Society = {
          id: DEMO_SOCIETY_ID,
          name,
          address: address || null,
          created_by: profile.id,
          created_at: new Date().toISOString(),
        };
        setSociety(newSoc);
        setProfile({ ...profile, full_name: fullName, society_id: newSoc.id, role: 'admin' });
      }
      return { error: null };
    }
  };

  const joinSociety = async (societyId: string, role: 'resident' | 'staff') => {
    if (!session?.user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase.rpc('join_society', {
        society_uuid: societyId,
        user_role: role,
      });

      if (error) {
        const { error: profErr } = await supabase.from('profiles').update({
          society_id: societyId,
          role,
        }).eq('id', session.user.id);

        if (profErr) return { error: profErr.message };
      }

      await loadProfile(session.user.id);
      return { error: null };
    } catch {
      if (profile) {
        setProfile({ ...profile, society_id: societyId, role });
      }
      return { error: null };
    }
  };

  const updateProfile = async (updates: { full_name?: string; phone?: string | null; avatar_color?: string }) => {
    if (!profile) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) return { error: error.message };
      setProfile({ ...profile, ...updates });
      return { error: null };
    } catch {
      setProfile({ ...profile, ...updates });
      return { error: null };
    }
  };

  const updateSociety = async (updates: { name?: string; address?: string | null }) => {
    if (!society || profile?.role !== 'admin') return { error: 'Unauthorized or society not loaded' };

    try {
      const { error } = await supabase.from('societies').update(updates).eq('id', society.id);
      if (error) return { error: error.message };
      setSociety({ ...society, ...updates });
      return { error: null };
    } catch {
      setSociety({ ...society, ...updates });
      return { error: null };
    }
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const needsOnboarding = !!session && !loading && !!profile && !profile.society_id;

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        society,
        loading,
        needsOnboarding,
        signIn,
        signUp,
        signOut,
        registerNewSociety,
        createSociety,
        joinSociety,
        updateProfile,
        updateSociety,
        switchDemoRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function usePermissions() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'resident';

  return {
    role,
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    isResident: role === 'resident',
    canManageFlats: role === 'admin',
    canManageBills: role === 'admin' || role === 'staff',
    canManageComplaints: true,
    canUpdateComplaintStatus: role === 'admin' || role === 'staff',
    canDeleteComplaints: role === 'admin',
    canManageVisitors: role === 'admin' || role === 'staff',
    canManageFacilities: role === 'admin',
    canBookFacilities: true,
    canManageSocietySettings: role === 'admin',
    canManageMembers: role === 'admin',
  };
}
