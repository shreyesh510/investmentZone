import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import ImportConfirmationModal from './importConfirmationModal';

interface Props {
  open: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onImported: () => void;
}

const ImportPositionsModal: React.FC<Props> = ({ open, isDarkMode, onClose, onImported }) => {
  const [account, setAccount] = useState<'main' | 'longterm'>('main');
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : '');
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    return rows;
  };

  const parseFile = async (): Promise<any[]> => {
    const f = fileRef.current?.files?.[0];
    if (!f) return [];
    
    let rows: any[] = [];
    
    // Determine file type and parse accordingly
    const fileExtension = f.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'csv') {
      // Parse CSV
      const text = await f.text();
      rows = parseCSV(text);
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      // Parse Excel
      const data = await f.arrayBuffer();
      const wb = XLSX.read(data);
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
    } else if (['txt', 'tsv'].includes(fileExtension || '')) {
      // Parse TSV or tab-separated text files
      const text = await f.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length >= 2) {
        const headers = lines[0].split('\t').map(h => h.trim());
        rows = lines.slice(1).map(line => {
          const values = line.split('\t').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      }
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }
    
    console.log('Raw rows from file:', rows);
    
    // Enhanced column mapping for various formats including Delta Exchange
    const mappedItems = rows.map((r, index) => {
      console.log(`Processing row ${index}:`, r);
      
      // Date mapping - handle various date formats
      const dateValue = r.Time || r.Date || r.date || r.Timestamp || r.timestamp || '';
      
      // Symbol mapping - clean up contract names (remove USD suffix for crypto)
      const symbolRaw = r.Contract || r.Symbol || r.symbol || '';
      const symbol = symbolRaw.replace(/USD$/, ''); // Remove USD suffix for crypto pairs
      
      // Side mapping
      const sideRaw = String(r.Side || r.side || 'buy').toLowerCase();
      const side = sideRaw === 'sell' ? 'sell' : 'buy';
      
      // Quantity/Lots mapping
      const lots = Math.abs(Number(r.Qty || r.Lots || r.lots || r.Quantity || 0));
      
      // Price mapping - prefer execution price over order price
      const entryPrice = Number(
        r['Exec.Price'] || 
        r.ExecutionPrice || 
        r['Execution Price'] || 
        r.Entry || 
        r['Entry Price'] || 
        r.entryPrice || 
        r['Order Price'] || 
        r.Price || 
        0
      );
      
      // Investment amount mapping - prefer order value over calculated amount
      const investedAmountRaw = Number(
        r['Order Value'] || 
        r.OrderValue || 
        r.Amount || 
        r.Margin || 
        r.Invested || 
        r.investedAmount || 
        (lots * entryPrice) || 
        0
      );
      const investedAmount = investedAmountRaw > 0 ? investedAmountRaw : undefined;
      
      // Platform detection - default to Delta Exchange if Contract field exists
      const platform = r.Platform || r.platform || (r.Contract ? 'Delta Exchange' : undefined);
      
      // P&L mapping for closed positions
      const pnl = Number(r['Realised P&L'] || r.RealisedPnL || r.PnL || r.pnl || 0) || undefined;
      
      const item = {
        date: dateValue,
        symbol: symbol,
        side: side,
        lots: lots,
        entryPrice: entryPrice,
        investedAmount: investedAmount,
        platform: platform,
        account: account,
        pnl: pnl, // Include P&L for reference
      };
      
      console.log(`Mapped row ${index}:`, item);
      return item;
    });
    
    console.log('All mapped items:', mappedItems);
    
    const filteredItems = mappedItems.filter(item => {
      const isValid = item.symbol && 
        item.lots > 0 && 
        item.entryPrice > 0 &&
        (item.investedAmount || 0) > 0;
      
      if (!isValid) {
        console.log('Filtered out invalid item:', item, {
          hasSymbol: !!item.symbol,
          hasLots: item.lots > 0,
          hasEntryPrice: item.entryPrice > 0,
          hasInvestedAmount: (item.investedAmount || 0) > 0
        });
      }
      
      return isValid;
    });
    
    console.log('Filtered valid items:', filteredItems);
    return filteredItems;
  };

  const handleParseFile = async () => {
    try {
      setBusy(true);
      const items = await parseFile();
      console.log('Parsed items from file:', items);
      console.log('Number of items:', items.length);
      
      if (!items.length) {
        alert('No valid rows found in the selected file. Please check the file format and ensure it contains valid position data.');
        return;
      }
      setParsedItems(items);
      setShowConfirmation(true);
    } catch (e) {
      console.error('Import error:', e);
      alert(`Import failed: ${e.message || 'Please check your file format.'}`);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmImport = async (confirmedItems: any[]) => {
    try {
      setBusy(true);
      const { positionsApi } = await import('../../../../../services/positionsApi');
      const res = await positionsApi.importPositions(confirmedItems, account);
      alert(`Imported: ${res.created}, Skipped (duplicates/invalid): ${res.skipped}`);
      onImported();
      handleCloseAll();
    } catch (e) {
      console.error(e);
      alert('Import failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleCloseAll = () => {
    setShowConfirmation(false);
    setParsedItems([]);
    setFileName('');
    if (fileRef.current) {
      fileRef.current.value = '';
    }
    onClose();
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setBusy(false);
  };

  return (
    <>
      {/* File Upload Modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`w-full max-w-lg rounded-2xl backdrop-blur-lg border p-8 ${
          isDarkMode 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20 text-white' 
            : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10 text-gray-900'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Import Positions</h2>
            <button 
              onClick={handleCloseAll} 
              className={`p-2 rounded-2xl transition-colors ${
                isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Account</label>
              <select 
                value={account} 
                onChange={(e) => setAccount(e.target.value as any)} 
                disabled={busy}
                className={`w-full p-3 rounded-2xl border backdrop-blur-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50`}
              >
                <option value="main">Main</option>
                <option value="longterm">Longterm</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Import file (.xlsx, .xls, .csv, .txt, .tsv)</label>
              <input 
                ref={fileRef} 
                type="file" 
                accept=".xlsx,.xls,.csv,.txt,.tsv" 
                onChange={onFileChange} 
                disabled={busy}
                className={`w-full p-3 rounded-2xl border backdrop-blur-lg ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:bg-blue-500 file:text-white hover:file:bg-blue-600' 
                    : 'bg-white/70 border-gray-300/50 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:bg-blue-500 file:text-white hover:file:bg-blue-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50`}
              />
              {fileName && <div className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selected: {fileName}</div>}
            </div>
            <div className="flex gap-4 pt-2">
              <button 
                disabled={busy || !fileName} 
                onClick={handleParseFile} 
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'Parsing…' : 'Preview & Confirm'}
              </button>
              <button 
                disabled={busy} 
                onClick={handleCloseAll} 
                className={`px-6 py-3 font-medium rounded-2xl transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' 
                    : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
            </div>
            <div className={`text-sm p-4 rounded-2xl ${
              isDarkMode ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-100/50 text-gray-600'
            }`}>
              <strong>Supported formats:</strong> Excel (.xlsx, .xls), CSV (.csv), TSV/Text (.txt, .tsv)
              <br />
              <strong>Delta Exchange CSV:</strong> Use direct export from Delta - automatically detects Time, Contract, Qty, Side, Exec.Price, Order Value
              <br />
              <strong>Custom format columns:</strong> Date, Symbol, Side, Lots, Entry Price, Investment Amount, Platform (optional)
              <br />
              <em>Note:</em> Invalid rows are filtered out. Crypto symbols with "USD" suffix are automatically cleaned.
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ImportConfirmationModal
        open={showConfirmation}
        isDarkMode={isDarkMode}
        items={parsedItems}
        account={account}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmImport}
        loading={busy}
      />
    </>
  );
};

export default ImportPositionsModal;
