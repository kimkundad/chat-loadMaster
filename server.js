const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // เพื่อรองรับ JSON ใน Body ของ POST Request

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// รองรับ POST จาก Laravel order
app.post("/", (req, res) => {
    const event = req.body.event;
    const data = req.body.order;

    // ส่ง Event ไปยัง Client ผ่าน Socket.IO
    io.emit(event, data);

    console.log(`Event "${event}" emitted with data:`, data);
    res.status(200).send({ success: true });
});

// รองรับ POST จาก Laravel chat
app.post("/msg", (req, res) => {
    const event = req.body.event;
    const roomId = parseInt(req.body.room_id, 10); // ระบุห้องที่จะส่งข้อความ
    const data = req.body.data;

    // ส่ง Event ไปยัง Client ผ่าน Socket.IO
    io.to(roomId).emit(event, data);

    console.log(`Chat Event "${event}" emitted to room "${roomId}" with data:`, data);
    res.status(200).send({ success: true });
});

// การตั้งค่า Socket.IO
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ฟัง Event การเข้าร่วมห้อง
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
        console.log("Current rooms:", socket.adapter.rooms);
    });

    // ฟัง Event การออกจากห้อง
    socket.on("leave-room", (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room: ${roomId}`);
    });

    // ฟังข้อความจาก Client (ถ้าจำเป็น)
    socket.on("send-message", (data) => {
        const { roomId, message } = data;
        io.to(roomId).emit("new-message", message); // ส่งข้อความใหม่ไปยังห้อง
        console.log(`Message sent to room ${roomId}:`, message);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
