import React, { useState } from 'react';
import Swal from 'sweetalert2';

function ImportModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpload = async () => {
        if (!file) return Swal.fire('Gagal', 'Pilih file CSV dulu!', 'warning');

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.success) {
                Swal.fire('Sukses', data.message, 'success');
                onSuccess(); // Refresh dashboard
                onClose();   // Tutup modal
            } else {
                Swal.fire('Gagal', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Gagal upload file', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px', textAlign: 'center', boxShadow:'0 10px 25px rgba(0,0,0,0.2)' }}>
                <h2 style={{marginTop:0, color:'#2d3748'}}>📂 Import CSV</h2>
                <p style={{color:'#666', fontSize:'13px', marginBottom:'20px'}}>
                    Pastikan format CSV sesuai Price List Dealer.<br/>
                    (Kolom: Kode Accurate, Nama Barang, CP, Price, dll)
                </p>
                
                <input 
                    type="file" 
                    accept=".csv"
                    onChange={e => setFile(e.target.files[0])}
                    style={{ display:'block', margin: '0 auto 20px auto', padding: '10px', border: '1px solid #ddd', width: '90%', borderRadius:'6px' }} 
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', border: 'none', background: '#e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight:'bold', color:'#4a5568' }}>Batal</button>
                    <button onClick={handleUpload} disabled={loading} style={{ padding: '10px 20px', border: 'none', background: '#3182ce', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight:'bold' }}>
                        {loading ? 'Mengupload...' : '🚀 Upload Sekarang'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImportModal;