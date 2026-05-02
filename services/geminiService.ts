
import { GoogleGenAI, Type } from "@google/genai";
import { Feedback, Difficulty, ComprehensiveWordData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper function to handle retries with exponential backoff, 
 * specifically targeting 429 (Rate Limit) errors.
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            // Check if it's a 429 error (Rate Limit)
            const isRateLimit = error?.message?.includes('429') || 
                                error?.status === 429 || 
                                error?.error?.code === 429 ||
                                error?.message?.includes('RESOURCE_EXHAUSTED');
            
            if (isRateLimit && i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

export async function generatePracticePhrase(difficulty: Difficulty): Promise<string> {
    let prompt = `Generate a single, common English sentence for an intermediate learner to practice shadowing. The sentence should be between 8 and 15 words long. Focus on natural, conversational English.`;

    switch (difficulty) {
        case 'Beginner':
            prompt = `Generate a single, simple English sentence for a beginner learner to practice shadowing. The sentence should be between 5 and 8 words long. Use basic, common vocabulary (A1/A2 level).`;
            break;
        case 'Advanced':
            prompt = `Generate a single, more complex English sentence for an advanced learner to practice shadowing. The sentence should be between 15 and 25 words long. Use nuanced vocabulary and a more complex grammatical structure, like a subordinate clause or passive voice.`;
            break;
        case 'Intermediate':
        default:
            // The default prompt is already set for Intermediate
            break;
    }

    const fullPrompt = `${prompt} Do not add any introductory text, quotation marks, or labels like "Here is a sentence:". Just return the sentence itself.`;
    
    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: fullPrompt,
            config: {
                temperature: 1,
                topP: 0.95,
            }
        }));
        return response.text.trim();
    } catch (error: any) {
        console.error("Error generating practice phrase:", error);
        if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("QUOTA_EXCEEDED: You've reached the API rate limit. Please wait a moment before trying again.");
        }
        throw new Error("Could not connect to the AI service.");
    }
}

export async function getPronunciationFeedback(targetPhrase: string, audioBase64: string, mimeType: string): Promise<Feedback> {
    const prompt = `You are an AI English pronunciation coach. The user is practicing the phrase: "${targetPhrase}".
    Analyze the user's attached audio recording.
    1. Transcribe the user's speech.
    2. Compare their pronunciation to a standard American English accent.
    3. Provide a score from 0 to 100 on overall accuracy.
    4. Identify any specific words from the original phrase that were mispronounced. If none, return an empty array.
    5. Provide one brief, encouraging sentence of positive feedback.
    6. Provide one brief, actionable tip for improvement.
    Respond ONLY with a JSON object in the specified schema. Be strict with the schema.`;

    try {
        const audioPart = {
            inlineData: {
                mimeType: mimeType,
                data: audioBase64,
            },
        };

        const textPart = {
            text: prompt
        };

        const response = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, audioPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "A score from 0 to 100." },
                        positiveFeedback: { type: Type.STRING, description: "A brief, encouraging sentence." },
                        improvementTip: { type: Type.STRING, description: "A brief, actionable tip for improvement." },
                        userTranscription: { type: Type.STRING, description: "A transcription of the user's speech." },
                        mispronouncedWords: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of words from the target phrase that the user mispronounced."
                        }
                    },
                    required: ["score", "positiveFeedback", "improvementTip", "userTranscription", "mispronouncedWords"]
                },
            }
        }));

        const jsonString = response.text.trim();
        const parsedFeedback = JSON.parse(jsonString);

        if (typeof parsedFeedback.score !== 'number' ||
            typeof parsedFeedback.positiveFeedback !== 'string' ||
            typeof parsedFeedback.improvementTip !== 'string' ||
            typeof parsedFeedback.userTranscription !== 'string' ||
            !Array.isArray(parsedFeedback.mispronouncedWords)) {
            throw new Error("Invalid feedback structure received from AI.");
        }

        return parsedFeedback;

    } catch (error: any) {
        console.error("Error getting pronunciation feedback:", error);
        if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("QUOTA_EXCEEDED: You've reached the API rate limit. Please wait a moment before trying again.");
        }
        if (error instanceof SyntaxError) {
             throw new Error("The AI returned an unexpected response. Please try again.");
        }
        throw new Error("Could not get feedback from the AI service.");
    }
}

export async function getComprehensiveWordData(word: string, template?: string, context?: string): Promise<ComprehensiveWordData> {
    const contextInstruction = context
        ? `The user provided this context sentence: "${context}". Please prioritize the meanings and expressions of "${word}" as used in this sentence.`
        : '';

    const ankiRulesSection = template
        ? `
        **Part 1: Generate Anki Card HTML**
        For the "ankiCardHtml" key, you MUST generate a complete HTML string. Follow these rules meticulously:

        You are an expert linguist and Anki card creator. Your task is to generate a detailed HTML Anki card for the English word: "${word}". The target language for translations is Brazilian Portuguese. All content you generate (conjugations, IPA, examples) MUST be based on **General American English**.

        **Step 1: Determine the Color Scheme**
        First, identify the primary grammatical category of the word "${word}". Choose a color scheme from the list below. If the word can belong to multiple common categories (e.g., 'book' as a noun and a verb), use the 'Mixed/Other' scheme.

        *   **Verb:** { main: '#28a745', bg: '#e9f5ec', shadow: 'rgba(40, 167, 69, 0.2)' }
        *   **Noun:** { main: '#ffc107', bg: '#fff8e1', shadow: 'rgba(255, 193, 7, 0.2)' }
        *   **Adjective:** { main: '#007bff', bg: '#e6f2ff', shadow: 'rgba(0, 123, 255, 0.2)' }
        *   **Adverb:** { main: '#fd7e14', bg: '#fff2e8', shadow: 'rgba(253, 126, 20, 0.2)' }
        *   **Pronoun:** { main: '#6f42c1', bg: '#f1eef8', shadow: 'rgba(111, 66, 193, 0.2)' }
        *   **Preposition/Conjunction:** { main: '#dc3545', bg: '#fcebec', shadow: 'rgba(220, 53, 69, 0.2)' }
        *   **Mixed/Other:** { main: '#6c757d', bg: '#f1f3f5', shadow: 'rgba(108, 117, 125, 0.2)' }

        **Step 2: Populate the HTML Template**
        Take the HTML template provided below and populate the 'ankiCardHtml' field with it.
        1.  Replace the color placeholders \\\`[--main-color]\\\`, \\\`[--bg-color]\\\`, and \\\`[--shadow-color]\\\` with the values from the color scheme you chose in Step 1.
        2.  Fill in all the other content placeholders like '[Word]', '[Definition 1]', etc., with the correct information for the word "${word}".

        **HTML Template to Use:**
        \`\`\`html
        ${template}
        \`\`\`
        (Rules for content and structure are detailed below and apply to filling this template)
        `
        : '';
    
    const prompt = `You are an AI assistant tasked with generating a comprehensive data package for the English word/phrase "${word}".
    ${contextInstruction}
    Your entire output MUST be a single, valid JSON object that strictly adheres to the provided schema.

    **Content Generation Rules:**

    ${ankiRulesSection}

    **Part 2: Generate Image Data**
    For the "imageData" key, you MUST provide a comprehensive analysis for the word "${word}". Your analysis must include four parts, populating the corresponding arrays in the JSON:
    1.  **Core Meanings ("meanings" array)**: Provide up to six of the most common and distinct meanings of the word "${word}" itself.
    2.  **Common Phrasal Verbs ("phrasalVerbs" array)**: Identify up to six of the most common and useful phrasal verbs that use "${word}".
    3.  **Common Collocations ("collocations" array)**: Identify up to six of the most common and useful collocations that feature "${word}".
    4.  **Common Idiomatic Expressions ("idioms" array)**: Identify up to six of the most common and useful idioms that feature "${word}".

    For EVERY item in all four arrays, you MUST provide all the fields specified in the JSON schema's "analysisItem" definition.
    - For core meanings of "${word}", the 'expression' field should just be "${word}".
    - For idioms, the 'partOfSpeech' field should be 'idiom'.
    - The 'visualSceneDescription' for phrasal verbs and idioms should describe a SINGLE, clear visual scene, NOT a multi-panel story.

    **CRITICAL: Overall Content and HTML Rules (Applies to both Anki Card and Image Data)**
    *   **HTML ONLY:** For the ankiCardHtml field, your entire output MUST be raw HTML. You MUST NOT use any markdown syntax (like \\\`**...**\\\` for bolding or \\\`*...*\\\` for italics). For highlighting text, always use the HTML \\\`<strong>\\\` tag. For italics, use the HTML \\\`<em>\\\` tag.
    *   **NEW RULE FOR CEFR LEVEL:** You MUST determine the word's CEFR level (A1, A2, B1, B2, C1, or C2). You will then populate the \`[CEFR Level]\` placeholder in the \`<h1>\` tag. The output for this placeholder MUST be a \`<span>\` tag containing two classes: \`cefr-level\` and a specific level class (e.g., \`cefr-a1\`, \`cefr-b2\`), and the level text itself. For example, for a B2 word, the placeholder should be replaced with \`<span class="cefr-level cefr-b2">B2</span>\`.
    *   **OVERARCHING CONTENT PHILOSOPHY:** Your top priority is to make the content feel like it was created by a passionate, expert teacher, not a dry dictionary. The goal is maximum utility and memorability for a language learner. To achieve this, draw upon well-established linguistic resources and real-world usage patterns to ensure all examples, expressions, and collocations are accurate, common, and contextually appropriate.
    *   **NEW RULE FOR GRAMMATICAL ABBREVIATIONS:** For the main title's '[Grammatical Category]' placeholder, you MUST use standard abbreviations: Verb (v.), Noun (n.), Adjective (adj.), Adverb (adv.), Pronoun (pron.), Preposition (prep.), Conjunction (conj.). For words with multiple common categories, list them separated by a slash (e.g., n./v.).
    *   **NEW RULE FOR TRANSLATION (VERY IMPORTANT):** The 'Translation' section is now highly structured. You must follow these steps precisely:
        1.  **Analyze for Pitfalls:** First, analyze the word "${word}" for common learner pitfalls. Is it a major false cognate with Brazilian Portuguese (e.g., 'actually' vs 'atualmente', 'pretend' vs 'pretender')? Is there a very common confusion (e.g., 'push' vs 'puxar')?
        2.  **Populate Translation Note:** If a pitfall is identified, you MUST populate the \`[Translation Note]\` placeholder with a styled \`<div>\`.
            *   For false cognates, use \`<div class="translation-note warning">⚠️ <strong>Falso Cognato:</strong> [Your explanation here]</div>\`.
            *   For other common tips, use \`<div class="translation-note tip">💡 <strong>Dica:</strong> [Your explanation here]</div>\`.
            *   The explanation must be clear, concise, and helpful. If no significant pitfall exists, leave the \`[Translation Note]\` placeholder empty.
        3.  **Populate Main Translation:** Identify the single most common and direct translation. Populate \`[Main Translation with POS]\` with this translation inside \`<strong>\` tags, followed immediately by a styled \`<span class="gram-cat gram-cat-...">\` for its grammatical category. Example for 'book': \`<strong>livro</strong><span class="gram-cat gram-cat-noun">n.</span>\`.
        4.  **Populate Other Translations:** Identify up to 4 other common, but secondary, translations. For each, create an \`<li>\` element for the placeholders \`[Other Translation 1]\`, etc. Inside the \`<li>\`, you MUST include:
            *   The translation in \`<strong>\` tags.
            *   Its styled grammatical category \`<span>\` tag.
            *   A \`<span class="context-note">\` containing a concise explanation of its context, nuance, or region in parentheses. Example: \`<li><strong>operar</strong><span class="gram-cat gram-cat-verb">v.</span><span class="context-note">(uma máquina)</span></li>\`.
            *   If there are no other translations, leave the corresponding \`<li>\` placeholders empty.
    *   **NEW RULE FOR DEFINITIONS (VERY IMPORTANT):** The definition section is now highly structured. For each definition (up to 5), you must generate and populate the following:
        1.  **Relevance & Highlighting:** If a context sentence is provided, you MUST identify the single most relevant definition. For that definition's list item, you MUST populate the \`[Relevant Class X]\` placeholder with the class name "definition-item relevant". For all other definitions, leave this placeholder empty.
        2.  **Grammatical Category:** Before each definition text, you MUST insert a \`<span>\` tag with the abbreviated grammatical category (e.g., n., v., adj.). This \`<span>\` MUST have two classes: \`gram-cat\` and the specific color class (e.g., \`gram-cat-noun\`). This is mandatory for every definition.
        3.  **Usage Tags:** You MUST identify if a definition is typically 'Formal', 'Informal', 'Slang', 'Technical', etc. Generate up to two of these tags for each definition. For each tag, create a styled \`<span>\`. For example, for a formal definition, you would generate \`<span class="usage-tag formal-tag">Formal</span>\`. Populate the \`[Usage Tags X]\` placeholder with these generated spans. If no tags apply, leave the placeholder empty.
        4.  **Synonyms & Antonyms:** For each specific definition, you MUST provide up to 5 relevant synonyms and up to 5 relevant antonyms. Populate the \`[Synonyms X]\` and \`[Antonyms X]\` placeholders with these words, separated by commas. If none are found, leave the placeholder empty.
    *   **NEW RULE FOR CONJUGATION (VERY IMPORTANT):** If the word is not a verb, you MUST omit the entire conjugation section. If the word IS a verb, follow these steps precisely:
        1.  Determine if the verb is regular or irregular. Populate the \\\`[regular/irregular]\\\` class placeholder with "regular" or "irregular", and the \\\`[Regular/Irregular]\\\` text placeholder with "Regular" or "Irregular".
        2.  The conjugation section is divided into three collapsible groups: "Essential Tenses", "Progressive & Perfect Tenses", and "Future, Passive & Moods".
        3.  You MUST populate the tables within these groups with the following verb forms:
            *   **Essential Tenses:** Infinitive, Simple Present, Simple Past, Past Participle, Gerund.
            *   **Progressive & Perfect Tenses:** Present Continuous, Past Continuous, Present Perfect, Past Perfect, Future Perfect.
            *   **Future, Passive & Moods:** Future with "will", Future with "going to", Passive Voice (Present), Imperative, Present Subjunctive.
        4.  For the **Simple Present** tense specifically, you MUST provide both the base form and the 3rd person singular form (e.g., "go / goes").
        5.  For **EVERY** single row in all three tables, you MUST provide a short, clear example sentence in the "Example" column that demonstrates the use of that specific tense or mood. You must populate all placeholders like \\\`[Infinitive Example]\\\`, \\\`[Past Continuous Example]\\\`, etc.
    *   **CRITICAL INTEGRITY CHECK (ANTI-HALLUCINATION):** 
        1.  **Context-First Accuracy:** If a context sentence is provided, you MUST verify that the word "${word}" in your analysis matches the SPECIFIC meaning used in that sentence. Do not provide generic definitions that contradict the context.
        2.  **Grammatical Consistency:** For every word in the \`analysis-table\`, you MUST double-check that the \`gram-cat\` matches its actual part of speech in THAT specific sentence (e.g., if "record" is a verb in the example, do not categorize it as a noun).
        3.  **IPA Verification:** IPA transcriptions MUST be for American English. Do not hallucinate phonetic symbols; use standard Brackets notation (e.g., /təˈmeɪtoʊ/) and apply realistic connected speech rules (Flap T, Schwa).
        4.  **CEFR Genuineness:** Only provide CEFR levels (A1-C2) that are linguistically recognized for the word "${word}" in its given context.
    *   **CRITICAL RULE FOR GRAMMATICAL ANALYSIS:** The "Detailed Grammatical Analysis" section MUST NOT be a simple list or block of text. It MUST be a structured HTML table with the class \`analysis-table\`.
        1.  The table MUST have a \`<thead>\` with headers: Word, IPA, Category, and Note/Role.
        2.  For EVERY word (and common punctuation/groups) in the specific example sentence, create a \`<tr>\`.
        3.  The "Word" column must use the class \`analysis-word\`.
        4.  The "IPA" column must use the class \`analysis-ipa\` and contain the individual word/cluster's transcription.
        5.  The "Category" column MUST contain the styled \`<span class="gram-cat gram-cat-...">\` tag.
        6.  The "Note/Role" column must use the class \`analysis-note\` and explain the word's specific contribution or syntactic role in THAT sentence (e.g., "Subject", "Main Verb", "Preposition of place", "Past tense marker").
    *   **CRITICAL RULE FOR EXAMPLE SENTENCES:** Each example requires a full translation, a single realistic American IPA transcription reflecting fast/informal speech (applying rules like Flap T, elision, linking), and the structured \`analysis-table\` described above.
    *   **NEW RULE FOR "SYNONYM STUDY" IN TIPS:** You MUST include a tip titled "🧠 Synonym Study" if the word "${word}" has close synonyms. Explain the subtle difference in usage or connotation (e.g., "Use 'tall' for people and buildings, use 'high' for elevation above sea level").
    *   **NEW RULE FOR "COMMON PITFALLS" IN TIPS:** You MUST include a tip titled "⚠️ Brazilians often say..." where you identify a specific, common mistake Brazilian learners make with this word (e.g., incorrect preposition, literal translation of a Portuguese idiom, or false cognate confusion).
    *   **NEW RULE FOR CONTEXTUAL INTELLIGENCE:** If a context sentence is provided, you MUST include a specific note in the "Tips & Curiosities" section explains why "${word}" is the most appropriate word for that specific sentence compared to alternatives.
    *   **NEW RULE FOR PHRASAL VERBS:** You MUST identify up to 5 of the most common and useful phrasal verbs for "${word}". For each one, populate the "Phrasal Verbs" section of the Anki card. You must provide a full example sentence where the phrasal verb is highlighted with the HTML \`<strong>\` tag. The nested details block must contain a full sentence translation, the phrasal verb itself, its translation, a clear explanation, and the structured \`analysis-table\`.
    *   **NEW RULE FOR IDIOMS & SLANG:** You MUST identify up to 5 of the most common and useful idioms or slang expressions for "${word}". For each one, populate the "Idioms & Slang" section of the Anki card. You must provide a full example sentence where the idiom is highlighted with the HTML \\\`<strong>\\\` tag. The nested details block must contain a full sentence translation, the idiom/slang itself, its translation, a clear explanation, and the structured \\\`analysis-table\\\`.
    *   **CRITICAL RULE FOR COLLOCATIONS:** The example sentence must highlight ONLY the collocation itself with the HTML \\\`<strong>\\\` tag. The nested details block must contain a full sentence translation, the collocation itself, its translation, a clear explanation, and the structured \\\`analysis-table\\\`.
    *   **NEW RULE FOR RELATED WORDS:** For each related word, you must provide its American IPA, its Brazilian Portuguese translation, and a concise explanation of the nuance/difference. You MUST ALSO populate the corresponding \\\`[Related Word X CEFR & Rec]\\\` placeholder. To do this, you MUST first determine the word's CEFR level and generate a styled \\\`<span>\\\` tag (e.g., \\\`<span class="cefr-level cefr-b1">B1</span>\\\`). Then, if the word is particularly common or useful for learners, you MUST also add a 'Recommended' tag like this: \\\`<span class="recommended-tag">⭐ Recommended</span>\\\`. Both tags should be placed in the placeholder. If a word is not recommended, only include the CEFR tag. If the CEFR level cannot be determined, leave the placeholder empty.
    *   **NEW RULE FOR TIPS/CURIOSITIES (VERY IMPORTANT):** This section is mandatory and must be highly visual and informative. For each tip, you MUST start the list item with a relevant emoji to categorize it. You MUST include tips covering the following topics, if applicable to the word "${word}":
        *   **🏛️ Etymology:** A brief, interesting fact about the word's origin (e.g., from Latin, Old French).
        *   **🇬🇧 vs. 🇺🇸 Regional Variations:** Differences in vocabulary or usage between American and British English.
        *   **⚠️ Common Pitfalls:** Focus on false cognates with Brazilian Portuguese, common preposition mistakes, or frequent learner errors.
        *   **🌳 Word Family & Derivation:** Show related words (nouns, verbs, adjectives, adverbs).
        *   **🔊 Confusingly Similar Words:** Discuss homophones or other words that sound or look similar.
        *   **⚖️ Context of Use:** Explain if the word is more formal, informal, slang, etc.
        *   **📈 Comparatives & Superlatives:** If the word is an adjective or adverb, explain how to form them.
        *   **🔎 Verb Analysis:** If it's a verb, analyze its type (regular/irregular, transitive/intransitive).
        *   **✍️ Grammar Notes:** Provide automatic grammatical tips based on the example sentences you generated.
    *   **Handle Missing Content:** Strive to provide all 5 items for lists (Definitions, Examples, Collocations, Phrasal Verbs, Idioms, Related Words, Tips). If no items are found for a specific list (e.g., no phrasal verbs), you MUST omit the entire parent \\\`<div class="anki-section">\` for that section in the Anki HTML. For image data, return empty arrays if no relevant phrasal verbs, collocations, or idioms are found.
`;

    const analysisItemSchema = {
        type: Type.OBJECT,
        properties: {
            expression: { type: Type.STRING, description: "The word, phrasal verb, collocation, or idiom itself." },
            partOfSpeech: { type: Type.STRING },
            shortMeaning: { type: Type.STRING, description: "A 2-3 word summary." },
            definition: { type: Type.STRING },
            exampleSentence: { type: Type.STRING },
            visualSceneDescription: { type: Type.STRING, description: "A detailed scene for an illustrator." }
        },
        required: ["expression", "partOfSpeech", "shortMeaning", "definition", "exampleSentence", "visualSceneDescription"]
    };

    const responseSchema: any = {
        type: Type.OBJECT,
        properties: {
            imageData: {
                type: Type.OBJECT,
                description: "An object containing arrays of data points used to generate illustrative images.",
                properties: {
                    meanings: { type: Type.ARRAY, items: analysisItemSchema },
                    phrasalVerbs: { type: Type.ARRAY, items: analysisItemSchema },
                    collocations: { type: Type.ARRAY, items: analysisItemSchema },
                    idioms: { type: Type.ARRAY, items: analysisItemSchema }
                },
                required: ["meanings", "phrasalVerbs", "collocations", "idioms"]
            }
        },
        required: ["imageData"]
    };
    
    if (template) {
        responseSchema.properties.ankiCardHtml = {
            type: Type.STRING,
            description: "A string containing the complete, raw HTML for an Anki card. This MUST be generated by following all the rules below and populating the provided HTML template."
        };
        responseSchema.required.push("ankiCardHtml");
    }

    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
             config: {
                temperature: 0.7,
                topP: 0.95,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        }));

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);

        // Ensure the structure is correct, providing defaults if parts are missing
        const finalData: ComprehensiveWordData = {
            ankiCardHtml: parsedData.ankiCardHtml || '',
            imageData: {
                meanings: parsedData.imageData?.meanings || [],
                phrasalVerbs: parsedData.imageData?.phrasalVerbs || [],
                collocations: parsedData.imageData?.collocations || [],
                idioms: parsedData.imageData?.idioms || [],
            }
        };

        return finalData;

    } catch (error: any) {
        console.error("Error generating comprehensive word data:", error);
        if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("QUOTA_EXCEEDED: You've reached the API rate limit. Please wait a moment before trying again.");
        }
         if (error instanceof SyntaxError) {
             throw new Error("The AI returned an invalid JSON response. Please try again.");
        }
        throw new Error("Could not generate comprehensive data from the AI service.");
    }
}

export async function generateProgrammingCard(topic: string, context: string, frontTemplate: string, backTemplate: string): Promise<{ front: string, back: string }> {
    const prompt = `
    You are a Technical Educator creating objective Anki flashcards.
    Your task is to generate a concise, "Front/Back" style Anki card for the programming concept: "${topic}" ${context ? `in the context of ${context}` : ''}.

    **Objective:**
    Instead of a long article, create a direct QUESTION for the front and a direct ANSWER for the back.

    **Language Rule:**
    The Question and Answer must be in **Brazilian Portuguese**.
    The Example description must also be in **Brazilian Portuguese**.
    The code, keywords, and technical standard terms must be in **English**.

    **Content Requirements:**
    1.  **[Question]**: Create a specific, challenging question about the concept. (e.g., "What does the command 'ls -l' do?" or "How do you create a list in Python?").
    2.  **[Answer]**: Provide a concise, direct explanation (max 2 sentences).
    3.  **[Example]**: A brief, one-sentence description of the code example (e.g. "Listing all text files" or "Listando todos os arquivos de texto"). This text explains what the code below is doing.
    4.  **[Code]**: Provide a minimal, realistic code snippet that demonstrates the concept.
    
    **Instructions:**
    You are provided with two HTML templates: Front and Back.
    You MUST strict populate both placeholders:
    - [Topic] -> The main topic name.
    - [Language/Context] -> The context (e.g., Python, Linux).
    - [Question] -> The generated question.
    - [Answer] -> The generated short answer.
    - [Example] -> The generated example description.
    - [Code] -> The generated code snippet wrapped in <pre><code>.

    **Code Styling:**
    Simulate syntax highlighting in the [Code] section by wrapping keywords, strings, etc., in <span class="hl-keyword">, <span class="hl-string">, <span class="hl-function">, <span class="hl-comment">.

    **Templates to Fill:**
    FRONT_TEMPLATE:
    \`\`\`html
    ${frontTemplate}
    \`\`\`

    BACK_TEMPLATE:
    \`\`\`html
    ${backTemplate}
    \`\`\`

    **Response:**
    Return ONLY a JSON object with two properties: "front" and "back".
    `;
    
    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                temperature: 0.4, 
                topP: 0.95,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        front: { type: Type.STRING, description: "The populated HTML for the front of the card." },
                        back: { type: Type.STRING, description: "The populated HTML for the back of the card." }
                    },
                    required: ["front", "back"]
                }
            }
        }));

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);
        return { front: parsedData.front, back: parsedData.back };

    } catch (error: any) {
        console.error("Error generating programming card:", error);
        if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("QUOTA_EXCEEDED: You've reached the API rate limit. Please wait a moment before trying again.");
        }
        throw new Error("Could not generate programming card from the AI service.");
    }
}
