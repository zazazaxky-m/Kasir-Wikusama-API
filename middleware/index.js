var express = require('express');
var auth = require('./auth');
var router = express.Router();
var verifikasi = require('./verifikasi');

router.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
      return res.status(405).send({ error: 'Method Not Allowed' });
    }
    next();
  });

//   router.use((req, res, next) => {
//     res.status(405).send({ error: 'Method Not Allowed' });
//   });

//registrasi & login
router.post('/register',verifikasi("admin", "superadmin"), auth.registrasi); //
router.post('/login', auth.login); 

//user
router.get('/user', auth.user);
router.get('/user/:id_user', auth.iduser);
// router.put('/user', verifikasi("admin", "superadmin"),auth.ubahuser);
router.delete('/user/:id_user',verifikasi("admin", "superadmin"), auth.hapususer);

//menu
router.get('/menu', verifikasi("kasir", "admin", "superadmin"), auth.menu); //
router.get('/menu/:id_menu', verifikasi("kasir", "admin", "superadmin"), auth.idmenu); //
router.get('/gambar/:filename', auth.getGambar); //
router.post('/menu', verifikasi("admin", "superadmin"), auth.tambahMenu); //
router.put('/menu/:id_menu', verifikasi("admin", "superadmin"), auth.ubahmenu); //
router.delete('/menu/:id_menu', verifikasi("admin", "superadmin"), auth.hapusmenu); //

//meja
router.get('/meja', verifikasi("kasir", "admin", "superadmin"), auth.meja); //
router.get('/meja/:id_meja', verifikasi("kasir", "admin", "superadmin"), auth.idmeja); //
router.post('/meja', verifikasi("admin", "superadmin"), auth.tambahMeja); //
router.put('/meja/:id_meja', verifikasi("admin", "superadmin"), auth.ubahmeja); //
router.delete('/meja/:id_meja', verifikasi("admin", "superadmin"), auth.hapusmeja); //
router.put('/meja/available/:id_meja', verifikasi("kasir","admin", "superadmin"), auth.availability); //


//transaksi
router.get('/transaksi', verifikasi("kasir", "admin", "superadmin"), auth.transaksi); 
router.get('/transaksi/:id_transaksi', verifikasi("kasir", "admin", "superadmin"), auth.idtransaksi); 
router.post('/transaksi', verifikasi("admin", "superadmin", "kasir"), auth.tambahTransaksi); 
router.put('/transaksi/:id_transaksi', verifikasi("admin", "superadmin", "kasir"), auth.ubahtransaksi);
router.delete('/transaksi/:id_transaksi',  verifikasi("kasir", "admin", "superadmin"), auth.hapustransaksi);

//statistik
router.get('/statistik', verifikasi("manajer", "superadmin"), auth.statistik);

//log superadmin
router.get('/secret/log/:limit', verifikasi("superadmin"), auth.log);
router.post('/secret/flush', verifikasi("superadmin"), auth.flush);

router.post('/secret/reset', verifikasi("superadmin"), auth.reset);

//transaksi
// router.post('/transaksi')

module.exports = router;