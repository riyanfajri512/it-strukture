const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// KONFIGURASI
const ID_STOK = '1Adv3Gte2CCs9--Iv16Q30pW6tHrxFykGiAZWSl2P4KY';
const ID_PRICE = '1OynkBXi2-EImyrIeGT5umPWXbyLNRLGAc-RWiw0pg14';
const KEY_FILE = './service-account.json';

// Fungsi Helper: Pastikan data jadi angka bulat
const parseNumber = (val) => {
    // Kalau Google kasih angka langsung, ambil aja
    if (typeof val === 'number') return Math.round(val);
    
    // Kalau Google kasih text, bersihin dulu
    if (!val) return 0;
    
    // Hapus ".00" atau ",00" di belakang kalau ada
    let clean = val.toString();
    if (clean.includes(',')) clean = clean.split(',')[0]; // Potong desimal koma
    if (clean.includes('.')) clean = clean.split('.')[0]; // Potong desimal titik (jaga2)
    
    // Ambil angkanya aja
    clean = clean.replace(/\D/g, ''); 
    return parseInt(clean) || 0;
};

async function main() {
    console.log('🚀 Mulai menggabungkan data (Mode: Raw Numbers)...');
    
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // 1. AMBIL DATA STOK
        console.log('📦 Sedang download data STOK...');
        const resStok = await sheets.spreadsheets.values.get({
            spreadsheetId: ID_STOK,
            range: "'Data_Barang'!A2:E",
            valueRenderOption: 'UNFORMATTED_VALUE', // Minta data MENTAH (Angka)
        });
        const rowsStok = resStok.data.values || [];
        
        // Mapping Stok
        const mapStok = {};
        rowsStok.forEach(row => {
            const kode = row[0]; 
            const qty = row[3];
            if (kode) mapStok[kode] = parseNumber(qty);
        });

        // 2. AMBIL DATA HARGA
        console.log('💰 Sedang download data HARGA...');
        const resPrice = await sheets.spreadsheets.values.get({
            spreadsheetId: ID_PRICE,
            range: "'MASTER_PRICE'!A2:K",
            valueRenderOption: 'UNFORMATTED_VALUE', // Minta data MENTAH (Angka)
        });
        const rowsPrice = resPrice.data.values || [];

        // 3. GABUNGKAN DATA
        console.log('🔄 Menggabungkan data...');
        const products = rowsPrice.map((row, index) => {
            const id = row[1]; 
            const stokTersedia = mapStok[id] || 0;
            
            return {
                id: id || `UNKNOWN-${index}`,
                nama: row[2] || 'Tanpa Nama',
                kategori: row[8] || 'Uncategorized',
                brand: row[9] || '-',
                harga_beli: parseNumber(row[4]), // CP
                harga_jual: parseNumber(row[5]), // SP (Kolom F)
                stok: stokTersedia,
                last_update: row[7] || '-'
            };
        }).filter(item => item.id && item.id !== 'UNKNOWN');

        // 4. SIMPAN KE FILE
        const outputDir = path.join(__dirname, 'public', 'data');
        if (!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filePath = path.join(outputDir, 'products.json');
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

        console.log('-------------------------------------------');
        console.log(`✅ BERHASIL! Data Harga sudah diperbaiki.`);
        console.log(`📊 Total Produk: ${products.length} items`);
        console.log('-------------------------------------------');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();