import fs from 'fs';
import path from 'path';
import { Card } from '../../../types/Card';
import { Deck } from '../../../types/Deck';

interface ExportData {
    avatar: {
        name?: string;
        type?: string;
        rarity?: string;
    } | null;
    sites: {
        name?: string;
        type?: string;
        elements?: string[];
    }[];
    spells: {
        name?: string;
        type?: string;
        mana_cost?: number;
        elements?: string[];
        rarity?: string;
        power?: number;
    }[];
    metadata: {
        created: string;
        cardCount: number;
        siteCount: number;
    };
}

/**
 * Export deck to a JSON file
 * @param deck - The deck to export
 * @param filename - Optional filename (default: based on timestamp)
 * @returns The path to the exported file
 */
export function exportToJson(deck: Deck, filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFilename = filename || `deck-${timestamp}.json`;
    const exportPath = path.join(process.cwd(), exportFilename);

    const exportData: ExportData = {
        avatar: deck.avatar ? {
            name: deck.avatar.name,
            type: deck.avatar.type,
            rarity: deck.avatar.rarity
        } : null,
        sites: deck.sites.map(site => ({
            name: site.name,
            type: site.type,
            elements: site.elements
        })),
        spells: deck.spellbook.map((spell: Card) => ({
            name: spell.name,
            type: spell.type,
            mana_cost: spell.mana_cost,
            elements: spell.elements,
            rarity: spell.rarity,
            power: spell.power
        })),
        metadata: {
            created: new Date().toISOString(),
            cardCount: deck.spellbook.length,
            siteCount: deck.sites.length
        }
    };

    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`Deck exported to ${exportPath}`);
    return exportPath;
}
