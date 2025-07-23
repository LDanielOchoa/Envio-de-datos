import { NextResponse } from 'next/server';
import { SendingProgressManager } from '../../../../lib/sending-progress';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId') || 'default';
        
        console.log(`🔍 [${sessionId}] Consultando progreso...`);
        
        const progress = SendingProgressManager.getProgress(sessionId);
        
        console.log(`🔍 [${sessionId}] Progreso encontrado:`, progress ? 'SÍ' : 'NO');
        
        if (!progress) {
            console.log(`❌ [${sessionId}] No se encontró progreso para esta sesión`);
            return NextResponse.json({
                success: false,
                error: 'No se encontró progreso para esta sesión'
            }, { status: 404 });
        }
        
        console.log(`✅ [${sessionId}] Progreso devuelto:`, {
            currentIndex: progress.currentIndex,
            totalContacts: progress.totalContacts,
            successCount: progress.successCount,
            errorCount: progress.errorCount,
            invalidNumbersCount: progress.invalidNumbersCount,
            resultsCount: progress.results.length
        });
        
        return NextResponse.json({
            success: true,
            data: progress
        });
        
    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId') || 'default';
        const action = searchParams.get('action') || 'test';
        
        console.log(`🧪 [${sessionId}] Probando manager de progreso con acción: ${action}`);
        
        if (action === 'init') {
            const totalContacts = 5;
            SendingProgressManager.initializeProgress(sessionId, totalContacts);
            console.log(`✅ [${sessionId}] Progreso inicializado para ${totalContacts} contactos`);
            
            return NextResponse.json({
                success: true,
                message: `Progreso inicializado para ${totalContacts} contactos`
            });
        }
        
        if (action === 'update') {
            SendingProgressManager.updateProgress(sessionId, 'test1', 'Test User 1', '573001234567', 'success');
            SendingProgressManager.updateProgress(sessionId, 'test2', 'Test User 2', '573007654321', 'error', 'Error de prueba');
            console.log(`✅ [${sessionId}] Progreso actualizado con datos de prueba`);
            
            return NextResponse.json({
                success: true,
                message: 'Progreso actualizado con datos de prueba'
            });
        }
        
        if (action === 'get') {
            const progress = SendingProgressManager.getProgress(sessionId);
            console.log(`✅ [${sessionId}] Progreso obtenido:`, progress);
            
            return NextResponse.json({
                success: true,
                data: progress
            });
        }
        
        return NextResponse.json({
            success: false,
            error: 'Acción no válida'
        }, { status: 400 });
        
    } catch (error) {
        console.error('Error en prueba de progreso:', error);
        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor'
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId') || 'default';
        
        SendingProgressManager.clearProgress(sessionId);
        
        return NextResponse.json({
            success: true,
            message: 'Progreso eliminado correctamente'
        });
        
    } catch (error) {
        console.error('Error eliminando progreso:', error);
        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor'
        }, { status: 500 });
    }
} 