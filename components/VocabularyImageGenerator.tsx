import React, { useState, useEffect, useCallback } from 'react';
import { generateVocabularyImage, GeneratedFlashcard } from '../services/imageService';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BookIcon } from './icons/BookIcon';

const ImageSkeleton = () => (
    <div className="mt-4 animate-pulse">
        <div className="w-full aspect-square bg-slate-700 rounded-lg"></div>
    </div>
);

type ImageStyle = 'Cartoon' | 'Photorealistic' | 'Watercolor' | 'Pixel Art';
const styles: ImageStyle[] = ['Cartoon', 'Photorealistic', 'Watercolor', 'Pixel Art'];

interface VocabularyImageGeneratorProps {
    wordToGenerate?: string;
    contextToGenerate?: string;
}

export const VocabularyImageGenerator: React.FC<VocabularyImageGeneratorProps> = ({ wordToGenerate, contextToGenerate }) => {
    const [word, setWord] = useState('');
    const [context, setContext] = useState('');
    const [style, setStyle] = useState<ImageStyle>('Cartoon');
    const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedFlashcard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedImageIndex, setCopiedImageIndex] = useState<number | null>(null);
    const [copiedCaptionIndex, setCopiedCaptionIndex] = useState<number | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!word.trim()) {
            setError('Please enter a word or phrasal verb.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setCopiedImageIndex(null);
        setCopiedCaptionIndex(null);
        setGeneratedFlashcards([]);

        try {
            const flashcards = await generateVocabularyImage(word.trim(), style, context.trim());
            setGeneratedFlashcards(flashcards);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [word, style, context]);
    
    useEffect(() => {
        if (wordToGenerate) {
            setWord(wordToGenerate);
        }
    }, [wordToGenerate]);

    useEffect(() => {
        if (contextToGenerate) {
            setContext(contextToGenerate);
        }
    }, [contextToGenerate]);

    useEffect(() => {
        if (wordToGenerate && wordToGenerate === word) {
            handleGenerate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wordToGenerate, word, handleGenerate]);


    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            handleGenerate();
        }
    };

    const handleCopyImage = async (imageUrl: string, index: number) => {
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                }),
            ]);

            setCopiedImageIndex(index);
            setTimeout(() => setCopiedImageIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy image: ', err);
            setError('Failed to copy image to clipboard. Your browser might not support this feature.');
        }
    };

    const handleCopyCaption = async (caption: GeneratedFlashcard['caption'], index: number) => {
        const escapeHtml = (text: string) => {
            const element = document.createElement('div');
            element.textContent = text;
            return element.innerHTML;
        };
    
        const captionHtml = `<details class="image-slot-caption">
    <summary>${escapeHtml(caption.partOfSpeech.toUpperCase())}</summary>
    <div>
        <p>${escapeHtml(caption.definition)}</p>
        <p><em>e.g., "${escapeHtml(caption.exampleSentence)}"</em></p>
    </div>
</details>`;
    
        try {
            await navigator.clipboard.writeText(captionHtml);
            setCopiedCaptionIndex(index);
            setTimeout(() => setCopiedCaptionIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy caption: ', err);
            setError('Failed to copy description to clipboard.');
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <ImageIcon className="w-6 h-6 text-sky-300" />
                <h3 className="text-lg font-semibold text-sky-300">Vocabulary Flashcard Generator</h3>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">
                Enter an English word to generate a flashcard. For phrasal verbs, it creates a 3-panel story.
            </p>

            <div className="mb-4">
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Artistic Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {styles.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStyle(s)}
                            disabled={isLoading}
                            className={`w-full text-sm font-semibold py-2 px-3 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                                style === s
                                ? 'bg-sky-600 text-white shadow-md'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <label htmlFor="context-input" className="text-sm font-semibold text-slate-300 mb-2 block">
                    Contexto (Opcional)
                </label>
                <textarea
                    id="context-input"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="A frase onde a palavra apareceu..."
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 p-2.5 h-20"
                    disabled={isLoading}
                />
                <p className="text-xs text-slate-400 mt-1">Fornecer a frase pode gerar uma imagem mais relevante.</p>
            </div>


            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., 'book', 'set up', 'look after'..."
                    className="flex-grow bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 p-2.5"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !word.trim()}
                    className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
                >
                    {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
            </div>

            {error && (
                <div className="mt-4 bg-red-900/50 border border-red-600 text-red-200 px-4 py-2 rounded-lg text-sm">
                    <p>{error}</p>
                </div>
            )}

            {isLoading && <ImageSkeleton />}

            {generatedFlashcards.length > 0 && !isLoading && (
                 <div className="mt-4">
                    <div className="flex overflow-x-auto space-x-6 pb-4 horizontal-scroll">
                        {generatedFlashcards.map((flashcard, index) => (
                            <div key={index} className="flex-shrink-0 w-11/12 sm:w-8/12 md:w-7/12 lg:w-1/2">
                                <div className="relative group">
                                    <img 
                                        src={flashcard.imageUrl} 
                                        alt={flashcard.altText}
                                        title={`${flashcard.caption.partOfSpeech}: ${flashcard.caption.expression} - ${flashcard.caption.shortMeaning}`}
                                        className="w-full h-auto max-h-[500px] object-contain bg-slate-900 rounded-lg border-2 border-slate-600"
                                    />
                                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={() => handleCopyImage(flashcard.imageUrl, index)}
                                            className="bg-slate-900/70 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-full transition-colors flex items-center gap-2 text-sm"
                                            aria-label="Copy image"
                                        >
                                            {copiedImageIndex === index ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                                            <span>{copiedImageIndex === index ? 'Copied' : 'Copy Img'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleCopyCaption(flashcard.caption, index)}
                                            className="bg-slate-900/70 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-full transition-colors flex items-center gap-2 text-sm"
                                            aria-label="Copy description"
                                        >
                                            {copiedCaptionIndex === index ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <BookIcon className="w-5 h-5" />}
                                            <span>{copiedCaptionIndex === index ? 'Copied' : 'Copy Desc.'}</span>
                                        </button>
                                        <a
                                            href={flashcard.imageUrl}
                                            download={flashcard.downloadFilename}
                                            className="bg-slate-900/70 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-full transition-colors flex items-center gap-2 text-sm"
                                            aria-label="Download image"
                                        >
                                        <DownloadIcon className="w-5 h-5" />
                                        <span>Download</span>
                                        </a>
                                    </div>
                                </div>
                                <figcaption className="mt-3 bg-slate-700/50 p-4 rounded-lg">
                                    <p className="text-xs font-bold uppercase tracking-wider text-sky-400">{flashcard.caption.partOfSpeech}</p>
                                    <p className="font-semibold text-slate-200 mt-1">{flashcard.caption.definition}</p>
                                    <p className="text-slate-400 mt-2 text-sm italic">e.g., "{flashcard.caption.exampleSentence}"</p>
                                </figcaption>
                            </div>
                        ))}
                    </div>
                    <style>{`
                        .horizontal-scroll::-webkit-scrollbar {
                            height: 8px;
                        }
                        .horizontal-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .horizontal-scroll::-webkit-scrollbar-thumb {
                            background-color: #475569; /* slate-600 */
                            border-radius: 10px;
                            border: 2px solid #1e293b; /* slate-800, matching card background */
                        }
                         .horizontal-scroll::-webkit-scrollbar-thumb:hover {
                            background-color: #64748b; /* slate-500 */
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};