import fs from 'fs';
import path from 'path';

export interface PDFConfig {
  filename: string;
  path: string;
  mimeType: string;
}

export class PDFService {
  private static readonly DEFAULT_PDF_PATH = path.join(process.cwd(), 'docs', 'Formatos requeridos 2025 (16).pdf');
  private static readonly DEFAULT_PDF_CONFIG: PDFConfig = {
    filename: 'Formatos requeridos 2025 (16).pdf',
    path: PDFService.DEFAULT_PDF_PATH,
    mimeType: 'application/pdf'
  };

  /**
   * Obtiene la configuración del PDF por defecto
   */
  static getDefaultPDFConfig(): PDFConfig {
    return { ...PDFService.DEFAULT_PDF_CONFIG };
  }

  /**
   * Verifica si el PDF por defecto existe
   */
  static async checkDefaultPDFExists(): Promise<boolean> {
    try {
      await fs.promises.access(PDFService.DEFAULT_PDF_PATH, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lee el PDF y lo convierte a base64
   */
  static async readPDFAsBase64(pdfConfig: PDFConfig = PDFService.DEFAULT_PDF_CONFIG): Promise<string> {
    try {
      console.log(`📄 Leyendo PDF: ${pdfConfig.path}`);
      
      // Verificar que el archivo existe
      await fs.promises.access(pdfConfig.path, fs.constants.F_OK);
      
      // Leer el archivo como buffer
      const fileBuffer = await fs.promises.readFile(pdfConfig.path);
      
      // Convertir a base64
      const base64 = fileBuffer.toString('base64');
      
      console.log(`✅ PDF leído exitosamente: ${base64.length} caracteres base64`);
      return base64;
      
    } catch (error) {
      console.error(`❌ Error leyendo PDF ${pdfConfig.path}:`, error);
      throw new Error(`No se pudo leer el archivo PDF: ${pdfConfig.filename}`);
    }
  }

  /**
   * Obtiene información del PDF (tamaño, fecha de modificación, etc.)
   */
  static async getPDFInfo(pdfConfig: PDFConfig = PDFService.DEFAULT_PDF_CONFIG): Promise<{
    exists: boolean;
    size: number;
    modified: Date;
    filename: string;
  }> {
    try {
      const stats = await fs.promises.stat(pdfConfig.path);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        filename: pdfConfig.filename
      };
    } catch {
      return {
        exists: false,
        size: 0,
        modified: new Date(),
        filename: pdfConfig.filename
      };
    }
  }

  /**
   * Valida que el archivo sea un PDF válido
   */
  static async validatePDF(pdfConfig: PDFConfig = PDFService.DEFAULT_PDF_CONFIG): Promise<boolean> {
    try {
      const fileBuffer = await fs.promises.readFile(pdfConfig.path);
      
      // Verificar que los primeros bytes correspondan a un PDF
      const header = fileBuffer.slice(0, 4).toString('ascii');
      return header === '%PDF';
      
    } catch {
      return false;
    }
  }
} 