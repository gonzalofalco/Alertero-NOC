# Configuración de Webhook en Grafana

## 📋 Información del Webhook de Alertero

**URL del Webhook:**
```
http://192.168.112.111:8080/api/v1/webhook/grafana
```

**Autenticación:**
```
Authorization: Bearer <WEBHOOK_SECRET>
```

O alternativamente:
```
X-Webhook-Secret: <WEBHOOK_SECRET>
```

Tomar el valor real desde `./.env`:

```bash
grep '^WEBHOOK_SECRET=' /home/neo/backup/opt/alertero/.env
```

---

## 🔧 Pasos para configurar en Grafana

### 1. Ir a Contact Points
1. Abrí Grafana
2. Andá a **Alerting** → **Contact points**
3. Click en **New contact point**

### 2. Configurar el Contact Point
- **Name:** `Alertero`
- **Integration:** `Webhook`
- **URL:** `http://192.168.112.111:8080/api/v1/webhook/grafana`
- **HTTP Method:** `POST`
- **Authorization:**
  - **Header:** `Authorization`
   - **Credentials:** `Bearer <WEBHOOK_SECRET>`

### 3. Test
- Click en **Test** para verificar que funciona
- Deberías ver un código `202 Accepted`

### 4. Configurar Notification Policy
1. Andá a **Alerting** → **Notification policies**
2. Click en **Edit** en la default policy
3. Agregá **Alertero** como contact point

---

## ✅ Verificación

Para verificar que está funcionando:

```bash
# Ver logs del backend buscando webhooks recibidos
sudo docker logs backend --tail 50 | grep "POST /api/v1/webhook"

# Ver todas las alertas en la BD
sudo docker exec postgres psql -U alertero -d alertero -c "SELECT COUNT(*) FROM alerts_current;"
```

Si ves logs con `POST /api/v1/webhook/grafana` significa que está funcionando.

---

## 🐛 Troubleshooting

**Si no funciona:**

1. **Verificar conectividad:**
   ```bash
   curl -X POST http://192.168.112.111:8080/api/v1/webhook/grafana \
       -H "Authorization: Bearer <WEBHOOK_SECRET>" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   Debería devolver error `401` (sin secret) o `422` (payload inválido), pero eso confirma que el endpoint está respondiendo.

2. **Ver logs de error:**
   ```bash
   sudo docker logs backend --tail 100
   ```

3. **Verificar que el backend esté escuchando:**
   ```bash
   sudo docker ps | grep backend
   sudo docker exec backend netstat -tulpn | grep 8000
   ```
