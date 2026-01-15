import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Project, ChatMessage } from '../types';
import { generateAIResponse } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { IconSend, IconSparkles, IconUser, IconRefresh, IconCopy } from './Icons';

interface ChatInterfaceProps {
    project: Project;
    onUpdateProject: (p: Project) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ project, onUpdateProject }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Carrega mensagens do banco ao iniciar
    useEffect(() => {
        const loadMessages = async () => {
            const msgs = await dataService.getMessages(project.id);
            setMessages(msgs);
        };
        loadMessages();
    }, [project.id]);

    // Scroll para baixo quando chega mensagem nova
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue,
            timestamp: Date.now()
        };

        // Atualiza UI instantaneamente
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInputValue('');
        setIsThinking(true);

        // Salva User Message
        await dataService.addMessage(project.id, userMsg);

        try {
            // Chama Gemini
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950 relative">
            
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-gray-100 flex items-center justify-between dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <IconSparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white">FitLM Assistant</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Inteligência baseada nos seus exames</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar pb-32">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 mt-10">
                        <IconSparkles className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">Comece uma conversa</h3>
                        <p className="text-sm text-gray-400 max-w-xs">Pergunte sobre seus exames, peça um treino ou tire dúvidas sobre sua dieta.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-gray-100 text-gray-900 rounded-tr-none dark:bg-gray-800 dark:text-white' 
                            : 'bg-white border border-gray-100 rounded-tl-none dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200'
                        }`}>
                            {msg.role === 'model' ? (
                                <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-sm font-medium">{msg.text}</p>
                            )}
                            <div className="mt-2 text-[10px] text-gray-400 text-right opacity-70">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </div>
                ))}

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

            {/* Input Area */}
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
        </div>
    );
};

export default ChatInterface;