import React, { useState, useEffect } from 'react';
import { Layout, Database, Plus, RefreshCw, Trash2, PieChart, Filter, Group, Calculator, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDatasets, getDatasetById, queryDataset, uploadDataset, deleteDataset } from './services/api';
import './index.css';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [currentDataset, setCurrentDataset] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [datasetName, setDatasetName] = useState("");
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'query'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [queryPage, setQueryPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  // Query State
  const [queryOptions, setQueryOptions] = useState({
    filters: [],
    groupings: [],
    aggregations: []
  });
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchDatasetDetails(selectedDatasetId, previewPage, searchTerm);
    }
  }, [selectedDatasetId, previewPage, searchTerm]);

  const fetchDatasets = async () => {
    try {
      const { data } = await getDatasets();
      setDatasets(data);
      if (data.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDatasetDetails = async (id, page = 1, search = "") => {
    setLoading(true);
    try {
      const { data } = await getDatasetById(id, page, ROWS_PER_PAGE, search);
      setCurrentDataset(data);
      // Reset query when completely switching dataset root ID
      if (currentDataset?.dataset?.id !== id) {
          setQueryResult(data.records);
          setQueryOptions({ filters: [], groupings: [], aggregations: [] });
          setQueryPage(1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
        setError("Please select a file to upload.");
        return;
    }

    // Edge Case: Invalid file format validation
    const validExtensions = ['.csv', '.json'];
    const fileName = uploadFile.name.toLowerCase();
    if (!validExtensions.some(ext => fileName.endsWith(ext))) {
       setError("Invalid file format. Only CSV and JSON files are supported.");
       return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (datasetName) formData.append('name', datasetName);

    try {
      setLoading(true);
      await uploadDataset(formData);
      setIsUploading(false);
      setUploadFile(null);
      setDatasetName("");
      setSuccess("Your dataset has been successfully processed and is ready for analysis!");
      await fetchDatasets();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dataset?")) return;
    try {
        await deleteDataset(id);
        fetchDatasets();
        setSelectedDatasetId(null);
        setCurrentDataset(null);
    } catch (err) {
        setError(err.message);
    }
  };

  const handleRunQuery = async () => {
    if (!selectedDatasetId) return;

    // Edge Case: Invalid or incomplete query parameters
    if (queryOptions.filters.some(f => !f.field || !f.value || !f.operator)) {
        setError("Invalid query: All filters must have a Field, Operator, and Value.");
        return;
    }
    if (queryOptions.aggregations.some(a => !a.field || !a.op)) {
        setError("Invalid query: All aggregations must have a Field and Operation selected.");
        return;
    }

    setLoading(true);
    try {
      const { data } = await queryDataset(selectedDatasetId, { ...queryOptions, page: queryPage, limit: ROWS_PER_PAGE });
      // Depending on backend structure, data.data might hold the array, 
      // and data.pagination holds the metadata.
      setQueryResult(data.data || data); // handle arrays dynamically
      setCurrentDataset(prev => ({ ...prev, queryPagination: data.pagination }));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     // Auto-fetch next block if a query is already actively displaying results
     if (queryResult) {
        handleRunQuery();
     }
  }, [queryPage]);

  // Edge Case: Handling inconsistent/missing fields and empty datasets
  const getColumns = () => {
    if (!currentDataset?.records || currentDataset.records.length === 0) return [];
    const keys = new Set();
    // Sample first 50 rows to capture sporadically missing fields
    const sample = currentDataset.records.slice(0, 50);
    sample.forEach(row => {
       if (row && typeof row === 'object') {
           Object.keys(row).forEach(k => keys.add(k));
       }
    });
    return Array.from(keys);
  };
  const columns = getColumns();

  // Server-Side Preview Pagination
  const previewTotalPages = currentDataset?.pagination?.totalPages || 1;
  const previewTotalRecords = currentDataset?.pagination?.totalRecords || (currentDataset?.records?.length || 0);

  // Server-Side Results Pagination
  const resultsTotalPages = currentDataset?.queryPagination ? currentDataset.queryPagination.totalPages : previewTotalPages;
  const resultsTotalRecords = currentDataset?.queryPagination ? currentDataset.queryPagination.totalRecords : previewTotalRecords;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">DATALOGIX.</div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>DATASETS</span>
            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setIsUploading(true)}>
              <Plus size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {datasets.map(ds => (
              <div 
                key={ds.id} 
                className={`nav-item ${selectedDatasetId === ds.id ? 'active' : ''}`}
                onClick={() => setSelectedDatasetId(ds.id)}
              >
                <Database size={18} />
                <span style={{ flex: 1, wordBreak: 'break-all' }} title={ds.name}>{ds.name}</span>
                {selectedDatasetId === ds.id && <Trash2 size={16} className="danger" onClick={(e) => { e.stopPropagation(); handleDelete(ds.id); }} style={{ flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="main-content">


        {selectedDatasetId ? (
          <>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{currentDataset?.dataset?.name}</h1>
                <p style={{ color: 'var(--text-muted)' }}>{previewTotalRecords} records • Type: {currentDataset?.dataset?.type?.toUpperCase()}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('dashboard')}>
                   <Layout size={18} /> Overview
                </button>
                <button className={`btn ${activeTab === 'query' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('query')}>
                   <Calculator size={18} /> Query Builder
                </button>
              </div>
            </header>

            {activeTab === 'dashboard' ? (
              <section className="animate-fade">
                <div className="card">
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                     <h3 style={{ margin: 0 }}>Preview (Searchable)</h3>
                     <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" placeholder="Search dataset..." style={{ paddingLeft: '36px', width: '100%' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                     </div>
                   </div>
                   <div className="data-table-container">
                     {currentDataset?.records?.length > 0 ? (
                       <table>
                         <thead>
                           <tr>
                             {columns.map(col => <th key={col}>{col}</th>)}
                           </tr>
                         </thead>
                         <tbody>
                           {currentDataset?.records?.map((row, i) => (
                             <tr key={i}>
                               {columns.map(col => <td key={col}>{typeof row[col] === 'object' && row[col] !== null ? JSON.stringify(row[col]) : String(row[col] ?? '')}</td>)}
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     ) : <p>No records found.</p>}
                   </div>

                   {currentDataset?.records?.length > 0 && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
                       <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                         Showing {(previewPage - 1) * ROWS_PER_PAGE + 1} to {Math.min(previewPage * ROWS_PER_PAGE, previewTotalRecords)} of {previewTotalRecords} entries
                       </span>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <button className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={previewPage === 1} onClick={() => setPreviewPage(p => p - 1)}>
                           <ChevronLeft size={16} />
                         </button>
                         <button className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={previewPage >= previewTotalPages} onClick={() => setPreviewPage(p => p + 1)}>
                           <ChevronRight size={16} />
                         </button>
                       </div>
                     </div>
                   )}
                </div>
              </section>
            ) : (
              <section className="animate-fade">
                <div className="card">
                   <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Calculator size={20} color="var(--primary)" /> Query Configuration
                   </h3>
                   
                   {/* Filter Section */}
                   <div style={{ marginBottom: '2rem' }}>
                      <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Filters</p>
                      {queryOptions.filters.map((f, i) => (
                        <div key={i} className="query-row" style={{ marginBottom: '1rem' }}>
                           <div className="form-group">
                              <label>Field</label>
                              <select value={f.field} onChange={e => {
                                const nf = [...queryOptions.filters];
                                nf[i].field = e.target.value;
                                setQueryOptions({...queryOptions, filters: nf});
                              }}>
                                <option value="">Select Field</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>
                           <div className="form-group">
                              <label>Op</label>
                              <select value={f.operator} onChange={e => {
                                const nf = [...queryOptions.filters];
                                nf[i].operator = e.target.value;
                                setQueryOptions({...queryOptions, filters: nf});
                              }}>
                                <option value="eq">Equals</option>
                                <option value="ne">Not Equals</option>
                                <option value="gt">Greater Than</option>
                                <option value="lt">Less Than</option>
                              </select>
                           </div>
                           <div className="form-group">
                              <label>Value</label>
                              <input type="text" value={f.value} onChange={e => {
                                const nf = [...queryOptions.filters];
                                nf[i].value = e.target.value;
                                setQueryOptions({...queryOptions, filters: nf});
                              }} placeholder="Value..." />
                           </div>
                           <button className="btn btn-secondary" style={{ padding: '0.75rem', border: 'none' }} onClick={() => {
                              const nf = queryOptions.filters.filter((_, idx) => idx !== i);
                              setQueryOptions({...queryOptions, filters: nf});
                           }}>
                              <Trash2 size={18} />
                           </button>
                        </div>
                      ))}
                      <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setQueryOptions({...queryOptions, filters: [...queryOptions.filters, {field: '', value: '', operator: 'eq'}]})}>
                        <Plus size={16} /> Add Filter
                      </button>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                      {/* Group By */}
                      <div>
                        <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Group By</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                           {columns.map(col => (
                             <div 
                               key={col} 
                               style={{ 
                                 padding: '0.5rem 1rem', 
                                 borderRadius: '2rem', 
                                 backgroundColor: queryOptions.groupings.includes(col) ? 'var(--primary)' : 'var(--glass)',
                                 cursor: 'pointer',
                                 fontSize: '0.875rem'
                               }}
                               onClick={() => {
                                 const ng = queryOptions.groupings.includes(col) 
                                   ? queryOptions.groupings.filter(g => g !== col)
                                   : [...queryOptions.groupings, col];
                                 setQueryOptions({...queryOptions, groupings: ng});
                               }}
                             >
                               {col}
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Aggregations */}
                      <div>
                        <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Aggregations</p>
                        {queryOptions.aggregations.map((a, i) => (
                           <div key={i} className="query-row" style={{ marginBottom: '1rem' }}>
                              <select value={a.field} onChange={e => {
                                const na = [...queryOptions.aggregations];
                                na[i].field = e.target.value;
                                setQueryOptions({...queryOptions, aggregations: na});
                              }}>
                                <option value="">Field</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <select value={a.op} onChange={e => {
                                const na = [...queryOptions.aggregations];
                                na[i].op = e.target.value;
                                setQueryOptions({...queryOptions, aggregations: na});
                              }}>
                                <option value="sum">Sum</option>
                                <option value="avg">Avg</option>
                                <option value="count">Count</option>
                                <option value="min">Min</option>
                                <option value="max">Max</option>
                              </select>
                              <button className="btn btn-secondary" style={{ border: 'none' }} onClick={() => {
                                  const na = queryOptions.aggregations.filter((_, idx) => idx !== i);
                                  setQueryOptions({...queryOptions, aggregations: na});
                              }}>
                                <X size={16} />
                              </button>
                           </div>
                        ))}
                        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setQueryOptions({...queryOptions, aggregations: [...queryOptions.aggregations, {field: '', op: 'sum'}]})}>
                           <Plus size={16} /> Add Aggregate
                        </button>
                      </div>
                   </div>

                   <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={handleRunQuery} disabled={loading}>
                      {loading ? <RefreshCw className="spinner" size={18} /> : <Calculator size={18} />} Run Analysis
                   </button>
                </div>

                {queryResult && (
                  <div className="card">
                     <h3 style={{ marginBottom: '1rem' }}>Results</h3>
                     <div className="data-table-container">
                        <table>
                           <thead>
                              <tr>
                                 {Object.keys(queryResult[0] || {}).map(k => <th key={k}>{k}</th>)}
                              </tr>
                           </thead>
                           <tbody>
                              {queryResult?.map((row, i) => (
                                 <tr key={i}>
                                    {Object.values(row).map((v, idx) => <td key={idx}>{typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '')}</td>)}
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                        {(!queryResult || queryResult.length === 0) && <p style={{ padding: '1rem' }}>No results found.</p>}
                     </div>

                     {queryResult?.length > 0 && (
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
                         <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                           Showing {(queryPage - 1) * ROWS_PER_PAGE + 1} to {Math.min(queryPage * ROWS_PER_PAGE, resultsTotalRecords)} of {resultsTotalRecords} entries
                         </span>
                         <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <button className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={queryPage === 1} onClick={() => { setQueryPage(p => p - 1); setTimeout(handleRunQuery, 0); }}>
                             <ChevronLeft size={16} />
                           </button>
                           <button className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={queryPage >= resultsTotalPages} onClick={() => { setQueryPage(p => p + 1); setTimeout(handleRunQuery, 0); }}>
                             <ChevronRight size={16} />
                           </button>
                         </div>
                       </div>
                     )}
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
             <Database size={64} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
             <h2>No Dataset Selected</h2>
             <p style={{ color: 'var(--text-muted)' }}>Choose a dataset from the sidebar or upload a new one.</p>
             <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setIsUploading(true)}>
               Upload Your First File
             </button>
          </div>
        )}
      </main>

      {/* Upload Modal Overlay */}
      {isUploading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                 <h3>Upload New Dataset</h3>
                 <X size={24} style={{ cursor: 'pointer' }} onClick={() => setIsUploading(false)} />
              </div>
              
              <form onSubmit={handleUpload}>
                 <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Dataset Name (Optional)</label>
                    <input type="text" value={datasetName} onChange={e => setDatasetName(e.target.value)} placeholder="Marketing Data 2024..." />
                 </div>
                 
                 <div style={{ 
                    border: '2px dashed var(--border)', 
                    borderRadius: '1rem', 
                    padding: '3rem', 
                    textAlign: 'center', 
                    marginBottom: '1.5rem',
                    cursor: 'pointer',
                    backgroundColor: uploadFile ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    borderColor: uploadFile ? 'var(--primary)' : 'var(--border)'
                 }}>
                    <input 
                       type="file" 
                       id="file-upload" 
                       style={{ display: 'none' }} 
                       accept=".csv,.json"
                       onChange={e => setUploadFile(e.target.files[0])}
                    />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                       <Plus size={48} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
                       <p>{uploadFile ? uploadFile.name : "Click to browse CSV or JSON"}</p>
                    </label>
                 </div>

                 <button className="btn btn-primary" style={{ width: '100%' }} disabled={!uploadFile || loading}>
                    {loading ? "Processing..." : "Ingest Data"}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Error Modal Overlay */}
      {error && (
        <div className="animate-fade" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="card" style={{ width: '450px', maxWidth: '90%', borderTop: '4px solid var(--danger)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--danger)' }}>
                 <div style={{ backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
                   <X size={20} style={{ strokeWidth: 3 }} />
                 </div>
                 <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Action Required</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
                 {error}
              </p>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setError(null)}>
                 Dismiss
              </button>
           </div>
        </div>
      )}

      {/* Success Modal Overlay */}
      {success && (
        <div className="animate-fade" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="card" style={{ width: '450px', maxWidth: '90%', borderTop: '4px solid var(--accent)', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                 <div style={{ backgroundColor: '#ccfbf1', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
                   <Database size={20} style={{ strokeWidth: 3 }} />
                 </div>
                 <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Success!</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
                 {success}
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSuccess(null)}>
                 Continue
              </button>
           </div>
        </div>
      )}

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
