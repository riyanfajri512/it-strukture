import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 

function Login({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [users, setUsers] = useState([]);

  // Ambil data user dari database saat buka halaman login
  useEffect(() => { 
    fetch('http://localhost:5000/api/users')
      .then(r=>r.json())
      .then(setUsers)
      .catch(err => console.error("Gagal ambil user:", err)); 
  }, []);
  
  const handleLogin = () => {
    const found = users.find(x => x.username.toLowerCase() === u.toLowerCase() && x.password === p);
    if(found) {
        onLogin(found);
    } else {
        Swal.fire('Gagal', 'Username atau Password Salah!', 'error');
    }
  };

  return (
    <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0f2f5'}}>
      <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}>
        <h3 style={{textAlign:'center', marginBottom:'20px', color:'#333'}}>LOGIN GUDANG</h3>
        <input style={{width:'100%', padding:'10px', marginBottom:'10px', boxSizing:'border-box'}} placeholder="Username" onChange={e=>setU(e.target.value)} />
        <input style={{width:'100%', padding:'10px', marginBottom:'15px', boxSizing:'border-box'}} type="password" placeholder="Password" onChange={e=>setP(e.target.value)} />
        <button style={{width:'100%', padding:'10px', background:'#007bff', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}} onClick={handleLogin}>MASUK</button>
      </div>
    </div>
  );
}

export default Login;