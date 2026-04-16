const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { latLngToCell, gridDisk } = require('h3-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*' },
});

const RESOLUTION = 9;

// In-memory stores
let drivers = {};  // { socketId: { latitude, longitude, h3Index, status, socketId } }
let orders = {};   // { orderId: { id, pickupLat, pickupLng, dropoffLat, dropoffLng, h3Index, driverId, status, customerId } }

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Driver: go online with a role tag
    socket.on('driver:register', () => {
        drivers[socket.id] = {
            ...(drivers[socket.id] || {}),
            socketId: socket.id,
            status: 'AVAILABLE',
        };
        console.log('Driver registered:', socket.id);
    });

    // Driver: send GPS update
    socket.on('driver:update-location', (data) => {
        const { latitude, longitude } = data;
        const h3Index = latLngToCell(latitude, longitude, RESOLUTION);

        drivers[socket.id] = {
            ...( drivers[socket.id] || {}),
            socketId: socket.id,
            latitude,
            longitude,
            h3Index,
            status: drivers[socket.id]?.status || 'AVAILABLE',
        };

        io.emit('drivers:update', drivers);
    });

    // Driver: accept an assigned order
    socket.on('order:accept', (data) => {
        const { orderId } = data;
        const order = orders[orderId];
        if (!order) return;

        order.status = 'ACCEPTED';
        clearTimeout(order._timeout);

        io.emit('order:status-update', { orderId, status: 'ACCEPTED', driverId: socket.id });
        console.log(`Order ${orderId} accepted by driver ${socket.id}`);
    });

    // Driver: reject an assigned order
    socket.on('order:reject', (data) => {
        const { orderId } = data;
        const order = orders[orderId];
        if (!order) return;

        clearTimeout(order._timeout);
        order.driverId = null;
        order.status = 'REQUESTED';

        // Try to find next nearest driver
        assignDriverToOrder(orderId, [socket.id]);
    });

    // Driver: mark order as picked up
    socket.on('order:picked-up', (data) => {
        const { orderId } = data;
        if (!orders[orderId]) return;
        orders[orderId].status = 'PICKED_UP';
        io.emit('order:status-update', { orderId, status: 'PICKED_UP' });
    });

    // Driver: mark order as completed
    socket.on('order:completed', (data) => {
        const { orderId } = data;
        if (!orders[orderId]) return;
        orders[orderId].status = 'COMPLETED';
        if (drivers[socket.id]) {
            drivers[socket.id].status = 'AVAILABLE';
            drivers[socket.id].currentOrderId = null;
        }
        io.emit('order:status-update', { orderId, status: 'COMPLETED' });
    });

    socket.on('disconnect', () => {
        delete drivers[socket.id];
        io.emit('drivers:update', drivers);
        console.log('Client disconnected:', socket.id);
    });
});

// ── Order Assignment Logic ────────────────────────────────────────────────────

function assignDriverToOrder(orderId, excludeIds = []) {
    const order = orders[orderId];
    if (!order) return;

    const nearbyCells = gridDisk(order.h3Index, 3);

    const candidates = Object.values(drivers)
        .filter(d =>
            d.status === 'AVAILABLE' &&
            nearbyCells.includes(d.h3Index) &&
            !excludeIds.includes(d.socketId)
        );

    if (candidates.length === 0) {
        console.log(`No available drivers for order ${orderId}`);
        io.emit('order:status-update', { orderId, status: 'NO_DRIVERS' });
        return;
    }

    // Pick closest (smallest gridDisk ring contains candidate)
    const driver = candidates[0];

    order.driverId = driver.socketId;
    order.status = 'ASSIGNED';
    drivers[driver.socketId].status = 'BUSY';
    drivers[driver.socketId].currentOrderId = orderId;

    // Emit to the specific driver
    io.to(driver.socketId).emit('order:assigned', order);

    // Notify customer
    if (order.customerId) {
        io.to(order.customerId).emit('order:status-update', {
            orderId,
            status: 'ASSIGNED',
            driverId: driver.socketId,
            driver: {
                socketId: driver.socketId,
                latitude: driver.latitude,
                longitude: driver.longitude,
            },
        });
    }

    // Auto-expire if driver doesn't respond in 10s
    order._timeout = setTimeout(() => {
        if (orders[orderId]?.status === 'ASSIGNED') {
            assignDriverToOrder(orderId, [...excludeIds, driver.socketId]);
        }
    }, 10000);

    io.emit('drivers:update', drivers);
    console.log(`Order ${orderId} assigned to driver ${driver.socketId}`);
}

// ── REST Endpoints ─────────────────────────────────────────────────────────────

// Create order
app.post('/order', (req, res) => {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, customerId } = req.body;

    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = `order_${Date.now()}`;
    const h3Index = latLngToCell(parseFloat(pickupLat), parseFloat(pickupLng), RESOLUTION);

    orders[orderId] = {
        id: orderId,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        dropoffLat: parseFloat(dropoffLat),
        dropoffLng: parseFloat(dropoffLng),
        h3Index,
        driverId: null,
        customerId: customerId || null,
        status: 'REQUESTED',
    };

    res.json({ orderId, status: 'REQUESTED', h3Index });

    // Kick off driver assignment
    assignDriverToOrder(orderId);
});

// Get all orders
app.get('/orders', (req, res) => {
    res.json(Object.values(orders));
});

// Get nearby drivers (debug)
app.get('/nearby', (req, res) => {
    const sampleOrderH3 = Object.values(drivers)[0]?.h3Index;
    if (!sampleOrderH3) return res.json([]);
    const nearby = Object.values(drivers)
        .filter(d => gridDisk(sampleOrderH3, 2).includes(d.h3Index));
    res.json(nearby);
});

server.listen(3001, () => {
    console.log('HexTrack server running on port 3001');
});
