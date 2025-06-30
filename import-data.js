const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Conectar a la base de datos
const db = new sqlite3.Database('prestamos.db');

// Función para importar datos desde un archivo CSV
function importFromCSV(csvFilePath) {
    console.log('Iniciando importación desde CSV...');
    
    if (!fs.existsSync(csvFilePath)) {
        console.error('El archivo CSV no existe:', csvFilePath);
        return;
    }
    
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvContent.split('\n');
    
    // Saltar la primera línea (encabezados)
    const dataLines = lines.slice(1);
    
    let imported = 0;
    let errors = 0;
    
    dataLines.forEach((line, index) => {
        if (line.trim()) {
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
            
            // Esperar que el CSV tenga: DPI, Nombre, Cantidad, Empresa
            if (columns.length >= 4) {
                const [dpi, nombre, cantidad, empresa] = columns;
                
                // Validar datos
                if (dpi && nombre && cantidad && empresa) {
                    db.run(
                        'INSERT OR IGNORE INTO clientes_morosos (dpi, nombre, cantidad_deuda, empresa_deuda) VALUES (?, ?, ?, ?)',
                        [dpi, nombre, parseFloat(cantidad) || 0, empresa],
                        function(err) {
                            if (err) {
                                console.error(`Error en línea ${index + 2}:`, err.message);
                                errors++;
                            } else if (this.changes > 0) {
                                imported++;
                                console.log(`Importado: ${nombre} (DPI: ${dpi})`);
                            } else {
                                console.log(`DPI duplicado: ${dpi} - ${nombre}`);
                            }
                        }
                    );
                } else {
                    console.error(`Datos incompletos en línea ${index + 2}:`, line);
                    errors++;
                }
            } else {
                console.error(`Formato incorrecto en línea ${index + 2}:`, line);
                errors++;
            }
        }
    });
    
    setTimeout(() => {
        console.log(`\nImportación completada:`);
        console.log(`- Registros importados: ${imported}`);
        console.log(`- Errores: ${errors}`);
        db.close();
    }, 1000);
}

// Función para crear datos de ejemplo
function createSampleData() {
    console.log('Creando datos de ejemplo...');
    
    const sampleData = [
        ['1234567890123', 'Juan Pérez González', 15000.50, 'Banco Industrial'],
        ['2345678901234', 'María López Ramírez', 25000.75, 'Banco G&T'],
        ['3456789012345', 'Carlos Rodríguez Morales', 8500.25, 'Banco Azteca'],
        ['4567890123456', 'Ana García Hernández', 32000.00, 'Banco Promerica'],
        ['5678901234567', 'Luis Martínez Jiménez', 18000.30, 'Banco Industrial'],
        ['6789012345678', 'Carmen Torres Vásquez', 12500.80, 'Banco G&T'],
        ['7890123456789', 'Roberto Silva Mendoza', 45000.45, 'Banco Azteca'],
        ['8901234567890', 'Patricia Flores Ruiz', 22000.60, 'Banco Promerica'],
        ['9012345678901', 'Miguel Herrera Castro', 9500.15, 'Banco Industrial'],
        ['0123456789012', 'Sofia Mendoza Vega', 28000.90, 'Banco G&T']
    ];
    
    let imported = 0;
    
    sampleData.forEach(([dpi, nombre, cantidad, empresa]) => {
        db.run(
            'INSERT OR IGNORE INTO clientes_morosos (dpi, nombre, cantidad_deuda, empresa_deuda) VALUES (?, ?, ?, ?)',
            [dpi, nombre, cantidad, empresa],
            function(err) {
                if (err) {
                    console.error(`Error al importar ${nombre}:`, err.message);
                } else if (this.changes > 0) {
                    imported++;
                    console.log(`Creado: ${nombre} (DPI: ${dpi})`);
                }
            }
        );
    });
    
    setTimeout(() => {
        console.log(`\nDatos de ejemplo creados: ${imported} registros`);
        db.close();
    }, 1000);
}

// Función para exportar datos a CSV
function exportToCSV(outputPath = 'clientes_export.csv') {
    console.log('Exportando datos a CSV...');
    
    db.all('SELECT * FROM clientes_morosos ORDER BY fecha_creacion DESC', (err, rows) => {
        if (err) {
            console.error('Error al exportar:', err.message);
            db.close();
            return;
        }
        
        const csvHeader = 'DPI,Nombre,Cantidad de Deuda,Empresa,Fecha de Creación,Última Actualización\n';
        const csvRows = rows.map(row => {
            return `"${row.dpi}","${row.nombre}",${row.cantidad_deuda},"${row.empresa_deuda}","${row.fecha_creacion}","${row.fecha_actualizacion}"`;
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        fs.writeFileSync(outputPath, csvContent, 'utf8');
        console.log(`Datos exportados a: ${outputPath}`);
        console.log(`Total de registros: ${rows.length}`);
        db.close();
    });
}

// Función para mostrar estadísticas
function showStats() {
    console.log('Mostrando estadísticas...');
    
    db.get('SELECT COUNT(*) as total FROM clientes_morosos', (err, result) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err.message);
            db.close();
            return;
        }
        
        console.log(`Total de clientes: ${result.total}`);
        
        db.get('SELECT SUM(cantidad_deuda) as total_deuda FROM clientes_morosos', (err, result) => {
            if (err) {
                console.error('Error al calcular deuda total:', err.message);
            } else {
                console.log(`Deuda total: Q${parseFloat(result.total_deuda || 0).toFixed(2)}`);
            }
            
            db.get('SELECT empresa_deuda, COUNT(*) as cantidad FROM clientes_morosos GROUP BY empresa_deuda ORDER BY cantidad DESC', (err, results) => {
                if (err) {
                    console.error('Error al obtener estadísticas por empresa:', err.message);
                } else {
                    console.log('\nClientes por empresa:');
                    if (Array.isArray(results)) {
                        results.forEach(row => {
                            console.log(`- ${row.empresa_deuda}: ${row.cantidad} clientes`);
                        });
                    }
                }
                db.close();
            });
        });
    });
}

// Función principal
function main() {
    const command = process.argv[2];
    const argument = process.argv[3];
    
    console.log('=== Herramienta de Gestión de Datos ===\n');
    
    switch (command) {
        case 'import':
            if (argument) {
                importFromCSV(argument);
            } else {
                console.log('Uso: node import-data.js import <archivo.csv>');
                console.log('Ejemplo: node import-data.js import clientes.csv');
            }
            break;
            
        case 'sample':
            createSampleData();
            break;
            
        case 'export':
            exportToCSV(argument);
            break;
            
        case 'stats':
            showStats();
            break;
            
        default:
            console.log('Comandos disponibles:');
            console.log('  import <archivo.csv>  - Importar datos desde CSV');
            console.log('  sample                - Crear datos de ejemplo');
            console.log('  export [archivo.csv]  - Exportar datos a CSV');
            console.log('  stats                 - Mostrar estadísticas');
            console.log('\nEjemplos:');
            console.log('  node import-data.js import clientes.csv');
            console.log('  node import-data.js sample');
            console.log('  node import-data.js export backup.csv');
            console.log('  node import-data.js stats');
            break;
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = {
    importFromCSV,
    createSampleData,
    exportToCSV,
    showStats
}; 