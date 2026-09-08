import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, type Profile, type Society, type Role, type Flat, type SocietyMember } from './supabase';
import { dataStore, getLocal, setLocal, DEMO_SOCIETY_ID } from './dataStore';

type RegisteredAccount = {
  email: string;
  password?: string;
  societyId: string;
  societyCode: string;
  profile: Profile;
  society: Society;
  role: Role;
  created_at: string;
};

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

const DEMO_PROFILES: Record<Role, { profile: Profile; society: Society }> = {
  admin: {
    profile: {
      id: 'usr-demo-admin-001',
      society_id: DEMO_SOCIETY_ID,
      full_name: 'Community Administrator',
      phone: '+91 98201 23456',
      role: 'admin',
      avatar_color: 'blue',
      created_at: new Date().toISOString(),
    },
    society: {
      id: DEMO_SOCIETY_ID,
      name: 'SmartNest Heights',
      address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
      created_by: 'usr-demo-admin-001',
      created_at: new Date().toISOString(),
    },
  },
  staff: {
    profile: {
      id: 'usr-demo-staff-002',
      society_id: DEMO_SOCIETY_ID,
      full_name: 'Security Gate Staff',
      phone: '+91 98302 34567',
      role: 'staff',
      avatar_color: 'teal',
      created_at: new Date().toISOString(),
    },
    society: {
      id: DEMO_SOCIETY_ID,
      name: 'SmartNest Heights',
      address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
      created_by: 'usr-demo-admin-001',
      created_at: new Date().toISOString(),
    },
  },
  resident: {
    profile: {
      id: 'usr-demo-resident-003',
      society_id: DEMO_SOCIETY_ID,
      full_name: 'Resident Member',
      phone: '+91 98403 45678',
      role: 'resident',
      avatar_color: 'violet',
      created_at: new Date().toISOString(),
    },
    society: {
      id: DEMO_SOCIETY_ID,
      name: 'SmartNest Heights',
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
      // 1. Check custom registered / active society
      const activeSocId = localStorage.getItem('society_active_id');
      const accounts = getLocal<RegisteredAccount[]>('accounts', []);
      const matchedAccount = accounts.find((a) => a.profile.id === userId || a.societyId === activeSocId);
      if (matchedAccount) {
        setProfile(matchedAccount.profile);
        setSociety(matchedAccount.society);
        return;
      }

      const customRaw = localStorage.getItem('society_custom_registered');
      if (customRaw) {
        const custom = JSON.parse(customRaw);
        setProfile(custom.profile);
        setSociety(custom.society);
        return;
      }

      // 2. Try Supabase
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (prof) {
        setProfile(prof as Profile);
        if (prof.society_id) {
          const { data: soc } = await supabase.from('societies').select('*').eq('id', prof.society_id).maybeSingle();
          setSociety((soc as Society) || null);
        } else {
          setSociety(null);
        }
        return;
      }

      // 3. Demo fallback
      const storedDemo = localStorage.getItem('society_demo_role') as Role | null;
      if (storedDemo && DEMO_PROFILES[storedDemo]) {
        setProfile(DEMO_PROFILES[storedDemo].profile);
        setSociety(DEMO_PROFILES[storedDemo].society);
      } else {
        setProfile(null);
        setSociety(null);
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
    const syncCurrentAuth = () => {
      // 1. Check if user is logged into a custom registered society
      const customRaw = localStorage.getItem('society_custom_registered');
      if (customRaw) {
        try {
          const custom = JSON.parse(customRaw);
          if (custom.profile && custom.society) {
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
            setLoading(false);
            return true;
          }
        } catch {}
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
        return true;
      }

      return false;
    };

    if (syncCurrentAuth()) return;

    // 3. Supabase session check
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

    const handleAuthChange = () => {
      syncCurrentAuth();
    };
    window.addEventListener('society-auth-change', handleAuthChange);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener('society-auth-change', handleAuthChange);
    };
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

      // Generate Starter Flats across all configured wings
      const generatedFlats: Flat[] = [];
      const cleanWings = params.wings.length > 0 ? params.wings : ['A', 'B'];
      cleanWings.forEach((wing) => {
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
            status: i === 1 && wing === cleanWings[0] ? 'occupied' : 'vacant',
            created_at: new Date().toISOString(),
          });
        }
      });

      // Initialize society in dataStore with fresh custom data
      dataStore.initializeSociety(newSociety, newProfile, generatedFlats, {
        name: params.adminName,
        email: params.adminEmail,
        phone: params.adminPhone,
      });

      // Save to persistent accounts list
      const accounts = getLocal<RegisteredAccount[]>('accounts', []);
      const newAccount: RegisteredAccount = {
        email: params.adminEmail.toLowerCase().trim(),
        password: params.adminPassword,
        societyId,
        societyCode,
        profile: newProfile,
        society: newSociety,
        role: 'admin',
        created_at: new Date().toISOString(),
      };
      setLocal('accounts', [newAccount, ...accounts.filter((a) => a.email !== newAccount.email)]);

      // Save active registration payload
      localStorage.setItem('society_custom_registered', JSON.stringify(newAccount));
      localStorage.setItem('society_active_id', societyId);
      localStorage.setItem('society_view_mode', 'portal');
      localStorage.removeItem('society_demo_role');

      // Sync with Supabase if reachable
      try {
        await supabase.from('societies').insert(newSociety);
        await supabase.from('profiles').insert(newProfile);
        if (generatedFlats.length > 0) {
          await supabase.from('flats').insert(generatedFlats);
        }
      } catch {}

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
    const cleanEmail = email.trim().toLowerCase();
    // 1. Check registered accounts in dataStore
    const accounts = getLocal<RegisteredAccount[]>('accounts', []);
    const matchedAccount = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (matchedAccount) {
      if (matchedAccount.password === password) {
        setProfile(matchedAccount.profile);
        setSociety(matchedAccount.society);
        setSession({
          user: { id: matchedAccount.profile.id, email: matchedAccount.email } as Session['user'],
          access_token: 'custom-auth-token',
          token_type: 'bearer',
          expires_in: 86400,
          refresh_token: 'custom-refresh-token',
        } as Session);
        localStorage.setItem('society_active_id', matchedAccount.societyId);
        localStorage.setItem('society_custom_registered', JSON.stringify(matchedAccount));
        localStorage.setItem('society_view_mode', 'portal');
        localStorage.removeItem('society_demo_role');
        setLoading(false);
        return { error: null };
      } else {
        return { error: 'Incorrect password. Please verify your credentials.' };
      }
    }

    // 2. Check staff/resident accounts created in society members
    const members = getLocal<Array<SocietyMember & { password?: string }>>('members', []);
    const matchedMember = members.find((m) => m.email && m.email.toLowerCase() === cleanEmail);
    if (matchedMember) {
      if (matchedMember.password && matchedMember.password === password) {
        const targetSocietyId = matchedMember.society_id || DEMO_SOCIETY_ID;
        const socList = await dataStore.societies.list();
        const memberSoc = socList.find((s) => s.id === targetSocietyId) || {
          id: targetSocietyId,
          name: 'Residential Society',
          address: 'India',
          created_by: matchedMember.id,
          created_at: matchedMember.created_at,
        };

        const memberProfile: Profile = {
          id: matchedMember.id,
          society_id: targetSocietyId,
          full_name: matchedMember.full_name,
          phone: matchedMember.phone || '+91 98000 00000',
          role: matchedMember.role,
          avatar_color: matchedMember.avatar_color || 'teal',
          created_at: matchedMember.created_at,
        };

        const sessionAccount: RegisteredAccount = {
          email: matchedMember.email!,
          password: matchedMember.password,
          societyId: targetSocietyId,
          societyCode: (memberSoc as Society).code || (memberSoc.id ? memberSoc.id.substring(0, 8).toUpperCase() : 'SOC12345'),
          profile: memberProfile,
          society: memberSoc as Society,
          role: matchedMember.role,
          created_at: matchedMember.created_at,
        };

        setProfile(memberProfile);
        setSociety(memberSoc as Society);
        setSession({
          user: { id: memberProfile.id, email: matchedMember.email } as Session['user'],
          access_token: 'custom-auth-token',
          token_type: 'bearer',
          expires_in: 86400,
          refresh_token: 'custom-refresh-token',
        } as Session);
        localStorage.setItem('society_active_id', targetSocietyId);
        localStorage.setItem('society_custom_registered', JSON.stringify(sessionAccount));
        localStorage.setItem('society_view_mode', 'portal');
        localStorage.removeItem('society_demo_role');
        setLoading(false);
        return { error: null };
      } else {
        return { error: 'Incorrect password. Please verify your credentials.' };
      }
    }

    // 3. Supabase cloud sign-in if connected
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return { error: null };
      } catch {}
    }

    return { error: 'No registered account found with this email. Please register your society or join as a resident.' };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        // Local signup fallback
        const adminId = `usr-${Date.now()}`;
        const newSociety: Society = {
          id: `soc-${Date.now()}`,
          name: `${fullName}'s Community`,
          address: 'India',
          created_by: adminId,
          created_at: new Date().toISOString(),
        };
        const newProfile: Profile = {
          id: adminId,
          society_id: newSociety.id,
          full_name: `${fullName} (Admin)`,
          phone: '+91 98000 00000',
          role: 'admin',
          avatar_color: 'teal',
          created_at: new Date().toISOString(),
        };

        const starterFlats: Flat[] = [
          { id: `flat-a-101-${Date.now()}`, society_id: newSociety.id, flat_number: 'A-101', block: 'A Wing', floor: '1st Floor', area: '1,250 sq ft', status: 'occupied', created_at: new Date().toISOString() },
          { id: `flat-a-102-${Date.now()}`, society_id: newSociety.id, flat_number: 'A-102', block: 'A Wing', floor: '1st Floor', area: '1,250 sq ft', status: 'vacant', created_at: new Date().toISOString() },
        ];

        dataStore.initializeSociety(newSociety, newProfile, starterFlats);

        const newAccount: RegisteredAccount = {
          email: email.toLowerCase().trim(),
          password,
          societyId: newSociety.id,
          societyCode: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
          profile: newProfile,
          society: newSociety,
          role: 'admin',
          created_at: new Date().toISOString(),
        };

        const accounts = getLocal<RegisteredAccount[]>('accounts', []);
        setLocal('accounts', [newAccount, ...accounts]);
        localStorage.setItem('society_custom_registered', JSON.stringify(newAccount));
        localStorage.setItem('society_active_id', newSociety.id);
        localStorage.setItem('society_view_mode', 'portal');

        setProfile(newProfile);
        setSociety(newSociety);
        setSession({
          user: { id: newProfile.id, email } as Session['user'],
          access_token: 'custom-auth-token',
          token_type: 'bearer',
          expires_in: 86400,
          refresh_token: 'custom-refresh-token',
        } as Session);
        setLoading(false);
        return { error: null };
      }
      return { error: null };
    } catch {
      return { error: 'Registration failed. Please try again.' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('society_demo_role');
    localStorage.removeItem('society_custom_registered');
    localStorage.removeItem('society_active_id');
    try {
      await supabase.auth.signOut();
    } catch {}
    setSession(null);
    setProfile(null);
    setSociety(null);
  };

  const switchDemoRole = (role: Role) => {
    localStorage.removeItem('society_custom_registered');
    const data = DEMO_PROFILES[role] || DEMO_PROFILES.admin;
    localStorage.setItem('society_demo_role', role);
    localStorage.setItem('society_active_id', DEMO_SOCIETY_ID);
    localStorage.setItem('society_view_mode', 'portal');
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
        society_address: address ?? null,
        user_full_name: fullName,
      });
      if (error) return { error: error.message };
      await loadProfile(session.user.id);
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const joinSociety = async (societyId: string, role: 'resident' | 'staff') => {
    if (!session?.user) return { error: 'Not authenticated' };
    try {
      const { error } = await supabase.rpc('join_society', {
        target_society_id: societyId,
        target_role: role,
      });
      if (error) return { error: error.message };
      await loadProfile(session.user.id);
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const updateProfile = async (updates: { full_name?: string; phone?: string | null; avatar_color?: string }) => {
    if (!profile) return { error: 'Not authenticated' };
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);

    const customRaw = localStorage.getItem('society_custom_registered');
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        custom.profile = updatedProfile;
        localStorage.setItem('society_custom_registered', JSON.stringify(custom));
      } catch {}
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update(updates).eq('id', profile.id);
      } catch {}
    }

    return { error: null };
  };

  const updateSociety = async (updates: { name?: string; address?: string | null }) => {
    if (!society) return { error: 'Not authenticated' };
    const updatedSociety = { ...society, ...updates };
    setSociety(updatedSociety);

    const customRaw = localStorage.getItem('society_custom_registered');
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        custom.society = updatedSociety;
        localStorage.setItem('society_custom_registered', JSON.stringify(custom));
      } catch {}
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('societies').update(updates).eq('id', society.id);
      } catch {}
    }

    return { error: null };
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        society,
        loading,
        needsOnboarding: !society,
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
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
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
    canManageSociety: role === 'admin',
    canManageMembers: role === 'admin',
    canManageBilling: role === 'admin',
    canManageBills: role === 'admin',
    canManageVisitors: role === 'admin' || role === 'staff',
    canRecordVisitors: role === 'admin' || role === 'staff',
    canUpdateComplaints: role === 'admin' || role === 'staff',
    canUpdateComplaintStatus: role === 'admin' || role === 'staff',
    canDeleteComplaints: role === 'admin',
    canBookFacilities: true,
  };
}
