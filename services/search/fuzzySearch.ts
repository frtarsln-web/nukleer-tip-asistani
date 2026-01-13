import Fuse, { IFuseOptions } from 'fuse.js';

export interface SearchableItem {
    id: string;
    [key: string]: any;
}

export interface SearchOptions<T> {
    keys: (keyof T | string)[];
    threshold?: number;
    includeScore?: boolean;
    minMatchCharLength?: number;
}

class FuzzySearchService {
    // Create a fuzzy search instance
    createSearcher<T extends SearchableItem>(
        items: T[],
        options: SearchOptions<T>
    ): Fuse<T> {
        const fuseOptions: IFuseOptions<T> = {
            keys: options.keys as string[],
            threshold: options.threshold ?? 0.3,
            includeScore: options.includeScore ?? true,
            minMatchCharLength: options.minMatchCharLength ?? 2,
            ignoreLocation: true,
            useExtendedSearch: true
        };

        return new Fuse(items, fuseOptions);
    }

    // Quick search for patients
    searchPatients<T extends { id: string; patientName: string; protocolNo?: string; procedure?: string }>(
        patients: T[],
        query: string
    ): T[] {
        if (!query) return patients;

        const fuse = this.createSearcher(patients, {
            keys: ['patientName', 'protocolNo', 'procedure']
        });

        return fuse.search(query).map(result => result.item);
    }

    // Search with scoring
    searchWithScores<T extends SearchableItem>(
        items: T[],
        query: string,
        keys: (keyof T | string)[]
    ): Array<{ item: T; score: number }> {
        if (!query) return items.map(item => ({ item, score: 0 }));

        const fuse = this.createSearcher(items, { keys, includeScore: true });

        return fuse.search(query).map(result => ({
            item: result.item,
            score: result.score ?? 0
        }));
    }

    // Multi-field search
    multiSearch<T extends SearchableItem>(
        items: T[],
        queries: Record<string, string>
    ): T[] {
        let results = items;

        Object.entries(queries).forEach(([key, value]) => {
            if (value) {
                const fuse = this.createSearcher(results, { keys: [key] });
                results = fuse.search(value).map(r => r.item);
            }
        });

        return results;
    }

    // Highlight matches in text
    highlightMatches(text: string, query: string): string {
        if (!query) return text;

        // Escape special characters to prevent RegExp errors
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}

export const searchService = new FuzzySearchService();
