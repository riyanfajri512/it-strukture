import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // IMPORT SWEETALERT

// --- CSS KHUSUS BIAR HASIL PRINT RAPI & UI CANTIK ---
const printStyles = `
  @media print {
    .no-print { display: none !important; }
    body { background: white; -webkit-print-color-adjust: exact; }
    .print-container { width: 100%; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #000; padding: 5px; }
    th { background-color: #eee !important; color: black; }
    
    /* HANYA TAMPILKAN BARIS YANG DICEKLIS */
    tr.not-selected { display: none !important; }
    
    /* Sembunyikan kolom checkbox saat print */
    .col-checkbox { display: none !important; }
    
    .print-header { display: block !important; text-align: center; margin-bottom: 20px; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .filter-input {
    transition: all 0.3s ease;
  }

  .filter-input:focus {
    border-color: #007bff !important;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    outline: none;
  }

  .btn-hover {
    transition: all 0.3s ease;
  }

  .btn-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  .suggestion-item {
    transition: background 0.2s ease;
  }

  .suggestion-item:hover {
    background: #f8f9fa !important;
  }

  .table-row {
    transition: background 0.2s ease;
  }

  .table-row:hover {
    background: #f8f9fa !important;
  }

  /* Styles untuk Pagination */
  .pagination-btn {
    padding: 8px 12px;
    margin: 0 4px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s;
  }
  .pagination-btn:hover:not(:disabled) {
    background: #f0f0f0;
    border-color: #ccc;
  }
  .pagination-btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  .pagination-btn:disabled {
    color: #ccc;
    cursor: not-allowed;
    background: #f9f9f9;
  }
`;

// --- HALAMAN LOGIN ---
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [usersData, setUsersData] = useState([]);

  useEffect(() => {
    fetch('/data/users.json')
      .then(res => res.json())
      .then(data => setUsersData(data))
      .catch(err => console.error("Gagal ambil data user:", err));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const foundUser = usersData.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      );
      if (foundUser) {
        // SweetAlert: Toast Sukses
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: `Selamat datang, ${foundUser.name}!` });

        onLogin({ name: foundUser.name, role: foundUser.role });
      } else {
        // SweetAlert: Error
        Swal.fire({
            icon: 'error',
            title: 'Login Gagal',
            text: 'Username atau Password salah!',
            confirmButtonColor: '#d33'
        });
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>🔐 Login HNS System</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#555' }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '5px' }} 
              disabled={loading}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', color: '#555' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '5px' }} 
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '12px', background: loading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s'
            }}
          >
            {loading ? 'Memproses...' : 'MASUK'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- LOADING SKELETON COMPONENT ---
function LoadingSkeleton() {
  return (
    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} style={{ height: '50px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: '10px', borderRadius: '5px' }} />
      ))}
    </div>
  );
}

// --- HALAMAN UTAMA ---
function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Data Hasil Filter
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Jumlah barang per halaman

  // Opsi Dropdown
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // State Filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  // State untuk autocomplete
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  // State Checkbox
  const [checkedItems, setCheckedItems] = useState({});

  // State untuk Sync
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('hns_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      setTimeout(() => {
        fetch('/data/products.json')
          .then(res => res.json())
          .then(data => {
            setProducts(data);
            const uniqueCats = [...new Set(data.map(item => item.kategori).filter(Boolean))].sort();
            const uniqueBrands = [...new Set(data.map(item => item.brand).filter(Boolean))].sort();
            setCategories(uniqueCats);
            setBrands(uniqueBrands);
            setLoading(false);
          })
          .catch(err => {
            console.error("Gagal ambil data:", err);
            setLoading(false);
          });
      }, 800);
    }
  }, [user]);

  useEffect(() => {
    let result = products;
    
    // Filter kategori
    if (selectedCategory.trim()) {
      result = result.filter(item => item.kategori.toLowerCase().includes(selectedCategory.toLowerCase()));
    }
    
    // Filter brand
    if (selectedBrand.trim()) {
      result = result.filter(item => item.brand.toLowerCase().includes(selectedBrand.toLowerCase()));
    }
    
    // Filter status
    if (selectedStatus === "Ready") result = result.filter(item => item.stok > 0);
    else if (selectedStatus === "Kosong") result = result.filter(item => item.stok <= 0);
    
    // Filter search
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(item => 
        item.nama.toLowerCase().includes(lowerSearch) ||
        item.id.toLowerCase().includes(lowerSearch)
      );
    }
    
    setFilteredProducts(result);
    setCurrentPage(1); // Reset ke halaman 1 jika filter berubah
  }, [products, search, selectedCategory, selectedBrand, selectedStatus]);

  // --- LOGIC PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas saat pindah halaman
  };

  const handleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = () => {
    // Pilih hanya item yang ada di halaman ini (biar performa aman)
    const currentIds = currentItems.map(p => p.id);
    const isAllChecked = currentIds.every(id => checkedItems[id]);
    const newCheckedState = { ...checkedItems };
    currentIds.forEach(id => { newCheckedState[id] = !isAllChecked; });
    setCheckedItems(newCheckedState);
  };

  const handleLogout = () => {
    // SweetAlert Konfirmasi Logout
    Swal.fire({
        title: 'Yakin mau keluar?',
        text: "Anda harus login kembali untuk masuk.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#6c757d',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            setUser(null);
            localStorage.removeItem('hns_user');
            const Toast = Swal.mixin({
                toast: true, position: 'top', showConfirmButton: false, timer: 2000
            });
            Toast.fire({ icon: 'success', title: 'Berhasil Logout' });
        }
    });
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const handlePrint = () => {
    const countSelected = Object.values(checkedItems).filter(Boolean).length;
    if (countSelected === 0) {
      // SweetAlert Warning
      Swal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Pilih minimal 1 barang (ceklis) dulu sebelum mencetak!',
        confirmButtonColor: '#007bff'
      });
      return;
    }
    window.print();
  };

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,KODE,NAMA BARANG,BRAND,KATEGORI,HARGA DEALER,STOK,LAST UPDATE\n";
    filteredProducts.forEach(item => {
      const row = [
        item.id,
        `"${item.nama.replace(/"/g, '""')}"`,
        item.brand,
        item.kategori,
        item.harga_jual,
        item.stok,
        item.last_update
      ].join(",");
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hns_stok_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Toast Success Export
    const Toast = Swal.mixin({
        toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000
    });
    Toast.fire({ icon: 'success', title: 'Excel berhasil didownload!' });
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedStatus("Semua");
  };

  const handleSync = async () => {
    // 1. SweetAlert Konfirmasi
    const result = await Swal.fire({
        title: 'Update Data?',
        text: "Sistem akan menarik data terbaru dari Google Sheets.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Update!',
        cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;
    
    setIsSyncing(true);
    
    // 2. SweetAlert Loading
    Swal.fire({
        title: 'Sedang Update...',
        html: 'Mohon tunggu sebentar.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
    });

    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      
      if (data.success) {
        // 3. SweetAlert Sukses
        await Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: `${data.total} data barang berhasil diperbarui.`,
            confirmButtonColor: '#28a745'
        });
        window.location.reload();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
      }
    } catch (err) {
      console.error("Error sync:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error Koneksi',
        text: 'Pastikan server backend (node server.js) berjalan.'
      });
    }
    setIsSyncing(false);
  };

  if (!user) return <LoginPage onLogin={(u) => { setUser(u); localStorage.setItem('hns_user', JSON.stringify(u)); }} />;
  
  const countSelected = Object.values(checkedItems).filter(Boolean).length;
  const categorySuggestions = categories.filter(cat => cat.toLowerCase().includes(selectedCategory.toLowerCase())).slice(0, 5);
  const brandSuggestions = brands.filter(brand => brand.toLowerCase().includes(selectedBrand.toLowerCase())).slice(0, 5);
  const hasActiveFilters = search || selectedCategory || selectedBrand || selectedStatus !== "Semua";

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      <style>{printStyles}</style>

      {/* HEADER WEB */}
      <div className="no-print" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div>
            <h2 style={{ margin: 0, color: '#333' }}>📦 HNS Gudang</h2>
            <span style={{ fontSize: '14px', color: '#666' }}>
              User: <b>{user.name}</b> <span style={{ background: user.role === 'admin' ? '#d9534f' : '#28a745', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', marginLeft: '5px' }}>{user.role.toUpperCase()}</span>
            </span>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
             {user.role === 'admin' && (
               <button onClick={handleSync} disabled={isSyncing} className="btn-hover" style={{ background: isSyncing ? '#e0a800' : '#ffc107', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: isSyncing ? 'wait' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                 {isSyncing ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Updating...</> : <>🔄 Update Data</>}
               </button>
             )}
             <div style={{padding: '8px 15px', background: '#e2e6ea', borderRadius: '5px', fontSize: '14px'}}>
               Total: <b style={{ color: '#007bff' }}>{filteredProducts.length}</b> 
             </div>
             <button onClick={handleLogout} className="btn-hover" style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Keluar</button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div style={{ marginTop: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#555', fontSize: '16px' }}>🔍 Filter & Pencarian</h3>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} style={{ background: '#ffc107', color: '#333', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>✖ Clear All</button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'end' }}>
            {/* Input Filters... (Sama seperti sebelumnya) */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px'}}>Pencarian Umum</label>
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="🔍 Cari nama / kode..." className="filter-input" style={{ width: '100%', padding: '10px 35px 10px 10px', borderRadius: '5px', border: '1px solid #ddd' }} value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch("")} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999' }}>×</button>}
              </div>
            </div>
            
            <div style={{ minWidth: '180px', position: 'relative' }}>
               <label style={{fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px'}}>Kategori</label>
               <input type="text" placeholder="Ketik kategori..." className="filter-input" value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setShowCategorySuggestions(true); }} onFocus={() => setShowCategorySuggestions(true)} onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
               {showCategorySuggestions && categorySuggestions.length > 0 && (
                 <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '5px', zIndex: 1000 }}>
                   {categorySuggestions.map((cat, idx) => <div key={idx} className="suggestion-item" onClick={() => { setSelectedCategory(cat); setShowCategorySuggestions(false); }} style={{ padding: '10px', cursor: 'pointer' }}>{cat}</div>)}
                 </div>
               )}
            </div>

            <div style={{ minWidth: '180px', position: 'relative' }}>
               <label style={{fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px'}}>Brand</label>
               <input type="text" placeholder="Ketik brand..." className="filter-input" value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setShowBrandSuggestions(true); }} onFocus={() => setShowBrandSuggestions(true)} onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
               {showBrandSuggestions && brandSuggestions.length > 0 && (
                 <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '5px', zIndex: 1000 }}>
                   {brandSuggestions.map((brand, idx) => <div key={idx} className="suggestion-item" onClick={() => { setSelectedBrand(brand); setShowBrandSuggestions(false); }} style={{ padding: '10px', cursor: 'pointer' }}>{brand}</div>)}
                 </div>
               )}
            </div>

            <div style={{ minWidth: '140px' }}>
               <label style={{fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px'}}>Status Stok</label>
               <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-input" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', cursor: 'pointer', background: 'white' }}>
                <option value="Semua">📋 Semua</option><option value="Ready">✅ Ready</option><option value="Kosong">❌ Kosong</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingBottom: '1px' }}>
              <button onClick={handlePrint} className="btn-hover" style={{ background: countSelected > 0 ? '#17a2b8' : '#6c757d', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: countSelected > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px' }}>🖨️ Cetak ({countSelected})</button>
              <button onClick={handleExport} className="btn-hover" style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>📥 Excel</button>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER PRINT */}
      <div className="print-header" style={{ display: 'none' }}>
        <h2>LIST STOK HNS IT CENTER</h2>
        <p style={{fontSize: '12px'}}>Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
        <hr/>
      </div>

      {/* TABEL DATA */}
      {loading ? <LoadingSkeleton /> : (
        <div style={{ overflowX: 'auto', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#007bff', color: 'white', textAlign: 'left' }}>
                <th className="col-checkbox" style={{ padding: '12px', textAlign: 'center', width: '50px' }}>
                  <input type="checkbox" onChange={handleSelectAll} style={{ transform: 'scale(1.3)', cursor: 'pointer' }} checked={currentItems.length > 0 && currentItems.every(p => checkedItems[p.id])} />
                </th>
                <th style={{ padding: '12px', fontSize: '13px' }}>KODE</th>
                <th style={{ padding: '12px', fontSize: '13px' }}>NAMA BARANG</th>
                <th style={{ padding: '12px', fontSize: '13px' }}>BRAND</th>
                {user.role === 'admin' && <th className="no-print" style={{ padding: '12px', background: '#c82333', fontSize: '13px' }}>MODAL (CP)</th>}
                <th style={{ padding: '12px', fontSize: '13px' }}>HARGA DEALER</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>STOK</th>
                <th style={{ padding: '12px', fontSize: '12px' }}>LAST UPDATE</th>
              </tr>
            </thead>
            <tbody>
              {/* NOTE: KITA LOOPING currentItems (Hasil Pagination) BUKAN filteredProducts */}
              {currentItems.map((item, index) => {
                const isChecked = !!checkedItems[item.id];
                const rowClass = isChecked ? "selected" : "not-selected";
                const bgRow = isChecked ? '#e8f0fe' : (index % 2 === 0 ? '#fafafa' : 'white');
                return (
                  <tr key={index} className={`${rowClass} table-row`} style={{ borderBottom: '1px solid #eee', backgroundColor: bgRow }}>
                    <td className="col-checkbox" style={{ padding: '12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleCheck(item.id)} style={{ transform: 'scale(1.3)', cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#007bff', fontSize: '13px' }}>{item.id}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '500', color: '#333' }}>{item.nama}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>📁 {item.kategori}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#555' }}>{item.brand}</td>
                    {user.role === 'admin' && <td className="no-print" style={{ padding: '12px', color: '#d9534f', fontWeight: 'bold', fontSize: '13px' }}>{formatRupiah(item.harga_beli)}</td>}
                    <td style={{ padding: '12px', color: '#28a745', fontWeight: 'bold', fontSize: '13px' }}>{formatRupiah(item.harga_jual)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: item.stok > 0 ? '#d4edda' : '#f8d7da', color: item.stok > 0 ? '#155724' : '#721c24', fontSize: '13px' }}>
                      {user.role === 'admin' ? item.stok : (item.stok > 0 ? '✅ READY' : '❌ KOSONG')}
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#666' }}>{item.last_update}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* EMPTY STATE - KALO PENCARIAN GA KETEMU */}
          {filteredProducts.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📦</div>
              <div style={{ color: '#888', fontSize: '16px' }}>
                {hasActiveFilters ? 'Tidak ada barang yang sesuai dengan filter' : 'Tidak ada data barang'}
              </div>
              {hasActiveFilters && (
                <button 
                  onClick={clearAllFilters} 
                  style={{ marginTop: '15px', background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {filteredProducts.length > 0 && (
             <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 10px', borderTop: '1px solid #eee' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                   Menampilkan <b>{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProducts.length)}</b> dari <b>{filteredProducts.length}</b> barang
                </div>
                <div style={{ display: 'flex' }}>
                   <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                   
                   {/* Logic simpel buat nampilin max 5 nomor halaman biar gak kepanjangan */}
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = currentPage;
                      if(currentPage <= 3) pageNum = i + 1;
                      else if(currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      
                      if(pageNum > 0 && pageNum <= totalPages) {
                          return <button key={pageNum} className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`} onClick={() => handlePageChange(pageNum)}>{pageNum}</button>;
                      }
                      return null;
                   })}
                   
                   <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;