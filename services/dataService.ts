
import { supabase } from '../lib/supabase';
import { Project, Source, SourceType, MetricPoint, ProtocolItem, UserProfile, ChatMessage, UsageLog, AppVersion } from '../types';
import { embedText } from './geminiService';

// Tipos auxiliares para Banco de Dados
interface DBProject {
    id: string;
    user_id: string;
    name: string;
    objective: string;
    current_protocol: any;
    training_notes?: string;
    created_at: string;
}

interface DBMetric {
    id: string;
    project_id: string;
    category: string;
    date: string;
    value: number;
    unit: string;
    label: string;
}

interface DBMessage {
    id: string;
    project_id: string;
    role: 'user' | 'model';
    text: string;
    is_bookmarked?: boolean;
    created_at: string;
}

interface DBSource {
    id: string;
    project_id: string;
    title: string;
    type: string;
    specific_type?: string; 
    date: string;
    content: string;
    summary?: string;
    selected: boolean;
    file_path: string | null;
    created_at?: string;
}

const calculateAge = (dateString: string) => {
    if (!dateString) return 30;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const calculateMetabolicStats = (
    weight: number, 
    heightCm: number, 
    birthDate: string, 
    gender: string, 
    waist: number, 
    hips: number
) => {
    const stats = {
        bmi: '',
        bmr: '',
        whr: '',
        bmiClassification: '',
        whrRisk: ''
    };

    if (!weight || !heightCm) return stats;

    const heightM = heightCm / 100;
    const age = calculateAge(birthDate);

    const bmi = weight / (heightM * heightM);
    stats.bmi = bmi.toFixed(1);
    if (bmi < 18.5) stats.bmiClassification = 'Abaixo do Peso';
    else if (bmi < 24.9) stats.bmiClassification = 'Eutrófico (Normal)';
    else if (bmi < 29.9) stats.bmiClassification = 'Sobrepeso';
    else stats.bmiClassification = 'Obesidade';

    let bmr = (10 * weight) + (6.25 * heightCm) - (5 * age);
    if (gender === 'Masculino') {
        bmr += 5;
    } else {
        bmr -= 161;
    }
    stats.bmr = Math.round(bmr).toString();

    if (waist > 0 && hips > 0) {
        const whr = waist / hips;
        stats.whr = whr.toFixed(2);
        if (gender === 'Masculino') {
            stats.whrRisk = whr > 0.90 ? 'Alto Risco Cardíaco' : 'Risco Baixo';
        } else {
            stats.whrRisk = whr > 0.85 ? 'Alto Risco Cardíaco' : 'Risco Baixo';
        }
    }

    return stats;
};

export const dataService = {
    async getOrCreateProject(userId: string): Promise<Project | null> {
        try {
            const { data: projects, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', userId)
                .limit(1);

            if (error) {
                console.error('Error fetching project:', error);
                // Se falhar o fetch do projeto, não adianta continuar
                return null;
            }

            let currentProject: DBProject;

            if (projects && projects.length > 0) {
                currentProject = projects[0];
            } else {
                const { data: newProject, error: createError } = await supabase
                    .from('projects')
                    .insert({
                        user_id: userId,
                        name: 'Meu Projeto Fitness',
                        objective: 'Bulking',
                        current_protocol: []
                    })
                    .select()
                    .single();

                if (createError || !newProject) {
                    console.error('Error creating project:', createError);
                    return null;
                }
                currentProject = newProject;
            }

            const project = await this.hydrateProject(currentProject);
            
            // Tenta carregar perfil, mas não bloqueia se falhar
            try {
                const profile = await this.getUserProfile(userId);
                if (profile) {
                    project.userProfile = profile;
                }
            } catch (e) {
                console.warn("Failed to load profile, using default structure", e);
            }

            return project;
        } catch (criticalError) {
            console.error("Critical error in getOrCreateProject:", criticalError);
            return null;
        }
    },

    async hydrateProject(dbProject: DBProject): Promise<Project> {
        const sources: Source[] = [];
        const groupedMetrics: Record<string, MetricPoint[]> = {};

        // 1. Safe Load Sources
        try {
            // Select básico para evitar erro se 'specific_type' não existir ainda
            const { data: sourcesData } = await supabase
                .from('sources')
                .select('*')
                .eq('project_id', dbProject.id);

            if (sourcesData) {
                for (const s of (sourcesData as any[])) {
                    let fileUrl = undefined;
                    if (s.file_path) {
                        const { data } = await supabase.storage
                            .from('project_files')
                            .createSignedUrl(s.file_path, 3600);
                        if (data) fileUrl = data.signedUrl;
                    }

                    sources.push({
                        id: s.id,
                        title: s.title,
                        type: s.type as SourceType,
                        date: s.date,
                        content: s.content,
                        summary: s.summary || undefined,
                        selected: s.selected,
                        filePath: s.file_path || undefined,
                        fileUrl: fileUrl,
                        specificType: s.specific_type || undefined, // Safe access
                        createdAt: s.created_at
                    });
                }
            }
        } catch (e) {
            console.error("Error hydrating sources:", e);
        }

        // 2. Safe Load Metrics
        try {
            const { data: metrics } = await supabase
                .from('metrics')
                .select('*')
                .eq('project_id', dbProject.id)
                .order('created_at', { ascending: true });

            if (metrics) {
                metrics.forEach((m: DBMetric) => {
                    if (!groupedMetrics[m.category]) {
                        groupedMetrics[m.category] = [];
                    }
                    groupedMetrics[m.category].push({
                        date: m.date,
                        value: m.value,
                        unit: m.unit,
                        label: m.label
                    });
                });
            }
        } catch (e) {
            console.error("Error hydrating metrics:", e);
        }

        return {
            id: dbProject.id,
            name: dbProject.name,
            objective: dbProject.objective as any,
            currentProtocol: dbProject.current_protocol || [],
            trainingNotes: dbProject.training_notes || '', 
            sources: sources,
            metrics: groupedMetrics
        };
    },

    async getUserProfile(userId: string): Promise<UserProfile | undefined> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error || !data) return undefined;

            let avatarUrl = undefined;
            if (data.avatar_url) {
                const { data: signedData } = await supabase.storage
                    .from('project_files')
                    .createSignedUrl(data.avatar_url, 3600);
                if (signedData) avatarUrl = signedData.signedUrl;
            }

            const measurements = data.measurements || { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' };
            const calculatedStats = calculateMetabolicStats(
                data.weight || 0,
                data.height || 0,
                data.birth_date || '',
                data.gender || 'Masculino',
                parseFloat(measurements.waist || '0'),
                parseFloat(measurements.hips || '0')
            );

            return {
                name: data.name || '',
                avatarUrl: avatarUrl,
                birthDate: data.birth_date || '',
                gender: data.gender || 'Masculino',
                height: data.height?.toString() || '',
                weight: data.weight?.toString() || '',
                bodyFat: data.body_fat?.toString() || '',
                comorbidities: data.comorbidities || '',
                medications: data.medications || '',
                measurements: measurements,
                calculatedStats: calculatedStats,
                termsAcceptedAt: data.terms_accepted_at,
                hideStartupDisclaimer: data.hide_startup_disclaimer,
                theme: data.theme || 'light',
                rememberEmail: data.remember_email || false, // Load preference
                subscriptionStatus: data.subscription_status || 'free'
            };
        } catch (e) {
            console.error("Profile load error", e);
            return undefined;
        }
    },

    async saveUserProfile(userId: string, profile: UserProfile) {
        const dbProfile = {
            user_id: userId,
            name: profile.name,
            birth_date: profile.birthDate || null, 
            gender: profile.gender,
            height: parseFloat(profile.height) || null,
            weight: parseFloat(profile.weight) || null,
            body_fat: parseFloat(profile.bodyFat || '') || null,
            comorbidities: profile.comorbidities,
            medications: profile.medications,
            measurements: profile.measurements,
            theme: profile.theme,
            remember_email: profile.rememberEmail, // Save preference
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_profiles')
            .upsert(dbProfile, { onConflict: 'user_id' });

        if (error) console.error("Error saving profile:", error);
        return error;
    },

    // New helper to just update the preference quickly
    async updateRememberEmailPreference(userId: string, remember: boolean) {
        const { error } = await supabase
            .from('user_profiles')
            .update({ remember_email: remember })
            .eq('user_id', userId);
        return error;
    },

    async acceptLegalTerms(userId: string) {
        const { error } = await supabase
            .from('user_profiles')
            .update({ 
                terms_accepted_at: new Date().toISOString(),
                terms_version: '1.0'
            })
            .eq('user_id', userId);
        return error;
    },

    async toggleStartupDisclaimer(userId: string, hide: boolean) {
        const { error } = await supabase
            .from('user_profiles')
            .update({ hide_startup_disclaimer: hide })
            .eq('user_id', userId);
        return error;
    },
    
    async uploadAvatar(file: File, userId: string): Promise<string | null> {
        // Sanitize file name for avatar too
        const fileExt = file.name.split('.').pop();
        const safeFileName = `avatar_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/avatars/${safeFileName}`;

        const { error: uploadError } = await supabase.storage
            .from('project_files')
            .upload(filePath, file, { upsert: true });

        if (uploadError) return null;

        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ avatar_url: filePath })
            .eq('user_id', userId);

        if (updateError) return null;

        const { data } = await supabase.storage
            .from('project_files')
            .createSignedUrl(filePath, 3600);

        return data?.signedUrl || null;
    },
    
    async deleteAvatar(userId: string) {
        await supabase
            .from('user_profiles')
            .update({ avatar_url: null })
            .eq('user_id', userId);
    },

    async uploadFileToStorage(file: File, userId: string, projectId: string): Promise<string | null> {
        // SANITIZAÇÃO CRÍTICA DO NOME DO ARQUIVO
        // Remove acentos, espaços e caracteres especiais que quebram o Storage
        const cleanName = file.name
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[^a-zA-Z0-9.-]/g, "_"); // Troca espaços e símbolos por _

        const fileName = `${Date.now()}_${cleanName}`;
        const filePath = `${userId}/${projectId}/${fileName}`;

        console.log("Tentando upload para:", filePath);

        const { error, data } = await supabase.storage
            .from('project_files')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('CRITICAL STORAGE ERROR:', error);
            // Tenta retornar null para avisar o front que falhou
            return null;
        }
        
        console.log("Upload sucesso:", data);
        return filePath;
    },

    async addSource(projectId: string, source: Source) {
        const { error } = await supabase
            .from('sources')
            .insert({
                project_id: projectId,
                title: source.title,
                type: source.type,
                specific_type: source.specificType,
                date: source.date,
                content: source.content,
                selected: source.selected,
                file_path: source.filePath,
                summary: source.summary
            });
        
        if (error) console.error('Error adding source:', error);
        return error;
    },

    async deleteSource(sourceId: string, filePath?: string) {
        // 1. Tenta deletar o arquivo do storage se existir
        if (filePath) {
            try {
                const { error: storageError } = await supabase.storage
                    .from('project_files')
                    .remove([filePath]);
                
                if (storageError) console.warn("Storage deletion warning:", storageError);
            } catch (e) {
                console.warn("Storage deletion error", e);
            }
        }

        // 2. Deleta o registro do banco
        const { error } = await supabase
            .from('sources')
            .delete()
            .eq('id', sourceId);
        
        if (error) console.error('Error deleting source:', error);
        return error;
    },

    async updateSourceSummary(sourceId: string, summary: string) {
        const { error } = await supabase
            .from('sources')
            .update({ summary: summary })
            .eq('id', sourceId);
        
        if (error) console.error('Error updating summary:', error);
        return error;
    },

    async toggleSourceSelection(sourceId: string, isSelected: boolean) {
         const { error } = await supabase
            .from('sources')
            .update({ selected: isSelected })
            .eq('id', sourceId);
        
        if (error) console.error('Error toggling source:', error);
    },

    async addMetric(projectId: string, category: string, point: MetricPoint) {
        const { error } = await supabase
            .from('metrics')
            .insert({
                project_id: projectId,
                category: category,
                date: point.date,
                value: point.value,
                unit: point.unit,
                label: point.label
            });
        
        if (error) console.error('Error adding metric:', error);
    },

    async updateProjectSettings(projectId: string, objective: string, protocol: ProtocolItem[], trainingNotes?: string) {
        const updateData: any = { 
            current_protocol: protocol,
            objective: objective
        };

        if (trainingNotes !== undefined) {
            updateData.training_notes = trainingNotes;
        }

        const { error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', projectId);
            
        if (error) console.error('Error updating project settings:', error);
    },

    async getMessages(projectId: string): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }

        return (data as DBMessage[]).map(msg => ({
            id: msg.id,
            role: msg.role,
            text: msg.text,
            timestamp: new Date(msg.created_at).getTime(),
            isBookmarked: msg.is_bookmarked
        }));
    },

    async addMessage(projectId: string, message: ChatMessage) {
        const created_at = new Date(message.timestamp).toISOString();
        const embedding = await embedText(message.text);

        const { error } = await supabase
            .from('messages')
            .insert({
                project_id: projectId,
                role: message.role,
                text: message.text,
                created_at: created_at,
                embedding: embedding,
                is_bookmarked: false
            });

        if (error) console.error('Error adding message:', error);
    },

    async toggleMessageBookmark(messageId: string, isBookmarked: boolean) {
        const { error } = await supabase
            .from('messages')
            .update({ is_bookmarked: isBookmarked })
            .eq('id', messageId);
        
        if (error) console.error('Error toggling bookmark:', error);
    },

    async searchMessagesSemantic(projectId: string, query: string): Promise<ChatMessage[]> {
        const embedding = await embedText(query);
        if (!embedding) return [];

        const { data, error } = await supabase.rpc('match_messages', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 10,
            p_id: projectId
        });

        if (error) {
            console.error("Semantic Search Error:", error);
            return [];
        }

        return data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            text: msg.text,
            timestamp: new Date(msg.created_at).getTime(),
            isBookmarked: msg.is_bookmarked
        }));
    },

    // --- BILLING FIX (RECOVERY & LEGACY SUPPORT) ---
    async logUsage(userId: string, projectId: string | undefined, actionType: string, inputTokens: number, outputTokens: number): Promise<number> {
        const PRICE_PER_1M_INPUT = 0.60;
        const PRICE_PER_1M_OUTPUT = 2.40;

        const costInput = (inputTokens / 1000000) * PRICE_PER_1M_INPUT;
        const costOutput = (outputTokens / 1000000) * PRICE_PER_1M_OUTPUT;
        const totalCost = costInput + costOutput;

        // Try to insert into cost_brl.
        // We do NOT use 'cost' column anymore to avoid SQL errors.
        const { error } = await supabase
            .from('usage_logs')
            .insert({
                user_id: userId,
                project_id: projectId,
                action_type: actionType,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                cost_brl: totalCost
            });

        if (error) console.error('Error logging usage:', error);
        
        return totalCost;
    },

    /**
     * Retrieves the total bill. If 'cost_brl' is null (old records), it recalculates from tokens.
     */
    async getCurrentMonthBill(userId: string): Promise<number> {
        // Select all fields to be safe against missing columns
        // Usa select seguro. Se 'cost_brl' não existir no banco, o Supabase ignora ou retorna null,
        // mas não deve quebrar se usarmos select('*').
        try {
            const { data, error } = await supabase
                .from('usage_logs')
                .select('*') 
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching bill:', error);
                return 0;
            }

            const total = data.reduce((acc, curr: any) => {
                // 1. Try new column
                if (curr.cost_brl) return acc + curr.cost_brl;
                
                // 2. Try old column (if it exists in the returned object)
                if (curr.cost) return acc + curr.cost;

                // 3. Fallback: Recalculate from tokens (Recovery of lost data)
                const input = curr.input_tokens || 0;
                const output = curr.output_tokens || 0;
                const recalcCost = ((input / 1000000) * 0.60) + ((output / 1000000) * 2.40);
                
                return acc + recalcCost;
            }, 0);
            
            return total;
        } catch (e) {
            console.error("Critical billing fetch error", e);
            return 0;
        }
    },

    async getUsageHistory(userId: string): Promise<UsageLog[]> {
        try {
            const { data, error } = await supabase
                .from('usage_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) return [];

            return data.map((log: any) => {
                let cost = log.cost_brl;
                if (!cost && log.cost) cost = log.cost;
                if (!cost) {
                    const input = log.input_tokens || 0;
                    const output = log.output_tokens || 0;
                    cost = ((input / 1000000) * 0.60) + ((output / 1000000) * 2.40);
                }

                return {
                    id: log.id,
                    actionType: log.action_type,
                    cost: cost || 0, 
                    createdAt: log.created_at
                };
            });
        } catch (e) {
            return [];
        }
    },

    // --- VERSION CONTROL ---
    async getAppVersionHistory(): Promise<AppVersion[]> {
        try {
            // Supondo que a tabela 'app_versions' exista. Se não existir, retorna array vazio ou erro tratável.
            const { data, error } = await supabase
                .from('app_versions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn("Version check failed (Table might be missing):", error.message);
                return [];
            }
            return data as AppVersion[];
        } catch (e) {
            return [];
        }
    },

    async getLatestAppVersion(): Promise<AppVersion | null> {
        const history = await this.getAppVersionHistory();
        return history.length > 0 ? history[0] : null;
    }
};
