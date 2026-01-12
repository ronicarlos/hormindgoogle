
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

    const opt = {
      margin:       [15, 15, 15, 15], // Increased margins (Top, Left, Bottom, Right) in mm
      filename:     `Prontuario_FitLM_${profile?.name || 'Atleta'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true }, 
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } // Crucial: Prevents cutting elements in half
    };

    // Gera o PDF e salva
    html2pdf().set(opt).from(element).save().then(() => {
        setIsGenerating(false);
    }).catch((err: any) => {
        console.error("Erro ao gerar PDF", err);
        setIsGenerating(false);
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
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white md:rounded-t-xl sticky top-0 z-50 shadow-sm">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
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
                            Gerando...
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
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                    <IconClose className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* 
            Area a ser impressa (ID: prontuario-content).
            Fundo branco forçado para garantir contraste no PDF.
            Padding adequado para A4.
        */}
        <div 
            id="prontuario-content" 
            className="bg-white p-8 md:p-12 md:rounded-b-xl shadow-2xl font-serif text-gray-900 leading-relaxed text-sm md:text-base min-h-[297mm]" 
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
            <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-widest text-black">FITLM</h1>
                    <p className="text-xs uppercase font-bold text-gray-500 mt-1">Intelligence System • Medical & Sports Analytics</p>
                </div>
                <div className="text-right text-xs text-gray-600">
                    <p>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                    <p>ID do Protocolo: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
            </div>

            {/* Patient Info Block */}
            {profile && (
                <div className="bg-gray-50 p-4 border border-gray-200 mb-8 text-sm avoid-break">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="font-bold block uppercase text-xs text-gray-500">Paciente/Atleta</span>
                            <span className="font-serif text-lg">{profile.name}</span>
                        </div>
                         <div>
                            <span className="font-bold block uppercase text-xs text-gray-500">Dados</span>
                            <span>{age} anos • {profile.gender} • {profile.weight}kg • {profile.height}cm</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Markdown Body */}
            <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:uppercase prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-justify prose-li:marker:text-black">
                 <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400 avoid-break">
                <p>Este documento foi gerado por Inteligência Artificial (FitLM) com base em dados fornecidos pelo usuário.</p>
                <p>Não substitui avaliação médica presencial. Uso estritamente informativo.</p>
            </div>

        </div>

      </div>
    </div>
  );
};

export default ProntuarioModal;
