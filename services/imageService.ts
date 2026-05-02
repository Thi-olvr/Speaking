import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordMeaning, WordAnalysis } from '../types';
import { getComprehensiveWordData, withRetry } from './geminiService';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Estrutura de dados para um único flashcard gerado
export interface GeneratedFlashcard {
    imageUrl: string;
    downloadFilename: string;
    altText: string;
    caption: {
        partOfSpeech: string;
        expression: string;
        shortMeaning: string;
        definition: string;
        exampleSentence: string;
    };
}

// Internal function to get meaning for a standalone phrasal verb
async function getPhrasalVerbMeaningForStory(phrasalVerb: string, context?: string): Promise<WordMeaning> {
    const contextInstruction = context
        ? `The user provided this context sentence: "${context}". Ensure the definition, example, and visual story all align with the meaning of "${phrasalVerb}" in that sentence.`
        : '';
        
    const prompt = `
    You are an English teacher creating educational content. For the phrasal verb "${phrasalVerb}", provide its single most common idiomatic meaning.
    ${contextInstruction}
    Provide:
    1. partOfSpeech: 'phrasal verb'.
    2. shortMeaning: A 2-3 word summary.
    3. definition: A concise definition.
    4. exampleSentence: A simple example sentence.
    5. visualSceneDescription: A detailed, 3-step story for a 3-panel cartoon explaining the meaning.
    Respond strictly with a JSON object.`;

    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        partOfSpeech: { type: Type.STRING },
                        shortMeaning: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        exampleSentence: { type: Type.STRING },
                        visualSceneDescription: { type: Type.STRING, description: "A 3-step story for a 3-panel cartoon." },
                    },
                    required: ["partOfSpeech", "shortMeaning", "definition", "exampleSentence", "visualSceneDescription"]
                }
            }
        }));

        const result = JSON.parse(response.text);
        return result;
    } catch (error: any) {
        console.error("Error getting phrasal verb meaning:", error);
        if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("QUOTA_EXCEEDED: You've reached the API rate limit. Please wait a moment before trying again.");
        }
        throw error;
    }
}


function buildMultiMeaningImagePrompt(word: string, meanings: WordMeaning[], style: string, context?: string): string {
    const panelCount = meanings.length;
    if (panelCount === 0) return '';

    const panelLayouts: { [key: number]: string } = {
        1: 'a single-panel illustration',
        2: 'an image split vertically into two panels',
        3: 'an image split into three horizontal panels',
        4: 'an image split into a 2x2 grid of four panels',
        5: 'an image split into five panels, with a larger central panel surrounded by four smaller corner panels',
        6: 'an image split into a 3x2 grid of six panels',
    };
    const layout = panelLayouts[panelCount] || `an image split into a grid of ${panelCount} panels`;
    const contextInstruction = context ? `CRITICAL CONTEXT: The word appeared in "${context}". The illustration MUST reflect this specific context.` : '';

    let panelSections = meanings.map((meaning, index) => `
Panel ${index + 1} Scene:
- Title for this panel: "${meaning.shortMeaning}"
- Visual Description: ${meaning.visualSceneDescription}
`).join('');

    return `
Create ${layout} in a **${style}** style. This image is a flashcard to teach English.
The main word "${word.toUpperCase()}" must be at the top of the entire image.
Each panel must visually represent a different meaning of "${word.toUpperCase()}" and have its corresponding title written inside it.
NO other text should be on the image.
`;
}

function buildPhrasalVerbStoryImagePrompt(phrasalVerb: string, meaning: WordMeaning, style: string, context?: string): string {
    const contextInstruction = context ? `CRITICAL CONTEXT: The expression appeared in "${context}". The story MUST visually represent the meaning within that context.` : '';

    return `
Create a three-panel illustration telling a story to explain the phrasal verb "${phrasalVerb.toUpperCase()}". The style is **${style}**. ${contextInstruction}
The main title must be "PHRASAL VERB: ${phrasalVerb.toUpperCase()}". Below it, add a smaller subtitle: "${meaning.shortMeaning}".
NO other text should be in the image. The panels should be purely visual.
Story for the 3 Panels:
${meaning.visualSceneDescription}
`;
}

function buildAllPhrasalVerbsImagePrompt(word: string, phrasalVerbs: (WordMeaning & { expression: string })[], style: string): string {
    const panelCount = phrasalVerbs.length;
    if (panelCount === 0) return '';

    const panelLayouts: { [key: number]: string } = {
        1: 'a single-panel illustration',
        2: 'an image split vertically into two panels',
        3: 'an image split into three horizontal panels',
        4: 'an image split into a 2x2 grid of four panels',
        5: 'an image split into five panels, with a larger central panel surrounded by four smaller corner panels',
        6: 'an image split into a 3x2 grid of six panels',
    };

    const layout = panelLayouts[panelCount] || `an image split into a grid of ${panelCount} panels`;

    const panelDescriptions = phrasalVerbs.map((pv, index) => {
        return `Panel ${index + 1}: Illustrates "${pv.expression}". Scene: ${pv.visualSceneDescription.replace(/Panel \d+:/g, '').trim()}`;
    }).join('\n');

    return `
Create ${layout} in a **${style}** style. This image is a flashcard to teach English phrasal verbs.
The main title at the top of the entire image must be "PHRASAL VERBS with '${word.toUpperCase()}'".
Each panel must have the specific phrasal verb (e.g., "${phrasalVerbs[0].expression}") written clearly inside it as a sub-title.
NO other text should be on the image. The panels should be purely visual representations of the scenes described below.

Panel Descriptions:
${panelDescriptions}
`;
}

function buildAllCollocationsImagePrompt(word: string, collocations: (WordMeaning & { expression: string })[], style: string): string {
    const panelCount = collocations.length;
    if (panelCount === 0) return '';

    const panelLayouts: { [key: number]: string } = {
        1: 'a single-panel illustration',
        2: 'an image split vertically into two panels',
        3: 'an image split into three horizontal panels',
        4: 'an image split into a 2x2 grid of four panels',
        5: 'an image split into five panels, with a larger central panel surrounded by four smaller corner panels',
        6: 'an image split into a 3x2 grid of six panels',
    };

    const layout = panelLayouts[panelCount] || `an image split into a grid of ${panelCount} panels`;

    const panelDescriptions = collocations.map((col, index) => {
        return `Panel ${index + 1}: Illustrates "${col.expression}". Scene: ${col.visualSceneDescription.replace(/Panel \d+:/g, '').trim()}`;
    }).join('\n');

    return `
Create ${layout} in a **${style}** style. This image is a flashcard to teach English collocations.
The main title at the top of the entire image must be "COLLOCATIONS with '${word.toUpperCase()}'".
Each panel must have the specific collocation (e.g., "${collocations[0].expression}") written clearly inside it as a sub-title.
NO other text should be on the image. The panels should be purely visual representations of the scenes described below.

Panel Descriptions:
${panelDescriptions}
`;
}

function buildAllIdiomsImagePrompt(word: string, idioms: (WordMeaning & { expression: string })[], style: string): string {
    const panelCount = idioms.length;
    if (panelCount === 0) return '';

    const panelLayouts: { [key: number]: string } = {
        1: 'a single-panel illustration',
        2: 'an image split vertically into two panels',
        3: 'an image split into three horizontal panels',
        4: 'an image split into a 2x2 grid of four panels',
        5: 'an image split into five panels, with a larger central panel surrounded by four smaller corner panels',
        6: 'an image split into a 3x2 grid of six panels',
    };

    const layout = panelLayouts[panelCount] || `an image split into a grid of ${panelCount} panels`;

    const panelDescriptions = idioms.map((idiom, index) => {
        return `Panel ${index + 1}: Illustrates "${idiom.expression}". Scene: ${idiom.visualSceneDescription.replace(/Panel \d+:/g, '').trim()}`;
    }).join('\n');

    return `
Create ${layout} in a **${style}** style. This image is a flashcard to teach English idiomatic expressions.
The main title at the top of the entire image must be "IDIOMS with '${word.toUpperCase()}'".
Each panel must have the specific idiom (e.g., "${idioms[0].expression}") written clearly inside it as a sub-title.
NO other text should be on the image. The panels should be purely visual representations of the scenes described below.

Panel Descriptions:
${panelDescriptions}
`;
}


const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        }));

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Image data was not found in the AI response.");
    } catch (error: any) {
        console.error("Error generating image from prompt:", error);
        if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("QUOTA_EXCEEDED: You've reached the API rate limit. Please wait a moment before trying again.");
        }
        throw error;
    }
};

const generateFlashcardData = async (
    prompt: string, 
    meaningData: WordMeaning & { expression?: string },
    type: string
): Promise<GeneratedFlashcard> => {
    const imageUrl = await generateImageFromPrompt(prompt);
    const expression = meaningData.expression || type;
    const filename = `${meaningData.partOfSpeech.replace(/\s+/g, '_')}-${expression.replace(/\s+/g, '_')}-${meaningData.shortMeaning.replace(/\s+/g, '_')}.png`.toLowerCase();
    
    return {
        imageUrl,
        downloadFilename: filename,
        altText: meaningData.visualSceneDescription,
        caption: {
            partOfSpeech: meaningData.partOfSpeech,
            expression: expression,
            shortMeaning: meaningData.shortMeaning,
            definition: meaningData.definition,
            exampleSentence: meaningData.exampleSentence,
        },
    };
};


export async function generateVocabularyImagesFromAnalysis(word: string, analysis: WordAnalysis, style: string, context?: string): Promise<GeneratedFlashcard[]> {
    const { meanings, phrasalVerbs, collocations, idioms } = analysis;

    if (meanings.length === 0 && phrasalVerbs.length === 0 && collocations.length === 0 && (!idioms || idioms.length === 0)) {
        throw new Error(`Could not find any meanings, phrasal verbs, collocations, or idioms for "${word}".`);
    }

    const generationPromises: Promise<GeneratedFlashcard>[] = [];

    // 1. Generate the main meanings collection image (1-6 panels)
    if (meanings.length > 0) {
        const prompt = buildMultiMeaningImagePrompt(word, meanings, style, context);
        const compositeMeaning: WordMeaning & {expression: string} = {
            expression: word,
            partOfSpeech: `Word with ${meanings.length > 1 ? 'Multiple Meanings' : 'Meaning'}`,
            shortMeaning: meanings.map(m => m.shortMeaning).join(' / '),
            definition: meanings.map((m, i) => `${i+1}. ${m.definition}`).join(' '),
            exampleSentence: meanings[0].exampleSentence, // Use first example
            visualSceneDescription: `A flashcard illustrating ${meanings.length} meanings for the word '${word}'. ${meanings.map((m,i) => `Panel ${i+1}: ${m.visualSceneDescription}`).join(' ')}`,
        };
        generationPromises.push(generateFlashcardData(prompt, compositeMeaning, word));
    }

    // 2. Generate the phrasal verb collection image
    if (phrasalVerbs.length > 0) {
        const prompt = buildAllPhrasalVerbsImagePrompt(word, phrasalVerbs, style);
        const compositeMeaning: WordMeaning & {expression: string} = {
            expression: `Phrasal Verbs with '${word}'`,
            partOfSpeech: `Phrasal Verb Collection`,
            shortMeaning: phrasalVerbs.map(pv => pv.expression).join(', '),
            definition: phrasalVerbs.map((pv, i) => `${i + 1}. ${pv.expression} - ${pv.definition}`).join(' '),
            exampleSentence: phrasalVerbs[0].exampleSentence, // Use first example
            visualSceneDescription: `An illustration showing multiple phrasal verbs for '${word}': ${phrasalVerbs.map(pv => pv.expression).join(', ')}.`,
        };
        generationPromises.push(generateFlashcardData(prompt, compositeMeaning, word));
    }

    // 3. Generate the collocation collection image
    if (collocations.length > 0) {
        const prompt = buildAllCollocationsImagePrompt(word, collocations, style);
        const compositeMeaning: WordMeaning & {expression: string} = {
            expression: `Collocations with '${word}'`,
            partOfSpeech: `Collocation Collection`,
            shortMeaning: collocations.map(c => c.expression).join(', '),
            definition: collocations.map((c, i) => `${i + 1}. ${c.expression} - ${c.definition}`).join(' '),
            exampleSentence: collocations[0].exampleSentence, // Use first example
            visualSceneDescription: `An illustration showing multiple collocations for '${word}': ${collocations.map(c => c.expression).join(', ')}.`,
        };
        generationPromises.push(generateFlashcardData(prompt, compositeMeaning, word));
    }
    
    // 4. Generate the idiom collection image
    if (idioms && idioms.length > 0) {
        const prompt = buildAllIdiomsImagePrompt(word, idioms, style);
        const compositeMeaning: WordMeaning & {expression: string} = {
            expression: `Idioms with '${word}'`,
            partOfSpeech: `Idiom Collection`,
            shortMeaning: idioms.map(i => i.expression).join(', '),
            definition: idioms.map((i, index) => `${index + 1}. ${i.expression} - ${i.definition}`).join(' '),
            exampleSentence: idioms[0].exampleSentence, // Use first example
            visualSceneDescription: `An illustration showing multiple idioms for '${word}': ${idioms.map(i => i.expression).join(', ')}.`,
        };
        generationPromises.push(generateFlashcardData(prompt, compositeMeaning, word));
    }

    if (generationPromises.length === 0) {
         throw new Error("Could not generate any image prompts from the analysis.");
    }

    return await Promise.all(generationPromises);
}

export async function generateVocabularyImage(word: string, style: string, context?: string): Promise<GeneratedFlashcard[]> {
    try {
        const isPhrasalVerb = word.trim().includes(' ');
        
        if (isPhrasalVerb) {
            // Special case for generating a 3-panel story for a single phrasal verb
            const meaning = await getPhrasalVerbMeaningForStory(word, context);
            if (!meaning) throw new Error("Could not find a meaning for this phrasal verb.");
            const prompt = buildPhrasalVerbStoryImagePrompt(word, meaning, style, context);
            const flashcardData = await generateFlashcardData(prompt, { ...meaning, expression: word }, word);
            return [flashcardData];
        } else {
            // Standard flow using the comprehensive data fetch
            const { imageData } = await getComprehensiveWordData(word, undefined, context);
            return await generateVocabularyImagesFromAnalysis(word, imageData, style, context);
        }

    } catch (error: any) {
        console.error("Error generating vocabulary image:", error);
        if (error?.message?.includes('QUOTA_EXCEEDED')) {
            throw error;
        }
        if (error instanceof Error) {
            throw new Error(`Failed to generate image. ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
}