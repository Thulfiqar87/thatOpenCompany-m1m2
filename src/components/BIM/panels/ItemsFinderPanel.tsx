import { useState } from 'react';
import { Search, Download, Upload, Trash2 } from 'lucide-react';
import * as OBC from '@thatopen/components';
import type { ModelIdMap, FinderQuery } from '@thatopen/components';
import { useBIM } from '../../../context/BIMContext';

interface QueryForm {
  category: string;    // regex string, e.g. "WALL"
  attrName: string;    // e.g. "Name"
  attrValue: string;   // e.g. "Masonry"
  queryName: string;
}

const EMPTY_FORM: QueryForm = {
  category: '',
  attrName: '',
  attrValue: '',
  queryName: 'My Query',
};

const ItemsFinderPanel = () => {
  const { getComponents, setSelectedItems } = useBIM();

  const [form, setForm] = useState<QueryForm>(EMPTY_FORM);
  const [savedQueries, setSavedQueries] = useState<FinderQuery[]>([]);
  const [results, setResults] = useState<ModelIdMap>({});
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // ----------------------------------------------------------------
  // Build ItemsQueryParams from the form fields
  // ----------------------------------------------------------------
  const buildQuery = () => {
    const params: OBC.ItemsQueryParams = {};

    if (form.category.trim()) {
      try {
        params.categories = [new RegExp(form.category.trim(), 'i')];
      } catch {
        throw new Error(`Invalid category regex: ${form.category}`);
      }
    }

    if (form.attrName.trim()) {
      let valueRegex: RegExp | undefined;
      if (form.attrValue.trim()) {
        try {
          valueRegex = new RegExp(form.attrValue.trim(), 'i');
        } catch {
          throw new Error(`Invalid value regex: ${form.attrValue}`);
        }
      }
      params.attributes = {
        queries: [
          {
            name: new RegExp(form.attrName.trim(), 'i'),
            ...(valueRegex ? { value: valueRegex } : {}),
          },
        ],
      };
    }

    return params;
  };

  // ----------------------------------------------------------------
  // Search
  // ----------------------------------------------------------------
  const handleSearch = async () => {
    const components = getComponents();
    if (!components) { setError('BIM viewer not initialized'); return; }

    setError('');
    setIsSearching(true);
    try {
      const params = buildQuery();
      if (!params.categories && !params.attributes) {
        setError('Enter at least a category or attribute name.');
        return;
      }

      const finder = components.get(OBC.ItemsFinder);
      const found = await finder.getItems([params]);

      let total = 0;
      for (const ids of Object.values(found)) {
        total += ids.size;
      }
      setResults(found);
      setResultCount(total);

      if (total > 0) await setSelectedItems(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // ----------------------------------------------------------------
  // Save query to the list
  // ----------------------------------------------------------------
  const handleSaveQuery = () => {
    const components = getComponents();
    if (!components) return;
    try {
      const params = buildQuery();
      if (!params.categories && !params.attributes) {
        setError('Nothing to save — fill in a filter first.');
        return;
      }
      const finder = components.get(OBC.ItemsFinder);
      const q = finder.create(form.queryName || 'Query', [params]);
      setSavedQueries(prev => [...prev, q]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  // ----------------------------------------------------------------
  // Run a saved query
  // ----------------------------------------------------------------
  const handleRunSaved = async (q: FinderQuery) => {
    const components = getComponents();
    if (!components) return;
    setIsSearching(true);
    try {
      const finder = components.get(OBC.ItemsFinder);
      const found = await finder.getItems(q.queries);
      let total = 0;
      for (const ids of Object.values(found)) total += ids.size;
      setResults(found);
      setResultCount(total);
      if (total > 0) await setSelectedItems(found);
    } finally {
      setIsSearching(false);
    }
  };

  // ----------------------------------------------------------------
  // Delete a saved query
  // ----------------------------------------------------------------
  const handleDeleteQuery = (q: FinderQuery) => {
    const components = getComponents();
    if (!components) return;
    const finder = components.get(OBC.ItemsFinder);
    finder.list.delete(q.name);
    setSavedQueries(prev => prev.filter(s => s !== q));
  };

  // ----------------------------------------------------------------
  // Download queries as JSON
  // ----------------------------------------------------------------
  const handleDownloadQueries = () => {
    const components = getComponents();
    if (!components) return;
    const finder = components.get(OBC.ItemsFinder);
    const exported = finder.export();
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'queries.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------------------
  // Upload queries from JSON
  // ----------------------------------------------------------------
  const handleUploadQueries = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const components = getComponents();
    if (!components) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const finder = components.get(OBC.ItemsFinder);
        const imported = finder.import(json);
        setSavedQueries(prev => {
          const names = new Set(prev.map(q => q.name));
          return [...prev, ...imported.filter(q => !names.has(q.name))];
        });
      } catch {
        setError('Failed to parse queries file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="flex flex-col h-full gap-4">
      <p className="text-xs text-slate-400">
        Build a query by IFC category and/or attribute, then search.
      </p>

      {/* Form */}
      <div className="space-y-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Query Name</span>
          <input
            type="text"
            value={form.queryName}
            onChange={e => setForm(f => ({ ...f, queryName: e.target.value }))}
            className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="My Query"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-400">
            Category (regex) — e.g. WALL
          </span>
          <input
            type="text"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="WALL|SLAB"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-400">
            Attribute Name (regex) — e.g. Name
          </span>
          <input
            type="text"
            value={form.attrName}
            onChange={e => setForm(f => ({ ...f, attrName: e.target.value }))}
            className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Name"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-400">
            Attribute Value (regex) — e.g. Masonry
          </span>
          <input
            type="text"
            value={form.attrValue}
            onChange={e => setForm(f => ({ ...f, attrValue: e.target.value }))}
            className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Masonry"
          />
        </label>
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
        >
          <Search className="w-4 h-4" />
          {isSearching ? 'Searching…' : 'Search'}
        </button>
        <button
          onClick={handleSaveQuery}
          className="px-3 py-2 bg-slate-700 text-slate-200 text-sm rounded-lg hover:bg-slate-600 transition-colors"
          title="Save query"
        >
          Save
        </button>
      </div>

      {/* Result count */}
      {resultCount !== null && (
        <p className="text-xs text-slate-400">
          Found{' '}
          <span className="font-bold text-white">{resultCount}</span> items
          across {Object.keys(results).length} model(s).
        </p>
      )}

      {/* Saved queries */}
      {savedQueries.length > 0 && (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Saved Queries
          </p>
          <ul className="space-y-1">
            {savedQueries.map(q => (
              <li
                key={q.name}
                className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2"
              >
                <span className="flex-1 text-sm text-white truncate">
                  {q.name}
                </span>
                <button
                  onClick={() => handleRunSaved(q)}
                  className="text-xs text-brand hover:underline"
                >
                  Run
                </button>
                <button
                  onClick={() => handleDeleteQuery(q)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Download / Upload */}
      <div className="mt-auto border-t border-slate-700 pt-3 flex gap-2">
        <button
          onClick={handleDownloadQueries}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-200 text-sm rounded-lg hover:bg-slate-600 transition-colors"
        >
          <Download className="w-4 h-4" /> Download Queries
        </button>
        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-200 text-sm rounded-lg hover:bg-slate-600 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" /> Upload Queries
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleUploadQueries}
          />
        </label>
      </div>
    </div>
  );
};

export default ItemsFinderPanel;
