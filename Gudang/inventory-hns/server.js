const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Folder Data (Pastikan folder public/data ada)
const outputDir = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// --- LOGIKA SINKRONISASI GOOGLE SHEETS ---
const ID_STOK = '1Adv3Gte2CCs9--Iv16Q30pW6tHrxFykGiAZWSl2P4KY';
const ID_PRICE = '1OynkBXi2-EImyrIeGT5umPWXbyLNRLGAc-RWiw0pg14'; 
const KEY_FILE = './service-account.json';

const parseNumber = (val) => {
    if (typeof val === 'number') return Math.round(val);
    if (!val) return 0;
    let clean = val.toString();
    if (clean.includes(',')) clean = clean.split(',')[0];
    if (clean.includes('.')) clean = clean.split('.')[0];
    clean = clean.replace(/\D/g, ''); 
    return parseInt(clean) || 0;
};

const formatDate = (val) => {
    if (!val) return '-';
    if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }
    }
    return String(val);
};

// --- API ENDPOINT BUAT TOMBOL UPDATE ---
app.get('/api/sync', async (req, res) => {
    console.log('🔄 Request Sync diterima...');
    
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Download USERS
        const resUsers = await sheets.spreadsheets.values.get({ spreadsheetId: ID_PRICE, range: "'USER_ACCESS'!A2:D" });
        const users = (resUsers.data.values || []).map(row => ({
            username: row[0], password: row[1], role: row[2]?.toLowerCase() || 'dealer', name: row[3] || 'User HNS'
        })).filter(u => u.username && u.password);

        // 2. Download STOK
        const resStok = await sheets.spreadsheets.values.get({ spreadsheetId: ID_STOK, range: "'Data_Barang'!A2:E", valueRenderOption: 'UNFORMATTED_VALUE' });
        const mapStok = {};
        (resStok.data.values || []).forEach(row => { if (row[0]) mapStok[row[0]] = parseNumber(row[3]); });

        // 3. Download HARGA
        const resPrice = await sheets.spreadsheets.values.get({ spreadsheetId: ID_PRICE, range: "'MASTER_PRICE'!A2:L", valueRenderOption: 'UNFORMATTED_VALUE' });
        const products = (resPrice.data.values || []).map((row, index) => {
            const id = row[1];
            return {
                id: id || `UNKNOWN-${index}`,
                nama: row[2] || 'Tanpa Nama',
                kategori: row[8] || 'Uncategorized',
                brand: row[9] || '-',
                harga_beli: parseNumber(row[4]),
                harga_jual: parseNumber(row[5]),
                stok: mapStok[id] || 0,
                last_update: formatDate(row[7])
            };
        }).filter(item => item.id && item.id !== 'UNKNOWN');

        // 4. Tulis File
        fs.writeFileSync(path.join(__dirname, 'public', 'data', 'products.json'), JSON.stringify(products, null, 2));
        fs.writeFileSync(path.join(__dirname, 'public', 'data', 'users.json'), JSON.stringify(users, null, 2));
        
        // Tulis juga ke folder build jika ada (untuk production)
        const buildDir = path.join(__dirname, 'build', 'data');
        if (fs.existsSync(path.join(__dirname, 'build'))) {
            if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
            fs.writeFileSync(path.join(buildDir, 'products.json'), JSON.stringify(products, null, 2));
            fs.writeFileSync(path.join(buildDir, 'users.json'), JSON.stringify(users, null, 2));
        }

        console.log('✅ Sync Berhasil!');
        res.json({ success: true, message: 'Data berhasil diperbarui!', total: products.length });

    } catch (error) {
        console.error('❌ Sync Gagal:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- SERVE REACT APP (UNTUK DEPLOY) ---
// Kalau folder 'build' ada, server akan menampilkannya
if (fs.existsSync(path.join(__dirname, 'build'))) {
    app.use(express.static(path.join(__dirname, 'build')));
    
    // 🔥 PERBAIKAN DI SINI: Ganti '*' jadi /(.*)/ biar gak error
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
});