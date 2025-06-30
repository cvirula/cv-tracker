const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting para prevenir ataques
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
});
app.use(limiter);

// Inicializar base de datos
const db = new sqlite3.Database('prestamos.db');

// Crear tablas
db.serialize(() => {
  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    es_admin BOOLEAN DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de clientes morosos
  db.run(`CREATE TABLE IF NOT EXISTS clientes_morosos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dpi TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    cantidad_deuda REAL NOT NULL,
    empresa_deuda TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Eliminar usuario admin anterior si existe
  db.run(`DELETE FROM usuarios WHERE username = 'admin'`);

  // Crear usuario administrador cristian
  const cristianPassword = bcrypt.hashSync('virula10', 10);
  db.run(`INSERT OR IGNORE INTO usuarios (username, password, es_admin) VALUES (?, ?, ?)`, 
    ['cristian', cristianPassword, 1]);
});

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar si es admin
const isAdmin = (req, res, next) => {
  if (!req.user.es_admin) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

// Rutas de autenticación
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  db.get('SELECT * FROM usuarios WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, es_admin: user.es_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        es_admin: user.es_admin
      }
    });
  });
});

// Ruta para crear usuarios (solo admin)
app.post('/api/usuarios', authenticateToken, isAdmin, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO usuarios (username, password) VALUES (?, ?)', 
    [username, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'El usuario ya existe' });
        }
        return res.status(500).json({ error: 'Error al crear usuario' });
      }

      res.json({ 
        message: 'Usuario creado exitosamente',
        id: this.lastID 
      });
    });
});

// Ruta para agregar clientes morosos (solo admin)
app.post('/api/clientes', authenticateToken, isAdmin, (req, res) => {
  const { dpi, nombre, cantidad_deuda, empresa_deuda } = req.body;

  if (!dpi || !nombre || !cantidad_deuda || !empresa_deuda) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  db.run(
    'INSERT INTO clientes_morosos (dpi, nombre, cantidad_deuda, empresa_deuda) VALUES (?, ?, ?, ?)',
    [dpi, nombre, cantidad_deuda, empresa_deuda],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'El DPI ya existe en la base de datos' });
        }
        return res.status(500).json({ error: 'Error al agregar cliente' });
      }

      res.json({ 
        message: 'Cliente agregado exitosamente',
        id: this.lastID 
      });
    }
  );
});

// Ruta para obtener todos los clientes (solo admin)
app.get('/api/clientes', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT * FROM clientes_morosos ORDER BY fecha_creacion DESC', (err, clientes) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(clientes);
  });
});

// Ruta para obtener todos los clientes (para todos los usuarios autenticados, solo lectura)
app.get('/api/clientes/view', authenticateToken, (req, res) => {
  console.log('Se llamó a /api/clientes/view');
  db.all('SELECT * FROM clientes_morosos ORDER BY fecha_creacion DESC', (err, clientes) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(clientes);
  });
});

// Ruta para buscar por DPI (usuarios autenticados)
app.get('/api/clientes/:dpi', authenticateToken, (req, res) => {
  const { dpi } = req.params;

  db.get('SELECT * FROM clientes_morosos WHERE dpi = ?', [dpi], (err, cliente) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(cliente);
  });
});

// Ruta para actualizar cliente (solo admin)
app.put('/api/clientes/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { dpi, nombre, cantidad_deuda, empresa_deuda } = req.body;

  if (!dpi || !nombre || !cantidad_deuda || !empresa_deuda) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  db.run(
    'UPDATE clientes_morosos SET dpi = ?, nombre = ?, cantidad_deuda = ?, empresa_deuda = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
    [dpi, nombre, cantidad_deuda, empresa_deuda, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar cliente' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json({ message: 'Cliente actualizado exitosamente' });
    }
  );
});

// Ruta para eliminar cliente (solo admin)
app.delete('/api/clientes/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM clientes_morosos WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar cliente' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado exitosamente' });
  });
});

// Ruta para obtener todos los usuarios (solo admin)
app.get('/api/usuarios', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT id, username, es_admin, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC', (err, usuarios) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(usuarios);
  });
});

// Ruta para eliminar usuario (solo admin, pero no puede eliminar otros admins)
app.delete('/api/usuarios/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  // Verificar que no se esté eliminando a sí mismo
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
  }

  // Verificar que el usuario a eliminar no sea admin
  db.get('SELECT es_admin FROM usuarios WHERE id = ?', [id], (err, usuario) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.es_admin) {
      return res.status(403).json({ error: 'No puedes eliminar cuentas de administrador' });
    }

    // Eliminar el usuario
    db.run('DELETE FROM usuarios WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar usuario' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ message: 'Usuario eliminado exitosamente' });
    });
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Usuario administrador: cristian / virula10');
}); 