import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { Contact } from '../types';
import { JSDOM } from 'jsdom';

// Tipos de hojas de Google Sheets soportadas
export enum SheetType {
  UNITARIO = 'unitario',
  GRUPOS = 'grupos'
}

// Función para limpiar HTML de texto
function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, '').trim();
}

// Función para determinar si una fila está vacía
function isEmptyRow(row: string[]): boolean {
  return row.every(cell => !cell || cell.trim() === '');
}

// Función para formatear número de teléfono colombiano
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  console.log(`📞 Formateando teléfono: "${phone}"`);
  
  // Limpiar el número de cualquier carácter no numérico
  let cleaned = phone.replace(/\D/g, '');
  console.log(`   Limpio: "${cleaned}"`);
  
  // Manejar casos especiales
  if (cleaned === '0') return '';
  
  // Si es un número muy corto o muy largo, probablemente es un error
  if (cleaned.length < 7 || cleaned.length > 15) {
    console.log(`   ⚠️ Longitud inválida: ${cleaned.length} dígitos`);
    return cleaned; // Devolver tal cual para que se filtre después
  }
  
  // Si comienza con 57 y tiene la longitud correcta
  if (cleaned.startsWith('57') && cleaned.length >= 10) {
    console.log(`   ✅ Ya tiene prefijo 57: ${cleaned}`);
    return cleaned;
  }
  
  // Si comienza con 3 y tiene la longitud correcta para Colombia (10 dígitos)
  if (cleaned.startsWith('3') && cleaned.length === 10) {
    const formatted = `57${cleaned}`;
    console.log(`   ✅ Agregando prefijo 57: ${formatted}`);
    return formatted;
  }
  
  // Si comienza con 3 pero tiene menos dígitos, podría ser un número incompleto
  if (cleaned.startsWith('3') && cleaned.length < 10) {
    console.log(`   ⚠️ Número incompleto: ${cleaned}`);
    return cleaned; // Devolver tal cual para que se filtre después
  }
  
  // Si no cumple ninguna condición, devolver tal cual
  console.log(`   ⚠️ Formato no reconocido: ${cleaned}`);
  return cleaned;
}

// Función principal para obtener contactos desde una URL de Google Sheets
export async function getContactsFromGoogleSheet(sheetUrl: string, sheetType: SheetType = SheetType.UNITARIO): Promise<Contact[]> {
  console.log(`🔍 Obteniendo contactos desde Google Sheets (tipo: ${sheetType})...`);
  console.log(`🔗 URL: ${sheetUrl}`);
  
  try {
    // Obtener el HTML de la hoja publicada
    console.log(`🌐 Obteniendo HTML de: ${sheetUrl}`);
    const response = await axios.get(sheetUrl);
    const htmlContent = response.data;
    console.log(`📄 HTML obtenido: ${htmlContent.length} caracteres`);
    
    // Extraer datos de la tabla HTML usando JSDOM
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const tables = document.querySelectorAll('table');
    
    console.log(`🔍 Tablas encontradas: ${tables.length}`);
    
    if (tables.length === 0) {
      throw new Error('No se encontraron tablas en la hoja de Google');
    }
    
    // Buscar la tabla más grande (con más filas)
    let bestTable = tables[0];
    let maxRows = bestTable.querySelectorAll('tr').length;
    
    for (let i = 1; i < tables.length; i++) {
      const table = tables[i];
      const rowCount = table.querySelectorAll('tr').length;
      console.log(`📊 Tabla ${i}: ${rowCount} filas`);
      
      if (rowCount > maxRows) {
        bestTable = table;
        maxRows = rowCount;
      }
    }
    
    console.log(`✅ Usando tabla con ${maxRows} filas`);
    const rows = bestTable.querySelectorAll('tr');
    
    if (rows.length <= 1) {
      throw new Error('La tabla no tiene suficientes filas');
    }
    
    // Convertir filas HTML a arrays de texto
    const dataRows: string[][] = [];
    rows.forEach((row, rowIndex) => {
      // Buscar celdas tanto en td como en th (para encabezados)
      const cells = row.querySelectorAll('td, th');
      
      if (cells.length > 0) {
        const rowData: string[] = [];
        cells.forEach((cell, cellIndex) => {
          const cellText = stripHtml(cell.innerHTML);
          rowData.push(cellText);
          
          // Mostrar las primeras 5 filas para depuración
          if (rowIndex < 5) {
            console.log(`   Celda[${rowIndex}][${cellIndex}]: "${cellText}"`);
          }
        });
        dataRows.push(rowData);
      }
    });
    
    // Determinar índices de columnas según el tipo de hoja
    let nameIndex = -1;
    let lastNameIndex = -1;
    let phoneIndex = -1;
    let groupIndex = -1;
    let gestorIndex = -1;
    
    // Buscar encabezados en las primeras filas
    console.log('🔍 Buscando encabezados en las primeras filas...');
    for (let i = 0; i < Math.min(5, dataRows.length); i++) {
      const row = dataRows[i].map(cell => cell.toLowerCase());
      console.log(`📋 Fila ${i}:`, row.join(' | '));
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        
        // Mostrar cada celda para depuración
        console.log(`   Celda[${j}]: "${cell}"`);
        
        if (cell.includes('nombre') && cell.includes('beneficiario')) {
          nameIndex = j;
          console.log(`✅ Encontrada columna de nombre en posición ${j}: ${cell}`);
        } else if (cell.includes('apellido') && cell.includes('beneficiario')) {
          lastNameIndex = j;
          console.log(`✅ Encontrada columna de apellido en posición ${j}: ${cell}`);
        } else if ((cell.includes('teléfono') || cell.includes('telefono')) && cell.includes('beneficiario')) {
          phoneIndex = j;
          console.log(`✅ Encontrada columna de teléfono en posición ${j}: ${cell}`);
        } else if (cell === 'grupo' || cell.includes('grupo ')) {
          groupIndex = j;
          console.log(`✅ Encontrada columna de grupo en posición ${j}: ${cell}`);
        } else if (cell === 'gestor') {
          gestorIndex = j;
          console.log(`✅ Encontrada columna de gestor en posición ${j}: ${cell}`);
        }
      }
      
      // Si encontramos al menos nombre y teléfono, podemos continuar
      if (nameIndex >= 0 && phoneIndex >= 0) {
        console.log('✅ Encontradas columnas necesarias, continuando...');
        break;
      }
    }
    
    // Si no encontramos las columnas necesarias, intentar buscar por posición específica
    // basado en el formato conocido de la hoja
    if (phoneIndex === -1) {
      console.log('⚠️ No se encontró la columna de teléfono por nombre, intentando por posición...');
      // Basado en: Grupo Emisión | Nombres Beneficiario | Apellidos Beneficiario | Teléfono Beneficiario | EMail | Grupo | Gestor
      nameIndex = 1;  // Nombres Beneficiario suele estar en posición 1
      lastNameIndex = 2; // Apellidos Beneficiario suele estar en posición 2
      phoneIndex = 3; // Teléfono Beneficiario suele estar en posición 3
      groupIndex = 5; // Grupo suele estar en posición 5
      gestorIndex = 6; // Gestor suele estar en posición 6
      console.log('ℹ️ Usando posiciones por defecto: nombre(1), apellido(2), teléfono(3), grupo(5), gestor(6)');
    }
    
    // Verificar que encontramos las columnas necesarias
    if (phoneIndex === -1) {
      throw new Error('No se encontró la columna de teléfono');
    }
    
    if (nameIndex === -1) {
      throw new Error('No se encontró la columna de nombre');
    }
    
    if (sheetType === SheetType.GRUPOS && (groupIndex === -1 || gestorIndex === -1)) {
      throw new Error('No se encontraron las columnas de grupo o gestor necesarias para envío por grupos');
    }
    
    console.log(`📊 Índices encontrados - Nombre: ${nameIndex}, Apellido: ${lastNameIndex}, Teléfono: ${phoneIndex}, Grupo: ${groupIndex}, Gestor: ${gestorIndex}`);
    
    // Procesar filas para crear contactos
    const contacts: Contact[] = [];
    const phoneSet = new Set<string>(); // Para evitar duplicados
    
    console.log(`📊 Índices encontrados - Nombre: ${nameIndex}, Apellido: ${lastNameIndex}, Teléfono: ${phoneIndex}, Grupo: ${groupIndex}, Gestor: ${gestorIndex}`);
    
    // Comenzar desde la fila después de los encabezados (al menos la fila 1)
    // Buscar hasta la fila 10 para encontrar los encabezados reales
    let startRow = 1;
    for (let i = 1; i < Math.min(10, dataRows.length); i++) {
      const row = dataRows[i];
      if (row.length > 3 && 
          row.some(cell => cell.toLowerCase().includes('beneficiario')) &&
          row.some(cell => cell.toLowerCase().includes('teléfono') || cell.toLowerCase().includes('telefono'))) {
        startRow = i + 1; // Comenzar desde la siguiente fila
        console.log(`🔍 Encabezados encontrados en fila ${i}, comenzando desde fila ${startRow}`);
        break;
      }
    }
    
    console.log(`🔢 Procesando desde la fila ${startRow} hasta ${dataRows.length}`);
    
    // Procesar filas de datos
    for (let i = startRow; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Verificar que la fila tiene suficientes columnas
      if (row.length <= Math.max(nameIndex, phoneIndex)) {
        console.log(`⚠️ Fila ${i} no tiene suficientes columnas: ${row.length} columnas`);
        continue;
      }
      
      // Verificar que la fila no está vacía
      if (isEmptyRow(row)) {
        console.log(`⚠️ Fila ${i} está vacía`);
        continue;
      }
      
      // Obtener datos según el tipo de hoja
      const name = row[nameIndex]?.trim() || '';
      const lastName = lastNameIndex >= 0 ? row[lastNameIndex]?.trim() || '' : '';
      const rawPhone = row[phoneIndex]?.trim() || '';
      const group = groupIndex >= 0 ? row[groupIndex]?.trim() || '' : '';
      const gestor = gestorIndex >= 0 ? row[gestorIndex]?.trim() || '' : '';
      
      console.log(`👤 Fila ${i}: Nombre="${name}", Apellido="${lastName}", Teléfono="${rawPhone}", Grupo="${group}", Gestor="${gestor}"`);
      
      // Verificar que tenemos al menos un nombre y teléfono
      if (!name && !lastName) {
        console.log(`⚠️ Fila ${i}: Sin nombre ni apellido`);
        continue;
      }
      
      if (!rawPhone) {
        console.log(`⚠️ Fila ${i}: Sin teléfono`);
        continue;
      }
      
      // Formatear teléfono
      const phone = formatPhoneNumber(rawPhone);
      
      // Verificar que el teléfono es válido
      if (phone.length < 10) {
        console.log(`⚠️ Teléfono inválido en fila ${i}: ${rawPhone} -> ${phone}`);
        continue;
      }
      
      // Evitar duplicados
      if (phoneSet.has(phone)) {
        console.log(`⚠️ Teléfono duplicado en fila ${i}: ${phone}`);
        continue;
      }
      
      // Crear contacto según el tipo de hoja
      const contact: Contact = {
        id: `contact_${i}`,
        name: name || 'Sin nombre', // Usar "Sin nombre" si no hay nombre
        phone: phone,
        status: 'pending'
      };
      
      // Agregar apellido si está disponible
      if (lastName) {
        contact.lastName = lastName;
      }
      
      // Agregar grupo y gestor si estamos en modo grupos
      if (sheetType === SheetType.GRUPOS) {
        contact.group = group;
        contact.gestor = gestor;
      }
      
      // Agregar a la lista y al conjunto de teléfonos
      contacts.push(contact);
      phoneSet.add(phone);
      console.log(`✅ Contacto agregado: ${name} ${lastName} (${phone}) - Grupo: ${group}`);
      
      // Limitar a 100 contactos para evitar problemas
      if (contacts.length >= 100) {
        console.log('⚠️ Limitando a 100 contactos');
        break;
      }
    }
    
    console.log(`✅ Se encontraron ${contacts.length} contactos válidos`);
    return contacts;
    
  } catch (error) {
    console.error('❌ Error obteniendo contactos:', error);
    throw new Error(`Error al obtener contactos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
} 