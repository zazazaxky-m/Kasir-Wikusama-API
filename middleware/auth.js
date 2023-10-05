const connection = require("../koneksi");
const mysql = require("mysql");
const encrypt = require("md5");
const response = require("../res");
const jwt = require("jsonwebtoken");
const config = require("../config/secret");
const ip = require("ip");
const Joi = require("joi");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { request } = require("http");
const ImageDataURI = require('image-data-uri');

//controller untuk register
exports.registrasi = function (req, res) {
  var post = {
    nama_user: req.body.nama_user,
    username: req.body.username,
    email: req.body.email,
    password: encrypt(req.body.password),
    role: req.body.role,
  };

  const schema = Joi.object({
    nama_user: Joi.string().min(5).max(40).required(),
    username: Joi.string().alphanum().max(30).min(5).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(new RegExp("^[a-zA-Z0-9@*]{3,30}$"))
      .required(),
    role: Joi.string().valid("kasir", "manajer").required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message,
    });
  }

  var query = "SELECT email FROM user WHERE email=?";
  var values = [post.email];

  connection.query(query, values, function (error, rows) {
    if (error) {
      console.log(error);
    } else {
      if (rows.length == 0) {
        var query = "INSERT INTO user SET ?";
        connection.query(query, post, function (error, rows) {
          if (error) {
            console.log(error);
          } else {
            response.ok("Berhasil menambahkan data user baru", res.status(201));
          }
        });
      } else {
        response.ok("Email sudah terdaftar!", res);
      }
    }
  });
};

//controller untuk login
exports.login = function (req, res) {
  var post = {
    password: req.body.password,
    email: req.body.email,
  };

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message,
    });
  }

  var query = "SELECT * FROM ?? WHERE ??=? AND ??=?";
  var table = ["user", "password", encrypt(post.password), "email", post.email];

  var query1 = mysql.format(query, table);
  connection.query(query1, function (error, rows) {
    if (error) {
      console.log(error);
    } else {
      if (rows.length == 1) {
        var token = jwt.sign({ rows }, config.secret, {
          expiresIn: 1440000,
        });
        id_user = rows[0].id_user;
        role = rows[0].role;
        username = rows[0].username;
        email = rows[0].email;

        var data = {
          id_user: id_user,
          access_token: token,
          ip_address: ip.address(),
        };

        var query = "INSERT INTO ?? SET ?";
        var table = ["akses_token"];

        var query1 = mysql.format(query, table);
        connection.query(query1, data, function (error, rows) {
          if (error) {
            console.log(error);
          } else {
            res.json({
              success: true,
              message: "Token JWT tergenerate!",
              id_user: data.id_user,
              username: username,
              email: email,
              role: role,
              token: token,
            });
          }
        });
      } else {
        res.status(401).json({
         
          error: "Email atau password salah!",
        });
      }
    }
  });
};

//menampilkan semua data user
exports.user = function (req, res) {
  connection.query(
    'SELECT id_user, email, nama_user, role, username FROM user WHERE role = "admin" OR role = "kasir" OR role = "manajer"',
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok(rows, res);
      }
    }
  );
};

//menampilkan semua data user berdasarkan id
exports.iduser = function (req, res) {
  var id_user = req.params.id_user;
  connection.query(
    "SELECT id_user, email, nama_user, role, username FROM user WHERE id_user=?",
    [id_user],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        if (rows.length == 1) {
          response.ok(rows[0], res);
        } else {
          response.notFound("User not found", res);
        }
      }
    }
  );
};

//Menghapus user berdasarkan id
exports.hapususer = function (req, res) {
  const id_user = req.params.id_user;
  const query = "DELETE FROM user WHERE id_user=?";
  connection.query(query, [id_user], function (error, rows, fields) {
    if (error) {
      console.log(error);
      response.error("Gagal Hapus Data User", res);
    } else {
      response.ok("Berhasil Hapus Data User", res);
    }
  });
};

//menampilkan semua data menu
exports.menu = function (req, res) {
  const search = req.query.search;
  const jenis = req.query.jenis;
  const harga = req.query.harga;
  let query = "SELECT * FROM menu";

  const schema = Joi.object({
    search: Joi.string(),
    jenis: Joi.string().valid("makanan", "minuman"),
    harga: Joi.string().valid("ASC", "DESC","asc","desc"),
  });

  const error2 = schema.validate(req.query);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message,
    });
  }else{
    if (search !== null && search !== undefined) {
      query += ` WHERE nama_menu LIKE "%${search}%"`;
      if (jenis !== null && jenis !== undefined) {
        query += ` AND jenis LIKE "%${jenis}%"`;
      }
  
    } else if (jenis !== null && jenis !== undefined) {
      query += ` WHERE jenis LIKE "%${jenis.toLowerCase()}%"`;
    }
  
    if (harga !== null && harga !== undefined) {
      query += ` ORDER BY harga ${harga.toUpperCase()}`;
    }
    connection.query(query, function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else if (rows.length === 0) {
        res.status(404).json({ message: "Data tidak tersedia" });
      } else {
        response.ok(rows, res);
      }
    });
  };
  }

//menampilkan semua data menu berdasarkan id
exports.idmenu = function (req, res) {
  let id_menu = req.params.id_menu;
  connection.query(
    "SELECT * FROM menu WHERE id_menu = ?",
    [id_menu],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
        res
          .status(500)
          .json({ message: "Terjadi kesalahan saat mengambil data" });
      } else {
        if (rows.length > 0) {
          response.ok(rows[0], res);
        } else {
          res.status(404).json({ message: "Data tidak tersedia" });
        }
      }
    }
  );
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2000000 },
}).single("gambar");

exports.tambahMenu = function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

    var nama_menu = req.body.nama_menu;
    var jenis = req.body.jenis;
    var deskripsi = req.body.deskripsi;
    var filename = req.file ? req.file.filename : null;
    var path = filename ? "https://api.zackym.com/gambar/" + filename : null;
    var harga = req.body.harga;

    if (!nama_menu || !jenis || !deskripsi || !harga) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }
    if(req.file==null||req.file==undefined){
        filename=null
        path=null
    }
    connection.query(
      "INSERT INTO menu (nama_menu,jenis,deskripsi,filename,path,harga) VALUES(?,?,?,?,?,?)",
      [nama_menu, jenis, deskripsi, filename, path, harga],
      function (error, rows, fields) {
        if (error) {
          console.log(error);
          return res.status(500).json({ error: "Internal server error", errornya: error, });
        } else {
          res.status(201).json({
            status: "Success",
            nama_menu: nama_menu,
            jenis: jenis,
            deskripsi: deskripsi,
            harga: harga,
            path: path,
          });
        }
      }
    );
  });
};



//menampilkan gambar
exports.getGambar = function (req, res) {
  let filename = req.params.filename;
  fs.readFile("uploads/" + filename, function (err, content) {
    if (err) {
      if (err.code === "ENOENT") {
        res.status(404).json({ message: "File not found" });
      } else {
        res.status(500).json({ message: "Error reading file" });
      }
    } else {
      //specify the content type in the response will be an image
      res.writeHead(200, { "Content-type": "image/jpg" });
      res.end(content);
    }
  });
};

//mengubah data menu berdasarkan id
exports.ubahmenu = function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

    var id_menu = req.params.id_menu;
    var nama_menu = req.body.nama_menu;
    var jenis = req.body.jenis;
    var deskripsi = req.body.deskripsi;
    var filename = req.file ? req.file.filename : null;
    var path = filename ? "https://api.zackym.com/gambar/" + filename : null;
    var harga = req.body.harga;

    const schema = Joi.object({
      nama_menu: Joi.string().required(),
      jenis: Joi.string().required().valid("makanan", "minuman"),
      deskripsi: Joi.string().required(),
      harga: Joi.string().required(),
    });

    const error2 = schema.validate(req.body);
    if (error2.error) {
      return res.status(400).json({
        error: error2.error.details[0].message,
      });
    }

    // mengambil nama file gambar sebelumnya
    connection.query(
      "SELECT filename FROM menu WHERE id_menu=?",
      [id_menu],
      function (error, rows, fields) {
        if (error) {
          console.log(error);
        } else {
          const prevFilename = rows[0].filename;

          // menghapus file gambar sebelumnya dari direktori uploads
          if (prevFilename) {
            fs.unlink("uploads/" + prevFilename, (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log("Deleted previous file: " + prevFilename);
              }
            });
          }

          // melakukan update menu dengan query UPDATE
          connection.query(
            "UPDATE menu SET nama_menu=?, jenis=?, deskripsi=?, filename=?, harga=?,path=? WHERE id_menu=?",
            [nama_menu, jenis, deskripsi, filename, harga,path, id_menu],
            function (error, rows, fields) {
              if (error) {
                console.log(error);
              } else {
                res.status(201).json({
          status: "Success",
          nama_menu: nama_menu,
          jenis: jenis,
          deskripsi: deskripsi,
          harga: harga,
        });
              }
            }
          );
        }
      }
    );
  });
};

//Menghapus data menu berdasarkan id
exports.hapusmenu = function (req, res) {
  var id_menu = req.params.id_menu;

  // Query database untuk mengambil informasi file gambar sebelum menu dihapus
  connection.query(
    "SELECT filename FROM menu WHERE id_menu=?",
    [id_menu],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        // Hapus file gambar
        const pathToFile = `uploads/${rows[0].filename}`;
        fs.unlink(pathToFile, (err) => {
          if (err) {
            console.error(err)
            return
          }
          console.log(`${pathToFile} berhasil dihapus`);
        });
      }
    }
  );

  // Query database untuk menghapus menu
  connection.query(
    "DELETE FROM menu WHERE id_menu=?",
    [id_menu],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Hapus Data", res);
      }
    }
  );
};


//menampilkan semua data meja
exports.meja = function (req, res) {
  connection.query("SELECT * FROM meja", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } else {
      response.ok(rows, res);
    }
  });
};

//menampilkan semua data meja berdasarkan id
exports.idmeja = function (req, res) {
  let id_meja = req.params.id_meja;
  connection.query(
    "SELECT * FROM meja WHERE id_meja = ?",
    [id_meja],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok(rows, res);
      }
    }
  );
};

//menambahkan data meja
exports.tambahMeja = function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

    var nomor_meja = req.body.nomor_meja;

    const schema = Joi.object({
      nomor_meja: Joi.string().required(),
    });

    const error2 = schema.validate(req.body);
    if (error2.error) {
      return res.status(400).json({
        error: error2.error.details[0].message,
      });
    }

    connection.query(
      "INSERT INTO meja (nomor_meja) VALUES(?)",
      [nomor_meja],
      function (error, rows, fields) {
        if (error) {
          console.log(error);
        } else {
          response.ok("Berhasil Menambahkan Data!", res.status(201));
        }
      }
    );
  });
};

//mengubah data meja berdasarkan id
exports.ubahmeja = function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

    var id_meja = req.params.id_meja;
    var nomor_meja = req.body.nomor_meja;

    const schema = Joi.object({
      nomor_meja: Joi.string().required(),
    });

    const error2 = schema.validate(req.body);
    if (error2.error) {
      return res.status(400).json({
        error: error2.error.details[0].message,
      });
    }

    connection.query(
      "UPDATE meja SET nomor_meja=? WHERE id_meja=?",
      [nomor_meja, id_meja],
      function (error, rows, fields) {
        if (error) {
          console.log(error);
        } else {
          response.ok("Berhasil Ubah Data", res);
        }
      }
    );
  });
};

//Menghapus data berdasarkan id
exports.hapusmeja = function (req, res) {
  var id_meja = req.params.id_meja;
  connection.query(
    "DELETE FROM meja WHERE id_meja=?",
    [id_meja],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Hapus Data", res);
      }
    }
  );
};

//menampilkan semua data transaksi
exports.transaksi = function (req, res) {
  const tgl_awal = req.query.tgl_awal;
  const tgl_akhir = req.query.tgl_akhir;
  let query = "SELECT * FROM transaksi";

  const schema = Joi.object({
    tgl_awal: Joi.date(),
    tgl_akhir: Joi.date(),
  });

  const error = schema.validate(req.query).error;
  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }

  if (tgl_awal !== undefined && tgl_akhir !== undefined) {
    query += ` WHERE tgl_transaksi >= '${tgl_awal}' AND tgl_transaksi <= '${tgl_akhir}'`;
  } else if (tgl_awal !== undefined) {
    query += ` WHERE tgl_transaksi >= '${tgl_awal}'`;
  } else if (tgl_akhir !== undefined) {
    query += ` WHERE tgl_transaksi <= '${tgl_akhir}'`;
  }

  connection.query(query, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } else if (rows.length === 0) {
      res.status(404).json({ message: "Data tidak tersedia" });
    } else {
      response.ok(rows, res);
    }
  });
};

//menampilkan semua data transaksi berdasarkan id
exports.idtransaksi = function (req, res) {
  let id_transaksi = req.params.id_transaksi;
  let id_user, id_meja, tgl_transaksi, nama_pelanggan, status;

  connection.query(
    "SELECT detail_transaksi.id_menu, menu.nama_menu,menu.jenis,menu.deskripsi,menu.filename,menu.harga FROM detail_transaksi JOIN menu ON detail_transaksi.id_menu = menu.id_menu WHERE id_transaksi=?",
    [id_transaksi],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        connection.query(
          `SELECT id_user, id_meja, tgl_transaksi, nama_pelanggan, status FROM transaksi WHERE id_transaksi=${id_transaksi}`,
          function (error, rows2, fields) {
            if (error) {
              console.log(error);
            } else if (rows2.length == 0) {
              // Jika data tidak ditemukan
              res.status(404).json({ message: "Data tidak tersedia" });
            } else {
              // Jika data ditemukan
              id_user = rows2[0].id_user;
              id_meja = rows2[0].id_meja;
              tgl_transaksi = rows2[0].tgl_transaksi;
              nama_pelanggan = rows2[0].nama_pelanggan;
              status = rows2[0].status;

              res.json({
                message: "Transaksi ditemukan",
                id_transaksi: id_transaksi,
                id_meja: id_meja,
                id_user: id_user,
                nama_pelanggan: nama_pelanggan,
                status: status,
                tgl_transaksi: tgl_transaksi,
                barang: rows,
              });
            }
          }
        );
      }
    }
  );
};

//menambahkan data transaksi v
exports.tambahTransaksi = function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

    let barang1 = null;
    let barang2 = null;
    let barang3 = null;
    let barang4 = null;
    let barang5 = null;
    let barang6 = null;
    let barang7 = null;
    let barang8 = null;
    let barang9 = null;
    let barang10 = null;

    barang1 = req.body.barang1;
    barang2 = req.body.barang2;
    barang3 = req.body.barang3;
    barang4 = req.body.barang4;
    barang5 = req.body.barang5;
    barang6 = req.body.barang6;
    barang7 = req.body.barang7;
    barang8 = req.body.barang8;
    barang9 = req.body.barang9;
    barang10 = req.body.barang10;

    var tokenWithBearer = req.headers.authorization;
    var token = tokenWithBearer.split(" ")[1];
    var tokenWithoutBearer = token.replace("Bearer", "");
    var id_meja = req.body.id_meja;
    var nama_pelanggan = req.body.nama_pelanggan;
    var status = req.body.status;
    let id_user;

    const schema = Joi.object({
      token: Joi.string(),
      id_meja: Joi.string().required(),
      nama_pelanggan: Joi.string().required(),
      status: Joi.string().required().valid("lunas", "belum_bayar"),
      barang1: Joi.number().required(),
      barang2: Joi.number().allow(null, ''),
      barang3: Joi.number().allow(null, ''),
      barang4: Joi.number().allow(null, ''),
      barang5: Joi.number().allow(null, ''),
      barang6: Joi.number().allow(null, ''),
      barang7: Joi.number().allow(null, ''),
      barang8: Joi.number().allow(null, ''),
      barang9: Joi.number().allow(null, ''),
      barang10: Joi.number().allow(null, ''),
    });

    const error2 = schema.validate(req.body);
    if (error2.error) {
      return res.status(400).json({
        error: error2.error.details[0].message,
      });
    }

    console.log("ngeonggg", tokenWithoutBearer);
    connection.query(
      `SELECT id_user FROM akses_token WHERE access_token = '${tokenWithoutBearer}'`,
      function (error, rowsIdUser, fields) {
        id_user = rowsIdUser[0].id_user;
        console.log(id_user);
        
        connection.query(`SELECT available FROM meja WHERE id_meja = ${id_meja}` , function (error, rows, fields) {
          if (error) {
            console.log(error);
          } else {
            if(rows[0].available==false){
              return res.status(400).json({
                message: "Meja Terpakai",
              });
            }else{
              connection.query(
                "INSERT INTO transaksi (id_user, id_meja, nama_pelanggan, status) VALUES(?,?,?,?)",
                [id_user, id_meja, nama_pelanggan, status],
                function (error, rowsTrx, fields) {
                  if (error) {
                    res.status(400).json({
                      message: "Gagal tambah data, periksa value input",
                    });
                  } else {
                    
                    if (rowsTrx.length == 0) {
                      console.log("rowsTrx", rowsTrx.length);
                      console.log("mippppp", rowsTrx);
                      res.status(400).json({
                        message: "Periksa value input",
                      });
                    }
                    console.log("tambah transaksi berhasil");
      
                    transaksi(
                      barang1,
                      barang2,
                      barang3,
                      barang4,
                      barang5,
                      barang6,
                      barang7,
                      barang8,
                      barang9,
                      barang10,
                      id_user,
                      id_meja,
                      nama_pelanggan,
                      status,
                      function (lastId) {
                        console.log(lastId);
                        let total_harga2;
      
                        connection.query(
                          `SELECT detail_transaksi.id_menu, menu.nama_menu,menu.jenis,menu.deskripsi,menu.filename,menu.harga
                       FROM detail_transaksi
                       JOIN menu ON detail_transaksi.id_menu = menu.id_menu
                       WHERE id_transaksi=${lastId}`,
                          function (error, rows2, fields) {
                            if (error) {
                              console.log(error);
                              res.status(500).json({ message: "Error file" });
                            } else {

                              connection.query(`UPDATE meja SET available = 0 WHERE id_meja = ${id_meja}` , function (error, rows, fields) {
                                if (error) {
                                  console.log(error);
                                }});
                              connection.query(
                                `SELECT SUM(menu.harga) AS total_harga
                             FROM detail_transaksi
                             JOIN menu ON detail_transaksi.id_menu = menu.id_menu
                             WHERE id_transaksi=${lastId}`,
                                function (error, rows, fields) {
                                  total_harga2 = rows[0].total_harga;
                                  console.log("totaltotal", total_harga2);
                                  lastId = rows[0].id_transaksi;
                                  res.json({
                                    message: "Berhasil tambah transaksi",
                                    id_transaksi: lastId,
                                    user: id_user,
                                    id_meja: id_meja,
                                    nama_pelanggan: nama_pelanggan,
                                    total_harga: total_harga2,
                                    status: status,
                                    barang: rows2,
                                  });
                                }
                              );
                            }
                          }
                        );
                      }
                    );
                  }
                }
              );
            }
          }
        });

        
      }
    );
  });
};

function transaksi(
  tr1,
  tr2,
  tr3,
  tr4,
  tr5,
  tr6,
  tr7,
  tr8,
  tr9,
  tr10,
  id_user,
  id_meja,
  nama_pelanggan,
  status,
  callback
) {
  var barang = [tr1, tr2, tr3, tr4, tr5, tr6, tr7, tr8, tr9, tr10];
  var n = 10;

  connection.query(
    "SELECT id_transaksi FROM transaksi ORDER BY id_transaksi DESC",
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        const lastId = rows[0].id_transaksi;
        console.log("last id = ", lastId);

        for (var i = 0; i < 10; i++) {
          if (barang[i] != undefined&&barang[i]!=null&&barang[i]!="") {
            id_tr = barang[i];
            let ngeongg = lastId;
            console.log("mantap", id_tr);

            connection.query(
              "INSERT INTO detail_transaksi (id_transaksi, id_menu, harga) VALUES(?,?,?)",
              [ngeongg, id_tr, null],
              function (error, rows, fields) {
                if (error) {
                  console.log(error);
                } else {
                }
              }
            );
          }
        }

        callback(lastId);
      }
    }
  );
}

//mengubah data transaksi berdasarkan id
exports.ubahtransaksi = function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

    tr1 = req.body.barang1;
    tr2 = req.body.barang2;
    tr3 = req.body.barang3;
    tr4 = req.body.barang4;
    tr5 = req.body.barang5;
    tr6 = req.body.barang6;
    tr7 = req.body.barang7;
    tr8 = req.body.barang8;
    tr9 = req.body.barang9;
    tr10 = req.body.barang10;

    var id_transaksi = req.params.id_transaksi;
    var id_meja = req.body.id_meja;
    var nama_pelanggan = req.body.nama_pelanggan;
    var status = req.body.status;
    var tokenWithBearer = req.headers.authorization;
    var token = tokenWithBearer.split(" ")[1];
    var tokenWithoutBearer = token.replace("Bearer", "");
    let id_user;

    const schema = Joi.object({
      id_meja: Joi.string().required(),
      nama_pelanggan: Joi.string().required(),
      status: Joi.string().required().valid("lunas", "belum_bayar"),
      barang1: Joi.number().required(),
      barang2: Joi.number().allow(null, ''),
      barang3: Joi.number().allow(null, ''),
      barang4: Joi.number().allow(null, ''),
      barang5: Joi.number().allow(null, ''),
      barang6: Joi.number().allow(null, ''),
      barang7: Joi.number().allow(null, ''),
      barang8: Joi.number().allow(null, ''),
      barang9: Joi.number().allow(null, ''),
      barang10: Joi.number().allow(null, ''),
    });

    const error2 = schema.validate(req.body);
    if (error2.error) {
      return res.status(400).json({
        error: error2.error.details[0].message,
      });
    }

    if(status=="lunas"){
         connection.query(
          `UPDATE meja SET available = 1 WHERE id_meja = ${id_meja}`,
          function (error, rows, fields) {
            if (error) {
              console.log(error);
            }
          }
        );
    }
    
    console.log("ngeonggg", tokenWithoutBearer);
    connection.query(
      `SELECT id_user FROM akses_token WHERE access_token = '${tokenWithoutBearer}'`,
      function (error, rowsIdUser, fields) {
        if (error) {
          console.log("mrpppp", error);
        } else {
          id_user = rowsIdUser[0].id_user;
          console.log("mengggg", id_user);

          updateTransaksi(
            tr1,
            tr2,
            tr3,
            tr4,
            tr5,
            tr6,
            tr7,
            tr8,
            tr9,
            tr10,
            id_transaksi,
            id_user,
            id_meja,
            nama_pelanggan,
            status
          );

          connection.query(
            `SELECT detail_transaksi.id_menu, menu.nama_menu,menu.jenis,menu.deskripsi,menu.filename,menu.harga
          FROM detail_transaksi
          JOIN menu ON detail_transaksi.id_menu = menu.id_menu
          WHERE id_transaksi=${id_transaksi}`,
            function (error, rows2, fields) {
              if (error) {
                console.log(error);
              } else {
                connection.query(
                  `SELECT SUM(menu.harga) AS total_harga
                FROM detail_transaksi
                JOIN menu ON detail_transaksi.id_menu = menu.id_menu
                WHERE id_transaksi=${id_transaksi}`,
                  function (error, rows, fields) {
                    total_harga2 = rows[0].total_harga;
                    console.log("totaltotal", total_harga2);
                    res.json({
                      message: "Berhasil tambah transaksi",
                      id_transaksi: id_transaksi,
                      user: id_user,
                      id_meja: id_meja,
                      nama_pelanggan: nama_pelanggan,
                      total_harga: total_harga2,
                      status: status,
                      barang: rows2,
                    });
                  }
                );
              }
            }
          );
        }
      }
    );
  });
};

function updateTransaksi(
  tr1,
  tr2,
  tr3,
  tr4,
  tr5,
  tr6,
  tr7,
  tr8,
  tr9,
  tr10,
  id_transaksi,
  id_user,
  id_meja,
  nama_pelanggan,
  status
) {
  var barang = [tr1, tr2, tr3, tr4, tr5, tr6, tr7, tr8, tr9, tr10];
  var n = 10;

  console.log("pikpikpik", id_user);

  connection.query(
    `UPDATE transaksi SET id_user = ${id_user}, id_meja = ${id_meja}, nama_pelanggan = '${nama_pelanggan}', status = '${status}' WHERE id_transaksi = ${id_transaksi}`,
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        console.log("Berhasil tambah data");

        connection.query(
          `DELETE FROM detail_transaksi WHERE id_transaksi= ${id_transaksi}`,
          function (error, rows, fields) {
            if (error) {
              console.log(error);
            } else {
              console.log("berhasil delete detail");
            }
          }
        );

        for (var i = 0; i < 10; i++) {
          if (barang[i] != undefined&&barang[i]!=null&&barang[i]!="") {
            var id_barang = barang[i];

            connection.query(
              "INSERT INTO detail_transaksi (id_transaksi, id_menu, harga) VALUES(?,?,?)",
              [id_transaksi, id_barang, null],
              function (error, rows, fields) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Berhasil tambah");
                }
              }
            );
          }
        }
      }
    }
  );
}

//meghapus data transaksi berdasarkan id
exports.hapustransaksi = function (req, res) {
  var id_transaksi = req.params.id_transaksi;
  connection.query(
    "DELETE FROM transaksi WHERE id_transaksi=?",
    [id_transaksi],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Hapus Data", res);
      }
    }
  );
};

//menampilkan data statistik 
exports.statistik = function (req, res){

  var total_harga, total_penjualan, total_transaksi, penjualan_terbanyak, penjualan_sedikit, detail_penjualan;

  //banyaknya yang terjual dan harga
  connection.query("SELECT detail_transaksi.id_menu, menu.nama_menu, menu.harga, COUNT(detail_transaksi.id_detail_transaksi) AS total_penjualan, SUM(menu.harga) AS total_harga FROM detail_transaksi JOIN menu ON detail_transaksi.id_menu = menu.id_menu GROUP BY menu.nama_menu", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
    console.log("detail ", rows);
    detail_penjualan = rows;
  });

  //total harga
  connection.query("SELECT SUM(menu.harga) AS total_harga FROM detail_transaksi JOIN menu ON detail_transaksi.id_menu = menu.id_menu", function (error, rows, fields) {
    if (error) {
      console.log(error);
    }
    console.log("harga ", rows)
    total_harga = rows[0].total_harga; 
  });

  //total terjual
  connection.query("SELECT COUNT(detail_transaksi.id_detail_transaksi) AS total_terjual FROM detail_transaksi JOIN menu ON detail_transaksi.id_menu = menu.id_menu", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
    console.log("data total penjualan", rows)
    total_penjualan = rows[0].total_terjual;
    console.log("penjualan ",total_penjualan);
  });

  //total transaksi
  connection.query("SELECT COUNT(transaksi.id_transaksi) AS total_transaksi FROM transaksi", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
    total_transaksi = rows[0].total_transaksi;
  });

  //mengurutkan?
  connection.query("SELECT menu.nama_menu, COUNT(detail_transaksi.id_detail_transaksi) AS total_penjualan FROM detail_transaksi JOIN menu ON detail_transaksi.id_menu = menu.id_menu GROUP BY menu.nama_menu ORDER BY total_penjualan DESC", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
    console.log("penjualan terbanyak ", rows);
    penjualan_terbanyak = rows[0].nama_menu;
  });

  //mengurutkan?
  connection.query("SELECT menu.nama_menu, COUNT(detail_transaksi.id_detail_transaksi) AS total_penjualan FROM detail_transaksi JOIN menu ON detail_transaksi.id_menu = menu.id_menu GROUP BY menu.nama_menu ORDER BY total_penjualan ASC", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
    penjualan_sedikit = rows[0].nama_menu;
     res.json({
      message: "Succes",
      pendapatan: total_harga,
      total_transaksi: total_transaksi,
      total_menu_terjual: total_penjualan, 
      penjualan_terbanyak: penjualan_terbanyak,
      penjualan_sedikit: penjualan_sedikit,
      detail_penjualan: detail_penjualan
     });
  });

};


exports.log = function (req, res) {
  var limit = req.params.limit;

  connection.query(
    `SELECT * FROM logs ORDER BY id DESC LIMIT ${limit}`,
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok(rows, res);
      }
    }
  );
};

exports.flush = function (req, res) {
  var limit = req.params.limit;

  connection.query(`DELETE FROM logs`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } else {
      response.ok(rows, res);
    }
  });
};

exports.reset = function (req, res){
  connection.query(`TRUNCATE TABLE user WHERE role != "superadmin"`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    }
  });

  connection.query(`TRUNCATE TABLE menu`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
  });

  connection.query(`TRUNCATE TABLE meja`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
  });

  connection.query(`TRUNCATE TABLE transaksi`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
  });

  connection.query(`TRUNCATE TABLE logs`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
  });

  connection.query(`TRUNCATE TABLE detail_transaksi`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
  });

  connection.query(`TRUNCATE TABLE akses_token WHERE id_user != 1`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } 
    res.json({
      message: "Succes"
     });
      });
};

exports.availability = function (req, res) {
  var id_meja = req.params.id_meja;

  connection.query(`UPDATE meja SET available = 1 WHERE id_meja = ${id_meja}`, function (error, rows, fields) {
    if (error) {
      console.log(error);
    } else {
      res.status(200).json({
        message: "Success"
      })
    }
  });
};