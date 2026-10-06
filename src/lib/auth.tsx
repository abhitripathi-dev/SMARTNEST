import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import type { Profile, Society, Role, Flat, SocietyMember } from './types';
import { dataStore, getLocal, setLocal, DEMO_SOCIETY_ID } from './dataStore';
import { generateToken, verifyAndDecodeToken, removeJwtToken, getJwtToken, type DecodedJwt } from './jwt';
import { api } from './api';

export type UserSession = {
  user: { id: string; email?: string | null };
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
};

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
  session: UserSession | null;
  profile: Profile | null;
  society: Society | null;
  jwtToken: string | null;
  decodedJwt: DecodedJwt | null;
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
  const [session, setSession] = useState<UserSession | null>(() => {
    const customRaw = typeof window !== 'undefined' ? localStorage.getItem('society_custom_registered') : null;
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        if (custom.profile) {
          return { user: { id: custom.profile.id, email: custom.email }, access_token: 'custom-auth-token' };
        }
      } catch { }
    }
    const storedDemo = (typeof window !== 'undefined' ? (localStorage.getItem('society_demo_role') as Role | null) : null) || 'admin';
    if (DEMO_PROFILES[storedDemo]) {
      return { user: { id: DEMO_PROFILES[storedDemo].profile.id, email: `${storedDemo}@smartnest.community` }, access_token: 'demo-token' };
    }
    return null;
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    const customRaw = typeof window !== 'undefined' ? localStorage.getItem('society_custom_registered') : null;
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        if (custom.profile) return custom.profile;
      } catch { }
    }
    const storedDemo = (typeof window !== 'undefined' ? (localStorage.getItem('society_demo_role') as Role | null) : null) || 'admin';
    return DEMO_PROFILES[storedDemo]?.profile || DEMO_PROFILES.admin.profile;
  });

  const [society, setSociety] = useState<Society | null>(() => {
    const customRaw = typeof window !== 'undefined' ? localStorage.getItem('society_custom_registered') : null;
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        if (custom.society) return custom.society;
      } catch { }
    }
    const storedDemo = (typeof window !== 'undefined' ? (localStorage.getItem('society_demo_role') as Role | null) : null) || 'admin';
    return DEMO_PROFILES[storedDemo]?.society || DEMO_PROFILES.admin.society;
  });

  const [jwtToken, setJwtToken] = useState<string | null>(() => getJwtToken());
  const [decodedJwt, setDecodedJwt] = useState<DecodedJwt | null>(() => verifyAndDecodeToken());
  const [loading, setLoading] = useState(false);

  // Sync JWT token when profile changes
  const updateJwt = useCallback((userProfile: Profile | null, userSociety: Society | null, email?: string) => {
    if (userProfile) {
      const token = generateToken({
        sub: userProfile.id,
        email: email || `${userProfile.role}@smartnest.community`,
        name: userProfile.full_name,
        role: userProfile.role,
        society_id: userSociety?.id || DEMO_SOCIETY_ID,
      });
      setJwtToken(token);
      setDecodedJwt(verifyAndDecodeToken(token));
    } else {
      removeJwtToken();
      setJwtToken(null);
      setDecodedJwt(null);
    }
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      // 1. Check custom registered / active society
      const activeSocId = localStorage.getItem('society_active_id');
      const accounts = getLocal<RegisteredAccount[]>('accounts', []);
      const matchedAccount = accounts.find((a) => a.profile.id === userId || a.societyId === activeSocId);
      if (matchedAccount) {
        setProfile(matchedAccount.profile);
        setSociety(matchedAccount.society);
        updateJwt(matchedAccount.profile, matchedAccount.society, matchedAccount.email);
        return;
      }

      const customRaw = localStorage.getItem('society_custom_registered');
      if (customRaw) {
        const custom = JSON.parse(customRaw);
        setProfile(custom.profile);
        setSociety(custom.society);
        return;
      }

      // 2. Try MySQL Backend me
      try {
        const me = await api.auth.me();
        if (me?.profile) {
          setProfile(me.profile);
          setSociety(me.society);
          return;
        }
      } catch { }

      // 3. Demo fallback
      const storedDemo = (localStorage.getItem('society_demo_role') as Role | null) || 'admin';
      if (storedDemo && DEMO_PROFILES[storedDemo]) {
        setProfile(DEMO_PROFILES[storedDemo].profile);
        setSociety(DEMO_PROFILES[storedDemo].society);
      } else {
        setProfile(DEMO_PROFILES.admin.profile);
        setSociety(DEMO_PROFILES.admin.society);
      }
    } catch {
      const storedDemo = (localStorage.getItem('society_demo_role') as Role | null) || 'admin';
      if (storedDemo && DEMO_PROFILES[storedDemo]) {
        setProfile(DEMO_PROFILES[storedDemo].profile);
        setSociety(DEMO_PROFILES[storedDemo].society);
      }
    }
  }, [updateJwt]);

  useEffect(() => {
    // Background check for remote profile if JWT exists
    const storedToken = localStorage.getItem('society_auth_token') || localStorage.getItem('jwt_token');
    if (storedToken) {
      api.auth
        .me()
        .then((me) => {
          if (me?.profile) {
            setProfile(me.profile);
            setSociety(me.society);
            setSession({
              user: { id: me.id, email: me.email },
              access_token: storedToken,
            });
            if (me.society?.id) localStorage.setItem('society_active_id', me.society.id);
          }
        })
        .catch(() => { });
    }

    const syncCurrentAuth = () => {
      const customRaw = localStorage.getItem('society_custom_registered');
      if (customRaw) {
        try {
          const custom = JSON.parse(customRaw);
          if (custom.profile && custom.society) {
            setProfile(custom.profile);
            setSociety(custom.society);
            setSession({
              user: { id: custom.profile.id, email: custom.email },
              access_token: 'custom-auth-token',
            });
            localStorage.setItem('society_active_id', custom.societyId);
            return;
          }
        } catch { }
      }

      const storedDemo = (localStorage.getItem('society_demo_role') as Role | null) || 'admin';
      if (DEMO_PROFILES[storedDemo]) {
        setProfile(DEMO_PROFILES[storedDemo].profile);
        setSociety(DEMO_PROFILES[storedDemo].society);
        setSession({
          user: { id: DEMO_PROFILES[storedDemo].profile.id, email: `${storedDemo}@smartnest.community` },
          access_token: 'demo-token',
        });
      }
    };

    const handleAuthChange = () => {
      syncCurrentAuth();
    };
    window.addEventListener('society-auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('society-auth-change', handleAuthChange);
    };
  }, [loadProfile]);

  // Always keep JWT token in sync with the active profile
  useEffect(() => {
    if (profile) {
      updateJwt(profile, society, session?.user?.email ?? undefined);
    }
  }, [profile, society, session, updateJwt]);

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
      const cleanEmail = params.adminEmail.toLowerCase().trim();
      const cleanPhoneDigits = params.adminPhone.replace(/\D/g, '').slice(-10);

      // 1. Strict Unique Email Validation
      const existingAccounts = getLocal<RegisteredAccount[]>('accounts', []);
      const existingResidents = getLocal<any[]>('residents', []);
      const existingMembers = getLocal<any[]>('members', []);

      if (
        existingAccounts.some((a) => a.email?.toLowerCase().trim() === cleanEmail) ||
        existingResidents.some((r) => r.email?.toLowerCase().trim() === cleanEmail) ||
        existingMembers.some((m) => m.email?.toLowerCase().trim() === cleanEmail)
      ) {
        return {
          error: 'This email address is already registered. Please sign in or use another email.',
          credentials: { societyCode: '', totalFlats: 0 },
        };
      }

      // 2. Strict Unique Mobile Validation
      if (
        cleanPhoneDigits.length === 10 && (
          existingAccounts.some((a) => a.profile?.phone?.replace(/\D/g, '').slice(-10) === cleanPhoneDigits) ||
          existingResidents.some((r) => r.phone?.replace(/\D/g, '').slice(-10) === cleanPhoneDigits) ||
          existingMembers.some((m) => m.phone?.replace(/\D/g, '').slice(-10) === cleanPhoneDigits)
        )
      ) {
        return {
          error: 'This mobile number is already registered with an existing account.',
          credentials: { societyCode: '', totalFlats: 0 },
        };
      }

      const societyCode = `SN-${Math.floor(10000 + Math.random() * 90000)}`;
      const societyId = `soc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const adminId = `usr-admin-${Date.now().toString(36)}`;

      const newSociety: Society = {
        id: societyId,
        name: params.societyName.trim(),
        address: params.address || `${params.city}, India`,
        code: societyCode,
        created_by: adminId,
        created_at: new Date().toISOString(),
      };

      const newProfile: Profile = {
        id: adminId,
        society_id: societyId,
        full_name: `${params.adminName.trim()} (Admin)`,
        phone: params.adminPhone || '+91 98200 00000',
        role: 'admin',
        avatar_color: 'teal',
        created_at: new Date().toISOString(),
      };

      // Generate Starter Flats across all configured wings (up to 250 flats/wing)
      const generatedFlats: Flat[] = [];
      const cleanWings = params.wings.length > 0 ? params.wings : ['A Wing', 'B Wing'];
      const flatsCount = Math.min(Math.max(Number(params.flatsPerWing) || 8, 1), 250);

      cleanWings.forEach((wing) => {
        const wingLetter = wing.replace(' Wing', '').trim() || 'A';
        for (let floor = 1; floor <= Math.ceil(flatsCount / 2); floor++) {
          for (let f = 1; f <= 2; f++) {
            if (generatedFlats.length >= cleanWings.length * flatsCount) break;
            const flatNum = `${wingLetter}-${floor}0${f}`;
            generatedFlats.push({
              id: `flat-${wingLetter.toLowerCase()}-${floor}0${f}-${Date.now().toString(36)}`,
              society_id: societyId,
              flat_number: flatNum,
              block: `${wingLetter} Wing`,
              floor: `${floor === 1 ? '1st' : floor === 2 ? '2nd' : floor === 3 ? '3rd' : `${floor}th`} Floor`,
              area: '1,250 sq ft',
              status: generatedFlats.length === 0 ? 'occupied' : 'vacant',
              created_at: new Date().toISOString(),
            });
          }
        }
      });

      // Initialize society in local store & persistent registry
      dataStore.initializeSociety(newSociety, newProfile, generatedFlats, {
        name: params.adminName,
        email: cleanEmail,
        phone: params.adminPhone,
      });

      const newAccount: RegisteredAccount = {
        email: cleanEmail,
        password: params.adminPassword,
        societyId,
        societyCode,
        profile: newProfile,
        society: newSociety,
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setLocal('accounts', [newAccount, ...existingAccounts.filter((a) => a.email !== newAccount.email)]);

      const allSocieties = getLocal<Society[]>('societies', []);
      setLocal('societies', [newSociety, ...allSocieties.filter((s) => s.id !== societyId)]);

      localStorage.setItem('society_custom_registered', JSON.stringify(newAccount));
      localStorage.setItem('society_active_id', societyId);
      localStorage.setItem('society_view_mode', 'portal');
      localStorage.removeItem('society_demo_role');

      // Sync with Backend API
      let finalSocietyCode = societyCode;
      let finalTotalFlats = generatedFlats.length;

      try {
        const apiRes = await api.auth.registerSociety(params);
        if (apiRes?.token) {
          localStorage.setItem('society_auth_token', apiRes.token);
          localStorage.setItem('jwt_token', apiRes.token);
        }
        if (apiRes?.credentials?.societyCode) {
          finalSocietyCode = apiRes.credentials.societyCode;
        }
        if (apiRes?.credentials?.totalFlats) {
          finalTotalFlats = apiRes.credentials.totalFlats;
        }
        if (apiRes?.user?.profile) {
          setProfile(apiRes.user.profile);
        }
        if (apiRes?.user?.society) {
          setSociety(apiRes.user.society);
        }
      } catch (err: any) {
        console.warn('Backend register sync note:', err?.message || err);
        // If the backend actively rejected with conflict, surface the error
        if (err?.message && (err.message.includes('already registered') || err.message.includes('409') || err.message.includes('required'))) {
          return {
            error: err.message,
            credentials: { societyCode: '', totalFlats: 0 },
          };
        }
      }

      setProfile(newProfile);
      setSociety(newSociety);
      setSession({
        user: { id: adminId, email: params.adminEmail },
        access_token: localStorage.getItem('jwt_token') || 'custom-auth-token',
      });
      setLoading(false);

      return {
        error: null,
        credentials: {
          societyCode: finalSocietyCode,
          totalFlats: finalTotalFlats,
        },
      };
    } catch {
      return {
        error: 'Failed to create society. Please try again.',
        credentials: { societyCode: '', totalFlats: 0 },
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 0. Try MySQL API Server Login first
    let apiErrorMsg: string | null = null;
    try {
      const loginRes = await api.auth.login({ email: cleanEmail, password: cleanPassword });
      if (loginRes?.token && loginRes.user) {
        const usr = loginRes.user;
        if (usr.profile) setProfile(usr.profile);
        if (usr.society) setSociety(usr.society);
        setSession({
          user: { id: usr.id, email: usr.email },
          access_token: loginRes.token,
        });
        if (usr.society?.id) localStorage.setItem('society_active_id', usr.society.id);
        localStorage.setItem('society_auth_token', loginRes.token);
        localStorage.setItem('jwt_token', loginRes.token);
        localStorage.setItem('society_view_mode', 'portal');
        localStorage.removeItem('society_demo_role');

        const sessionAccount = {
          email: usr.email,
          societyId: usr.society?.id,
          societyCode: usr.society?.code,
          profile: usr.profile,
          society: usr.society,
          role: usr.profile?.role || 'admin',
        };
        localStorage.setItem('society_custom_registered', JSON.stringify(sessionAccount));

        const currentAccounts = getLocal<RegisteredAccount[]>('accounts', []);
        setLocal('accounts', [sessionAccount as any, ...currentAccounts.filter((a) => a.email !== usr.email)]);

        window.dispatchEvent(new Event('society-auth-change'));
        window.dispatchEvent(new Event('society-data-change'));

        setLoading(false);
        return { error: null };
      }
    } catch (err: any) {
      apiErrorMsg = err?.message || null;
    }

    // 1. Check registered accounts in dataStore (society_db_accounts)
    const accounts = getLocal<RegisteredAccount[]>('accounts', []);
    const matchedAccount = accounts.find((a) => a.email && a.email.toLowerCase().trim() === cleanEmail);

    if (matchedAccount) {
      if (matchedAccount.password === password || matchedAccount.password === cleanPassword) {
        setProfile(matchedAccount.profile);
        setSociety(matchedAccount.society);
        setSession({
          user: { id: matchedAccount.profile.id, email: matchedAccount.email },
          access_token: 'custom-auth-token',
        });
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

    // 2. Check society_custom_registered in localStorage
    try {
      const customRaw = localStorage.getItem('society_custom_registered');
      if (customRaw) {
        const custom = JSON.parse(customRaw);
        if (custom.email && custom.email.toLowerCase().trim() === cleanEmail) {
          if (custom.password === password || custom.password === cleanPassword) {
            setProfile(custom.profile);
            setSociety(custom.society);
            setSession({
              user: { id: custom.profile?.id || 'usr-custom', email: custom.email },
              access_token: 'custom-auth-token',
            });
            localStorage.setItem('society_active_id', custom.societyId);
            localStorage.setItem('society_view_mode', 'portal');
            localStorage.removeItem('society_demo_role');
            setLoading(false);
            return { error: null };
          } else {
            return { error: 'Incorrect password. Please verify your credentials.' };
          }
        }
      }
    } catch { }

    // 3. Check staff/resident accounts created in society members
    const members = getLocal<Array<SocietyMember & { password?: string }>>('members', []);
    const matchedMember = members.find((m) => m.email && m.email.toLowerCase().trim() === cleanEmail);
    if (matchedMember) {
      if (matchedMember.password && (matchedMember.password === password || matchedMember.password === cleanPassword)) {
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
          user: { id: memberProfile.id, email: matchedMember.email },
          access_token: 'custom-auth-token',
        });
        localStorage.setItem('society_active_id', targetSocietyId);
        localStorage.setItem('society_custom_registered', JSON.stringify(sessionAccount));
        localStorage.setItem('society_view_mode', 'portal');
        localStorage.removeItem('society_demo_role');
        setLoading(false);
        return { error: null };
      } else if (matchedMember.password) {
        return { error: 'Incorrect password. Please verify your credentials.' };
      }
    }

    // 4. Default demo credentials fallback
    if (cleanEmail === 'admin@smartnest.community' && (password === 'password' || password === 'admin' || password === 'admin123')) {
      switchDemoRole('admin');
      return { error: null };
    }

    return { error: apiErrorMsg || 'Invalid email or password. Please verify your credentials or register your society.' };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const res = await api.auth.register({ email, password, fullName });
      if (res?.token && res?.user) {
        setProfile(res.user.profile);
        setSociety(res.user.society);
        setSession({
          user: { id: res.user.id, email: res.user.email },
          access_token: res.token,
        });
        localStorage.setItem('society_auth_token', res.token);
        localStorage.setItem('jwt_token', res.token);
        return { error: null };
      }
    } catch { }

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

    const existingAccounts = getLocal<RegisteredAccount[]>('accounts', []);
    setLocal('accounts', [newAccount, ...existingAccounts.filter((a) => a.email !== newAccount.email)]);

    setProfile(newProfile);
    setSociety(newSociety);
    setSession({
      user: { id: adminId, email },
      access_token: 'custom-auth-token',
    });
    localStorage.setItem('society_active_id', newSociety.id);
    localStorage.setItem('society_custom_registered', JSON.stringify(newAccount));
    localStorage.setItem('society_view_mode', 'portal');
    localStorage.removeItem('society_demo_role');
    setLoading(false);

    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem('society_demo_role');
    localStorage.removeItem('society_custom_registered');
    localStorage.removeItem('society_active_id');
    localStorage.removeItem('society_auth_token');
    localStorage.removeItem('jwt_token');
    removeJwtToken();
    setSession(null);
    setProfile(null);
    setSociety(null);
    setJwtToken(null);
    setDecodedJwt(null);
  };

  const switchDemoRole = (role: Role) => {
    localStorage.removeItem('society_custom_registered');
    const data = DEMO_PROFILES[role] || DEMO_PROFILES.admin;
    localStorage.setItem('society_demo_role', role);
    localStorage.setItem('society_active_id', DEMO_SOCIETY_ID);
    localStorage.setItem('society_view_mode', 'portal');
    setProfile(data.profile);
    setSociety(data.society);
    updateJwt(data.profile, data.society, `${role}@smartnest.community`);
    setSession({
      user: { id: data.profile.id, email: `${role}@smartnest.community` },
      access_token: 'demo-token',
    });
    setLoading(false);
    setTimeout(() => {
      window.dispatchEvent(new Event('society-auth-change'));
      window.dispatchEvent(new Event('society-data-change'));
    }, 50);
  };

  const createSociety = async (name: string, fullName: string, address?: string) => {
    if (!session?.user) return { error: 'Not authenticated' };
    try {
      await api.auth.registerSociety({
        societyName: name,
        city: address || 'Mumbai',
        adminName: fullName,
        adminEmail: session.user.email || 'admin@smartnest.community',
        adminPhone: '+91 98000 00000',
        adminPassword: 'password',
        wings: ['A Wing', 'B Wing'],
        flatsPerWing: 4,
      });
      await loadProfile(session.user.id);
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const joinSociety = async (societyId: string, role: 'resident' | 'staff') => {
    if (!session?.user) return { error: 'Not authenticated' };
    try {
      await api.auth.joinSociety({ societyId, role });
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
    updateJwt(updatedProfile, society, session?.user?.email ?? undefined);

    const customRaw = localStorage.getItem('society_custom_registered');
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        custom.profile = updatedProfile;
        localStorage.setItem('society_custom_registered', JSON.stringify(custom));
      } catch { }
    }

    try {
      await api.auth.updateProfile(updates);
    } catch { }

    return { error: null };
  };

  const updateSociety = async (updates: { name?: string; address?: string | null }) => {
    if (!society) return { error: 'Not authenticated' };
    const updatedSociety = { ...society, ...updates };
    setSociety(updatedSociety);
    updateJwt(profile, updatedSociety, session?.user?.email ?? undefined);

    const customRaw = localStorage.getItem('society_custom_registered');
    if (customRaw) {
      try {
        const custom = JSON.parse(customRaw);
        custom.society = updatedSociety;
        localStorage.setItem('society_custom_registered', JSON.stringify(custom));
      } catch { }
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
        jwtToken,
        decodedJwt,
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermissions() {
  const { profile } = useAuth();
  const role = profile?.role || 'resident';
  return {
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    isResident: role === 'resident',
    role,
    canManageVisitors: role === 'admin' || role === 'staff',
    canManageFlats: role === 'admin',
    canManageResidents: role === 'admin',
    canManageBills: role === 'admin',
    canManageComplaints: true,
    canUpdateComplaintStatus: role === 'admin' || role === 'staff',
    canDeleteComplaints: role === 'admin',
    canManageFacilities: role === 'admin' || role === 'staff',
    canManageSettings: role === 'admin',
  };
}
