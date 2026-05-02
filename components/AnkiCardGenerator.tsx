import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getComprehensiveWordData } from '../services/geminiService';
import { AnkiIcon } from './icons/AnkiIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { EyeIcon } from './icons/EyeIcon';

const ANKI_CARD_TEMPLATE = `<style>
    /* --- GERAL & RESPONSIVIDADE --- */
    @media (max-width: 640px) {
        .anki-card-container {
            max-width: 90vw !important;
            padding: 12px !important;
        }
        .anki-card-container h1 { font-size: 22px !important; }
        .anki-card-container h2 { font-size: 18px !important; }
        .table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            margin-top: 5px;
        }
        .anki-table th, .anki-card-container .anki-table td {
            padding: 6px !important;
            font-size: 12px !important;
            white-space: nowrap;
        }
        .anki-card-container .details-box, .anki-card-container .details-inner {
            padding: 8px !important;
        }
        .anki-card-container .details-box > summary {
            padding: 8px !important;
            margin: -8px !important;
        }
    }

    /* --- ESTRUTURA PRINCIPAL --- */
    .anki-card-container {
        background: #ffffff;
        border-radius: 10px;
        padding: 20px;
        max-width: 600px;
        margin: auto;
        box-shadow: 0px 4px 12px var(--shadow-color);
        text-align: center;
        font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        color: #333;
        border: 1px solid var(--main-color);
    }
    .anki-section {
        text-align: left;
        margin-top: 15px;
    }
    .divider {
        border-top: 1px solid #eee;
        margin: 15px 0;
    }
    .anki-card-container h1 {
        font-size: 26px;
        color: var(--main-color);
        margin-bottom: 10px;
    }
    .anki-card-container h2 {
        font-size: 20px;
        color: #333;
        margin-bottom: 5px;
    }
    .anki-card-container p {
        font-size: 16px;
        line-height: 1.5;
    }
    .anki-card-container ul {
        padding-left: 0;
        list-style-type: none;
        font-size: 16px;
        line-height: 1.5;
        margin-top: 10px;
    }

    /* --- COMPONENTES ESPECÍFICOS --- */
    .cefr-level {
        display: inline-block;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: bold;
        border-radius: 12px;
        color: #fff;
        margin-left: 10px;
        vertical-align: middle;
        border: 1px solid rgba(0,0,0,0.1);
        text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
    }
    .cefr-a1 { background-color: #4caf50; } /* Green */
    .cefr-a2 { background-color: #8bc34a; } /* Light Green */
    .cefr-b1 { background-color: #2196f3; } /* Blue */
    .cefr-b2 { background-color: #ff9800; } /* Orange */
    .cefr-c1 { background-color: #f44336; } /* Red */
    .cefr-c2 { background-color: #9c27b0; } /* Purple */
    
    .recommended-tag {
        display: inline-block;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: bold;
        border-radius: 12px;
        color: #fff;
        background-color: #6f42c1; /* Purple */
        margin-left: 8px;
        vertical-align: middle;
        border: 1px solid rgba(0,0,0,0.1);
        text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
    }

    /* --- TRANSLATION SECTION --- */
    .translation-note {
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 12px;
        font-size: 14px;
        line-height: 1.5;
        text-align: left;
    }
    .translation-note.warning {
        background-color: #fffbe6;
        border: 1px solid #ffe58f;
        color: #8a6d3b;
    }
    .translation-note.tip {
        background-color: #e6f7ff;
        border: 1px solid #91d5ff;
        color: #0056b3;
    }
    .translation-block {
        text-align: left;
    }
    .main-translation {
        font-size: 20px;
        font-weight: bold;
        color: var(--main-color);
        margin: 0;
    }
    .main-translation .gram-cat {
        margin-left: 8px;
        font-size: 13px;
        vertical-align: middle;
    }
    .other-translations {
        margin-top: 10px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
    }
    .other-translations summary {
        cursor: pointer;
        padding: 8px 12px;
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        outline: none;
    }
    .other-translations ul {
        padding: 0 12px 12px;
        margin: 0;
    }
    .other-translations li {
        padding: 6px 0;
        font-size: 15px;
        border-top: 1px solid #e9ecef;
    }
    .other-translations li:first-child {
        border-top: none;
    }
    .other-translations li .gram-cat {
        margin: 0 6px;
    }
    .other-translations li .context-note {
        color: #6c757d;
        font-style: italic;
        font-size: 13px;
    }

    .pronunciation-text {
        font-size: 18px;
        font-weight: bold;
        color: #00796b;
    }
    .example-ipa {
        font-size: 14px;
        font-weight: 500;
        color: #dc3545;
        padding-left: 10px;
    }
    .related-word-ipa {
        font-size: 14px;
        font-weight: 500;
        color: #00796b;
        margin: 2px 0 5px 5px;
    }
    .ipa-details {
      padding: 5px 0 0 10px;
    }
    .ipa-details p {
      margin: 4px 0;
      font-size: 14px;
    }
    .color-legend {
        font-size: 13px;
        color: #555;
        padding: 8px;
        border: 1px solid #eee;
        border-radius: 6px;
        margin-top: 10px;
        text-align: left;
    }
    .color-legend ul {
        list-style-type: none;
        padding-left: 0;
        margin: 5px 0 0 0;
    }
    .color-legend li {
        margin-bottom: 4px;
    }

    /* --- DEFINITION SECTION --- */
    .definition-item {
        padding: 12px;
        border-radius: 6px;
        background: #f8f9fa;
        margin-bottom: 10px;
        border-left: 4px solid #dee2e6;
        transition: all 0.2s ease-in-out;
    }
    .definition-item.relevant {
        background: var(--bg-color);
        border-left: 4px solid var(--main-color);
        box-shadow: 0 2px 8px var(--shadow-color);
    }
    .definition-item.relevant::before {
        content: '⭐ Relevant Meaning';
        font-size: 11px;
        font-weight: bold;
        color: var(--main-color);
        display: block;
        margin-bottom: 8px;
        letter-spacing: 0.5px;
    }
    .usage-tags-container {
        display: inline-block;
        margin-left: 8px;
    }
    .usage-tag {
        display: inline-block;
        font-size: 11px;
        padding: 2px 7px;
        border-radius: 10px;
        font-weight: 500;
        margin: 0 4px;
        border: 1px solid;
    }
    .formal-tag { color: #007bff; background-color: #e6f2ff; border-color: #b3d7ff; }
    .informal-tag { color: #28a745; background-color: #e9f5ec; border-color: #a3d9b1; }
    .slang-tag { color: #fd7e14; background-color: #fff2e8; border-color: #fecba1; }
    .technical-tag { color: #6c757d; background-color: #f1f3f5; border-color: #d6dbdf; }
    
    .syn-ant-box {
        margin-top: 10px;
        background: #fff;
        border: 1px solid #e9ecef;
        border-radius: 4px;
    }
    .syn-ant-box > summary {
        cursor: pointer;
        padding: 6px 10px;
        font-size: 13px;
        font-weight: 500;
        color: #495057;
        outline: none;
    }
    .syn-ant-content {
        padding: 0px 12px 12px;
        font-size: 14px;
    }
    .syn-ant-content p {
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    .syn-ant-content strong {
        color: #00796b; /* Teal */
    }
    .syn-ant-content em {
        color: #c82333; /* Red */
        font-style: normal;
    }

    /* --- LISTAS --- */
    .item-list li > strong { font-style: italic; }
    .tips-list li {
        margin-bottom: 10px;
        background: #f8f9fa;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid var(--main-color);
        line-height: 1.5;
    }

    /* --- SEÇÃO DE CONJUGAÇÃO --- */
    .verb-type-tag {
        display: inline-block;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: bold;
        border-radius: 12px;
        color: #fff;
        margin: 0 5px;
        vertical-align: middle;
        border: 1px solid rgba(0,0,0,0.1);
        text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
    }
    .verb-type-regular { background-color: #28a745; }
    .verb-type-irregular { background-color: #ffc107; color: #212529; }
    .conjugation-wrapper {
        transition: all 0.3s ease;
    }
    .conjugation-group {
        margin-top: 10px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 10px;
    }
    .conjugation-group summary {
        font-weight: bold;
        font-size: 16px;
        cursor: pointer;
        outline: none;
        color: #495057;
    }
    .conjugation-group > .table-wrapper {
        margin-top: 8px;
    }
    
    /* --- TABELA DE CONJUGAÇÃO --- */
    .anki-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #ddd;
        margin-top: 10px;
    }
    .anki-table thead tr { background-color: #f2f2f2; }
    .anki-table tbody tr:hover { background-color: #e9ecef; }
    /* Essential Tenses */
    .anki-table .tense-infinitive { background-color: #f3f4f6; } /* gray */
    .anki-table .tense-present   { background-color: #fefce8; } /* yellow */
    .anki-table .tense-past      { background-color: #fef2f2; } /* red */
    .anki-table .tense-participle{ background-color: #f0fdf4; } /* green */
    .anki-table .tense-gerund    { background-color: #f5f3ff; } /* purple */
     /* Advanced Tenses */
    .anki-table .tense-present-continuous { background-color: #ecfeff; } /* cyan */
    .anki-table .tense-present-perfect { background-color: #eef2ff; } /* indigo */
    .anki-table .tense-future-simple { background-color: #fff7ed; } /* orange */
    
    .anki-table th {
        text-align: left;
        color: #333;
        font-size: 16px;
        padding: 8px;
        border: 1px solid #ddd;
    }
    .anki-table td {
        color: #333;
        font-size: 14px;
        padding: 8px;
        border: 1px solid #ddd;
    }
    .anki-table td:last-child {
      font-style: italic;
      color: #555;
      font-size: 13px;
    }

    /* --- CAIXAS EXPANSÍVEIS (DETAILS/SUMMARY) --- */
    .toggle-summary::-webkit-details-marker { display: none; }
    .toggle-summary { list-style: none; outline: none; }
    .toggle-summary::after {
        content: ' ▶';
        display: inline-block;
        transition: transform 0.2s;
        font-size: 0.8em;
        vertical-align: middle;
    }
    details[open] > .toggle-summary::after { content: ' ▼'; }
    
    .details-box {
        background: var(--bg-color);
        padding: 10px;
        border-radius: 8px;
    }
    details .content-wrapper {
        overflow: hidden;
        transition: max-height 0.3s ease-out;
    }
    .details-box > summary {
        cursor: pointer;
        font-weight: bold;
        font-size: 20px;
        color: #333;
        padding: 5px;
        margin: -5px;
    }
    details.details-box[open] > summary {
        margin-bottom: 10px;
    }

    .details-inner {
        margin-top: 5px;
        background: #fff;
        padding: 5px;
        border-radius: 5px;
        border: 1px solid #eee;
    }
    .details-inner > summary {
        font-size: 14px;
        color: #555;
        cursor: pointer;
        font-weight: normal;
        padding: 5px;
        margin: -5px;
    }
    .details-inner p {
        font-size: 14px;
        color: #333;
        padding: 5px 0 0 10px;
    }
    
    /* --- ANÁLISE DETALHADA ANINHADA --- */
    .details-analysis {
        margin-top: 10px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 10px;
    }
    .details-analysis > summary {
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        color: #495057;
        outline: none;
        list-style: none;
    }
    .details-analysis > summary::-webkit-details-marker { display: none; }
    .details-analysis > summary::after {
        content: ' ▶';
        display: inline-block;
        font-size: 0.8em;
        vertical-align: middle;
    }
    details[open] .details-analysis > summary::after {
        content: ' ▼';
    }

    /* --- SCROLL DA ANÁLISE DETALHADA --- */
    .analysis-content-wrapper {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed #ddd;
        text-align: left;
        font-size: 13px;
        line-height: 1.4;
    }
    .analysis-content {
        max-height: 300px;
        overflow-y: auto;
        padding-right: 5px;
    }
    .analysis-content::-webkit-scrollbar { width: 4px; }
    .analysis-content::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
    .analysis-content::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
    
    .analysis-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        font-family: inherit;
    }
    .analysis-table th {
        font-size: 11px;
        text-transform: uppercase;
        color: #666;
        border-bottom: 1px solid #eee;
        padding: 4px;
        text-align: left;
    }
    .analysis-table td {
        padding: 6px 4px;
        border-bottom: 1px solid #f9f9f9;
        vertical-align: middle;
    }
    .analysis-word {
        font-weight: bold;
        color: #333;
    }
    .analysis-ipa {
        font-family: 'Segoe UI', Arial;
        color: #dc3545;
        font-size: 12px;
    }
    .analysis-note {
        font-size: 12px;
        color: #666;
        font-style: italic;
    }

    /* --- CORES GRAMATICAIS --- */
    .gram-cat {
        padding: 1px 5px;
        border-radius: 4px;
        color: #fff;
        font-style: normal !important;
    }
    .gram-cat-verb { background-color: #28a745; } /* Green */
    .gram-cat-noun { background-color: #ffc107; color: #212529; } /* Yellow */
    .gram-cat-adj { background-color: #007bff; } /* Blue */
    .gram-cat-adv { background-color: #fd7e14; } /* Orange */
    .gram-cat-pron { background-color: #6f42c1; } /* Purple */
    .gram-cat-prep { background-color: #dc3545; } /* Red */
    .gram-cat-art { background-color: #6c757d; } /* Gray */
    .gram-cat-other { background-color: #17a2b8; } /* Teal/Info for rare cases */

    /* --- IMAGE GALLERY --- */
    .image-gallery-container {
        margin-top: 5px;
        border-radius: 8px;
        padding: 10px;
        background: #f8f9fa;
    }
    .image-gallery {
        display: flex;
        overflow-x: auto;
        gap: 15px;
        padding: 10px 5px;
        scrollbar-width: thin;
        scrollbar-color: #ccc #f1f1f1;
        align-items: flex-start;
    }
    .image-gallery::-webkit-scrollbar { height: 8px; }
    .image-gallery::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
    .image-gallery::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
    .image-gallery::-webkit-scrollbar-thumb:hover { background: #aaa; }
    
    .image-gallery > * {
        flex-shrink: 0;
    }
    
    .image-slot-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 400px;
    }
    .image-placeholder-gallery {
        width: 100%;
        height: 400px;
        border: 2px dashed #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 14px;
        text-align: center;
        background-color: #fff;
        border-radius: 6px;
    }
    .anki-card-container img {
        display: block;
        width: 400px;
        height: 400px;
        object-fit: contain;
        background-color: #f8f9fa;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .image-slot-caption {
        background: #ffffff;
        border-radius: 6px;
        border: 1px solid #eee;
        font-size: 13px;
        text-align: left;
    }
    .image-slot-caption > summary {
        padding: 10px;
        font-weight: bold;
        color: #0ea5e9;
        cursor: pointer;
        outline: none;
        list-style: none;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .image-slot-caption > summary::-webkit-details-marker { display: none; }
    .image-slot-caption > summary::after {
        content: ' (mostrar detalhes)';
        font-weight: normal;
        font-size: 0.9em;
        color: #6c757d;
        text-transform: none;
        letter-spacing: normal;
    }
    .image-slot-caption[open] > summary::after {
        content: ' (ocultar detalhes)';
    }
    .image-slot-caption[open] > summary {
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
    }
    .image-slot-caption > div {
        padding: 8px 10px 10px 10px;
    }
    .image-slot-caption p {
        margin: 0 0 5px 0;
        font-size: 13px;
        line-height: 1.4;
        color: #333;
    }
    .image-slot-caption p:first-child { font-weight: 600; }
    .image-slot-caption p em {
        color: #6c757d;
        font-style: italic;
    }

    /* --- CORREÇÃO DO BUG DE CURSOR DO EDITOR ANKI --- */
    /* Isto força a galeria de imagens a ficar na vertical 
      (uma em cima da outra) APENAS na janela de edição, 
      evitando o bug que joga o cursor para o início.
    */
    .editor .image-gallery {
        flex-direction: column !important; /* Empilha os itens verticalmente */
        overflow-x: unset !important;    /* Remove a rolagem horizontal */
        height: auto !important;         /* Remove qualquer altura fixa */
        padding: 0 !important;
    }

    /* Faz cada item da galeria (imagem + legenda) ocupar 
      100% da largura no editor e adiciona um espaço.
    */
    .editor .image-slot-container {
        width: 100% !important;          /* Ocupa a largura total */
        margin-bottom: 20px !important;  /* Espaço entre os itens empilhados */
    }

    /* Faz a imagem ou o placeholder se ajustar à largura de 100% no editor.
    */
    .editor .anki-card-container img,
    .editor .image-placeholder-gallery {
        width: 100% !important;
        height: 250px !important; /* Mantém uma altura razoável no editor */
        object-fit: contain !important;
        background-color: #f8f9fa !important;
    }

</style>
<!-- Card Structure -->
<div class="anki-card-container" style="--main-color: [--main-color]; --bg-color: [--bg-color]; --shadow-color: [--shadow-color];">
    
    <!-- Main title with word and grammatical category -->
    <h1>[Emoji] [Word] ([Grammatical Category]) [CEFR Level]</h1>

    <!-- Translation section -->
    <div class="anki-section">
        <h2>📖 Translation:</h2>
        [Translation Note]
        <div class="translation-block">
            <p class="main-translation">[Main Translation with POS]</p>
            <details class="other-translations">
                <summary class="toggle-summary">Outras traduções comuns</summary>
                <ul>
                    <li>[Other Translation 1]</li>
                    <li>[Other Translation 2]</li>
                    <li>[Other Translation 3]</li>
                    <li>[Other Translation 4]</li>
                </ul>
            </details>
        </div>
    </div>

    <div class="divider"></div>

    <!-- Definition section -->
    <div class="anki-section">
        <details class="details-box" open>
            <summary class="toggle-summary">📝 Definition</summary>
            <div class="content-wrapper">
                <details class="details-inner">
                    <summary class="toggle-summary">Grammatical Color Legend</summary>
                    <div class="color-legend" style="margin-top: 5px; border: none; padding: 5px 0 0 0;">
                        <ul>
                            <li>🟢 Green &rarr; Verbs (e.g., run, create)</li>
                            <li>🟡 Yellow &rarr; Nouns (e.g., book, website)</li>
                            <li>🔵 Blue &rarr; Adjectives (e.g., new, beautiful)</li>
                            <li>🟠 Orange &rarr; Adverbs (e.g., quickly, very)</li>
                            <li>🟣 Purple &rarr; Pronouns (e.g., she, her, it)</li>
                            <li>🔴 Red &rarr; Prepositions & Conjunctions (e.g., for, in, and)</li>
                            <li>⚫️ Gray &rarr; Articles & Determiners (e.g., a, the, this)</li>
                        </ul>
                    </div>
                </details>
                <ul style="margin-top: 15px;">
                    <li class="definition-item [Relevant Class 1]">
                        1️⃣ <span class="gram-cat gram-cat-...">[cat.]</span> [Definition 1] <span class="usage-tags-container">[Usage Tags 1]</span>
                        <details class="syn-ant-box">
                            <summary class="toggle-summary">ver sinônimos/antônimos</summary>
                            <div class="syn-ant-content">
                                <p><strong>Synonyms:</strong> [Synonyms 1]</p>
                                <p><em>Antonyms:</em> [Antonyms 1]</p>
                            </div>
                        </details>
                    </li>
                    <li class="definition-item [Relevant Class 2]">
                        2️⃣ <span class="gram-cat gram-cat-...">[cat.]</span> [Definition 2] <span class="usage-tags-container">[Usage Tags 2]</span>
                        <details class="syn-ant-box">
                            <summary class="toggle-summary">ver sinônimos/antônimos</summary>
                            <div class="syn-ant-content">
                                <p><strong>Synonyms:</strong> [Synonyms 2]</p>
                                <p><em>Antonyms:</em> [Antonyms 2]</p>
                            </div>
                        </details>
                    </li>
                    <li class="definition-item [Relevant Class 3]">
                        3️⃣ <span class="gram-cat gram-cat-...">[cat.]</span> [Definition 3] <span class="usage-tags-container">[Usage Tags 3]</span>
                        <details class="syn-ant-box">
                            <summary class="toggle-summary">ver sinônimos/antônimos</summary>
                            <div class="syn-ant-content">
                                <p><strong>Synonyms:</strong> [Synonyms 3]</p>
                                <p><em>Antonyms:</em> [Antonyms 3]</p>
                            </div>
                        </details>
                    </li>
                    <li class="definition-item [Relevant Class 4]">
                        4️⃣ <span class="gram-cat gram-cat-...">[cat.]</span> [Definition 4] <span class="usage-tags-container">[Usage Tags 4]</span>
                        <details class="syn-ant-box">
                            <summary class="toggle-summary">ver sinônimos/antônimos</summary>
                            <div class="syn-ant-content">
                                <p><strong>Synonyms:</strong> [Synonyms 4]</p>
                                <p><em>Antonyms:</em> [Antonyms 4]</p>
                            </div>
                        </details>
                    </li>
                    <li class="definition-item [Relevant Class 5]">
                        5️⃣ <span class="gram-cat gram-cat-...">[cat.]</span> [Definition 5] <span class="usage-tags-container">[Usage Tags 5]</span>
                        <details class="syn-ant-box">
                            <summary class="toggle-summary">ver sinônimos/antônimos</summary>
                            <div class="syn-ant-content">
                                <p><strong>Synonyms:</strong> [Synonyms 5]</p>
                                <p><em>Antonyms:</em> [Antonyms 5]</p>
                            </div>
                        </details>
                    </li>
                </ul>
            </div>
        </details>
    </div>
    
    <div class="divider"></div>

    <!-- Verb Conjugation section (if applicable) -->
    <div class="anki-section">
        <details class="details-box">
            <summary class="toggle-summary">
                🔄 Conjugation <span class="verb-type-tag verb-type-[regular/irregular]">[Regular/Irregular] Verb</span>
            </summary>
            <div class="conjugation-wrapper">
                <!-- Essential Tenses -->
                <details class="conjugation-group" open>
                    <summary>Essential Tenses</summary>
                    <div class="table-wrapper">
                        <table class="anki-table">
                            <thead>
                                <tr>
                                    <th>Tense</th>
                                    <th>Conjugation</th>
                                    <th>Example</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="tense-infinitive">
                                    <td><strong>♾️ Infinitive</strong></td>
                                    <td>[Infinitive]</td>
                                    <td>[Infinitive Example]</td>
                                </tr>
                                <tr class="tense-present">
                                    <td><strong>☀️ Simple Present</strong></td>
                                    <td>[Simple Present]</td>
                                    <td>[Present Example]</td>
                                </tr>
                                <tr class="tense-past">
                                    <td><strong>⏳ Simple Past</strong></td>
                                    <td>[Simple Past]</td>
                                    <td>[Past Example]</td>
                                </tr>
                                <tr class="tense-participle">
                                    <td><strong>📘 Past Participle</strong></td>
                                    <td>[Past Participle]</td>
                                    <td>[Past Participle Example]</td>
                                </tr>
                                <tr class="tense-gerund">
                                    <td><strong>🔁 Gerund</strong></td>
                                    <td>[Gerund]</td>
                                    <td>[Gerund Example]</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </details>

                <!-- Progressive & Perfect Tenses -->
                <details class="conjugation-group">
                    <summary>Progressive &amp; Perfect Tenses</summary>
                    <div class="table-wrapper">
                       <table class="anki-table">
                            <thead>
                                <tr>
                                    <th>Tense</th>
                                    <th>Conjugation</th>
                                    <th>Example</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="tense-present-continuous">
                                    <td><strong>🔄 Present Continuous</strong></td>
                                    <td>[Present Continuous]</td>
                                    <td>[Present Continuous Example]</td>
                                </tr>
                                 <tr class="tense-present-continuous">
                                    <td><strong>🔄 Past Continuous</strong></td>
                                    <td>[Past Continuous]</td>
                                    <td>[Past Continuous Example]</td>
                                </tr>
                                <tr class="tense-present-perfect">
                                    <td><strong>✅ Present Perfect</strong></td>
                                    <td>[Present Perfect]</td>
                                    <td>[Present Perfect Example]</td>
                                </tr>
                                <tr class="tense-present-perfect">
                                    <td><strong>✅ Past Perfect</strong></td>
                                    <td>[Past Perfect]</td>
                                    <td>[Past Perfect Example]</td>
                                </tr>
                                 <tr class="tense-present-perfect">
                                    <td><strong>✅ Future Perfect</strong></td>
                                    <td>[Future Perfect]</td>
                                    <td>[Future Perfect Example]</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </details>

                <!-- Future, Passive & Moods -->
                <details class="conjugation-group">
                    <summary>Future, Passive &amp; Moods</summary>
                    <div class="table-wrapper">
                        <table class="anki-table">
                            <thead>
                                <tr>
                                    <th>Form</th>
                                    <th>Structure</th>
                                    <th>Example</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="tense-future-simple">
                                    <td><strong>🚀 Future ("will")</strong></td>
                                    <td>[Future Will]</td>
                                    <td>[Future Will Example]</td>
                                </tr>
                                <tr class="tense-future-simple">
                                    <td><strong>🚀 Future ("going to")</strong></td>
                                    <td>[Future GoingTo]</td>
                                    <td>[Future GoingTo Example]</td>
                                </tr>
                                <tr>
                                    <td><strong>🛡️ Passive (Present)</strong></td>
                                    <td>[Passive Present]</td>
                                    <td>[Passive Present Example]</td>
                                </tr>
                                <tr>
                                    <td><strong>👉 Imperative</strong></td>
                                    <td>[Imperative]</td>
                                    <td>[Imperative Example]</td>
                                </tr>
                                <tr>
                                    <td><strong>🤔 Subjunctive (Present)</strong></td>
                                    <td>[Subjunctive Present]</td>
                                    <td>[Subjunctive Present Example]</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </details>
            </div>
        </details>
    </div>

    <div class="divider"></div>

    <!-- Phonetic pronunciation -->
    <div class="anki-section">
        <h2>🔊 Pronunciation: [sound:pronunciation.mp3]</h2>
        <p class="pronunciation-text">/[Phonetic Pronunciation]/</p>
    </div>

    <div class="divider"></div>

    <!-- Illustrative Images section with Horizontal Scroll -->
    <div class="anki-section">
        <p><strong>📷 Illustrative Images:</strong> (Role para ver mais)</p>
        <div class="image-gallery-container">
            <div class="image-gallery">
                <!-- IMAGE_SLOT_1_START -->
                <div class="image-slot-container">
                    <div class="image-placeholder-gallery">Cole sua imagem 1 aqui</div>
                    <details class="image-slot-caption">
                        <summary>TIPO DE CARD 1</summary>
                        <div>
                            <p>Definição do Card 1</p>
                            <p><em>e.g., "Frase de Exemplo 1"</em></p>
                        </div>
                    </details>
                </div>
                <!-- IMAGE_SLOT_1_END -->
                <!-- IMAGE_SLOT_2_START -->
                <div class="image-slot-container">
                    <div class="image-placeholder-gallery">Cole sua imagem 2 aqui</div>
                    <details class="image-slot-caption">
                        <summary>TIPO DE CARD 2</summary>
                        <div>
                            <p>Definição do Card 2</p>
                            <p><em>e.g., "Frase de Exemplo 2"</em></p>
                        </div>
                    </details>
                </div>
                <!-- IMAGE_SLOT_2_END -->
                <!-- IMAGE_SLOT_3_START -->
                <div class="image-slot-container">
                    <div class="image-placeholder-gallery">Cole sua imagem 3 aqui</div>
                    <details class="image-slot-caption">
                        <summary>TIPO DE CARD 3</summary>
                        <div>
                            <p>Definição do Card 3</p>
                            <p><em>e.g., "Frase de Exemplo 3"</em></p>
                        </div>
                    </details>
                </div>
                <!-- IMAGE_SLOT_3_END -->
                <!-- IMAGE_SLOT_4_START -->
                <div class="image-slot-container">
                    <div class="image-placeholder-gallery">Cole sua imagem 4 aqui</div>
                    <details class="image-slot-caption">
                        <summary>TIPO DE CARD 4</summary>
                        <div>
                            <p>Definição do Card 4</p>
                            <p><em>e.g., "Frase de Exemplo 4"</em></p>
                        </div>
                    </details>
                </div>
                <!-- IMAGE_SLOT_4_END -->
                <!-- IMAGE_SLOT_5_START -->
                <div class="image-slot-container">
                    <div class="image-placeholder-gallery">Cole sua imagem 5 aqui</div>
                    <details class="image-slot-caption">
                        <summary>TIPO DE CARD 5</summary>
                        <div>
                            <p>Definição do Card 5</p>
                            <p><em>e.g., "Frase de Exemplo 5"</em></p>
                        </div>
                    </details>
                </div>
                <!-- IMAGE_SLOT_5_END -->
            </div>
        </div>
    </div>

    <div class="divider"></div>

    <!-- Usage Examples -->
    <div class="anki-section">
        <details class="details-box" open>
            <summary class="toggle-summary">📌 Usage Examples</summary>
            <div class="content-wrapper">
                <ul class="item-list">
                    <li>
                        1️⃣ "[Example sentence 1]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Translation:</em> [Sentence Translation 1]</p>
                            <div class="ipa-details">
                                <p class="example-ipa">/[Fast IPA for Sentence 1]/</p>
                            </div>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Sentence 1]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        2️⃣ "[Example sentence 2]"
                         <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Translation:</em> [Sentence Translation 2]</p>
                            <div class="ipa-details">
                                <p class="example-ipa">/[Fast IPA for Sentence 2]/</p>
                            </div>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Sentence 2]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        3️⃣ "[Example sentence 3]"
                         <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Translation:</em> [Sentence Translation 3]</p>
                            <div class="ipa-details">
                                <p class="example-ipa">/[Fast IPA for Sentence 3]/</p>
                            </div>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Sentence 3]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        4️⃣ "[Example sentence 4]"
                         <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Translation:</em> [Sentence Translation 4]</p>
                            <div class="ipa-details">
                                <p class="example-ipa">/[Fast IPA for Sentence 4]/</p>
                            </div>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Sentence 4]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        5️⃣ "[Example sentence 5]"
                         <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Translation:</em> [Sentence Translation 5]</p>
                            <div class="ipa-details">
                                <p class="example-ipa">/[Fast IPA for Sentence 5]/</p>
                            </div>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Sentence 5]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                </ul>
            </div>
        </details>
    </div>

    <div class="divider"></div>

    <!-- Phrasal Verbs section -->
    <div class="anki-section">
        <details class="details-box">
            <summary class="toggle-summary">💡 Phrasal Verbs</summary>
            <div class="content-wrapper">
                <ul class="item-list">
                    <li>
                        1️⃣ "[Example sentence with Phrasal Verb 1]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Phrasal Verb 1]</p>
                            <p style="margin-top: 5px;">
                                <strong>Phrasal Verb:</strong> [Phrasal Verb 1]<br>
                                <small><em>Translation:</em> [Phrasal Verb Translation 1]</small><br>
                                <strong>Explanation:</strong> [Phrasal Verb Explanation 1]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Phrasal Verb Sentence 1]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                     <li>
                        2️⃣ "[Example sentence with Phrasal Verb 2]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Phrasal Verb 2]</p>
                            <p style="margin-top: 5px;">
                                <strong>Phrasal Verb:</strong> [Phrasal Verb 2]<br>
                                <small><em>Translation:</em> [Phrasal Verb Translation 2]</small><br>
                                <strong>Explanation:</strong> [Phrasal Verb Explanation 2]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Phrasal Verb Sentence 2]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                     <li>
                        3️⃣ "[Example sentence with Phrasal Verb 3]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Phrasal Verb 3]</p>
                            <p style="margin-top: 5px;">
                                <strong>Phrasal Verb:</strong> [Phrasal Verb 3]<br>
                                <small><em>Translation:</em> [Phrasal Verb Translation 3]</small><br>
                                <strong>Explanation:</strong> [Phrasal Verb Explanation 3]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Phrasal Verb Sentence 3]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        4️⃣ "[Example sentence with Phrasal Verb 4]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Phrasal Verb 4]</p>
                            <p style="margin-top: 5px;">
                                <strong>Phrasal Verb:</strong> [Phrasal Verb 4]<br>
                                <small><em>Translation:</em> [Phrasal Verb Translation 4]</small><br>
                                <strong>Explanation:</strong> [Phrasal Verb Explanation 4]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Phrasal Verb Sentence 4]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        5️⃣ "[Example sentence with Phrasal Verb 5]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Phrasal Verb 5]</p>
                            <p style="margin-top: 5px;">
                                <strong>Phrasal Verb:</strong> [Phrasal Verb 5]<br>
                                <small><em>Translation:</em> [Phrasal Verb Translation 5]</small><br>
                                <strong>Explanation:</strong> [Phrasal Verb Explanation 5]
                            </p>
                             <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Phrasal Verb Sentence 5]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                </ul>
            </div>
        </details>
    </div>
    
    <div class="divider"></div>

    <!-- Idioms & Slang section -->
    <div class="anki-section">
        <details class="details-box">
            <summary class="toggle-summary">🤪 Idioms &amp; Slang</summary>
            <div class="content-wrapper">
                <ul class="item-list">
                    <li>
                        1️⃣ "[Example sentence with Idiom 1]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Idiom 1]</p>
                            <p style="margin-top: 5px;">
                                <strong>Idiom/Slang:</strong> [Idiom 1]<br>
                                <small><em>Translation:</em> [Idiom Translation 1]</small><br>
                                <strong>Explanation:</strong> [Idiom Explanation 1]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Idiom Sentence 1]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                     <li>
                        2️⃣ "[Example sentence with Idiom 2]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Idiom 2]</p>
                            <p style="margin-top: 5px;">
                                <strong>Idiom/Slang:</strong> [Idiom 2]<br>
                                <small><em>Translation:</em> [Idiom Translation 2]</small><br>
                                <strong>Explanation:</strong> [Idiom Explanation 2]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Idiom Sentence 2]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                     <li>
                        3️⃣ "[Example sentence with Idiom 3]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Idiom 3]</p>
                            <p style="margin-top: 5px;">
                                <strong>Idiom/Slang:</strong> [Idiom 3]<br>
                                <small><em>Translation:</em> [Idiom Translation 3]</small><br>
                                <strong>Explanation:</strong> [Idiom Explanation 3]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Idiom Sentence 3]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        4️⃣ "[Example sentence with Idiom 4]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Idiom 4]</p>
                            <p style="margin-top: 5px;">
                                <strong>Idiom/Slang:</strong> [Idiom 4]<br>
                                <small><em>Translation:</em> [Idiom Translation 4]</small><br>
                                <strong>Explanation:</strong> [Idiom Explanation 4]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Idiom Sentence 4]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        5️⃣ "[Example sentence with Idiom 5]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Idiom 5]</p>
                            <p style="margin-top: 5px;">
                                <strong>Idiom/Slang:</strong> [Idiom 5]<br>
                                <small><em>Translation:</em> [Idiom Translation 5]</small><br>
                                <strong>Explanation:</strong> [Idiom Explanation 5]
                            </p>
                             <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Idiom Sentence 5]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                </ul>
            </div>
        </details>
    </div>

    <div class="divider"></div>

    <!-- Collocations section -->
    <div class="anki-section">
        <details class="details-box">
            <summary class="toggle-summary">✨ Collocations (Common Combinations)</summary>
            <div class="content-wrapper">
                <ul class="item-list">
                    <li>
                        1️⃣ "[Example sentence with Collocation 1]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Collocation 1]</p>
                            <p style="margin-top: 5px;">
                                <strong>Collocation:</strong> [Collocation 1]<br>
                                <small><em>Translation:</em> [Collocation Translation 1]</small><br>
                                <strong>Explanation:</strong> [Collocation Explanation 1]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Collocation Sentence 1]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        2️⃣ "[Example sentence with Collocation 2]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Collocation 2]</p>
                            <p style="margin-top: 5px;">
                                <strong>Collocation:</strong> [Collocation 2]<br>
                                <small><em>Translation:</em> [Collocation Translation 2]</small><br>
                                <strong>Explanation:</strong> [Collocation Explanation 2]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Collocation Sentence 2]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        3️⃣ "[Example sentence with Collocation 3]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Collocation 3]</p>
                            <p style="margin-top: 5px;">
                                <strong>Collocation:</strong> [Collocation 3]<br>
                                <small><em>Translation:</em> [Collocation Translation 3]</small><br>
                                <strong>Explanation:</strong> [Collocation Explanation 3]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Collocation Sentence 3]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        4️⃣ "[Example sentence with Collocation 4]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Collocation 4]</p>
                            <p style="margin-top: 5px;">
                                <strong>Collocation:</strong> [Collocation 4]<br>
                                <small><em>Translation:</em> [Collocation Translation 4]</small><br>
                                <strong>Explanation:</strong> [Collocation Explanation 4]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Collocation Sentence 4]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                    <li>
                        5️⃣ "[Example sentence with Collocation 5]"
                        <details class="details-inner">
                            <summary class="toggle-summary">(See translation &amp; analysis)</summary>
                            <p><em>Full Sentence Translation:</em> [Full Sentence Translation for Collocation 5]</p>
                            <p style="margin-top: 5px;">
                                <strong>Collocation:</strong> [Collocation 5]<br>
                                <small><em>Translation:</em> [Collocation Translation 5]</small><br>
                                <strong>Explanation:</strong> [Collocation Explanation 5]
                            </p>
                            <details class="details-analysis">
                                <summary>Detailed Grammatical Analysis</summary>
                                <div class="analysis-content-wrapper">
                                   <div class="analysis-content">[Detailed analysis of Collocation Sentence 5]</div>
                                </div>
                            </details>
                        </details>
                    </li>
                </ul>
            </div>
        </details>
    </div>

    <div class="divider"></div>

    <!-- Related Words section -->
    <div class="anki-section">
        <details class="details-box">
            <summary class="toggle-summary">🔗 Related Words</summary>
            <div class="content-wrapper">
                <ul class="item-list">
                    <li>
                        <strong>[Related Word 1]</strong> [Related Word 1 CEFR & Rec]
                        <p class="related-word-ipa">/[Related Word 1 IPA]/</p>
                        <details class="details-inner">
                            <summary class="toggle-summary">See translation &amp; explanation</summary>
                            <p>
                                <small><em>Translation:</em> [Related Word Translation 1]</small><br>
                                <strong>Explanation:</strong> [Related Word Explanation 1]
                            </p>
                        </details>
                    </li>
                    <li>
                        <strong>[Related Word 2]</strong> [Related Word 2 CEFR & Rec]
                        <p class="related-word-ipa">/[Related Word 2 IPA]/</p>
                        <details class="details-inner">
                            <summary class="toggle-summary">See translation &amp; explanation</summary>
                            <p>
                                <small><em>Translation:</em> [Related Word Translation 2]</small><br>
                                <strong>Explanation:</strong> [Related Word Explanation 2]
                            </p>
                        </details>
                    </li>
                    <li>
                        <strong>[Related Word 3]</strong> [Related Word 3 CEFR & Rec]
                        <p class="related-word-ipa">/[Related Word 3 IPA]/</p>
                        <details class="details-inner">
                            <summary class="toggle-summary">See translation &amp; explanation</summary>
                            <p>
                                <small><em>Translation:</em> [Related Word Translation 3]</small><br>
                                <strong>Explanation:</strong> [Related Word Explanation 3]
                            </p>
                        </details>
                    </li>
                    <li>
                        <strong>[Related Word 4]</strong> [Related Word 4 CEFR & Rec]
                        <p class="related-word-ipa">/[Related Word 4 IPA]/</p>
                        <details class="details-inner">
                            <summary class="toggle-summary">See translation &amp; explanation</summary>
                            <p>
                                <small><em>Translation:</em> [Related Word Translation 4]</small><br>
                                <strong>Explanation:</strong> [Related Word Explanation 4]
                            </p>
                        </details>
                    </li>
                    <li>
                        <strong>[Related Word 5]</strong> [Related Word 5 CEFR & Rec]
                        <p class="related-word-ipa">/[Related Word 5 IPA]/</p>
                        <details class="details-inner">
                            <summary class="toggle-summary">See translation &amp; explanation</summary>
                            <p>
                                <small><em>Translation:</em> [Related Word Translation 5]</small><br>
                                <strong>Explanation:</strong> [Related Word Explanation 5]
                            </p>
                        </details>
                    </li>
                </ul>
            </div>
        </details>
    </div>

    <div class="divider"></div>

    <!-- Tips & Curiosities section -->
    <div class="anki-section">
        <details class="details-box">
            <summary class="toggle-summary">🧐 Tips &amp; Curiosities</summary>
            <div class="content-wrapper">
                <ul class="tips-list">
                    <li>[Tip 1]</li>
                    <li>[Tip 2]</li>
                    <li>[Tip 3]</li>
                    <li>[Tip 4]</li>
                    <li>[Tip 5]</li>
                </ul>
            </div>
        </details>
    </div>
</div>`;

type GenerationStep = 'IDLE' | 'GENERATING_CARD' | 'DONE' | 'ERROR';

interface AnkiCardGeneratorProps {
    wordToGenerate?: string;
    contextToGenerate?: string;
}

export const AnkiCardGenerator: React.FC<AnkiCardGeneratorProps> = ({ wordToGenerate, contextToGenerate }) => {
    const [word, setWord] = useState('');
    const [context, setContext] = useState('');
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [generationStep, setGenerationStep] = useState<GenerationStep>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleGenerate = useCallback(async () => {
        if (!word.trim()) {
            setError('Please enter a word.');
            return;
        }
        setGenerationStep('GENERATING_CARD');
        setError(null);
        setGeneratedHtml('');
        setCopySuccess(false);

        try {
            // Step 1: Get comprehensive data, which includes the pre-filled Anki HTML
            const { ankiCardHtml } = await getComprehensiveWordData(word, ANKI_CARD_TEMPLATE, context);
            
            if (!ankiCardHtml) {
                throw new Error("The AI response did not contain the Anki card HTML.");
            }
            
            setGeneratedHtml(ankiCardHtml);
            setGenerationStep('DONE');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate card. ${errorMessage}`);
            setGenerationStep('ERROR');
        }
    }, [word]);
    
    useEffect(() => {
        if (wordToGenerate) {
            setWord(wordToGenerate);
        }
        if (contextToGenerate) {
            setContext(contextToGenerate);
        }
    }, [wordToGenerate, contextToGenerate]);
    
    useEffect(() => {
        if (wordToGenerate && wordToGenerate === word) {
            handleGenerate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wordToGenerate, word, handleGenerate]);


    const handleCopy = () => {
        if (!generatedHtml || !textareaRef.current) return;

        navigator.clipboard.writeText(generatedHtml).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }).catch(err => {
            console.warn('Clipboard API failed, falling back to execCommand:', err);
            try {
                textareaRef.current?.select();
                const successful = document.execCommand('copy');
                if (successful) {
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                } else {
                    alert('Failed to copy HTML.');
                }
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
                alert('Failed to copy HTML.');
            }
            window.getSelection()?.removeAllRanges();
        });
    };
    
    const getButtonText = () => {
        switch(generationStep) {
            case 'GENERATING_CARD':
                return 'Gerando Cartão...';
            case 'IDLE':
            case 'DONE':
            case 'ERROR':
            default:
                return 'Gerar Cartão';
        }
    };

    const isLoading = generationStep === 'GENERATING_CARD';

    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <AnkiIcon className="w-6 h-6 text-sky-300" />
                <h3 className="text-lg font-semibold text-sky-300">Gerador de Cartões Anki</h3>
            </div>

            <div className="flex flex-col gap-3 mb-4">
                <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Palavra ou Phrasal Verb (ex: 'Break in', 'Actually')..."
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 p-2.5"
                    disabled={isLoading}
                />
                <div className="relative">
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Contexto: Cole a frase onde você viu a palavra para resultados 10x mais precisos..."
                        className="w-full bg-slate-700 border border-slate-600 text-white text-xs rounded-lg focus:ring-sky-500 focus:border-sky-500 p-2.5 h-16 resize-none"
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 bottom-2 text-[10px] text-slate-500">
                        {context ? '✨ Contexto Ativo' : '💡 Dica: Forneça uma frase'}
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !word.trim()}
                    className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
                >
                    {getButtonText()}
                </button>
            </div>

            {error && (
                <div className="mt-4 bg-red-900/50 border border-red-600 text-red-200 px-4 py-2 rounded-lg text-sm">
                    <p>{error}</p>
                </div>
            )}

            {(generatedHtml || isLoading) && (
                <div className="mt-4">
                     {generationStep !== 'GENERATING_CARD' && (
                        <div className="flex justify-between items-center mb-2">
                             <label htmlFor="html-output" className="font-semibold text-slate-300 text-sm">
                                Código HTML do Cartão:
                            </label>
                            <div className="flex items-center gap-2">
                                 <button
                                    onClick={() => setShowPreview(true)}
                                    disabled={!generatedHtml}
                                    className="flex items-center gap-2 text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                    Prévia
                                </button>
                                <button
                                    onClick={handleCopy}
                                    disabled={!generatedHtml}
                                    className="flex items-center gap-2 text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {copySuccess ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                                    {copySuccess ? 'Copiado!' : 'Copiar HTML'}
                                </button>
                            </div>
                        </div>
                     )}
                    {isLoading ? (
                         <div className="w-full h-64 bg-slate-900 border border-slate-600 rounded-lg p-3 animate-pulse"></div>
                    ) : (
                        <textarea
                            id="html-output"
                            ref={textareaRef}
                            readOnly
                            value={generatedHtml}
                            className="w-full h-64 bg-slate-900 border border-slate-600 text-slate-300 text-xs rounded-lg p-3 font-mono focus:ring-sky-500 focus:border-sky-500"
                        />
                    )}
                </div>
            )}

            {showPreview && (
                <div 
                    className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
                    onClick={() => setShowPreview(false)}
                >
                    <div 
                        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-3xl h-[90vh] flex flex-col p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3 flex-shrink-0">
                            <h4 className="text-lg font-semibold text-sky-300">Prévia do Cartão Anki</h4>
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                                aria-label="Fechar prévia"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="bg-white rounded-lg overflow-hidden flex-grow">
                            <iframe
                                srcDoc={generatedHtml}
                                title="Anki Card Preview"
                                className="w-full h-full border-0"
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};