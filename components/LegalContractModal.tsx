
import React, { useState } from 'react';
import { IconAlert, IconCheck } from './Icons';

interface LegalContractModalProps {
    isOpen: boolean;
    onAccept: () => void;
}

const LegalContractModal: React.FC<LegalContractModalProps> = ({ isOpen, onAccept }) => {
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    if (!isOpen) return null;

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Tolerancia de 10px
        if (scrollHeight - scrollTop - clientHeight < 10) {
            setScrolledToBottom(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-gray-200">
                
                {/* Header */}
                <div className="bg-red-600 p-6 text-white text-center shrink-0">
                    <IconAlert className="w-10 h-10 mx-auto mb-2" />
                    <h2 className="text-xl font-bold uppercase tracking-wide">Termos de Uso Obrigatórios</h2>
                    <p className="text-red-100 text-xs mt-1 font-medium">Leia até o final para liberar o acesso</p>
                </div>

                {/* Contract Body */}
                <div 
                    className="p-6 md:p-8 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-4 bg-gray-50 flex-1 border-b border-gray-200"
                    onScroll={handleScroll}
                >
                    <p className="font-bold text-gray-900">CONTRATO DE ADESÃO E TERMO DE RESPONSABILIDADE</p>
                    
                    <p>Ao utilizar o aplicativo <strong>FitLM</strong> ("Plataforma"), você, doravante denominado "USUÁRIO", declara e concorda com os seguintes termos:</p>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-gray-900">1. Maioridade Legal</h4>
                            <p>O USUÁRIO declara solenemente, sob as penas da lei, possuir <strong>18 (dezoito) anos completos ou mais</strong>. Esta plataforma é estritamente proibida para menores de idade.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900">2. Natureza Educacional</h4>
                            <p>O USUÁRIO reconhece que a Plataforma é uma ferramenta de <strong>inteligência artificial educacional e de monitoramento</strong>. A Plataforma NÃO fornece diagnósticos médicos, prescrições de medicamentos ou orientações de tratamento.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900">3. Isenção de Responsabilidade Médica</h4>
                            <p>Nenhuma informação gerada pela Plataforma substitui a consulta presencial com médico, nutricionista ou profissional de educação física. O USUÁRIO concorda em não utilizar as informações aqui contidas como base única para decisões de saúde.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900">4. Uso de Substâncias e Farmacologia</h4>
                            <p>O USUÁRIO declara estar ciente de que o uso de substâncias ergogênicas, esteroides anabolizantes ou medicamentos sem prescrição médica acarreta riscos graves à saúde, incluindo risco de morte. A decisão de utilizar qualquer substância é de <strong>RESPONSABILIDADE ÚNICA, EXCLUSIVA E PESSOAL</strong> do USUÁRIO. A Plataforma não incentiva, recomenda ou comercializa tais substâncias.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900">5. Proteção de Dados (LGPD)</h4>
                            <p>O USUÁRIO autoriza o processamento de seus dados biométricos e de saúde pela inteligência artificial para fins de geração de relatórios personalizados, ciente de que seus dados estão protegidos conforme nossa Política de Privacidade.</p>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-4 italic">Versão 1.0 - Atualizado em {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white shrink-0 space-y-4">
                    <label className={`flex items-start gap-3 cursor-pointer select-none transition-opacity ${scrolledToBottom ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="relative flex items-center mt-0.5">
                            <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                                disabled={!scrolledToBottom}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 focus:outline-none"
                            />
                            <IconCheck className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                            Li, compreendi e concordo integralmente com os termos acima. Assumo total responsabilidade pelos meus atos e uso da plataforma.
                        </span>
                    </label>

                    <button
                        onClick={onAccept}
                        disabled={!isChecked || !scrolledToBottom}
                        className="w-full py-4 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm flex items-center justify-center gap-2"
                    >
                        <span className="font-serif">✍</span> Assinar e Entrar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LegalContractModal;
