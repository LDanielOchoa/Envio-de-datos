import { readFile } from 'xlsx';
import { Contact } from '@/types';
import path from 'path';

export async function getContactsFromExcel(): Promise<Contact[]> {
    try {
        console.log('📊 Leyendo archivo Excel...');
        
        // Leer el archivo Excel
        const filePath = path.join(process.cwd(), 'docs', 'Contacto Beneficiarios Colombia Productiva 25_02_25.xlsx');
        const workbook = readFile(filePath);
        
        // Obtener la hoja específica
        const sheetName = 'Contacto Col-Productiva07-07-25';
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
            throw new Error(`No se encontró la hoja "${sheetName}"`);
        }
        
        // Convertir a array de objetos
        const data = readFile(filePath, { sheetRows: 1000 });
        const rows = data.Sheets[sheetName];
        
        if (!rows) {
            throw new Error('No se encontraron datos en la hoja');
        }
        
        // Encontrar las columnas necesarias
        let phoneColumn = '';
        let gestorColumn = '';
        let statusColumn = '';
        
        // Buscar las columnas en la primera fila
        for (let col in rows) {
            if (col.length > 1) { // Ignorar propiedades que no son celdas
                const value = rows[col].v;
                if (value === 'TeléfonoBeneficiario') {
                    phoneColumn = col[0];
                } else if (value === 'Cyndi') {
                    gestorColumn = col[0];
                }
                // La columna de estado es la siguiente a la de gestor
                if (gestorColumn && col[0] === String.fromCharCode(gestorColumn.charCodeAt(0) + 1)) {
                    statusColumn = col[0];
                }
            }
        }
        
        if (!phoneColumn || !gestorColumn || !statusColumn) {
            throw new Error('No se encontraron todas las columnas necesarias');
        }
        
        const contacts: Contact[] = [];
        let currentRow = 2; // Empezar desde la segunda fila
        
        while (true) {
            const phoneCell = rows[`${phoneColumn}${currentRow}`];
            const gestorCell = rows[`${gestorColumn}${currentRow}`];
            const statusCell = rows[`${statusColumn}${currentRow}`];
            
            if (!phoneCell) break; // No más datos
            
            const phone = phoneCell.v.toString().trim();
            const gestor = gestorCell?.v?.toString().trim() || '';
            const status = statusCell?.v?.toString().trim() || '';
            
            // Solo incluir si es de Cyndi y está sin contactar
            if (gestor === 'Cyndi' && status === 'Sin contactar') {
                // Formatear el número de teléfono
                let formattedPhone = phone.replace(/\D/g, '');
                if (!formattedPhone.startsWith('57')) {
                    formattedPhone = '57' + formattedPhone;
                }
                
                contacts.push({
                    id: `contact_${currentRow}`,
                    name: `Contacto ${currentRow}`,
                    phone: formattedPhone,
                    status: 'pending'
                });
                
                console.log(`✅ Contacto agregado: ${formattedPhone} (Fila ${currentRow})`);
            }
            
            currentRow++;
        }
        
        console.log(`📱 Total de contactos encontrados: ${contacts.length}`);
        return contacts;
        
    } catch (error) {
        console.error('Error leyendo Excel:', error);
        throw new Error(`Error al leer el archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
} 