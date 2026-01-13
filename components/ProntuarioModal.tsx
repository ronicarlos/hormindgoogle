
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconClose, IconDownload } from './Icons';
import { UserProfile } from '../types';

// Declaração para o TypeScript reconhecer a biblioteca carregada via CDN
declare var html2pdf: any;

interface ProntuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
  profile?: UserProfile;
}

const ProntuarioModal: React.FC<ProntuarioModalProps> = ({ isOpen, onClose, markdownContent, profile }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    const element = document.getElementById('prontuario-content');
    
    if (!element) {
        setIsGenerating(false);
        return;
    }

    // 1. FORÇAR MODO CLARO (BRANCO) PARA O PDF
    // Armazena estilo original para reverter depois
    const originalStyle = element.getAttribute('style');
    
    // Força container principal
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#000000';
    element.classList.remove('dark:bg-gray-950', 'dark:text-gray-200');
    element.classList.add('light-mode-forced');
    
    // 2. CORRIGIR ELEMENTOS INTERNOS (CRÍTICO PARA EVITAR TARJAS PRETAS)
    const allElements = element.querySelectorAll('*');
    allElements.forEach((el: any) => {
        // Força Texto Preto
        el.style.color = '#000000';
        
        // Remove inversão de cores do Markdown (Prose)
        if(el.classList.contains('prose-invert')) {
            el.classList.remove('prose-invert');
        }

        // CORREÇÃO DA TARJA PRETA:
        // Se o elemento tiver a classe 'bg-gray-50' (usada no bloco de dados do paciente),
        // forçamos o background para cinza claro via style inline (sobrescreve o dark mode css).
        if (el.classList.contains('bg-gray-50')) {
            el.style.backgroundColor = '#f9fafb'; // Cinza muito claro
            el.style.borderColor = '#e5e7eb';     // Borda clara
        }

        // Força bordas para preto (ex: linha do cabeçalho)
        if (el.classList.contains('border-black') || el.classList.contains('dark:border-white')) {
            el.style.borderColor = '#000000';
        }
    });

    const opt = {
      margin:       [15, 15, 15, 15], // Margens (Topo, Esq, Baixo, Dir) em mm
      filename:     `Prontuario_FitLM_${profile?.name?.replace(/ /g, '_') || 'Atleta'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true }, 
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } 
    };

    // Gera o PDF e salva
    html2pdf().set(opt).from(element).save().then(() => {
        // REVERTER ESTILOS PARA O USUÁRIO (Voltar ao Dark Mode se estiver ativo)
        if (originalStyle) element.setAttribute('style', originalStyle);
        else element.removeAttribute('style');
        
        // Limpar overrides dos filhos
        allElements.forEach((el: any) => {
             el.style.color = '';
             el.style.backgroundColor = '';
             el.style.borderColor = '';
             // Nota: Não readicionamos 'prose-invert' aqui pois o React re-renderiza rápido, 
             // mas se necessário, a navegação ou atualização de estado resolveria.
        });
        
        setIsGenerating(false);
    }).catch((err: any) => {
        console.error("Erro ao gerar PDF", err);
        setIsGenerating(false);
        // Reverter em caso de erro também
        if (originalStyle) element.setAttribute('style', originalStyle);
        else element.removeAttribute('style');
        allElements.forEach((el: any) => {
            el.style.color = '';
            el.style.backgroundColor = '';
            el.style.borderColor = '';
        });
        alert("Erro ao gerar o PDF. Tente novamente.");
    });
  };

  const calculateAge = (birthDate?: string) => {
      if (!birthDate) return 'N/A';
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
      }
      return age;
  };

  const age = profile ? calculateAge(profile.birthDate) : 'N/A';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-0 md:p-4 overflow-y-auto">
      {/* Container - acts as the paper sheet wrapper */}
      <div className="w-full max-w-4xl min-h-screen md:min-h-[80vh] flex flex-col relative">
        
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white md:rounded-t-xl sticky top-0 z-50 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 dark:text-white">
                Documento Médico Gerado
            </h2>
            <div className="flex gap-2">
                <button 
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            Gerando PDF...
                        </>
                    ) : (
                        <>
                            <IconDownload className="w-4 h-4" />
                            Baixar PDF
                        </>
                    )}
                </button>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors dark:hover:bg-gray-800"
                >
                    <IconClose className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* 
            Area a ser impressa (ID: prontuario-content).
            DARK MODE: Visualização em tela escura (dark:bg-gray-950, dark:text-gray-200).
            PRINT MODE: O script acima força BG branco e texto preto na hora de gerar o PDF.
        */}
        <div 
            id="prontuario-content" 
            className="bg-white p-8 md:p-12 md:rounded-b-xl shadow-2xl font-serif text-gray-900 leading-relaxed text-sm md:text-base min-h-[297mm] dark:bg-gray-950 dark:text-gray-200" 
        >
            <style>
              {`
                /* Print specific styles to avoid breaks inside key elements */
                @media print {
                  h1, h2, h3, h4, li, p, .avoid-break {
                    page-break-inside: avoid;
                  }
                }
                /* Also applied for HTML2PDF via pagebreak option */
                .prose p, .prose li, .prose h1, .prose h2, .prose h3 {
                    page-break-inside: avoid;
                }
              `}
            </style>
            
            {/* Header / Letterhead */}
            <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end dark:border-white">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-widest text-black dark:text-white">FITLM</h1>
                    <p className="text-xs uppercase font-bold text-gray-500 mt-1 dark:text-gray-400">Intelligence System • Medical & Sports Analytics</p>
                </div>
                <div className="text-right text-xs text-gray-600 dark:text-gray-400">
                    <p>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                    <p>ID do Protocolo: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
            </div>

            {/* Patient Info Block */}
            {profile && (
                <div className="bg-gray-50 p-4 border border-gray-200 mb-8 text-sm avoid-break dark:bg-gray-900 dark:border-gray-800">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="font-bold block uppercase text-xs text-gray-500 dark:text-gray-400">Paciente/Atleta</span>
                            <span className="font-serif text-lg dark:text-white">{profile.name}</span>
                        </div>
                         <div>
                            <span className="font-bold block uppercase text-xs text-gray-500 dark:text-gray-400">Dados</span>
                            <span className="dark:text-gray-300">{age} anos • {profile.gender} • {profile.weight}kg • {profile.height}cm</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Markdown Body */}
            <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:uppercase prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-justify prose-li:marker:text-black dark:prose-invert dark:prose-li:marker:text-white">
                 <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400 avoid-break dark:border-gray-800 dark:text-gray-600">
                <p>Este documento foi gerado por Inteligência Artificial (FitLM) com base em dados fornecidos pelo usuário.</p>
                <p>Não substitui avaliação médica presencial. Uso estritamente informativo.</p>
            </div>

        </div>

      </div>
    </div>
  );
};

export default ProntuarioModal;
