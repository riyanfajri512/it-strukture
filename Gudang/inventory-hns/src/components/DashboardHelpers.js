import React, { useState } from 'react';

// ==================== 1. CSS STYLES ====================
const styles = `
  * { box-sizing: border-box; }
  
  .dashboard-wrapper { 
    padding: 25px; 
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
    min-height: 100vh; 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
  }

  /* Header Card */
  .header-card { 
    background: white; 
    padding: 20px 25px; 
    border-radius: 12px; 
    margin-bottom: 25px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
  }
  .header-title { 
    margin: 0; 
    font-size: 24px; 
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .header-subtitle { 
    color: #718096; 
    font-size: 14px; 
    margin-top: 5px;
  }
  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .btn-logout { 
    background: #e53e3e; 
    color: white; 
    border: none; 
    padding: 10px 20px; 
    border-radius: 8px; 
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
  }
  .btn-logout:hover { 
    background: #c53030; 
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(229,62,62,0.3);
  }

  /* Filter Card */
  .filter-card { 
    background: white; 
    padding: 25px; 
    border-radius: 12px; 
    margin-bottom: 25px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
  }
  .filter-row { 
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }
  .filter-group { 
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .filter-label {
    font-size: 12px;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .input-field { 
    padding: 12px; 
    border: 2px solid #e2e8f0; 
    border-radius: 8px; 
    font-size: 14px;
    transition: all 0.3s;
  }
  .input-field:focus { 
    outline: none; 
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  }
  .btn-print { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: white; 
    border: none; 
    padding: 12px 24px; 
    border-radius: 8px; 
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-print:hover { 
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102,126,234,0.3);
  }
  .btn-excel { 
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
    color: white; 
    border: none; 
    padding: 12px 24px; 
    border-radius: 8px; 
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-excel:hover { 
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(72,187,120,0.3);
  }
  .filter-info {
    padding: 15px;
    background: #f7fafc;
    border-radius: 8px;
    border-left: 4px solid #667eea;
  }
  .filter-info-text {
    font-size: 14px;
    color: #4a5568;
    margin: 0;
  }
  .btn-reset {
    margin-left: 15px;
    border: none;
    background: none;
    color: #667eea;
    cursor: pointer;
    text-decoration: underline;
    font-weight: 600;
  }

  /* Multi Select */
  .multi-select-container { 
    position: relative; 
    width: 100%;
  }
  .multi-select-input { 
    padding: 12px; 
    border: 2px solid #e2e8f0; 
    border-radius: 8px; 
    width: 100%; 
    font-size: 14px;
    transition: all 0.3s;
  }
  .multi-select-input:focus { 
    outline: none; 
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  }
  .multi-select-dropdown { 
    position: absolute; 
    top: calc(100% + 5px); 
    left: 0; 
    right: 0; 
    background: white; 
    border: 2px solid #e2e8f0; 
    border-radius: 8px;
    z-index: 1000; 
    max-height: 250px; 
    overflow-y: auto; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  }
  .multi-select-item { 
    padding: 12px; 
    cursor: pointer; 
    border-bottom: 1px solid #f7fafc;
    transition: all 0.2s;
  }
  .multi-select-item:hover { 
    background-color: #edf2f7; 
  }
  .multi-select-item.selected { 
    background-color: #e6fffa; 
    color: #234e52;
    font-weight: 600;
  }
  .tags-container { 
    display: flex; 
    flex-wrap: wrap; 
    gap: 8px; 
    margin-top: 8px; 
  }
  .tag { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: white; 
    padding: 6px 12px; 
    border-radius: 20px; 
    font-size: 12px; 
    display: flex; 
    align-items: center; 
    gap: 6px;
    font-weight: 500;
  }
  .tag span { 
    cursor: pointer; 
    font-weight: bold;
    font-size: 16px;
    line-height: 1;
  }

  /* Table Container */
  .table-container { 
    background: white; 
    padding: 0; 
    border-radius: 12px; 
    box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    overflow: hidden;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    font-size: 14px; 
  }
  
  thead th { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: white; 
    padding: 16px; 
    text-transform: uppercase; 
    font-weight: 600; 
    font-size: 12px;
    letter-spacing: 0.5px;
    text-align: left; 
    cursor: pointer; 
    user-select: none;
    transition: all 0.3s;
  }
  thead th:hover { 
    background: linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%);
  }
  
  tbody tr { 
    border-bottom: 1px solid #e2e8f0;
    transition: all 0.3s;
  }
  tbody tr:hover { 
    background-color: #f7fafc; 
  }
  td { 
    padding: 16px; 
    vertical-align: middle; 
    color: #2d3748; 
  }

  /* Button Styles */
  .btn-edit { 
    background: #f6ad55; 
    border: none; 
    padding: 8px 16px; 
    border-radius: 6px; 
    cursor: pointer;
    color: white;
    font-weight: 600;
    transition: all 0.3s;
  }
  .btn-edit:hover { 
    background: #ed8936;
    transform: translateY(-2px);
  }
  .btn-add {
    background: #3182ce; color: white; border: none; padding: 10px 20px;
    border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;
    display: flex; align-items: center; gap: 8px;
  }
  .btn-add:hover { background: #2c5282; transform: translateY(-2px); }
  
  .btn-import {
    background: #38a169; color: white; border: none; padding: 10px 20px;
    border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;
    display: flex; align-items: center; gap: 8px; margin-left: 5px;
  }
  .btn-import:hover { background: #2f855a; transform: translateY(-2px); }

  .btn-delete { background: white; border: 1px solid #fc8181; padding: 8px 12px; border-radius: 6px; cursor: pointer; color: #c53030; font-weight: 600; transition: all 0.3s; margin-left: 5px; }
  .btn-delete:hover { background: #fff5f5; border-color: #c53030; }

  /* Status Badge */
  .status-badge {
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 12px;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .status-ready {
    background: #c6f6d5;
    color: #22543d;
  }
  .status-empty {
    background: #fed7d7;
    color: #742a2a;
  }

  /* Edit Form */
  .edit-form {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .edit-input {
    padding: 6px 10px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    width: 100px;
    font-size: 14px;
  }
  .btn-save {
    background: #48bb78;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-cancel {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }

  /* Responsive */
  @media only screen and (max-width: 768px) {
    .dashboard-wrapper { padding: 15px; }
    .header-card { flex-direction: column; gap: 15px; text-align: center; }
    .filter-row { grid-template-columns: 1fr; }
    
    thead { display: none; }
    tbody tr { 
      display: block; 
      background: white; 
      margin-bottom: 15px; 
      border-radius: 12px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
      padding: 15px; 
      border: none;
    }
    tbody td { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 12px 0; 
      border-bottom: 1px solid #f7fafc;
      text-align: right; 
    }
    tbody td:last-child { border-bottom: none; }
    tbody td::before { 
      content: attr(data-label); 
      font-weight: 600; 
      color: #718096; 
      font-size: 12px; 
      text-transform: uppercase; 
      text-align: left; 
    }
    .no-mobile { display: none; }
  }

  @media print {
    .no-print { display: none !important; }
    .dashboard-wrapper { background: white; padding: 0; }
    .table-container { box-shadow: none; }
    thead th { background: #eee !important; color: black !important; }
    tr.not-selected { display: none !important; }
    .print-only { 
        display: inline-block !important; 
        font-weight: bold;
        border: 1px solid #000;
        padding: 2px 8px;
        border-radius: 4px;
    }

    /* Print: Status Badge khusus untuk print */
    .status-badge {
      background: transparent !important;
      color: black !important;
      border: 1px solid #333 !important;
      font-weight: bold !important;
    }
    /* SUDAH DIHAPUS BAGIAN YANG BIKIN DOUBLE */
  }
`;

// ==================== 2. COMPONENT: MULTI SELECT ====================
function MultiSelect({ label, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggleOption = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(item => item !== val));
    } else {
      onChange([...selected, val]);
    }
    setSearch("");
  };

  const filteredOptions = options.filter(opt =>
    opt && opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      <div className="multi-select-container">
        <input
          className="multi-select-input"
          placeholder={`🔍 Cari ${label}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {isOpen && (
          <div className="multi-select-dropdown">
            {filteredOptions.length > 0 ? filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                className={`multi-select-item ${selected.includes(opt) ? 'selected' : ''}`}
                onClick={() => toggleOption(opt)}
              >
                {selected.includes(opt) ? "✅ " : ""}{opt}
              </div>
            )) : (
              <div style={{ padding: '12px', color: '#a0aec0', textAlign: 'center' }}>
                Tidak ditemukan
              </div>
            )}
          </div>
        )}
        {selected.length > 0 && (
          <div className="tags-container">
            {selected.map((item, idx) => (
              <div key={idx} className="tag">
                {item}
                <span onClick={() => onChange(selected.filter(i => i !== item))}>×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 3. COMPONENT: EDIT FORM ====================
function EditForm({ form, setForm, onSave, onCancel }) {
  return (
    <div className="edit-form">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <small style={{ fontSize: '10px' }}>Stok</small>
        <input
          type="number"
          className="edit-input"
          value={form.stok}
          onChange={e => setForm({ ...form, stok: e.target.value })}
          placeholder="Stok"
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <small style={{ fontSize: '10px' }}>Harga</small>
        <input
          type="number"
          className="edit-input"
          value={form.harga}
          onChange={e => setForm({ ...form, harga: e.target.value })}
          placeholder="Harga"
        />
      </div>
      <button onClick={onSave} className="btn-save" title="Simpan">💾</button>
      <button onClick={onCancel} className="btn-cancel" title="Batal">✖</button>
    </div>
  );
}

export { styles, MultiSelect, EditForm };