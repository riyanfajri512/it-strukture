import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import AddProductModal from './AddProductModal';
import ImportModal from './ImportModal';
import { styles, MultiSelect } from './DashboardHelpers'; // EditForm dihapus karena kita pakai input langsung
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== MAIN DASHBOARD ====================
function Dashboard({ user, onLogout }) {
    // ===== STATE MANAGEMENT =====
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [filterCats, setFilterCats] = useState([]);
    const [filterBrands, setFilterBrands] = useState([]);
    const [status, setStatus] = useState("Semua");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [checked, setChecked] = useState({});
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // State untuk Edit
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ 
        modal: 0, 
        srp: 0, 
        jual: 0, 
        stok: 0 
    });

    // ===== LOAD PRODUCTS =====
    const loadProducts = () => {
        fetch('http://localhost:5000/api/products')
            .then(r => r.json())
            .then(d => {
                if (Array.isArray(d)) setProducts(d);
                else setProducts([]);
            })
            .catch(err => {
                console.error(err);
                setProducts([]);
            });
    };

    useEffect(() => { loadProducts(); }, []);

    // ===== DATA FOR FILTERS & SORTING =====
    const uniqueCats = useMemo(() => [...new Set(products.map(i => i.kategori).filter(Boolean))].sort(), [products]);
    const uniqueBrands = useMemo(() => [...new Set(products.map(i => i.brand).filter(Boolean))].sort(), [products]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };
    const getSortIcon = (colName) => {
        if (sortConfig.key !== colName) return "";
        return sortConfig.direction === 'asc' ? " ⬆️" : " ⬇️";
    };

    // ===== FILTER LOGIC =====
    const processedProducts = useMemo(() => {
        let result = [...products];
        if (search) {
            const searchTerms = search.toLowerCase().split(" ").filter(term => term.trim() !== "");
            result = result.filter(p => {
                const fullData = `${p.id || ''} ${p.nama || ''} ${p.brand || ''} ${p.kategori || ''}`.toLowerCase();
                return searchTerms.every(term => fullData.includes(term));
            });
        }
        if (filterCats.length > 0) result = result.filter(p => filterCats.includes(p.kategori));
        if (filterBrands.length > 0) result = result.filter(p => filterBrands.includes(p.brand));
        if (status === "Ready") result = result.filter(p => p.stok > 0);
        else if (status === "Kosong") result = result.filter(p => p.stok <= 0);

        if (sortConfig.key) {
            result.sort((a, b) => {
                let valA = a[sortConfig.key] || 0;
                let valB = b[sortConfig.key] || 0;
                if (!isNaN(valA) && !isNaN(valB)) { valA = parseFloat(valA); valB = parseFloat(valB); }
                else { valA = valA.toString().toLowerCase(); valB = valB.toString().toLowerCase(); }
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [products, search, filterCats, filterBrands, status, sortConfig]);

    // ===== CRUD: EDIT (UPDATED UNTUK SEMUA HARGA) =====
    const handleStartEdit = (item) => {
        setEditingId(item.id);
        // Isi form dengan data yang ada sekarang
        setEditForm({ 
            modal: item.harga_beli, 
            srp: item.harga_dealer, 
            jual: item.harga_jual, 
            stok: item.stok 
        });
    };

    const handleSaveEdit = async (id) => {
        Swal.showLoading();
        try {
            const res = await fetch('http://localhost:5000/api/update-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kodeBarang: id,
                    stokBaru: editForm.stok,
                    hargaJualBaru: editForm.jual,
                    hargaBeliBaru: editForm.modal,   // Kirim Modal Baru
                    hargaDealerBaru: editForm.srp    // Kirim SRP Baru
                })
            });
            const data = await res.json();

            if (data.success) {
                // Update tampilan lokal tanpa refresh
                setProducts(products.map(p =>
                    p.id === id
                        ? { 
                            ...p, 
                            stok: parseInt(editForm.stok), 
                            harga_jual: parseInt(editForm.jual),
                            harga_beli: parseInt(editForm.modal),
                            harga_dealer: parseInt(editForm.srp)
                          }
                        : p
                ));
                setEditingId(null);
                Swal.fire('Sukses', 'Data berhasil diupdate!', 'success');
            } else {
                Swal.fire('Gagal', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Koneksi server gagal', 'error');
        }
    };

    // ===== CRUD: DELETE =====
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Barang?',
            text: `Yakin ingin menghapus barang ${id}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus!'
        });
        if (result.isConfirmed) {
            try {
                const res = await fetch(`http://localhost:5000/api/delete-product/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    Swal.fire('Terhapus!', 'Barang berhasil dihapus', 'success');
                    loadProducts();
                } else { Swal.fire('Gagal', data.message, 'error'); }
            } catch (error) { Swal.fire('Error', 'Gagal menghubungi server', 'error'); }
        }
    };

    const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    // ===== EXPORT FUNCTIONS =====
    const handlePrint = () => {
        if (Object.values(checked).filter(Boolean).length === 0) return Swal.fire('Info', 'Pilih barang dulu!', 'info');
        window.print();
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const dataToPrint = Object.keys(checked).length > 0 ? processedProducts.filter(p => checked[p.id]) : processedProducts;
        if (dataToPrint.length === 0) return Swal.fire('Info', 'Tidak ada data', 'info');

        doc.setFontSize(18);
        doc.text("HNS IT CENTER", 14, 20);
        doc.setFontSize(10);
        doc.text(`Dicetak Oleh: ${user.name} | Tanggal: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.line(14, 32, 196, 32);

        const tableColumn = ["Kode", "Nama Barang", "Kategori", "Brand", "SRP", "JUAL", "Stok", "Status"];
        const tableRows = [];

        dataToPrint.forEach(item => {
            tableRows.push([
                item.id, item.nama, item.kategori, item.brand,
                formatRp(item.harga_dealer), formatRp(item.harga_jual),
                item.stok, item.stok > 0 ? "READY" : "KOSONG"
            ]);
        });

        autoTable(doc, {
            head: [tableColumn], body: tableRows, startY: 35, theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            columnStyles: { 0: { cellWidth: 20 }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'center' } }
        });
        doc.save(`Katalog_HNS_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const handleCheckAll = (isChecked) => {
        const newCheck = {};
        if (isChecked) processedProducts.forEach(p => newCheck[p.id] = true);
        setChecked(newCheck);
    };

    const handleResetFilters = () => { setSearch(""); setFilterCats([]); setFilterBrands([]); setStatus("Semua"); };
    const hasActiveFilters = filterCats.length > 0 || filterBrands.length > 0 || search || status !== "Semua";

    // Style khusus input edit agar rapi
    const inputEditStyle = {
        width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #3182ce', fontSize: '13px'
    };

    // ===== RENDER =====
    return (
        <div className="dashboard-wrapper">
            <style>{styles}</style>

            <div className="header-card no-print">
                <div><h1 className="header-title"><span>📦</span> HNS GUDANG</h1><div className="header-subtitle">User: <strong>{user.name}</strong> • Role: <strong>{user.role}</strong></div></div>
                <div className="header-actions">
                    {user.role === 'admin' && (<><button onClick={() => setIsAddModalOpen(true)} className="btn-add">➕ Tambah</button><button onClick={() => setIsImportModalOpen(true)} className="btn-import">📂 Import CSV</button></>)}
                    <button onClick={onLogout} className="btn-logout">Keluar</button>
                </div>
            </div>

            <div className="filter-card no-print">
                <div className="filter-row">
                    <div className="filter-group"><label className="filter-label">Pencarian</label><input className="input-field" placeholder="🔍 Cari nama/kode..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <MultiSelect label="Kategori" options={uniqueCats} selected={filterCats} onChange={setFilterCats} />
                    <MultiSelect label="Brand" options={uniqueBrands} selected={filterBrands} onChange={setFilterBrands} />
                    <div className="filter-group"><label className="filter-label">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="input-field"><option value="Semua">Semua</option><option value="Ready">✅ Ready</option><option value="Kosong">❌ Kosong</option></select></div>
                    <div className="filter-group"><label className="filter-label">Export</label><div style={{ display: 'flex', gap: '8px' }}><button onClick={handleExportPDF} className="btn-print" style={{ background: '#e53e3e', width: '100%' }}>📄 PDF</button></div></div>
                </div>
                <div className="filter-info"><p className="filter-info-text">Total: <strong>{processedProducts.length}</strong> barang. {hasActiveFilters && (<button onClick={handleResetFilters} className="btn-reset">🔄 Reset Filter</button>)}</p></div>
            </div>

            {/* HEADER PRINT */}
            <div style={{ display: 'none' }} className="print-header-only">
                <h2 style={{ textAlign: 'center', marginBottom:'5px' }}>HNS IT CENTER</h2>
                <p style={{ textAlign: 'center', fontSize:'12px', marginBottom:'20px' }}>DAFTAR HARGA & STOK BARANG | {new Date().toLocaleDateString()}</p>
                <hr style={{borderTop:'2px solid black'}}/>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }} className="no-print"><input type="checkbox" onChange={e => handleCheckAll(e.target.checked)} /></th>
                            <th onClick={() => requestSort('id')}>Kode {getSortIcon('id')}</th>
                            <th onClick={() => requestSort('nama')}>Nama Barang {getSortIcon('nama')}</th>
                            {user.role === 'admin' && (
                                <>
                                    <th onClick={() => requestSort('harga_beli')} className="no-print">MODAL {getSortIcon('harga_beli')}</th>
                                    <th onClick={() => requestSort('harga_dealer')}>SRP {getSortIcon('harga_dealer')}</th>
                                    <th onClick={() => requestSort('harga_jual')}>JUAL {getSortIcon('harga_jual')}</th>
                                </>
                            )}
                            <th onClick={() => requestSort('stok')} style={{ textAlign: 'center' }}>Stok {getSortIcon('stok')}</th>
                            <th className="no-print">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedProducts.slice(0, 200).map((item) => {
                            const isEdit = editingId === item.id;
                            const isChecked = !!checked[item.id];

                            return (
                                <tr key={item.id} className={isChecked ? "selected-row" : "not-selected"}>
                                    <td className="no-print"><input type="checkbox" checked={isChecked} onChange={() => setChecked({ ...checked, [item.id]: !isChecked })} /></td>
                                    <td data-label="Kode" style={{ fontWeight: 'bold', color: '#667eea' }}>{item.id}</td>
                                    <td data-label="Nama" style={{ fontWeight: '500' }}>
                                        {item.nama}
                                        <div style={{ fontSize: '10px', color: '#718096' }}>{item.brand} - {item.kategori}</div>
                                    </td>

                                    {user.role === 'admin' && (
                                        <>
                                            {/* KOLOM MODAL (EDITABLE) */}
                                            <td data-label="MODAL" className="no-print" style={{ color: '#e53e3e', fontWeight: 'bold' }}>
                                                {isEdit ? (
                                                    <input type="number" style={inputEditStyle} value={editForm.modal} onChange={e=>setEditForm({...editForm, modal: e.target.value})} />
                                                ) : formatRp(item.harga_beli)}
                                            </td>

                                            {/* KOLOM SRP (EDITABLE) */}
                                            <td data-label="SRP" style={{ color: '#e67e22', fontWeight: 'bold' }}>
                                                {isEdit ? (
                                                    <input type="number" style={inputEditStyle} value={editForm.srp} onChange={e=>setEditForm({...editForm, srp: e.target.value})} />
                                                ) : formatRp(item.harga_dealer)}
                                            </td>

                                            {/* KOLOM JUAL (EDITABLE) */}
                                            <td data-label="JUAL" style={{ color: '#38a169', fontWeight: 'bold' }}>
                                                {isEdit ? (
                                                    <input type="number" style={inputEditStyle} value={editForm.jual} onChange={e=>setEditForm({...editForm, jual: e.target.value})} />
                                                ) : formatRp(item.harga_jual)}
                                            </td>
                                        </>
                                    )}

                                    {/* KOLOM STOK (EDITABLE) */}
                                    <td data-label="Stok" style={{ textAlign: 'center' }}>
                                        {isEdit ? (
                                            <input type="number" style={{...inputEditStyle, width:'60px', textAlign:'center'}} value={editForm.stok} onChange={e=>setEditForm({...editForm, stok: e.target.value})} />
                                        ) : (
                                            <>
                                                <span className={`status-badge ${item.stok > 0 ? 'status-ready' : 'status-empty'} no-print`}>
                                                    {item.stok > 0 ? `${item.stok} Unit` : 'KOSONG'}
                                                </span>
                                                <span className="print-only" style={{ display: 'none', fontWeight: 'bold', border: '1px solid #000', padding: '2px 5px' }}>
                                                    {item.stok > 0 ? 'READY' : 'KOSONG'}
                                                </span>
                                            </>
                                        )}
                                    </td>

                                    <td className="no-print" data-label="Aksi">
                                        {user.role === 'admin' && (
                                            isEdit ? (
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button onClick={() => handleSaveEdit(item.id)} style={{background:'#48bb78', color:'white', border:'none', padding:'6px', borderRadius:'4px', cursor:'pointer'}}>💾</button>
                                                    <button onClick={() => setEditingId(null)} style={{background:'#e53e3e', color:'white', border:'none', padding:'6px', borderRadius:'4px', cursor:'pointer'}}>✖</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button onClick={() => handleStartEdit(item)} className="btn-edit">✏️</button>
                                                    <button onClick={() => handleDelete(item.id)} className="btn-delete">🗑️</button>
                                                </div>
                                            )
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {processedProducts.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Data tidak ditemukan.</div>}
            </div>

            <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={loadProducts} />
            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={loadProducts} />
        </div>
    );
}

export default Dashboard;