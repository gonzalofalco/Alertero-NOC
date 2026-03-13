#!/usr/bin/env python3
"""
Script para consolidar alertas duplicadas en la base de datos.
Ejecutar UNA SOLA VEZ para limpiar duplicados existentes.
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://alertero:alertero123@postgres:5432/alertero")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def consolidate_duplicates():
    """
    Consolida alertas duplicadas manteniendo la más reciente.
    
    Identifica duplicados por: alertname + description + port_port_id + system_name + grupo
    """
    session = Session()
    
    try:
        # Buscar grupos de alertas duplicadas
        query = text("""
            SELECT 
                alertname,
                labels->>'description' as description,
                labels->>'port_port_id' as port_id,
                labels->>'system_name' as system_name,
                labels->>'grupo' as grupo,
                array_agg(fingerprint ORDER BY updated_at DESC) as fingerprints,
                COUNT(*) as count
            FROM alerts_current
            WHERE status = 'firing'
            GROUP BY alertname, labels->>'description', labels->>'port_port_id', 
                     labels->>'system_name', labels->>'grupo'
            HAVING COUNT(*) > 1
            ORDER BY COUNT(*) DESC;
        """)
        
        result = session.execute(query)
        duplicates = result.fetchall()
        
        print(f"\n🔍 Encontrados {len(duplicates)} grupos de alertas duplicadas\n")
        
        total_deleted = 0
        
        for dup in duplicates:
            alertname, description, port_id, system_name, grupo, fingerprints, count = dup
            
            # El primer fingerprint es el más reciente (ORDER BY updated_at DESC)
            keep_fingerprint = fingerprints[0]
            delete_fingerprints = fingerprints[1:]
            
            print(f"📋 {alertname}")
            print(f"   Detalles: {description or port_id or system_name or grupo}")
            print(f"   ✅ Mantener: {keep_fingerprint[:12]}...")
            print(f"   ❌ Eliminar: {len(delete_fingerprints)} duplicados")
            
            # Eliminar duplicados
            for fp in delete_fingerprints:
                delete_query = text("DELETE FROM alerts_current WHERE fingerprint = :fp")
                session.execute(delete_query, {"fp": fp})
                total_deleted += 1
                print(f"      🗑️  Eliminado: {fp[:12]}...")
            
            print()
        
        # Commit
        session.commit()
        
        print(f"✅ Consolidación completada!")
        print(f"📊 Total eliminados: {total_deleted} duplicados")
        print(f"🎯 Grupos consolidados: {len(duplicates)}")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    print("=" * 70)
    print("🔧 CONSOLIDACIÓN DE ALERTAS DUPLICADAS")
    print("=" * 70)
    
    consolidate_duplicates()
    
    print("\n✨ Proceso completado. Reiniciar backend para aplicar nueva lógica.")
