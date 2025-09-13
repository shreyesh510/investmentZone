import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import ImportTradePnLConfirmationModal from './importTradePnLConfirmationModal';

interface Props {
  open: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onImported: () => void;
}

const ImportTradePnLModal: React.FC<Props> = ({ open, isDarkMode, onClose, onImported }) => {
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
    
    // Map columns to trade P&L structure
    const mappedItems = rows.map((r, index) => {
      console.log(`Processing row ${index}:`, r);
      
      // Date mapping - handle various date formats (Delta Exchange uses "Time" column)
      const dateRaw = r.Time || r.Date || r.date || r.timestamp || '';
      
      // Symbol mapping (Delta Exchange uses "Contract" column)
      const symbol = r.Contract || r.Symbol || r.symbol || r.Instrument || r.instrument || '';
      
      // Side mapping (Delta Exchange uses "Side" column)
      const sideRaw = String(r.Side || r.side || r.Type || r.type || 'buy').toLowerCase();
      const side = sideRaw === 'sell' ? 'sell' : 'buy';
      
      // P&L mapping - use "Realised P&L" column from Delta Exchange and subtract Trading Fees
      const realisedPnL = Number(r['Realised P&L'] || r['Realised PnL'] || r.RealisedPnL || 0);
      const tradingFees = Number(r['Trading Fees'] || r.TradingFees || r.Fees || r.fees || 0);
      
      // Skip if Realised P&L is 0 (open positions with no realized profit/loss)
      if (realisedPnL === 0) {
        console.log(`Skipping row ${index}: Realised P&L is 0`);
        return null;
      }
      
      // Net P&L after fees
      const netPnLAfterFees = realisedPnL - tradingFees;
      const profit = netPnLAfterFees > 0 ? netPnLAfterFees : 0;
      const loss = netPnLAfterFees < 0 ? Math.abs(netPnLAfterFees) : 0;
      const netPnL = netPnLAfterFees;

      // Trade counts mapping
      const totalTrades = Number(r['Total Trades'] || r.TotalTrades || r.Trades || r.trades || 0);
      const winningTrades = Number(r['Winning Trades'] || r.WinningTrades || r.Wins || r.wins || 0);
      const losingTrades = Number(r['Losing Trades'] || r.LosingTrades || r.Losses || r.losses || 0);

      // Notes mapping
      const notes = r.Notes || r.notes || r.Description || r.description || '';

      // Enhanced date parsing
      let dateValue = '';
      if (dateRaw) {
        try {
          let dateStr = String(dateRaw).trim();
          
          // Handle various date formats
          if (dateStr.includes(' IST ') || dateStr.includes('+')) {
            // Handle "2025-09-05 20:27:42.507554+05:30 IST Asia/Kolkata" format
            dateStr = dateStr.split(' ')[0]; // Extract just the date part
          }
          
          // Try parsing the date
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            dateValue = parsedDate.toISOString().split('T')[0];
          } else {
            // If parsing fails, try to extract date-like pattern
            const dateMatch = dateStr.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
            if (dateMatch) {
              const normalizedDate = dateMatch[1].replace(/\//g, '-');
              const testDate = new Date(normalizedDate);
              if (!isNaN(testDate.getTime())) {
                dateValue = testDate.toISOString().split('T')[0];
              }
            }
          }
        } catch (error) {
          console.warn('Date parsing error for:', dateRaw, error);
          dateValue = '';
        }
      }

      const item = {
        date: dateValue,
        symbol: symbol,
        side: side,
        profit: profit,
        loss: Math.abs(loss), // Ensure loss is positive
        netPnL: netPnL,
        totalTrades: totalTrades || undefined,
        winningTrades: winningTrades || undefined,
        losingTrades: losingTrades || undefined,
        notes: notes || undefined,
      };
      
      console.log(`Mapped row ${index}:`, item);
      return item;
    });
    
    console.log('All mapped items (before null filter):', mappedItems);
    
    // First filter out null values (rows with 0 Realised P&L)
    const nonNullItems = mappedItems.filter(item => item !== null);
    console.log('Items after null filter:', nonNullItems);
    
    const filteredItems = nonNullItems.filter(item => {
      const isValid = item.date && 
        item.symbol &&
        Number.isFinite(item.profit) && 
        Number.isFinite(item.loss) && 
        Number.isFinite(item.netPnL) &&
        item.netPnL !== 0; // Only include trades with realized P&L (exclude open positions)
      
      if (!isValid) {
        console.log('Filtered out invalid item:', item, {
          hasDate: !!item.date,
          hasSymbol: !!item.symbol,
          hasProfit: Number.isFinite(item.profit),
          hasLoss: Number.isFinite(item.loss),
          hasNetPnL: Number.isFinite(item.netPnL),
          hasRealisedPnL: item.netPnL !== 0
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
        alert('No valid rows found in the selected file. Please check the file format and ensure it contains valid trade P&L data.');
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
      const { tradePnLApi } = await import('../../../../services/tradePnLApi');
      const res = await tradePnLApi.bulkImport(confirmedItems);
      
      if (res.errors && res.errors.length > 0) {
        console.error('Import errors:', res.errors);
      }
      
      alert(`Imported: ${res.created}, Skipped (duplicates/invalid): ${res.skipped}${res.errors.length > 0 ? `\n\nErrors: ${res.errors.join('\n')}` : ''}`);
      onImported();
      handleCloseAll();
    } catch (e: any) {
      console.error('Import error:', e);
      alert(`Import failed: ${e.response?.data?.message || e.message || 'Please try again.'}`);
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
            <h2 className="text-xl font-bold">Import Trade P&L</h2>
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
              <strong>Required columns:</strong> Time/Date, Contract/Symbol, Side, Realised P&L, Trading Fees
              <br />
              <strong>Delta Exchange format:</strong> Time, Contract, Side, Realised P&L, Trading Fees columns are automatically mapped
              <br />
              <em>Note:</em> Trading fees are automatically deducted from P&L. Only trades with non-zero P&L (after fees) will be imported.
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ImportTradePnLConfirmationModal
        open={showConfirmation}
        isDarkMode={isDarkMode}
        items={parsedItems}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmImport}
        loading={busy}
      />
    </>
  );
};

export default ImportTradePnLModal;