
import React, { useState, useRef } from 'react';
import { generateProgrammingCard } from '../services/geminiService';
import { CodeIcon } from './icons/CodeIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { EyeIcon } from './icons/EyeIcon';

// Shared CSS styles for the Anki card
const CARD_STYLES = `<style>
    /* Dark Theme Anki Card - Objective Style */
    .prog-card-container {
        font-family: 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif;
        background-color: #1e1e1e;
        color: #d4d4d4;
        padding: 20px;
        border-radius: 8px;
        max-width: 600px;
        margin: 0 auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        line-height: 1.5;
        text-align: left;
        border: 1px solid #333;
        margin-bottom: 20px;
    }

    /* Header with Topic and Badge */
    .prog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #333;
    }

    .prog-context-badge {
        background-color: #264f78; /* VS Code Blue-ish */
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
    }

    .prog-topic {
        font-size: 14px;
        color: #808080;
        font-weight: 500;
    }

    /* Sections */
    .prog-section-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #569cd6; /* Blue keyword color */
        margin-bottom: 5px;
        font-weight: bold;
    }

    .prog-question {
        font-size: 18px;
        font-weight: 600;
        color: #e0e0e0;
        margin-bottom: 5px;
    }

    .prog-answer {
        font-size: 16px;
        color: #ce9178; /* String color/Orange-ish for contrast */
        margin-bottom: 15px;
    }

    /* Code Block Styling */
    .code-block {
        background-color: #111; /* Darker than card bg */
        border: 1px solid #333;
        border-left: 3px solid #4ec9b0; /* Teal accent */
        border-radius: 4px;
        padding: 12px;
        overflow-x: auto;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        color: #dcdcaa;
    }

    .code-block pre {
        margin: 0;
        white-space: pre-wrap;
    }
    
    /* Syntax Highlight Simulation classes */
    .hl-keyword { color: #569cd6; font-weight: bold; }
    .hl-string { color: #ce9178; }
    .hl-function { color: #dcdcaa; }
    .hl-comment { color: #6a9955; font-style: italic; }

    /* Scrollbar */
    .code-block::-webkit-scrollbar { height: 6px; }
    .code-block::-webkit-scrollbar-track { background: #1e1e1e; }
    .code-block::-webkit-scrollbar-thumb { background: #424242; border-radius: 3px; }
</style>`;

const FRONT_TEMPLATE = `
<div class="prog-card-container">
    <div class="prog-header">
        <span class="prog-topic">[Topic]</span>
        <span class="prog-context-badge">[Language/Context]</span>
    </div>
    <div>
        <div class="prog-section-label">Pergunta</div>
        <div class="prog-question">
            [Question]
        </div>
    </div>
</div>
`;

const BACK_TEMPLATE = `
<div class="prog-card-container">
    <div>
        <div class="prog-section-label">Resposta</div>
        <div class="prog-answer">
            [Answer]
        </div>
        
        <div class="prog-section-label" style="margin-top: 15px;">Exemplo Prático</div>
        <div style="font-size: 14px; color: #cccccc; margin-bottom: 8px;">
            [Example]
        </div>
        <div class="code-block">
            [Code]
        </div>
    </div>
</div>
`;

export const ProgrammingCardGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    
    const [frontHtml, setFrontHtml] = useState('');
    const [backHtml, setBackHtml] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [copySuccessFront, setCopySuccessFront] = useState(false);
    const [copySuccessBack, setCopySuccessBack] = useState(false);
    
    const [showPreview, setShowPreview] = useState(false);
    
    const frontTextRef = useRef<HTMLTextAreaElement>(null);
    const backTextRef = useRef<HTMLTextAreaElement>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Por favor, digite um tópico.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setFrontHtml('');
        setBackHtml('');
        setCopySuccessFront(false);
        setCopySuccessBack(false);

        try {
            // Pass both templates to the service
            const result = await generateProgrammingCard(topic, context, FRONT_TEMPLATE, BACK_TEMPLATE);
            
            // Prepend styles to BOTH cards to ensure consistent styling regardless of where they are pasted
            setFrontHtml(CARD_STYLES + result.front);
            setBackHtml(CARD_STYLES + result.back);
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao gerar o cartão. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, isFront: boolean) => {
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            if (isFront) {
                setCopySuccessFront(true);
                setTimeout(() => setCopySuccessFront(false), 2000);
            } else {
                setCopySuccessBack(true);
                setTimeout(() => setCopySuccessBack(false), 2000);
            }
        }).catch(err => {
            console.error('Failed to copy', err);
            // Fallback strategy could go here
        });
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <CodeIcon className="w-6 h-6 text-sky-300" />
                <h3 className="text-lg font-semibold text-sky-300">Gerador de Cartões Anki para Programação</h3>
            </div>

            <p className="text-sm text-slate-400 mb-4">
                Gera cartões "Pergunta e Resposta" com campos separados para copiar e colar no Anki.
            </p>

            <div className="flex flex-col gap-4 mb-4">
                <div>
                    <label className="text-sm font-semibold text-slate-300 mb-1 block">Tópico / Conceito</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: Piping, useEffect, List Comprehension..."
                        className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 p-2.5"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-300 mb-1 block">Contexto / Linguagem (Opcional)</label>
                    <input
                        type="text"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Ex: Linux, React, Python..."
                        className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 p-2.5"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
            >
                {isLoading ? 'Gerando Cartão...' : 'Gerar Cartão Separado'}
            </button>

            {error && (
                <div className="mt-4 bg-red-900/50 border border-red-600 text-red-200 px-4 py-2 rounded-lg text-sm">
                    <p>{error}</p>
                </div>
            )}

            {(frontHtml || isLoading) && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front Card Column */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="font-semibold text-sky-300 text-sm flex items-center gap-2">
                                1. Frente (Pergunta)
                                <span className="text-xs font-normal text-slate-500">(Com Estilos CSS)</span>
                            </label>
                             {!isLoading && frontHtml && (
                                <button
                                    onClick={() => handleCopy(frontHtml, true)}
                                    className="flex items-center gap-2 text-xs bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md transition-colors"
                                >
                                    {copySuccessFront ? <CheckCircleIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                    {copySuccessFront ? 'Copiado!' : 'Copiar'}
                                </button>
                             )}
                        </div>
                        {isLoading ? (
                            <div className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-3 animate-pulse"></div>
                        ) : (
                            <textarea
                                ref={frontTextRef}
                                readOnly
                                value={frontHtml}
                                className="w-full h-40 bg-slate-900 border border-slate-600 text-slate-300 text-xs rounded-lg p-3 font-mono focus:ring-sky-500 focus:border-sky-500"
                            />
                        )}
                    </div>

                    {/* Back Card Column */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="font-semibold text-sky-300 text-sm flex items-center gap-2">
                                2. Verso (Resposta)
                                <span className="text-xs font-normal text-slate-500">(Com Estilos CSS)</span>
                            </label>
                             {!isLoading && backHtml && (
                                <button
                                    onClick={() => handleCopy(backHtml, false)}
                                    className="flex items-center gap-2 text-xs bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md transition-colors"
                                >
                                    {copySuccessBack ? <CheckCircleIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                    {copySuccessBack ? 'Copiado!' : 'Copiar'}
                                </button>
                             )}
                        </div>
                        {isLoading ? (
                            <div className="w-full h-40 bg-slate-900 border border-slate-600 rounded-lg p-3 animate-pulse"></div>
                        ) : (
                            <textarea
                                ref={backTextRef}
                                readOnly
                                value={backHtml}
                                className="w-full h-40 bg-slate-900 border border-slate-600 text-slate-300 text-xs rounded-lg p-3 font-mono focus:ring-sky-500 focus:border-sky-500"
                            />
                        )}
                    </div>
                </div>
            )}

            {!isLoading && frontHtml && backHtml && (
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-lg"
                    >
                        <EyeIcon className="w-5 h-5" />
                        Ver Prévia do Cartão
                    </button>
                </div>
            )}

            {showPreview && (
                <div 
                    className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4"
                    onClick={() => setShowPreview(false)}
                >
                    <div 
                        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3 flex-shrink-0">
                            <h4 className="text-lg font-semibold text-sky-300">Prévia (Frente &amp; Verso)</h4>
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="bg-slate-900 rounded-lg overflow-hidden flex-grow relative">
                           {/* Combine Front and Back for the preview */}
                            <iframe
                                srcDoc={`${frontHtml}<br/><hr style="border-color: #333; margin: 20px 0;"/><br/>${backHtml}`}
                                title="Programming Card Preview"
                                className="w-full h-full border-0"
                                style={{ backgroundColor: '#1e1e1e' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
