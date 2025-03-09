# API Usage Examples

## Sensor Data API

### Basic Usage

To retrieve sensor data for a farm, use the following URL format:

```
GET /api/sensor-data?farm_id=YOUR_FARM_ID
```

Example:
```
http://localhost:5000/api/sensor-data?farm_id=cvs0zzBaayfJP4xKzZqr
```

### With Device Filter

To filter sensor data for a specific device:

```
GET /api/sensor-data?farm_id=YOUR_FARM_ID&device_id=YOUR_DEVICE_ID
```

Example:
```
http://localhost:5000/api/sensor-data?farm_id=cvs0zzBaayfJP4xKzZqr&device_id=device123
```

### With Pagination

To paginate results:

```
GET /api/sensor-data?farm_id=YOUR_FARM_ID&limit=10&page=2
```

Example:
```
http://localhost:5000/api/sensor-data?farm_id=cvs0zzBaayfJP4xKzZqr&limit=10&page=2
```

### Complete Example

```
http://localhost:5000/api/sensor-data?farm_id=cvs0zzBaayfJP4xKzZqr&device_id=device123&limit=20&page=1
```

## Using cURL

```bash
curl -X GET "http://localhost:5000/api/sensor-data?farm_id=cvs0zzBaayfJP4xKzZqr" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## Using JavaScript Fetch

```javascript
const fetchSensorData = async () => {
  const response = await fetch('http://localhost:5000/api/sensor-data?farm_id=cvs0zzBaayfJP4xKzZqr', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_AUTH_TOKEN',
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(data);
};

fetchSensorData();
```

## Using Axios

```javascript
const axios = require('axios');

const fetchSensorData = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/sensor-data', {
      params: {
        farm_id: 'cvs0zzBaayfJP4xKzZqr',
        device_id: 'device123'
      },
      headers: {
        'Authorization': 'Bearer YOUR_AUTH_TOKEN'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
  }
};

fetchSensorData();
``` 