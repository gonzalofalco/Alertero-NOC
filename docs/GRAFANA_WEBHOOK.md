# Configuración del Webhook en Grafana

Guía para conectar Grafana Alerting con Alertero.

## Prerequisitos

- Alertero instalado y funcionando
- Acceso a Grafana con permisos de administración o edición de contact points
- El `WEBHOOK_SECRET` generado durante la instalación de Alertero

## Paso 1: Obtener la URL del Webhook y el Secret

### URL del Webhook

```
http://<alertero-server-ip>/api/webhook/grafana
```

En producción con HTTPS:
```
https://alertero.example.com/api/webhook/grafana
```

### Webhook Secret

El secret se encuentra en `/etc/alertero/.env`:

```bash
grep WEBHOOK_SECRET /etc/alertero/.env
```

**Importante:** Guardar este secret de forma segura. Se necesitará para configurar el contact point.

## Paso 2: Crear Contact Point en Grafana

1. **Ir a Alerting → Contact points**
   - Menú lateral → Alerting → Contact points

2. **Clic en "Add contact point"**

3. **Configurar el Contact Point:**
   - **Name:** `Alertero`
   - **Integration:** Seleccionar `Webhook`
   - **URL:** `http://<alertero-ip>/api/webhook/grafana`
   - **HTTP Method:** `POST`

4. **Agregar HTTP Header personalizado:**
   - Clic en "+ Add HTTP header"
   - **Header name:** `X-Webhook-Secret`
   - **Header value:** `<tu-webhook-secret>`

5. **Test Contact Point:**
   - Clic en "Test" para enviar una alerta de prueba
   - Deberías ver "Test message sent successfully"

6. **Guardar:**
   - Clic en "Save contact point"

## Paso 3: Asociar Contact Point a Notification Policy

1. **Ir a Alerting → Notification policies**

2. **Opciones:**
   
   **Opción A - Configurar Default Policy:**
   - Editar la política default
   - En "Contact point" seleccionar `Alertero`
   - Save

   **Opción B - Crear Política Específica:**
   - Clic en "+ New nested policy"
   - **Label matchers:** Agregar criterios (ej: `team = infrastructure`)
   - **Contact point:** Seleccionar `Alertero`
   - Save

## Paso 4: Verificar Configuración

### Testear desde Grafana

1. Ir a Alerting → Contact points
2. Seleccionar `Alertero`
3. Clic en "Test"
4. Enviar mensaje de prueba

### Verificar en Alertero

```bash
# Ver logs del backend
cd /opt/alertero
make logs

# Deberías ver algo como:
# backend-1  | INFO:app.routers.webhook:Created new alert abcdef123456 status=firing
```

### Verificar en la Web UI

1. Abrir `http://<alertero-ip>/`
2. Deberías ver la alerta de prueba en la tabla
3. Stats deberían reflejar la nueva alerta

## Paso 5: Optimizar Envío de Alertas

### Configurar Group Interval

En Notification Policy:
- **Group wait:** `10s` (tiempo de espera para agrupar alertas)
- **Group interval:** `30s` (intervalo entre envíos de grupos)
- **Repeat interval:** `4h` (cuándo re-enviar alertas no resueltas)

Esto evita flooding de webhooks.

## Formato del Webhook

Grafana envía alertas en este formato JSON:

```json
{
  "receiver": "Alertero",
  "status": "firing",
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "HighCPU",
        "instance": "server01",
        "severity": "critical",
        "team": "infrastructure"
      },
      "annotations": {
        "summary": "CPU usage is above 90%",
        "description": "Server server01 has CPU usage at 95% for 5 minutes"
      },
      "startsAt": "2024-01-15T10:30:00Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "https://grafana.example.com/alerting/grafana/abc123/view",
      "fingerprint": "f8a123b456c789"
    }
  ],
  "groupLabels": {},
  "commonLabels": {},
  "commonAnnotations": {},
  "externalURL": "https://grafana.example.com"
}
```

## Labels Importantes para Alertero

Alertero extrae información de estos labels y annotations:

### Severity (Prioridad)

Label o annotation `severity`:
- `critical` → Rojo
- `warning` → Amarillo
- `info` → Azul
- (default: `info` si no se especifica)

Ejemplo en regla de alerta:
```yaml
labels:
  severity: critical
```

### Team (Equipo Responsable)

Label o annotation `team`:
```yaml
labels:
  team: infrastructure
```

### Summary y Description

Annotations para mostrar en la UI:
```yaml
annotations:
  summary: "CPU usage above 90%"
  description: "Server {{ $labels.instance }} CPU at {{ $value }}%"
```

## Ejemplo Completo: Alerta de Grafana

```yaml
apiVersion: 1
groups:
  - name: Infrastructure
    interval: 60s
    rules:
      - uid: high_cpu_alert
        title: High CPU Usage
        condition: C
        data:
          - refId: A
            queryType: ''
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus-uid
            model:
              expr: 'avg(cpu_usage_percent) by (instance)'
          - refId: C
            queryType: ''
            datasourceUid: __expr__
            model:
              type: reduce
              expression: A
              reducer: last
          - refId: D
            queryType: ''
            datasourceUid: __expr__
            model:
              type: threshold
              expression: C
              conditions:
                - evaluator:
                    params: [90]
                    type: gt
        noDataState: NoData
        execErrState: Error
        for: 5m
        labels:
          severity: critical
          team: infrastructure
          alertname: HighCPU
        annotations:
          summary: "High CPU usage detected"
          description: "Instance {{ $labels.instance }} has CPU at {{ $value }}%"
```

## Seguridad

### IP Allowlist (Recomendado para Producción)

Editar `/opt/alertero/nginx/locations.conf`:

```nginx
location /api/webhook/grafana {
    # Permitir solo la IP de Grafana
    allow 10.20.30.40;  # IP de Grafana
    allow 10.20.30.0/24; # Red de Grafana
    deny all;
    
    # ... resto configuración
}
```

Reiniciar nginx:
```bash
docker compose restart nginx
```

### Rotar Webhook Secret

Si necesitas cambiar el secret:

```bash
# 1. Generar nuevo secret
NEW_SECRET=$(openssl rand -hex 32)

# 2. Actualizar en Alertero
sudo sed -i "s/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$NEW_SECRET/" /etc/alertero/.env
cp /etc/alertero/.env /opt/alertero/.env

# 3. Reiniciar backend
docker compose restart backend

# 4. Actualizar en Grafana Contact Point
# Editar contact point y cambiar el header X-Webhook-Secret
```

## Troubleshooting

### Las alertas no llegan a Alertero

**1. Verificar conectividad:**
```bash
# Desde el servidor de Grafana
curl -X POST http://<alertero-ip>/api/webhook/grafana \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: <tu-secret>" \
  -d '{"alerts":[],"status":"firing","receiver":"test"}'
```

**2. Ver logs de Nginx:**
```bash
docker compose logs nginx | grep webhook
```

**3. Ver logs de backend:**
```bash
docker compose logs backend | grep webhook
```

**4. Verificar firewall:**
```bash
sudo ufw status
# Debe permitir puerto 80 (o 443 para HTTPS)
```

### Error 401 Unauthorized

- Verificar que el `X-Webhook-Secret` en Grafana coincida con el de `/etc/alertero/.env`
- El header debe llamarse exactamente `X-Webhook-Secret` (case-sensitive)

### Error 429 Too Many Requests

- Rate limiting activado (10 req/s por defecto)
- Ajustar en `/opt/alertero/nginx/locations.conf` el valor `rate=10r/s`
- Reiniciar nginx

### Alertas duplicadas

- Verificar que no haya múltiples contact points apuntando a Alertero
- Revisar la notification policy, podría estar matcheando múltiples veces

## Monitoreo del Webhook

### Ver estadísticas de alertas recibidas

```bash
curl http://<alertero-ip>/api/alerts/stats
```

### Ver últimas alertas

```bash
curl http://<alertero-ip>/api/alerts/current?limit=10
```

### Logs estructurados

```bash
# Ver solo webhooks recibidos
docker compose logs backend | grep "Processed.*alerts"

# Output ejemplo:
# INFO:app.routers.webhook:Processed 5 alerts fingerprints=['abc123', 'def456', ...]
```

## Siguientes Pasos

- Ver [QUICKSTART.md](./QUICKSTART.md) para comandos útiles
- Ver [SETUP_UBUNTU.md](./SETUP_UBUNTU.md) para configuración avanzada
- Configurar silencios para mantenimientos programados
- Implementar HTTPS para producción
