
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Project, ChatMessage } from '../types';
import { generateAIResponse } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { IconSend, IconSparkles, IconUser, IconRefresh, IconCopy, IconSearch, IconBookmark, IconBookmarkFilled, IconClose, IconArrowLeft } from './Icons';

interface ChatInterfaceProps {
    project: Project;
    onUpdateProject: (p: Project) => void;
    refreshTrigger?: number; // Prop para forçar recarregamento externo
}

// Helper para destacar texto
const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) {
        return <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed"><ReactMarkdown>{text}</ReactMarkdown></div>;
    }
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span className="whitespace-pre-wrap text-sm">
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-300 text-black font-bold px-0.5 rounded-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ project, onUpdateProject, refreshTrigger = 0 }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    // Search & Filter States
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Carrega mensagens do banco ao iniciar E quando refreshTrigger mudar
    useEffect(() => {
        const loadMessages = async () => {
            const msgs = await dataService.getMessages(project.id);
            setMessages(msgs);
        };
        loadMessages();
    }, [project.id, refreshTrigger]);

    // Scroll para baixo apenas se NÃO estiver buscando (para não pular enquanto lê histórico)
    useEffect(() => {
        if (!searchTerm && !showBookmarksOnly) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, searchTerm, showBookmarksOnly]);

    // Auto-focus no input de busca ao abrir
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue,
            timestamp: Date.now()
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInputValue('');
        setIsThinking(true);

        // Se estiver filtrando, limpa para ver a nova mensagem
        if (searchTerm || showBookmarksOnly) {
            setSearchTerm('');
            setShowBookmarksOnly(false);
            setIsSearchOpen(false);
        }

        await dataService.addMessage(project.id, userMsg);

        try {
            const responseText = await generateAIResponse(
                userMsg.text,
                project.sources,
                newHistory,
                project.userProfile,
                project.metrics
            );

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);
            await dataService.addMessage(project.id, aiMsg);

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'model',
                text: "Desculpe, tive um problema técnico ao processar sua mensagem. Tente novamente.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleToggleBookmark = async (msg: ChatMessage) => {
        const newStatus = !msg.isBookmarked;
        
        // Optimistic Update
        const updatedMessages = messages.map(m => 
            m.id === msg.id ? { ...m, isBookmarked: newStatus } : m
        );
        setMessages(updatedMessages);

        await dataService.toggleMessageBookmark(msg.id, newStatus);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Filter Logic
    const filteredMessages = messages.filter(msg => {
        const matchesSearch = searchTerm 
            ? msg.text.toLowerCase().includes(searchTerm.toLowerCase()) 
            : true;
        const matchesBookmark = showBookmarksOnly 
            ? msg.isBookmarked 
            : true;
        return matchesSearch && matchesBookmark;
    });

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950 relative">
            
            {/* Header Dinâmico */}
            <div className="shrink-0 h-16 px-4 border-b border-gray-100 flex items-center justify-between dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-20 shadow-sm transition-all">
                {isSearchOpen ? (
                    // MODO BUSCA
                    <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                        <button 
                            onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }}
                            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            <IconArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="Localizar na conversa..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-100 border-none rounded-lg py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <IconClose className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    // MODO PADRÃO
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <IconSparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-sm md:text-base dark:text-white">FitLM Assistant</h2>
                                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Inteligência Ativa</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                                className={`p-2 rounded-full transition-all ${showBookmarksOnly ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                title="Filtrar Favoritos"
                            >
                                {showBookmarksOnly ? <IconBookmarkFilled className="w-5 h-5" /> : <IconBookmark className="w-5 h-5" />}
                            </button>
                            <button 
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-white"
                                title="Pesquisar"
                            >
                                <IconSearch className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Warning de Filtro Ativo */}
            {(showBookmarksOnly || searchTerm) && (
                <div className="bg-yellow-50 text-yellow-800 text-xs px-4 py-2 flex justify-between items-center dark:bg-yellow-900/20 dark:text-yellow-200">
                    <span className="font-medium">
                        {filteredMessages.length} mensagem(ns) encontrada(s)
                        {showBookmarksOnly && " (Favoritos)"}
                        {searchTerm && ` para "${searchTerm}"`}
                    </span>
                    <button 
                        onClick={() => { setSearchTerm(''); setShowBookmarksOnly(false); setIsSearchOpen(false); }}
                        className="text-yellow-600 hover:underline font-bold dark:text-yellow-400"
                    >
                        Limpar Filtros
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar pb-32">
                {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 mt-10">
                        {searchTerm || showBookmarksOnly ? (
                            <>
                                <IconSearch className="w-12 h-12 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-400">Nenhum resultado encontrado.</p>
                            </>
                        ) : (
                            <>
                                <IconSparkles className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-400">Comece uma conversa</h3>
                                <p className="text-sm text-gray-400 max-w-xs">Pergunte sobre seus exames, peça um treino ou tire dúvidas sobre sua dieta.</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredMessages.map((msg) => (
                        <div key={msg.id} className={`flex group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm transition-all ${
                                msg.role === 'user' 
                                ? 'bg-gray-100 text-gray-900 rounded-tr-none dark:bg-gray-800 dark:text-white' 
                                : 'bg-white border border-gray-100 rounded-tl-none dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200'
                            }`}>
                                {/* Bookmark Button (Visible on Hover or if Bookmarked) */}
                                <button 
                                    onClick={() => handleToggleBookmark(msg)}
                                    className={`absolute -top-2 ${msg.role === 'user' ? '-left-2' : '-right-2'} p-1.5 rounded-full shadow-sm bg-white border border-gray-100 transition-all z-10 ${
                                        msg.isBookmarked 
                                        ? 'text-yellow-500 opacity-100 scale-100 dark:bg-gray-800 dark:border-gray-700' 
                                        : 'text-gray-300 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100 hover:text-yellow-400 dark:bg-gray-800 dark:border-gray-700'
                                    }`}
                                    title={msg.isBookmarked ? "Remover Favorito" : "Favoritar"}
                                >
                                    {msg.isBookmarked ? <IconBookmarkFilled className="w-3 h-3" /> : <IconBookmark className="w-3 h-3" />}
                                </button>

                                {/* Message Content with Highlighter */}
                                <HighlightText text={msg.text} highlight={searchTerm} />

                                <div className="mt-2 text-[10px] text-gray-400 text-right opacity-70 flex justify-end items-center gap-1">
                                    {msg.isBookmarked && <IconBookmarkFilled className="w-2.5 h-2.5 text-yellow-500" />}
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {isThinking && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 shadow-sm dark:bg-gray-900 dark:border-gray-800">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Analisando dados...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Visible UNLESS SEARCHING TEXT) */}
            {!isSearchOpen && (
                <div className="p-4 bg-white border-t border-gray-100 dark:bg-gray-900 dark:border-gray-800 sticky bottom-0 z-20">
                    <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all dark:bg-gray-800 dark:border-gray-700">
                        <textarea 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pergunte sobre seus exames ou treino..."
                            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-2 text-sm text-gray-900 placeholder-gray-400 dark:text-white"
                            rows={1}
                            style={{ height: 'auto', minHeight: '44px' }}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isThinking}
                            className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            {isThinking ? <IconRefresh className="w-5 h-5 animate-spin" /> : <IconSend className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-400">A IA pode cometer erros. Verifique informações médicas importantes.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
