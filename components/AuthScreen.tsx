
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { IconSparkles, IconAlert, IconCheck, IconEye, IconEyeOff, IconGoogle } from './Icons';

const AuthScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState(''); // Estado para a nova senha no reset
    const [otp, setOtp] = useState('');
    
    // UI State for password visibility & checkbox
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // Modes: 'login' | 'signup' | 'recovery'
    const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');
    const [showOtpInput, setShowOtpInput] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao conectar com Google.');
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Conta criada! Verifique seu e-mail para confirmar.');
            } else if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else if (mode === 'recovery') {
                if (!showOtpInput) {
                    // Passo 1: Enviar OTP para o email (Login via código)
                    const { error } = await supabase.auth.signInWithOtp({ 
                        email,
                        options: {
                            shouldCreateUser: false, 
                            emailRedirectTo: window.location.origin 
                        }
                    });
                    
                    if (error) throw error;
                    
                    setMessage(`Código enviado para ${email}.`);
                    setShowOtpInput(true);
                } else {
                    // Passo 2: Verificar OTP e Redefinir Senha
                    const { data, error: verifyError } = await supabase.auth.verifyOtp({
                        email,
                        token: otp,
                        type: 'email',
                    });

                    if (verifyError) throw verifyError;

                    if (data.session) {
                        const { error: updateError } = await supabase.auth.updateUser({ 
                            password: newPassword 
                        });
                        
                        if (updateError) throw updateError;
                        
                        setMessage('Senha redefinida com sucesso! Entrando...');
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocorreu um erro. Verifique seus dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 md:p-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <IconSparkles className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-center text-gray-900 mb-2">FitLM</h2>
                    <p className="text-center text-gray-500 mb-8 font-medium">Sua inteligência atlética pessoal.</p>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                            <IconAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                            <IconCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700 font-medium">{message}</p>
                        </div>
                    )}

                    {/* Google Login Section - HIDDEN TEMPORARILY UNTIL CONFIGURED */}
                    {false && mode !== 'recovery' && (
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm"
                            >
                                <IconGoogle className="w-5 h-5" />
                                <span>Continuar com Google</span>
                            </button>
                            
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-400 font-medium">ou use seu e-mail</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        {/* Campo de E-mail (Sempre visível) */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">E-mail</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-gray-900"
                                placeholder="seu@email.com"
                                required
                                disabled={showOtpInput && mode === 'recovery'} 
                            />
                        </div>
                        
                        {/* Campo de Senha (Login/Signup) */}
                        {mode !== 'recovery' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Senha</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-gray-900 pr-12"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* "Manter conectado" Checkbox (Login only) */}
                        {mode === 'login' && (
                            <div className="flex items-center gap-2 px-1">
                                <input 
                                    type="checkbox" 
                                    id="remember" 
                                    checked={rememberMe} 
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="remember" className="text-sm text-gray-500 font-medium select-none cursor-pointer">
                                    Manter conectado
                                </label>
                            </div>
                        )}

                        {/* Campos de Recuperação (Etapa 2: OTP + Nova Senha) */}
                        {mode === 'recovery' && showOtpInput && (
                             <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 font-medium">
                                    <strong className="block mb-1">Atenção:</strong>
                                    Procure no e-mail o <strong>código numérico de 6 dígitos</strong>. Se o link não funcionar, digite o código abaixo manualmente.
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Código OTP (6 dígitos)</label>
                                    <input 
                                        type="text" 
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-gray-900 tracking-widest text-center text-lg"
                                        placeholder="000000"
                                        required
                                        maxLength={6}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nova Senha</label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-gray-900 pr-12"
                                            placeholder="Nova senha segura"
                                            required
                                            minLength={6}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 p-1"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                mode === 'login' ? 'ENTRAR' : 
                                mode === 'signup' ? 'CRIAR CONTA' :
                                showOtpInput ? 'REDEFINIR SENHA' : 'ENVIAR CÓDIGO'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-3">
                        {mode === 'login' && (
                             <button 
                                onClick={() => { setMode('recovery'); setError(''); setMessage(''); }}
                                className="block w-full text-xs text-gray-500 hover:text-gray-800 font-semibold mb-2 underline decoration-gray-300 underline-offset-4"
                            >
                                Esqueci minha senha
                            </button>
                        )}
                        
                        {(mode === 'recovery' || mode === 'signup') && (
                             <button 
                                onClick={() => { 
                                    setMode('login'); 
                                    setError(''); 
                                    setMessage('');
                                    setShowOtpInput(false);
                                    setOtp('');
                                    setNewPassword('');
                                }}
                                className="block w-full text-xs text-gray-500 hover:text-gray-800 font-semibold mb-2"
                            >
                                ← Voltar para Login
                            </button>
                        )}

                        {mode !== 'recovery' && (
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <span className="text-gray-500">
                                    {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
                                </span>
                                <button 
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'signup' : 'login');
                                        setError('');
                                        setMessage('');
                                    }}
                                    className="text-blue-600 font-bold hover:underline"
                                >
                                    {mode === 'login' ? 'Criar agora' : 'Fazer login'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
