import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create express app and http server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
    cors: { origin: "*" }
});

// Store online users and active calls
export const userSocketMap = {}; // {userId: socketId}
export const activeCalls = new Map(); // Store active call sessions

// Video Call Handler Module
class VideoCallHandler {
    constructor(io, userSocketMap) {
        this.io = io;
        this.userSocketMap = userSocketMap;
        this.activeCalls = new Map();
    }

    // Handle incoming call
    handleCallUser(socket, { from, to, offer }) {
        console.log(`📞 Call initiated from ${from} to ${to}`);
        
        const toSocketId = this.userSocketMap[to];
        if (!toSocketId) {
            socket.emit("callError", { message: "User is not online" });
            return;
        }

        // Store call session
        const callId = `${from}-${to}`;
        this.activeCalls.set(callId, {
            caller: from,
            callee: to,
            callerSocketId: socket.id,
            calleeSocketId: toSocketId,
            status: 'ringing',
            offer: offer
        });

        // Emit incoming call to the target user
        this.io.to(toSocketId).emit("incomingCall", {
            from,
            offer,
            callId
        });

        console.log(`📞 Call sent to ${to}, waiting for response...`);
    }

    // Handle call answer
    handleAnswerCall(socket, { to, answer, callId }) {
        console.log(`✅ Call answered by ${socket.userId} to ${to}`);
        
        const callSession = this.activeCalls.get(callId);
        if (!callSession) {
            socket.emit("callError", { message: "Call session not found" });
            return;
        }

        // Update call status
        callSession.status = 'active';
        callSession.answer = answer;

        // Send answer back to caller
        this.io.to(callSession.callerSocketId).emit("callAccepted", {
            answer,
            callId
        });

        console.log(`✅ Call established between ${callSession.caller} and ${callSession.callee}`);
    }

    // Handle call decline
    handleDeclineCall(socket, { to, callId }) {
        console.log(`❌ Call declined by ${socket.userId}`);
        
        const callSession = this.activeCalls.get(callId);
        if (!callSession) return;

        // Notify caller about decline
        this.io.to(callSession.callerSocketId).emit("callDeclined", { callId });

        // Remove call session
        this.activeCalls.delete(callId);
        console.log(`❌ Call session ${callId} removed`);
    }

    // Handle call end
    handleEndCall(socket, { to, callId }) {
        console.log(`📴 Call ended by ${socket.userId}`);
        
        const callSession = this.activeCalls.get(callId);
        if (!callSession) return;

        // Notify both parties
        this.io.to(callSession.callerSocketId).emit("callEnded", { callId });
        this.io.to(callSession.calleeSocketId).emit("callEnded", { callId });

        // Remove call session
        this.activeCalls.delete(callId);
        console.log(`📴 Call session ${callId} ended and removed`);
    }

    // Handle ICE candidates
    handleIceCandidate(socket, { to, candidate, callId }) {
        console.log(`🧊 ICE candidate from ${socket.userId} to ${to}`);
        
        const toSocketId = this.userSocketMap[to];
        if (toSocketId) {
            this.io.to(toSocketId).emit("iceCandidate", {
                candidate,
                from: socket.userId,
                callId
            });
        }
    }

    // Clean up user's active calls on disconnect
    cleanupUserCalls(userId) {
        const callsToRemove = [];
        
        for (const [callId, callSession] of this.activeCalls.entries()) {
            if (callSession.caller === userId || callSession.callee === userId) {
                callsToRemove.push(callId);
                
                // Notify the other party
                const otherSocketId = callSession.caller === userId 
                    ? callSession.calleeSocketId 
                    : callSession.callerSocketId;
                
                this.io.to(otherSocketId).emit("callEnded", { 
                    callId, 
                    reason: "User disconnected" 
                });
            }
        }

        // Remove all calls involving this user
        callsToRemove.forEach(callId => this.activeCalls.delete(callId));
        
        if (callsToRemove.length > 0) {
            console.log(`🧹 Cleaned up ${callsToRemove.length} calls for user ${userId}`);
        }
    }
}

// Initialize video call handler
const videoCallHandler = new VideoCallHandler(io, userSocketMap);

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("👋 User connected:", userId);

    // Store user socket mapping
    if (userId) {
        userSocketMap[userId] = socket.id;
        socket.userId = userId; // Store userId in socket for easy access
    }

    // Emit online users to all connected clients
    setTimeout(() => {
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }, 100);

    // Video call event handlers
    socket.on("callUser", (data) => {
        videoCallHandler.handleCallUser(socket, data);
    });

    socket.on("answerCall", (data) => {
        videoCallHandler.handleAnswerCall(socket, data);
    });

    socket.on("declineCall", (data) => {
        videoCallHandler.handleDeclineCall(socket, data);
    });

    socket.on("endCall", (data) => {
        videoCallHandler.handleEndCall(socket, data);
    });

    socket.on("iceCandidate", (data) => {
        videoCallHandler.handleIceCandidate(socket, data);
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log("👋 User disconnected:", userId);
        
        // Clean up user's calls
        if (userId) {
            videoCallHandler.cleanupUserCalls(userId);
            delete userSocketMap[userId];
        }
        
        // Emit updated online users
        setTimeout(() => {
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }, 100);
    });
});

// Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB
await connectDB();

if(process.env.NODE_ENV !=="production"){const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("🚀 Server is running on PORT:", PORT));
}
// for the vercel
export default server;