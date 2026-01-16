
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
    diet_calories?: string; 
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
    ref_min?: number;
    ref_max?: number;
    created_at: string; // Adicionado explicitamente para tipagem
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

// === TABELA DE PREÇOS DINÂMICA (BRL por 1 Milhão de Tokens) ===
// Baseada no Google Pricing + IOF + Taxas (Estimativa de Segurança)
// Flash: ~$0.075 in / $0.30 out
// Pro:   ~$3.50 in  / $10.50 out (MUITO MAIS CARO)
const PRICING_TIERS = {
    FLASH: {
        input: 0.60,  // R$ 0,60 por 1M tokens
        output: 2.40  // R$ 2,40 por 1M tokens
    },
    PRO: {
        input: 25.00, // R$ 25,00 por 1M tokens
        output: 75.00 // R$ 75,00 por 1M tokens
    },
    EMBEDDING: {
        input: 0.60,
        output: 0.00
    }
};

const getModelTier = (modelName: string = '') => {
    const lower = modelName.toLowerCase();
    if (lower.includes('pro')) return PRICING_TIERS.PRO;
    if (lower.includes('flash') || lower.includes('lite')) return PRICING_TIERS.FLASH;
    // Fallback seguro (Flash) se não identificar, para não cobrar excessivamente por erro
    return PRICING_TIERS.FLASH; 
};

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
                console.error('Error fetching project:', error.message);
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
                    console.error('Error creating project:', createError.message);
                    return null;
                }
                currentProject = newProject;
            }

            const project = await this.hydrateProject(currentProject);
            
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

        try {
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
                        specificType: s.specific_type || undefined, 
                        createdAt: s.created_at
                    });
                }
            }
        } catch (e) {
            console.error("Error hydrating sources:", e);
        }

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
                        label: m.label,
                        refMin: m.ref_min,
                        refMax: m.ref_max,
                        // Mapeia explicitamente o timestamp de criação para ordenação precisa
                        createdAt: m.created_at ? new Date(m.created_at).getTime() : 0 
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
            dietCalories: dbProject.diet_calories || '', 
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
            const targetMeasurements = data.target_measurements || { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' };
            
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
                
                // New Fields
                targetWeight: data.target_weight?.toString() || '',
                targetBodyFat: data.target_body_fat?.toString() || '',
                targetMeasurements: targetMeasurements,

                comorbidities: data.comorbidities || '',
                medications: data.medications || '',
                measurements: measurements,
                calculatedStats: calculatedStats,
                termsAcceptedAt: data.terms_accepted_at,
                hideStartupDisclaimer: data.hide_startup_disclaimer,
                theme: data.theme || 'light',
                rememberEmail: data.remember_email || false,
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
            
            // New Fields
            target_weight: parseFloat(profile.targetWeight || '') || null,
            target_body_fat: parseFloat(profile.targetBodyFat || '') || null,
            target_measurements: profile.targetMeasurements,

            comorbidities: profile.comorbidities,
            medications: profile.medications,
            measurements: profile.measurements,
            theme: profile.theme,
            remember_email: profile.rememberEmail, 
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_profiles')
            .upsert(dbProfile, { onConflict: 'user_id' });

        if (error) console.error("Error saving profile:", error.message);
        return error;
    },

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
        const cleanName = file.name
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
            .replace(/[^a-zA-Z0-9.-]/g, "_");

        const fileName = `${Date.now()}_${cleanName}`;
        const filePath = `${userId}/${projectId}/${fileName}`;

        const { error, data } = await supabase.storage
            .from('project_files')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('CRITICAL STORAGE ERROR:', error);
            return null;
        }
        
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
        
        if (error) console.error('Error adding source:', error.message);
        return error;
    },

    async deleteSource(sourceId: string, filePath?: string) {
        if (filePath) {
            try {
                await supabase.storage
                    .from('project_files')
                    .remove([filePath]);
            } catch (e) {
                console.warn("Storage deletion error", e);
            }
        }

        const { error } = await supabase
            .from('sources')
            .delete()
            .eq('id', sourceId);
        
        if (error) console.error('Error deleting source:', error.message);
        return error;
    },

    async updateSourceSummary(sourceId: string, summary: string) {
        const { error } = await supabase
            .from('sources')
            .update({ summary: summary })
            .eq('id', sourceId);
        
        if (error) console.error('Error updating summary:', error.message);
        return error;
    },

    async toggleSourceSelection(sourceId: string, isSelected: boolean) {
         const { error } = await supabase
            .from('sources')
            .update({ selected: isSelected })
            .eq('id', sourceId);
        
        if (error) console.error('Error toggling source:', error.message);
    },

    async addMetric(projectId: string, category: string, point: MetricPoint) {
        let safeDate = point.date;
        if (point.date.includes('/')) {
            const parts = point.date.split('/');
            if (parts.length === 3) {
                safeDate = `${parts[2]}-${parts[1]}-${parts[0]}`; 
            }
        }

        const { error } = await supabase
            .from('metrics')
            .insert({
                project_id: projectId,
                category: category,
                date: safeDate,
                value: point.value,
                unit: point.unit,
                label: point.label,
                ref_min: point.refMin,
                ref_max: point.refMax
            });
        
        if (error) console.error('Error adding metric:', error.message);
    },

    async updateProjectSettings(projectId: string, objective: string, protocol: ProtocolItem[], trainingNotes?: string, dietCalories?: string) {
        const updateData: any = { 
            current_protocol: protocol,
            objective: objective
        };

        if (trainingNotes !== undefined) {
            updateData.training_notes = trainingNotes;
        }
        
        // Garante que o campo diet_calories existe no update, mesmo vazio, se passado
        if (dietCalories !== undefined) {
            updateData.diet_calories = dietCalories;
        }

        const { error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', projectId);
            
        if (error) {
            // Log detalhado para debug do usuário
            console.error('Error updating project settings:', JSON.stringify(error, null, 2));
        }
    },

    async getMessages(projectId: string): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error.message);
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

        if (error) console.error('Error adding message:', error.message);
    },

    async toggleMessageBookmark(messageId: string, isBookmarked: boolean) {
        const { error } = await supabase
            .from('messages')
            .update({ is_bookmarked: isBookmarked })
            .eq('id', messageId);
        
        if (error) console.error('Error toggling bookmark:', error.message);
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
            console.error("Semantic Search Error:", error.message);
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

    async logUsage(userId: string, projectId: string | undefined, actionType: string, inputTokens: number, outputTokens: number, modelName?: string): Promise<number> {
        // Seleciona a tarifa correta baseada no modelo utilizado
        const pricing = getModelTier(modelName);
        
        const costInput = (inputTokens / 1000000) * pricing.input;
        const costOutput = (outputTokens / 1000000) * pricing.output;
        const totalCost = costInput + costOutput;

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

        if (error) console.error('Error logging usage:', error.message);
        
        return totalCost;
    },

    async getCurrentMonthBill(userId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('usage_logs')
                .select('*') 
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching bill:', error.message);
                return 0;
            }

            const total = data.reduce((acc, curr: any) => {
                // Se já temos o custo calculado e persistido no banco, usamos ele (PREFERENCIAL)
                if (curr.cost_brl !== undefined && curr.cost_brl !== null) {
                    return acc + curr.cost_brl;
                }
                
                // Fallback legado (apenas se cost_brl for nulo, assume tarifa básica Flash)
                if (curr.cost) return acc + curr.cost;
                
                const input = curr.input_tokens || 0;
                const output = curr.output_tokens || 0;
                // Tarifa legacy (Flash)
                const recalcCost = ((input / 1000000) * PRICING_TIERS.FLASH.input) + ((output / 1000000) * PRICING_TIERS.FLASH.output);
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
                if (cost === undefined || cost === null) {
                    if (log.cost) cost = log.cost;
                    else {
                        const input = log.input_tokens || 0;
                        const output = log.output_tokens || 0;
                        cost = ((input / 1000000) * PRICING_TIERS.FLASH.input) + ((output / 1000000) * PRICING_TIERS.FLASH.output);
                    }
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

    async getAppVersionHistory(): Promise<AppVersion[]> {
        try {
            const { data, error } = await supabase
                .from('app_versions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
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
