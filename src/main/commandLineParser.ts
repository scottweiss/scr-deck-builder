
export interface BuildOptions {
    dataSets: string[];
    preferredElement: string | null;
    preferredArchetype: string | null;
    exportJson: boolean;
    showRules: boolean;
}

/**
 * Parse command line arguments for the deck builder
 */
export function parseCommandLineArgs(): BuildOptions {
    const args: string[] = process.argv.slice(2);
    const options: BuildOptions = {
        dataSets: ['Beta', 'ArthurianLegends'],
        preferredElement: null,
        preferredArchetype: null,
        exportJson: false,
        showRules: false
    };

    // Process command line arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--element' && i + 1 < args.length) {
            options.preferredElement = args[i+1];
            i++;
        } else if (args[i] === '--archetype' && i + 1 < args.length) {
            options.preferredArchetype = args[i+1];
            i++;
        } else if (args[i] === '--set' && i + 1 < args.length) {
            // Allow filtering to specific card set
            options.dataSets = [args[i+1]];
            i++;
        } else if (args[i] === '--export-json') {
            options.exportJson = true;
        } else if (args[i] === '--show-rules') {
            options.showRules = true;
        } else if (args[i] === '--help') {
            displayHelp();
            process.exit(0);
        }
    }

    return options;
}

/**
 * Display help information
 */
function displayHelp(): void {
    console.log(`
Sorcery: Contested Realm Deck Builder
Usage: node build-deck.js [options]

Options:
  --element <element>       Preferred element (Water, Fire, Earth, Air, Void)
  --archetype <archetype>   Preferred deck archetype (Aggro, Control, Midrange, Combo, Balanced, Minion-Heavy, Artifact-Combo, Spell-Heavy)
  --set <setName>           Use specific card set (Beta, ArthurianLegends)
  --export-json             Export deck to JSON file
  --show-rules              Display official rules summary
  --help                    Show this help message
    `);
}
