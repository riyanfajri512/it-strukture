const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// KONFIGURASI
const ID_STOK = '1Adv3Gte2CCs9--Iv16Q30pW6tHrxFykGiAZWSl2P4KY';
const ID_PRICE = '1OynkBXi2-EImyrIeGT5umPWXbyLNRLGAc-RWiw0pg14'; 
const KEY_FILE = './service-account.json';

// Helper 1: Bersihin Angka (Biar Rp 4.500.000 jadi 4500000)
const parseNumber = (val) => {
    if (typeof val === 'number') return Math.round(val);
    if (!val) return 0;
    let clean = val.toString();
    // Hapus koma desimal excel (misal ,00)
    if (clean.includes(',')) clean = clean.split(',')[0];
    if (clean.includes('.')) clean = clean.split('.')[0];
    clean = clean.replace(/\D/g, ''); 
    return parseInt(clean) || 0;
};

// Helper 2: Format Tanggal Pintar (SOLUSI MASALAH TANGGAL JADI ANGKA)
const formatDate = (val) => {
    if (!val) return '-';

    // Kalo Excel kasih Angka (Serial Date, misal: 45280)
    if (typeof val === 'number') {
        // Rumus konversi Serial Number Excel ke Tanggal Javascript
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        
        // Cek kalau hasilnya valid tanggal
        if (!isNaN(date.getTime())) {
             // Format jadi: "14 Des 2024" (Bahasa Indonesia)
            return date.toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        }
    }

    // Kalo Excel kasih Teks biasa, balikin aja langsung
    return String(val);
};

async function main() {
    console.log('🚀 Mulai proses sinkronisasi data HNS...');
    
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // --- 1. DOWNLOAD DATA USER ---
        console.log('👤 Sedang download data USERS...');
        const resUsers = await sheets.spreadsheets.values.get({
            spreadsheetId: ID_PRICE,
            range: "'USER_ACCESS'!A2:D",
        });
        
        const rawUsers = resUsers.data.values || [];
        const users = rawUsers.map(row => ({
            username: row[0],
            password: row[1],
            role: row[2]?.toLowerCase() || 'dealer',
            name: row[3] || 'User HNS'
        })).filter(u => u.username && u.password);

        // --- 2. DOWNLOAD DATA STOK (Data_Barang) ---
        console.log('📦 Sedang download data STOK (Opname)...');
        const resStok = await sheets.spreadsheets.values.get({
            spreadsheetId: ID_STOK,
            range: "'Data_Barang'!A2:E", 
            valueRenderOption: 'UNFORMATTED_VALUE',
        });
        
        const mapStok = {};
        (resStok.data.values || []).forEach(row => {
            const kode = row[0];
            const qty = row[3];
            if (kode) mapStok[kode] = parseNumber(qty);
        });

        // --- 3. DOWNLOAD MASTER PRICE ---
        console.log('💰 Sedang download data HARGA & DETAIL...');
        const resPrice = await sheets.spreadsheets.values.get({
            spreadsheetId: ID_PRICE,
            range: "'MASTER_PRICE'!A2:L", 
            valueRenderOption: 'UNFORMATTED_VALUE', // PENTING: Ambil data mentah (angka) biar bisa diproses
        });
        
        console.log('🔄 Menggabungkan & Format Tanggal...');
        
        // MAPPING BERDASARKAN STRUKTUR GOOGLE SHEET KAMU:
        // Index [0]: NO
        // Index [1]: ID (Kode Accurate)
        // Index [2]: NAMA BARANG
        // Index [4]: CP (Modal) -> Data ke-1 yg kamu minta
        // Index [5]: SP (Harga Dealer) -> Data ke-2 yg kamu minta
        // Index [7]: TANGGAL UPDATE -> Data ke-3 yg kamu minta (Fix Tanggal)
        
        const products = (resPrice.data.values || []).map((row, index) => {
            const id = row[1];
            const realStok = mapStok[id] || 0;

            return {
                id: id || `UNKNOWN-${index}`,
                nama: row[2] || 'Tanpa Nama',
                kategori: row[8] || 'Uncategorized',
                brand: row[9] || '-',
                
                // INI 3 DATA YANG KAMU MAU PASTIIN:
                harga_beli: parseNumber(row[4]),    // CP
                harga_jual: parseNumber(row[5]),    // SP
                last_update: formatDate(row[7]),    // Tanggal Update

                stok: realStok
            };
        }).filter(item => item.id && item.id !== 'UNKNOWN');

        // --- 4. SIMPAN FILE ---
        const outputDir = path.join(__dirname, 'public', 'data');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        
        fs.writeFileSync(path.join(outputDir, 'products.json'), JSON.stringify(products, null, 2));
        fs.writeFileSync(path.join(outputDir, 'users.json'), JSON.stringify(users, null, 2));

        console.log('-------------------------------------------');
        console.log(`✅ SUKSES! Tanggal sudah diperbaiki jadi format teks.`);
        console.log(`📊 Total Produk: ${products.length} items`);
        console.log('-------------------------------------------');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();