const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const {gridDisk} = require("h3-js")

const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// In memoru driver store

let drivers = {};

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    socket.on("driver:update-location", (data) => {
        const { latitude, longitude } = data;

        const h3Index = latLngToCell(latitude, longitude, RESOLUTION);

        drivers[socket.id] = {
            latitude,
            longitude,
            h3Index, // ✅ computed here
        };

        io.emit("drivers:update", drivers);
    });

    socket.on("disconnect", () => {
        delete drivers[socket.id];
        io.emit("drivers:update", drivers);
    });
})

function findNearbyDrivers(orderH3, radius = 2) {
    const nearbyCells = gridDisk(orderH3, radius);


    return Object.entries(drivers)
        .filter(([_, driver]) => nearbyCells.includes(driver.h3Index))
        .map(([id, driver]) => ({
            id,
            ...driver,
        }));

}


server.listen(3001, () => {
    console.log("Server is running on port 3001");
})

app.get("/nearby", (req, res) => {
    const sampleOrderH3 = Object.values(drivers)[0]?.h3Index;

    if (!sampleOrderH3) {
        return res.json([]);
    }

    const nearby = findNearbyDrivers(sampleOrderH3, 2);

    res.json(nearby);
});