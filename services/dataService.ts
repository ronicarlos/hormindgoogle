
import { supabase } from '../lib/supabase';
import { Project, Source, SourceType, MetricPoint, ProtocolItem, UserProfile, ChatMessage } from '../types';

// Tipos auxiliares para Banco de Dados
interface DBProject {
    id: string;
    user_id: string;
    name: string;
    objective: string;
    current_protocol: any;
    training_notes?: string; // Add persistence field
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
    created_at: string;
}

interface DBSource {
    id: string;
    project_id: string;
    title: string;
    type: string;
    date: string;
    content: string;
    summary?: string; // Mapped from DB
    selected: boolean;
    file_path: string | null;
}

export const dataService = {
    /**
     * Busca ou cria um projeto padrão para o usuário atual
     * @param userId - ID do usuário autenticado (Garante isolamento SaaS)
     */
    async getOrCreateProject(userId: string): Promise<Project | null> {
        // Tenta buscar projeto existente
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .limit(1);

        if (error) {
            console.error('Error fetching project:', error);
            return null;
        }

        let currentProject: DBProject;

        if (projects && projects.length > 0) {
            currentProject = projects[0];
        } else {
            // Se não existe, cria um padrão
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
        
        // Buscar Perfil do Usuário
        const profile = await this.getUserProfile(userId);
        if (profile) {
            project.userProfile = profile;
        }

        return project;
    },

    /**
     * Carrega dados relacionais e monta o objeto Project completo
     */
    async hydrateProject(dbProject: DBProject): Promise<Project> {
        // Buscar Sources
        const { data: sourcesData } = await supabase
            .from('sources')
            .select('*')
            .eq('project_id', dbProject.id);
            
        // Processar Sources para gerar URLs assinadas (Links de Download)
        const sources: Source[] = [];
        if (sourcesData) {
            for (const s of (sourcesData as DBSource[])) {
                let fileUrl = undefined;
                
                // Se houver um caminho de arquivo no Storage, gerar URL assinada válida por 1 hora
                if (s.file_path) {
                    const { data } = await supabase.storage
                        .from('project_files')
                        .createSignedUrl(s.file_path, 3600); // 1 hora
                    
                    if (data) fileUrl = data.signedUrl;
                }

                sources.push({
                    id: s.id,
                    title: s.title,
                    type: s.type as SourceType,
                    date: s.date,
                    content: s.content,
                    summary: s.summary || undefined, // Carrega o resumo se existir
                    selected: s.selected,
                    filePath: s.file_path || undefined,
                    fileUrl: fileUrl
                });
            }
        }

        // Buscar Metrics
        const { data: metrics } = await supabase
            .from('metrics')
            .select('*')
            .eq('project_id', dbProject.id)
            .order('created_at', { ascending: true });

        // Agrupar Métricas
        const groupedMetrics: Record<string, MetricPoint[]> = {};
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

        return {
            id: dbProject.id,
            name: dbProject.name,
            objective: dbProject.objective as any,
            currentProtocol: dbProject.current_protocol || [],
            trainingNotes: dbProject.training_notes || '', // Map from DB
            sources: sources,
            metrics: groupedMetrics
        };
    },

    async getUserProfile(userId: string): Promise<UserProfile | undefined> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) return undefined;

        // Gerar URL assinada para o Avatar se existir
        let avatarUrl = undefined;
        if (data.avatar_url) {
             const { data: signedData } = await supabase.storage
                .from('project_files')
                .createSignedUrl(data.avatar_url, 3600);
             if (signedData) avatarUrl = signedData.signedUrl;
        }

        return {
            name: data.name || '',
            avatarUrl: avatarUrl, // URL assinada
            birthDate: data.birth_date || '', // Mapped from birth_date
            gender: data.gender || 'Masculino',
            height: data.height?.toString() || '',
            weight: data.weight?.toString() || '',
            bodyFat: data.body_fat?.toString() || '',
            comorbidities: data.comorbidities || '',
            medications: data.medications || '',
            measurements: data.measurements || { chest: '', arm: '', waist: '', hips: '', thigh: '', calf: '' }
        };
    },

    async saveUserProfile(userId: string, profile: UserProfile) {
        const dbProfile = {
            user_id: userId,
            name: profile.name,
            birth_date: profile.birthDate || null, // Saved to birth_date
            gender: profile.gender,
            height: parseFloat(profile.height) || null,
            weight: parseFloat(profile.weight) || null,
            body_fat: parseFloat(profile.bodyFat || '') || null,
            comorbidities: profile.comorbidities,
            medications: profile.medications,
            measurements: profile.measurements,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_profiles')
            .upsert(dbProfile, { onConflict: 'user_id' });

        if (error) console.error("Error saving profile:", error);
        return error;
    },
    
    async uploadAvatar(file: File, userId: string): Promise<string | null> {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/avatars/${fileName}`;

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
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${projectId}/${fileName}`;

        const { error } = await supabase.storage
            .from('project_files')
            .upload(filePath, file);

        if (error) {
            console.error('Error uploading file:', error);
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
                date: source.date,
                content: source.content,
                selected: source.selected,
                file_path: source.filePath,
                summary: source.summary
            });
        
        if (error) console.error('Error adding source:', error);
        return error;
    },

    async deleteSource(sourceId: string) {
        // Note: This only deletes the database record, not the file in storage.
        // For a simple implementation, this is sufficient to hide it from the UI/AI.
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

    // Updated to accept trainingNotes
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
            timestamp: new Date(msg.created_at).getTime()
        }));
    },

    async addMessage(projectId: string, message: ChatMessage) {
        const created_at = new Date(message.timestamp).toISOString();
        
        const { error } = await supabase
            .from('messages')
            .insert({
                project_id: projectId,
                role: message.role,
                text: message.text,
                created_at: created_at
            });

        if (error) console.error('Error adding message:', error);
    }
};
