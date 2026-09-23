import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Eye, EyeOff, LogOut, Mail, Shield, User, Edit2, CircleDollarSign, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../config/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/api';
import { getMe, type MeResponse, updateProfile, verifyPassword, updateSubscription } from '../../api/user-service/user-service';
import qrBaseImage from '../../assets/qrbase.jpeg';

type BillingPlan = 'FREE' | 'PRO' | 'MAX';

const billingPlanOrder: BillingPlan[] = ['FREE', 'PRO', 'MAX'];

const billingPlanLabels: Record<BillingPlan, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  MAX: 'Max',
};

const billingPlanDetails: Record<BillingPlan, { title: string; price: string; description: string; features: string[] }> = {
  FREE: {
    title: 'Free',
    price: '$0',
    description: '1 store',
    features: ['1 store', 'Basic analytics', 'Email support'],
  },
  PRO: {
    title: 'Pro',
    price: '$19',
    description: 'Up to 5 stores',
    features: ['Up to 5 stores', 'Advanced analytics', 'Priority support', 'Custom domain'],
  },
  MAX: {
    title: 'Max',
    price: '$49',
    description: 'Unlimited stores & products',
    features: ['Unlimited stores', 'Unlimited products', '24/7 phone support', 'API access', 'Custom integrations'],
  },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('general');
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [showGeneralVerifyModal, setShowGeneralVerifyModal] = useState(false);
  const [showSecurityVerifyModal, setShowSecurityVerifyModal] = useState(false);
  const [securityVerifyPassword, setSecurityVerifyPassword] = useState('');
  const [securityVerifyError, setSecurityVerifyError] = useState('');
  const [securityVerificationCode, setSecurityVerificationCode] = useState('');
  const [generalForm, setGeneralForm] = useState({ name: '', phoneNumber: '' });
  const [securityForm, setSecurityForm] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [showSecurityVerifyPassword, setShowSecurityVerifyPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingModalStep, setBillingModalStep] = useState<'form' | 'plans' | 'summary' | 'qr-loading' | 'qr' | 'submitting'>('form');
  const [billingTargetPlan, setBillingTargetPlan] = useState<BillingPlan | null>(null);
  const [billingForm, setBillingForm] = useState({ name: '', email: '' });
  const [billingError, setBillingError] = useState('');
  const [billingSuccess, setBillingSuccess] = useState('');

  const authEmail = user?.email || '';
  const currentPlan = useMemo(() => {
    const subscription = String(profile?.subscription || '').toUpperCase();
    return billingPlanOrder.includes(subscription as BillingPlan) ? (subscription as BillingPlan) : 'FREE';
  }, [profile?.subscription]);
  const billingPlanOptions = billingPlanOrder.filter((plan) => billingPlanOrder.indexOf(plan) > billingPlanOrder.indexOf(currentPlan));

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const data = await getMe();
        const mergedProfile = {
          ...data,
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phoneNumber: data.phoneNumber || '',
        };

        setProfile(mergedProfile);
        setGeneralForm({
          name: mergedProfile.name || '',
          phoneNumber: mergedProfile.phoneNumber || '',
        });
        setSecurityForm((current) => ({
          ...current,
          email: mergedProfile.email || authEmail,
        }));
      } catch (error) {
        setGeneralError(getApiErrorMessage(error, 'No se pudo cargar el perfil'));
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [authEmail, user?.email, user?.name]);

  useEffect(() => {
    const targetTab = (location.state as { tab?: string } | null)?.tab;
    if (targetTab === 'general' || targetTab === 'security' || targetTab === 'billing') {
      setActiveTab(targetTab);
    }
  }, [location.state]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  };

  const handleVerifyPasswordForEdit = async () => {
    if (!verifyPasswordInput) {
      setVerifyError('Debes ingresar tu contraseña actual');
      return;
    }

    try {
      setGeneralSaving(true);
      setVerifyError('');
      const verifyResponse = await verifyPassword({ email: authEmail, password: verifyPasswordInput });
      setVerificationCode(verifyResponse.code);
      setIsEditingGeneral(true);
      setShowGeneralVerifyModal(false);
      setVerifyPasswordInput('');
    } catch (error) {
      setVerifyError(getApiErrorMessage(error, 'Contraseña incorrecta'));
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleVerifySecurityPassword = async () => {
    if (!securityVerifyPassword) {
      setSecurityVerifyError('Debes ingresar tu contraseña actual');
      return;
    }

    try {
      setSecuritySaving(true);
      setSecurityVerifyError('');
      const verifyResponse = await verifyPassword({ email: authEmail, password: securityVerifyPassword });
      setSecurityVerificationCode(verifyResponse.code);
      setIsEditingSecurity(true);
      setShowSecurityVerifyModal(false);
      setSecurityVerifyPassword('');
    } catch (error) {
      setSecurityVerifyError(getApiErrorMessage(error, 'Contraseña incorrecta'));
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!securityVerificationCode) {
      setSecurityError('No tienes permisos para editar (falta código)');
      return;
    }

    const hasEmailChange = securityForm.email.trim() && securityForm.email.trim() !== (profile?.email || user?.email || '');
    const hasPasswordChange = Boolean(securityForm.newPassword || securityForm.confirmPassword);

    if (!hasEmailChange && !hasPasswordChange) {
      setSecurityError('No hay cambios para guardar');
      return;
    }

    if (hasPasswordChange) {
      if (!securityForm.newPassword || securityForm.newPassword.length < 8) {
        setSecurityError('La nueva contraseña debe tener al menos 8 caracteres');
        return;
      }

      if (securityForm.newPassword !== securityForm.confirmPassword) {
        setSecurityError('Las contraseñas no coinciden');
        return;
      }
    }

    try {
      setSecuritySaving(true);
      await updateProfile({
        email: hasEmailChange ? securityForm.email : undefined,
        password: hasPasswordChange ? securityForm.newPassword : undefined,
        code: securityVerificationCode,
      });

      setProfile((current) => ({
        ...current,
        email: hasEmailChange ? securityForm.email : current?.email,
      }));

      setSecuritySuccess('Cambios de seguridad actualizados correctamente');
      setIsEditingSecurity(false);
      setSecurityVerificationCode('');
      setSecurityForm((current) => ({
        ...current,
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      setSecurityError(getApiErrorMessage(error, 'No se pudo actualizar la seguridad'));
    } finally {
      setSecuritySaving(false);
    }
  };

  const submitGeneralUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verificationCode) {
      setGeneralError('No tienes permisos para editar (falta código)');
      return;
    }

    try {
      setGeneralSaving(true);
      setGeneralError('');
      await updateProfile({
        name: generalForm.name,
        phoneNumber: generalForm.phoneNumber || undefined,
        code: verificationCode,
      });

      setProfile((current) => ({
        ...current,
        name: generalForm.name,
        phoneNumber: generalForm.phoneNumber,
      }));
      setGeneralSuccess('Perfil actualizado correctamente');
      setIsEditingGeneral(false);
      setVerificationCode('');
    } catch (error) {
      setGeneralError(getApiErrorMessage(error, 'No se pudo actualizar el perfil'));
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingGeneral(false);
    setVerificationCode('');
    setGeneralError('');
    setGeneralForm({
      name: profile?.name || user?.name || '',
      phoneNumber: profile?.phoneNumber || '',
    });
  };

  const resetBillingModal = () => {
    setShowBillingModal(false);
    setBillingModalStep('form');
    setBillingError('');
    setBillingSuccess('');
    setBillingTargetPlan(null);
    setBillingForm({
      name: profile?.name || user?.name || '',
      email: profile?.email || user?.email || '',
    });
  };

  const startBillingUpgrade = () => {
    if (billingPlanOptions.length === 0) {
      setBillingError('Ya tienes el plan más alto disponible');
      return;
    }

    setBillingError('');
    setBillingSuccess('');
    setBillingForm({
      name: profile?.name || user?.name || '',
      email: profile?.email || user?.email || '',
    });
    setShowBillingModal(true);
    setBillingModalStep('form');
  };

  useEffect(() => {
    if (!showBillingModal || billingModalStep !== 'qr-loading') {
      return;
    }

    const timer = window.setTimeout(() => {
      setBillingModalStep('qr');
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [billingModalStep, showBillingModal]);

  const handleBillingContinue = () => {
    if (!billingForm.name.trim() || !billingForm.email.trim()) {
      setBillingError('Completa nombre y correo para continuar');
      return;
    }

    setBillingError('');
    setBillingModalStep('plans');
  };

  const handleBillingSelectPlan = (plan: BillingPlan) => {
    setBillingTargetPlan(plan);
    setBillingError('');
  };

  const handleBillingContinueToSummary = () => {
    if (!billingTargetPlan || billingTargetPlan === currentPlan) {
      setBillingError('Selecciona un plan superior');
      return;
    }

    setBillingError('');
    setBillingModalStep('summary');
  };

  const handleBillingGenerateQR = async () => {
    if (!billingTargetPlan) {
      setBillingError('Selecciona un plan');
      return;
    }

    setBillingError('');
    setBillingModalStep('qr-loading');
  };

  const handleBillingCloseAndApply = async () => {
    if (!billingTargetPlan) {
      setBillingError('Algo salió mal');
      return;
    }

    setBillingModalStep('submitting');
    try {
      await updateSubscription(billingTargetPlan);
      setBillingSuccess(`Plan actualizado a ${billingPlanLabels[billingTargetPlan]}`);
      setProfile((current) => ({
        ...current!,
        subscription: billingTargetPlan,
      }));
      // Reload page after 1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.location.reload();
    } catch (error) {
      setBillingError(getApiErrorMessage(error));
      setBillingModalStep('qr');
    }
  };

  const closeBillingModalWithoutRequest = () => {
    resetBillingModal();
  };

  if (loadingProfile) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading profile...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage your account settings and preferences.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('general')} className="btn" style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'general' ? 'var(--primary)' : 'transparent', color: activeTab === 'general' ? '#000' : 'var(--text-secondary)', fontWeight: activeTab === 'general' ? 600 : 400 }}>
            <User size={18} /> General
          </button>
          <button onClick={() => setActiveTab('security')} className="btn" style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'security' ? 'var(--primary)' : 'transparent', color: activeTab === 'security' ? '#000' : 'var(--text-secondary)' }}>
            <Shield size={18} /> Security
          </button>
          <button onClick={() => setActiveTab('billing')} className="btn" style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'billing' ? 'var(--primary)' : 'transparent', color: activeTab === 'billing' ? '#000' : 'var(--text-secondary)' }}>
            <CircleDollarSign size={18} /> Subscription
          </button>
          <div style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)' }}></div>
          <button onClick={handleLogout} className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--danger)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {activeTab === 'general' && (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Personal Information</h3>
                  {!isEditingGeneral && (
                    <button className="btn btn-outline" onClick={() => { setVerifyError(''); setShowGeneralVerifyModal(true); }} style={{ padding: '0.5rem', borderRadius: '50%' }} title="Edit Profile">
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>

                {generalError && (
                  <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} />
                    {generalError}
                  </div>
                )}

                {generalSuccess && (
                  <div style={{ backgroundColor: 'rgba(82, 196, 26, 0.12)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {generalSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, rgba(255,255,255,0.85) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontSize: '2rem',
                    fontWeight: 800,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
                  }}>
                    {getInitials(profile?.name || user?.name || 'U')}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{profile?.name || user?.name || 'User'}</p>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{profile?.email || user?.email || ''}</p>
                  </div>
                </div>

                <form onSubmit={submitGeneralUpdate} className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label>Name</label>
                    <input type="text" className="input-field" disabled={!isEditingGeneral} value={generalForm.name} onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label>Phone Number</label>
                    <input type="tel" className="input-field" disabled={!isEditingGeneral} value={generalForm.phoneNumber} onChange={(e) => setGeneralForm({ ...generalForm, phoneNumber: e.target.value })} />
                  </div>

                  {isEditingGeneral && (
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={generalSaving}>Save Changes</button>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Security Settings</h3>

              {securityError && (
                <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} />
                  {securityError}
                </div>
              )}

              {securitySuccess && (
                <div style={{ backgroundColor: 'rgba(82, 196, 26, 0.12)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {securitySuccess}
                </div>
              )}

              <form onSubmit={handleSaveSecurity} className="grid" style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email Address</p>
                      {!isEditingSecurity ? (
                        <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>{securityForm.email || authEmail}</p>
                      ) : (
                        <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                          <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input type="email" className="input-field" value={securityForm.email} style={{ paddingLeft: '2.5rem' }} onChange={(e) => setSecurityForm({ ...securityForm, email: e.target.value })} />
                        </div>
                      )}
                    </div>
                    {!isEditingSecurity ? (
                      <button type="button" className="btn btn-outline" onClick={() => { setSecurityError(''); setShowSecurityVerifyModal(true); }} style={{ padding: '0.5rem', borderRadius: '50%' }} title="Edit Email">
                        <Edit2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Change Password</p>
                      <p style={{ margin: '0.35rem 0 0', fontWeight: 600, color: 'var(--text-secondary)' }}>••••••••</p>
                    </div>
                    {!isEditingSecurity ? (
                      <button type="button" className="btn btn-outline" onClick={() => { setSecurityError(''); setShowSecurityVerifyModal(true); }} style={{ padding: '0.5rem', borderRadius: '50%' }} title="Update Password">
                        <Edit2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>

                {isEditingSecurity ? (
                  <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="input-group">
                      <label>New Password</label>
                      <input type="password" className="input-field" value={securityForm.newPassword} onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} placeholder="••••••••" />
                    </div>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Confirm New Password</label>
                      <input type="password" className="input-field" value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} placeholder="••••••••" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setIsEditingSecurity(false);
                          setSecurityVerificationCode('');
                          setSecurityError('');
                          setSecurityForm((current) => ({
                            ...current,
                            email: profile?.email || user?.email || '',
                            newPassword: '',
                            confirmPassword: '',
                          }));
                        }}
                      >
                        Cancel
                      </button>
                      <button className="btn btn-primary" type="submit" disabled={securitySaving}>Save Changes</button>
                    </div>
                  </div>
                ) : null}
              </form>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}> Subscription Plan</h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.02)' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current plan</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.35rem' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{billingPlanLabels[currentPlan]}</h4>
                      <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {currentPlan === 'FREE' && 'Only One Shop and 100 products limit'}
                        {currentPlan === 'PRO' && 'Five Shops and 500 products limit'}
                        {currentPlan === 'MAX' && 'Illimitless Shops and products, plus priority support'}
                      </div>
                    </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                  <button className="btn btn-outline" onClick={startBillingUpgrade} type="button" disabled={billingPlanOptions.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Change Plan <ArrowRight size={16} />
                  </button>
                  {billingSuccess && (
                    <div style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} />
                      {billingSuccess}
                    </div>
                  )}
                </div>
                  </div>
                </div>


              </div>
            </div>
          )}

        </div>
      </div>

      {showGeneralVerifyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
            <h3 style={{ marginTop: 0 }}>Habilitar Edición</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Ingresa tu contraseña actual para poder editar tu perfil.</p>
            
            {verifyError && (
              <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                {verifyError}
              </div>
            )}

            <div className="input-group">
              <div style={{ position: 'relative' }}>
                <input type={showVerifyPassword ? 'text' : 'password'} className="input-field" value={verifyPasswordInput} onChange={(e) => setVerifyPasswordInput(e.target.value)} placeholder="Contraseña" />
                <button type="button" onClick={() => setShowVerifyPassword(!showVerifyPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                  {showVerifyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => { setShowGeneralVerifyModal(false); setVerifyPasswordInput(''); setVerifyError(''); }} type="button">Cancel</button>
              <button className="btn btn-primary" onClick={handleVerifyPasswordForEdit} disabled={generalSaving}>Verify & Edit</button>
            </div>
          </div>
        </div>
      )}

      {showSecurityVerifyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
            <h3 style={{ marginTop: 0 }}>Verificar Contraseña</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Ingresa tu contraseña actual para poder editar tu seguridad.</p>
            
            {securityVerifyError && (
              <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                {securityVerifyError}
              </div>
            )}

            <div className="input-group">
              <div style={{ position: 'relative' }}>
                <input type={showSecurityVerifyPassword ? 'text' : 'password'} className="input-field" value={securityVerifyPassword} onChange={(e) => setSecurityVerifyPassword(e.target.value)} placeholder="Contraseña" />
                <button type="button" onClick={() => setShowSecurityVerifyPassword(!showSecurityVerifyPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                  {showSecurityVerifyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => { setShowSecurityVerifyModal(false); setSecurityVerifyPassword(''); setSecurityVerifyError(''); }} type="button">Cancel</button>
              <button className="btn btn-primary" onClick={handleVerifySecurityPassword} disabled={securitySaving}>Verify & Edit</button>
            </div>
          </div>
        </div>
      )}

      {showBillingModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 40%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Plan upgrade</p>
                  <h3 style={{ margin: '0.25rem 0 0' }}>Change plan</h3>
                  <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Follow 4 simple steps to upgrade your subscription</p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeBillingModalWithoutRequest}
                  disabled={billingModalStep === 'submitting' || billingModalStep === 'qr-loading'}
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  Close
                </button>
              </div>



              {billingError && (
                <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} />
                  {billingError}
                </div>
              )}

              {/* Form Step */}
              {billingModalStep === 'form' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Provide your billing information to proceed with the upgrade.</p>
                  <div className="input-group">
                    <label>Full Name</label>
                    <input className="input-field" type="text" value={billingForm.name} onChange={(e) => setBillingForm({ ...billingForm, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input className="input-field" type="email" value={billingForm.email} onChange={(e) => setBillingForm({ ...billingForm, email: e.target.value })} placeholder="john@example.com" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={closeBillingModalWithoutRequest}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={handleBillingContinue} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      Next <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Plans Selection Step */}
              {billingModalStep === 'plans' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose which plan you'd like to upgrade to:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    {billingPlanOptions.map((plan) => {
                      const isSelected = billingTargetPlan === plan;
                      const planInfo = billingPlanDetails[plan];
                      return (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => handleBillingSelectPlan(plan)}
                          style={{
                            textAlign: 'left',
                            borderRadius: '1rem',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                            background: isSelected ? 'rgba(154,205,50,0.12)' : 'rgba(255,255,255,0.03)',
                            padding: '1rem',
                            color: 'inherit',
                            cursor: 'pointer',
                            display: 'grid',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                              {planInfo.title}
                            </div>
                            {isSelected && <CheckCircle2 size={18} color="var(--primary)" />}
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{planInfo.price}</div>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{planInfo.description}</p>
                          <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'grid', gap: '0.3rem' }}>
                            {planInfo.features.slice(0, 2).map((feature: string) => (
                              <li key={feature}>{feature}</li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setBillingModalStep('form')}>Back</button>
                    <button type="button" className="btn btn-primary" onClick={handleBillingContinueToSummary} disabled={!billingTargetPlan || billingTargetPlan === currentPlan} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      Next <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Summary Step */}
              {billingModalStep === 'summary' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan Comparison</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current</p>
                        <h4 style={{ margin: '0.3rem 0 0' }}>{billingPlanLabels[currentPlan]}</h4>
                      </div>
                      <div style={{ padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--primary)', background: 'rgba(154,205,50,0.08)' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary)' }}>Upgrading to</p>
                        <h4 style={{ margin: '0.3rem 0 0', color: 'var(--primary)' }}>{billingPlanLabels[billingTargetPlan!]}</h4>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Details</p>
                    <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
                        <span style={{ fontWeight: 600 }}>{billingForm.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                        <span style={{ fontWeight: 600 }}>{billingForm.email}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setBillingModalStep('plans')}>Back</button>
                    <button type="button" className="btn btn-primary" onClick={handleBillingGenerateQR} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      Continue to Payment <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* QR Loading Step */}
              {billingModalStep === 'qr-loading' && (
                <div style={{ display: 'grid', placeItems: 'center', gap: '1rem', minHeight: '280px', textAlign: 'center' }}>
                  <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                  <div>
                    <h4 style={{ margin: 0 }}>Generating Payment QR</h4>
                    <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)' }}>Preparing your payment details...</p>
                  </div>
                </div>
              )}

              {/* QR Display Step */}
              {billingModalStep === 'qr' && (
                <div style={{ display: 'grid', gap: '1rem', justifyItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ margin: 0 }}>Scan to Confirm</h4>
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>Scan this QR code to confirm your upgrade to {billingTargetPlan && billingPlanLabels[billingTargetPlan]}</p>
                  </div>
                  <div style={{ width: '100%', maxWidth: '280px', padding: '1.25rem', borderRadius: '1.25rem', background: '#fff', boxShadow: '0 18px 48px rgba(0,0,0,0.25)' }}>
                    <img src={qrBaseImage} alt="Payment QR" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '0.75rem' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setBillingModalStep('summary')}>Back</button>
                    <button type="button" className="btn btn-primary" onClick={handleBillingCloseAndApply} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      Confirm & Apply <CheckCircle2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Submitting Step */}
              {billingModalStep === 'submitting' && (
                <div style={{ display: 'grid', placeItems: 'center', gap: '1rem', minHeight: '280px', textAlign: 'center' }}>
                  <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                  <div>
                    <h4 style={{ margin: 0 }}>Applying Your Upgrade</h4>
                    <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)' }}>Processing your subscription update...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
