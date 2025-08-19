# Reverse Proxy Implementation for Concurrent Deployments

## Overview

This implementation provides a reverse proxy solution using Nginx to handle concurrent deployments of the same tech stack while maintaining subdomain-based routing.

## Architecture

```
User Request: subdomain1.localhost:14000
     ↓
Nginx Reverse Proxy (Port 14000)
     ↓
Flask App Container (Internal Port 15000)

User Request: subdomain2.localhost:14000
     ↓
Nginx Reverse Proxy (Port 14000)
     ↓
Flask App Container (Internal Port 15001)
```

## Key Components

### 1. Reverse Proxy Manager (`services/reverseProxyManager.js`)
- Manages internal port allocation (15000-15099 for Flask, 16000-16099 for Django, etc.)
- Handles Nginx container lifecycle
- Provides public URL generation

### 2. Proxy Configuration (`services/proxyConfig.js`)
- Generates dynamic Nginx configuration files
- Maintains subdomain-to-port mappings
- Updates proxy mappings on deployment/cleanup

### 3. Nginx Configuration (`nginx/nginx.conf`)
- Routes requests based on subdomain
- Includes dynamic proxy mappings
- Supports WebSocket connections

### 4. Docker Integration (`utils/dockerHelpers.js`)
- Updated to use internal port allocation
- Integrates with reverse proxy manager
- Handles cleanup of proxy mappings

## Port Allocation

| Tech Stack | Public Port | Internal Port Range |
|------------|-------------|-------------------|
| Flask      | 14000       | 15000-15099      |
| Django     | 13000       | 16000-16099      |
| MERN Backend | 12000     | 17000-17099      |
| MERN Frontend | 12000    | 18000-18099      |

## Deployment Flow

1. **Initialize Reverse Proxy**: Nginx container starts on first deployment
2. **Allocate Internal Port**: Find next available port in range for tech stack
3. **Deploy Application**: Container runs on internal port
4. **Update Proxy Config**: Add subdomain mapping to Nginx configuration
5. **Reload Nginx**: Apply new configuration without downtime

## URL Structure

- **Flask Apps**: `http://subdomain.localhost:14000`
- **Django Apps**: `http://subdomain.localhost:13000`
- **MERN Apps**: `http://subdomain.localhost:12000`

## Benefits

1. **Concurrent Deployments**: Multiple apps of same tech stack can run simultaneously
2. **Consistent URLs**: All Flask apps use port 14000 with different subdomains
3. **Zero Downtime**: Nginx configuration reloads without interrupting existing connections
4. **Automatic Cleanup**: Port allocations released when deployments are removed

## Configuration Files

### Dynamic Proxy Mappings (`nginx/proxy-mappings.conf`)
```nginx
map $host $backend_port {
    default 0;
    subdomain1.localhost 15000;
    subdomain2.localhost 15001;
}

map $host $frontend_port {
    default 0;
    mern-app.localhost 18000;
}
```

### Nginx Main Configuration
- Includes dynamic mappings
- Routes based on `$backend_port` and `$frontend_port` variables
- Supports health checks at `/health`

## Error Handling

- **Port Exhaustion**: Returns error if all ports in range are used
- **Nginx Failures**: Graceful fallback with detailed logging
- **Container Conflicts**: Automatic cleanup of existing containers

## Testing

To test concurrent deployments:

1. Deploy Flask app with subdomain `test-flask-1`
2. Deploy another Flask app with subdomain `test-flask-2`
3. Both should be accessible:
   - `http://test-flask-1.localhost:14000`
   - `http://test-flask-2.localhost:14000`

## Monitoring

- Nginx access logs: `/var/log/nginx/access.log`
- Health check endpoint: `http://localhost:14000/health`
- Port allocation tracking in deployment worker logs

## Future Enhancements

1. **Load Balancing**: Multiple instances of same app behind single subdomain
2. **SSL/TLS**: HTTPS support with automatic certificate generation
3. **Rate Limiting**: Per-subdomain request rate limiting
4. **Metrics**: Prometheus metrics for monitoring
